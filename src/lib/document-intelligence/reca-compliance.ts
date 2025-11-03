/**
 * RECA Compliance Checker
 * Validates claim completeness and eligibility for RECA claims
 */

import { EntityExtractionResult } from "./schemas/entity-schema";
import {
  RECAComplianceResult,
  MissingRequirement,
  DateSanityCheck,
  JurisdictionMatch,
  NameConsistencyCheck,
  EligibilityFlag,
  DocumentQualification,
  DocumentDjApprovalImpact,
  DocumentUserAction,
  DocumentQualificationStatus,
} from "./schemas/compliance-schema";
import {
  ClaimType,
  calculateCompleteness,
  getMissingRequirements,
  checkDocumentQualification,
} from "./schemas/reca-requirements";
import {
  isCoveredCounty,
  isCoveredDisease,
  isInExposurePeriod,
  DOWNWINDER_COUNTIES,
} from "./utils/covered-counties";
import { FileCategory } from "./ai-categorization";

interface Document {
  id: string;
  category: FileCategory | null;
  ocrText: string | null;
  metadata?: string | null;
}

/**
 * Check RECA compliance for a set of documents
 */
export async function checkRECACompliance(
  entities: EntityExtractionResult,
  allDocuments: Document[],
  _ocrText: string,
  currentDocumentCategory?: FileCategory | null,
  context?: {
    userSelectedCategory?: FileCategory | null;
    aiCategorizationResult?: {
      category: FileCategory;
      confidence: number;
      reasoning: string;
    };
    heuristicReason?: string;
    heuristicSignals?: string[];
    autoCorrected?: boolean;
    categoryLocked?: boolean;
  }
): Promise<RECAComplianceResult> {
  // Step 1: Determine claim type
  const { claimType, confidence, reasoning } = detectClaimType(
    entities,
    allDocuments
  );

  // Step 2: Get available document categories
  const availableCategories = allDocuments
    .map((doc) => doc.category)
    .filter((cat): cat is FileCategory => cat !== null);

  // Step 3: Calculate completeness
  const checklistCoverage = calculateCompleteness(
    claimType,
    availableCategories
  );

  // Step 4: Get missing requirements
  const missingReqs = getMissingRequirements(claimType, availableCategories);
  const missingRequirements: MissingRequirement[] = missingReqs.map((req) => ({
    item: req.name,
    category: req.category,
    priority: req.priority,
    suggestion: generateSuggestion(req.category, claimType),
  }));

  // Step 5: Check if current document qualifies as a required document
  const documentQualification = checkCurrentDocumentQualification(
    currentDocumentCategory,
    claimType,
    entities,
    {
      userSelectedCategory: context?.userSelectedCategory,
      aiCategorizationResult: context?.aiCategorizationResult,
      heuristicReason: context?.heuristicReason,
      heuristicSignals: context?.heuristicSignals,
      autoCorrected: context?.autoCorrected,
      categoryLocked: context?.categoryLocked,
    }
  );

  // Step 6: Date sanity checks
  const dateSanity = performDateSanityChecks(entities);

  // Step 7: Jurisdiction check (for downwinders)
  const jurisdictionMatch = checkJurisdiction(entities, claimType);

  // Step 8: Name consistency check
  const nameConsistency = checkNameConsistency(entities);

  // Step 9: Eligibility flags
  const eligibilityFlags = checkEligibility(entities, claimType);

  // Step 10: Disease match check
  const diseaseMatch = checkDiseaseMatch(entities);

  return {
    claimTypeSuspected: claimType,
    claimTypeConfidence: confidence,
    claimTypeReasoning: reasoning,
    checklistCoverage,
    documentQualification,
    missingRequirements,
    dateSanity,
    jurisdictionMatch,
    nameConsistency,
    eligibilityFlags,
    diseaseMatch,
  };
}

/**
 * Detect the most likely claim type based on entities and documents
 */
function detectClaimType(
  entities: EntityExtractionResult,
  documents: Document[]
): { claimType: ClaimType; confidence: number; reasoning: string } {
  let downwinderScore = 0;
  let onsiteScore = 0;
  let uraniumScore = 0;

  // Check for residence in covered counties
  const hasDownwinderAddress = entities.addresses.some((addr) =>
    addr.county ? isCoveredCounty(addr.county, addr.state || "") : false
  );
  if (hasDownwinderAddress) downwinderScore += 3;

  // Check for nuclear facility employment
  const hasNuclearEmployment = entities.employment.some(
    (emp) => emp.nuclear_facility
  );
  if (hasNuclearEmployment) {
    const employer =
      entities.employment
        .find((e) => e.nuclear_facility)
        ?.employer.toLowerCase() || "";
    if (
      employer.includes("nevada test site") ||
      employer.includes("proving ground")
    ) {
      onsiteScore += 4;
    } else if (
      employer.includes("uranium") ||
      employer.includes("mine") ||
      employer.includes("mill")
    ) {
      uraniumScore += 4;
    }
  }

  // Check employment records
  const hasEmploymentDocs = documents.some(
    (doc) => doc.category === "EMPLOYMENT_RECORDS"
  );
  if (hasEmploymentDocs) {
    onsiteScore += 1;
    uraniumScore += 1;
  }

  // Check for residence proof documents
  const hasResidenceProof = documents.some(
    (doc) =>
      doc.category === "PROOF_OF_RESIDENCE" ||
      doc.category === "UTILITY_BILL" ||
      doc.category === "MORTGAGE_STATEMENT"
  );
  if (hasResidenceProof) downwinderScore += 2;

  // Check exposure dates
  const exposureDates = entities.dates.filter(
    (d) => d.label === "exposure_start" || d.label === "exposure_end"
  );
  for (const dateEntity of exposureDates) {
    try {
      const date = new Date(dateEntity.value);
      if (isInExposurePeriod(date, "downwinder")) downwinderScore += 2;
      if (isInExposurePeriod(date, "onsite")) onsiteScore += 2;
      if (isInExposurePeriod(date, "uranium")) uraniumScore += 2;
    } catch (e) {
      // Invalid date, skip
    }
  }

  // Determine claim type
  const maxScore = Math.max(downwinderScore, onsiteScore, uraniumScore);
  const totalScore = downwinderScore + onsiteScore + uraniumScore;

  let claimType: ClaimType = "downwinder"; // Default
  let confidence = 0.5; // Default confidence

  if (maxScore > 0 && totalScore > 0) {
    confidence = maxScore / (totalScore || 1);
    confidence = Math.min(confidence, 0.95); // Cap at 95%

    if (downwinderScore === maxScore) {
      claimType = "downwinder";
    } else if (onsiteScore === maxScore) {
      claimType = "onsite";
    } else {
      claimType = "uranium";
    }
  }

  const reasoning = buildClaimTypeReasoning(
    claimType,
    entities,
    hasDownwinderAddress,
    hasNuclearEmployment
  );

  return { claimType, confidence, reasoning };
}

/**
 * Build reasoning for claim type detection
 */
function buildClaimTypeReasoning(
  claimType: ClaimType,
  entities: EntityExtractionResult,
  hasDownwinderAddress: boolean,
  hasNuclearEmployment: boolean
): string {
  const reasons: string[] = [];

  if (claimType === "downwinder") {
    if (hasDownwinderAddress) {
      const addr = entities.addresses.find(
        (a) => a.county && isCoveredCounty(a.county, a.state || "")
      );
      reasons.push(
        `Residence in covered county (${addr?.county}, ${addr?.state})`
      );
    }
    if (
      entities.dates.some(
        (d) => d.label === "exposure_start" || d.label === "exposure_end"
      )
    ) {
      reasons.push(
        "Exposure period dates found during atmospheric testing era"
      );
    }
    if (reasons.length === 0) {
      reasons.push("Default to downwinder based on document types");
    }
  }

  if (claimType === "onsite") {
    if (hasNuclearEmployment) {
      const emp = entities.employment.find((e) => e.nuclear_facility);
      reasons.push(`Employment at nuclear facility (${emp?.employer})`);
    }
    if (reasons.length === 0) {
      reasons.push("Employment records suggest onsite participant claim");
    }
  }

  if (claimType === "uranium") {
    if (hasNuclearEmployment) {
      const emp = entities.employment.find((e) => e.nuclear_facility);
      if (emp?.employer.toLowerCase().includes("uranium")) {
        reasons.push(`Employment at uranium facility (${emp.employer})`);
      }
    }
    if (reasons.length === 0) {
      reasons.push("Employment records suggest uranium worker claim");
    }
  }

  return reasons.join(". ");
}

/**
 * Perform date sanity checks
 */
function performDateSanityChecks(
  entities: EntityExtractionResult
): DateSanityCheck[] {
  const checks: DateSanityCheck[] = [];

  // Find birth date
  const birthDate = entities.dates.find((d) => d.label === "birth_date");
  if (!birthDate) {
    checks.push({
      issue: "No birth date found",
      severity: "high",
      details:
        "Birth date is required to establish identity and age during exposure period",
    });
    return checks;
  }

  const birth = new Date(birthDate.value);

  // Check exposure dates against birth date
  const exposureStart = entities.dates.find(
    (d) => d.label === "exposure_start"
  );
  const exposureEnd = entities.dates.find((d) => d.label === "exposure_end");

  if (exposureStart) {
    const expStart = new Date(exposureStart.value);
    if (expStart < birth) {
      checks.push({
        issue: "Exposure start date before birth date",
        severity: "high",
        details: `Exposure period (${exposureStart.value}) begins before claimant's birth (${birthDate.value})`,
        dates: [
          { label: "Birth Date", value: birthDate.value },
          { label: "Exposure Start", value: exposureStart.value },
        ],
      });
    }
  }

  // Check diagnosis date
  const diagnosisDate = entities.dates.find(
    (d) => d.label === "diagnosis_date"
  );
  if (diagnosisDate) {
    const diagnosis = new Date(diagnosisDate.value);
    if (diagnosis < birth) {
      checks.push({
        issue: "Diagnosis date before birth date",
        severity: "high",
        details: `Diagnosis date (${diagnosisDate.value}) is before birth date (${birthDate.value})`,
      });
    }

    if (exposureEnd) {
      const expEnd = new Date(exposureEnd.value);
      if (diagnosis < expEnd) {
        checks.push({
          issue: "Diagnosis during exposure period",
          severity: "medium",
          details: `Diagnosis (${diagnosisDate.value}) occurred before end of exposure period (${exposureEnd.value}). Verify dates.`,
        });
      }
    }
  }

  return checks;
}

/**
 * Check jurisdiction (for downwinders)
 */
function checkJurisdiction(
  entities: EntityExtractionResult,
  claimType: ClaimType
): JurisdictionMatch {
  if (claimType !== "downwinder") {
    return {
      inCoveredCounties: true, // Not applicable for non-downwinder claims
      confidence: 1.0,
    };
  }

  const residenceAddresses = entities.addresses.filter(
    (addr) => addr.label === "residence"
  );

  if (residenceAddresses.length === 0) {
    return {
      inCoveredCounties: false,
      confidence: 0.3,
      issues: ["No residence addresses found in documents"],
    };
  }

  const coveredAddresses = residenceAddresses.filter((addr) =>
    addr.county ? isCoveredCounty(addr.county, addr.state || "") : false
  );

  if (coveredAddresses.length > 0) {
    const addr = coveredAddresses[0];
    if (!addr) {
      return {
        inCoveredCounties: false,
        confidence: 0.3,
        issues: ["No valid address found"],
      };
    }
    return {
      county: addr.county || undefined,
      state: addr.state || undefined,
      inCoveredCounties: true,
      confidence: addr.confidence,
      affectedCounties: DOWNWINDER_COUNTIES.filter(
        (c) => c.state === addr.state
      ).map((c) => c.county),
    };
  }

  const firstAddr = residenceAddresses[0];
  return {
    county: firstAddr?.county || undefined,
    state: firstAddr?.state || undefined,
    inCoveredCounties: false,
    confidence: 0.8,
    issues: [
      "Residence not in covered county. Downwinder claim may not be eligible.",
    ],
  };
}

/**
 * Check name consistency across documents
 */
function checkNameConsistency(
  entities: EntityExtractionResult
): NameConsistencyCheck[] {
  const checks: NameConsistencyCheck[] = [];

  const claimants = entities.persons.filter((p) => p.role === "claimant");

  if (claimants.length === 0) {
    checks.push({
      issue: "No claimant name found",
      status: "needs_confirmation",
      severity: "high",
      details: "Unable to identify claimant name in documents",
    });
    return checks;
  }

  if (claimants.length > 1) {
    const names = claimants.map((c) => c.name);
    const uniqueNames = Array.from(new Set(names));

    if (uniqueNames.length > 1) {
      checks.push({
        issue: `Multiple claimant names detected: ${uniqueNames.join(", ")}`,
        status: "needs_confirmation",
        severity: "medium",
        details:
          "Name appears differently across documents. Verify if these refer to the same person.",
      });
    }
  }

  return checks.length > 0
    ? checks
    : [{ issue: "Name consistency OK", status: "ok", severity: "low" }];
}

/**
 * Check eligibility requirements
 */
function checkEligibility(
  entities: EntityExtractionResult,
  claimType: ClaimType
): EligibilityFlag[] {
  const flags: EligibilityFlag[] = [];

  const birthDate = entities.dates.find((d) => d.label === "birth_date");
  const exposureStart = entities.dates.find(
    (d) => d.label === "exposure_start"
  );

  if (birthDate && exposureStart && claimType === "downwinder") {
    const birth = new Date(birthDate.value);
    const expStart = new Date(exposureStart.value);
    const ageAtExposure =
      (expStart.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (ageAtExposure >= 0) {
      flags.push({
        flag: "age_at_exposure",
        status: "meets_requirement",
        details: `Claimant was ${Math.floor(ageAtExposure)} years old at start of exposure period`,
        severity: "low",
      });
    }
  }

  // Check if diagnosis is present
  const hasDiagnosis = entities.medical.some((m) => m.diagnosis);
  if (!hasDiagnosis) {
    flags.push({
      flag: "medical_diagnosis",
      status: "unclear",
      details: "No clear medical diagnosis found in documents",
      severity: "high",
    });
  }

  return flags;
}

/**
 * Check if diagnosed disease is covered by RECA
 */
function checkDiseaseMatch(entities: EntityExtractionResult): {
  diagnosisFound: boolean;
  isCoveredDisease: boolean;
  diagnosisName?: string;
  confidence: number;
} {
  const medicalRecords = entities.medical.filter((m) => m.diagnosis);

  if (medicalRecords.length === 0) {
    return {
      diagnosisFound: false,
      isCoveredDisease: false,
      confidence: 0,
    };
  }

  const firstRecord = medicalRecords[0];
  if (!firstRecord) {
    return {
      diagnosisFound: false,
      isCoveredDisease: false,
      confidence: 0,
    };
  }

  const diagnosis = firstRecord.diagnosis;
  if (!diagnosis) {
    return {
      diagnosisFound: false,
      isCoveredDisease: false,
      confidence: 0,
    };
  }

  const isCovered = isCoveredDisease(diagnosis);

  return {
    diagnosisFound: true,
    isCoveredDisease: isCovered,
    diagnosisName: diagnosis,
    confidence: firstRecord.confidence ?? 0,
  };
}

/**
 * Generate suggestion for missing document
 */
function generateSuggestion(
  category: FileCategory,
  claimType: ClaimType
): string {
  const suggestions: Record<FileCategory, string> = {
    IDENTITY:
      "Upload a birth certificate, death certificate, or other government-issued proof of birth/death",
    PROOF_OF_RESIDENCE: `Upload documents showing residence in affected county during exposure period (${claimType === "downwinder" ? "1951-1958 or 1962" : "during relevant period"})`,
    MEDICAL_RECORDS:
      "Upload medical records documenting your diagnosis of a covered disease",
    PATHOLOGY_REPORT:
      "Upload pathology or biopsy reports confirming the cancer diagnosis",
    EMPLOYMENT_RECORDS: `Upload employment records showing work at ${claimType === "onsite" ? "Nevada Test Site or Pacific Proving Grounds" : "uranium mine, mill, or ore transport facility"}`,
    UTILITY_BILL:
      "Upload utility bills (electric, gas, water, phone) showing your address during the exposure period",
    MORTGAGE_STATEMENT:
      "Upload mortgage statements, property deeds, or property tax bills",
    TAX_RETURN: "Upload federal or state tax returns from the exposure period",
    SCHOOL_RECORDS:
      "Upload school enrollment records, transcripts, or report cards",
    DISCHARGE_SUMMARY: "Upload hospital discharge summaries",
    TUMOR_REGISTRY: "Upload state or hospital tumor registry records",
    TREATMENT_RECORDS:
      "Upload cancer treatment records, including radiation or chemotherapy records",
    OTHER: "Upload any supporting documentation for your claim",
  };

  return suggestions[category] || "Upload supporting documentation";
}

/**
 * Check if the current document qualifies as a required document for the claim
 */
function checkCurrentDocumentQualification(
  finalDocumentCategory: FileCategory | null | undefined,
  claimType: ClaimType,
  entities: EntityExtractionResult,
  options: {
    userSelectedCategory?: FileCategory | null;
    aiCategorizationResult?: {
      category: FileCategory;
      confidence: number;
      reasoning: string;
    };
    heuristicReason?: string;
    heuristicSignals?: string[];
    autoCorrected?: boolean;
    categoryLocked?: boolean;
  } = {}
): DocumentQualification {
  const userSelectedCategory = options.userSelectedCategory ?? null;
  const aiCategorizationResult = options.aiCategorizationResult;
  const heuristicReason = options.heuristicReason;
  const heuristicSignals = options.heuristicSignals;
  const autoCorrected = options.autoCorrected ?? false;
  const categoryLocked = options.categoryLocked ?? false;

  let effectiveCategory = finalDocumentCategory ?? null;

  if (!effectiveCategory && aiCategorizationResult) {
    effectiveCategory = aiCategorizationResult.category;
  }

  if (!effectiveCategory && userSelectedCategory) {
    effectiveCategory = userSelectedCategory;
  }

  if (!effectiveCategory) {
    return buildQualificationResponse({
      status: "UNKNOWN",
      confidence: 0,
      reason:
        "Document category could not be determined. The AI was unable to categorize this document.",
      issues: [
        "Document type is unclear or not recognized",
        "Manual review recommended",
      ],
    });
  }

  let categoryMismatch: DocumentQualification["categoryMismatch"] | undefined;

  if (userSelectedCategory && userSelectedCategory !== effectiveCategory) {
    const aiConfidence =
      aiCategorizationResult?.category === effectiveCategory
        ? aiCategorizationResult.confidence
        : autoCorrected
          ? 0.9
          : 0.85;
    const shouldUseAiCategory = !categoryLocked || autoCorrected;
    const reasoningSnippet = aiCategorizationResult?.reasoning
      ? ` because ${aiCategorizationResult.reasoning}`
      : "";
    const heuristicSnippet = heuristicReason ? ` ${heuristicReason}` : "";

    categoryMismatch = {
      userSelected: userSelectedCategory,
      aiDetected: effectiveCategory,
      aiConfidence,
      shouldUseAiCategory,
      explanation: categoryLocked
        ? `Category locked as "${formatCategoryName(effectiveCategory)}". ${heuristicSnippet ? heuristicSnippet : ""}`
        : `AI switched this from "${formatCategoryName(userSelectedCategory)}" to "${formatCategoryName(effectiveCategory)}"${aiCategorizationResult ? ` with ${Math.round((aiCategorizationResult.confidence ?? 0) * 100)}% confidence${reasoningSnippet}` : ""}.${heuristicSnippet ? ` ${heuristicSnippet}` : ""} Please verify the category and recategorize if necessary.`,
    };
  } else if (
    userSelectedCategory &&
    aiCategorizationResult &&
    aiCategorizationResult.category !== userSelectedCategory
  ) {
    const aiConfidence = aiCategorizationResult.confidence;
    const shouldUseAiCategory = aiConfidence >= 0.75 && !categoryLocked;

    if (shouldUseAiCategory) {
      effectiveCategory = aiCategorizationResult.category;
    }

    categoryMismatch = {
      userSelected: userSelectedCategory,
      aiDetected: aiCategorizationResult.category,
      aiConfidence,
      shouldUseAiCategory,
      explanation: shouldUseAiCategory
        ? `AI detected this as "${formatCategoryName(aiCategorizationResult.category)}" with ${Math.round(aiConfidence * 100)}% confidence${aiCategorizationResult.reasoning ? ` because ${aiCategorizationResult.reasoning}` : ""}. Review and update the category if that looks correct.`
        : `AI suggested "${formatCategoryName(aiCategorizationResult.category)}" (${Math.round(aiConfidence * 100)}% confidence). Double-check that your selection is correct.`,
    };
  }

  const aiReasoningIssue = aiCategorizationResult?.reasoning
    ? `AI reasoning: ${aiCategorizationResult.reasoning}`
    : undefined;

  const qualificationCheck = checkDocumentQualification(
    effectiveCategory,
    claimType
  );

  if (!qualificationCheck.qualifies) {
    const status: DocumentQualificationStatus =
      effectiveCategory === "OTHER" ? "SUPPORTING" : "DOES_NOT_QUALIFY";

    const issues =
      status === "SUPPORTING"
        ? [
            "Does not match any required document type. Treat as optional supporting evidence until categorized.",
          ]
        : [
            "This document type is not part of the required documentation checklist",
            "Consider uploading required documents instead",
          ];

    if (aiReasoningIssue) {
      issues.push(aiReasoningIssue);
    }
    if (heuristicReason) {
      issues.push(heuristicReason);
    }
    if (heuristicSignals?.length) {
      issues.push(
        `Heuristic signals detected: ${heuristicSignals.slice(0, 5).join(", ")}`
      );
    }

    const isOtherCategory = effectiveCategory === "OTHER";

    const suggestionOverride = isOtherCategory
      ? aiCategorizationResult?.reasoning
        ? `AI moved this to "${formatCategoryName(effectiveCategory)}" because ${aiCategorizationResult.reasoning}. Recategorize it if this is actually a required document (e.g., medical evidence).`
        : "This now sits in the Other bucket. Recategorize it if it should satisfy a DOJ requirement, or keep it only as supporting context."
      : status === "SUPPORTING"
        ? "Keep this as supporting context or recategorize it if the AI guessed incorrectly."
        : "Recategorize this upload to the correct document type or replace it with a required document.";

    const userActionOverride: DocumentUserAction = isOtherCategory
      ? "RECATEGORIZE"
      : status === "SUPPORTING"
        ? categoryMismatch
          ? "VERIFY_CATEGORY"
          : "NONE"
        : "RECATEGORIZE";

    return buildQualificationResponse({
      status,
      confidence: 0.85,
      reason:
        status === "SUPPORTING"
          ? `This document (${formatCategoryName(effectiveCategory)}) doesn't satisfy a DOJ requirement but may provide helpful background information.`
          : `This document (${formatCategoryName(effectiveCategory)}) is not a required document type for ${claimType} claims.`,
      issues,
      categoryMismatch,
      suggestionOverride,
      userActionOverride,
      impactOverride: status === "SUPPORTING" ? "NEUTRAL" : "HARMFUL",
    });
  }

  const issues: string[] = aiReasoningIssue ? [aiReasoningIssue] : [];
  if (heuristicReason) {
    issues.push(heuristicReason);
  }
  if (heuristicSignals?.length) {
    issues.push(
      `Heuristic signals detected: ${heuristicSignals.slice(0, 5).join(", ")}`
    );
  }
  let confidence = 0.9;
  let status: DocumentQualificationStatus = "QUALIFIES";
  let reason = qualificationCheck.isAlternative
    ? `This ${formatCategoryName(effectiveCategory)} qualifies as an acceptable alternative for "${qualificationCheck.matchedRequirement!.name}".`
    : `This ${formatCategoryName(effectiveCategory)} qualifies as a required document for "${qualificationCheck.matchedRequirement!.name}".`;

  if (
    claimType === "downwinder" &&
    (effectiveCategory === "PROOF_OF_RESIDENCE" ||
      effectiveCategory === "UTILITY_BILL" ||
      effectiveCategory === "MORTGAGE_STATEMENT")
  ) {
    const hasValidAddress = entities.addresses.some(
      (addr) =>
        addr.county && addr.state && isCoveredCounty(addr.county, addr.state)
    );

    if (!hasValidAddress) {
      confidence = 0.6;
      issues.push(
        "No address found in covered county - document may not qualify"
      );
      status = "SUPPORTING";
      reason = `This ${formatCategoryName(effectiveCategory)} appears to qualify, but the address may not be in a covered county.`;
    }
  }

  if (
    effectiveCategory === "MEDICAL_RECORDS" ||
    effectiveCategory === "PATHOLOGY_REPORT" ||
    effectiveCategory === "DISCHARGE_SUMMARY" ||
    effectiveCategory === "TREATMENT_RECORDS" ||
    effectiveCategory === "TUMOR_REGISTRY"
  ) {
    const hasDiagnosis = entities.medical.some((m) => m.diagnosis);

    if (!hasDiagnosis) {
      confidence = 0.7;
      issues.push("No clear diagnosis found in medical document");
      status = "SUPPORTING";
      reason = `This ${formatCategoryName(effectiveCategory)} qualifies, but no clear medical diagnosis was found.`;
    }

    const diagnosis = entities.medical.find((m) => m.diagnosis)?.diagnosis;
    if (diagnosis && !isCoveredDisease(diagnosis)) {
      confidence = 0.5;
      issues.push(
        `Diagnosis "${diagnosis}" may not be a covered disease under RECA`
      );
      status = "SUPPORTING";
      reason = `This medical document may not qualify - the diagnosed condition may not be covered by RECA.`;
    }
  }

  return buildQualificationResponse({
    status,
    confidence,
    reason,
    matchedRequirement: qualificationCheck.matchedRequirement
      ? {
          category: qualificationCheck.matchedRequirement.category,
          name: qualificationCheck.matchedRequirement.name,
          priority: qualificationCheck.matchedRequirement.priority,
        }
      : undefined,
    issues,
    categoryMismatch,
  });
}

/**
 * Format category name for display
 */
function formatCategoryName(category: FileCategory): string {
  return category
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

interface QualificationResponseOptions {
  status: DocumentQualificationStatus;
  confidence: number;
  reason: string;
  matchedRequirement?: {
    category: string;
    name: string;
    priority: "high" | "medium" | "low";
  };
  issues?: string[];
  categoryMismatch?: DocumentQualification["categoryMismatch"];
  suggestionOverride?: string;
  userActionOverride?: DocumentUserAction;
  impactOverride?: DocumentDjApprovalImpact;
}

function buildQualificationResponse(
  options: QualificationResponseOptions
): DocumentQualification {
  const {
    status,
    confidence,
    reason,
    matchedRequirement,
    categoryMismatch,
    suggestionOverride,
    userActionOverride,
    impactOverride,
  } = options;

  const issues =
    options.issues && options.issues.length > 0
      ? options.issues.filter(Boolean)
      : undefined;

  const djApprovalImpact = impactOverride ?? getDefaultDjApprovalImpact(status);

  const userActionNeeded =
    userActionOverride ?? getDefaultUserAction(status, categoryMismatch);

  const suggestion =
    suggestionOverride ??
    getDefaultSuggestion(status, matchedRequirement, categoryMismatch, issues);

  return {
    status,
    confidence,
    reason,
    matchedRequirement,
    issues,
    categoryMismatch,
    djApprovalImpact,
    userActionNeeded,
    suggestion,
  };
}

function getDefaultDjApprovalImpact(
  status: DocumentQualificationStatus
): DocumentDjApprovalImpact {
  switch (status) {
    case "QUALIFIES":
      return "REQUIRED";
    case "SUPPORTING":
      return "HELPFUL";
    case "DOES_NOT_QUALIFY":
      return "HARMFUL";
    case "UNKNOWN":
    default:
      return "NEUTRAL";
  }
}

function getDefaultUserAction(
  status: DocumentQualificationStatus,
  categoryMismatch?: DocumentQualification["categoryMismatch"]
): DocumentUserAction {
  switch (status) {
    case "QUALIFIES":
      return categoryMismatch?.shouldUseAiCategory ? "VERIFY_CATEGORY" : "NONE";
    case "SUPPORTING":
      return categoryMismatch ? "VERIFY_CATEGORY" : "NONE";
    case "DOES_NOT_QUALIFY":
      return categoryMismatch ? "RECATEGORIZE" : "DELETE_OR_FIX";
    case "UNKNOWN":
    default:
      return "VERIFY_CATEGORY";
  }
}

function getDefaultSuggestion(
  status: DocumentQualificationStatus,
  matchedRequirement?: {
    name: string;
  },
  categoryMismatch?: DocumentQualification["categoryMismatch"],
  issues?: string[]
): string {
  if (status === "QUALIFIES") {
    if (categoryMismatch?.shouldUseAiCategory) {
      return `Review the AI suggestion (${formatCategoryName(categoryMismatch.aiDetected as FileCategory)}) and update the category if it looks correct.`;
    }

    if (matchedRequirement) {
      return `Keep this document. It satisfies the "${matchedRequirement.name}" requirement.`;
    }

    return "Keep this document. It counts toward your DOJ submission.";
  }

  if (status === "SUPPORTING") {
    if (categoryMismatch?.shouldUseAiCategory) {
      return `Double-check the category. The AI thinks this might be ${formatCategoryName(categoryMismatch.aiDetected as FileCategory)}.`;
    }

    return "Keep this as supporting evidence, but upload or verify required documents to increase claim readiness.";
  }

  if (status === "DOES_NOT_QUALIFY") {
    if (categoryMismatch) {
      return `Recategorize this file to ${formatCategoryName(categoryMismatch.aiDetected as FileCategory)} or delete it if it's not relevant.`;
    }

    return "Remove this upload or replace it with a required document so it doesn't inflate completeness.";
  }

  return issues?.length
    ? "AI found potential issues with this document. Review the feedback and update the category if needed."
    : "AI is still analyzing this upload. Check back soon or categorize it manually.";
}

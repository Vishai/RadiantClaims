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
} from "./schemas/compliance-schema";
import {
  ClaimType,
  getRequirements,
  calculateCompleteness,
  getMissingRequirements,
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
  ocrText: string
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

  // Step 5: Date sanity checks
  const dateSanity = performDateSanityChecks(entities);

  // Step 6: Jurisdiction check (for downwinders)
  const jurisdictionMatch = checkJurisdiction(entities, claimType);

  // Step 7: Name consistency check
  const nameConsistency = checkNameConsistency(entities);

  // Step 8: Eligibility flags
  const eligibilityFlags = checkEligibility(entities, claimType);

  // Step 9: Disease match check
  const diseaseMatch = checkDiseaseMatch(entities);

  return {
    claimTypeSuspected: claimType,
    claimTypeConfidence: confidence,
    claimTypeReasoning: reasoning,
    checklistCoverage,
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
  const scores = {
    downwinder: downwinderScore,
    onsite: onsiteScore,
    uranium: uraniumScore,
  };

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

  return {
    county: residenceAddresses[0].county || undefined,
    state: residenceAddresses[0].state || undefined,
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
    const uniqueNames = [...new Set(names)];

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

  const diagnosis = medicalRecords[0].diagnosis!;
  const isCovered = isCoveredDisease(diagnosis);

  return {
    diagnosisFound: true,
    isCoveredDisease: isCovered,
    diagnosisName: diagnosis,
    confidence: medicalRecords[0].confidence,
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

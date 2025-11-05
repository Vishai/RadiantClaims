/**
 * Risk Analysis for RECA Claims
 * Identifies issues that could cause claim denial
 */

import { EntityExtractionResult } from "./schemas/entity-schema";
import { RECAComplianceResult } from "./schemas/compliance-schema";
import { RiskFlag, RiskAnalysisResult } from "./schemas/risk-schema";

interface QualityMetrics {
  qualityScore: number;
  isBlurry: boolean;
  isLowContrast: boolean;
  recommendations?: string[];
}

interface RiskAnalysisOptions {
  qualityMetrics?: QualityMetrics;
  documentText?: string;
}

/**
 * Analyze risks that could cause claim denial
 */
export async function analyzeRisks(
  entities: EntityExtractionResult,
  compliance: RECAComplianceResult,
  options: RiskAnalysisOptions = {}
): Promise<RiskAnalysisResult> {
  const risks: RiskFlag[] = [];

  // 1. Compliance-related risks
  risks.push(...analyzeComplianceRisks(compliance));

  // 2. Document quality risks
  if (options.qualityMetrics) {
    risks.push(...analyzeQualityRisks(options.qualityMetrics));
  }

  // 3. Eligibility risks
  risks.push(...analyzeEligibilityRisks(entities, compliance));

  // 4. Consistency risks
  risks.push(...analyzeConsistencyRisks(entities, compliance));

  // 5. Content authenticity risks
  if (options.documentText) {
    risks.push(...analyzeContentRisks(options.documentText));
  }

  // Sort by severity (high -> medium -> low)
  const sortedRisks = risks.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // Calculate counts
  const highSeverityCount = risks.filter((r) => r.severity === "high").length;
  const mediumSeverityCount = risks.filter(
    (r) => r.severity === "medium"
  ).length;
  const lowSeverityCount = risks.filter((r) => r.severity === "low").length;

  // Calculate overall risk score (0-1)
  const overallRiskScore = calculateOverallRiskScore(risks);

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(risks, compliance);

  return {
    totalRisks: risks.length,
    highSeverityCount,
    mediumSeverityCount,
    lowSeverityCount,
    risks: sortedRisks,
    overallRiskScore,
    recommendedActions,
  };
}

/**
 * Analyze compliance-related risks
 */
function analyzeComplianceRisks(compliance: RECAComplianceResult): RiskFlag[] {
  const risks: RiskFlag[] = [];

  // Missing high-priority requirements
  const highPriorityMissing = compliance.missingRequirements.filter(
    (req) => req.priority === "high"
  );

  if (highPriorityMissing.length > 0) {
    risks.push({
      flag: "missing_critical_documents",
      severity: "high",
      category: "compliance",
      message: `${highPriorityMissing.length} critical document${highPriorityMissing.length > 1 ? "s" : ""} missing`,
      actionRequired: `Upload the following: ${highPriorityMissing.map((r) => r.item).join(", ")}`,
      details: `These documents are required for claim submission and approval`,
    });
  }

  // Low completeness
  if (compliance.checklistCoverage < 0.5) {
    risks.push({
      flag: "incomplete_claim",
      severity: "high",
      category: "compliance",
      message: `Claim is only ${(compliance.checklistCoverage * 100).toFixed(0)}% complete`,
      actionRequired:
        "Upload additional required documents to meet minimum requirements",
      details: `Claims below 50% complete are typically rejected`,
    });
  } else if (compliance.checklistCoverage < 0.8) {
    risks.push({
      flag: "partially_complete_claim",
      severity: "medium",
      category: "compliance",
      message: `Claim is ${(compliance.checklistCoverage * 100).toFixed(0)}% complete`,
      actionRequired: "Upload remaining documents to improve approval chances",
      details: `Claims 80%+ complete have significantly higher approval rates`,
    });
  }

  // Jurisdiction issues (for downwinders)
  if (
    compliance.claimTypeSuspected === "downwinder" &&
    !compliance.jurisdictionMatch.inCoveredCounties
  ) {
    risks.push({
      flag: "jurisdiction_mismatch",
      severity: "high",
      category: "eligibility",
      message: "Residence not in covered county",
      actionRequired:
        "Verify residence was in affected area during exposure period, or provide additional proof",
      details:
        compliance.jurisdictionMatch.issues?.join(". ") ||
        "Downwinder claims require residence in affected counties",
    });
  }

  // Disease not covered
  if (
    compliance.diseaseMatch?.diagnosisFound &&
    !compliance.diseaseMatch.isCoveredDisease
  ) {
    risks.push({
      flag: "non_covered_disease",
      severity: "high",
      category: "eligibility",
      message: `Diagnosis "${compliance.diseaseMatch.diagnosisName}" may not be covered by RECA`,
      actionRequired:
        "Verify diagnosis against list of covered diseases, or obtain additional medical documentation",
      details:
        "RECA covers specific diseases. Non-covered diseases will result in claim denial.",
    });
  }

  return risks;
}

/**
 * Analyze document quality risks
 */
function analyzeQualityRisks(qualityMetrics: QualityMetrics): RiskFlag[] {
  const risks: RiskFlag[] = [];

  // Poor overall quality
  if (qualityMetrics.qualityScore < 0.6) {
    risks.push({
      flag: "poor_document_quality",
      severity: "high",
      category: "quality",
      message: "Document quality is poor, may affect OCR accuracy",
      actionRequired:
        "Re-scan documents at higher quality (300+ DPI, clear lighting)",
      details: `Quality score: ${(qualityMetrics.qualityScore * 100).toFixed(0)}%. Poor quality can cause misread information and claim delays.`,
    });
  } else if (qualityMetrics.qualityScore < 0.8) {
    risks.push({
      flag: "acceptable_document_quality",
      severity: "medium",
      category: "quality",
      message: "Document quality could be improved",
      actionRequired: "Consider re-scanning for better clarity",
      details: `Quality score: ${(qualityMetrics.qualityScore * 100).toFixed(0)}%`,
    });
  }

  // Blurry documents
  if (qualityMetrics.isBlurry) {
    risks.push({
      flag: "blurry_document",
      severity: "medium",
      category: "quality",
      message: "Document appears blurry",
      actionRequired: "Re-scan document with camera held steady and in focus",
      details:
        "Blurry text may be misread or considered illegible by reviewers",
    });
  }

  // Low contrast
  if (qualityMetrics.isLowContrast) {
    risks.push({
      flag: "low_contrast_document",
      severity: "medium",
      category: "quality",
      message: "Document has low contrast",
      actionRequired: "Re-scan with better lighting or adjust scanner settings",
      details:
        "Low contrast makes text harder to read and increases OCR errors",
    });
  }

  return risks;
}

/**
 * Analyze eligibility risks
 */
function analyzeEligibilityRisks(
  _entities: EntityExtractionResult,
  compliance: RECAComplianceResult
): RiskFlag[] {
  const risks: RiskFlag[] = [];

  // High severity date sanity issues
  const criticalDateIssues = compliance.dateSanity.filter(
    (issue) => issue.severity === "high"
  );

  for (const issue of criticalDateIssues) {
    risks.push({
      flag: "date_inconsistency",
      severity: "high",
      category: "eligibility",
      message: issue.issue,
      actionRequired:
        "Review and correct dates in documents. Ensure all dates are accurate.",
      details: issue.details,
    });
  }

  // Medium severity date sanity issues
  const mediumDateIssues = compliance.dateSanity.filter(
    (issue) => issue.severity === "medium"
  );

  for (const issue of mediumDateIssues) {
    risks.push({
      flag: "date_warning",
      severity: "medium",
      category: "eligibility",
      message: issue.issue,
      actionRequired: "Verify dates are correct",
      details: issue.details,
    });
  }

  // No diagnosis found
  if (!compliance.diseaseMatch?.diagnosisFound) {
    risks.push({
      flag: "no_diagnosis",
      severity: "high",
      category: "eligibility",
      message: "No medical diagnosis found in documents",
      actionRequired: "Upload medical records documenting your diagnosis",
      details: "RECA claims require documented diagnosis of a covered disease",
    });
  }

  // Low claim type confidence
  if (compliance.claimTypeConfidence < 0.5) {
    risks.push({
      flag: "unclear_claim_type",
      severity: "medium",
      category: "eligibility",
      message: "Unable to clearly determine claim type",
      actionRequired:
        "Provide additional documentation to clarify whether this is a downwinder, onsite, or uranium worker claim",
      details: `Claim type detection confidence: ${(compliance.claimTypeConfidence * 100).toFixed(0)}%`,
    });
  }

  return risks;
}

/**
 * Analyze consistency risks
 */
function analyzeConsistencyRisks(
  entities: EntityExtractionResult,
  compliance: RECAComplianceResult
): RiskFlag[] {
  const risks: RiskFlag[] = [];

  // Name consistency issues
  const nameIssues = compliance.nameConsistency.filter(
    (check) => check.status === "needs_confirmation"
  );

  for (const issue of nameIssues) {
    risks.push({
      flag: "name_inconsistency",
      severity: issue.severity === "high" ? "high" : "medium",
      category: "consistency",
      message: issue.issue,
      actionRequired:
        "Verify all names are correct and consistent across documents. Provide explanation if name changed.",
      details: issue.details,
    });
  }

  // Missing claimant identification
  const claimants = entities.persons.filter((p) => p.role === "claimant");
  if (claimants.length === 0) {
    risks.push({
      flag: "no_claimant_identified",
      severity: "high",
      category: "consistency",
      message: "Unable to identify claimant name in documents",
      actionRequired:
        "Ensure claimant name is clearly visible in identity documents",
      details: "All claims must clearly identify the claimant",
    });
  }

  // Very few entities extracted (might indicate poor OCR or missing info)
  const totalEntities =
    entities.persons.length +
    entities.dates.length +
    entities.addresses.length +
    entities.medical.length +
    entities.employment.length;

  if (totalEntities < 3) {
    risks.push({
      flag: "insufficient_information",
      severity: "medium",
      category: "consistency",
      message: "Very little information could be extracted from documents",
      actionRequired:
        "Verify documents are complete and legible. Upload additional supporting documents.",
      details: `Only ${totalEntities} entities found. This may indicate poor document quality or missing information.`,
    });
  }

  return risks;
}

/**
 * Detect disclaimer or demo language that could undermine document authenticity.
 */
function analyzeContentRisks(documentText: string): RiskFlag[] {
  if (!documentText) return [];

  const lowerText = documentText.toLowerCase();

  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /test document/, label: '"test document"' },
    {
      regex: /for (training|demo|demonstration)/,
      label: '"for demonstration"',
    },
    { regex: /sample (document|report)/, label: '"sample document"' },
    { regex: /not (?:an )?official/, label: '"not official"' },
    { regex: /does not constitute/i, label: '"does not constitute"' },
    { regex: /dummy data/, label: '"dummy data"' },
  ];

  const matchedSignals = patterns
    .filter((pattern) => pattern.regex.test(lowerText))
    .map((pattern) => pattern.label);

  if (matchedSignals.length === 0) {
    return [];
  }

  // Capture snippet around the first match to help reviewers.
  const firstPattern = patterns.find((pattern) =>
    pattern.regex.test(lowerText)
  );

  let snippet: string | undefined;
  if (firstPattern) {
    const match = lowerText.match(firstPattern.regex);
    if (match?.index !== undefined) {
      const start = Math.max(0, match.index - 60);
      const end = Math.min(lowerText.length, match.index + 120);
      snippet = documentText.slice(start, end).replace(/\s+/g, " ").trim();
    }
  }

  return [
    {
      flag: "demo_or_test_language",
      severity: "high",
      category: "authenticity",
      message:
        "Document contains language suggesting it is a demo or test file",
      actionRequired:
        "Upload an authentic version of the record or provide confirmation that this is the official document",
      details: snippet
        ? `Detected phrases: ${matchedSignals.join(", ")}. Snippet: “${snippet}”`
        : `Detected phrases: ${matchedSignals.join(", ")}`,
    },
  ];
}

/**
 * Calculate overall risk score (0-1)
 */
function calculateOverallRiskScore(risks: RiskFlag[]): number {
  if (risks.length === 0) return 0;

  const weights = { high: 1.0, medium: 0.5, low: 0.25 };
  let totalWeight = 0;

  for (const risk of risks) {
    totalWeight += weights[risk.severity];
  }

  // Normalize to 0-1 scale (cap at 10 risks for max score)
  return Math.min(totalWeight / 10, 1.0);
}

/**
 * Generate recommended actions based on risks
 */
function generateRecommendedActions(
  risks: RiskFlag[],
  compliance: RECAComplianceResult
): string[] {
  const actions: string[] = [];

  // Prioritize high-severity risks
  const highRisks = risks.filter((r) => r.severity === "high");

  if (highRisks.length > 0) {
    actions.push(
      `🔴 Address ${highRisks.length} critical issue${highRisks.length > 1 ? "s" : ""} immediately`
    );
  }

  // Missing documents
  const missingDocs = compliance.missingRequirements.filter(
    (r) => r.priority === "high"
  );
  if (missingDocs.length > 0) {
    actions.push(
      `📄 Upload ${missingDocs.length} required document${missingDocs.length > 1 ? "s" : ""}`
    );
  }

  // Quality issues
  const qualityRisks = risks.filter(
    (r) => r.category === "quality" && r.severity !== "low"
  );
  if (qualityRisks.length > 0) {
    actions.push("📸 Re-scan poor quality documents");
  }

  // Date issues
  const dateRisks = risks.filter((r) => r.flag.includes("date"));
  if (dateRisks.length > 0) {
    actions.push("📅 Verify and correct date inconsistencies");
  }

  // Authenticity concerns
  const authenticityRisks = risks.filter(
    (r) => r.flag === "demo_or_test_language"
  );
  if (authenticityRisks.length > 0) {
    actions.push("⚠️ Confirm the document is authentic or replace demo copies");
  }

  // Completeness
  if (compliance.checklistCoverage < 0.8) {
    actions.push(
      `📋 Increase claim completeness to at least 80% (currently ${(compliance.checklistCoverage * 100).toFixed(0)}%)`
    );
  }

  // Default action if no specific actions
  if (actions.length === 0 && risks.length > 0) {
    actions.push("✅ Review and address all flagged issues");
  }

  // Success message if no risks
  if (risks.length === 0) {
    actions.push("✨ No critical issues found - claim looks good!");
  }

  return actions;
}

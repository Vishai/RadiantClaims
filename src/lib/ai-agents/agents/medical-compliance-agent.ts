/**
 * Medical Compliance Agent
 *
 * Validates medical documents (pathology reports, medical records, diagnoses)
 * and verifies they meet RECA requirements for covered diseases.
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type { MedicalResult, Issue, Evidence } from "../types/agent-results";
import { db } from "@/lib/db";

// RECA covered diseases
const RECA_COVERED_DISEASES = [
  "Leukemia (other than chronic lymphocytic leukemia)",
  "Multiple myeloma",
  "Lymphomas (other than Hodgkin's disease)",
  "Primary cancer of the thyroid",
  "Primary cancer of the male or female breast",
  "Primary cancer of the esophagus",
  "Primary cancer of the stomach",
  "Primary cancer of the pharynx",
  "Primary cancer of the small intestine",
  "Primary cancer of the pancreas",
  "Primary cancer of the bile ducts",
  "Primary cancer of the gall bladder",
  "Primary cancer of the liver",
  "Primary cancer of the lung",
  "Primary cancer of the bone",
  "Primary cancer of the brain",
  "Primary cancer of the bladder",
  "Primary cancer of the kidney",
  "Primary cancer of the renal pelvis",
  "Primary cancer of the ureter",
  "Primary cancer of the ovary",
  "Primary cancer of the colon",
  "Primary cancer of the salivary gland",
];

export class MedicalComplianceAgent extends BaseAgent<MedicalResult> {
  constructor() {
    super("MedicalComplianceAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4096,
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<MedicalResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    const response = await this.callOpenAI(userPrompt, systemPrompt, context);
    const parsed = this.parseJSONResponse<MedicalAgentResponse>(response);

    // Build evidence
    const evidence: Evidence[] = parsed.detectedDiseases.map((disease) => ({
      type: "medical_diagnosis",
      description: `Detected disease: ${disease.name}`,
      extractedText: disease.name,
      confidence: disease.confidence,
    }));

    if (parsed.diagnosisDate) {
      evidence.push({
        type: "date_extraction",
        description: "Diagnosis date",
        extractedText: parsed.diagnosisDate,
        confidence: 0.9,
      });
    }

    // Determine issues
    const issues: Issue[] = [];

    const coveredDiseases = parsed.detectedDiseases.filter(
      (d) => d.isRECACovered
    );

    if (coveredDiseases.length === 0) {
      issues.push({
        severity: "CRITICAL",
        code: "NO_COVERED_DISEASE",
        message: "No RECA-covered disease detected in medical records",
        suggestion:
          "Ensure the medical records clearly document one of the 22 RECA-covered cancers",
        affectsApproval: true,
      });
    }

    if (!parsed.hasPathologyReport) {
      issues.push({
        severity: "WARNING",
        code: "MISSING_PATHOLOGY_REPORT",
        message: "No pathology report detected",
        suggestion:
          "Pathology reports are strongly recommended as primary evidence of cancer diagnosis",
        affectsApproval: false,
      });
    }

    if (!parsed.diagnosisDate) {
      issues.push({
        severity: "WARNING",
        code: "MISSING_DIAGNOSIS_DATE",
        message: "Diagnosis date not found",
        suggestion:
          "The diagnosis date is required to establish the timeline of exposure and disease onset",
        affectsApproval: false,
      });
    }

    if (!parsed.diagnosingPhysician) {
      issues.push({
        severity: "INFO",
        code: "MISSING_PHYSICIAN_INFO",
        message: "Diagnosing physician information not found",
        suggestion:
          "Physician name and credentials help validate the diagnosis",
        affectsApproval: false,
      });
    }

    const confidence = this.calculateConfidence({
      aiConfidence: parsed.confidence,
      dataCompleteness: this.calculateDataCompleteness(parsed),
      validationPasses: coveredDiseases.length > 0 ? 1 : 0,
      validationTotal: 1,
    });

    const hasCriticalIssues = issues.some((i) => i.severity === "CRITICAL");
    const status = this.determineStatus(
      confidence,
      hasCriticalIssues,
      issues.length > 0
    );

    return {
      status,
      confidence,
      data: {
        isRECAEligible: coveredDiseases.length > 0 && confidence >= 0.7,
        detectedDiseases: parsed.detectedDiseases,
        diagnosisDate: parsed.diagnosisDate,
        diagnosingPhysician: parsed.diagnosingPhysician,
        medicalFacility: parsed.medicalFacility,
        hasPathologyReport: parsed.hasPathologyReport,
        hasTreatmentRecords: parsed.hasTreatmentRecords,
        requiredDocumentsPresent: {
          pathologyReport: parsed.hasPathologyReport,
          diagnosisDocumentation: true,
          treatmentRecords: parsed.hasTreatmentRecords,
        },
      },
      evidence,
      reasoning: parsed.reasoning,
      issues,
      processingTimeMs: 0,
      timestamp: new Date(),
    };
  }

  protected async storeResult(
    context: AgentExecutionContext,
    result: MedicalResult,
    _logId: string
  ): Promise<void> {
    if (!context.uploadedFileId) {
      throw new Error("uploadedFileId is required");
    }

    const validation = await db.documentValidation.findUnique({
      where: { uploadedFileId: context.uploadedFileId },
    });

    if (!validation) {
      throw new Error(
        `DocumentValidation not found for file ${context.uploadedFileId}`
      );
    }

    await db.documentValidation.update({
      where: { id: validation.id },
      data: {
        medicalResult: result as any,
        criticalIssues: [
          ...((validation.criticalIssues as any[]) || []),
          ...result.issues.filter((i) => i.severity === "CRITICAL"),
        ],
        warnings: [
          ...((validation.warnings as any[]) || []),
          ...result.issues.filter((i) => i.severity === "WARNING"),
        ],
      },
    });
  }

  private calculateDataCompleteness(parsed: MedicalAgentResponse): number {
    let score = 0;
    let total = 5;

    if (parsed.detectedDiseases.length > 0) score += 1;
    if (parsed.diagnosisDate) score += 1;
    if (parsed.diagnosingPhysician) score += 0.5;
    if (parsed.medicalFacility) score += 0.5;
    if (parsed.hasPathologyReport) score += 1;
    if (parsed.hasTreatmentRecords) score += 1;

    return score / total;
  }

  private buildSystemPrompt(): string {
    return `You are a medical document analysis AI specialized in RECA (Radiation Exposure Compensation Act) claims.

Your task is to analyze medical documents and determine:
1. What diseases/conditions are documented
2. Whether they are RECA-covered cancers
3. Key medical information needed for the claim

RECA covers these 22 specific cancers:
${RECA_COVERED_DISEASES.map((d, i) => `${i + 1}. ${d}`).join("\n")}

IMPORTANT:
- Chronic lymphocytic leukemia is NOT covered
- Non-cancer conditions are NOT covered
- Only PRIMARY cancers are covered (not metastatic)

Look for:
- Diagnosis statements
- Pathology report findings
- ICD codes (if present)
- Physician names and credentials
- Dates of diagnosis
- Treatment information

Respond with JSON:
{
  "confidence": 0.95,
  "reasoning": "This pathology report confirms...",
  "detectedDiseases": [
    {
      "name": "Primary cancer of the lung",
      "code": "C34.9",
      "isRECACovered": true,
      "confidence": 0.98
    }
  ],
  "diagnosisDate": "2020-06-15",
  "diagnosingPhysician": "Dr. Jane Smith, MD",
  "medicalFacility": "University Hospital",
  "hasPathologyReport": true,
  "hasTreatmentRecords": false
}`;
  }

  private buildUserPrompt(context: AgentExecutionContext): string {
    let prompt = "Analyze this medical document for RECA eligibility:\n\n";

    if (context.documentText) {
      prompt += `Document Text:\n${context.documentText.slice(0, 15000)}\n\n`;
    }

    prompt += "Provide analysis in JSON format.";
    return prompt;
  }
}

interface MedicalAgentResponse {
  confidence: number;
  reasoning: string;
  detectedDiseases: Array<{
    name: string;
    code?: string;
    isRECACovered: boolean;
    confidence: number;
  }>;
  diagnosisDate: string | null;
  diagnosingPhysician: string | null;
  medicalFacility: string | null;
  hasPathologyReport: boolean;
  hasTreatmentRecords: boolean;
}

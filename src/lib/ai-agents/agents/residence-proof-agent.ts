/**
 * Residence Proof Agent
 *
 * Validates documents that prove residence in RECA-covered counties during
 * the atmospheric testing period (1951-1958 for downwinders).
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type { ResidenceResult, Issue, Evidence } from "../types/agent-results";
import { db } from "@/lib/db";
import {
  RECA_COVERED_COUNTIES,
  isCoveredCounty,
  getCountyNotes,
  DOWNWINDER_EXPOSURE_PERIOD,
  isInExposurePeriod,
} from "../reca-reference-data";

// Common residence document types
const VALID_RESIDENCE_DOCUMENT_TYPES = [
  "utility bill",
  "tax return",
  "mortgage statement",
  "lease agreement",
  "rental agreement",
  "bank statement",
  "school records",
  "employment records",
  "voter registration",
  "property deed",
  "insurance documents",
] as const;

export class ResidenceProofAgent extends BaseAgent<ResidenceResult> {
  constructor() {
    super("ResidenceProofAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4096,
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<ResidenceResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    const response = await this.callOpenAI(userPrompt, systemPrompt, context);
    const parsed = this.parseJSONResponse<ResidenceAgentResponse>(response);

    // Build evidence
    const evidence: Evidence[] = [];

    if (parsed.address) {
      const { street, city, county, state, zipCode } = parsed.address;
      if (street) {
        evidence.push({
          type: "address_extraction",
          description: "Street address extracted",
          extractedText: street,
          confidence: 0.9,
        });
      }
      if (city && state) {
        evidence.push({
          type: "address_extraction",
          description: "City and state extracted",
          extractedText: `${city}, ${state}`,
          confidence: 0.9,
        });
      }
      if (county) {
        evidence.push({
          type: "county_extraction",
          description: "County extracted",
          extractedText: county,
          confidence: 0.95,
        });
      }
      if (zipCode) {
        evidence.push({
          type: "address_extraction",
          description: "ZIP code extracted",
          extractedText: zipCode,
          confidence: 0.85,
        });
      }
    }

    if (parsed.residencePeriod) {
      if (parsed.residencePeriod.startDate) {
        evidence.push({
          type: "date_extraction",
          description: "Residence start date",
          extractedText: parsed.residencePeriod.startDate,
          confidence: 0.9,
        });
      }
      if (parsed.residencePeriod.endDate) {
        evidence.push({
          type: "date_extraction",
          description: "Residence end date",
          extractedText: parsed.residencePeriod.endDate,
          confidence: 0.9,
        });
      }
    }

    if (parsed.documentDate) {
      evidence.push({
        type: "document_date",
        description: "Document date",
        extractedText: parsed.documentDate,
        confidence: 0.85,
      });
    }

    // Validate county is covered
    let inCoveredArea = false;
    let coveredCounty: string | null = null;

    if (parsed.address?.county && parsed.address?.state) {
      inCoveredArea = isCoveredCounty(
        parsed.address.county,
        parsed.address.state
      );
      if (inCoveredArea) {
        coveredCounty = parsed.address.county;
        evidence.push({
          type: "reca_validation",
          description: `County ${parsed.address.county}, ${parsed.address.state} is RECA-covered`,
          extractedText: `${parsed.address.county}, ${parsed.address.state}`,
          confidence: 1.0,
        });

        // Check for special notes (e.g., Clark County partial coverage)
        const notes = getCountyNotes(
          parsed.address.county,
          parsed.address.state
        );
        if (notes) {
          evidence.push({
            type: "reca_validation",
            description: "County coverage note",
            extractedText: notes,
            confidence: 1.0,
          });
        }
      }
    }

    // Determine issues
    const issues: Issue[] = [];

    if (!parsed.address) {
      issues.push({
        severity: "CRITICAL",
        code: "NO_ADDRESS_FOUND",
        message: "No address information found in document",
        suggestion:
          "Ensure the document clearly shows a complete address including street, city, county, and state",
        affectsApproval: true,
      });
    } else {
      if (!parsed.address.county) {
        issues.push({
          severity: "WARNING",
          code: "MISSING_COUNTY",
          message: "County information not found",
          suggestion:
            "County is critical for RECA eligibility. Additional documentation may be needed to verify the county.",
          affectsApproval: true,
        });
      }

      if (!parsed.address.state) {
        issues.push({
          severity: "CRITICAL",
          code: "MISSING_STATE",
          message: "State information not found",
          suggestion: "State is required to validate RECA coverage area",
          affectsApproval: true,
        });
      }

      if (!parsed.address.street) {
        issues.push({
          severity: "WARNING",
          code: "MISSING_STREET",
          message: "Street address not found",
          suggestion: "Complete street address helps verify residence location",
          affectsApproval: false,
        });
      }
    }

    if (!inCoveredArea && parsed.address?.county && parsed.address?.state) {
      issues.push({
        severity: "CRITICAL",
        code: "NOT_IN_COVERED_AREA",
        message: `County ${parsed.address.county}, ${parsed.address.state} is not a RECA-covered area`,
        suggestion: `RECA only covers specific counties in Arizona, Nevada, and Utah. Covered counties: ${RECA_COVERED_COUNTIES.map((c) => `${c.county}, ${c.state}`).join("; ")}`,
        affectsApproval: true,
      });
    }

    if (!parsed.residencePeriod?.startDate && !parsed.documentDate) {
      issues.push({
        severity: "WARNING",
        code: "NO_DATE_INFORMATION",
        message: "No date information found to establish residence period",
        suggestion: `Documents should show dates to prove residence during the exposure period (${DOWNWINDER_EXPOSURE_PERIOD.start} to ${DOWNWINDER_EXPOSURE_PERIOD.end})`,
        affectsApproval: true,
      });
    }

    // Check if dates fall within exposure period
    const datesToCheck = [
      parsed.residencePeriod?.startDate,
      parsed.residencePeriod?.endDate,
      parsed.documentDate,
    ].filter(Boolean) as string[];

    let hasDateInExposurePeriod = false;
    for (const date of datesToCheck) {
      if (isInExposurePeriod(date, "downwinder")) {
        hasDateInExposurePeriod = true;
        evidence.push({
          type: "date_validation",
          description: `Date falls within RECA exposure period (${DOWNWINDER_EXPOSURE_PERIOD.start} to ${DOWNWINDER_EXPOSURE_PERIOD.end})`,
          extractedText: date,
          confidence: 1.0,
        });
        break;
      }
    }

    if (datesToCheck.length > 0 && !hasDateInExposurePeriod) {
      issues.push({
        severity: "WARNING",
        code: "DATE_OUTSIDE_EXPOSURE_PERIOD",
        message: `Document dates do not fall within the RECA exposure period (${DOWNWINDER_EXPOSURE_PERIOD.start} to ${DOWNWINDER_EXPOSURE_PERIOD.end})`,
        suggestion:
          "Additional documents may be needed to prove residence during the atmospheric testing period",
        affectsApproval: true,
      });
    }

    // Validate document type
    const isValidDocumentType = VALID_RESIDENCE_DOCUMENT_TYPES.some((type) =>
      // The model returns null when it can't name the document type.
      (parsed.documentType ?? "").toLowerCase().includes(type)
    );

    if (!isValidDocumentType) {
      issues.push({
        severity: "INFO",
        code: "UNUSUAL_DOCUMENT_TYPE",
        message: `Document type "${parsed.documentType}" is not a standard residence proof document`,
        suggestion: `Common acceptable documents include: ${VALID_RESIDENCE_DOCUMENT_TYPES.join(", ")}`,
        affectsApproval: false,
      });
    }

    if (!parsed.documentAppearsProfessional) {
      issues.push({
        severity: "WARNING",
        code: "DOCUMENT_QUALITY_CONCERN",
        message:
          "Document does not appear to be an official or professional document",
        suggestion:
          "Official documents from utilities, government agencies, or financial institutions are preferred",
        affectsApproval: false,
      });
    }

    // Calculate confidence
    const confidence = this.calculateConfidence({
      aiConfidence: parsed.confidence,
      dataCompleteness: this.calculateDataCompleteness(parsed),
      validationPasses: this.countValidationPasses(
        parsed,
        inCoveredArea,
        hasDateInExposurePeriod
      ),
      validationTotal: 5, // county check, state check, date check, document type, professional appearance
    });

    const hasCriticalIssues = issues.some((i) => i.severity === "CRITICAL");
    const hasWarnings = issues.some((i) => i.severity === "WARNING");
    const status = this.determineStatus(
      confidence,
      hasCriticalIssues,
      hasWarnings
    );

    return {
      status,
      confidence,
      data: {
        isValidProof: inCoveredArea && confidence >= 0.7 && !hasCriticalIssues,
        address: parsed.address || null,
        residencePeriod: parsed.residencePeriod || null,
        inCoveredArea,
        coveredCounty,
        documentDate: parsed.documentDate || null,
        documentType: parsed.documentType,
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
    result: ResidenceResult,
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
        residenceResult: result as any,
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

  private calculateDataCompleteness(parsed: ResidenceAgentResponse): number {
    let score = 0;
    let total = 8;

    if (parsed.address) {
      if (parsed.address.street) score += 1;
      if (parsed.address.city) score += 1;
      if (parsed.address.county) score += 1.5; // County is most important
      if (parsed.address.state) score += 1.5;
      if (parsed.address.zipCode) score += 0.5;
    }

    if (parsed.residencePeriod) {
      if (parsed.residencePeriod.startDate) score += 1;
      if (parsed.residencePeriod.endDate || parsed.residencePeriod.isOngoing)
        score += 0.5;
    }

    if (parsed.documentDate) score += 1;

    return score / total;
  }

  private countValidationPasses(
    parsed: ResidenceAgentResponse,
    inCoveredArea: boolean,
    hasDateInExposurePeriod: boolean
  ): number {
    let passes = 0;

    if (parsed.address?.county) passes += 1; // Has county
    if (parsed.address?.state) passes += 1; // Has state
    if (inCoveredArea) passes += 1; // In covered area
    if (hasDateInExposurePeriod) passes += 1; // Date in period
    if (parsed.documentAppearsProfessional) passes += 1; // Professional doc

    return passes;
  }

  private buildSystemPrompt(): string {
    return `You are a residence verification AI specialized in RECA (Radiation Exposure Compensation Act) claims.

Your task is to analyze documents that prove residence in specific counties during the atmospheric nuclear testing period.

RECA covers downwinders who lived in these specific counties during ${DOWNWINDER_EXPOSURE_PERIOD.start} to ${DOWNWINDER_EXPOSURE_PERIOD.end}:

ARIZONA:
${RECA_COVERED_COUNTIES.filter((c) => c.state === "AZ")
  .map((c) => `- ${c.county} County`)
  .join("\n")}

NEVADA:
${RECA_COVERED_COUNTIES.filter((c) => c.state === "NV")
  .map((c) => `- ${c.county} County${c.notes ? " (" + c.notes + ")" : ""}`)
  .join("\n")}

UTAH:
${RECA_COVERED_COUNTIES.filter((c) => c.state === "UT")
  .map((c) => `- ${c.county} County`)
  .join("\n")}

IMPORTANT:
- The exposure period for downwinders is ${DOWNWINDER_EXPOSURE_PERIOD.start} to ${DOWNWINDER_EXPOSURE_PERIOD.end}
- County is the most critical piece of information
- Acceptable documents include: utility bills, tax returns, mortgage statements, lease agreements, school records, etc.
- The document should show residence during at least part of the exposure period

Look for:
- Complete address (street, city, county, state, ZIP)
- Document date or residence period dates
- Document type (utility bill, tax return, etc.)
- Official letterhead, seals, or professional formatting
- Account numbers or reference numbers indicating authenticity

Respond with JSON:
{
  "confidence": 0.95,
  "reasoning": "This utility bill clearly shows...",
  "address": {
    "street": "123 Main St",
    "city": "St. George",
    "county": "Washington",
    "state": "UT",
    "zipCode": "84770"
  },
  "residencePeriod": {
    "startDate": "1955-01-01",
    "endDate": "1960-12-31",
    "isOngoing": false
  },
  "documentDate": "1956-06-15",
  "documentType": "utility bill",
  "documentAppearsProfessional": true
}

If information is not present, use null. For county, try to extract or infer from city/ZIP code if possible.`;
  }

  private buildUserPrompt(context: AgentExecutionContext): string {
    let prompt =
      "Analyze this document to verify residence in a RECA-covered area:\n\n";

    if (context.documentText) {
      prompt += `Document Text:\n${context.documentText.slice(0, 15000)}\n\n`;
    }

    prompt +=
      "Extract address, dates, and determine if this proves residence in a RECA-covered county. Provide analysis in JSON format.";
    return prompt;
  }
}

interface ResidenceAgentResponse {
  confidence: number;
  reasoning: string;
  address: {
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    zipCode?: string;
  } | null;
  residencePeriod: {
    startDate?: string;
    endDate?: string;
    isOngoing?: boolean;
  } | null;
  documentDate: string | null;
  documentType: string;
  documentAppearsProfessional: boolean;
}

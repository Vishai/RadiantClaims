/**
 * Employment Verification Agent
 *
 * Validates employment records to verify work at DOE nuclear facilities,
 * uranium mines, or other RECA-covered employment sites.
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type { EmploymentResult, Issue, Evidence } from "../types/agent-results";
import { db } from "@/lib/db";
import {
  RECA_COVERED_FACILITIES,
  isCoveredFacility,
  findFacility,
  URANIUM_WORKER_PERIOD,
  ONSITE_PARTICIPANT_PERIOD,
  isInExposurePeriod,
} from "../reca-reference-data";

// Common employment document types
const VALID_EMPLOYMENT_DOCUMENT_TYPES = [
  "employment verification letter",
  "pay stub",
  "w2 form",
  "tax return",
  "social security statement",
  "pension documents",
  "badge records",
  "dosimetry records",
  "security clearance",
  "employment contract",
  "termination letter",
  "retirement documents",
] as const;

// Keywords that indicate occupational exposure types
const EXPOSURE_TYPE_KEYWORDS = {
  uranium_mining: [
    "uranium mine",
    "uranium mining",
    "underground mining",
    "ore extraction",
    "uranium ore",
    "vanadium",
    "mill worker",
    "ore processing",
    "milling",
  ],
  onsite_participant: [
    "test site",
    "nuclear test",
    "atmospheric test",
    "proving grounds",
    "onsite",
    "participant",
    "witness",
    "observer",
    "military personnel",
  ],
  nuclear_facility: [
    "nuclear",
    "gaseous diffusion",
    "enrichment",
    "plutonium",
    "reactor",
    "national laboratory",
    "doe facility",
    "atomic energy",
    "manhattan project",
  ],
} as const;

export class EmploymentVerificationAgent extends BaseAgent<EmploymentResult> {
  constructor() {
    super("EmploymentVerificationAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4096,
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<EmploymentResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    const response = await this.callOpenAI(userPrompt, systemPrompt, context);
    const parsed = this.parseJSONResponse<EmploymentAgentResponse>(response);

    // Build evidence
    const evidence: Evidence[] = [];

    if (parsed.employerName) {
      evidence.push({
        type: "employer_extraction",
        description: "Employer name extracted",
        extractedText: parsed.employerName,
        confidence: 0.9,
      });
    }

    if (parsed.facilityName) {
      evidence.push({
        type: "facility_extraction",
        description: "Facility name extracted",
        extractedText: parsed.facilityName,
        confidence: 0.9,
      });
    }

    if (parsed.jobTitle) {
      evidence.push({
        type: "job_title_extraction",
        description: "Job title extracted",
        extractedText: parsed.jobTitle,
        confidence: 0.85,
      });
    }

    if (parsed.employmentPeriod) {
      if (parsed.employmentPeriod.startDate) {
        evidence.push({
          type: "date_extraction",
          description: "Employment start date",
          extractedText: parsed.employmentPeriod.startDate,
          confidence: 0.9,
        });
      }
      if (parsed.employmentPeriod.endDate) {
        evidence.push({
          type: "date_extraction",
          description: "Employment end date",
          extractedText: parsed.employmentPeriod.endDate,
          confidence: 0.9,
        });
      }
    }

    // Validate facility is covered
    let isCoveredFacilityMatch = false;
    const facilityToCheck = parsed.facilityName || parsed.employerName;

    if (facilityToCheck) {
      isCoveredFacilityMatch = isCoveredFacility(facilityToCheck);

      if (isCoveredFacilityMatch) {
        const facilityDetails = findFacility(facilityToCheck);
        evidence.push({
          type: "reca_validation",
          description: `Facility "${facilityToCheck}" is RECA-covered`,
          extractedText: facilityDetails?.name || facilityToCheck,
          confidence: 1.0,
        });

        if (facilityDetails) {
          evidence.push({
            type: "reca_validation",
            description: `Facility type: ${facilityDetails.type}`,
            extractedText: `${facilityDetails.type} - ${facilityDetails.location.city || ""}, ${facilityDetails.location.state}`,
            confidence: 1.0,
          });
        }
      }
    }

    // Detect exposure type
    const exposureType = this.detectExposureType(
      parsed.jobTitle,
      parsed.jobDescription,
      parsed.facilityName,
      parsed.employerName
    );

    if (exposureType) {
      evidence.push({
        type: "exposure_detection",
        description: `Occupational exposure type: ${exposureType.type}`,
        extractedText: exposureType.matchedKeywords.join(", "),
        confidence: exposureType.confidence,
      });
    }

    // Determine issues
    const issues: Issue[] = [];

    if (!parsed.employerName && !parsed.facilityName) {
      issues.push({
        severity: "CRITICAL",
        code: "NO_EMPLOYER_FOUND",
        message: "No employer or facility information found in document",
        suggestion:
          "Employment verification must clearly identify the employer and/or facility",
        affectsApproval: true,
      });
    }

    if (!parsed.employmentPeriod?.startDate) {
      issues.push({
        severity: "WARNING",
        code: "MISSING_START_DATE",
        message: "Employment start date not found",
        suggestion:
          "Start date is needed to verify employment during the covered period",
        affectsApproval: true,
      });
    }

    if (facilityToCheck && !isCoveredFacilityMatch) {
      issues.push({
        severity: "CRITICAL",
        code: "NOT_COVERED_FACILITY",
        message: `Facility "${facilityToCheck}" is not recognized as a RECA-covered facility`,
        suggestion: `RECA covers specific DOE facilities, uranium mines, test sites, and national laboratories. Covered facilities include: ${RECA_COVERED_FACILITIES.slice(
          0,
          5
        )
          .map((f) => f.name)
          .join(", ")}... and others.`,
        affectsApproval: true,
      });
    }

    // Check if employment dates fall within covered periods
    let hasDateInCoveredPeriod = false;
    const employmentDates = [
      parsed.employmentPeriod?.startDate,
      parsed.employmentPeriod?.endDate,
    ].filter(Boolean) as string[];

    if (employmentDates.length > 0 && exposureType) {
      // Determine which period to check based on exposure type
      let periodType: "uranium_worker" | "onsite" = "uranium_worker";
      if (exposureType.type.includes("onsite")) {
        periodType = "onsite";
      }

      for (const date of employmentDates) {
        if (isInExposurePeriod(date, periodType)) {
          hasDateInCoveredPeriod = true;
          const period =
            periodType === "onsite"
              ? ONSITE_PARTICIPANT_PERIOD
              : URANIUM_WORKER_PERIOD;
          evidence.push({
            type: "date_validation",
            description: `Employment date falls within RECA ${periodType} period (${period.start} to ${period.end})`,
            extractedText: date,
            confidence: 1.0,
          });
          break;
        }
      }

      if (!hasDateInCoveredPeriod) {
        issues.push({
          severity: "WARNING",
          code: "DATE_OUTSIDE_COVERED_PERIOD",
          message:
            "Employment dates do not fall within the RECA covered period",
          suggestion: `For ${periodType === "uranium_worker" ? "uranium workers" : "onsite participants"}, employment must be during ${periodType === "uranium_worker" ? "1942-1971" : "1945-1962"}`,
          affectsApproval: true,
        });
      }
    }

    if (!parsed.isNuclearRelated && !exposureType) {
      issues.push({
        severity: "CRITICAL",
        code: "NOT_NUCLEAR_EMPLOYMENT",
        message:
          "Employment does not appear to be nuclear-related or at a covered facility",
        suggestion:
          "RECA requires employment at DOE facilities, uranium mines, or other covered nuclear sites",
        affectsApproval: true,
      });
    }

    if (!exposureType && parsed.isNuclearRelated) {
      issues.push({
        severity: "WARNING",
        code: "UNCLEAR_EXPOSURE_TYPE",
        message: "Cannot determine specific type of occupational exposure",
        suggestion:
          "Document should clarify job duties, facility type, or exposure conditions",
        affectsApproval: false,
      });
    }

    // Validate document type
    const isValidDocumentType = VALID_EMPLOYMENT_DOCUMENT_TYPES.some((type) =>
      parsed.documentType.toLowerCase().includes(type)
    );

    if (!isValidDocumentType) {
      issues.push({
        severity: "INFO",
        code: "UNUSUAL_DOCUMENT_TYPE",
        message: `Document type "${parsed.documentType}" is not a standard employment verification document`,
        suggestion: `Common acceptable documents include: ${VALID_EMPLOYMENT_DOCUMENT_TYPES.slice(0, 6).join(", ")}`,
        affectsApproval: false,
      });
    }

    if (!parsed.hasOfficialHeader) {
      issues.push({
        severity: "WARNING",
        code: "NO_OFFICIAL_HEADER",
        message:
          "Document does not appear to have official employer letterhead or formatting",
        suggestion:
          "Official documents from employers, government agencies, or HR departments are preferred",
        affectsApproval: false,
      });
    }

    // Calculate confidence
    const confidence = this.calculateConfidence({
      aiConfidence: parsed.confidence,
      dataCompleteness: this.calculateDataCompleteness(parsed),
      validationPasses: this.countValidationPasses(
        parsed,
        isCoveredFacilityMatch,
        hasDateInCoveredPeriod,
        exposureType
      ),
      validationTotal: 5, // facility check, date check, nuclear-related, exposure type, official header
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
        isQualifyingEmployment:
          isCoveredFacilityMatch && confidence >= 0.7 && !hasCriticalIssues,
        employerName: parsed.employerName || null,
        facilityName: parsed.facilityName || null,
        isNuclearFacility: parsed.isNuclearRelated,
        isCoveredFacility: isCoveredFacilityMatch,
        employmentPeriod: parsed.employmentPeriod || null,
        jobTitle: parsed.jobTitle || null,
        occupationalExposure: {
          detected: !!exposureType,
          type: exposureType?.type,
          confidence: exposureType?.confidence || 0,
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
    result: EmploymentResult,
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
        employmentResult: result as any,
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

  private calculateDataCompleteness(parsed: EmploymentAgentResponse): number {
    let score = 0;
    let total = 7;

    if (parsed.employerName) score += 1;
    if (parsed.facilityName) score += 1;
    if (parsed.jobTitle) score += 1;
    if (parsed.employmentPeriod?.startDate) score += 1.5;
    if (parsed.employmentPeriod?.endDate) score += 0.5;
    if (parsed.isNuclearRelated) score += 1;
    if (parsed.hasOfficialHeader) score += 1;

    return score / total;
  }

  private countValidationPasses(
    parsed: EmploymentAgentResponse,
    isCoveredFacilityMatch: boolean,
    hasDateInCoveredPeriod: boolean,
    exposureType: {
      type: string;
      confidence: number;
      matchedKeywords: string[];
    } | null
  ): number {
    let passes = 0;

    if (isCoveredFacilityMatch) passes += 1;
    if (hasDateInCoveredPeriod) passes += 1;
    if (parsed.isNuclearRelated) passes += 1;
    if (exposureType && exposureType.confidence >= 0.7) passes += 1;
    if (parsed.hasOfficialHeader) passes += 1;

    return passes;
  }

  private detectExposureType(
    jobTitle?: string | null,
    jobDescription?: string | null,
    facilityName?: string | null,
    employerName?: string | null
  ): { type: string; confidence: number; matchedKeywords: string[] } | null {
    const textToSearch = [jobTitle, jobDescription, facilityName, employerName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!textToSearch) return null;

    let bestMatch: {
      type: string;
      confidence: number;
      matchedKeywords: string[];
    } | null = null;
    let maxMatches = 0;

    for (const [exposureType, keywords] of Object.entries(
      EXPOSURE_TYPE_KEYWORDS
    )) {
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (textToSearch.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      if (matchedKeywords.length > maxMatches) {
        maxMatches = matchedKeywords.length;
        // Calculate confidence based on number of matches
        const confidence = Math.min(0.95, 0.6 + matchedKeywords.length * 0.1);
        bestMatch = {
          type: exposureType.replace("_", " "),
          confidence,
          matchedKeywords,
        };
      }
    }

    return bestMatch;
  }

  private buildSystemPrompt(): string {
    return `You are an employment verification AI specialized in RECA (Radiation Exposure Compensation Act) claims.

Your task is to analyze employment documents to verify work at DOE nuclear facilities, uranium mines, or other covered sites.

RECA covers three main categories of workers:

1. **Uranium Workers** (1942-1971):
   - Uranium miners (underground, open pit, surface)
   - Uranium mill workers
   - Ore transporters
   - Core drillers
   - Facilities: Mines and mills in Colorado, Utah, Arizona, New Mexico, Wyoming

2. **Onsite Participants** (1945-1962):
   - Military personnel at test sites
   - Civilian workers at test sites
   - Participants in atmospheric nuclear tests
   - Facilities: Nevada Test Site, Trinity Site, Pacific test sites

3. **DOE Facility Workers** (various periods):
   - Gaseous diffusion plants (Oak Ridge, Paducah, Portsmouth)
   - National laboratories (Los Alamos, Hanford, etc.)
   - Nuclear weapons facilities
   - Plutonium production facilities

COVERED FACILITIES (partial list):
${RECA_COVERED_FACILITIES.map((f) => `- ${f.name} (${f.type}) - ${f.location.city || ""} ${f.location.state}`).join("\n")}

IMPORTANT:
- Employment must be during the covered periods for each category
- Job role must involve potential radiation exposure
- Facility must be on the DOE covered facilities list or a uranium mine/mill

Look for:
- Employer name and facility name
- Employment dates (start and end)
- Job title and duties
- Facility location
- Evidence of nuclear/radiation work
- Official letterhead, signatures, or seals
- Badge numbers, dosimetry records, or clearance information

Respond with JSON:
{
  "confidence": 0.95,
  "reasoning": "This employment verification letter clearly shows...",
  "employerName": "U.S. Department of Energy",
  "facilityName": "Los Alamos National Laboratory",
  "jobTitle": "Radiation Technician",
  "jobDescription": "Performed radiation monitoring and dosimetry",
  "employmentPeriod": {
    "startDate": "1955-03-15",
    "endDate": "1960-12-31"
  },
  "isNuclearRelated": true,
  "hasOfficialHeader": true,
  "documentType": "employment verification letter"
}

If information is not present, use null.`;
  }

  private buildUserPrompt(context: AgentExecutionContext): string {
    let prompt =
      "Analyze this employment document to verify work at a RECA-covered facility:\n\n";

    if (context.documentText) {
      prompt += `Document Text:\n${context.documentText.slice(0, 15000)}\n\n`;
    }

    prompt +=
      "Extract employment information and determine if this qualifies as covered employment under RECA. Provide analysis in JSON format.";
    return prompt;
  }
}

interface EmploymentAgentResponse {
  confidence: number;
  reasoning: string;
  employerName: string | null;
  facilityName: string | null;
  jobTitle: string | null;
  jobDescription: string | null;
  employmentPeriod: {
    startDate?: string;
    endDate?: string;
  } | null;
  isNuclearRelated: boolean;
  hasOfficialHeader: boolean;
  documentType: string;
}

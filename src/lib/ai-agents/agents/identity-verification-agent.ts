/**
 * Identity Verification Agent
 *
 * Validates identity documents (birth certificates, death certificates, marriage certificates)
 * and extracts key identity information required for RECA claims.
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type { IdentityResult, Issue, Evidence } from "../types/agent-results";
import { db } from "@/lib/db";

export class IdentityVerificationAgent extends BaseAgent<IdentityResult> {
  constructor() {
    super("IdentityVerificationAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 3072,
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<IdentityResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    // Call OpenAI
    const response = await this.callOpenAI(userPrompt, systemPrompt, context);
    const parsed = this.parseJSONResponse<IdentityAgentResponse>(response);

    // Build evidence array
    const evidence: Evidence[] = [];

    if (parsed.extracted.fullName) {
      evidence.push({
        type: "extracted_field",
        description: "Full name extracted",
        extractedText: parsed.extracted.fullName,
        confidence: parsed.extracted.nameConfidence || 0.9,
      });
    }

    if (parsed.extracted.dateOfBirth) {
      evidence.push({
        type: "extracted_field",
        description: "Date of birth extracted",
        extractedText: parsed.extracted.dateOfBirth,
        confidence: parsed.extracted.dobConfidence || 0.9,
      });
    }

    if (parsed.extracted.hasOfficialSeal) {
      evidence.push({
        type: "visual_indicator",
        description: "Official seal or stamp detected",
        confidence: 0.95,
      });
    }

    // Determine issues
    const issues: Issue[] = [];
    const requiredElements = parsed.requiredElements;

    // Check for missing critical elements
    if (requiredElements.name === "MISSING") {
      issues.push({
        severity: "CRITICAL",
        code: "MISSING_NAME",
        message: "Name is missing from identity document",
        suggestion:
          "Ensure the document shows the full legal name of the claimant or deceased",
        affectsApproval: true,
        field: "name",
      });
    }

    if (requiredElements.dob === "MISSING") {
      issues.push({
        severity: "CRITICAL",
        code: "MISSING_DOB",
        message: "Date of birth is missing",
        suggestion: "Ensure the document clearly shows the date of birth",
        affectsApproval: true,
        field: "dateOfBirth",
      });
    }

    if (requiredElements.officialSeal === "MISSING") {
      issues.push({
        severity: "CRITICAL",
        code: "MISSING_OFFICIAL_SEAL",
        message: "Official seal or certification stamp is missing",
        suggestion:
          "RECA requires certified copies with an official seal. Request a certified copy from the issuing agency.",
        affectsApproval: true,
      });
    }

    if (requiredElements.issuingAuthority === "MISSING") {
      issues.push({
        severity: "WARNING",
        code: "MISSING_ISSUING_AUTHORITY",
        message: "Issuing authority is not clearly visible",
        suggestion:
          "The document should show which government agency issued it",
        affectsApproval: false,
      });
    }

    // Check for unclear elements
    if (requiredElements.name === "UNCLEAR") {
      issues.push({
        severity: "WARNING",
        code: "UNCLEAR_NAME",
        message: "Name is unclear or difficult to read",
        suggestion: "Upload a clearer scan or photo of the document",
        affectsApproval: false,
        field: "name",
      });
    }

    if (requiredElements.dob === "UNCLEAR") {
      issues.push({
        severity: "WARNING",
        code: "UNCLEAR_DOB",
        message: "Date of birth is unclear or difficult to read",
        suggestion: "Upload a clearer scan or photo of the document",
        affectsApproval: false,
        field: "dateOfBirth",
      });
    }

    // Check place of birth for RECA claims
    if (!parsed.extracted.placeOfBirth?.state) {
      issues.push({
        severity: "WARNING",
        code: "MISSING_BIRTHPLACE",
        message: "Place of birth is not shown",
        suggestion:
          "For RECA claims, birthplace information can help establish residency in covered areas",
        affectsApproval: false,
        field: "placeOfBirth",
      });
    }

    // Calculate validity score
    const validationChecks = {
      total: 5,
      passed: 0,
    };

    if (requiredElements.name === "PRESENT") validationChecks.passed++;
    if (requiredElements.dob === "PRESENT") validationChecks.passed++;
    if (requiredElements.officialSeal === "PRESENT") validationChecks.passed++;
    if (requiredElements.issuingAuthority === "PRESENT")
      validationChecks.passed++;
    if (parsed.extracted.placeOfBirth) validationChecks.passed++;

    const confidence = this.calculateConfidence({
      aiConfidence: parsed.confidence,
      validationPasses: validationChecks.passed,
      validationTotal: validationChecks.total,
      dataCompleteness:
        requiredElements.name === "PRESENT" &&
        requiredElements.dob === "PRESENT"
          ? 1.0
          : 0.5,
      ocrQuality: context.documentText ? 0.9 : 0.7,
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
        isValid: !hasCriticalIssues && confidence >= 0.7,
        fullName: parsed.extracted.fullName,
        dateOfBirth: parsed.extracted.dateOfBirth,
        placeOfBirth: parsed.extracted.placeOfBirth,
        issuingAuthority: parsed.extracted.issuingAuthority,
        hasOfficialSeal: parsed.extracted.hasOfficialSeal,
        documentDate: parsed.extracted.documentDate,
        requiredElements: parsed.requiredElements,
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
    result: IdentityResult,
    _logId: string
  ): Promise<void> {
    if (!context.uploadedFileId) {
      throw new Error(
        "uploadedFileId is required for storing identity verification results"
      );
    }

    // Update DocumentValidation with identity result
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
        identityResult: result as any,
        criticalIssues: [
          ...((validation.criticalIssues as any[]) || []),
          ...result.issues.filter((i) => i.severity === "CRITICAL"),
        ],
        warnings: [
          ...((validation.warnings as any[]) || []),
          ...result.issues.filter((i) => i.severity === "WARNING"),
        ],
        suggestions: [
          ...((validation.suggestions as any[]) || []),
          ...result.issues.filter((i) => i.severity === "INFO"),
        ],
      },
    });

    // Update file with extracted data summary
    if (result.data.fullName || result.data.dateOfBirth) {
      await db.uploadedFile.update({
        where: { id: context.uploadedFileId },
        data: {
          extractedDataSummary: {
            fullName: result.data.fullName,
            dateOfBirth: result.data.dateOfBirth,
            placeOfBirth: result.data.placeOfBirth,
            issuingAuthority: result.data.issuingAuthority,
            documentDate: result.data.documentDate,
          },
        },
      });
    }
  }

  private buildSystemPrompt(): string {
    return `You are an identity document verification AI specialized in analyzing birth certificates, death certificates, marriage certificates, and other identity documents for RECA (Radiation Exposure Compensation Act) claims.

Your task is to:
1. Verify the document is a valid identity document
2. Extract key identity information
3. Check for required elements that make the document acceptable for DOJ submission

For RECA claims, identity documents MUST have:
- Full legal name
- Date of birth (for birth certificates) or date of death (for death certificates)
- Official seal or certification stamp from the issuing agency
- Issuing authority clearly stated (e.g., "State of Utah, Department of Health")

Highly valuable but not always required:
- Place of birth (city, county, state) - helps establish residency in covered areas
- Document issue date
- Certificate number

Respond with JSON in this exact format:
{
  "confidence": 0.95,
  "reasoning": "This is a certified birth certificate...",
  "extracted": {
    "fullName": "John Robert Doe",
    "dateOfBirth": "1965-03-15",
    "placeOfBirth": {
      "city": "Salt Lake City",
      "county": "Salt Lake",
      "state": "Utah"
    },
    "issuingAuthority": "Utah Department of Health",
    "hasOfficialSeal": true,
    "documentDate": "2024-01-15",
    "nameConfidence": 0.98,
    "dobConfidence": 0.95
  },
  "requiredElements": {
    "name": "PRESENT",
    "dob": "PRESENT",
    "placeOfBirth": "PRESENT",
    "officialSeal": "PRESENT",
    "issuingAuthority": "PRESENT"
  }
}

For each requiredElement, use:
- "PRESENT" if clearly visible and readable
- "UNCLEAR" if present but hard to read
- "MISSING" if not found`;
  }

  private buildUserPrompt(context: AgentExecutionContext): string {
    let prompt =
      "Please verify this identity document and extract key information:\n\n";

    if (context.documentText) {
      prompt += `Document Text (OCR):\n${context.documentText.slice(0, 12000)}\n\n`;
    } else {
      prompt += `Document URL: ${context.documentUrl}\n\n`;
    }

    prompt += `Analyze this document and provide verification results in JSON format.`;

    return prompt;
  }
}

// Internal response type
interface IdentityAgentResponse {
  confidence: number;
  reasoning: string;
  extracted: {
    fullName: string | null;
    dateOfBirth: string | null;
    placeOfBirth: {
      city?: string;
      county?: string;
      state?: string;
    } | null;
    issuingAuthority: string | null;
    hasOfficialSeal: boolean;
    documentDate: string | null;
    nameConfidence?: number;
    dobConfidence?: number;
  };
  requiredElements: {
    name: "PRESENT" | "MISSING" | "UNCLEAR";
    dob: "PRESENT" | "MISSING" | "UNCLEAR";
    placeOfBirth: "PRESENT" | "MISSING" | "UNCLEAR";
    officialSeal: "PRESENT" | "MISSING" | "UNCLEAR";
    issuingAuthority: "PRESENT" | "MISSING" | "UNCLEAR";
  };
}

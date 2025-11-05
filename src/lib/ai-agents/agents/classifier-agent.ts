/**
 * Classifier Agent
 *
 * Determines the document category (e.g., birth certificate, utility bill, medical record)
 * This is the first agent that runs on any uploaded document.
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type {
  ClassifierResult,
  DocumentCategory,
  Issue,
} from "../types/agent-results";
import { db } from "@/lib/db";
import { FileCategory } from "@prisma/client";

// Mapping from our AI categories to Prisma FileCategory enum
const CATEGORY_MAPPING: Record<DocumentCategory, FileCategory | null> = {
  IDENTITY: FileCategory.IDENTITY,
  PROOF_OF_RESIDENCE: FileCategory.PROOF_OF_RESIDENCE,
  PATHOLOGY_REPORT: FileCategory.PATHOLOGY_REPORT,
  MEDICAL_RECORDS: FileCategory.MEDICAL_RECORDS,
  DISCHARGE_SUMMARY: FileCategory.DISCHARGE_SUMMARY,
  TUMOR_REGISTRY: FileCategory.TUMOR_REGISTRY,
  TREATMENT_RECORDS: FileCategory.TREATMENT_RECORDS,
  UTILITY_BILL: FileCategory.UTILITY_BILL,
  MORTGAGE_STATEMENT: FileCategory.MORTGAGE_STATEMENT,
  TAX_RETURN: FileCategory.TAX_RETURN,
  SCHOOL_RECORDS: FileCategory.SCHOOL_RECORDS,
  EMPLOYMENT_RECORDS: FileCategory.EMPLOYMENT_RECORDS,
  OTHER: FileCategory.OTHER,
};

export class ClassifierAgent extends BaseAgent<ClassifierResult> {
  constructor() {
    super("ClassifierAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 2048,
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<ClassifierResult> {
    const systemPrompt = this.buildSystemPrompt();

    // Check if we have OCR text or need to use vision
    const hasText =
      context.documentText && context.documentText.trim().length > 50;

    let response: string;

    if (hasText) {
      // Strategy 1: Use OCR text (fast, cheap)
      console.log(
        `📄 Using OCR text for classification (${context.documentText!.length} chars)`
      );
      const userPrompt = this.buildUserPrompt(context);
      response = await this.callOpenAI(userPrompt, systemPrompt, context);
    } else {
      // Strategy 2: Fall back to Vision API (slower, more expensive, but works on scanned docs)
      console.log(
        `🔍 OCR text unavailable or insufficient, using Vision API fallback`
      );
      console.log(`📄 Document URL/Key: ${context.documentUrl}`);
      const visionPrompt = this.buildVisionPrompt();

      try {
        // Download the PDF from R2
        const { getObject } = await import("@/lib/r2");
        console.log(`📥 Downloading document from R2...`);
        const pdfBuffer = await getObject(context.documentUrl);

        if (!pdfBuffer) {
          throw new Error("Failed to download document from R2");
        }

        console.log(`✅ Document downloaded (${pdfBuffer.length} bytes)`);

        // Convert PDF to image (Vision API only accepts images)
        const { convertPdfToImage } = await import("../utils/pdf-to-image");
        const imageDataUrl = await convertPdfToImage(pdfBuffer);

        // Call Vision API with image data URL
        response = await this.callOpenAIVision(
          visionPrompt,
          systemPrompt,
          imageDataUrl,
          context
        );
      } catch (error) {
        console.error(`❌ Vision API fallback failed:`, error);
        throw error;
      }
    }

    const parsed = this.parseJSONResponse<ClassifierAgentResponse>(response);

    // Build evidence array
    const evidence = parsed.keyIndicators.map((indicator, index) => ({
      type: "text_indicator",
      description: indicator,
      confidence: parsed.confidence - index * 0.05, // Slightly decreasing confidence
    }));

    // Determine issues
    const issues: Issue[] = [];

    if (parsed.confidence < 0.7) {
      issues.push({
        severity: "WARNING",
        code: "LOW_CLASSIFICATION_CONFIDENCE",
        message: `Classification confidence is low (${(parsed.confidence * 100).toFixed(1)}%)`,
        suggestion: `Document may be ambiguous or unclear. Please verify the category is correct or upload a clearer version.`,
        affectsApproval: false,
      });
    }

    if (parsed.category === "OTHER") {
      issues.push({
        severity: "WARNING",
        code: "UNRECOGNIZED_DOCUMENT_TYPE",
        message: "Document type could not be determined",
        suggestion:
          "Please verify this document is required for RECA claims, or provide additional context.",
        affectsApproval: false,
      });
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence({
      aiConfidence: parsed.confidence,
      dataCompleteness: parsed.keyIndicators.length >= 3 ? 1.0 : 0.7,
      ocrQuality: context.documentText ? 0.9 : 0.7,
    });

    const status = this.determineStatus(
      confidence,
      false, // No critical issues for classifier
      issues.length > 0
    );

    return {
      status,
      confidence,
      data: {
        category: parsed.category,
        confidence: parsed.confidence,
        alternativeCategories: parsed.alternativeCategories,
        reasoning: parsed.reasoning,
        keyIndicators: parsed.keyIndicators,
      },
      evidence,
      reasoning: parsed.reasoning,
      issues,
      processingTimeMs: 0, // Will be set by BaseAgent
      timestamp: new Date(),
    };
  }

  protected async storeResult(
    context: AgentExecutionContext,
    result: ClassifierResult,
    _logId: string
  ): Promise<void> {
    if (!context.uploadedFileId) {
      throw new Error(
        "uploadedFileId is required for storing classification results"
      );
    }

    // Create or update DocumentValidation record
    await db.documentValidation.upsert({
      where: { uploadedFileId: context.uploadedFileId },
      create: {
        uploadedFileId: context.uploadedFileId,
        classifierResult: result as any,
        status: "PROCESSING",
        overallConfidence: result.confidence,
      },
      update: {
        classifierResult: result as any,
        overallConfidence: result.confidence,
      },
    });

    // Update the uploaded file with the detected category
    const prismaCategory = CATEGORY_MAPPING[result.data.category];
    if (prismaCategory && result.status === "PASS") {
      await db.uploadedFile.update({
        where: { id: context.uploadedFileId },
        data: {
          category: prismaCategory,
          customerStatus: "PROCESSING", // Still processing, other agents need to run
        },
      });
    }
  }

  private buildSystemPrompt(): string {
    return `You are a document classification AI specialized in identifying RECA (Radiation Exposure Compensation Act) claim documents.

Your task is to analyze a document and determine its category. You must classify it into ONE of the following categories:

**Identity Documents:**
- IDENTITY: Birth certificates, death certificates, marriage certificates, tribal enrollment

**Residence Proof:**
- PROOF_OF_RESIDENCE: General residence documents
- UTILITY_BILL: Utility bills (electric, gas, water, phone)
- MORTGAGE_STATEMENT: Mortgage statements, property tax records
- TAX_RETURN: Tax returns, W-2 forms
- SCHOOL_RECORDS: School enrollment records, report cards

**Medical Documents:**
- PATHOLOGY_REPORT: Pathology reports, biopsy results
- MEDICAL_RECORDS: General medical records, doctor's notes
- DISCHARGE_SUMMARY: Hospital discharge summaries
- TUMOR_REGISTRY: Cancer registry reports
- TREATMENT_RECORDS: Treatment plans, radiation therapy records

**Employment Documents:**
- EMPLOYMENT_RECORDS: Employment verification, pay stubs, work history, mining records

**Other:**
- OTHER: Document type not recognized or not applicable to RECA claims

You must respond with a JSON object with the following structure:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.95,
  "reasoning": "Explanation of why this category was chosen",
  "keyIndicators": ["List", "of", "key", "text", "indicators"],
  "alternativeCategories": [
    {"category": "ALTERNATIVE_CATEGORY", "confidence": 0.15}
  ]
}

Be thorough but concise. Focus on identifying key elements that definitively categorize the document.`;
  }

  private buildUserPrompt(context: AgentExecutionContext): string {
    let prompt = "Please classify the following document:\n\n";

    if (context.documentText) {
      prompt += `Document Text (from OCR):\n${context.documentText.slice(0, 10000)}\n\n`;
    }

    if (context.metadata) {
      prompt += `Metadata: ${JSON.stringify(context.metadata, null, 2)}\n\n`;
    }

    prompt += `Analyze this document and provide the classification in JSON format.`;

    return prompt;
  }

  private buildVisionPrompt(): string {
    return `Please analyze the document image provided and classify it into one of the RECA claim document categories.

Look carefully at:
- Document headers and titles
- Official seals or letterheads
- Form numbers or document identifiers
- Key content sections
- Dates and names

Provide your classification in the JSON format specified in the system prompt.`;
  }
}

// Internal type for parsing OpenAI response
interface ClassifierAgentResponse {
  category: DocumentCategory;
  confidence: number;
  reasoning: string;
  keyIndicators: string[];
  alternativeCategories: Array<{
    category: DocumentCategory;
    confidence: number;
  }>;
}

/**
 * AI-Powered Document Categorization
 * Uses OpenAI GPT-4 to intelligently categorize documents
 */

import OpenAI from "openai";

// Re-export FileCategory type from our existing system
export type FileCategory =
  | "IDENTITY"
  | "PROOF_OF_RESIDENCE"
  | "PATHOLOGY_REPORT"
  | "MEDICAL_RECORDS"
  | "DISCHARGE_SUMMARY"
  | "TUMOR_REGISTRY"
  | "TREATMENT_RECORDS"
  | "UTILITY_BILL"
  | "MORTGAGE_STATEMENT"
  | "TAX_RETURN"
  | "SCHOOL_RECORDS"
  | "EMPLOYMENT_RECORDS"
  | "OTHER";

export interface CategorizationResult {
  category: FileCategory;
  confidence: number; // 0-1
  reasoning: string;
  alternativeCategories?: Array<{
    category: FileCategory;
    confidence: number;
  }>;
}

export interface DocumentTag {
  tag: string;
  confidence: number;
  description?: string;
}

const CATEGORY_DESCRIPTIONS: Record<FileCategory, string> = {
  IDENTITY:
    "Birth certificates, death certificates, marriage certificates, name change documents, tribal enrollment cards",
  PROOF_OF_RESIDENCE:
    "General proof of residence documents not fitting other categories",
  PATHOLOGY_REPORT: "Pathology reports, biopsy results, lab reports",
  MEDICAL_RECORDS:
    "General medical records, doctor's notes, hospital records, diagnosis documents",
  DISCHARGE_SUMMARY: "Hospital discharge summaries",
  TUMOR_REGISTRY: "State or hospital tumor registry records",
  TREATMENT_RECORDS: "Cancer treatment records, radiation therapy records",
  UTILITY_BILL:
    "Electric bills, gas bills, water bills, phone bills showing residence",
  MORTGAGE_STATEMENT: "Mortgage statements, property deeds, property tax bills",
  TAX_RETURN: "Federal or state tax returns, W-2 forms",
  SCHOOL_RECORDS:
    "School enrollment records, transcripts, report cards showing residence",
  EMPLOYMENT_RECORDS:
    "Employment records, pay stubs, W-2 forms showing work location",
  OTHER: "Documents that don't fit into other categories",
};

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please add it to your .env file."
    );
  }

  return new OpenAI({ apiKey });
}

/**
 * Categorize document using AI based on extracted text and filename
 */
export async function categorizeDocument(
  extractedText: string,
  fileName: string,
  existingCategory?: FileCategory
): Promise<CategorizationResult> {
  const openai = getOpenAIClient();

  // Build the prompt
  const systemPrompt = `You are an expert document classifier for RECA (Radiation Exposure Compensation Act) claims.
Your job is to categorize documents into one of the following categories:

${Object.entries(CATEGORY_DESCRIPTIONS)
  .map(([category, description]) => `- ${category}: ${description}`)
  .join("\n")}

Analyze the document text and filename provided, and return:
1. The most appropriate category
2. Your confidence level (0-100)
3. Brief reasoning for your classification
4. Up to 2 alternative categories if applicable

Be especially careful to distinguish between:
- IDENTITY documents (vital records like birth/death certificates)
- MEDICAL_RECORDS (general medical documents)
- PATHOLOGY_REPORT (specific lab/biopsy results)
- PROOF_OF_RESIDENCE (documents showing where someone lived)

Return your response as a JSON object with this structure:
{
  "category": "CATEGORY_NAME",
  "confidence": 95,
  "reasoning": "Brief explanation",
  "alternatives": [
    { "category": "ALTERNATIVE_CATEGORY", "confidence": 60 }
  ]
}`;

  const userPrompt = `Filename: ${fileName}

Document Text (first 2000 characters):
${extractedText.substring(0, 2000)}

${existingCategory ? `\nPreviously suggested category: ${existingCategory}` : ""}

Please categorize this document.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cost-effective
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent categorization
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);

    return {
      category: result.category as FileCategory,
      confidence: (result.confidence || 50) / 100, // Convert to 0-1
      reasoning: result.reasoning || "AI categorization",
      alternativeCategories: result.alternatives
        ? result.alternatives.map(
            (alt: { category: FileCategory; confidence: number }) => ({
              category: alt.category,
              confidence: alt.confidence / 100,
            })
          )
        : undefined,
    };
  } catch (error) {
    console.error("AI categorization failed:", error);

    // Fallback to existing category or OTHER
    return {
      category: existingCategory || "OTHER",
      confidence: existingCategory ? 0.6 : 0.3,
      reasoning: `AI categorization failed: ${error instanceof Error ? error.message : "Unknown error"}. ${existingCategory ? "Using previously suggested category." : "Defaulting to OTHER."}`,
    };
  }
}

/**
 * Generate intelligent tags for a document based on content and quality
 */
export async function generateDocumentTags(
  extractedText: string,
  fileName: string,
  category: FileCategory,
  qualityScore: number
): Promise<DocumentTag[]> {
  const tags: DocumentTag[] = [];

  // Quality-based tags
  if (qualityScore >= 0.9) {
    tags.push({
      tag: "excellent_quality",
      confidence: 1.0,
      description: "Document has excellent scan quality",
    });
  } else if (qualityScore < 0.6) {
    tags.push({
      tag: "poor_quality",
      confidence: 1.0,
      description: "Document quality is poor - consider rescanning",
    });
  } else if (qualityScore < 0.8) {
    tags.push({
      tag: "acceptable_quality",
      confidence: 1.0,
      description: "Document quality is acceptable but could be improved",
    });
  }

  // Content-based tags using simple heuristics
  const textLower = extractedText.toLowerCase();

  // Check for completeness
  if (extractedText.length < 50) {
    tags.push({
      tag: "minimal_text",
      confidence: 1.0,
      description: "Very little text detected - may be incomplete or blank",
    });
  }

  // Check for specific requirements based on category
  if (category === "IDENTITY") {
    const hasDate = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(extractedText);
    const hasName = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(extractedText);
    const hasCertified =
      textLower.includes("certified") || textLower.includes("registrar");

    if (!hasDate) {
      tags.push({
        tag: "missing_date",
        confidence: 0.8,
        description: "Date not clearly visible",
      });
    }

    if (!hasName) {
      tags.push({
        tag: "missing_name",
        confidence: 0.7,
        description: "Name not clearly visible",
      });
    }

    if (!hasCertified) {
      tags.push({
        tag: "uncertified_copy",
        confidence: 0.6,
        description:
          "May not be a certified copy - original may be required for submission",
      });
    } else {
      tags.push({
        tag: "appears_certified",
        confidence: 0.7,
        description: "Appears to be a certified copy",
      });
    }
  }

  if (category === "MEDICAL_RECORDS" || category === "PATHOLOGY_REPORT") {
    const hasDiagnosis =
      textLower.includes("diagnosis") ||
      textLower.includes("cancer") ||
      textLower.includes("tumor") ||
      textLower.includes("carcinoma") ||
      textLower.includes("malignant");

    if (hasDiagnosis) {
      tags.push({
        tag: "contains_diagnosis",
        confidence: 0.9,
        description: "Document contains diagnostic information",
      });
    }

    const hasPhysician =
      textLower.includes("dr.") ||
      textLower.includes("physician") ||
      textLower.includes("doctor") ||
      textLower.includes("m.d.");

    if (hasPhysician) {
      tags.push({
        tag: "physician_signed",
        confidence: 0.7,
        description: "Document appears to be signed by a physician",
      });
    }
  }

  if (
    category === "PROOF_OF_RESIDENCE" ||
    category === "UTILITY_BILL" ||
    category === "MORTGAGE_STATEMENT"
  ) {
    // Check for address
    const hasAddress = /\d+\s+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/.test(
      extractedText
    );
    const hasDateRange = (extractedText.match(/\d{4}/g)?.length ?? 0) >= 2;

    if (hasAddress) {
      tags.push({
        tag: "address_visible",
        confidence: 0.8,
        description: "Address is clearly visible",
      });
    } else {
      tags.push({
        tag: "address_unclear",
        confidence: 0.7,
        description: "Address is not clearly visible - may need clearer scan",
      });
    }

    if (hasDateRange) {
      tags.push({
        tag: "dated_document",
        confidence: 0.8,
        description: "Document shows date/time period",
      });
    }
  }

  // AI-powered tagging for more complex analysis
  try {
    const aiTags = await generateAITags(extractedText, fileName, category);
    tags.push(...aiTags);
  } catch (error) {
    console.error("AI tag generation failed:", error);
    // Continue with rule-based tags only
  }

  return tags;
}

/**
 * Use AI to generate additional sophisticated tags
 */
async function generateAITags(
  extractedText: string,
  fileName: string,
  category: FileCategory
): Promise<DocumentTag[]> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are an expert document reviewer for RECA claims.
Analyze the document and identify any potential issues, missing information, or notable features.

Return a JSON array of tags, each with:
- tag: short slug (e.g., "needs_signature", "redaction_required", "multiple_pages")
- confidence: 0-100
- description: brief explanation

Focus on practical issues that would matter for a legal claim submission.`;

  const userPrompt = `Category: ${category}
Filename: ${fileName}

Text (first 1500 chars):
${extractedText.substring(0, 1500)}

Identify any issues or notable features.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const result = JSON.parse(content);
    const tags = result.tags || [];

    return tags.map(
      (tag: { tag: string; confidence: number; description: string }) => ({
        tag: tag.tag,
        confidence: (tag.confidence || 50) / 100,
        description: tag.description,
      })
    );
  } catch (error) {
    console.error("AI tag generation failed:", error);
    return [];
  }
}

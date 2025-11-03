import OpenAI from "openai";
import { FileCategory } from "./ai-categorization";

export type OtherDocumentRelevance = "HIGH" | "MEDIUM" | "LOW";

export interface OtherDocumentAnalysis {
  isPotentiallySupporting: boolean;
  likelyRelevance: OtherDocumentRelevance;
  suggestions: string[];
  possibleCategories: FileCategory[];
}

const SUPPORTED_FILE_CATEGORIES: FileCategory[] = [
  "IDENTITY",
  "PROOF_OF_RESIDENCE",
  "PATHOLOGY_REPORT",
  "MEDICAL_RECORDS",
  "DISCHARGE_SUMMARY",
  "TUMOR_REGISTRY",
  "TREATMENT_RECORDS",
  "UTILITY_BILL",
  "MORTGAGE_STATEMENT",
  "TAX_RETURN",
  "SCHOOL_RECORDS",
  "EMPLOYMENT_RECORDS",
  "OTHER",
];

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please add it to your environment to analyze 'OTHER' documents."
    );
  }

  return new OpenAI({ apiKey });
}

function buildFallbackAnalysis(text: string): OtherDocumentAnalysis {
  const normalized = text.toLowerCase();
  const exposureKeywords = [
    "radiation",
    "nuclear",
    "uranium",
    "fallout",
    "atomic",
    "diagnosis",
    "cancer",
    "residence",
    "address",
    "county",
    "employment",
    "mine",
    "mill",
  ];

  const isSupporting = exposureKeywords.some((keyword) =>
    normalized.includes(keyword)
  );

  if (isSupporting) {
    return {
      isPotentiallySupporting: true,
      likelyRelevance: "MEDIUM",
      suggestions: [
        "Review this document to see if it should be categorized under a specific requirement (identity, medical, residence, or employment).",
        "If it helps prove exposure or diagnosis, consider re-uploading under the matching category.",
      ],
      possibleCategories: [],
    };
  }

  return {
    isPotentiallySupporting: false,
    likelyRelevance: "LOW",
    suggestions: [
      "This document does not appear to support the claim. You can delete it or keep it outside the required checklist.",
    ],
    possibleCategories: [],
  };
}

/**
 * Analyze \"OTHER\" category documents to determine if they may provide supporting context.
 *
 * Falls back to keyword heuristics when OpenAI is unavailable or the request fails.
 */
export async function analyzeOtherDocument(
  ocrText: string,
  fileName: string
): Promise<OtherDocumentAnalysis> {
  const trimmedText = (ocrText || "").trim();
  if (!trimmedText) {
    return {
      isPotentiallySupporting: false,
      likelyRelevance: "LOW",
      suggestions: [
        "Document has no text to analyze. Delete it or replace with a clearer upload.",
      ],
      possibleCategories: [],
    };
  }

  try {
    const openai = getOpenAIClient();
    const systemPrompt =
      "You are a document triage assistant for RECA claims. Determine whether an uncategorized document might still support the claim.";
    const userPrompt = `
This document was uploaded as \"OTHER\" because the AI could not confidently match a RECA document type.

Please analyze the content and answer as JSON with the structure:
{
  "isPotentiallySupporting": boolean,
  "likelyRelevance": "HIGH" | "MEDIUM" | "LOW",
  "suggestions": string[],
  "possibleCategories": string[]
}

Guidance:
- Return true for \"isPotentiallySupporting\" only if the document clearly references exposure, medical treatment, residence, or employment relevant to RECA.
- \"possibleCategories\" should list likely RECA document categories (IDENTITY, PROOF_OF_RESIDENCE, MEDICAL_RECORDS, PATHOLOGY_REPORT, UTILITY_BILL, EMPLOYMENT_RECORDS, etc.) if applicable.
- Keep suggestions concise and actionable for a claimant.

Filename: ${fileName}
Content (first 1200 characters):
${trimmedText.substring(0, 1200)}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const parsed = JSON.parse(content) as {
      isPotentiallySupporting?: boolean;
      likelyRelevance?: OtherDocumentRelevance;
      suggestions?: string[];
      possibleCategories?: string[];
    };

    const possibleCategories =
      parsed.possibleCategories?.filter((category): category is FileCategory =>
        Boolean(
          category &&
            SUPPORTED_FILE_CATEGORIES.includes(category as FileCategory)
        )
      ) ?? [];

    return {
      isPotentiallySupporting:
        parsed.isPotentiallySupporting ?? possibleCategories.length > 0,
      likelyRelevance: parsed.likelyRelevance ?? "MEDIUM",
      suggestions:
        parsed.suggestions && parsed.suggestions.length > 0
          ? parsed.suggestions
          : [
              "Review this upload manually and recategorize it if it matches a required document type.",
            ],
      possibleCategories,
    };
  } catch (error) {
    console.error("OTHER document analysis failed:", error);
    return buildFallbackAnalysis(trimmedText);
  }
}

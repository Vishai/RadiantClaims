/**
 * Entity Extraction using GPT-4o
 * Extracts structured data (names, dates, addresses, medical info, employment) from OCR text
 */

import OpenAI from "openai";
import { FileCategory } from "./ai-categorization";
import {
  EntityExtractionResult,
  ENTITY_EXTRACTION_JSON_SCHEMA,
} from "./schemas/entity-schema";

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
 * Extract entities from OCR text using GPT-4o with structured outputs
 *
 * @param ocrText - The full OCR text extracted from the document
 * @param documentType - The document category to help guide extraction
 * @param pageCount - Number of pages in the document (for page references)
 * @returns Structured entity extraction result
 */
export async function extractEntities(
  ocrText: string,
  documentType: FileCategory,
  pageCount: number = 1
): Promise<EntityExtractionResult> {
  // Guard: skip extraction if OCR text is too short to contain meaningful data.
  // This prevents GPT-4o from hallucinating placeholder entities when given empty input.
  const trimmedText = ocrText.trim();
  if (trimmedText.length < 50) {
    console.warn(
      `⚠️ Skipping entity extraction: insufficient OCR text (${trimmedText.length} chars). ` +
        "Returning empty entities to avoid hallucination."
    );
    return {
      persons: [],
      dates: [],
      addresses: [],
      medical: [],
      employment: [],
    };
  }

  const openai = getOpenAIClient();

  // Build context-aware system prompt based on document type
  const systemPrompt = buildSystemPrompt(documentType);
  const userPrompt = buildUserPrompt(ocrText, documentType, pageCount);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for better accuracy than gpt-4o-mini
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // Very low temperature for consistent, factual extraction
      response_format: {
        type: "json_schema",
        json_schema: ENTITY_EXTRACTION_JSON_SCHEMA,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result: EntityExtractionResult = JSON.parse(content);

    // Post-process to ensure quality
    return validateAndCleanEntities(result);
  } catch (error) {
    console.error("Entity extraction failed:", error);

    // Return empty result on failure rather than crashing
    return {
      persons: [],
      dates: [],
      addresses: [],
      medical: [],
      employment: [],
    };
  }
}

/**
 * Build system prompt tailored to document type
 */
function buildSystemPrompt(documentType: FileCategory): string {
  const basePrompt = `You are an expert data extraction system for RECA (Radiation Exposure Compensation Act) claims.
Your job is to extract structured information from the provided document text with high accuracy.

CRITICAL RULES:
- ONLY extract information that is EXPLICITLY present in the document text below.
- NEVER invent, guess, or hallucinate data. If information is not in the text, return empty arrays.
- If the document text is empty, very short, or unreadable, return empty arrays for ALL entity types.
- Do NOT use placeholder names like "John Doe", "Jane Doe", or generic addresses like "123 Main St".
- Do NOT generate example data. Only extract what you can directly quote from the text.

Extract the following entities:
1. **Persons**: Names of claimants, witnesses, doctors, employers, family members
2. **Dates**: Birth dates, death dates, exposure periods, diagnosis dates, employment dates, residence dates
3. **Addresses**: Residences, workplaces, schools, medical facilities (include county when possible)
4. **Medical**: Diagnoses, facilities, doctors, dates, ICD codes if present
5. **Employment**: Employers, job titles, locations, dates, nuclear facility involvement

Key Requirements:
- Be extremely accurate - only extract information you can point to in the actual text
- Include page numbers for all entities (estimate based on text position if not explicit)
- For dates, use ISO 8601 format (YYYY-MM-DD) or partial dates (YYYY-MM, YYYY)
- For addresses, extract county information - this is critical for RECA jurisdiction checks
- Set confidence scores: 0.9+ for explicit verbatim info, 0.7-0.9 for inferred from context, below 0.7 for uncertain
- If the text quality is poor or ambiguous, prefer returning fewer entities with lower confidence over guessing`;

  // Add document-specific guidance
  const specificGuidance: Record<FileCategory, string> = {
    IDENTITY: `
This is an IDENTITY document (birth/death certificate, etc.).
Focus on:
- Full legal names
- Birth/death dates
- Places of birth/death with county
- Parents' names
- Any name changes`,

    MEDICAL_RECORDS: `
This is a MEDICAL RECORD.
Focus on:
- Patient name (claimant)
- Diagnoses (especially cancers and covered diseases)
- Treating physicians and facilities
- Diagnosis and treatment dates
- ICD codes if present`,

    PATHOLOGY_REPORT: `
This is a PATHOLOGY REPORT.
Focus on:
- Patient name
- Specific diagnosis (cancer type, stage)
- Pathologist name
- Medical facility
- Biopsy/test dates
- ICD-10 codes`,

    PROOF_OF_RESIDENCE: `
This is a PROOF OF RESIDENCE document.
Focus on:
- Resident name(s)
- Full address with county and state
- Date range of residence
- Any other persons mentioned`,

    UTILITY_BILL: `
This is a UTILITY BILL (proof of residence).
Focus on:
- Account holder name
- Service address with county
- Bill dates and service periods`,

    MORTGAGE_STATEMENT: `
This is a MORTGAGE STATEMENT.
Focus on:
- Borrower name(s)
- Property address with county
- Loan dates and periods`,

    TAX_RETURN: `
This is a TAX RETURN.
Focus on:
- Taxpayer name(s)
- Filing address with county
- Tax year
- Any employment information`,

    SCHOOL_RECORDS: `
This is a SCHOOL RECORD.
Focus on:
- Student name
- School name and location (with county)
- Enrollment dates/academic years
- Parents/guardians if mentioned`,

    EMPLOYMENT_RECORDS: `
This is an EMPLOYMENT RECORD.
Focus on:
- Employee name
- Employer name and location
- Job title
- Employment dates
- NOTE: Flag if employer is Nevada Test Site, Pacific Proving Grounds, or other nuclear facility`,

    DISCHARGE_SUMMARY: `
This is a DISCHARGE SUMMARY.
Focus on:
- Patient name
- Hospital/facility
- Admission and discharge dates
- Diagnoses
- Treating physicians`,

    TUMOR_REGISTRY: `
This is a TUMOR REGISTRY record.
Focus on:
- Patient name
- Cancer diagnosis and type
- Diagnosis date
- Reporting facility
- ICD codes`,

    TREATMENT_RECORDS: `
This is a TREATMENT RECORD.
Focus on:
- Patient name
- Treatment type (radiation, chemo, surgery)
- Treatment dates
- Facility and physicians
- Cancer diagnosis`,

    OTHER: `
This document doesn't fit standard categories.
Extract any relevant information about:
- Names
- Dates
- Addresses
- Medical information
- Employment history`,
  };

  return basePrompt + "\n\n" + (specificGuidance[documentType] || "");
}

/**
 * Build user prompt with OCR text
 */
function buildUserPrompt(
  ocrText: string,
  documentType: FileCategory,
  pageCount: number
): string {
  // Limit text to avoid token limits (GPT-4o can handle ~128k tokens, but be conservative)
  const maxChars = 10000;
  const truncatedText =
    ocrText.length > maxChars
      ? ocrText.substring(0, maxChars) + "\n\n[Text truncated...]"
      : ocrText;

  return `Document Type: ${documentType}
Page Count: ${pageCount}

Document Text:
---
${truncatedText}
---

Extract all entities from the text above. ONLY extract information that appears verbatim or can be directly inferred from the text. If the text is empty or too short to contain meaningful data, return empty arrays for all entity types. Do NOT make up or guess any data.`;
}

/**
 * Validate and clean extracted entities
 */
function validateAndCleanEntities(
  result: EntityExtractionResult
): EntityExtractionResult {
  // Use higher confidence threshold (0.6) to filter out hallucinated data.
  // Hallucinated entities typically get 0.5-0.7 confidence when text is sparse.
  const MIN_CONFIDENCE = 0.6;

  // Also filter out obvious placeholder names
  const PLACEHOLDER_NAMES = new Set([
    "john doe",
    "jane doe",
    "richard roe",
    "john smith",
    "jane smith",
    "n/a",
    "unknown",
    "test",
    "sample",
  ]);

  return {
    persons: result.persons.filter(
      (p) =>
        p.name &&
        p.name.length > 1 &&
        p.confidence >= MIN_CONFIDENCE &&
        !PLACEHOLDER_NAMES.has(p.name.toLowerCase().trim())
    ),
    dates: result.dates
      .filter((d) => d.value && d.confidence >= MIN_CONFIDENCE)
      .map((d) => ({
        ...d,
        value: normalizeDate(d.value),
      })),
    addresses: result.addresses.filter(
      (a) =>
        a.full_address &&
        a.full_address.length > 5 &&
        a.confidence >= MIN_CONFIDENCE &&
        !a.full_address.toLowerCase().includes("123 main st")
    ),
    medical: result.medical.filter((m) => m.confidence >= MIN_CONFIDENCE),
    employment: result.employment.filter(
      (e) =>
        e.employer && e.employer.length > 1 && e.confidence >= MIN_CONFIDENCE
    ),
  };
}

/**
 * Normalize date strings to ISO 8601 format or partial date format
 */
function normalizeDate(dateStr: string): string {
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}$/.test(dateStr)) return dateStr;

  // Try to parse common formats
  // MM/DD/YYYY or M/D/YYYY
  const match1 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match1 && match1[1] && match1[2] && match1[3]) {
    const month = match1[1];
    const day = match1[2];
    const year = match1[3];
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // YYYY/MM/DD
  const match2 = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match2 && match2[1] && match2[2] && match2[3]) {
    const year = match2[1];
    const month = match2[2];
    const day = match2[3];
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Month DD, YYYY (e.g., "January 15, 2020")
  const match3 = dateStr.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})$/i
  );
  if (match3 && match3[1] && match3[2] && match3[3]) {
    const monthName = match3[1];
    const day = match3[2];
    const year = match3[3];
    const months: Record<string, string> = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
    };
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }

  // If we can't parse it, return as-is
  return dateStr;
}

/**
 * Extract entities from multiple documents in batch
 * (Future optimization for processing entire claim folder at once)
 */
export async function extractEntitiesBatch(
  documents: Array<{
    ocrText: string;
    documentType: FileCategory;
    pageCount: number;
  }>
): Promise<EntityExtractionResult[]> {
  // Process in parallel with rate limiting
  const results: EntityExtractionResult[] = [];

  for (const doc of documents) {
    try {
      const result = await extractEntities(
        doc.ocrText,
        doc.documentType,
        doc.pageCount
      );
      results.push(result);
    } catch (error) {
      console.error("Batch entity extraction failed for document:", error);
      results.push({
        persons: [],
        dates: [],
        addresses: [],
        medical: [],
        employment: [],
      });
    }
  }

  return results;
}

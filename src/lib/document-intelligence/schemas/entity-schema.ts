/**
 * Entity Extraction Schema
 * Defines TypeScript types for structured data extracted from RECA documents
 */

/**
 * Person entity - claimant, witness, doctor, employer, etc.
 */
export interface PersonEntity {
  name: string;
  role:
    | "claimant"
    | "witness"
    | "doctor"
    | "employer"
    | "family_member"
    | "other";
  confidence: number; // 0-1
  mentions: Array<{
    page: number;
    context: string; // Surrounding text for verification
  }>;
}

/**
 * Date entity - birth, exposure, diagnosis, etc.
 */
export interface DateEntity {
  label:
    | "birth_date"
    | "death_date"
    | "exposure_start"
    | "exposure_end"
    | "diagnosis_date"
    | "treatment_date"
    | "employment_start"
    | "employment_end"
    | "residence_start"
    | "residence_end"
    | "other";
  value: string; // ISO 8601 format (YYYY-MM-DD) or partial date
  confidence: number;
  page: number;
  context?: string; // Surrounding text
}

/**
 * Address entity - residence, work, school
 */
export interface AddressEntity {
  label: "residence" | "work" | "school" | "medical_facility" | "other";
  full_address: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  years?: string; // e.g., "1951-1958" or "1955"
  confidence: number;
  page: number;
}

/**
 * Medical record entity - diagnosis, treatment, facility
 */
export interface MedicalEntity {
  diagnosis?: string;
  icd_code?: string; // ICD-10 or ICD-9 code
  facility?: string;
  doctor?: string;
  diagnosis_date?: string; // ISO 8601
  treatment_dates?: string[]; // Array of ISO 8601 dates
  notes?: string;
  confidence: number;
  page: number;
}

/**
 * Employment record entity
 */
export interface EmploymentEntity {
  employer: string;
  job_title?: string;
  location?: string;
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  nuclear_facility?: boolean; // For RECA onsite participant claims
  confidence: number;
  page: number;
}

/**
 * Complete entity extraction result
 */
export interface EntityExtractionResult {
  persons: PersonEntity[];
  dates: DateEntity[];
  addresses: AddressEntity[];
  medical: MedicalEntity[];
  employment: EmploymentEntity[];
}

/**
 * JSON Schema for GPT-4o structured output
 * This ensures the AI returns data in the exact format we need
 */
export const ENTITY_EXTRACTION_JSON_SCHEMA = {
  name: "entity_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      persons: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: {
              type: "string",
              enum: [
                "claimant",
                "witness",
                "doctor",
                "employer",
                "family_member",
                "other",
              ],
            },
            confidence: { type: "number" },
            mentions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  context: { type: "string" },
                },
                required: ["page", "context"],
                additionalProperties: false,
              },
            },
          },
          required: ["name", "role", "confidence", "mentions"],
          additionalProperties: false,
        },
      },
      dates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              enum: [
                "birth_date",
                "death_date",
                "exposure_start",
                "exposure_end",
                "diagnosis_date",
                "treatment_date",
                "employment_start",
                "employment_end",
                "residence_start",
                "residence_end",
                "other",
              ],
            },
            value: { type: "string" },
            confidence: { type: "number" },
            page: { type: "number" },
            context: { type: "string" },
          },
          required: ["label", "value", "confidence", "page", "context"],
          additionalProperties: false,
        },
      },
      addresses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              enum: [
                "residence",
                "work",
                "school",
                "medical_facility",
                "other",
              ],
            },
            full_address: { type: "string" },
            street: { type: ["string", "null"] },
            city: { type: ["string", "null"] },
            county: { type: ["string", "null"] },
            state: { type: ["string", "null"] },
            zip: { type: ["string", "null"] },
            years: { type: ["string", "null"] },
            confidence: { type: "number" },
            page: { type: "number" },
          },
          required: [
            "label",
            "full_address",
            "street",
            "city",
            "county",
            "state",
            "zip",
            "years",
            "confidence",
            "page",
          ],
          additionalProperties: false,
        },
      },
      medical: {
        type: "array",
        items: {
          type: "object",
          properties: {
            diagnosis: { type: ["string", "null"] },
            icd_code: { type: ["string", "null"] },
            facility: { type: ["string", "null"] },
            doctor: { type: ["string", "null"] },
            diagnosis_date: { type: ["string", "null"] },
            treatment_dates: {
              type: "array",
              items: { type: "string" },
            },
            notes: { type: ["string", "null"] },
            confidence: { type: "number" },
            page: { type: "number" },
          },
          required: [
            "diagnosis",
            "icd_code",
            "facility",
            "doctor",
            "diagnosis_date",
            "treatment_dates",
            "notes",
            "confidence",
            "page",
          ],
          additionalProperties: false,
        },
      },
      employment: {
        type: "array",
        items: {
          type: "object",
          properties: {
            employer: { type: "string" },
            job_title: { type: ["string", "null"] },
            location: { type: ["string", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            nuclear_facility: { type: ["boolean", "null"] },
            confidence: { type: "number" },
            page: { type: "number" },
          },
          required: [
            "employer",
            "job_title",
            "location",
            "start_date",
            "end_date",
            "nuclear_facility",
            "confidence",
            "page",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["persons", "dates", "addresses", "medical", "employment"],
    additionalProperties: false,
  },
};

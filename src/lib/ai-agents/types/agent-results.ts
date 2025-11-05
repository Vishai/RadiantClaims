/**
 * AI Agent Result Types
 *
 * These types define the structure of AI agent outputs that are stored in the database.
 * Based on the DATABASE_SCHEMA.md specification.
 */

// Common types used across all agents
export type AgentStatus = "PASS" | "FAIL" | "NEEDS_REVIEW" | "ERROR";

export interface Evidence {
  type: string;
  description: string;
  location?: string; // Page number, coordinates, etc.
  confidence: number; // 0-1
  extractedText?: string;
}

export interface Issue {
  severity: "CRITICAL" | "WARNING" | "INFO";
  code: string; // e.g., "MISSING_SIGNATURE", "UNCLEAR_TEXT"
  message: string;
  suggestion: string;
  affectsApproval: boolean;
  field?: string; // Which field is affected
  location?: string; // Where in document (page, line)
}

// Base result interface that all agents extend
export interface BaseAgentResult {
  status: AgentStatus;
  confidence: number; // 0-1
  evidence: Evidence[];
  reasoning: string;
  issues: Issue[];
  processingTimeMs: number;
  timestamp: Date;
}

// ============================================================================
// Classifier Agent Result
// ============================================================================

export interface ClassifierResult extends BaseAgentResult {
  data: {
    category: DocumentCategory;
    confidence: number;
    alternativeCategories: Array<{
      category: DocumentCategory;
      confidence: number;
    }>;
    reasoning: string;
    keyIndicators: string[];
  };
}

export type DocumentCategory =
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

// ============================================================================
// Identity Verification Agent Result
// ============================================================================

export interface IdentityResult extends BaseAgentResult {
  data: {
    isValid: boolean;
    fullName: string | null;
    dateOfBirth: string | null; // ISO date string
    placeOfBirth: {
      city?: string;
      county?: string;
      state?: string;
    } | null;
    issuingAuthority: string | null;
    hasOfficialSeal: boolean;
    documentDate: string | null; // ISO date string
    requiredElements: {
      name: "PRESENT" | "MISSING" | "UNCLEAR";
      dob: "PRESENT" | "MISSING" | "UNCLEAR";
      placeOfBirth: "PRESENT" | "MISSING" | "UNCLEAR";
      officialSeal: "PRESENT" | "MISSING" | "UNCLEAR";
      issuingAuthority: "PRESENT" | "MISSING" | "UNCLEAR";
    };
  };
}

// ============================================================================
// Medical Compliance Agent Result
// ============================================================================

export interface MedicalResult extends BaseAgentResult {
  data: {
    isRECAEligible: boolean;
    detectedDiseases: Array<{
      name: string;
      code?: string; // ICD code if available
      isRECACovered: boolean;
      confidence: number;
    }>;
    diagnosisDate: string | null; // ISO date string
    diagnosingPhysician: string | null;
    medicalFacility: string | null;
    hasPathologyReport: boolean;
    hasTreatmentRecords: boolean;
    requiredDocumentsPresent: {
      pathologyReport: boolean;
      diagnosisDocumentation: boolean;
      treatmentRecords: boolean;
    };
  };
}

// ============================================================================
// Residence Proof Agent Result
// ============================================================================

export interface ResidenceResult extends BaseAgentResult {
  data: {
    isValidProof: boolean;
    address: {
      street?: string;
      city?: string;
      county?: string;
      state?: string;
      zipCode?: string;
    } | null;
    residencePeriod: {
      startDate?: string; // ISO date string
      endDate?: string; // ISO date string
      isOngoing?: boolean;
    } | null;
    inCoveredArea: boolean;
    coveredCounty: string | null; // Which RECA-covered county
    documentDate: string | null; // ISO date string
    documentType: string; // e.g., "utility bill", "tax return"
  };
}

// ============================================================================
// Employment Verification Agent Result
// ============================================================================

export interface EmploymentResult extends BaseAgentResult {
  data: {
    isQualifyingEmployment: boolean;
    employerName: string | null;
    facilityName: string | null;
    isNuclearFacility: boolean;
    isCoveredFacility: boolean; // Is it on the DOE facility list
    employmentPeriod: {
      startDate?: string; // ISO date string
      endDate?: string; // ISO date string
    } | null;
    jobTitle: string | null;
    occupationalExposure: {
      detected: boolean;
      type?: string; // "uranium mining", "onsite participant", etc.
      confidence: number;
    };
  };
}

// ============================================================================
// Data Extraction Agent Result
// ============================================================================

export interface DataExtractionResult extends BaseAgentResult {
  data: {
    // Extracted data consolidated from all documents
    personalInfo: {
      fullName?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      dateOfBirth?: string; // ISO date string
      ssn?: string; // Last 4 digits only
      placeOfBirth?: {
        city?: string;
        county?: string;
        state?: string;
      };
    };
    addresses: Array<{
      type: "current" | "previous" | "exposure";
      street?: string;
      city?: string;
      county?: string;
      state?: string;
      zipCode?: string;
      startDate?: string; // ISO date string
      endDate?: string; // ISO date string
    }>;
    medicalInfo: {
      diagnosis?: string;
      diagnosisDate?: string; // ISO date string
      treatingPhysician?: string;
      facility?: string;
    };
    employmentInfo: {
      employer?: string;
      facility?: string;
      startDate?: string; // ISO date string
      endDate?: string; // ISO date string
      jobTitle?: string;
    };
    // Form field mappings for RECA form pre-fill
    formFieldMappings: Record<string, string | number | boolean>;
  };
}

// ============================================================================
// Completeness Orchestrator Result (Claim-level)
// ============================================================================

export interface CompletenessResult {
  readinessScore: number; // 0-100
  isReadyForSubmission: boolean;
  completeness: {
    sections: Array<{
      category: string; // e.g., "Identity Documents"
      required: boolean;
      minDocuments: number;
      currentDocuments: number;
      status: "COMPLETE" | "INCOMPLETE" | "NEEDS_REVIEW";
      documents: Array<{
        fileId: string;
        fileName: string;
        status: "VERIFIED" | "NEEDS_REVIEW" | "PROCESSING";
      }>;
    }>;
    overallPercent: number; // 0-100
  };
  criticalBlockers: Issue[];
  warnings: Issue[];
  crossDocumentValidation: {
    nameConsistent: boolean;
    datesConsistent: boolean;
    addressesConsistent: boolean;
    detectedClaimType?: string;
    claimTypeConfidence?: number;
  };
  recommendations: string[];
  estimatedApprovalProbability?: number; // 0-1
}

// ============================================================================
// Staff Override Types
// ============================================================================

export interface StaffOverride {
  documentId: string;
  agentName: string;
  originalDecision: AgentStatus;
  newDecision: "PASS" | "FAIL";
  reasoning: string;
  overriddenBy: string; // User ID
  overriddenAt: Date;
}

export interface StaffDecision {
  decision: "APPROVED" | "REJECTED" | "NEEDS_INFO";
  reasoning: string;
  requestedDocuments?: string[]; // Document types needed
  notes?: string;
  decidedBy: string; // User ID
  decidedAt: Date;
}

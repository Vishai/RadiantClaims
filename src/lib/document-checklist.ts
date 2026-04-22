/**
 * Document checklist configuration for Step 2 intake
 * Defines required documents, tips, and validation rules
 */

import { FileCategory } from "./intake-upload";

export interface DocumentRequirement {
  category: FileCategory;
  title: string;
  description: string;
  minRequired: number;
  maxAllowed: number;
  isRequired: boolean;
  requiresOriginal: boolean; // Must be mailed as certified/original
  tips: string[];
  examples: string[];
  timeframeNote?: string;
  originalNote?: string; // Note about original document requirements
  validationRules?: {
    mustShowNameAndAddress?: boolean;
    mustBeWithinDateRange?: {
      start: string; // e.g., "1951-01-01"
      end: string; // e.g., "1962-12-31"
    };
  };
}

export interface ChecklistSection {
  id: string;
  title: string;
  description: string;
  headerTip?: string; // Optional tooltip shown as info icon in section header
  requirements: DocumentRequirement[];
}

/**
 * RECA Timeframes (Radiation Exposure Compensation Act)
 * - Atmospheric test period: 1951-1962
 * - Underground test period: 1963-1992 (for certain areas)
 */
export const RECA_ATMOSPHERIC_PERIOD = {
  start: "1951-01-01",
  end: "1962-12-31",
  label: "1951-1962",
};

export const RECA_UNDERGROUND_PERIOD = {
  start: "1963-01-01",
  end: "1992-12-31",
  label: "1963-1992",
};

/**
 * Full document checklist for RECA claims
 */
export const DOCUMENT_CHECKLIST: ChecklistSection[] = [
  {
    id: "identity",
    title: "Identity Verification",
    description:
      "Upload 1 government-issued photo ID. If filing online, upload a scan; DOJ may request a certified/notarized copy later.",
    requirements: [
      {
        category: "IDENTITY",
        title: "Government-Issued Photo ID",
        description: "Driver's license, passport, or state ID card",
        minRequired: 1,
        maxAllowed: 2,
        isRequired: true,
        requiresOriginal: true,
        originalNote:
          "A certified or notarized copy may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Make sure your ID is current and not expired",
          "Ensure all text is clearly readable",
          "Include both front and back if applicable",
        ],
        examples: [
          "Driver's License (front & back)",
          "Passport (photo page)",
          "State-issued ID card",
        ],
      },
    ],
  },
  {
    id: "residence",
    title: "Proof of Residence (1951-1962)",
    description:
      "Upload at least 2 different documents showing you lived in an eligible county during 1951-1962. Choose from the document types below.",
    headerTip:
      "The Church of Jesus Christ of Latter-day Saints can research your residence history and send records directly to the DOJ — see the LDS Church Records section below for details.",
    requirements: [
      {
        category: "UTILITY_BILL",
        title: "Utility Bills",
        description: "Gas, electric, water, or telephone bills",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original bills may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "These are particularly strong evidence",
          "Even partial bills or statements are helpful",
          "Multiple bills from different years strengthen your claim",
        ],
        examples: [
          "Electric company bills",
          "Gas company statements",
          "Water utility bills",
          "Telephone bills",
        ],
      },
      {
        category: "SCHOOL_RECORDS",
        title: "School Records",
        description: "Report cards, enrollment records, or transcripts",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original or certified copies may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Report cards showing your name and school address are ideal",
          "Enrollment records or attendance certificates also qualify",
          "Graduation records or diplomas with dates",
        ],
        examples: [
          "Report cards with dates",
          "School enrollment records",
          "Transcripts",
          "School photos with names/dates",
        ],
      },
      {
        category: "MORTGAGE_STATEMENT",
        title: "Property & Mortgage Documents",
        description:
          "Mortgage statements, property deeds, rental agreements, or property tax bills",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original documents may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "These are strong evidence of residence",
          "Property deeds with your name are particularly valuable",
          "Rental agreements showing your address",
        ],
        examples: [
          "Mortgage statements",
          "Property deeds",
          "Rental or lease agreements",
          "Property tax bills",
        ],
      },
      {
        category: "LDS_CHURCH_RECORDS",
        title: "LDS Church Records",
        description:
          "Request the church to send historical membership records directly to the DOJ",
        minRequired: 0,
        maxAllowed: 2,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Complete the RECA Research Application form and mail it to the church. They will send records directly to the DOJ.",
        tips: [
          "Fill out the LDS RECA Form (available below) completely",
          "Mail to: RECA RESEARCH, Global Services Department, 3740 West Market Center Drive, Riverton, UT 84065",
          "The church will verify historical ward information for free",
          "This can provide strong evidence of residence",
          "Upload a copy of your completed form here for your records",
          "The church sends results directly to the DOJ, not to you",
        ],
        examples: [
          "Completed LDS RECA Research Application form",
          "Copy of church response (if received)",
        ],
      },
      {
        category: "PROOF_OF_RESIDENCE",
        title: "Other Residence Documents",
        description:
          "Insurance statements, voter registration, bank statements, or any other documents showing your name and address",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original documents may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Upload at least 2 different types of documents for stronger verification",
          "Documents should clearly show your full name and complete address",
          "If documents are from slightly outside the period, upload them anyway",
        ],
        examples: [
          "Insurance statements (auto, home, life)",
          "Voter registration cards",
          "Bank statements or loan documents",
          "Military records showing home of record",
          "Church membership records",
          "Any other document with your name and address",
        ],
      },
    ],
  },
  {
    id: "medical",
    title: "Medical Documentation",
    description:
      "Upload records documenting your cancer diagnosis and treatment history.",
    headerTip:
      "You may authorize the DOJ to request your medical records from the cancer registry during the application process. While we have limited information on this timeline, it is an available option.",
    requirements: [
      {
        category: "PATHOLOGY_REPORT",
        title: "Pathology Report",
        description:
          "Official report confirming your cancer diagnosis with cancer type and date",
        minRequired: 1,
        maxAllowed: 3,
        isRequired: true,
        requiresOriginal: true,
        originalNote:
          "Certified copies from medical facility may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Must include diagnosis date and cancer type",
          "Should be on official letterhead from the pathology lab",
          "Request from your oncologist or hospital if you don't have a copy",
        ],
        examples: [
          "Biopsy pathology report",
          "Surgical pathology report",
          "Lab report with cancer diagnosis",
        ],
      },
      {
        category: "MEDICAL_RECORDS",
        title: "Additional Medical Records",
        description:
          "Supporting records from your oncologist, surgeon, or primary care physician",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Certified copies may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Treatment summaries and progress notes are helpful",
          "Imaging reports (CT, PET, MRI) showing cancer",
          "Doctor's letters confirming diagnosis",
        ],
        examples: [
          "Oncologist consultation notes",
          "Treatment summary reports",
          "Imaging reports (CT, PET, MRI)",
          "Doctor's letters confirming diagnosis",
        ],
      },
      {
        category: "DISCHARGE_SUMMARY",
        title: "Hospital Discharge Summaries",
        description:
          "Discharge summaries from surgery, chemotherapy admissions, or other hospitalizations",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Certified copies from hospital may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Should mention cancer diagnosis and treatment provided",
          "Include all hospitalizations related to your cancer",
        ],
        examples: [
          "Post-surgery discharge summary",
          "Chemotherapy hospitalization summary",
          "Emergency department discharge papers",
        ],
      },
      {
        category: "TREATMENT_RECORDS",
        title: "Treatment Records",
        description: "Chemotherapy, radiation therapy, or surgery records",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: false,
        tips: [
          "Medication lists showing cancer treatments",
          "Copies are acceptable for these records",
        ],
        examples: [
          "Chemotherapy administration records",
          "Radiation therapy treatment logs",
          "Surgery operative reports",
        ],
      },
    ],
  },
  {
    id: "vital-records",
    title: "Vital Records",
    description: "Official certificates to prove relationships and status.",
    requirements: [
      {
        category: "DEATH_CERTIFICATE",
        title: "Death Certificate",
        description: "Required if filing for a deceased family member",
        minRequired: 0,
        maxAllowed: 1,
        isRequired: false,
        requiresOriginal: true,
        originalNote: "DOJ may request certified copy after electronic filing.",
        tips: [
          "Must be a certified copy from the state/county",
          "Funeral home copies are usually not accepted",
        ],
        examples: ["State Death Certificate"],
      },
      {
        category: "BIRTH_CERTIFICATE",
        title: "Birth Certificate",
        description: "To prove relationship (if applicable)",
        minRequired: 0,
        maxAllowed: 1,
        isRequired: false,
        requiresOriginal: true,
        tips: ["Long form preferred", "Must show parents' names"],
        examples: ["State Birth Certificate"],
      },
      {
        category: "MARRIAGE_CERTIFICATE",
        title: "Marriage Certificate",
        description: "To prove relationship (if applicable)",
        minRequired: 0,
        maxAllowed: 1,
        isRequired: false,
        requiresOriginal: true,
        tips: ["Must show both spouses' names", "Certified copy required"],
        examples: ["State Marriage Certificate"],
      },
    ],
  },
  {
    id: "additional",
    title: "Additional Supporting Documents (1951-1962)",
    description:
      "Documents that may be required based on your specific situation to verify relationships, name changes, or other connections. These help establish eligibility and strengthen your claim.",
    requirements: [
      {
        category: "EMPLOYMENT_RECORDS",
        title: "Employment Records",
        description: "Pay stubs, W-2 forms, or employment verification letters",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original documents may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "Should show employer name, address, and your employment dates",
          "Original documents strengthen your claim",
        ],
        examples: [
          "Pay stubs",
          "W-2 tax forms",
          "Employment verification letters",
          "Union membership cards",
        ],
      },
      {
        category: "TAX_RETURN",
        title: "Tax Returns",
        description:
          "Federal or state tax returns showing your residence address",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Original or certified IRS copies may be requested by DOJ after electronic filing to validate authenticity.",
        tips: [
          "These are strong evidence if you have them",
          "Can request copies from IRS if needed",
        ],
        examples: ["Federal tax returns (Form 1040)", "State tax returns"],
      },
      {
        category: "OTHER",
        title: "Other Documents",
        description:
          "Birth certificates, marriage certificates, military records, or other supporting documents",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: false,
        tips: [
          "Birth certificates showing birthplace in eligible area",
          "Marriage certificates with residence address",
          "Military service records showing home of record",
          "Letters or correspondence with dated postmarks",
          "We'll advise if originals are needed",
        ],
        examples: [
          "Birth certificate",
          "Marriage certificate",
          "Military service records",
          "Letters or correspondence with dated postmarks",
        ],
      },
    ],
  },
];

/**
 * Get total required documents across all categories
 */
export function getTotalRequired(): number {
  return DOCUMENT_CHECKLIST.reduce((total, section) => {
    return (
      total +
      section.requirements.reduce((sectionTotal, req) => {
        return sectionTotal + (req.isRequired ? req.minRequired : 0);
      }, 0)
    );
  }, 0);
}

/**
 * Get total optional documents
 */
export function getTotalOptional(): number {
  return DOCUMENT_CHECKLIST.reduce((total, section) => {
    return (
      total +
      section.requirements.reduce((sectionTotal, req) => {
        return sectionTotal + (!req.isRequired ? req.maxAllowed : 0);
      }, 0)
    );
  }, 0);
}

/**
 * Calculate checklist progress based on uploaded files
 */
export function calculateProgress(
  uploadedFiles: Array<{ category: FileCategory | null }>
) {
  const categoryCounts = new Map<FileCategory, number>();

  uploadedFiles.forEach((file) => {
    if (file.category) {
      categoryCounts.set(
        file.category,
        (categoryCounts.get(file.category) || 0) + 1
      );
    }
  });

  let requiredMet = 0;
  let requiredTotal = 0;

  DOCUMENT_CHECKLIST.forEach((section) => {
    section.requirements.forEach((req) => {
      if (req.isRequired) {
        const uploaded = categoryCounts.get(req.category) || 0;
        const needed = req.minRequired;
        requiredTotal += needed;
        requiredMet += Math.min(uploaded, needed);
      }
    });
  });

  return {
    requiredMet,
    requiredTotal,
    percentComplete:
      requiredTotal > 0 ? Math.round((requiredMet / requiredTotal) * 100) : 0,
  };
}

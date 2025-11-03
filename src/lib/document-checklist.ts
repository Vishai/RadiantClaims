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
    description: "Documents to verify your identity",
    requirements: [
      {
        category: "IDENTITY",
        title: "Government-Issued Photo ID",
        description:
          "Driver's license, passport, or state ID showing your full legal name and date of birth",
        minRequired: 1,
        maxAllowed: 2,
        isRequired: true,
        requiresOriginal: true,
        originalNote:
          "A certified or notarized copy will be required in your final mailing. Upload a clear photo/scan now.",
        tips: [
          "Make sure your ID is current and not expired",
          "Ensure all text is clearly readable",
          "Both front and back if applicable",
          "You'll need to obtain a certified copy later for mailing",
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
      "At least 2 documents showing you lived in an eligible county during the atmospheric testing period",
    requirements: [
      {
        category: "PROOF_OF_RESIDENCE",
        title: "Residence Documentation",
        description:
          "Documents showing your full name and address in an eligible county during 1951-1962. We require at least 2 different sources for verification.",
        minRequired: 2,
        maxAllowed: 10,
        isRequired: true,
        requiresOriginal: true,
        timeframeNote:
          "Documents must show residence during the qualifying period: 1951-1962",
        originalNote:
          "Original historical documents will be required in your final mailing. Upload clear photos/scans now.",
        validationRules: {
          mustShowNameAndAddress: true,
          mustBeWithinDateRange: RECA_ATMOSPHERIC_PERIOD,
        },
        tips: [
          "Upload at least 2 different types of proof for stronger verification",
          "Documents should clearly show your full name and complete address",
          "If you only have documents from slightly outside the period, upload them anyway with an explanation",
          "Earlier documents are better - closer to the 1951-1962 timeframe",
          "Original documents will be needed for final submission",
          "We can help you obtain additional records if needed",
        ],
        examples: [
          "Utility bills (electricity, gas, water, phone)",
          "School records or report cards",
          "Church membership records with address",
          "Lease or rental agreements",
          "Property tax bills or deeds",
          "Pay stubs showing employer address",
          "Insurance statements (auto, home, life)",
          "Voter registration cards",
          "Bank statements or loan documents",
          "Military records showing home of record",
        ],
      },
      {
        category: "UTILITY_BILL",
        title: "Utility Bills (If Available)",
        description: "Historical utility bills from the 1951-1962 period",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        timeframeNote: "From 1951-1962 period preferred",
        originalNote:
          "Original bills preferred if available. Upload photos/scans now.",
        tips: [
          "These are particularly strong evidence if you have them",
          "Gas, electric, water, or telephone bills all qualify",
          "Even partial bills or statements help",
          "Original documents strengthen your claim",
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
        title: "School Records (If Applicable)",
        description:
          "Report cards, enrollment records, or transcripts showing attendance during 1951-1962",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        timeframeNote: "For claimants who attended school during 1951-1962",
        originalNote:
          "Original or certified copies required. Upload scans now.",
        tips: [
          "Report cards showing your name and school address",
          "Enrollment records or attendance certificates",
          "Graduation records or diplomas with dates",
          "Original or certified copies needed for final mailing",
        ],
        examples: [
          "Report cards with dates",
          "School enrollment records",
          "Transcripts",
          "School photos with names/dates",
        ],
      },
      {
        category: "LDS_CHURCH_RECORDS",
        title: "LDS Church Membership Records (If Applicable)",
        description:
          "For members of The Church of Jesus Christ of Latter-day Saints, you can request the church to provide membership records to the DOJ to help prove residence during 1951-1962",
        minRequired: 0,
        maxAllowed: 2,
        isRequired: false,
        requiresOriginal: true,
        timeframeNote:
          "For members who lived in the affected area during 1951-1962",
        originalNote:
          "Complete the RECA Research Application form and mail it directly to the church. The church will send their report directly to the DOJ.",
        tips: [
          "Download the LDS RECA Form below and fill it out completely",
          "Mail the completed form to: RECA RESEARCH, Global Services Department, 3740 West Market Center Drive, Riverton, UT 84065",
          "The church will check historical ward information and send a report directly to the DOJ",
          "This service is free and can provide strong evidence of residence",
          "Upload a copy of your completed form here for your records",
          "The church will NOT email records - they send directly to the DOJ",
        ],
        examples: [
          "Completed LDS RECA Research Application form",
          "Copy of church response (if received)",
        ],
      },
    ],
  },
  {
    id: "medical",
    title: "Medical Documentation",
    description: "Records documenting your diagnosis and medical history",
    requirements: [
      {
        category: "PATHOLOGY_REPORT",
        title: "Pathology Report",
        description:
          "Official pathology report confirming your cancer diagnosis, including cancer type and date of diagnosis",
        minRequired: 1,
        maxAllowed: 3,
        isRequired: true,
        requiresOriginal: true,
        originalNote:
          "Certified copies from medical facility required. Upload scans now, request certified copies later.",
        tips: [
          "Must include diagnosis date and cancer type",
          "Should be on official letterhead from the pathology lab",
          "Request from your oncologist or hospital if you don't have a copy",
          "You'll need certified copies for final mailing",
        ],
        examples: [
          "Biopsy pathology report",
          "Surgical pathology report",
          "Lab report with cancer diagnosis",
        ],
      },
      {
        category: "MEDICAL_RECORDS",
        title: "Medical Records",
        description:
          "Supporting medical records related to your diagnosis and treatment",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: true,
        originalNote: "Certified copies required. Upload scans now.",
        tips: [
          "Include records from your oncologist, surgeon, or primary care physician",
          "Treatment summaries and progress notes are helpful",
          "Imaging reports (CT, PET, MRI) showing cancer",
          "Certified copies needed for final submission",
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
          "Summaries from hospitalizations related to your cancer treatment",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        originalNote:
          "Certified copies from hospital required. Upload scans now.",
        tips: [
          "Include summaries from surgery, chemotherapy admissions, etc.",
          "Should mention cancer diagnosis and treatment provided",
          "Certified copies needed for final mailing",
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
        description: "Records of cancer treatments received",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: false,
        tips: [
          "Chemotherapy records, radiation therapy logs, surgery notes",
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
    id: "additional",
    title: "Additional Supporting Documents",
    description: "Other documents that may strengthen your claim",
    requirements: [
      {
        category: "EMPLOYMENT_RECORDS",
        title: "Employment Records (If Applicable)",
        description:
          "Records showing employment in the area during the qualifying period",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        timeframeNote: "From 1951-1962 period if available",
        originalNote: "Original documents preferred. Upload scans now.",
        tips: [
          "Pay stubs, W-2 forms, or employment verification letters",
          "Should show employer name, address, and your employment dates",
          "Original documents strengthen your claim",
        ],
        examples: [
          "Pay stubs from 1951-1962",
          "W-2 tax forms",
          "Employment verification letters",
          "Union membership cards",
        ],
      },
      {
        category: "TAX_RETURN",
        title: "Tax Returns (If Available)",
        description: "Historical tax returns showing residence address",
        minRequired: 0,
        maxAllowed: 5,
        isRequired: false,
        requiresOriginal: true,
        timeframeNote: "From 1951-1962 period if available",
        originalNote:
          "Original or certified IRS copies required. Upload scans now.",
        tips: [
          "Federal or state tax returns showing your address",
          "These are strong evidence if you have them",
          "Can request copies from IRS if needed",
        ],
        examples: ["Federal tax returns (Form 1040)", "State tax returns"],
      },
      {
        category: "OTHER",
        title: "Other Supporting Documents",
        description: "Any other documents that support your claim",
        minRequired: 0,
        maxAllowed: 10,
        isRequired: false,
        requiresOriginal: false,
        tips: [
          "Birth certificates showing birthplace in eligible area",
          "Marriage certificates with residence address",
          "Military service records showing home of record",
          "Anything else that documents your presence during 1951-1962",
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

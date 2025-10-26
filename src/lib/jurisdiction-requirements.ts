/**
 * Jurisdiction-specific document requirements and resources
 *
 * This file defines which documents require original copies vs digital uploads
 * based on the claimant's jurisdiction (state/county).
 *
 * Process: Until DOJ digital portal opens (December), clients upload digital copies
 * of all documents. Firm validates digital copies, prints them for lawyer review,
 * then provides clients with prepaid envelopes and instructions to replace printed
 * copies with required originals before mailing to DOJ.
 */

import { FileCategory } from "./intake-upload";

export interface JurisdictionLink {
  title: string;
  url: string;
  description?: string;
}

export interface JurisdictionDocumentRequirement {
  category: FileCategory;
  requiresOriginal: boolean; // Must be mailed as certified/original document
  isRequired: boolean;
  specificInstructions?: string;
  helpfulLinks?: JurisdictionLink[];
  exampleDocuments?: string[];
}

export interface JurisdictionConfig {
  state: string;
  county?: string;
  requirements: JurisdictionDocumentRequirement[];
  generalGuidance?: string;
  stateResources?: JurisdictionLink[];
}

/**
 * Default requirements that apply to all jurisdictions
 * These can be overridden by state/county-specific configs
 */
export const DEFAULT_REQUIREMENTS: JurisdictionDocumentRequirement[] = [
  {
    category: "IDENTITY",
    requiresOriginal: true, // Government IDs must be certified copies or originals
    isRequired: true,
    specificInstructions: "Must be a certified copy or notarized copy of government-issued ID. Upload a photo/scan now, then include the certified copy in your final mailing.",
    exampleDocuments: [
      "Certified copy of Driver's License",
      "Certified copy of Passport",
      "Notarized copy of State ID"
    ]
  },
  {
    category: "PROOF_OF_RESIDENCE",
    requiresOriginal: true, // Historical residence docs often need originals
    isRequired: true,
    specificInstructions: "Original documents from 1951-1962 showing residence in an eligible area. Upload scans/photos now, then include originals in your final mailing.",
    exampleDocuments: [
      "Original utility bills",
      "Original school records",
      "Original property tax records",
      "Original employment records"
    ]
  },
  {
    category: "PATHOLOGY_REPORT",
    requiresOriginal: true, // Medical records must be certified
    isRequired: true,
    specificInstructions: "Must be certified copies from the medical facility. Upload scans now, request certified copies from your hospital/clinic, and include in final mailing.",
    helpfulLinks: [
      {
        title: "How to Request Medical Records",
        url: "https://www.hhs.gov/hipaa/for-individuals/medical-records/index.html",
        description: "HHS guide to requesting your medical records"
      }
    ],
    exampleDocuments: [
      "Certified pathology report",
      "Certified biopsy results",
      "Certified cancer diagnosis records"
    ]
  },
  {
    category: "MEDICAL_RECORDS",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Certified copies of supporting medical records. Upload scans now, request certified copies, and include in final mailing."
  },
  {
    category: "DISCHARGE_SUMMARY",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Certified copies from medical facility. Upload scans now, include certified copies in final mailing."
  },
  {
    category: "TREATMENT_RECORDS",
    requiresOriginal: false, // Treatment records can be copies
    isRequired: false,
    specificInstructions: "Copies are acceptable. Upload digital copies."
  },
  {
    category: "UTILITY_BILL",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Original historical bills preferred. Upload scans/photos now, include originals in final mailing if available."
  },
  {
    category: "SCHOOL_RECORDS",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Original records or certified copies. Upload scans now, include originals/certified copies in final mailing."
  },
  {
    category: "EMPLOYMENT_RECORDS",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Original records preferred. Upload scans now, include originals in final mailing if available."
  },
  {
    category: "TAX_RETURN",
    requiresOriginal: true,
    isRequired: false,
    specificInstructions: "Original or certified copies from IRS. Upload scans now, include originals in final mailing."
  },
  {
    category: "OTHER",
    requiresOriginal: false,
    isRequired: false,
    specificInstructions: "Upload any supporting documents. We'll advise if originals are needed."
  }
];

/**
 * Utah-specific requirements and resources
 */
export const UTAH_REQUIREMENTS: JurisdictionConfig = {
  state: "UT",
  generalGuidance: "Utah residents during 1951-1962 may qualify for RECA compensation. Focus on documents proving residence in affected counties during atmospheric testing.",
  stateResources: [
    {
      title: "Utah State Archives - Historical Records",
      url: "https://archives.utah.gov/",
      description: "Access historical records including property, school, and vital records"
    },
    {
      title: "Utah Department of Health - Vital Records",
      url: "https://dhhs.utah.gov/vital-records/",
      description: "Request certified copies of birth certificates and other vital records"
    },
    {
      title: "Utah State Historical Society",
      url: "https://heritage.utah.gov/",
      description: "Research historical documents and county records"
    },
    {
      title: "Utah Medical Records Request",
      url: "https://dhhs.utah.gov/medical-records/",
      description: "How to request medical records from Utah healthcare providers"
    }
  ],
  requirements: DEFAULT_REQUIREMENTS
};

/**
 * Nevada-specific requirements and resources
 */
export const NEVADA_REQUIREMENTS: JurisdictionConfig = {
  state: "NV",
  generalGuidance: "Nevada residents, particularly in areas downwind from the Nevada Test Site, may qualify for RECA compensation.",
  stateResources: [
    {
      title: "Nevada State Library, Archives and Public Records",
      url: "https://www.nvculture.org/archives",
      description: "Access historical records and documents"
    },
    {
      title: "Nevada Division of Public and Behavioral Health",
      url: "https://www.dpbh.nv.gov/",
      description: "Health records and vital statistics information"
    },
    {
      title: "Clark County Recorder's Office",
      url: "https://www.clarkcountynv.gov/government/departments/recorder/index.php",
      description: "Historical property and residence records for Clark County"
    }
  ],
  requirements: DEFAULT_REQUIREMENTS
};

/**
 * Arizona-specific requirements and resources
 */
export const ARIZONA_REQUIREMENTS: JurisdictionConfig = {
  state: "AZ",
  generalGuidance: "Arizona residents in affected areas during 1951-1962 may qualify for compensation.",
  stateResources: [
    {
      title: "Arizona State Library, Archives and Public Records",
      url: "https://azlibrary.gov/",
      description: "Historical records and documents"
    },
    {
      title: "Arizona Department of Health Services",
      url: "https://www.azdhs.gov/",
      description: "Health records and vital statistics"
    }
  ],
  requirements: DEFAULT_REQUIREMENTS
};

/**
 * Get jurisdiction-specific requirements
 */
export function getJurisdictionRequirements(
  state: string,
  county?: string
): JurisdictionConfig {
  // Map state codes to configs
  const stateConfigs: Record<string, JurisdictionConfig> = {
    UT: UTAH_REQUIREMENTS,
    NV: NEVADA_REQUIREMENTS,
    AZ: ARIZONA_REQUIREMENTS,
    // Add more states as needed
  };

  // Return state-specific config or default
  return stateConfigs[state.toUpperCase()] || {
    state,
    county,
    requirements: DEFAULT_REQUIREMENTS,
    generalGuidance: "Upload digital copies of all required documents. We'll guide you on which documents need to be mailed as originals."
  };
}

/**
 * Check if a document category requires original mailing
 */
export function requiresOriginalDocument(
  category: FileCategory,
  state?: string,
  county?: string
): boolean {
  if (!state) return false;

  const config = getJurisdictionRequirements(state, county);
  const requirement = config.requirements.find(r => r.category === category);

  return requirement?.requiresOriginal || false;
}

/**
 * Get specific instructions for a document category
 */
export function getDocumentInstructions(
  category: FileCategory,
  state?: string,
  county?: string
): string | undefined {
  if (!state) return undefined;

  const config = getJurisdictionRequirements(state, county);
  const requirement = config.requirements.find(r => r.category === category);

  return requirement?.specificInstructions;
}

/**
 * Get helpful links for a document category or jurisdiction
 */
export function getHelpfulLinks(
  category?: FileCategory,
  state?: string,
  county?: string
): JurisdictionLink[] {
  if (!state) return [];

  const config = getJurisdictionRequirements(state, county);

  if (category) {
    const requirement = config.requirements.find(r => r.category === category);
    return requirement?.helpfulLinks || [];
  }

  return config.stateResources || [];
}

/**
 * Mail-in process explanation message
 */
export const MAIL_IN_PROCESS_EXPLANATION = `
## Why Upload Digital Copies?

**Important Update:** The Department of Justice requires certain documents to be submitted as certified copies or originals. Until the new digital portal opens in December, we're using this temporary process:

### How It Works:

1. **Upload Digital Copies** - Take photos or scans of all your documents and upload them here
2. **We Validate** - Our team reviews your digital uploads to ensure everything is correct
3. **Lawyer Review** - After validation, our lawyer reviews printed copies for approval
4. **You Mail Originals** - Once approved, we'll provide you with:
   - A prepaid envelope addressed to the DOJ
   - Clear instructions on which documents need originals/certified copies
   - An instruction slip to include in your mailing

### Why This Process?

This ensures your documents are complete and correct before you go through the effort of obtaining certified copies and mailing originals. It's more convenient for you and helps us catch any issues early.

### What You Need to Do:

- **Now:** Upload clear photos/scans of all documents
- **After Validation:** Request certified copies from relevant institutions (hospitals, schools, etc.)
- **Final Step:** Replace our printed copies with your certified copies/originals and mail in the prepaid envelope

This process is temporary until the digital portal launches. We'll shift to fully digital submission as soon as it's available.
`;

/**
 * RECA Claim Requirements Schema
 * Defines what documents are required for each type of RECA claim
 */

import { FileCategory } from "@/lib/document-intelligence/ai-categorization";

export type ClaimType = "downwinder" | "onsite" | "uranium";

export interface RequiredDocument {
  category: FileCategory;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  alternatives?: FileCategory[]; // Alternative document types that satisfy the same requirement
}

/**
 * Document requirements for Downwinder claims
 * Source: RECA Section 4(a)
 */
export const DOWNWINDER_REQUIREMENTS: RequiredDocument[] = [
  {
    category: "IDENTITY",
    name: "Birth Certificate or Proof of Birth",
    description:
      "Official birth certificate or other government-issued proof of birth to establish identity and age during exposure period",
    priority: "high",
  },
  {
    category: "PROOF_OF_RESIDENCE",
    name: "Proof of Residence During Exposure Period",
    description:
      "Documentation showing residence in affected county during atmospheric testing period (1951-1958 or 1962)",
    priority: "high",
    alternatives: [
      "UTILITY_BILL",
      "MORTGAGE_STATEMENT",
      "TAX_RETURN",
      "SCHOOL_RECORDS",
      "EMPLOYMENT_RECORDS",
    ],
  },
  {
    category: "MEDICAL_RECORDS",
    name: "Medical Diagnosis Documentation",
    description:
      "Medical records documenting diagnosis of a covered disease (21 specific cancers)",
    priority: "high",
    alternatives: [
      "PATHOLOGY_REPORT",
      "DISCHARGE_SUMMARY",
      "TUMOR_REGISTRY",
      "TREATMENT_RECORDS",
    ],
  },
  {
    category: "PATHOLOGY_REPORT",
    name: "Pathology Report (if applicable)",
    description: "Pathology or biopsy report confirming cancer diagnosis",
    priority: "medium",
  },
];

/**
 * Document requirements for Onsite Participant claims
 * Source: RECA Section 4(a)(1)(B)
 */
export const ONSITE_REQUIREMENTS: RequiredDocument[] = [
  {
    category: "IDENTITY",
    name: "Birth Certificate",
    description: "Official birth certificate to establish identity",
    priority: "high",
  },
  {
    category: "EMPLOYMENT_RECORDS",
    name: "Employment Records at Test Site",
    description:
      "Documentation of employment or participation at Nevada Test Site or Pacific Proving Grounds during testing period (1945-1962)",
    priority: "high",
  },
  {
    category: "MEDICAL_RECORDS",
    name: "Medical Diagnosis Documentation",
    description: "Medical records documenting diagnosis of a covered disease",
    priority: "high",
    alternatives: [
      "PATHOLOGY_REPORT",
      "DISCHARGE_SUMMARY",
      "TUMOR_REGISTRY",
      "TREATMENT_RECORDS",
    ],
  },
];

/**
 * Document requirements for Uranium Worker claims
 * Source: RECA Section 5
 */
export const URANIUM_REQUIREMENTS: RequiredDocument[] = [
  {
    category: "IDENTITY",
    name: "Birth Certificate",
    description: "Official birth certificate to establish identity",
    priority: "high",
  },
  {
    category: "EMPLOYMENT_RECORDS",
    name: "Employment Records at Uranium Facility",
    description:
      "Documentation of employment at uranium mine, mill, or ore transport facility during covered period (1942-1971)",
    priority: "high",
  },
  {
    category: "MEDICAL_RECORDS",
    name: "Medical Diagnosis Documentation",
    description:
      "Medical records documenting diagnosis of covered disease (lung disease, kidney disease, or specific cancers)",
    priority: "high",
    alternatives: [
      "PATHOLOGY_REPORT",
      "DISCHARGE_SUMMARY",
      "TREATMENT_RECORDS",
    ],
  },
];

/**
 * Get requirements for a specific claim type
 */
export function getRequirements(claimType: ClaimType): RequiredDocument[] {
  switch (claimType) {
    case "downwinder":
      return DOWNWINDER_REQUIREMENTS;
    case "onsite":
      return ONSITE_REQUIREMENTS;
    case "uranium":
      return URANIUM_REQUIREMENTS;
    default:
      return DOWNWINDER_REQUIREMENTS; // Default to downwinder
  }
}

/**
 * Check if a document category satisfies a requirement (including alternatives)
 */
export function satisfiesRequirement(
  requirement: RequiredDocument,
  category: FileCategory
): boolean {
  if (requirement.category === category) return true;
  if (requirement.alternatives?.includes(category)) return true;
  return false;
}

/**
 * Calculate completion percentage for a claim
 */
export function calculateCompleteness(
  claimType: ClaimType,
  availableCategories: FileCategory[]
): number {
  const requirements = getRequirements(claimType);
  let satisfied = 0;

  for (const requirement of requirements) {
    const isSatisfied = availableCategories.some((category) =>
      satisfiesRequirement(requirement, category)
    );
    if (isSatisfied) satisfied++;
  }

  return requirements.length > 0 ? satisfied / requirements.length : 0;
}

/**
 * Get missing requirements for a claim
 */
export function getMissingRequirements(
  claimType: ClaimType,
  availableCategories: FileCategory[]
): RequiredDocument[] {
  const requirements = getRequirements(claimType);

  return requirements.filter((requirement) => {
    const isSatisfied = availableCategories.some((category) =>
      satisfiesRequirement(requirement, category)
    );
    return !isSatisfied;
  });
}

/**
 * Check if a single document qualifies as a required document type
 * Returns detailed qualification information
 */
export function checkDocumentQualification(
  documentCategory: FileCategory,
  claimType: ClaimType
): {
  qualifies: boolean;
  matchedRequirement: RequiredDocument | null;
  isAlternative: boolean;
} {
  const requirements = getRequirements(claimType);

  for (const requirement of requirements) {
    // Check if document directly matches the requirement
    if (requirement.category === documentCategory) {
      return {
        qualifies: true,
        matchedRequirement: requirement,
        isAlternative: false,
      };
    }

    // Check if document is an acceptable alternative
    if (requirement.alternatives?.includes(documentCategory)) {
      return {
        qualifies: true,
        matchedRequirement: requirement,
        isAlternative: true,
      };
    }
  }

  return {
    qualifies: false,
    matchedRequirement: null,
    isAlternative: false,
  };
}

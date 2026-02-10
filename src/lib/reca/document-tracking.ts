/**
 * Document Tracking System for RECA Applications
 *
 * This system tracks document requirements separately from form completion,
 * allowing users to:
 * - Complete forms with available information
 * - Track what documents are needed
 * - Get assistance finding missing documents
 * - Confirm document readiness at submission time
 */

import { RelationshipType, Part1FilerInfo, Part4SelfFiler } from "./types";

export type DocumentStatus =
  | "not_needed" // Document not required for this application
  | "needed" // Document required but not yet confirmed
  | "in_progress" // User is working on obtaining this document
  | "confirmed" // User has confirmed they have this document
  | "uploaded" // Document has been uploaded to the system
  | "verified"; // Document has been verified by staff

export type DocumentCategory =
  | "identity"
  | "relationship"
  | "medical"
  | "presence"
  | "legal";

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  status: DocumentStatus;
  required: boolean;
  helpResources?: string[];
  notes?: string;
  quantity?: number; // For documents like marriage certificates
  relatedFormSection?: string;
}

export interface DocumentAssistance {
  documentId: string;
  assistanceType: "how_to_obtain" | "alternatives" | "expedite" | "waiver";
  resources: {
    title: string;
    description: string;
    url?: string;
    phone?: string;
    email?: string;
  }[];
}

export interface DocumentTrackingState {
  requirements: DocumentRequirement[];
  totalRequired: number;
  totalConfirmed: number;
  totalUploaded: number;
  readyForSubmission: boolean;
  assistanceNeeded: string[]; // Document IDs that need assistance
  lastUpdated: Date;
}

/**
 * Generate document requirements based on relationship type and form data
 */
export function generateDocumentRequirements(
  relationship: RelationshipType,
  filerInfo?: Partial<Part1FilerInfo>,
  selfFilerInfo?: Partial<Part4SelfFiler>
): DocumentRequirement[] {
  const requirements: DocumentRequirement[] = [];

  // Always required: Filer's birth certificate
  requirements.push({
    id: "filer_birth_certificate",
    name: "Your Birth Certificate",
    description: "Original or certified copy of your birth certificate",
    category: "identity",
    status: "needed",
    required: true,
    helpResources: [
      "https://www.cdc.gov/nchs/w2w/index.htm",
      "Contact your state's vital records office",
    ],
    relatedFormSection: "part_1",
  });

  // If self-filer with name changes
  if (relationship === "Self" && selfFilerInfo?.hasNameChanges) {
    const numMarriages = selfFilerInfo.numberOfMarriages || 0;
    if (numMarriages > 0) {
      requirements.push({
        id: "marriage_certificates",
        name: `Marriage Certificate${numMarriages > 1 ? "s" : ""}`,
        description: `${numMarriages} certified ${numMarriages > 1 ? "copies" : "copy"} of marriage certificate${numMarriages > 1 ? "s" : ""} to document name changes`,
        category: "legal",
        status: "needed",
        required: true,
        quantity: numMarriages,
        helpResources: [
          "Contact the county clerk where you were married",
          "Many states offer online ordering of vital records",
        ],
        relatedFormSection: "part_4",
      });
    }
  }

  // Spouse-specific documents
  if (relationship === "Spouse") {
    requirements.push(
      {
        id: "spouse_death_certificate",
        name: "Spouse's Death Certificate",
        description: "Death certificate of the person who became ill",
        category: "identity",
        status: "needed",
        required: true,
        helpResources: [
          "Contact the vital records office in the state where death occurred",
        ],
        relatedFormSection: "part_5",
      },
      {
        id: "marriage_certificate_spouse",
        name: "Marriage Certificate",
        description:
          "Certificate showing marriage of at least 1 year before death",
        category: "relationship",
        status: "needed",
        required: true,
        helpResources: ["Contact the county clerk where you were married"],
        relatedFormSection: "part_5",
      }
    );
  }

  // Child-specific documents
  if (relationship === "Child") {
    requirements.push(
      {
        id: "parent_death_certificate",
        name: "Parent's Death Certificate",
        description: "Death certificate of the parent who became ill",
        category: "identity",
        status: "needed",
        required: true,
        relatedFormSection: "part_6",
      },
      {
        id: "parent_birth_certificate",
        name: "Parent's Birth Certificate",
        description: "Birth certificate of the parent who became ill",
        category: "identity",
        status: "needed",
        required: true,
        relatedFormSection: "part_6",
      }
    );

    // Add sibling death certificates if applicable
    if (filerInfo && "hasSiblings" in filerInfo) {
      requirements.push({
        id: "sibling_death_certificates",
        name: "Sibling Death Certificates",
        description: "Death certificates for any deceased siblings",
        category: "relationship",
        status: "needed",
        required: false, // Conditional based on sibling status
        relatedFormSection: "part_6",
      });
    }
  }

  // Always required: Medical documentation
  requirements.push({
    id: "medical_documentation",
    name: "Medical Documentation",
    description: "Proof of compensable disease diagnosis",
    category: "medical",
    status: "needed",
    required: true,
    helpResources: [
      "Contact your healthcare provider's medical records department",
      "Request records from treating hospitals",
    ],
    relatedFormSection: "part_11",
  });

  // Always required: Proof of presence
  requirements.push({
    id: "proof_of_presence",
    name: "Proof of Presence",
    description:
      "At least 2 documents proving presence in affected area during required time period",
    category: "presence",
    status: "needed",
    required: true,
    quantity: 2,
    helpResources: [
      "School records, employment records, tax returns, utility bills",
      "Military service records, tribal enrollment records",
    ],
    relatedFormSection: "part_9",
  });

  return requirements;
}

/**
 * Calculate readiness for submission
 */
export function calculateSubmissionReadiness(
  requirements: DocumentRequirement[]
): {
  canSubmit: boolean;
  missingRequired: DocumentRequirement[];
  percentage: number;
} {
  const requiredDocs = requirements.filter((r) => r.required);
  const confirmedRequired = requiredDocs.filter(
    (r) =>
      r.status === "confirmed" ||
      r.status === "uploaded" ||
      r.status === "verified"
  );

  const missingRequired = requiredDocs.filter(
    (r) => r.status === "needed" || r.status === "in_progress"
  );

  const percentage =
    requiredDocs.length > 0
      ? Math.round((confirmedRequired.length / requiredDocs.length) * 100)
      : 0;

  return {
    canSubmit: missingRequired.length === 0,
    missingRequired,
    percentage,
  };
}

/**
 * Get assistance resources for a specific document
 */
export function getDocumentAssistance(documentId: string): DocumentAssistance {
  const assistanceMap: Record<string, DocumentAssistance> = {
    filer_birth_certificate: {
      documentId: "filer_birth_certificate",
      assistanceType: "how_to_obtain",
      resources: [
        {
          title: "VitalChek",
          description: "Order birth certificates online from most U.S. states",
          url: "https://www.vitalchek.com",
        },
        {
          title: "CDC NCHS Where to Write for Vital Records",
          description: "State-by-state guide for obtaining vital records",
          url: "https://www.cdc.gov/nchs/w2w/index.htm",
        },
        {
          title: "State Department - Birth Certificates",
          description: "Information on obtaining U.S. birth certificates",
          url: "https://travel.state.gov/content/travel/en/records-and-authentications/requesting-a-vital-record-as-a-us-citizen.html",
        },
      ],
    },
    marriage_certificates: {
      documentId: "marriage_certificates",
      assistanceType: "how_to_obtain",
      resources: [
        {
          title: "County Clerk Office Locator",
          description:
            "Find your local county clerk to obtain marriage certificates",
          url: "https://www.usa.gov/vital-records",
        },
        {
          title: "Marriage Certificate Copies",
          description: "How to get certified copies of marriage certificates",
          url: "https://www.vitalchek.com",
        },
      ],
    },
    medical_documentation: {
      documentId: "medical_documentation",
      assistanceType: "how_to_obtain",
      resources: [
        {
          title: "Request Medical Records",
          description: "Your rights to access your medical records under HIPAA",
          url: "https://www.hhs.gov/hipaa/for-individuals/medical-records/index.html",
        },
        {
          title: "Medical Records Request Template",
          description: "Template letter for requesting medical records",
          url: "https://www.hhs.gov/sites/default/files/ocr/privacy/hipaa/understanding/consumers/consumer_rights.pdf",
        },
      ],
    },
    proof_of_presence: {
      documentId: "proof_of_presence",
      assistanceType: "alternatives",
      resources: [
        {
          title: "Acceptable Proof of Presence Documents",
          description:
            "List of documents that can prove presence in affected areas",
          url: "#",
        },
        {
          title: "School Records Request",
          description: "How to obtain transcripts and enrollment records",
          url: "#",
        },
        {
          title: "Employment Verification",
          description: "Requesting employment records from former employers",
          url: "#",
        },
        {
          title: "Tax Return Transcripts",
          description: "Get tax return transcripts from the IRS",
          url: "https://www.irs.gov/individuals/get-transcript",
        },
      ],
    },
  };

  return (
    assistanceMap[documentId] || {
      documentId,
      assistanceType: "how_to_obtain",
      resources: [
        {
          title: "General Document Assistance",
          description: "Contact RECA support for help obtaining this document",
          phone: "1-800-729-7327",
        },
      ],
    }
  );
}

/**
 * Create a task list for missing documents
 */
export function createDocumentTaskList(requirements: DocumentRequirement[]): {
  urgentTasks: string[];
  normalTasks: string[];
  completedTasks: string[];
} {
  const urgentTasks: string[] = [];
  const normalTasks: string[] = [];
  const completedTasks: string[] = [];

  requirements.forEach((req) => {
    const taskDescription = `Obtain ${req.name}${req.quantity && req.quantity > 1 ? ` (${req.quantity} copies)` : ""}`;

    if (
      req.status === "confirmed" ||
      req.status === "uploaded" ||
      req.status === "verified"
    ) {
      completedTasks.push(`✓ ${taskDescription}`);
    } else if (req.required && req.status === "needed") {
      urgentTasks.push(`• ${taskDescription} [Required]`);
    } else if (req.status === "in_progress") {
      normalTasks.push(`• ${taskDescription} [In Progress]`);
    } else if (!req.required && req.status === "needed") {
      normalTasks.push(`• ${taskDescription} [Optional]`);
    }
  });

  return {
    urgentTasks,
    normalTasks,
    completedTasks,
  };
}

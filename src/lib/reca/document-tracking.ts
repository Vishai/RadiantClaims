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

// ---------------------------------------------------------------------------
// Portal-level requirement checklist (detailed, form-data-aware)
// ---------------------------------------------------------------------------

export interface PortalRequiredDocument {
  category: string;
  label: string;
  description: string;
  uploaded: boolean;
  required: boolean;
  helpText?: string;
}

/**
 * Generate a detailed checklist of required documents for the portal page.
 *
 * This is the *single source of truth* for document requirements across the
 * session document page and the portal document page. It inspects form data
 * to infer name-chain needs, sibling docs, Part-5 surviving-spouse docs,
 * Part-7 relationship-chain docs, etc.
 *
 * `uploadedFiles` should be the raw array returned by `/api/documents`.
 */
export function generatePortalRequirements(
  claimType: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadedFiles: any[]
): PortalRequiredDocument[] {
  const requirements: PortalRequiredDocument[] = [];

  const isUploaded = (cat: string) =>
    uploadedFiles.some((f) => f.category === cat);

  const countUploaded = (cat: string) =>
    uploadedFiles.filter((f) => f.category === cat).length;

  if (claimType === "DOWNWINDER") {
    // --- Identity & Vital Records ---

    const isDeceased =
      formData?.part_5?.claimantDeceased === "YES" ||
      formData?.part_6?.claimantDeceased === "YES" ||
      formData?.part_1?.filingForSelf === false;

    if (isDeceased) {
      requirements.push({
        category: "DEATH_CERTIFICATE",
        label: "Death Certificate",
        description: "Official death certificate for the claimant",
        uploaded: isUploaded("DEATH_CERTIFICATE"),
        required: true,
        helpText: "Required for all deceased claimants",
      });
    }

    requirements.push({
      category: "BIRTH_CERTIFICATE",
      label: "Birth Certificate",
      description: "Official birth certificate for the claimant",
      uploaded: isUploaded("BIRTH_CERTIFICATE"),
      required: true,
      helpText: "Must show parents' names",
    });

    // --- Name chain logic ---
    let nameChainRequired = false;
    let nameChainReason = "";

    if (
      formData?.part_1?.formerNames &&
      formData.part_1.formerNames.length > 0
    ) {
      nameChainRequired = true;
      nameChainReason = "Filer has former names";
    }

    if (
      formData?.part_2?.formerNames &&
      formData.part_2.formerNames.length > 0
    ) {
      nameChainRequired = true;
      nameChainReason = "Claimant has former names";
    }

    const relationship = formData?.part_3?.relationship;
    if (
      relationship === "Spouse" ||
      relationship === "Child" ||
      relationship === "Grandchild"
    ) {
      const filerLast = formData?.part_1?.lastName?.toLowerCase();
      const claimantLast =
        formData?.part_2?.lastName?.toLowerCase() || filerLast;
      if (filerLast && claimantLast && filerLast !== claimantLast) {
        nameChainRequired = true;
        nameChainReason = "Filer and Claimant last names differ";
      }
    }

    if (nameChainRequired) {
      requirements.push({
        category: "MARRIAGE_CERTIFICATE",
        label: "Marriage Certificate(s) / Name Change Docs",
        description:
          "Documents linking current names to birth names (e.g., Marriage Certs, Divorce Decrees)",
        uploaded:
          isUploaded("MARRIAGE_CERTIFICATE") || countUploaded("IDENTITY") >= 2,
        required: true,
        helpText: `Required because: ${nameChainReason}. Provide a document for EACH name change.`,
      });
    }

    // --- Sibling-specific docs (Part 6) ---
    if (formData?.part_6?.siblings && Array.isArray(formData.part_6.siblings)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData.part_6.siblings.forEach((sibling: any, index: number) => {
        const siblingName = sibling.name || `Sibling #${index + 1}`;
        const firstName = siblingName.split(" ")[0].toLowerCase();

        requirements.push({
          category: "BIRTH_CERTIFICATE",
          label: `${siblingName} - Birth Certificate`,
          description: `Birth certificate for ${siblingName} to prove relationship`,
          uploaded: uploadedFiles.some(
            (f) =>
              f.category === "BIRTH_CERTIFICATE" &&
              f.originalFilename?.toLowerCase().includes(firstName)
          ),
          required: true,
          helpText:
            "Must show parents' names to establish sibling relationship",
        });

        if (
          sibling.hadNameChange === "YES" ||
          sibling.nameChangeHistory?.length > 0
        ) {
          requirements.push({
            category: "MARRIAGE_CERTIFICATE",
            label: `${siblingName} - Marriage/Name Change`,
            description: `Marriage certificate or legal name change for ${siblingName}`,
            uploaded: uploadedFiles.some(
              (f) =>
                f.category === "MARRIAGE_CERTIFICATE" &&
                f.originalFilename?.toLowerCase().includes(firstName)
            ),
            required: true,
            helpText: "Required to link current name to birth certificate",
          });
        }
      });
    }

    // --- Part 5: Surviving Spouse docs ---
    if (formData?.part_5?.documentsIdentified) {
      const part5Docs = formData.part_5.documentsIdentified;
      if (part5Docs.divorcePapersNeeded) {
        requirements.push({
          category: "OTHER",
          label: "Divorce Decree(s)",
          description:
            "Divorce decrees for previous marriages (yours or the person who became ill)",
          uploaded: uploadedFiles.some(
            (f) =>
              f.category === "OTHER" &&
              f.originalFilename?.toLowerCase().includes("divorce")
          ),
          required: true,
          helpText:
            "Contact the court where the divorce was finalized to obtain certified copies",
        });
      }
      if (part5Docs.previousMarriageCertsNeeded > 0) {
        requirements.push({
          category: "MARRIAGE_CERTIFICATE",
          label: `Previous Marriage Certificate(s) (${part5Docs.previousMarriageCertsNeeded})`,
          description:
            "Marriage certificates for prior marriages to establish complete marital history",
          uploaded:
            countUploaded("MARRIAGE_CERTIFICATE") >=
            part5Docs.previousMarriageCertsNeeded + 1,
          required: true,
          helpText: "Contact the county clerk where each marriage took place",
        });
      }
    }

    // --- Part 7: Other Relatives relationship chain ---
    if (
      formData?.part_7?.documentsIdentified &&
      relationship !== "Self" &&
      relationship !== "Spouse" &&
      relationship !== "Child"
    ) {
      const part7Docs = formData.part_7.documentsIdentified;
      if (part7Docs.birthCertificatesNeeded > 1) {
        requirements.push({
          category: "BIRTH_CERTIFICATE",
          label: `Relationship Chain Birth Certificates (${part7Docs.birthCertificatesNeeded} needed)`,
          description:
            "Birth certificates establishing the family chain between you and the person who became ill",
          uploaded:
            countUploaded("BIRTH_CERTIFICATE") >=
            part7Docs.birthCertificatesNeeded,
          required: true,
          helpText:
            "Contact the vital records office in each state of birth. Each link in the family chain needs a birth certificate.",
        });
      }
    }

    // Part 7: Intermediary death certs
    if (
      formData?.part_7?.intermediaryRelatives &&
      Array.isArray(formData.part_7.intermediaryRelatives)
    ) {
      const deceased = formData.part_7.intermediaryRelatives.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.isDeceased === "YES"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deceased.forEach((rel: any) => {
        const relName = rel.name || "Family Member";
        const firstName = relName.split(" ")[0].toLowerCase();
        requirements.push({
          category: "DEATH_CERTIFICATE",
          label: `${relName} - Death Certificate`,
          description: `Death certificate for ${relName} (relationship chain member)`,
          uploaded: uploadedFiles.some(
            (f) =>
              f.category === "DEATH_CERTIFICATE" &&
              f.originalFilename?.toLowerCase().includes(firstName)
          ),
          required: true,
          helpText:
            "Contact the vital records office in the state where death occurred",
        });
      });
    }

    // --- Proof of Presence ---
    requirements.push({
      category: "PROOF_OF_RESIDENCE",
      label: "Proof of Physical Presence (2+ documents)",
      description:
        "Tax records, property records, school enrollment, utility bills, employment records, etc.",
      uploaded:
        uploadedFiles.filter((f) =>
          [
            "PROOF_OF_RESIDENCE",
            "UTILITY_BILL",
            "TAX_RETURN",
            "SCHOOL_RECORDS",
            "MORTGAGE_STATEMENT",
            "EMPLOYMENT_RECORDS",
          ].includes(f.category || "")
        ).length >= 2,
      required: true,
      helpText:
        "Need at least 2 documents showing presence in affected area during exposure period",
    });

    // --- Medical Records ---
    requirements.push({
      category: "MEDICAL_RECORDS",
      label: "Medical Records Showing Cancer Diagnosis",
      description:
        "Pathology reports, biopsy results, hospital records, or doctor's notes confirming compensable disease",
      uploaded: isUploaded("MEDICAL_RECORDS") || isUploaded("PATHOLOGY_REPORT"),
      required: true,
      helpText:
        "See RECA form pages 18-24 for specific documents accepted for each disease type",
    });
  } else {
    // Generic requirements for other claim types
    requirements.push(
      {
        category: "IDENTITY",
        label: "Identification Documents",
        description:
          "Birth certificate, death certificate, marriage certificates as applicable",
        uploaded: isUploaded("IDENTITY"),
        required: true,
        helpText: "Required to establish identity and relationships",
      },
      {
        category: "MEDICAL_RECORDS",
        label: "Medical Records",
        description: "Medical documentation relevant to your claim type",
        uploaded: isUploaded("MEDICAL_RECORDS"),
        required: true,
        helpText:
          "Requirements vary by claim type - refer to your RECA form instructions",
      }
    );
  }

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

// ---------------------------------------------------------------------------
// Hydrate requirement statuses from uploaded files
// ---------------------------------------------------------------------------

type UploadedFileSummary = {
  category?: string | null;
  validation?: {
    status?: string | null;
  } | null;
};

function normalizeCat(cat?: string | null) {
  return (cat || "").toString().toUpperCase();
}

function isVerifiedUpload(file: UploadedFileSummary) {
  const s = (file.validation?.status || "").toString().toUpperCase();
  return s === "VERIFIED" || s === "STAFF_APPROVED";
}

const PRESENCE_CATEGORIES = new Set([
  "UTILITY_BILL",
  "MORTGAGE_STATEMENT",
  "TAX_RETURN",
  "SCHOOL_RECORDS",
  "EMPLOYMENT_RECORDS",
  "LDS_CHURCH_RECORDS",
]);

const MEDICAL_CATEGORIES = new Set([
  "MEDICAL_RECORDS",
  "PATHOLOGY_REPORT",
  "DISCHARGE_SUMMARY",
  "TUMOR_REGISTRY",
  "TREATMENT_RECORDS",
]);

/**
 * Updates requirement statuses based on actually uploaded files.
 *
 * MVP rules:
 * - If matching uploads exist: mark as "uploaded".
 * - If matching uploads are verified/staff-approved: mark as "verified".
 * - For quantity requirements (e.g. proof_of_presence x2), verify only when enough are verified.
 */
export function applyUploadsToRequirements(
  requirements: DocumentRequirement[],
  uploadedFiles: UploadedFileSummary[]
): DocumentRequirement[] {
  const files = uploadedFiles || [];

  const countBy = (predicate: (f: UploadedFileSummary) => boolean) =>
    files.filter(predicate).length;

  const verifiedCountBy = (predicate: (f: UploadedFileSummary) => boolean) =>
    files.filter((f) => predicate(f) && isVerifiedUpload(f)).length;

  const countByCat = (cat: string) =>
    countBy((f) => normalizeCat(f.category) === cat);
  const verifiedByCat = (cat: string) =>
    verifiedCountBy((f) => normalizeCat(f.category) === cat);

  const birthCount = countByCat("BIRTH_CERTIFICATE");
  const birthVerified = verifiedByCat("BIRTH_CERTIFICATE");

  const deathCount = countByCat("DEATH_CERTIFICATE");
  const deathVerified = verifiedByCat("DEATH_CERTIFICATE");

  const marriageCount = countByCat("MARRIAGE_CERTIFICATE");
  const marriageVerified = verifiedByCat("MARRIAGE_CERTIFICATE");

  const medicalCount = countBy((f) =>
    MEDICAL_CATEGORIES.has(normalizeCat(f.category))
  );
  const medicalVerified = verifiedCountBy((f) =>
    MEDICAL_CATEGORIES.has(normalizeCat(f.category))
  );

  const presenceCount = countBy((f) =>
    PRESENCE_CATEGORIES.has(normalizeCat(f.category))
  );
  const presenceVerified = verifiedCountBy((f) =>
    PRESENCE_CATEGORIES.has(normalizeCat(f.category))
  );

  // Helper: apply simple single-doc matching
  function applySimpleMatch(
    next: DocumentRequirement,
    uploaded: number,
    verified: number
  ): DocumentRequirement {
    if (uploaded > 0) {
      next.status = verified > 0 ? "verified" : "uploaded";
      next.notes = `${uploaded} uploaded${verified > 0 ? " (verified)" : ""}`;
    }
    return next;
  }

  // Helper: apply quantity-based matching
  function applyQuantityMatch(
    next: DocumentRequirement,
    uploaded: number,
    verified: number,
    qty: number
  ): DocumentRequirement {
    if (uploaded > 0) {
      next.status = verified >= qty ? "verified" : "uploaded";
      next.notes =
        `Uploaded ${Math.min(uploaded, qty)}/${qty}` +
        (verified > 0 ? ` • Verified ${Math.min(verified, qty)}/${qty}` : "");
    }
    return next;
  }

  // Map requirement IDs to their upload category matches
  const requirementMatchers: Record<
    string,
    (next: DocumentRequirement) => DocumentRequirement
  > = {
    filer_birth_certificate: (n) =>
      applySimpleMatch(n, birthCount, birthVerified),
    parent_birth_certificate: (n) =>
      applySimpleMatch(
        n,
        birthCount > 1 ? birthCount - 1 : birthCount,
        birthVerified > 1 ? birthVerified - 1 : birthVerified
      ),
    spouse_death_certificate: (n) =>
      applySimpleMatch(n, deathCount, deathVerified),
    parent_death_certificate: (n) =>
      applySimpleMatch(n, deathCount, deathVerified),
    sibling_death_certificates: (n) =>
      applySimpleMatch(
        n,
        deathCount > 1 ? deathCount - 1 : 0,
        deathVerified > 1 ? deathVerified - 1 : 0
      ),
    marriage_certificate_spouse: (n) =>
      applySimpleMatch(n, marriageCount, marriageVerified),
    marriage_certificates: (n) => {
      const qty = n.quantity ?? 1;
      return applyQuantityMatch(n, marriageCount, marriageVerified, qty);
    },
    medical_documentation: (n) =>
      applySimpleMatch(n, medicalCount, medicalVerified),
    proof_of_presence: (n) => {
      const qty = n.quantity ?? 2;
      return applyQuantityMatch(n, presenceCount, presenceVerified, qty);
    },
  };

  return requirements.map((req) => {
    const next: DocumentRequirement = { ...req };
    const matcher = requirementMatchers[req.id];
    if (matcher) {
      return matcher(next);
    }
    return next;
  });
}

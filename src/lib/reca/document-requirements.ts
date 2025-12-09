/**
 * Document Requirements Engine
 *
 * Dynamically determines required documents based on form data.
 * Tracks document status and provides intelligent recommendations.
 *
 * Key Features:
 * - Analyzes form data to determine required documents
 * - Handles complex scenarios (deceased claimants, siblings, marriages, etc.)
 * - Provides context-aware document descriptions
 * - Tracks document upload status
 * - Generates warnings for missing critical documents
 */

import type { RECAFormData } from "./types";

/**
 * Maps document requirement IDs to Prisma FileCategory enum values
 * This ensures uploaded documents are correctly associated with requirements
 */
export const REQUIREMENT_TO_FILE_CATEGORY: Record<string, string> = {
  // Claimant vital records
  claimant_birth_cert: "BIRTH_CERTIFICATE",
  claimant_death_cert: "DEATH_CERTIFICATE",

  // Filer identity & relationship proof
  filer_birth_cert: "BIRTH_CERTIFICATE",
  filer_id: "IDENTITY",

  // Marriage records
  marriage_cert: "MARRIAGE_CERTIFICATE",

  // Medical records
  claimant_medical_records: "MEDICAL_RECORDS",
  medical_proof_disease: "MEDICAL_RECORDS",

  // Exposure proof
  proof_of_presence: "PROOF_OF_RESIDENCE",

  // Default patterns for dynamic IDs
  // Siblings: sibling_{index}_death_cert, sibling_{index}_marriage_cert_{change_index}
  // Spouses: claimant_marriage_cert_{index}, prev_marriage_cert_{index}
};

/**
 * Gets the FileCategory for a requirement ID
 * Handles both exact matches and pattern matching for dynamic IDs
 */
export function getFileCategoryForRequirement(
  requirementId: string
): string | null {
  // Try exact match first
  if (REQUIREMENT_TO_FILE_CATEGORY[requirementId]) {
    return REQUIREMENT_TO_FILE_CATEGORY[requirementId];
  }

  // Pattern matching for dynamic IDs
  if (requirementId.includes("_death_cert")) {
    return "DEATH_CERTIFICATE";
  }
  if (
    requirementId.includes("_marriage_cert") ||
    requirementId.includes("marriage_end")
  ) {
    return "MARRIAGE_CERTIFICATE";
  }
  if (requirementId.includes("_birth_cert")) {
    return "BIRTH_CERTIFICATE";
  }
  if (requirementId.includes("_name_change")) {
    return "OTHER"; // Legal name change documents
  }
  if (requirementId.includes("_id")) {
    return "IDENTITY";
  }

  return null;
}

export type DocumentCategory =
  | "CLAIMANT_VITAL_RECORDS"
  | "CLAIMANT_MEDICAL"
  | "FILER_IDENTITY"
  | "RELATIONSHIP_PROOF"
  | "SIBLING_VITAL_RECORDS"
  | "SPOUSE_MARRIAGE"
  | "EXPOSURE_PROOF"
  | "OTHER";

export type DocumentPriority = "REQUIRED" | "RECOMMENDED" | "OPTIONAL";

export interface DocumentRequirement {
  id: string;
  category: DocumentCategory;
  priority: DocumentPriority;
  title: string;
  description: string;
  reason: string; // Why this document is needed
  uploadKey?: string; // Key in uploaded files
  fileCategory?: string; // Maps to Prisma FileCategory enum
  isUploaded: boolean;
  conditionalReason?: string; // Additional context based on form data
  relatedFormSection?: string; // Which form section triggered this requirement
  tips?: string[]; // Helpful tips for obtaining this document
}

export interface DocumentRequirementsAnalysis {
  requirements: DocumentRequirement[];
  requiredCount: number;
  uploadedCount: number;
  missingRequired: DocumentRequirement[];
  warnings: string[];
  completionPercentage: number;
}

/**
 * Analyze form data and determine all required documents
 */
export function analyzeDocumentRequirements(
  formData: Partial<RECAFormData>,
  uploadedFiles?: Record<string, boolean>
): DocumentRequirementsAnalysis {
  const requirements: DocumentRequirement[] = [];
  const warnings: string[] = [];

  // 1. CLAIMANT VITAL RECORDS
  if (formData.part_2) {
    const claimant = formData.part_2;

    // Birth Certificate
    const claimantBirthCertId = "claimant_birth_cert";
    requirements.push({
      id: claimantBirthCertId,
      category: "CLAIMANT_VITAL_RECORDS",
      priority: "REQUIRED",
      title: "Claimant's Birth Certificate",
      description: `Birth certificate for ${claimant.firstName} ${claimant.lastName}`,
      reason:
        "Required to verify identity and age of the person who became ill",
      uploadKey: "claimant_birth_certificate",
      fileCategory:
        getFileCategoryForRequirement(claimantBirthCertId) || undefined,
      isUploaded: uploadedFiles?.["BIRTH_CERTIFICATE"] || false,
      relatedFormSection: "part_2",
      tips: [
        "Request from the state vital records office where they were born",
        "Certified copy required (not hospital certificate)",
        "If unavailable, baptismal certificate or other early life records may be accepted",
      ],
    });

    // Death Certificate (if deceased)
    if (claimant.dod) {
      const hasCancerCause = true; // TODO: Detect from death certificate analysis

      const claimantDeathCertId = "claimant_death_cert";
      requirements.push({
        id: claimantDeathCertId,
        category: "CLAIMANT_VITAL_RECORDS",
        priority: "REQUIRED",
        title: "Claimant's Death Certificate",
        description: `Death certificate for ${claimant.firstName} ${claimant.lastName}`,
        reason:
          "Required for deceased claimant claims to verify date and cause of death",
        uploadKey: "claimant_death_certificate",
        fileCategory:
          getFileCategoryForRequirement(claimantDeathCertId) || undefined,
        isUploaded: uploadedFiles?.["DEATH_CERTIFICATE"] || false,
        relatedFormSection: "part_2",
        conditionalReason: hasCancerCause
          ? "Death certificate shows cancer as cause - medical records recommended"
          : "Check that cause of death is listed accurately",
        tips: [
          "Request from the state vital records office where they passed away",
          "Certified copy required",
          "Ensure cause of death is clearly stated",
          "If cancer is listed as cause, gather supporting medical records",
        ],
      });

      // Medical Records (if cause of death is cancer or disease-related)
      if (hasCancerCause) {
        const claimantMedicalRecordsId = "claimant_medical_records";
        requirements.push({
          id: claimantMedicalRecordsId,
          category: "CLAIMANT_MEDICAL",
          priority: "RECOMMENDED",
          title: "Medical Records Confirming Disease",
          description: `Medical records for ${claimant.firstName} ${claimant.lastName}`,
          reason:
            "Death certificate indicates cancer - medical records strengthen claim",
          uploadKey: "claimant_medical_records",
          fileCategory:
            getFileCategoryForRequirement(claimantMedicalRecordsId) ||
            undefined,
          isUploaded: uploadedFiles?.["MEDICAL_RECORDS"] || false,
          relatedFormSection: "part_11",
          tips: [
            "Hospital discharge summaries",
            "Pathology reports",
            "Oncology treatment records",
            "Autopsy reports (if available)",
          ],
        });
      }
    }
  }

  // 2. RELATIONSHIP-SPECIFIC DOCUMENTS
  const relationship = formData.part_3?.relationship;

  if (relationship === "Child" && formData.part_6) {
    // Filing as child - need to prove parent-child relationship

    // Filer's Birth Certificate (to prove parent-child relationship)
    const filerBirthCertId = "filer_birth_cert";
    requirements.push({
      id: filerBirthCertId,
      category: "RELATIONSHIP_PROOF",
      priority: "REQUIRED",
      title: "Your Birth Certificate",
      description: `Birth certificate showing ${formData.part_2?.firstName} ${formData.part_2?.lastName} as parent`,
      reason:
        "Required to prove you are the child of the person who became ill",
      uploadKey: "filer_birth_certificate",
      fileCategory:
        getFileCategoryForRequirement(filerBirthCertId) || undefined,
      isUploaded: uploadedFiles?.["BIRTH_CERTIFICATE"] || false,
      relatedFormSection: "part_3",
      tips: [
        "Must show parent's name as mother or father",
        "If adopted, adoption decree may be required",
        "If step-child, marriage certificate of parent to claimant may be needed",
      ],
    });

    // Sibling Death Certificates
    if (formData.part_6.siblings) {
      formData.part_6.siblings.forEach((sibling, index) => {
        if (sibling.isDeceased === "YES") {
          const siblingDeathCertId = `sibling_${index}_death_cert`;
          requirements.push({
            id: siblingDeathCertId,
            category: "SIBLING_VITAL_RECORDS",
            priority: "REQUIRED",
            title: `Death Certificate for ${sibling.name}`,
            description: `Death certificate for sibling: ${sibling.name}`,
            reason: "Required for each deceased sibling listed in the claim",
            uploadKey: sibling.deathCertificateFileKey,
            fileCategory:
              getFileCategoryForRequirement(siblingDeathCertId) || undefined,
            isUploaded:
              !!sibling.deathCertificateFileKey ||
              uploadedFiles?.["DEATH_CERTIFICATE"] ||
              false,
            relatedFormSection: "part_6",
            tips: [
              "Required for DOJ to determine eligible survivors",
              "Helps calculate award distribution among surviving siblings",
            ],
          });

          if (sibling.hasDeathCertificate === "WILL_OBTAIN") {
            warnings.push(
              `Death certificate for ${sibling.name} marked as "will obtain" - must be submitted before final approval`
            );
          } else if (sibling.hasDeathCertificate === "NO") {
            warnings.push(
              `Death certificate for ${sibling.name} unavailable - claim may require additional documentation or affidavits`
            );
          }
        }

        // Name Change Documentation
        if (sibling.hadNameChange === "YES" && sibling.nameChangeHistory) {
          sibling.nameChangeHistory.forEach((change, changeIndex) => {
            if (change.reasonForChange === "MARRIAGE") {
              const siblingMarriageCertId = `sibling_${index}_marriage_cert_${changeIndex}`;
              requirements.push({
                id: siblingMarriageCertId,
                category: "SIBLING_VITAL_RECORDS",
                priority: "REQUIRED",
                title: `Marriage Certificate for ${sibling.name}`,
                description: `Marriage certificate showing name change from ${change.previousName} to ${sibling.name}`,
                reason:
                  "Required to trace name back to mother's maiden name or establish family relationship",
                uploadKey: `sibling_${index}_marriage_${changeIndex}`,
                fileCategory:
                  getFileCategoryForRequirement(siblingMarriageCertId) ||
                  undefined,
                isUploaded: uploadedFiles?.["MARRIAGE_CERTIFICATE"] || false,
                relatedFormSection: "part_6",
                tips: [
                  "Shows name change due to marriage",
                  "Helps DOJ verify family relationship",
                  "Particularly important for sisters who married",
                ],
              });
            } else if (change.reasonForChange === "LEGAL_NAME_CHANGE") {
              const siblingNameChangeId = `sibling_${index}_name_change_${changeIndex}`;
              requirements.push({
                id: siblingNameChangeId,
                category: "SIBLING_VITAL_RECORDS",
                priority: "REQUIRED",
                title: `Legal Name Change Document for ${sibling.name}`,
                description: `Court order or legal document showing name change from ${change.previousName}`,
                reason:
                  "Required to establish identity and family relationship",
                uploadKey: `sibling_${index}_name_change_${changeIndex}`,
                fileCategory:
                  getFileCategoryForRequirement(siblingNameChangeId) ||
                  undefined,
                isUploaded: uploadedFiles?.["OTHER"] || false,
                relatedFormSection: "part_6",
                tips: [
                  "Court decree or official legal name change document",
                  "Must show both old and new names clearly",
                ],
              });
            }
          });
        }
      });
    }

    // Claimant's Marriage Certificate (if ever married)
    if (
      formData.part_6.claimantEverMarried === "YES" &&
      formData.part_6.claimantSpouses
    ) {
      formData.part_6.claimantSpouses.forEach((spouse, index) => {
        const claimantMarriageCertId = `claimant_marriage_cert_${index}`;
        requirements.push({
          id: claimantMarriageCertId,
          category: "SPOUSE_MARRIAGE",
          priority: "REQUIRED",
          title: `Marriage Certificate: ${formData.part_2?.firstName} to ${spouse.spouseName}`,
          description: `Marriage certificate between claimant and ${spouse.spouseName}`,
          reason:
            "Required to verify marital history and potential surviving spouse claims",
          uploadKey: `claimant_marriage_${index}`,
          fileCategory:
            getFileCategoryForRequirement(claimantMarriageCertId) || undefined,
          isUploaded: uploadedFiles?.["MARRIAGE_CERTIFICATE"] || false,
          relatedFormSection: "part_6",
        });
      });
    }
  }

  if (relationship === "Spouse" && formData.part_5) {
    // Filing as spouse - need marriage certificate
    const marriageCertId = "marriage_cert";
    requirements.push({
      id: marriageCertId,
      category: "SPOUSE_MARRIAGE",
      priority: "REQUIRED",
      title: "Marriage Certificate",
      description: `Marriage certificate between you and ${formData.part_2?.firstName} ${formData.part_2?.lastName}`,
      reason:
        "Required to prove marital relationship to the person who became ill",
      uploadKey: "marriage_certificate",
      fileCategory: getFileCategoryForRequirement(marriageCertId) || undefined,
      isUploaded: uploadedFiles?.["MARRIAGE_CERTIFICATE"] || false,
      relatedFormSection: "part_5",
      tips: [
        "Must show both spouse names",
        "Must show marriage date",
        "Certified copy required",
      ],
    });

    // Previous marriage certificates (if any)
    if (formData.part_5.claimantPreviousSpouses) {
      formData.part_5.claimantPreviousSpouses.forEach((spouse, index) => {
        const prevMarriageCertId = `prev_marriage_cert_${index}`;
        requirements.push({
          id: prevMarriageCertId,
          category: "SPOUSE_MARRIAGE",
          priority: "REQUIRED",
          title: `Previous Marriage Certificate: ${spouse.spouseName}`,
          description: `Marriage certificate for claimant's previous marriage to ${spouse.spouseName}`,
          reason: "Required to verify marital history and eligibility",
          uploadKey: `previous_marriage_${index}`,
          fileCategory:
            getFileCategoryForRequirement(prevMarriageCertId) || undefined,
          isUploaded: uploadedFiles?.["MARRIAGE_CERTIFICATE"] || false,
          relatedFormSection: "part_5",
        });

        // Divorce decree or death certificate to prove marriage ended
        const prevMarriageEndId = `prev_marriage_end_${index}`;
        requirements.push({
          id: prevMarriageEndId,
          category: "SPOUSE_MARRIAGE",
          priority: "REQUIRED",
          title: `Divorce Decree or Death Certificate: ${spouse.spouseName}`,
          description: `Document proving end of marriage to ${spouse.spouseName}`,
          reason:
            "Required to prove previous marriage ended before current marriage",
          uploadKey: `previous_marriage_end_${index}`,
          fileCategory:
            getFileCategoryForRequirement(prevMarriageEndId) || undefined,
          isUploaded:
            uploadedFiles?.["MARRIAGE_CERTIFICATE"] ||
            uploadedFiles?.["DEATH_CERTIFICATE"] ||
            false,
          relatedFormSection: "part_5",
          tips: [
            "Divorce decree if marriage ended in divorce",
            "Death certificate if spouse is deceased",
            "Must match dates provided in application",
          ],
        });
      });
    }
  }

  // 3. FILER IDENTITY DOCUMENTS (always required unless filing for self)
  if (formData.part_1 && !formData.part_1.filingForSelf) {
    const filerIdId = "filer_id";
    requirements.push({
      id: filerIdId,
      category: "FILER_IDENTITY",
      priority: "REQUIRED",
      title: "Your Government-Issued ID",
      description: "Driver's license, passport, or state ID",
      reason: "Required to verify your identity as the person filing the claim",
      uploadKey: "filer_id",
      fileCategory: getFileCategoryForRequirement(filerIdId) || undefined,
      isUploaded: uploadedFiles?.["IDENTITY"] || false,
      relatedFormSection: "part_1",
      tips: [
        "Photo ID required",
        "Must be current and not expired",
        "Both sides of license if applicable",
      ],
    });
  }

  // 4. EXPOSURE PROOF DOCUMENTS
  if (formData.part_9) {
    const proofOfPresenceId = "proof_of_presence";
    requirements.push({
      id: proofOfPresenceId,
      category: "EXPOSURE_PROOF",
      priority: "REQUIRED",
      title: "Proof of Presence in Affected Area",
      description:
        "Documents proving residence in downwinder area during exposure period",
      reason:
        "Required to prove claimant was in affected area during nuclear testing",
      uploadKey: "proof_of_presence",
      fileCategory:
        getFileCategoryForRequirement(proofOfPresenceId) || undefined,
      isUploaded: uploadedFiles?.["PROOF_OF_RESIDENCE"] || false,
      relatedFormSection: "part_9",
      tips: [
        "School enrollment records",
        "Tax records showing residence",
        "Property records",
        "Utility bills",
        "Employment records",
        "Census records",
        "Military records",
        "Church records",
      ],
    });
  }

  // 5. MEDICAL PROOF OF DISEASE
  if (formData.part_11) {
    const medicalProofDiseaseId = "medical_proof_disease";
    requirements.push({
      id: medicalProofDiseaseId,
      category: "CLAIMANT_MEDICAL",
      priority: "REQUIRED",
      title: "Medical Records Proving Compensable Disease",
      description: "Medical documentation of cancer or compensable disease",
      reason:
        "Required to prove claimant had a compensable disease covered by RECA",
      uploadKey: "medical_records_disease",
      fileCategory:
        getFileCategoryForRequirement(medicalProofDiseaseId) || undefined,
      isUploaded: uploadedFiles?.["MEDICAL_RECORDS"] || false,
      relatedFormSection: "part_11",
      tips: [
        "Pathology reports",
        "Hospital records",
        "Physician statements",
        "Treatment records",
        "Diagnosis reports",
      ],
    });
  }

  // Calculate summary statistics
  const requiredDocs = requirements.filter((r) => r.priority === "REQUIRED");
  const uploadedRequired = requiredDocs.filter((r) => r.isUploaded);

  const analysis: DocumentRequirementsAnalysis = {
    requirements,
    requiredCount: requiredDocs.length,
    uploadedCount: uploadedRequired.length,
    missingRequired: requiredDocs.filter((r) => !r.isUploaded),
    warnings,
    completionPercentage:
      requiredDocs.length > 0
        ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
        : 0,
  };

  return analysis;
}

/**
 * Get requirements by category
 */
export function getRequirementsByCategory(
  analysis: DocumentRequirementsAnalysis,
  category: DocumentCategory
): DocumentRequirement[] {
  return analysis.requirements.filter((r) => r.category === category);
}

/**
 * Get requirements by priority
 */
export function getRequirementsByPriority(
  analysis: DocumentRequirementsAnalysis,
  priority: DocumentPriority
): DocumentRequirement[] {
  return analysis.requirements.filter((r) => r.priority === priority);
}

/**
 * Check if all required documents are uploaded
 */
export function areAllRequiredDocumentsUploaded(
  analysis: DocumentRequirementsAnalysis
): boolean {
  return analysis.missingRequired.length === 0;
}

/**
 * Get human-readable category name
 */
export function getCategoryDisplayName(category: DocumentCategory): string {
  const names: Record<DocumentCategory, string> = {
    CLAIMANT_VITAL_RECORDS: "Claimant Vital Records",
    CLAIMANT_MEDICAL: "Medical Records",
    FILER_IDENTITY: "Your Identity",
    RELATIONSHIP_PROOF: "Relationship Proof",
    SIBLING_VITAL_RECORDS: "Sibling Records",
    SPOUSE_MARRIAGE: "Marriage Records",
    EXPOSURE_PROOF: "Proof of Exposure",
    OTHER: "Other Documents",
  };
  return names[category] || category;
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: DocumentPriority): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    DocumentPriority,
    { bg: string; text: string; border: string }
  > = {
    REQUIRED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    RECOMMENDED: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    OPTIONAL: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
  };
  return colors[priority];
}

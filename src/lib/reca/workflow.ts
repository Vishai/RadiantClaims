/**
 * RECA Workflow State Machine Logic
 * Determines which parts of the form are required based on relationship type
 */

import {
  RelationshipType,
  RECAWorkflowSection,
  WORKFLOW_STAGES,
  RECAWorkflowStage,
  RECAFormData,
} from "./types";

/**
 * Get the sequence of sections to complete based on relationship type
 */
export function getSectionSequence(
  relationship: RelationshipType
): RECAWorkflowSection[] {
  const baseSections: RECAWorkflowSection[] = [
    "part_1", // Filer information (always required)
  ];

  // Add Part 2 if not self-filing
  if (relationship !== "Self") {
    baseSections.push("part_2");
  }

  baseSections.push("part_3"); // Relationship selection

  // Add relationship-specific section (Parts 4-7)
  switch (relationship) {
    case "Self":
      baseSections.push("part_4");
      break;
    case "Spouse":
      baseSections.push("part_5");
      break;
    case "Child":
      baseSections.push("part_6");
      break;
    case "Parent":
    case "Grandchild":
    case "Grandparent":
      baseSections.push("part_7");
      break;
  }

  // Add remaining required sections
  baseSections.push(
    "part_8", // Exposure information
    "part_9", // Proof of presence
    "part_10", // Compensable diseases
    "part_11", // Proof of disease
    "part_12", // Previous payments
    "part_13" // Attorney representation
    // Part 14 is conditional on part_13.hasAttorney
    // Part 15 is conditional on having a legal guardian
  );

  baseSections.push("part_16"); // Signature (always last)

  return baseSections;
}

/**
 * Determine if a section should be skipped based on previous answers
 */
export function shouldSkipSection(
  section: RECAWorkflowSection,
  formData: any
): boolean {
  switch (section) {
    case "part_2":
      // Skip Part 2 if user selected "filing for myself" in Part 1
      // OR if they selected "Self" relationship in Part 3
      return (
        formData.part_1?.filingForSelf === true ||
        formData.part_3?.relationship === "Self"
      );

    case "part_4":
      return formData.part_3?.relationship !== "Self";

    case "part_5":
      return formData.part_3?.relationship !== "Spouse";

    case "part_6":
      return formData.part_3?.relationship !== "Child";

    case "part_7":
      return !["Parent", "Grandchild", "Grandparent"].includes(
        formData.part_3?.relationship
      );

    case "part_14":
      return formData.part_13?.hasAttorney !== "YES";

    case "part_15":
      // Skip unless explicitly indicated they have a legal guardian
      return !formData.hasLegalGuardian;

    default:
      return false;
  }
}

/**
 * Get the next section in the workflow
 */
export function getNextSection(
  currentSection: RECAWorkflowSection,
  relationship: RelationshipType,
  formData: any
): RECAWorkflowSection | null {
  // Special case: After Part 16, navigate to supporting forms
  if (currentSection === "part_16") {
    return "supporting_forms";
  }

  // Special case: After supporting forms, navigate to review
  if (currentSection === "supporting_forms") {
    return "review";
  }

  // Special case: After review, navigate to final review
  if (currentSection === "review") {
    return "final_review";
  }

  // Special case: After document checklist, navigate to final review
  if (currentSection === "document_checklist") {
    return "final_review";
  }

  const sequence = getSectionSequence(relationship);
  const currentIndex = sequence.indexOf(currentSection);

  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null; // End of sequence
  }

  let nextIndex = currentIndex + 1;
  let nextSection = sequence[nextIndex];

  // Skip sections that don't apply
  while (nextSection && shouldSkipSection(nextSection, formData)) {
    nextIndex++;
    nextSection = sequence[nextIndex];
  }

  return nextSection || null;
}

/**
 * Get the previous section in the workflow
 */
export function getPreviousSection(
  currentSection: RECAWorkflowSection,
  relationship: RelationshipType,
  formData: any
): RECAWorkflowSection | null {
  const sequence = getSectionSequence(relationship);
  const currentIndex = sequence.indexOf(currentSection);

  if (currentIndex <= 0) {
    return null; // Beginning of sequence
  }

  let prevIndex = currentIndex - 1;
  let prevSection = sequence[prevIndex];

  // Skip sections that don't apply
  while (prevSection && shouldSkipSection(prevSection, formData)) {
    prevIndex--;
    prevSection = sequence[prevIndex];
  }

  return prevSection || null;
}

/**
 * Calculate which workflow stage a section belongs to
 */
export function getSectionStage(
  section: RECAWorkflowSection
): RECAWorkflowStage {
  if (section === "eligibility") {
    return WORKFLOW_STAGES.ELIGIBILITY;
  }

  if (section.startsWith("part_")) {
    return WORKFLOW_STAGES.FORM_COMPLETION;
  }

  if (section === "supporting_forms") {
    return WORKFLOW_STAGES.SUPPORTING_FORMS;
  }

  if (section === "document_checklist") {
    return WORKFLOW_STAGES.DOCUMENT_PREPARATION;
  }

  if (section === "review" || section === "final_review") {
    return WORKFLOW_STAGES.REVIEW_SUBMIT;
  }

  return WORKFLOW_STAGES.FORM_COMPLETION;
}

/**
 * Get required documents based on relationship type
 */
export function getRequiredDocuments(
  relationship: RelationshipType,
  formData: any
): Array<{
  id: string;
  name: string;
  required: boolean;
  category: string;
}> {
  const documents: Array<{
    id: string;
    name: string;
    required: boolean;
    category: string;
  }> = [];

  // Always required
  documents.push({
    id: "filer_birth_cert",
    name: "Birth certificate (yours)",
    required: true,
    category: "vital_records",
  });

  // Relationship-specific documents
  switch (relationship) {
    case "Self":
      if (formData.part_1?.formerNames) {
        documents.push({
          id: "marriage_certs",
          name: "Marriage certificate(s) documenting name changes",
          required: false,
          category: "vital_records",
        });
      }
      break;

    case "Spouse":
      documents.push(
        {
          id: "claimant_birth_cert",
          name: "Birth certificate (person who became ill)",
          required: true,
          category: "vital_records",
        },
        {
          id: "claimant_death_cert",
          name: "Death certificate (person who became ill)",
          required: true,
          category: "vital_records",
        },
        {
          id: "marriage_cert",
          name: "Marriage certificate (your marriage to claimant)",
          required: true,
          category: "vital_records",
        }
      );
      break;

    case "Child":
      documents.push(
        {
          id: "claimant_birth_cert",
          name: "Birth certificate (person who became ill)",
          required: true,
          category: "vital_records",
        },
        {
          id: "claimant_death_cert",
          name: "Death certificate (person who became ill)",
          required: true,
          category: "vital_records",
        },
        {
          id: "claimant_marriage_certs",
          name: "Marriage certificate(s) of person who became ill",
          required: true,
          category: "vital_records",
        },
        {
          id: "filer_birth_adoption",
          name: "Birth certificate or adoption papers (yours)",
          required: true,
          category: "vital_records",
        }
      );
      break;

    case "Parent":
    case "Grandchild":
    case "Grandparent":
      documents.push(
        {
          id: "claimant_birth_cert",
          name: "Birth certificate (person who became ill)",
          required: true,
          category: "vital_records",
        },
        {
          id: "claimant_death_cert",
          name: "Death certificate (person who became ill)",
          required: true,
          category: "vital_records",
        }
      );
      break;
  }

  // Always required - Presence documentation
  documents.push({
    id: "proof_of_presence",
    name: "Proof of presence in affected area (2+ documents)",
    required: true,
    category: "residence_proof",
  });

  // Always required - Medical proof
  documents.push({
    id: "medical_proof",
    name: "Medical proof of compensable disease",
    required: true,
    category: "medical_records",
  });

  return documents;
}

/**
 * Get section display name
 */
export function getSectionDisplayName(section: RECAWorkflowSection): string {
  const names: Record<RECAWorkflowSection, string> = {
    eligibility: "Eligibility Assessment",
    part_1: "Your Information",
    part_2: "Claimant Information",
    part_3: "Relationship",
    part_4: "Self-Filer Information",
    part_5: "Surviving Spouse Information",
    part_6: "Surviving Child Information",
    part_7: "Other Relatives Information",
    part_8: "Exposure Information",
    part_9: "Proof of Presence",
    part_10: "Compensable Diseases",
    part_11: "Proof of Disease",
    part_12: "Previous Payments",
    part_13: "Attorney Representation",
    part_14: "Attorney Acknowledgment",
    part_15: "Legal Guardian",
    part_16: "Signature",
    supporting_forms: "Supporting Forms",
    document_checklist: "Document Checklist",
    review: "Review Your Application",
    final_review: "Final Review",
  };

  return names[section] || section;
}

/**
 * Calculate completion percentage based on filled sections
 */
export function calculateCompletionPercentage(
  formData: any,
  supportingForms: any,
  eligibilityData: any
): number {
  const sections = [
    "part_1",
    "part_2",
    "part_3",
    "part_8",
    "part_9",
    "part_10",
    "part_11",
    "part_12",
    "part_13",
    "part_16",
  ];

  let completedSections = 0;
  const totalSections = sections.length;

  sections.forEach((section) => {
    if (formData[section] && Object.keys(formData[section]).length > 0) {
      completedSections++;
    }
  });

  if (eligibilityData?.isEligible !== undefined) {
    completedSections += 0.5;
  }

  if (supportingForms && Object.keys(supportingForms).length > 0) {
    completedSections += 1;
  }

  return Math.round((completedSections / (totalSections + 1.5)) * 100);
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stage: RECAWorkflowStage): string {
  const names: Record<RECAWorkflowStage, string> = {
    1: "Eligibility Assessment",
    2: "Form Completion",
    3: "Supporting Forms",
    4: "Document Preparation",
    5: "Review & Submit",
  };

  return names[stage] || `Stage ${stage}`;
}

export type SupportingFormType =
  | "medical_info_release"
  | "certification_of_identity"
  | "tribal_records_release"
  | "surviving_beneficiaries";

export function getSupportingFormsForClaim(
  formData: Partial<RECAFormData>
): SupportingFormType[] {
  const required: SupportingFormType[] = ["certification_of_identity"];

  if (formData.part_11?.cancerRegistryAuthorization) {
    required.push("medical_info_release");
  }

  if (formData.part_1?.tribalAffiliation) {
    required.push("tribal_records_release");
  }

  if (formData.part_3?.relationship === "Child") {
    required.push("surviving_beneficiaries");
  }

  return required;
}

export function isSupportingFormOptional(
  formType: SupportingFormType
): boolean {
  return formType === "surviving_beneficiaries";
}

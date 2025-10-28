/**
 * RECA Downwinder Claim Form Types
 * Based on reca_form_structure.json
 */

// ============================================================================
// Workflow Types
// ============================================================================

export type RECAWorkflowStage = 1 | 2 | 3 | 4 | 5;

export const WORKFLOW_STAGES = {
  ELIGIBILITY: 1,
  FORM_COMPLETION: 2,
  SUPPORTING_FORMS: 3,
  DOCUMENT_PREPARATION: 4,
  REVIEW_SUBMIT: 5,
} as const;

export type RECAWorkflowSection =
  | "eligibility"
  | "part_1"
  | "part_2"
  | "part_3"
  | "part_4"
  | "part_5"
  | "part_6"
  | "part_7"
  | "part_8"
  | "part_9"
  | "part_10"
  | "part_11"
  | "part_12"
  | "part_13"
  | "part_14"
  | "part_15"
  | "part_16"
  | "supporting_forms"
  | "document_checklist"
  | "final_review";

export type RelationshipType =
  | "Self"
  | "Spouse"
  | "Child"
  | "Parent"
  | "Grandchild"
  | "Grandparent";

// ============================================================================
// Form Data Types - Part 1: Filer Information
// ============================================================================

export interface Part1FilerInfo {
  // Filing status - helps determine workflow
  filingForSelf?: boolean; // true = I am the person who became ill, false = filing for someone else

  firstName: string;
  middleName?: string;
  lastName: string;
  formerNames?: string;
  ssn: string;
  dob: string; // ISO date string
  mailingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneDay?: string;
  phoneEvening?: string;
  email?: string;
  residenceAddress?: string;
  tribalAffiliation?: string;
  tribalCensusNumber?: string;
  tribalAssistance?: string[];
}

// ============================================================================
// Part 2: Claimant Information
// ============================================================================

export interface Part2ClaimantInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  formerNames?: string;
  ssn: string;
  dob: string;
  dod?: string; // Date of death
}

// ============================================================================
// Part 3: Relationship Selection
// ============================================================================

export interface Part3Relationship {
  relationship: RelationshipType;
}

// ============================================================================
// Part 4: Self-Filers
// ============================================================================

export interface Part4SelfFiler {
  // No additional fields - just document requirements
}

// ============================================================================
// Part 5: Surviving Spouse
// ============================================================================

export interface Part5SurvivingSpouse {
  claimantDeceased: "YES" | "NO";
  marriedOneYear: "YES" | "NO";
  claimantPreviousMarriages: "YES" | "NO";
  claimantPreviousSpouses?: Array<{
    spouseName: string;
    marriageStart: string;
    marriageEnd: string;
  }>;
  filerOtherMarriages: "YES" | "NO";
  filerOtherSpouses?: Array<{
    spouseName: string;
    marriageStart: string;
    marriageEnd: string;
  }>;
}

// ============================================================================
// Part 6: Surviving Child
// ============================================================================

export interface NameChangeRecord {
  previousName: string;
  dateOfChange: string; // MM/DD/YYYY
  reasonForChange: "MARRIAGE" | "DIVORCE" | "LEGAL_NAME_CHANGE" | "OTHER";
  otherReason?: string; // If reasonForChange = OTHER
}

export interface SiblingInformation {
  name: string;
  dateOfBirth: string; // MM/DD/YYYY
  cityOfBirth: string;
  stateOfBirth: string;
  isDeceased: "YES" | "NO";
  dateOfDeath?: string; // Required if isDeceased = YES (MM/DD/YYYY)
  cityOfDeath?: string; // Required if isDeceased = YES
  stateOfDeath?: string; // Required if isDeceased = YES
  hasDeathCertificate?: "YES" | "NO" | "WILL_OBTAIN"; // Required if isDeceased = YES
  deathCertificateFileKey?: string; // Upload key if certificate uploaded
  currentAddress?: string; // Required if isDeceased = NO (full address)
  phoneNumber?: string; // Required if isDeceased = NO

  // Name change tracking (for anyone who has changed their name)
  hadNameChange?: "YES" | "NO";
  nameChangeHistory?: NameChangeRecord[];
  originalLastName?: string; // Original last name at birth
}

export interface Part6SurvivingChild {
  // Verification questions
  claimantDeceased: "YES" | "NO";
  claimantEverMarried: "YES" | "NO";

  // Claimant's marriage history (if applicable)
  claimantSpouses?: Array<{
    spouseName: string;
    marriageStart: string;
    marriageEnd: string;
  }>;

  // Type of child relationship
  childType: "NATURAL" | "ADOPTED CHILD" | "STEP-CHILD";

  // Sibling information (includes name change history within each sibling)
  otherChildrenExist: "YES" | "NO";
  siblings?: SiblingInformation[]; // All siblings including self
}

// ============================================================================
// Part 7: Parent/Grandchild/Grandparent
// ============================================================================

export interface Part7OtherRelatives {
  relationshipType: "PARENT" | "GRANDCHILD" | "GRANDPARENT";
}

// ============================================================================
// Part 8: Exposure Information
// ============================================================================

export type ExposureOption = "option_1a" | "option_1b" | "option_2";

export interface AffectedArea {
  state: "Idaho" | "New Mexico" | "Utah";
  townCity: string;
  timePeriod: string;
}

export interface ArizonaCounty {
  county: "Coconino" | "Yavapai" | "Navajo" | "Apache" | "Gila" | "Mohave";
  townCity: string;
  timePeriod: string;
}

export interface NevadaCounty {
  county:
    | "White Pine"
    | "Nye"
    | "Lander"
    | "Lincoln"
    | "Eureka"
    | "Clark (townships 13-16, ranges 63-71)";
  townCity: string;
  timePeriod: string;
}

export interface Part8Exposure {
  exposureOptions: ExposureOption[];
  affectedAreas?: AffectedArea[];
  arizonaCounties?: ArizonaCounty[];
  nevadaCounties?: NevadaCounty[];
}

// ============================================================================
// Part 9: Proof of Presence
// ============================================================================

export type ProofOfPresenceDocumentType =
  // Residential Documents (contemporaneous written residential)
  | "TAX_RECORDS"
  | "PROPERTY_RECORDS"
  | "SCHOOL_ENROLLMENT"
  | "UTILITY_BILLS"
  | "MORTGAGE_STATEMENTS"
  | "RENTAL_AGREEMENTS"
  // Supplemental Official Documents (employer or government-issued)
  | "EMPLOYMENT_RECORDS"
  | "CENSUS_RECORDS"
  | "GOVERNMENT_CORRESPONDENCE"
  | "GOVERNMENT_ID"
  | "VOTING_RECORDS"
  | "MILITARY_RECORDS"
  // Additional Supporting
  | "CHURCH_RECORDS"
  | "BIRTH_MARRIAGE_RECORDS"
  | "OTHER";

export interface Part9ProofOfPresence {
  uploadedDocuments?: Array<{
    id: string;
    fileName: string;
    fileKey: string;
    documentType: ProofOfPresenceDocumentType;
    uploadedAt: string;
    fileSize: number;
  }>;
}

// ============================================================================
// Part 10: Compensable Diseases
// ============================================================================

export type CompensableDisease =
  | "leukemia"
  | "multiple_myeloma"
  | "lymphomas"
  | "thyroid"
  | "breast"
  | "esophagus"
  | "stomach"
  | "pharynx"
  | "small_intestine"
  | "pancreas"
  | "bile_ducts"
  | "gall_bladder"
  | "salivary_gland"
  | "urinary_bladder"
  | "brain"
  | "colon"
  | "ovary"
  | "liver"
  | "lung";

export interface Part10Diseases {
  diseases: CompensableDisease[];
}

// ============================================================================
// Part 11: Proof of Disease
// ============================================================================

export interface Part11ProofOfDisease {
  medicalRecordsSubmitted: boolean;
  cancerRegistryAuthorization?: boolean;
  resepAssistance?: "YES" | "NO";
  resepClinicName?: string;
}

// ============================================================================
// Part 12: Previous Payments
// ============================================================================

export interface Part12PreviousPayments {
  receivedPayment: "YES" | "NO";
  paymentDetails?: string;
  eeoicpaClaim: "YES" | "NO";
}

// ============================================================================
// Part 13: Attorney Representation
// ============================================================================

export interface Part13Attorney {
  hasAttorney: "YES" | "NO";
  attorneyFirstName?: string;
  attorneyLastName?: string;
  attorneyFirm?: string;
  attorneyAddress?: string;
  attorneyCity?: string;
  attorneyState?: string;
  attorneyZip?: string;
  attorneyPhone?: string;
  attorneyFax?: string;
  attorneyEmail?: string;
}

// ============================================================================
// Part 14: Attorney Acknowledgment
// ============================================================================

export interface Part14AttorneyAcknowledgment {
  feeType: "initial_2_percent" | "resubmission_10_percent";
  attorneySignature: string;
  attorneySignatureDate: string;
}

// ============================================================================
// Part 15: Legal Guardian
// ============================================================================

export interface Part15LegalGuardian {
  guardianFirstName: string;
  guardianMiddleName?: string;
  guardianLastName: string;
  guardianAddress: string;
  guardianCity: string;
  guardianState: string;
  guardianZip: string;
  guardianPhoneDay?: string;
  guardianPhoneEvening?: string;
  guardianEmail?: string;
}

// ============================================================================
// Part 16: Signature
// ============================================================================

export interface Part16Signature {
  signature: string;
  signatureDate: string;
  authorizationAcknowledgment: boolean;
}

// ============================================================================
// Complete Form Data
// ============================================================================

export interface RECAFormData {
  part_1: Part1FilerInfo;
  part_2?: Part2ClaimantInfo; // Only if not self-filing
  part_3: Part3Relationship;
  part_4?: Part4SelfFiler; // Only if Self
  part_5?: Part5SurvivingSpouse; // Only if Spouse
  part_6?: Part6SurvivingChild; // Only if Child
  part_7?: Part7OtherRelatives; // Only if Parent/Grandchild/Grandparent
  part_8: Part8Exposure;
  part_9: Part9ProofOfPresence;
  part_10: Part10Diseases;
  part_11: Part11ProofOfDisease;
  part_12: Part12PreviousPayments;
  part_13: Part13Attorney;
  part_14?: Part14AttorneyAcknowledgment; // Only if has attorney
  part_15?: Part15LegalGuardian; // Only if has guardian
  part_16: Part16Signature;
}

// ============================================================================
// Supporting Forms
// ============================================================================

export interface MedicalInformationRelease {
  stateOfResidence: string;
  patientName: string;
  patientSsn: string;
  patientDob: string;
  patientDod?: string;
  requestorName?: string;
  requestorRelationship?: string;
  signature: string;
  signatureDate: string;
}

export interface CertificationOfIdentity {
  fullName: string;
  citizenshipStatus: "US Citizen" | "Lawful Permanent Resident";
  ssn?: string;
  currentAddress: string;
  dob: string;
  placeOfBirth: string;
  signature: string;
  signatureDate: string;
  // Optional Section 2
  authorizedPersonName?: string;
  relationshipToRequester?: string;
  authorizedPhoneNumber?: string;
  authorizedCurrentAddress?: string;
  authorizedSignature?: string;
  authorizedSignatureDate?: string;
}

export interface TribalRecordsRelease {
  tribalOffice:
    | "Navajo Nation Office of Vital Records"
    | "Hopi Tribe Enrollment Department"
    | "San Carlos Apache Tribal Enrollment Office"
    | "Other";
  otherTribalOffice?: string;
  claimantName: string;
  tribalOrganizationName: string;
  signature: string;
  signatureDate: string;
}

export interface SurvivingBeneficiary {
  beneficiaryName: string;
  beneficiarySsn: string;
  signatureDate: string;
  signature: string;
  attorneyName?: string;
  attorneyPhone?: string;
}

export interface SurvivingBeneficiariesSignatures {
  beneficiaries: SurvivingBeneficiary[];
}

export interface RECASupportingForms {
  medicalInformationRelease?: MedicalInformationRelease;
  certificationOfIdentity: CertificationOfIdentity;
  tribalRecordsRelease?: TribalRecordsRelease;
  survivingBeneficiariesSignatures?: SurvivingBeneficiariesSignatures;
}

// ============================================================================
// Eligibility Assessment
// ============================================================================

export interface EligibilityAssessment {
  relationship: RelationshipType;
  isDeceased?: boolean;
  marriedOneYear?: boolean;
  exposureVerified: boolean;
  exposureOptions: ExposureOption[];
  diseaseSelected?: CompensableDisease[];
  isEligible: boolean;
  ineligibilityReason?: string;
}

// ============================================================================
// Validation Errors
// ============================================================================

export interface FieldError {
  field: string;
  message: string;
}

export interface SectionValidation {
  section: RECAWorkflowSection;
  isValid: boolean;
  errors: FieldError[];
}

export type ValidationErrors = Record<RECAWorkflowSection, FieldError[]>;

// ============================================================================
// Workflow State
// ============================================================================

export interface RECAWorkflowState {
  sessionId: string;
  currentStage: RECAWorkflowStage;
  currentSection: RECAWorkflowSection;
  completionPercentage: number;
  formData: Partial<RECAFormData>;
  supportingForms: Partial<RECASupportingForms>;
  eligibilityData?: EligibilityAssessment;
  validationErrors?: ValidationErrors;
  lastSaved: string; // ISO timestamp
  documentsUploaded: Array<{
    documentId: string;
    type: string;
    category: string;
    filename: string;
    uploadedAt: string;
  }>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SaveWorkflowRequest {
  currentStage?: RECAWorkflowStage;
  currentSection?: RECAWorkflowSection;
  formData?: Partial<RECAFormData>;
  supportingForms?: Partial<RECASupportingForms>;
  eligibilityData?: EligibilityAssessment;
}

export interface SaveWorkflowResponse {
  success: boolean;
  sessionId: string;
  completionPercentage: number;
  lastSaved: string;
}

export interface ValidateSectionRequest {
  section: RECAWorkflowSection;
  data: any;
}

export interface ValidateSectionResponse {
  isValid: boolean;
  errors: FieldError[];
}

export interface GeneratePDFRequest {
  sessionId: string;
  includeSupporting: boolean;
}

export interface GeneratePDFResponse {
  success: boolean;
  pdfUrl: string;
  packetId: string;
}

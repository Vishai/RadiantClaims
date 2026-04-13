"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import confetti from "canvas-confetti";
import { RECAWorkflowState, RECAWorkflowSection } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Mail,
  AlertCircle,
  Edit3,
  ChevronRight,
  Clock,
  ArrowLeft,
  HelpCircle,
  ExternalLink,
  Phone,
  FolderSearch,
  Upload,
} from "lucide-react";
import {
  generateDocumentRequirements,
  applyUploadsToRequirements,
  getDocumentAssistance,
  type DocumentRequirement,
  type DocumentAssistance,
} from "@/lib/reca/document-tracking";
import {
  initializeReviewTracking,
  updateSectionReview,
  generateReviewChecklist,
  getPriorityReviewItems,
  acknowledgeIncompleteItems,
  type CompletionStatus,
  type IncompleteItem,
  type ReviewTrackingState,
} from "@/lib/reca/review-tracking";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { InviteCollaboratorDialog } from "@/components/portal/InviteCollaboratorDialog";
import { ManageCollaboratorsDialog } from "@/components/portal/ManageCollaboratorsDialog";
import { ClaimJourney } from "@/components/reca/ClaimJourney";

// ============================================================================
// Section metadata for completion analysis
// ============================================================================

interface SectionInfo {
  id: RECAWorkflowSection;
  name: string;
  shortName: string;
  required: boolean;
  conditional?: (formData: any) => boolean; // returns true if section is applicable
}

const isSelfFiler = (formData: any) =>
  formData?.part_1?.filingForSelf === true ||
  formData?.part_3?.relationship === "Self";

const SECTION_DEFINITIONS: SectionInfo[] = [
  {
    id: "part_1",
    name: "Part 1: Your Information (Filer)",
    shortName: "Filer Info",
    required: true,
  },
  {
    id: "part_2",
    name: "Part 2: Claimant Information",
    shortName: "Claimant Info",
    required: false,
    conditional: (fd) => !isSelfFiler(fd),
  },
  {
    id: "part_3",
    name: "Part 3: Relationship to Claimant",
    shortName: "Relationship",
    required: true,
  },
  {
    id: "part_4",
    name: "Part 4: Self-Filer Details",
    shortName: "Self-Filer",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Self",
  },
  {
    id: "part_5",
    name: "Part 5: Surviving Spouse",
    shortName: "Spouse",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Spouse",
  },
  {
    id: "part_6",
    name: "Part 6: Surviving Child",
    shortName: "Child",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Child",
  },
  {
    id: "part_7",
    name: "Part 7: Parent/Grandchild/Grandparent",
    shortName: "Other Relative",
    required: false,
    conditional: (fd) =>
      fd?.part_3?.relationship === "Parent" ||
      fd?.part_3?.relationship === "Grandchild" ||
      fd?.part_3?.relationship === "Grandparent",
  },
  {
    id: "part_8",
    name: "Part 8: Exposure Information",
    shortName: "Exposure",
    required: true,
  },
  {
    id: "part_9",
    name: "Part 9: Proof of Presence",
    shortName: "Proof of Presence",
    required: true,
  },
  {
    id: "part_10",
    name: "Part 10: Compensable Diseases",
    shortName: "Diseases",
    required: true,
  },
  {
    id: "part_11",
    name: "Part 11: Proof of Disease",
    shortName: "Proof of Disease",
    required: true,
  },
  {
    id: "part_12",
    name: "Part 12: Previous Payments",
    shortName: "Prior Payments",
    required: true,
  },
  {
    id: "part_13",
    name: "Part 13: Attorney Representation",
    shortName: "Attorney",
    required: true,
  },
  {
    id: "part_14",
    name: "Part 14: Attorney Acknowledgment",
    shortName: "Attorney Ack.",
    required: false,
    conditional: (fd) => fd?.part_13?.hasAttorney === "YES",
  },
  {
    id: "part_15",
    name: "Part 15: Legal Guardian",
    shortName: "Legal Guardian",
    required: false,
    conditional: (fd) => fd?.part_15 && Object.keys(fd.part_15).length > 0,
  },
  {
    id: "part_16",
    name: "Part 16: Signature & Certification",
    shortName: "Signature",
    required: true,
  },
];

// ============================================================================
// Completion analysis types
// ============================================================================

interface SectionStatus {
  id: RECAWorkflowSection;
  name: string;
  shortName: string;
  status:
    | "complete"
    | "needs_required"
    | "optional_remaining"
    | "not_applicable";
  requiredRemaining: number;
  recommendedRemaining: number;
  optionalRemaining: number;
}

interface CompletionAnalysis {
  sections: SectionStatus[];
  completeSections: SectionStatus[];
  needsRequiredSections: SectionStatus[];
  optionalRemainingSections: SectionStatus[];
  overallPercentage: number;
  isFormComplete: boolean;
}

function buildDocumentTaskList(requirements: DocumentRequirement[]): {
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

interface ReviewFieldDefinition {
  path: string;
  label: string;
  importance: IncompleteItem["importance"];
  appliesWhen?: (formData: any) => boolean;
  isComplete?: (value: any, formData: any) => boolean;
}

const REVIEW_SECTION_FIELDS: Partial<
  Record<RECAWorkflowSection, ReviewFieldDefinition[]>
> = {
  part_1: [
    { path: "firstName", label: "First name", importance: "required" },
    { path: "lastName", label: "Last name", importance: "required" },
    { path: "ssn", label: "Social Security Number", importance: "required" },
    { path: "dob", label: "Date of birth", importance: "required" },
    {
      path: "mailingAddress",
      label: "Mailing address",
      importance: "required",
    },
    { path: "city", label: "City", importance: "required" },
    { path: "state", label: "State", importance: "required" },
    { path: "zipCode", label: "ZIP code", importance: "required" },
    {
      path: "phoneDay",
      label: "Daytime phone number",
      importance: "recommended",
    },
    { path: "email", label: "Email address", importance: "recommended" },
  ],
  part_2: [
    { path: "firstName", label: "Claimant first name", importance: "required" },
    { path: "lastName", label: "Claimant last name", importance: "required" },
    { path: "ssn", label: "Claimant SSN", importance: "required" },
    { path: "dob", label: "Claimant date of birth", importance: "required" },
    { path: "dod", label: "Claimant date of death", importance: "required" },
  ],
  part_3: [
    {
      path: "relationship",
      label: "Relationship to claimant",
      importance: "required",
    },
  ],
  part_4: [
    {
      path: "hasNameChanges",
      label: "Name change history",
      importance: "recommended",
      isComplete: (value) => typeof value === "boolean",
    },
    {
      path: "numberOfMarriages",
      label: "Number of marriages",
      importance: "recommended",
      appliesWhen: (fd) => fd?.part_4?.hasNameChanges === true,
      isComplete: (value) => typeof value === "number" && value >= 0,
    },
    {
      path: "specialCircumstances",
      label: "Special circumstances notes",
      importance: "optional",
    },
  ],
  part_5: [
    {
      path: "claimantDeceased",
      label: "Whether claimant is deceased",
      importance: "required",
    },
    {
      path: "dateOfDeath",
      label: "Date of death",
      importance: "required",
      appliesWhen: (fd) => fd?.part_5?.claimantDeceased === "YES",
    },
    { path: "marriageDate", label: "Date of marriage", importance: "required" },
    {
      path: "marriedOneYear",
      label: "One-year marriage requirement",
      importance: "required",
    },
    {
      path: "nameAtMarriage",
      label: "Name at time of marriage",
      importance: "recommended",
    },
    {
      path: "claimantPreviousMarriages",
      label: "Claimant prior marriages",
      importance: "recommended",
    },
    {
      path: "filerOtherMarriages",
      label: "Filer other marriages",
      importance: "recommended",
    },
    {
      path: "specialCircumstances",
      label: "Special circumstances",
      importance: "optional",
    },
  ],
  part_6: [
    {
      path: "survivingSpouseExists",
      label: "Surviving spouse exists",
      importance: "required",
    },
    {
      path: "survivingSpouseMetOneYearRequirement",
      label: "Spouse one-year eligibility",
      importance: "required",
      appliesWhen: (fd) => fd?.part_6?.survivingSpouseExists === "YES",
    },
    {
      path: "claimantDeceased",
      label: "Claimant deceased",
      importance: "required",
    },
    {
      path: "claimantEverMarried",
      label: "Claimant ever married",
      importance: "required",
    },
    {
      path: "claimantSpouses",
      label: "Claimant marriage history entries",
      importance: "required",
      appliesWhen: (fd) => fd?.part_6?.claimantEverMarried === "YES",
      isComplete: (value) => Array.isArray(value) && value.length > 0,
    },
    {
      path: "childType",
      label: "Child relationship type",
      importance: "required",
    },
    {
      path: "otherChildrenExist",
      label: "Other children exist",
      importance: "required",
    },
    {
      path: "siblings",
      label: "Sibling list",
      importance: "required",
      appliesWhen: (fd) => fd?.part_6?.otherChildrenExist === "YES",
      isComplete: (value) => Array.isArray(value) && value.length > 0,
    },
  ],
  part_7: [
    {
      path: "relationshipType",
      label: "Relationship type",
      importance: "required",
    },
    {
      path: "claimantFullName",
      label: "Claimant full name",
      importance: "recommended",
    },
    {
      path: "claimantDateOfBirth",
      label: "Claimant date of birth",
      importance: "recommended",
    },
    {
      path: "claimantDeceased",
      label: "Claimant deceased",
      importance: "recommended",
    },
    {
      path: "claimantDateOfDeath",
      label: "Claimant date of death",
      importance: "required",
      appliesWhen: (fd) => fd?.part_7?.claimantDeceased === "YES",
    },
    {
      path: "survivingSpouseExists",
      label: "Surviving spouse status",
      importance: "recommended",
    },
    {
      path: "survivingChildExists",
      label: "Surviving child status",
      importance: "recommended",
      appliesWhen: (fd) => fd?.part_7?.relationshipType !== "PARENT",
    },
    {
      path: "specialCircumstances",
      label: "Special circumstances",
      importance: "optional",
    },
  ],
  part_8: [
    {
      path: "exposureOptions",
      label: "Exposure time period selection",
      importance: "required",
      isComplete: (value) => Array.isArray(value) && value.length > 0,
    },
    {
      path: "affectedAreas",
      label: "At least one affected area location",
      importance: "required",
      isComplete: (value, fd) => {
        const a = Array.isArray(value) && value.length > 0;
        const b =
          Array.isArray(fd?.part_8?.arizonaCounties) &&
          fd.part_8.arizonaCounties.length > 0;
        const c =
          Array.isArray(fd?.part_8?.nevadaCounties) &&
          fd.part_8.nevadaCounties.length > 0;
        return a || b || c;
      },
    },
  ],
  part_9: [
    {
      path: "uploadedDocuments",
      label: "Proof of presence documents",
      importance: "recommended",
      isComplete: (value) => Array.isArray(value) && value.length > 0,
    },
    {
      path: "ldsChurchAssistance",
      label: "LDS records assistance status",
      importance: "optional",
      isComplete: (value) => typeof value === "boolean",
    },
  ],
  part_10: [
    {
      path: "diseases",
      label: "Compensable disease selection",
      importance: "required",
      isComplete: (value) => Array.isArray(value) && value.length > 0,
    },
  ],
  part_11: [
    {
      path: "medicalRecordsSubmitted",
      label: "Medical records confirmation",
      importance: "required",
      isComplete: (value) => value === true,
    },
    {
      path: "resepAssistance",
      label: "RESEP assistance status",
      importance: "recommended",
    },
    {
      path: "resepClinicName",
      label: "RESEP clinic name",
      importance: "required",
      appliesWhen: (fd) => fd?.part_11?.resepAssistance === "YES",
    },
    {
      path: "cancerRegistryAuthorization",
      label: "Cancer registry authorization",
      importance: "optional",
      isComplete: (value) => typeof value === "boolean",
    },
  ],
  part_12: [
    {
      path: "receivedPayment",
      label: "Previous payment disclosure",
      importance: "required",
    },
    {
      path: "paymentDetails",
      label: "Payment details",
      importance: "required",
      appliesWhen: (fd) => fd?.part_12?.receivedPayment === "YES",
    },
    {
      path: "eeoicpaClaim",
      label: "EEOICPA claim disclosure",
      importance: "required",
    },
  ],
  part_13: [
    {
      path: "hasAttorney",
      label: "Attorney representation status",
      importance: "required",
    },
    {
      path: "attorneyFirstName",
      label: "Attorney first name",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyLastName",
      label: "Attorney last name",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyAddress",
      label: "Attorney mailing address",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyCity",
      label: "Attorney city",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyState",
      label: "Attorney state",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyZip",
      label: "Attorney ZIP code",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
    {
      path: "attorneyPhone",
      label: "Attorney phone number",
      importance: "required",
      appliesWhen: (fd) => fd?.part_13?.hasAttorney === "YES",
    },
  ],
  part_14: [
    { path: "feeType", label: "Attorney fee type", importance: "required" },
    {
      path: "attorneySignature",
      label: "Attorney signature",
      importance: "required",
    },
    {
      path: "attorneySignatureDate",
      label: "Attorney signature date",
      importance: "required",
    },
  ],
  part_15: [
    {
      path: "guardianFirstName",
      label: "Guardian first name",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
    {
      path: "guardianLastName",
      label: "Guardian last name",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
    {
      path: "guardianAddress",
      label: "Guardian mailing address",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
    {
      path: "guardianCity",
      label: "Guardian city",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
    {
      path: "guardianState",
      label: "Guardian state",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
    {
      path: "guardianZip",
      label: "Guardian ZIP code",
      importance: "required",
      appliesWhen: (fd) => hasAnyGuardianData(fd?.part_15),
    },
  ],
  part_16: [
    {
      path: "authorizationAcknowledgment",
      label: "Authorization acknowledgment",
      importance: "required",
      isComplete: (value) => value === true,
    },
    { path: "signature", label: "Signature", importance: "required" },
    {
      path: "signatureDate",
      label: "Signature date",
      importance: "required",
    },
  ],
};

function hasAnyGuardianData(part15: any): boolean {
  if (!part15 || typeof part15 !== "object") return false;

  return Object.values(part15).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null;
  });
}

function getValueByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc: any, key: string) => acc?.[key], obj);
}

function hasData(value: any): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

function isReviewFieldComplete(
  field: ReviewFieldDefinition,
  sectionData: any,
  formData: any
): boolean {
  const value = getValueByPath(sectionData, field.path);
  return field.isComplete ? field.isComplete(value, formData) : hasData(value);
}

function buildReviewTracking(
  workflowState: RECAWorkflowState
): ReviewTrackingState {
  const formData = workflowState.formData || {};
  let tracking = initializeReviewTracking();

  for (const section of SECTION_DEFINITIONS) {
    const sectionFields = REVIEW_SECTION_FIELDS[section.id] || [];
    if (sectionFields.length === 0) continue;

    if (section.conditional && !section.conditional(formData)) {
      tracking = updateSectionReview(tracking, section.id, {
        status: "complete",
        incompleteItems: [],
      });
      continue;
    }

    const sectionData = (formData as any)?.[section.id] || {};
    const incompleteItems: IncompleteItem[] = [];
    let completedFieldCount = 0;
    let applicableFieldCount = 0;

    for (const field of sectionFields) {
      if (field.appliesWhen && !field.appliesWhen(formData)) continue;

      applicableFieldCount++;
      const isComplete = isReviewFieldComplete(field, sectionData, formData);

      if (isComplete) {
        completedFieldCount++;
        continue;
      }

      incompleteItems.push({
        sectionId: section.id,
        sectionName: section.name,
        fieldName: field.path,
        fieldLabel: field.label,
        importance: field.importance,
        acknowledged: false,
      });
    }

    let status: CompletionStatus = "not_started";
    if (applicableFieldCount === 0 || incompleteItems.length === 0) {
      status = "complete";
    } else if (completedFieldCount > 0) {
      status = "partial";
    } else if (hasData(sectionData)) {
      status = "partial";
    } else {
      status = "incomplete";
    }

    tracking = updateSectionReview(tracking, section.id, {
      status,
      incompleteItems,
    });
  }

  return tracking;
}

// ============================================================================
// Helpers to analyze form data
// ============================================================================

function analyzeFormCompletion(
  workflowState: RECAWorkflowState
): CompletionAnalysis {
  const formData = workflowState.formData;
  const sections: SectionStatus[] = [];

  for (const def of SECTION_DEFINITIONS) {
    if (def.conditional) {
      const isApplicable = def.conditional(formData);
      if (!isApplicable) {
        sections.push({
          id: def.id,
          name: def.name,
          shortName: def.shortName,
          status: "not_applicable",
          requiredRemaining: 0,
          recommendedRemaining: 0,
          optionalRemaining: 0,
        });
        continue;
      }
    }

    const sectionKey = def.id as keyof typeof formData;
    const sectionData = formData?.[sectionKey] || {};
    const sectionFields = REVIEW_SECTION_FIELDS[def.id] || [];

    let requiredRemaining = 0;
    let recommendedRemaining = 0;
    let optionalRemaining = 0;
    let applicableFieldCount = 0;

    for (const field of sectionFields) {
      if (field.appliesWhen && !field.appliesWhen(formData)) continue;

      applicableFieldCount++;
      const isComplete = isReviewFieldComplete(field, sectionData, formData);

      if (isComplete) continue;

      if (field.importance === "required") {
        requiredRemaining += 1;
      } else if (field.importance === "recommended") {
        recommendedRemaining += 1;
      } else {
        optionalRemaining += 1;
      }
    }

    let status: SectionStatus["status"] = "complete";
    if (applicableFieldCount === 0) {
      status = "complete";
    } else if (requiredRemaining > 0) {
      status = "needs_required";
    } else if (recommendedRemaining + optionalRemaining > 0) {
      status = "optional_remaining";
    }

    sections.push({
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      status,
      requiredRemaining,
      recommendedRemaining,
      optionalRemaining,
    });
  }

  const applicableSections = sections.filter(
    (s) => s.status !== "not_applicable"
  );
  const completeSections = applicableSections.filter(
    (s) => s.status === "complete"
  );
  const needsRequiredSections = applicableSections.filter(
    (s) => s.status === "needs_required"
  );
  const optionalRemainingSections = applicableSections.filter(
    (s) => s.status === "optional_remaining"
  );

  const overallPercentage =
    applicableSections.length > 0
      ? Math.round(
          ((completeSections.length + optionalRemainingSections.length) /
            applicableSections.length) *
            100
        )
      : 0;

  // Use workflowState.completionPercentage if it's available and seems more accurate
  const reportedPercentage = workflowState.completionPercentage || 0;
  const finalPercentage = Math.max(overallPercentage, reportedPercentage);

  const isFormComplete = needsRequiredSections.length === 0;

  return {
    sections,
    completeSections,
    needsRequiredSections,
    optionalRemainingSections,
    overallPercentage: finalPercentage,
    isFormComplete,
  };
}

// ============================================================================
// Page Component
// ============================================================================

interface PageProps {
  params: { sessionId: string };
}

export default function RECAReviewPage({ params }: PageProps) {
  const router = useRouter();
  const { status } = useSession();
  const [workflowState, setWorkflowState] = useState<RECAWorkflowState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{
    isInstallmentPlan: boolean;
    hasDownloadedPDF: boolean;
  } | null>(null);
  const [showInstallmentWarning, setShowInstallmentWarning] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  // Completion analysis
  const completion = useMemo<CompletionAnalysis | null>(() => {
    if (!workflowState) return null;
    return analyzeFormCompletion(workflowState);
  }, [workflowState]);

  const initialReviewTracking = useMemo<ReviewTrackingState | null>(() => {
    if (!workflowState) return null;
    return buildReviewTracking(workflowState);
  }, [workflowState]);

  const [reviewTracking, setReviewTracking] =
    useState<ReviewTrackingState | null>(null);

  // Sync review tracking when workflow data loads/changes
  useEffect(() => {
    setReviewTracking(initialReviewTracking);
  }, [initialReviewTracking]);

  const reviewChecklist = useMemo(() => {
    if (!reviewTracking) return null;
    return generateReviewChecklist(reviewTracking);
  }, [reviewTracking]);

  const priorityMissingCount = useMemo(() => {
    if (!reviewTracking) return 0;
    return getPriorityReviewItems(reviewTracking).length;
  }, [reviewTracking]);
  const [hydratedDocRequirements, setHydratedDocRequirements] = useState<
    DocumentRequirement[]
  >([]);

  useEffect(() => {
    const run = async () => {
      if (!workflowState?.formData) {
        setHydratedDocRequirements([]);
        return;
      }

      const relationship = workflowState.formData.part_3?.relationship;
      if (!relationship) {
        setHydratedDocRequirements([]);
        return;
      }

      let reqs = generateDocumentRequirements(
        relationship,
        workflowState.formData.part_1,
        workflowState.formData.part_4
      );

      try {
        const docsRes = await fetch(
          `/api/documents?sessionId=${params.sessionId}`
        );
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          const files = (docsData.files || []) as Array<{
            category?: string | null;
            validation?: { status?: string | null } | null;
          }>;
          reqs = applyUploadsToRequirements(reqs, files);
        }
      } catch (e) {
        console.warn("Failed to hydrate doc requirements:", e);
      }

      setHydratedDocRequirements(reqs);
    };

    void run();
  }, [workflowState?.formData, params.sessionId]);

  // Document requirements & assistance
  const documentHelp = useMemo(() => {
    if (!hydratedDocRequirements.length) return null;

    const taskList = buildDocumentTaskList(hydratedDocRequirements);

    // Build assistance map for each requirement
    const assistanceByDoc: Record<string, DocumentAssistance> = {};
    for (const req of hydratedDocRequirements) {
      assistanceByDoc[req.id] = getDocumentAssistance(req.id);
    }

    return {
      requirements: hydratedDocRequirements,
      taskList,
      assistanceByDoc,
    };
  }, [hydratedDocRequirements]);

  const loadWorkflowState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reca/workflow/${params.sessionId}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const serverMessage =
          (typeof payload?.error === "string" && payload.error) ||
          (typeof payload?.details === "string" && payload.details) ||
          null;
        if (response.status === 404) {
          throw new Error(serverMessage || "Workflow session not found");
        }
        throw new Error(serverMessage || "Failed to load workflow state");
      }

      const data: RECAWorkflowState = await response.json();
      setWorkflowState(data);
    } catch (err) {
      console.error("Error loading workflow:", err);
      setError(err instanceof Error ? err.message : "Failed to load workflow");
    } finally {
      setIsLoading(false);
    }
  }, [params.sessionId]);

  const loadPaymentInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/subscriptions/status");
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo({
          isInstallmentPlan: data.isInstallmentPlan || false,
          hasDownloadedPDF: data.hasDownloadedPDF || false,
        });
      }
    } catch (err) {
      console.error("Error loading payment info:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/reca/review/${params.sessionId}` as any);
      return;
    }

    if (status === "authenticated") {
      loadWorkflowState();
      loadPaymentInfo();
    }
  }, [status, params.sessionId, router, loadWorkflowState, loadPaymentInfo]);

  // Trigger confetti only once when form is first completed (not on every page load)
  useEffect(() => {
    if (!isLoading && workflowState && completion?.isFormComplete) {
      const confettiKey = `rc-confetti-played-${params.sessionId}`;
      if (sessionStorage.getItem(confettiKey)) return;
      sessionStorage.setItem(confettiKey, "true");

      const timer = setTimeout(() => {
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ["#D97757", "#6B8E6F", "#E8DCC4"]; // terracotta, sage, cream

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, workflowState, completion?.isFormComplete, params.sessionId]);

  const handleDownloadPDF = async () => {
    if (paymentInfo?.isInstallmentPlan && !paymentInfo?.hasDownloadedPDF) {
      setShowInstallmentWarning(true);
      return;
    }
    await performDownload();
  };

  const performDownload = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const downloadUrl = `/api/reca/pdf/${params.sessionId}`;

      // Open a popup immediately (synchronously) to preserve the browser "user gesture"
      // for downloads. We'll navigate it to the actual PDF only after the preflight check.
      const downloadWindow = window.open("about:blank", "_blank");

      const response = await fetch(downloadUrl, { method: "HEAD" });

      if (!response.ok) {
        // Close the popup if we opened one
        downloadWindow?.close();

        if (response.status === 401) {
          throw new Error("Please sign in to download the PDF.");
        }
        if (response.status === 403) {
          throw new Error(
            "Payment is required to download the PDF. Please complete your payment to access your form."
          );
        }
        if (response.status === 404) {
          throw new Error("Workflow session not found.");
        }
        throw new Error("Failed to generate PDF. Please try again.");
      }

      if (paymentInfo?.isInstallmentPlan) {
        const payload = JSON.stringify({ sessionId: params.sessionId });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/subscriptions/mark-pdf-downloaded", blob);
        } else {
          void fetch("/api/subscriptions/mark-pdf-downloaded", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
        }
      }

      // If popups are blocked, fall back to same-tab navigation.
      if (downloadWindow) {
        downloadWindow.location.href = downloadUrl;
      } else {
        window.location.assign(downloadUrl);
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate PDF. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmInstallmentDownload = async () => {
    setShowInstallmentWarning(false);
    setHasAcknowledgedWarning(false);
    await performDownload();
  };

  const handleAcknowledgeSection = (sectionId: RECAWorkflowSection) => {
    if (!reviewTracking) return;
    setReviewTracking(acknowledgeIncompleteItems(reviewTracking, sectionId));
  };

  const resolveReturnTo = `/reca/review/${params.sessionId}`;
  const buildResolveLink = (sectionId: RECAWorkflowSection) => {
    const searchParams = new URLSearchParams();
    searchParams.set("section", sectionId);
    searchParams.set("mode", "resolve");
    searchParams.set("returnTo", resolveReturnTo);
    searchParams.set("resolveQueue", sectionId);
    return `/reca/form/${params.sessionId}?${searchParams.toString()}`;
  };
  const navigateToSection = (
    sectionId: RECAWorkflowSection,
    resolveMode = false
  ) => {
    if (resolveMode) {
      router.push(buildResolveLink(sectionId) as any);
      return;
    }
    router.push(`/reca/form/${params.sessionId}?section=${sectionId}` as any);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your claim...</p>
        </div>
      </div>
    );
  }

  if (error || !workflowState || !completion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-sage-900">Error</h2>
          <p className="mb-6 text-sage-700">{error || "Unknown error"}</p>
          <button
            onClick={() => router.push("/portal")}
            className="rounded-full bg-terracotta-500 px-6 py-3 text-white hover:bg-terracotta-600"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  const isComplete = completion.isFormComplete;
  const needsAttentionCount = completion.needsRequiredSections.length;
  const applicableSectionCount = completion.sections.filter(
    (section) => section.status !== "not_applicable"
  ).length;
  const requiredCompleteSectionCount =
    completion.completeSections.length +
    completion.optionalRemainingSections.length;

  return (
    <div className="min-h-screen bg-cream-50">
      <InviteCollaboratorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        intakeSessionId={params.sessionId}
        siblingOptions={
          Array.isArray(workflowState?.formData?.part_6?.siblings)
            ? workflowState.formData.part_6.siblings
                .map((sibling: { name?: string }) => sibling?.name?.trim())
                .filter((name): name is string => !!name)
            : []
        }
      />
      <ManageCollaboratorsDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
        intakeSessionId={params.sessionId}
      />

      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* Claim Journey Stepper */}
        <ClaimJourney currentStage="review" />

        {/* ================================================================ */}
        {/* Header — adapts to completion state */}
        {/* ================================================================ */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            {isComplete ? "Form Completed" : "Application Review"}
          </h1>
          <p className="text-sage-600">
            {isComplete
              ? "Your RECA form is complete — review your answers, verify your documents, and file with the DOJ"
              : "Review your progress and complete any remaining sections"}
          </p>
        </div>

        {/* ================================================================ */}
        {/* Completion Status Card */}
        {/* ================================================================ */}
        {isComplete ? (
          /* ——— COMPLETE STATE ——— */
          <>
            <Card className="mb-6 border-2 border-terracotta-400 bg-gradient-to-br from-terracotta-50 to-white">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-12 w-12 flex-shrink-0 text-terracotta-600" />
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-terracotta-900">
                      🎉 Form Data Complete!
                    </h2>
                    <p className="mb-2 text-terracotta-800">
                      Congratulations! You&apos;ve successfully completed all
                      required sections of the RECA form. Your information has
                      been saved. Before filing, make sure to verify your
                      documents and review everything below.
                    </p>
                    <p className="mb-3 text-terracotta-800">
                      <strong>Next Steps:</strong> Install the{" "}
                      <strong>Radiant Claims Filing Assistant</strong> Chrome
                      extension and file your claim online through the DOJ
                      portal at{" "}
                      <a
                        href="https://reca.justice.gov"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                      >
                        reca.justice.gov
                      </a>
                      . See the steps below to get started.
                    </p>
                    <p className="text-sm text-terracotta-700">
                      Form completion: {completion.overallPercentage}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification Prompt */}
            <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-purple-900">
                      Have You Verified Your Documents?
                    </h3>
                    <p className="mb-3 text-sm text-purple-800">
                      Before filing with the DOJ, use our AI document
                      verification tool to check that your uploaded documents
                      meet requirements. Head to the Documents section in your
                      portal to run verification.
                    </p>
                    <a
                      href={`/reca/documents/${params.sessionId}`}
                      className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                      <Upload className="h-4 w-4" />
                      Go to Documents
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* ——— IN-PROGRESS STATE ——— */
          <Card className="mb-6 border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Clock className="h-10 w-10 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <h2 className="mb-1 text-2xl font-bold text-amber-900">
                      Application In Progress
                    </h2>
                    <p className="text-amber-800">
                      You&apos;ve made great progress! {needsAttentionCount}{" "}
                      {needsAttentionCount === 1
                        ? "section needs"
                        : "sections need"}{" "}
                      attention before your form is ready for review.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-900">
                      Overall Progress
                    </span>
                    <span className="font-bold text-amber-900">
                      {completion.overallPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={completion.overallPercentage}
                    className="h-3"
                  />
                  <div className="mt-1 flex justify-between text-xs text-amber-700">
                    <span>
                      {requiredCompleteSectionCount} of {applicableSectionCount}{" "}
                      sections complete
                    </span>
                    <span>Ready for submission</span>
                  </div>
                </div>

                {/* Edit Application button — prominent */}
                <Button
                  onClick={() => navigateToSection("part_1", true)}
                  className="h-12 w-full rounded-full bg-terracotta-500 text-base hover:bg-terracotta-600"
                >
                  <Edit3 className="mr-2 h-5 w-5" />
                  Continue Editing Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================ */}
        {/* Family / sibling help (conditional) */}
        {/* ================================================================ */}
        {(() => {
          const missingRequiredDocs = hydratedDocRequirements.some((req) => {
            const resolved =
              req.status === "confirmed" ||
              req.status === "uploaded" ||
              req.status === "verified";
            return req.required && !resolved;
          });

          if (!missingRequiredDocs) return null;

          return (
            <Card className="mb-6 rounded-3xl border-2 border-sage-200 bg-white">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-sage-900">
                    Missing documents?
                  </p>
                  <p className="text-sm text-sage-600">
                    Invite a sibling/family member to upload documents and leave
                    notes. They can’t edit your answers.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                    onClick={() => setShowManageDialog(true)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ================================================================ */}
        {/* Importance Checklist (review-tracking.ts) */}
        {/* ================================================================ */}
        {reviewChecklist && (
          <Card
            id="missing-info-checklist"
            className="mb-6 border-2 border-sage-200 bg-white"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <AlertCircle className="h-5 w-5 text-terracotta-500" />
                Missing Information Checklist
              </CardTitle>
              <CardDescription>
                Importance-based review generated from your form data. Required
                items should be completed first.
                {priorityMissingCount > 0 ? (
                  <span className="ml-1 font-medium text-red-700">
                    {priorityMissingCount} required item
                    {priorityMissingCount !== 1 ? "s" : ""} missing.
                  </span>
                ) : reviewChecklist &&
                  (reviewChecklist.required.length > 0 ||
                    reviewChecklist.recommended.length > 0) ? (
                  <span className="ml-1 font-medium text-green-700">
                    All required items resolved.
                  </span>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Submission Readiness Banner */}
              {reviewTracking?.canSubmitToDOJ && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready for submission &mdash; all required items are complete
                    or acknowledged
                  </div>
                </div>
              )}

              {!reviewTracking?.canSubmitToDOJ && priorityMissingCount > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-3 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>
                      Required items are still missing. Complete or acknowledge
                      them before continuing to final submission.
                    </span>
                  </div>
                </div>
              )}

              {reviewChecklist.required.length === 0 &&
              reviewChecklist.recommended.length === 0 &&
              reviewChecklist.optional.length === 0 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  Great work - no missing checklist items were detected.
                </div>
              ) : (
                <>
                  {reviewChecklist.required.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-red-800">
                        Required for submission
                      </h3>
                      {reviewChecklist.required.map((group) => {
                        const allAcknowledged = group.items.every(
                          (i) => i.acknowledged
                        );
                        return (
                          <div
                            key={`required-${group.section}`}
                            className={`rounded-lg border p-3 ${allAcknowledged ? "border-sage-200 bg-sage-50" : "border-red-200 bg-red-50"}`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <p
                                className={`text-sm font-semibold ${allAcknowledged ? "text-sage-700 line-through" : "text-red-900"}`}
                              >
                                {group.section}
                                {allAcknowledged && (
                                  <span className="ml-2 text-xs font-normal text-sage-500 no-underline">
                                    (acknowledged)
                                  </span>
                                )}
                              </p>
                              <div className="flex gap-1.5">
                                {!allAcknowledged && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full border-sage-300 text-xs text-sage-700 hover:bg-sage-50"
                                    onClick={() =>
                                      handleAcknowledgeSection(
                                        group.items[0]
                                          ?.sectionId as RECAWorkflowSection
                                      )
                                    }
                                    title="Mark as intentionally incomplete"
                                  >
                                    Skip
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className={`h-7 rounded-full text-xs ${allAcknowledged ? "bg-sage-600 hover:bg-sage-700" : "bg-red-600 hover:bg-red-700"}`}
                                  onClick={() =>
                                    navigateToSection(
                                      group.items[0]?.sectionId || "part_1",
                                      true
                                    )
                                  }
                                >
                                  {allAcknowledged ? "Edit" : "Fix"}
                                  <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <ul
                              className={`space-y-1 text-sm ${allAcknowledged ? "text-sage-500" : "text-red-800"}`}
                            >
                              {group.items.map((item) => (
                                <li
                                  key={`required-${group.section}-${item.fieldName}`}
                                >
                                  • {item.fieldLabel}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {reviewChecklist.recommended.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-amber-800">
                        Recommended for faster processing
                      </h3>
                      {reviewChecklist.recommended.map((group) => (
                        <div
                          key={`recommended-${group.section}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                        >
                          <p className="mb-2 text-sm font-semibold text-amber-900">
                            {group.section}
                          </p>
                          <ul className="space-y-1 text-sm text-amber-800">
                            {group.items.map((item) => (
                              <li
                                key={`recommended-${group.section}-${item.fieldName}`}
                              >
                                • {item.fieldLabel}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {reviewChecklist.optional.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-sage-700">
                        Optional additions
                      </h3>
                      {reviewChecklist.optional.map((group) => (
                        <div
                          key={`optional-${group.section}`}
                          className="rounded-lg border border-sage-200 bg-sage-50 p-3"
                        >
                          <p className="mb-2 text-sm font-semibold text-sage-900">
                            {group.section}
                          </p>
                          <ul className="space-y-1 text-sm text-sage-700">
                            {group.items.map((item) => (
                              <li
                                key={`optional-${group.section}-${item.fieldName}`}
                              >
                                • {item.fieldLabel}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================ */}
        {/* Section-by-Section Breakdown (always shown) */}
        {/* ================================================================ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <FileText className="h-5 w-5 text-terracotta-500" />
              Section Status
            </CardTitle>
            <CardDescription>
              {isComplete
                ? "All sections are complete. You can still edit any section if needed."
                : "Review each section's status and complete any remaining items."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Complete Sections */}
              {completion.completeSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete ({completion.completeSections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.completeSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            {section.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-green-700 hover:text-green-900"
                          onClick={() => navigateToSection(section.id, true)}
                        >
                          Edit
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Needs Required Info */}
              {completion.needsRequiredSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    Needs Required Info (
                    {completion.needsRequiredSections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.needsRequiredSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <span className="text-sm font-medium text-red-900">
                              {section.name}
                            </span>
                            <span className="ml-2 text-xs text-red-700">
                              Required remaining: {section.requiredRemaining}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 rounded-full bg-red-600 text-xs hover:bg-red-700"
                          onClick={() => navigateToSection(section.id, true)}
                        >
                          Complete
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional / Recommended Remaining */}
              {completion.optionalRemainingSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-sage-700">
                    <AlertCircle className="h-4 w-4" />
                    Optional/Recommended Remaining (
                    {completion.optionalRemainingSections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.optionalRemainingSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-sage-200 bg-sage-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-sage-600" />
                          <div>
                            <span className="text-sm font-medium text-sage-900">
                              {section.name}
                            </span>
                            <div className="mt-0.5 text-xs text-sage-700">
                              {section.recommendedRemaining > 0 && (
                                <span>
                                  Recommended remaining:{" "}
                                  {section.recommendedRemaining}
                                </span>
                              )}
                              {section.recommendedRemaining > 0 &&
                                section.optionalRemaining > 0 && (
                                  <span className="mx-1">•</span>
                                )}
                              {section.optionalRemaining > 0 && (
                                <span>
                                  Optional remaining:{" "}
                                  {section.optionalRemaining}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-sage-700 hover:text-sage-900"
                          onClick={() => navigateToSection(section.id, true)}
                        >
                          Edit
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Applicable Sections */}
              {completion.sections.filter((s) => s.status === "not_applicable")
                .length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-sage-500">
                    Not Applicable to Your Claim
                  </h3>
                  <div className="space-y-1">
                    {completion.sections
                      .filter((s) => s.status === "not_applicable")
                      .map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sage-400"
                        >
                          <span className="text-xs">—</span>
                          <span className="text-xs">{section.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Document Help — where to obtain missing documents */}
        {/* ================================================================ */}
        {documentHelp && documentHelp.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <FolderSearch className="h-5 w-5 text-terracotta-500" />
                Documents You&apos;ll Need
              </CardTitle>
              <CardDescription>
                Based on your claim details, here are the documents required for
                submission and where to get them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Documents CTA */}
              <a
                href={`/reca/documents/${params.sessionId}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-terracotta-300 bg-terracotta-50 px-4 py-2.5 text-sm font-semibold text-terracotta-800 transition-colors hover:bg-terracotta-100"
              >
                <Upload className="h-4 w-4" />
                Upload Documents
              </a>

              {/* Task summary */}
              {documentHelp.taskList.urgentTasks.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    Required Documents (
                    {documentHelp.taskList.urgentTasks.length})
                  </h3>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {documentHelp.taskList.urgentTasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document-by-document assistance */}
              <div className="space-y-3">
                {documentHelp.requirements.map((req) => {
                  const assistance = documentHelp.assistanceByDoc[req.id];
                  const hasResources =
                    assistance?.resources && assistance.resources.length > 0;

                  return (
                    <div
                      key={req.id}
                      className="rounded-lg border border-sage-200 bg-white p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sage-900">
                            {req.name}
                            {req.quantity && req.quantity > 1 && (
                              <span className="ml-1 text-sm text-sage-500">
                                ({req.quantity} copies needed)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-sage-600">
                            {req.description}
                          </p>
                        </div>
                        {req.required && (
                          <Badge
                            variant="secondary"
                            className="flex-shrink-0 bg-terracotta-100 text-terracotta-800"
                          >
                            Required
                          </Badge>
                        )}
                      </div>

                      {hasResources && (
                        <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                            <HelpCircle className="h-3.5 w-3.5" />
                            Where to obtain this document:
                          </p>
                          <ul className="space-y-1.5">
                            {assistance.resources.map((resource, rIdx) => (
                              <li
                                key={rIdx}
                                className="flex items-start gap-2 text-sm"
                              >
                                {resource.url ? (
                                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                                ) : resource.phone ? (
                                  <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                                ) : (
                                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                                )}
                                <div>
                                  <span className="font-medium text-blue-900">
                                    {resource.title}
                                  </span>
                                  <span className="text-blue-700">
                                    {" "}
                                    — {resource.description}
                                  </span>
                                  {resource.phone && (
                                    <span className="ml-1 text-blue-600">
                                      ({resource.phone})
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================ */}
        {/* Important Clarification (always shown) */}
        {/* ================================================================ */}
        <Card className="mb-6 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-8 w-8 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-blue-900">
                  Your Claim Has NOT Yet Been Submitted to the DOJ
                </h3>
                <p className="mb-2 text-sm text-blue-800">
                  This page confirms your progress on the RadiantClaims form.
                  However, your claim will not be officially submitted to the
                  Department of Justice until:
                </p>
                <ol className="ml-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
                  <li>You complete your RadiantClaims form ✅</li>
                  <li>
                    Install the <strong>Radiant Claims Filing Assistant</strong>{" "}
                    Chrome extension
                  </li>
                  <li>
                    File your claim online through the DOJ portal at{" "}
                    <a
                      href="https://reca.justice.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-700 underline"
                    >
                      reca.justice.gov
                    </a>
                  </li>
                </ol>
                <p className="mt-2 text-xs text-blue-700">
                  Alternatively, you can mail your claim to the DOJ.
                </p>
                <p className="mt-3 text-sm font-semibold text-blue-900">
                  Your official claim submission date will be when the DOJ
                  receives your electronic submission or mailed packet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Download Section */}
        {/* ================================================================ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Download className="h-5 w-5 text-terracotta-500" />
              Download Official RECA Form (Pre-Filled)
            </CardTitle>
            <CardDescription>
              Download the official DOJ form with your information pre-filled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-2 font-semibold text-blue-900">
                    What You&apos;ll Get:
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                    <li>Official RECA Downwinder Claim Form (DOJ version)</li>
                    <li>
                      All your information pre-filled in the correct fields
                    </li>
                    <li>
                      Available for your records or as a reference when filing
                      online
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Note:</strong> For online filing, use the Chrome
                    extension instead — it transfers your answers directly. This
                    PDF is useful for personal records or mail-in filing.
                  </p>
                  {!isComplete && (
                    <p className="mt-2 text-sm font-medium text-amber-700">
                      ⚠️ Some sections are incomplete. The PDF will be generated
                      with the information you&apos;ve provided so far.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="h-14 w-full rounded-full bg-terracotta-500 text-lg hover:bg-terracotta-600"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download Pre-Filled RECA Form
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* What Happens Next */}
        {/* ================================================================ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Globe className="h-5 w-5 text-terracotta-500" />
              What Happens Next
            </CardTitle>
            <CardDescription>
              File your claim online through the DOJ portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    Review Your Answers
                  </p>
                  <p className="text-sm text-sage-700">
                    Review everything on this page to make sure your information
                    is accurate and complete.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    Gather Your Documents
                  </p>
                  <p className="text-sm text-sage-700">
                    Make sure you have all supporting documents ready to upload.
                    Check the documents section above for what&apos;s needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    Install the Chrome Extension
                  </p>
                  <p className="text-sm text-sage-700">
                    Get the <strong>Radiant Claims Filing Assistant</strong>{" "}
                    from the Chrome Web Store (free). It walks you through the
                    DOJ portal field-by-field, pre-filling your answers
                    automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-600 font-semibold text-white">
                  4
                </div>
                <div>
                  <p className="font-medium text-terracotta-900">
                    File Online at reca.justice.gov
                  </p>
                  <p className="mb-3 text-sm text-sage-700">
                    With the extension installed, visit the DOJ portal. The
                    extension activates automatically and guides you through
                    each step, including document uploads.
                  </p>

                  <a
                    href="https://reca.justice.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Open DOJ Portal →
                  </a>
                  <p className="mt-2 text-xs text-sage-600">
                    DOJ may request originals or certified copies after
                    e-filing. Keep them available.
                  </p>
                </div>
              </div>
            </div>

            {/* Mail-in fallback */}
            <details className="mt-6 rounded-lg border border-sage-200">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-sage-700 hover:bg-sage-50">
                Prefer to file by mail instead?
              </summary>
              <div className="border-t border-sage-200 px-4 py-3 text-sm text-sage-700">
                <p className="mb-2">
                  You can also mail your completed claim packet to:
                </p>
                <div className="ml-2 text-sm">
                  <p>Radiation Exposure Compensation Program</p>
                  <p>U.S. Department of Justice</p>
                  <p>P.O. Box 146</p>
                  <p>Ben Franklin Station</p>
                  <p>Washington, DC 20044-0146</p>
                </div>
                <p className="mt-2 text-xs text-sage-600">
                  We recommend using certified mail for tracking purposes.
                </p>
              </div>
            </details>

            {/* Filed confirmation CTA */}
            <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
              <p className="mb-3 text-sm font-semibold text-emerald-900">
                Already filed with the DOJ?
              </p>
              <p className="mb-4 text-sm text-emerald-800">
                Once you&apos;ve submitted your claim through the DOJ portal (or
                mailed it), let us know so we can update your claim status and
                show you what to expect next.
              </p>
              <Button
                onClick={() =>
                  router.push(`/reca/confirmation/${params.sessionId}` as any)
                }
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                I&apos;ve Filed My Claim
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Contact Information */}
        {/* ================================================================ */}
        <Card className="border-sage-200 bg-gradient-to-br from-sage-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Mail className="h-5 w-5 text-terracotta-500" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sage-900">
                  RECA Program Hotline
                </p>
                <p className="text-sage-700">1-800-729-7327</p>
              </div>
              <div>
                <p className="font-medium text-sage-900">Website</p>
                <a
                  href="https://www.justice.gov/civil/reca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta-600 underline hover:text-terracotta-700"
                >
                  www.justice.gov/civil/reca
                </a>
              </div>
              <div>
                <p className="font-medium text-sage-900">
                  RadiantClaims Support
                </p>
                <p className="text-sage-700">
                  Questions about your form or documents? Email us at{" "}
                  <a
                    href="mailto:support@radiantclaims.com"
                    className="font-medium text-terracotta-600 underline hover:text-terracotta-700"
                  >
                    support@radiantclaims.com
                  </a>{" "}
                  or use the chat widget in the bottom-right corner of any page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* What Comes Next CTA (links to financial planning page) */}
        {/* ================================================================ */}
        {isComplete && (
          <Card className="mb-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-emerald-900">
                    After You File: Plan for Your $100,000
                  </h3>
                  <p className="text-sm text-emerald-700">
                    See estimated timelines, explore growth options, and learn
                    about the 90-day rule.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    router.push(
                      `/reca/what-comes-next/${params.sessionId}` as any
                    )
                  }
                  className="flex-shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
                >
                  What Comes Next →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================ */}
        {/* Navigation */}
        {/* ================================================================ */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/reca/supporting/${params.sessionId}` as any)
              }
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Supporting Forms
            </Button>
            {!isComplete && (
              <Button
                variant="outline"
                onClick={() => navigateToSection("part_1", true)}
                className="rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Application
              </Button>
            )}
          </div>
          <Button
            onClick={() => router.push("/portal")}
            className="rounded-full bg-sage-600 hover:bg-sage-700"
          >
            Return to Portal
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Installment Plan Warning Dialog */}
      {/* ================================================================ */}
      <Dialog
        open={showInstallmentWarning}
        onOpenChange={setShowInstallmentWarning}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-red-900">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Payment Commitment - Please Read Carefully
            </DialogTitle>
            <DialogDescription className="sr-only">
              Installment plan commitment warning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Critical Warning */}
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="mb-2 text-lg font-bold text-red-900">
                ⚠️ By downloading this PDF, you are committing to pay BOTH
                installment payments
              </p>
              <p className="text-red-800">
                You selected the 2-payment installment plan ($249.99 × 2 =
                $499.98 total). Downloading your completed RECA form means you
                have received your deliverable and triggers your payment
                commitment.
              </p>
            </div>

            {/* What This Means */}
            <div>
              <h3 className="mb-2 font-semibold text-sage-900">
                What This Means:
              </h3>
              <ul className="space-y-2 text-sm text-sage-800">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>Both payments become due:</strong> Your 1st payment
                    of $249.99 has been charged. Your 2nd payment of $249.99
                    will be automatically charged 30 days from your initial
                    payment date.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>You cannot cancel:</strong> After downloading the
                    PDF, you cannot cancel your installment plan or request a
                    refund. Both payments are locked in.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>Payment will be charged automatically:</strong> Your
                    2nd installment will be charged to your payment method on
                    file. Ensure your card remains valid.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>You retain platform access:</strong> You will
                    continue to have access to your RadiantClaims portal and
                    documents.
                  </span>
                </li>
              </ul>
            </div>

            {/* Alternative Options */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                Not Ready to Commit Yet?
              </h3>
              <p className="mb-2 text-sm text-blue-800">
                If you&apos;re still within the 7-day refund window and want to
                cancel instead:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                <li>
                  Click &quot;Cancel&quot; below and go to your account settings
                </li>
                <li>
                  Request cancellation within 7 days of your initial payment
                </li>
                <li>
                  You&apos;ll receive a full refund of your 1st payment
                  ($249.99)
                </li>
                <li>The 2nd payment will be waived (not charged)</li>
              </ul>
              <p className="mt-2 text-sm font-semibold text-blue-900">
                After 7 days: You can still cancel, but your 1st payment
                ($249.99) is non-refundable. The 2nd payment will be waived.
                Your data will be retained for 60 days.
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <Checkbox
                id="installment-acknowledge"
                checked={hasAcknowledgedWarning}
                onCheckedChange={(checked) =>
                  setHasAcknowledgedWarning(checked === true)
                }
                className="mt-1"
              />
              <label
                htmlFor="installment-acknowledge"
                className="cursor-pointer text-sm text-red-900"
              >
                <span className="font-bold">
                  I understand and agree that by downloading this PDF, I am
                  committing to pay both installment payments ($499.98 total)
                  and waiving my right to cancel or receive any refunds.
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInstallmentWarning(false);
                setHasAcknowledgedWarning(false);
              }}
              className="rounded-full"
            >
              Cancel - Don&apos;t Download Yet
            </Button>
            <Button
              onClick={handleConfirmInstallmentDownload}
              disabled={!hasAcknowledgedWarning || isGenerating}
              className="rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                "I Agree - Download PDF"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

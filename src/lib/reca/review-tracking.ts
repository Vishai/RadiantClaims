/**
 * Review Tracking System
 *
 * Tracks incomplete sections and missing information across the form,
 * ensuring users are aware of what needs to be completed before submission.
 */

import { RECAWorkflowSection } from "./types";

export type FieldImportance = "required" | "recommended" | "optional";

export type CompletionStatus =
  | "complete" // All required fields filled
  | "partial" // Some fields filled, acknowledged incomplete
  | "incomplete" // Missing required fields, not acknowledged
  | "not_started"; // Section not visited

export interface IncompleteItem {
  sectionId: RECAWorkflowSection;
  sectionName: string;
  fieldName: string;
  fieldLabel: string;
  importance: FieldImportance;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  notes?: string;
}

export interface SectionReview {
  sectionId: RECAWorkflowSection;
  sectionName: string;
  status: CompletionStatus;
  completionPercentage: number;
  missingRequired: number;
  missingRecommended: number;
  missingOptional: number;
  acknowledged: boolean;
  lastUpdated: Date;
  incompleteItems: IncompleteItem[];
}

export interface ReviewTrackingState {
  sections: SectionReview[];
  totalSections: number;
  completedSections: number;
  partialSections: number;
  incompleteSections: number;
  overallCompletion: number;
  canSubmitToDOJ: boolean;
  reviewItems: IncompleteItem[];
  lastReviewDate?: Date;
}

/**
 * Initialize review tracking for a workflow
 */
export function initializeReviewTracking(): ReviewTrackingState {
  const sections = [
    { id: "part_1", name: "Your Information" },
    { id: "part_2", name: "Claimant Information" },
    { id: "part_3", name: "Relationship" },
    { id: "part_4", name: "Self-Filer Information" },
    { id: "part_5", name: "Surviving Spouse Information" },
    { id: "part_6", name: "Surviving Child Information" },
    { id: "part_7", name: "Other Relatives Information" },
    { id: "part_8", name: "Exposure Information" },
    { id: "part_9", name: "Proof of Presence" },
    { id: "part_10", name: "Compensable Diseases" },
    { id: "part_11", name: "Proof of Disease" },
    { id: "part_12", name: "Previous Payments" },
    { id: "part_13", name: "Attorney Representation" },
    { id: "part_14", name: "Attorney Details" },
    { id: "part_15", name: "Legal Guardian" },
    { id: "part_16", name: "Signature" },
  ] as const;

  const sectionReviews: SectionReview[] = sections.map((section) => ({
    sectionId: section.id as RECAWorkflowSection,
    sectionName: section.name,
    status: "not_started",
    completionPercentage: 0,
    missingRequired: 0,
    missingRecommended: 0,
    missingOptional: 0,
    acknowledged: false,
    lastUpdated: new Date(),
    incompleteItems: [],
  }));

  return {
    sections: sectionReviews,
    totalSections: sections.length,
    completedSections: 0,
    partialSections: 0,
    incompleteSections: 0,
    overallCompletion: 0,
    canSubmitToDOJ: false,
    reviewItems: [],
  };
}

/**
 * Update section review status
 */
export function updateSectionReview(
  state: ReviewTrackingState,
  sectionId: RECAWorkflowSection,
  update: {
    status?: CompletionStatus;
    incompleteItems?: IncompleteItem[];
    acknowledged?: boolean;
  }
): ReviewTrackingState {
  const updatedSections = state.sections.map((section) => {
    if (section.sectionId === sectionId) {
      const incompleteItems = update.incompleteItems || section.incompleteItems;

      return {
        ...section,
        status: update.status || section.status,
        incompleteItems,
        acknowledged: update.acknowledged ?? section.acknowledged,
        missingRequired: incompleteItems.filter(
          (i) => i.importance === "required"
        ).length,
        missingRecommended: incompleteItems.filter(
          (i) => i.importance === "recommended"
        ).length,
        missingOptional: incompleteItems.filter(
          (i) => i.importance === "optional"
        ).length,
        completionPercentage: calculateSectionCompletion(incompleteItems),
        lastUpdated: new Date(),
      };
    }
    return section;
  });

  // Recalculate overall statistics
  const completedSections = updatedSections.filter(
    (s) => s.status === "complete"
  ).length;
  const partialSections = updatedSections.filter(
    (s) => s.status === "partial"
  ).length;
  const incompleteSections = updatedSections.filter(
    (s) => s.status === "incomplete"
  ).length;

  // Collect all review items
  const reviewItems = updatedSections.flatMap((s) => s.incompleteItems);

  // Can only submit if all required fields are either complete or acknowledged
  const unacknowledgedRequired = reviewItems.filter(
    (item) => item.importance === "required" && !item.acknowledged
  );
  const canSubmitToDOJ = unacknowledgedRequired.length === 0;

  // Calculate overall completion (weighted by section importance)
  const overallCompletion = Math.round(
    (completedSections / state.totalSections) * 100
  );

  return {
    ...state,
    sections: updatedSections,
    completedSections,
    partialSections,
    incompleteSections,
    overallCompletion,
    canSubmitToDOJ,
    reviewItems,
    lastReviewDate: new Date(),
  };
}

/**
 * Calculate section completion percentage
 */
function calculateSectionCompletion(incompleteItems: IncompleteItem[]): number {
  if (incompleteItems.length === 0) return 100;

  const requiredMissing = incompleteItems.filter(
    (i) => i.importance === "required"
  ).length;
  const recommendedMissing = incompleteItems.filter(
    (i) => i.importance === "recommended"
  ).length;

  // Weight: Required = 60%, Recommended = 30%, Optional = 10%
  const requiredPenalty = requiredMissing * 20; // Each missing required = -20%
  const recommendedPenalty = recommendedMissing * 10; // Each missing recommended = -10%

  return Math.max(0, 100 - requiredPenalty - recommendedPenalty);
}

/**
 * Get sections that need attention
 */
export function getSectionsNeedingAttention(
  state: ReviewTrackingState
): SectionReview[] {
  return state.sections.filter(
    (section) =>
      section.status === "incomplete" ||
      (section.status === "partial" && !section.acknowledged)
  );
}

/**
 * Get priority review items (unacknowledged required fields)
 */
export function getPriorityReviewItems(
  state: ReviewTrackingState
): IncompleteItem[] {
  return state.reviewItems.filter(
    (item) => item.importance === "required" && !item.acknowledged
  );
}

/**
 * Mark items as acknowledged
 */
export function acknowledgeIncompleteItems(
  state: ReviewTrackingState,
  sectionId: RECAWorkflowSection
): ReviewTrackingState {
  const updatedSections = state.sections.map((section) => {
    if (section.sectionId === sectionId) {
      const acknowledgedItems = section.incompleteItems.map((item) => ({
        ...item,
        acknowledged: true,
        acknowledgedAt: new Date(),
      }));

      return {
        ...section,
        status: "partial" as CompletionStatus,
        acknowledged: true,
        incompleteItems: acknowledgedItems,
      };
    }
    return section;
  });

  return {
    ...state,
    sections: updatedSections,
    reviewItems: updatedSections.flatMap((s) => s.incompleteItems),
  };
}

/**
 * Generate review checklist for user
 */
export function generateReviewChecklist(state: ReviewTrackingState): {
  required: Array<{ section: string; items: IncompleteItem[] }>;
  recommended: Array<{ section: string; items: IncompleteItem[] }>;
  optional: Array<{ section: string; items: IncompleteItem[] }>;
} {
  const checklist = {
    required: [] as Array<{ section: string; items: IncompleteItem[] }>,
    recommended: [] as Array<{ section: string; items: IncompleteItem[] }>,
    optional: [] as Array<{ section: string; items: IncompleteItem[] }>,
  };

  state.sections.forEach((section) => {
    const requiredItems = section.incompleteItems.filter(
      (i) => i.importance === "required"
    );
    const recommendedItems = section.incompleteItems.filter(
      (i) => i.importance === "recommended"
    );
    const optionalItems = section.incompleteItems.filter(
      (i) => i.importance === "optional"
    );

    if (requiredItems.length > 0) {
      checklist.required.push({
        section: section.sectionName,
        items: requiredItems,
      });
    }

    if (recommendedItems.length > 0) {
      checklist.recommended.push({
        section: section.sectionName,
        items: recommendedItems,
      });
    }

    if (optionalItems.length > 0) {
      checklist.optional.push({
        section: section.sectionName,
        items: optionalItems,
      });
    }
  });

  return checklist;
}

/**
 * Check if user can proceed to next section
 */
export function canProceedToNext(
  state: ReviewTrackingState,
  currentSection: RECAWorkflowSection
): { canProceed: boolean; reason?: string } {
  const section = state.sections.find((s) => s.sectionId === currentSection);

  if (!section) {
    return { canProceed: false, reason: "Section not found" };
  }

  // Can always proceed if complete
  if (section.status === "complete") {
    return { canProceed: true };
  }

  // Can proceed if acknowledged
  if (section.acknowledged) {
    return { canProceed: true };
  }

  // Check if there are unacknowledged required fields
  const unacknowledgedRequired = section.incompleteItems.filter(
    (item) => item.importance === "required" && !item.acknowledged
  );

  if (unacknowledgedRequired.length > 0) {
    return {
      canProceed: false,
      reason: `Please acknowledge ${unacknowledgedRequired.length} missing required field(s)`,
    };
  }

  return { canProceed: true };
}

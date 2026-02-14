"use client";

import {
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, AlertCircle } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { AccountCreationModal } from "./AccountCreationModal";
import {
  RECAWorkflowSection,
  RECAWorkflowState,
  SaveWorkflowRequest,
} from "@/lib/reca/types";
import {
  getNextSection,
  getPreviousSection,
  getSectionDisplayName,
} from "@/lib/reca/workflow";

interface FormWizardProps {
  sessionId: string;
  initialState: RECAWorkflowState;
  currentSection: RECAWorkflowSection;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  hideNavigation?: boolean;
}

const RESOLVE_SECTION_ORDER: RECAWorkflowSection[] = [
  "part_1",
  "part_2",
  "part_3",
  "part_4",
  "part_5",
  "part_6",
  "part_7",
  "part_8",
  "part_9",
  "part_10",
  "part_11",
  "part_12",
  "part_13",
  "part_14",
  "part_15",
  "part_16",
];

export function FormWizard({
  sessionId,
  initialState,
  currentSection,
  children,
  onNext,
  onPrevious,
  hideNavigation = false,
}: FormWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [workflowState, setWorkflowState] =
    useState<RECAWorkflowState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [hasPromptedAccount, setHasPromptedAccount] = useState(false);

  // Use refs to access latest state in callbacks without recreating them
  const workflowStateRef = useRef(workflowState);
  const isSavingRef = useRef(isSaving);
  const resolveMode = searchParams.get("mode") === "resolve";
  const resolveQueueParam = searchParams.get("resolveQueue");
  const returnToParam = searchParams.get("returnTo");
  const resolveReturnTo = useMemo(() => {
    const fallback = `/reca/review/${sessionId}`;
    if (!returnToParam) return fallback;
    return returnToParam.startsWith("/") ? returnToParam : fallback;
  }, [returnToParam, sessionId]);
  const resolveQueue = useMemo(() => {
    if (resolveQueueParam === null) return [];
    const requestedSections = new Set(
      resolveQueueParam
        .split(",")
        .map((section) => section.trim())
        .filter(Boolean)
    );
    return RESOLVE_SECTION_ORDER.filter((section) =>
      requestedSections.has(section)
    );
  }, [resolveQueueParam]);
  const resolveSearchParams = useMemo(() => {
    if (!resolveMode) return null;
    const params = new URLSearchParams();
    params.set("mode", "resolve");
    params.set("returnTo", resolveReturnTo);
    if (resolveQueueParam !== null) {
      params.set("resolveQueue", resolveQueue.join(","));
    }
    return params;
  }, [resolveMode, resolveReturnTo, resolveQueueParam, resolveQueue]);
  const buildFormUrl = useCallback(
    (sectionId: RECAWorkflowSection) => {
      if (!resolveSearchParams) {
        return `/reca/form/${sessionId}?section=${sectionId}`;
      }
      const params = new URLSearchParams(resolveSearchParams);
      params.set("section", sectionId);
      return `/reca/form/${sessionId}?${params.toString()}`;
    },
    [resolveSearchParams, sessionId]
  );
  const getNextResolveSection = useCallback(
    (sectionId: RECAWorkflowSection) => {
      if (resolveQueue.length === 0) return null;
      const currentIndex = RESOLVE_SECTION_ORDER.indexOf(sectionId);
      if (currentIndex === -1) return resolveQueue[0] || null;
      for (const queuedSection of resolveQueue) {
        const queuedIndex = RESOLVE_SECTION_ORDER.indexOf(queuedSection);
        if (queuedIndex > currentIndex) {
          return queuedSection;
        }
      }
      return null;
    },
    [resolveQueue]
  );

  // Keep refs updated
  useEffect(() => {
    workflowStateRef.current = workflowState;
  }, [workflowState]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    setWorkflowState(initialState);
  }, [initialState]);

  const handleAutoSave = useCallback(async () => {
    // Use ref to check current saving state
    if (isSavingRef.current) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      // Ensure the latest in-section form values (react-hook-form) are pushed into
      // workflowState before we POST it. Without this, clicking "Save Progress"
      // can persist stale workflowState.formData (e.g., SSN appears missing).
      try {
        const submitFn = (window as any).__currentFormSubmit;
        if (typeof submitFn === "function") {
          await submitFn();
        }
      } catch (e) {
        // Non-blocking: still attempt to save whatever state we currently have.
        console.warn("[FormWizard] __currentFormSubmit failed", e);
      }

      // Use ref to get latest workflow state
      const currentState = workflowStateRef.current;

      const response = await fetch(`/api/reca/workflow/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSection: currentState.currentSection,
          currentStage: currentState.currentStage,
          formData: currentState.formData,
          supportingForms: currentState.supportingForms,
          eligibilityData: currentState.eligibilityData,
        } as SaveWorkflowRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const result = await response.json();
      setLastSaved(new Date());
      setWorkflowState((prev) => ({
        ...prev,
        completionPercentage: result.completionPercentage,
        lastSaved: result.lastSaved,
      }));

      // Prompt guest users to create account on first successful save
      if (status === "unauthenticated" && !hasPromptedAccount && !lastSaved) {
        setShowAccountModal(true);
        setHasPromptedAccount(true);
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      setSaveError("Failed to auto-save. Your progress may not be saved.");
    } finally {
      setIsSaving(false);
    }
  }, [
    sessionId,
    status,
    hasPromptedAccount,
    // Only include stable dependencies
    // workflowState, lastSaved, and isSaving are accessed via refs
  ]);

  // Auto-save every 2 minutes - fixed to prevent infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
    // Now safe to depend on handleAutoSave since it only depends on stable values
  }, [handleAutoSave]);

  const handleManualSave = async () => {
    await handleAutoSave();
  };

  const handleNext = async () => {
    let usedFormSubmit = false;
    // Trigger form submission/validation if available
    if ((window as any).__currentFormSubmit) {
      usedFormSubmit = true;
      const isValid = await (window as any).__currentFormSubmit();
      if (!isValid) {
        return; // Don't navigate if form is invalid
      }
      // Delay to allow state to propagate from form submission
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Save before navigating (though form should have already saved)
    if (!usedFormSubmit) {
      await handleAutoSave();
    }

    // Reload the latest state from the server to ensure we have the most up-to-date data
    let latestState = workflowState;
    try {
      const latestStateResponse = await fetch(
        `/api/reca/workflow/${sessionId}`
      );
      if (latestStateResponse.ok) {
        latestState = await latestStateResponse.json();
        setWorkflowState(latestState);
      }
    } catch (error) {
      console.error("Failed to reload workflow state:", error);
      // Continue with existing state
    }

    if (resolveMode) {
      const nextResolveSection = getNextResolveSection(currentSection);
      if (nextResolveSection) {
        router.push(buildFormUrl(nextResolveSection) as any);
      } else {
        router.push(resolveReturnTo as any);
      }
      return;
    }

    if (onNext) {
      onNext();
      return;
    }

    // Use the latest state for navigation logic
    const relationship = latestState.formData.part_3?.relationship;

    // For early sections (before Part 3), use simple sequential navigation
    if (currentSection === "part_1") {
      // If filing for self, skip Part 2 and go straight to Part 3
      const filingForSelf = latestState.formData.part_1?.filingForSelf;
      if (filingForSelf === true) {
        router.push(buildFormUrl("part_3") as any);
      } else {
        router.push(buildFormUrl("part_2") as any);
      }
      return;
    }

    if (currentSection === "part_2") {
      router.push(buildFormUrl("part_3") as any);
      return;
    }

    if (currentSection === "part_3") {
      // After Part 3, navigate to appropriate relationship-specific section
      const updatedRelationship = latestState.formData.part_3?.relationship;
      const filingForSelf = latestState.formData.part_1?.filingForSelf;

      // If filing for self, we know relationship is "Self" even if not yet in state
      const effectiveRelationship =
        filingForSelf === true ? "Self" : updatedRelationship;

      if (!effectiveRelationship) {
        alert("Please select your relationship to the person who became ill");
        return;
      }

      // Navigate to relationship-specific section
      if (effectiveRelationship === "Self") {
        router.push(buildFormUrl("part_4") as any);
      } else if (effectiveRelationship === "Spouse") {
        router.push(buildFormUrl("part_5") as any);
      } else if (effectiveRelationship === "Child") {
        router.push(buildFormUrl("part_6") as any);
      } else {
        // Parent, Grandchild, Grandparent
        router.push(buildFormUrl("part_7") as any);
      }
      return;
    }

    // After Part 3, relationship is required for other sections
    if (!relationship) {
      alert("Please complete the relationship section first");
      return;
    }

    const nextSection = getNextSection(
      currentSection,
      relationship,
      latestState.formData
    );

    if (nextSection) {
      // Route to supporting forms if that's the next section
      if (nextSection === "supporting_forms") {
        router.push(
          `/reca/supporting/${sessionId}?form=certification_of_identity` as any
        );
      } else if (nextSection === "document_checklist") {
        router.push(`/reca/documents/${sessionId}` as any);
      } else if (nextSection === "final_review") {
        router.push(`/reca/review/${sessionId}` as any);
      } else {
        router.push(buildFormUrl(nextSection) as any);
      }
    } else {
      // No more sections - go to review
      router.push(`/reca/review/${sessionId}` as any);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      // Default navigation logic

      // Handle review section - go back to supporting forms
      if (currentSection === "review") {
        router.push(`/reca/supporting/${sessionId}` as any);
        return;
      }

      // Handle early sections (before Part 3)
      if (currentSection === "part_1") {
        router.push(`/reca/start?sessionId=${sessionId}` as any);
        return;
      }

      if (currentSection === "part_2") {
        router.push(buildFormUrl("part_1") as any);
        return;
      }

      if (currentSection === "part_3") {
        // If filing for self, skip back to Part 1 (Part 2 was skipped)
        const filingForSelf = workflowState.formData.part_1?.filingForSelf;
        if (filingForSelf === true) {
          router.push(buildFormUrl("part_1") as any);
        } else {
          router.push(buildFormUrl("part_2") as any);
        }
        return;
      }

      const relationship = workflowState.formData.part_3?.relationship;
      if (!relationship) {
        router.push(`/reca/start?sessionId=${sessionId}` as any);
        return;
      }

      const prevSection = getPreviousSection(
        currentSection,
        relationship,
        workflowState.formData
      );

      if (prevSection) {
        router.push(buildFormUrl(prevSection) as any);
      } else {
        router.push(`/reca/start?sessionId=${sessionId}` as any);
      }
    }
  };

  const handleBackToReview = useCallback(() => {
    router.push(resolveReturnTo as any);
  }, [router, resolveReturnTo]);

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {/* Progress Bar */}
      <ProgressBar
        currentSection={currentSection}
        completionPercentage={workflowState.completionPercentage}
      />

      {/* Main Content */}
      <div className="container mx-auto flex-1 px-6 py-8">
        {/* Save Status */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-sage-900">
            {getSectionDisplayName(currentSection)}
          </h1>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-sm text-sage-600">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isSaving && (
              <span className="flex items-center gap-2 text-sm text-sage-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-terracotta-500 border-t-transparent" />
                Saving...
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="mb-1 font-semibold text-red-900">Save Error</h3>
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="mx-auto max-w-4xl">{children}</div>

        {/* Navigation Buttons */}
        {!hideNavigation && (
          <div className="mx-auto mt-8 flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-2">
              {resolveMode && (
                <Button
                  variant="outline"
                  onClick={handleBackToReview}
                  className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                >
                  Back to Review
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            </div>
            <Button
              onClick={handleNext}
              className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Account Creation Modal for Guest Users */}
      <AccountCreationModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSkip={() => setShowAccountModal(false)}
        sessionId={sessionId}
      />
    </div>
  );
}

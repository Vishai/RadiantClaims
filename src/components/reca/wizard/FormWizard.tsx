"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  onSave?: (data: any) => Promise<void>;
  onNext?: () => void;
  onPrevious?: () => void;
  hideNavigation?: boolean;
}

export function FormWizard({
  sessionId,
  initialState,
  currentSection,
  children,
  onSave,
  onNext,
  onPrevious,
  hideNavigation = false,
}: FormWizardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workflowState, setWorkflowState] =
    useState<RECAWorkflowState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [hasPromptedAccount, setHasPromptedAccount] = useState(false);

  // Auto-save every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [workflowState]);

  const handleAutoSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const response = await fetch(
        `/api/reca/workflow/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentSection: workflowState.currentSection,
            currentStage: workflowState.currentStage,
            formData: workflowState.formData,
            supportingForms: workflowState.supportingForms,
            eligibilityData: workflowState.eligibilityData,
          } as SaveWorkflowRequest),
        }
      );

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
  };

  const handleManualSave = async () => {
    await handleAutoSave();
  };

  const handleNext = async () => {
    // Trigger form submission/validation if available
    if ((window as any).__currentFormSubmit) {
      const isValid = await (window as any).__currentFormSubmit();
      if (!isValid) {
        return; // Don't navigate if form is invalid
      }
      // Small delay to allow state to propagate from form submission
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save before navigating (though form should have already saved)
    await handleAutoSave();

    if (onNext) {
      onNext();
    } else {
      // Default navigation logic
      const relationship = workflowState.formData.part_3?.relationship;

      // For early sections (before Part 3), use simple sequential navigation
      if (currentSection === "part_1") {
        // If filing for self, skip Part 2 and go straight to Part 3
        const filingForSelf = workflowState.formData.part_1?.filingForSelf;
        if (filingForSelf === true) {
          router.push(`/reca/form/${sessionId}?section=part_3`);
        } else {
          router.push(`/reca/form/${sessionId}?section=part_2`);
        }
        return;
      }

      if (currentSection === "part_2") {
        router.push(`/reca/form/${sessionId}?section=part_3`);
        return;
      }

      if (currentSection === "part_3") {
        // After Part 3, navigate to appropriate relationship-specific section
        // Note: Form data was saved by form submission, but state may not be updated yet
        // Check both the current state and if filing for self (which auto-selects Self)
        const updatedRelationship = workflowState.formData.part_3?.relationship;
        const filingForSelf = workflowState.formData.part_1?.filingForSelf;

        // If filing for self, we know relationship is "Self" even if not yet in state
        const effectiveRelationship = filingForSelf === true ? "Self" : updatedRelationship;

        if (!effectiveRelationship) {
          alert("Please select your relationship to the person who became ill");
          return;
        }

        // Navigate to relationship-specific section
        if (effectiveRelationship === "Self") {
          router.push(`/reca/form/${sessionId}?section=part_4`);
        } else if (effectiveRelationship === "Spouse") {
          router.push(`/reca/form/${sessionId}?section=part_5`);
        } else if (effectiveRelationship === "Child") {
          router.push(`/reca/form/${sessionId}?section=part_6`);
        } else {
          // Parent, Grandchild, Grandparent
          router.push(`/reca/form/${sessionId}?section=part_7`);
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
        workflowState.formData
      );

      if (nextSection) {
        // Route to supporting forms if that's the next section
        if (nextSection === "supporting_forms") {
          router.push(`/reca/supporting/${sessionId}?form=certification_of_identity`);
        } else if (nextSection === "document_checklist") {
          router.push(`/reca/documents/${sessionId}`);
        } else if (nextSection === "final_review") {
          router.push(`/reca/review/${sessionId}`);
        } else {
          router.push(`/reca/form/${sessionId}?section=${nextSection}`);
        }
      } else {
        // No more sections - go to review
        router.push(`/reca/review/${sessionId}`);
      }
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      // Default navigation logic

      // Handle early sections (before Part 3)
      if (currentSection === "part_1") {
        router.push(`/reca/start?sessionId=${sessionId}`);
        return;
      }

      if (currentSection === "part_2") {
        router.push(`/reca/form/${sessionId}?section=part_1`);
        return;
      }

      if (currentSection === "part_3") {
        // If filing for self, skip back to Part 1 (Part 2 was skipped)
        const filingForSelf = workflowState.formData.part_1?.filingForSelf;
        if (filingForSelf === true) {
          router.push(`/reca/form/${sessionId}?section=part_1`);
        } else {
          router.push(`/reca/form/${sessionId}?section=part_2`);
        }
        return;
      }

      const relationship = workflowState.formData.part_3?.relationship;
      if (!relationship) {
        router.push(`/reca/start?sessionId=${sessionId}`);
        return;
      }

      const prevSection = getPreviousSection(
        currentSection,
        relationship,
        workflowState.formData
      );

      if (prevSection) {
        router.push(`/reca/form/${sessionId}?section=${prevSection}`);
      } else {
        router.push(`/reca/start?sessionId=${sessionId}`);
      }
    }
  };

  const getCompletedSections = (): RECAWorkflowSection[] => {
    const completed: RECAWorkflowSection[] = [];
    Object.keys(workflowState.formData).forEach((key) => {
      if (workflowState.formData[key as keyof typeof workflowState.formData]) {
        completed.push(key as RECAWorkflowSection);
      }
    });
    return completed;
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Progress Bar */}
      <ProgressBar
        currentSection={currentSection}
        completedSections={getCompletedSections()}
        completionPercentage={workflowState.completionPercentage}
      />

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-8">
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
              <span className="text-sm text-sage-600 flex items-center gap-2">
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
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Save Error</h3>
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="max-w-4xl mx-auto">{children}</div>

        {/* Navigation Buttons */}
        {!hideNavigation && (
          <div className="mt-8 flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
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

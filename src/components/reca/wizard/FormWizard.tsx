"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, AlertCircle } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
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
  const [workflowState, setWorkflowState] =
    useState<RECAWorkflowState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    // Save before navigating
    await handleAutoSave();

    if (onNext) {
      onNext();
    } else {
      // Default navigation logic
      const relationship = workflowState.formData.part_3?.relationship;
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
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormWizard } from "@/components/reca/wizard/FormWizard";
import { Part1Form } from "@/components/reca/parts/Part1Form";
import { Part2Form } from "@/components/reca/parts/Part2Form";
import { Part3Form } from "@/components/reca/parts/Part3Form";
import Part4Form from "@/components/reca/parts/Part4Form";
import Part5Form from "@/components/reca/parts/Part5Form";
import Part6Form from "@/components/reca/parts/Part6Form";
import Part7Form from "@/components/reca/parts/Part7Form";
import Part8Form from "@/components/reca/parts/Part8Form";
import Part9Form from "@/components/reca/parts/Part9Form";
import Part10Form from "@/components/reca/parts/Part10Form";
import Part11Form from "@/components/reca/parts/Part11Form";
import Part12Form from "@/components/reca/parts/Part12Form";
import Part13Form from "@/components/reca/parts/Part13Form";
import Part14Form from "@/components/reca/parts/Part14Form";
import Part15Form from "@/components/reca/parts/Part15Form";
import Part16Form from "@/components/reca/parts/Part16Form";
import {
  RECAWorkflowState,
  RECAWorkflowSection,
} from "@/lib/reca/types";

interface PageProps {
  params: { sessionId: string };
}

export default function RECAFormPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workflowState, setWorkflowState] = useState<RECAWorkflowState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSection =
    (searchParams.get("section") as RECAWorkflowSection) || "part_1";

  const loadWorkflowState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reca/workflow/${params.sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Workflow session not found");
        }
        throw new Error("Failed to load workflow state");
      }

      const data: RECAWorkflowState = await response.json();
      setWorkflowState(data);
    } catch (err) {
      console.error("Error loading workflow:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load workflow"
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.sessionId]);

  useEffect(() => {
    // Load workflow state regardless of auth status (RECA forms are public)
    loadWorkflowState();
  }, [loadWorkflowState]);

  // Redirect Part 2 if filing for self
  useEffect(() => {
    if (workflowState && currentSection === "part_2") {
      const filingForSelf = workflowState.formData.part_1?.filingForSelf;
      if (filingForSelf === true) {
        // Skip Part 2 - redirect to Part 3
        router.replace(`/reca/form/${params.sessionId}?section=part_3`);
      }
    }
  }, [workflowState, currentSection, params.sessionId, router]);

  const handleSaveSection = async (sectionData: any) => {
    if (!workflowState) return;

    try {
      const response = await fetch(`/api/reca/workflow/${params.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSection,
          formData: {
            ...workflowState.formData,
            [currentSection]: sectionData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save section");
      }

      const result = await response.json();

      // Update local state
      setWorkflowState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          formData: {
            ...prev.formData,
            [currentSection]: sectionData,
          },
          completionPercentage: result.completionPercentage,
          lastSaved: result.lastSaved,
        };
      });

      return true;
    } catch (err) {
      console.error("Error saving section:", err);
      return false;
    }
  };

  const renderCurrentSection = () => {
    if (!workflowState) return null;

    switch (currentSection) {
      case "part_1":
        return (
          <Part1Form
            initialData={workflowState.formData.part_1}
            onSubmit={handleSaveSection}
          />
        );

      case "part_2":
        // Show message if this section should be skipped
        if (workflowState.formData.part_1?.filingForSelf === true) {
          return (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-lg font-semibold text-sage-900 mb-2">
                  Redirecting...
                </p>
                <p className="text-sage-600">
                  Since you're filing for yourself, we're skipping this section.
                </p>
              </div>
            </div>
          );
        }
        return (
          <Part2Form
            initialData={workflowState.formData.part_2}
            onSubmit={handleSaveSection}
          />
        );

      case "part_3":
        return (
          <Part3Form
            initialData={workflowState.formData.part_3}
            onSubmit={handleSaveSection}
            filingForSelf={workflowState.formData.part_1?.filingForSelf}
          />
        );

      case "part_4":
        return (
          <Part4Form
            initialData={workflowState.formData.part_4}
            onSubmit={handleSaveSection}
          />
        );

      case "part_5":
        return (
          <Part5Form
            initialData={workflowState.formData.part_5}
            onSubmit={handleSaveSection}
          />
        );

      case "part_6":
        return (
          <Part6Form
            initialData={workflowState.formData.part_6}
            onSubmit={handleSaveSection}
          />
        );

      case "part_7":
        return (
          <Part7Form
            initialData={workflowState.formData.part_7}
            onSubmit={handleSaveSection}
          />
        );

      case "part_8":
        return (
          <Part8Form
            initialData={workflowState.formData.part_8}
            onSubmit={handleSaveSection}
          />
        );

      case "part_9":
        return (
          <Part9Form
            initialData={workflowState.formData.part_9}
            onSubmit={handleSaveSection}
            sessionId={params.sessionId}
          />
        );

      case "part_10":
        return (
          <Part10Form
            initialData={workflowState.formData.part_10}
            onSubmit={handleSaveSection}
          />
        );

      case "part_11":
        return (
          <Part11Form
            initialData={workflowState.formData.part_11}
            onSubmit={handleSaveSection}
            sessionId={params.sessionId}
          />
        );

      case "part_12":
        return (
          <Part12Form
            initialData={workflowState.formData.part_12}
            onSubmit={handleSaveSection}
          />
        );

      case "part_13":
        return (
          <Part13Form
            initialData={workflowState.formData.part_13}
            onSubmit={handleSaveSection}
          />
        );

      case "part_14":
        return (
          <Part14Form
            initialData={workflowState.formData.part_14}
            onSubmit={handleSaveSection}
          />
        );

      case "part_15":
        return (
          <Part15Form
            initialData={workflowState.formData.part_15}
            onSubmit={handleSaveSection}
          />
        );

      case "part_16":
        return (
          <Part16Form
            initialData={workflowState.formData.part_16}
            onSubmit={handleSaveSection}
          />
        );

      // Add more cases as we implement them
      default:
        return (
          <div className="text-center py-12">
            <p className="text-sage-700 mb-4">
              Section "{currentSection}" is coming soon!
            </p>
            <p className="text-sm text-sage-600">
              We're still building out this part of the form.
            </p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !workflowState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-sage-900 mb-4">
            Error Loading Form
          </h2>
          <p className="text-sage-700 mb-6">{error || "Unknown error"}</p>
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

  return (
    <FormWizard
      sessionId={params.sessionId}
      initialState={workflowState}
      currentSection={currentSection}
    >
      {renderCurrentSection()}
    </FormWizard>
  );
}

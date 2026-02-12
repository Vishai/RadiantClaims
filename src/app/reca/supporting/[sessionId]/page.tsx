"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormWizard } from "@/components/reca/wizard/FormWizard";
import MedicalInformationReleaseForm from "@/components/reca/supporting/MedicalInformationReleaseForm";
import CertificationOfIdentityForm from "@/components/reca/supporting/CertificationOfIdentityForm";
import TribalRecordsReleaseForm from "@/components/reca/supporting/TribalRecordsReleaseForm";
import SurvivingBeneficiariesForm from "@/components/reca/supporting/SurvivingBeneficiariesForm";
import {
  RECAWorkflowState,
  // MedicalInformationRelease,
  // CertificationOfIdentity,
  // TribalRecordsRelease,
  // SurvivingBeneficiariesSignatures,
} from "@/lib/reca/types";
import {
  getSupportingFormsForClaim,
  isSupportingFormOptional,
  type SupportingFormType,
} from "@/lib/reca/workflow";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText } from "lucide-react";

interface PageProps {
  params: { sessionId: string };
}

export default function RECASupportingFormsPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [workflowState, setWorkflowState] = useState<RECAWorkflowState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentForm =
    (searchParams.get("form") as SupportingFormType) ||
    "certification_of_identity";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/reca/supporting/${params.sessionId}`);
      return;
    }

    if (status === "authenticated") {
      loadWorkflowState();
    }
  }, [status, params.sessionId, router, loadWorkflowState]);

  const handleSaveSupportingForm = async (
    formType: SupportingFormType,
    formData: any
  ) => {
    if (!workflowState) return;

    try {
      const response = await fetch(`/api/reca/workflow/${params.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSection: "supporting_forms",
          supportingForms: {
            ...workflowState.supportingForms,
            [formType === "medical_info_release"
              ? "medicalInformationRelease"
              : formType === "certification_of_identity"
                ? "certificationOfIdentity"
                : formType === "tribal_records_release"
                  ? "tribalRecordsRelease"
                  : "survivingBeneficiariesSignatures"]: formData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save supporting form");
      }

      const result = await response.json();

      // Update local state
      setWorkflowState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          supportingForms: {
            ...prev.supportingForms,
            [formType === "medical_info_release"
              ? "medicalInformationRelease"
              : formType === "certification_of_identity"
                ? "certificationOfIdentity"
                : formType === "tribal_records_release"
                  ? "tribalRecordsRelease"
                  : "survivingBeneficiariesSignatures"]: formData,
          },
          completionPercentage: result.completionPercentage,
          lastSaved: result.lastSaved,
        };
      });

      return true;
    } catch (err) {
      console.error("Error saving supporting form:", err);
      return false;
    }
  };

  const handleNavigateToReview = () => {
    router.push(`/reca/form/${params.sessionId}?section=review` as any);
  };

  const handleNavigateBack = () => {
    // Navigate back to Part 16 (the last part of the main form)
    router.push(`/reca/form/${params.sessionId}?section=part_16`);
  };

  const areAllRequiredFormsComplete = (): boolean => {
    if (!workflowState) return false;

    const required = getSupportingFormsForClaim(workflowState.formData);
    return required.every((form) => {
      const formKey =
        form === "medical_info_release"
          ? "medicalInformationRelease"
          : form === "certification_of_identity"
            ? "certificationOfIdentity"
            : form === "tribal_records_release"
              ? "tribalRecordsRelease"
              : "survivingBeneficiariesSignatures";

      // Surviving beneficiaries is optional
      if (isSupportingFormOptional(form)) return true;

      return !!workflowState.supportingForms[formKey];
    });
  };

  const renderCurrentForm = () => {
    if (!workflowState) return null;

    const requiredForms = getSupportingFormsForClaim(workflowState.formData);

    // Show message if form is not required for this claim
    if (!requiredForms.includes(currentForm)) {
      return (
        <Card className="border-sage-200">
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-sage-400" />
              <p className="mb-2 text-lg font-semibold text-sage-900">
                This Form is Not Required for Your Claim
              </p>
              <p className="mb-6 text-sm text-sage-600">
                Based on your previous responses, this supporting form is not
                needed. Please navigate to the required forms using the
                navigation menu.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (currentForm) {
      case "medical_info_release":
        return (
          <MedicalInformationReleaseForm
            initialData={
              workflowState.supportingForms.medicalInformationRelease
            }
            onSubmit={(data) =>
              handleSaveSupportingForm("medical_info_release", data)
            }
          />
        );

      case "certification_of_identity":
        return (
          <CertificationOfIdentityForm
            initialData={workflowState.supportingForms.certificationOfIdentity}
            onSubmit={(data) =>
              handleSaveSupportingForm("certification_of_identity", data)
            }
            part1Data={
              workflowState.formData.part_1
                ? {
                    firstName: workflowState.formData.part_1.firstName,
                    middleName: workflowState.formData.part_1.middleName,
                    lastName: workflowState.formData.part_1.lastName,
                    ssn: workflowState.formData.part_1.ssn,
                    dob: workflowState.formData.part_1.dob,
                    mailingAddress:
                      workflowState.formData.part_1.mailingAddress,
                    city: workflowState.formData.part_1.city,
                    state: workflowState.formData.part_1.state,
                    zipCode: workflowState.formData.part_1.zipCode,
                  }
                : undefined
            }
          />
        );

      case "tribal_records_release":
        return (
          <TribalRecordsReleaseForm
            initialData={workflowState.supportingForms.tribalRecordsRelease}
            onSubmit={(data) =>
              handleSaveSupportingForm("tribal_records_release", data)
            }
          />
        );

      case "surviving_beneficiaries":
        return (
          <SurvivingBeneficiariesForm
            initialData={
              workflowState.supportingForms.survivingBeneficiariesSignatures
            }
            onSubmit={(data) =>
              handleSaveSupportingForm("surviving_beneficiaries", data)
            }
          />
        );

      default:
        return (
          <div className="py-12 text-center">
            <p className="mb-4 text-sage-700">Unknown form "{currentForm}"</p>
          </div>
        );
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading supporting forms...</p>
        </div>
      </div>
    );
  }

  if (error || !workflowState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-sage-900">
            Error Loading Forms
          </h2>
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

  return (
    <FormWizard
      sessionId={params.sessionId}
      initialState={workflowState}
      currentSection="supporting_forms"
      onNext={handleNavigateToReview}
      onPrevious={handleNavigateBack}
    >
      <div className="space-y-6">
        {/* Supporting Forms Overview */}
        <Card className="border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-terracotta-600" />
              <div className="flex-1">
                <h2 className="mb-2 text-lg font-bold text-terracotta-900">
                  Supporting Forms Required for Your Claim
                </h2>
                <p className="mb-3 text-sm text-terracotta-800">
                  Based on your responses in the main RECA form, you need to
                  complete the following supporting forms. These forms are
                  necessary to process your claim.
                </p>
                <div className="mb-4 space-y-2">
                  {getSupportingFormsForClaim(workflowState.formData).map(
                    (form) => {
                      const formKey =
                        form === "medical_info_release"
                          ? "medicalInformationRelease"
                          : form === "certification_of_identity"
                            ? "certificationOfIdentity"
                            : form === "tribal_records_release"
                              ? "tribalRecordsRelease"
                              : "survivingBeneficiariesSignatures";

                      const isComplete =
                        !!workflowState.supportingForms[formKey];
                      const isOptional = isSupportingFormOptional(form);

                      return (
                        <div
                          key={form}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isComplete
                                ? "bg-green-500"
                                : isOptional
                                  ? "bg-blue-400"
                                  : "bg-amber-500"
                            }`}
                          />
                          <button
                            onClick={() =>
                              router.push(
                                `/reca/supporting/${params.sessionId}?form=${form}`
                              )
                            }
                            className={`text-left hover:underline ${
                              currentForm === form
                                ? "font-semibold text-terracotta-900"
                                : "text-sage-900"
                            }`}
                          >
                            {form === "medical_info_release"
                              ? "Medical Information Release"
                              : form === "certification_of_identity"
                                ? "Certification of Identity (Required)"
                                : form === "tribal_records_release"
                                  ? "Tribal Records Release"
                                  : "Surviving Beneficiaries Signatures (Optional)"}
                          </button>
                          {isComplete && (
                            <CheckCircle2 className="ml-1 h-4 w-4 text-green-600" />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {areAllRequiredFormsComplete() && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">
                          All Required Forms Complete!
                        </p>
                        <p className="text-sm text-green-800">
                          Click "Continue" below to proceed to the Review &
                          Download page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Form */}
        {renderCurrentForm()}
      </div>
    </FormWizard>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part11ProofOfDisease } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { FIELD_HELP } from "@/lib/reca/field-help-content";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Info,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  MedicalDocumentUpload,
  UploadedMedicalDocument,
  MedicalDocumentType,
} from "../MedicalDocumentUpload";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

// Validation schema
const part11Schema = z
  .object({
    medicalRecordsSubmitted: z.boolean().refine((val) => val === true, {
      message:
        "You must confirm that you have submitted or will submit certified medical records",
    }),
    cancerRegistryAuthorization: z.boolean().optional(),
    resepAssistance: z.enum(["YES", "NO"]).optional(),
    resepClinicName: z.string().optional(),
  })
  .refine(
    (data) => {
      // If RESEP assistance is YES, clinic name is required
      if (data.resepAssistance === "YES") {
        return data.resepClinicName && data.resepClinicName.trim().length > 0;
      }
      return true;
    },
    {
      message: "Clinic name is required when RESEP assistance is YES",
      path: ["resepClinicName"],
    }
  );

type Part11FormData = z.infer<typeof part11Schema>;

interface Part11FormProps {
  initialData?: Partial<Part11ProofOfDisease>;
  onSubmit: (data: Part11ProofOfDisease) => void;
  sessionId: string;
}

export default function Part11Form({
  initialData,
  onSubmit,
  sessionId,
}: Part11FormProps) {
  const form = useForm<Part11FormData>({
    resolver: zodResolver(part11Schema),
    defaultValues: {
      medicalRecordsSubmitted: initialData?.medicalRecordsSubmitted || false,
      cancerRegistryAuthorization:
        initialData?.cancerRegistryAuthorization || false,
      resepAssistance: initialData?.resepAssistance || undefined,
      resepClinicName: initialData?.resepClinicName || "",
    },
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedMedicalDocument[]
  >(
    initialData?.uploadedDocuments?.map((doc) => ({
      ...doc,
      documentType: doc.documentType as MedicalDocumentType,
      uploadedAt: new Date(doc.uploadedAt),
      status: "success" as const,
    })) || []
  );

  const medicalRecordsSubmitted = form.watch("medicalRecordsSubmitted");
  const cancerRegistryAuthorization = form.watch("cancerRegistryAuthorization");
  const resepAssistance = form.watch("resepAssistance");
  const formErrors = form.formState.errors;

  // Collapsible sections state
  const [isDocTypesExpanded, setIsDocTypesExpanded] = useState(true);
  const [isDiseaseSpecificExpanded, setIsDiseaseSpecificExpanded] =
    useState(false);

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if medical records checkbox is checked
      if (values.medicalRecordsSubmitted) {
        const submissionData: Part11ProofOfDisease = {
          ...values,
          uploadedDocuments: uploadedDocuments
            .filter((doc) => doc.status === "success")
            .map((doc) => ({
              id: doc.id,
              fileName: doc.fileName,
              fileKey: doc.fileKey,
              documentType: doc.documentType,
              uploadedAt: doc.uploadedAt.toISOString(),
              fileSize: doc.fileSize,
            })),
        };
        onSubmit(submissionData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit, uploadedDocuments]);

  // Also submit when documents change
  useEffect(() => {
    const values = form.getValues();
    if (values.medicalRecordsSubmitted) {
      const submissionData: Part11ProofOfDisease = {
        ...values,
        uploadedDocuments: uploadedDocuments
          .filter((doc) => doc.status === "success")
          .map((doc) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            documentType: doc.documentType,
            uploadedAt: doc.uploadedAt.toISOString(),
            fileSize: doc.fileSize,
          })),
      };
      onSubmit(submissionData);
    }
  }, [uploadedDocuments, form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      const submissionData: Part11ProofOfDisease = {
        ...data,
        uploadedDocuments: uploadedDocuments
          .filter((doc) => doc.status === "success")
          .map((doc) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            documentType: doc.documentType,
            uploadedAt: doc.uploadedAt.toISOString(),
            fileSize: doc.fileSize,
          })),
      };
      await onSubmit(submissionData);
    },
    [onSubmit, uploadedDocuments]
  );

  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise<boolean>((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handlePartialSubmit(data);
            resolve(true);
          },
          async () => {
            const formData = form.getValues();
            await handlePartialSubmit(formData);
            resolve(true); // Always allow progression
          }
        )();
      });
    };
    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handlePartialSubmit]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Part 11: Proof of Disease
          </CardTitle>
          <CardDescription>
            Medical documentation required to establish diagnosis of compensable
            disease
          </CardDescription>
          {/* Document status banner */}
          {(() => {
            const medDocsUploaded = uploadedDocuments.filter(
              (doc) => doc.status === "success"
            ).length;
            return medDocsUploaded > 0 ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    <strong>{medDocsUploaded}</strong> medical document
                    {medDocsUploaded !== 1 ? "s" : ""} uploaded
                  </span>
                </div>
                <Link
                  href={`/reca/documents/${sessionId}`}
                  className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  View all docs
                </Link>
              </div>
            ) : null;
          })()}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acceptable Documents Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="mb-2 font-semibold text-blue-900">
                  Acceptable Medical Documentation
                </p>
                <p className="text-sm text-blue-800">
                  You must submit medical records that clearly show a diagnosis
                  of one or more compensable diseases. Review the accepted
                  document types below.
                </p>
              </div>
            </div>
          </div>

          {/* Document Types Checklist - Collapsible */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-sage-900">
                Accepted Document Types
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDocTypesExpanded(!isDocTypesExpanded)}
                className="gap-2"
              >
                {isDocTypesExpanded ? (
                  <>
                    Hide <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {isDocTypesExpanded && (
              <div className="space-y-3">
                {[
                  "Pathology report of tissue biopsy or surgical resection",
                  "Operative report",
                  "Hospital discharge summary report",
                  "Physician summary report",
                  "Death certificate (dated and signed by physician)",
                  "Autopsy report",
                ].map((docType, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-md border border-sage-200 bg-white p-3"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-terracotta-500" />
                    <span className="text-sm text-sage-700">{docType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Required: Medical Records Submitted Checkbox */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
              helpTooltip={FIELD_HELP.part11_medicalRecords}
            >
              Medical Records Confirmation{" "}
              <span className="text-red-600">*</span>
            </FieldLabel>

            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                formErrors.medicalRecordsSubmitted
                  ? "border-red-300 bg-red-50"
                  : medicalRecordsSubmitted
                    ? "border-terracotta-300 bg-terracotta-50"
                    : "border-sage-200 bg-white"
              }`}
            >
              <Checkbox
                id="medicalRecordsSubmitted"
                checked={medicalRecordsSubmitted}
                onCheckedChange={(checked) =>
                  form.setValue("medicalRecordsSubmitted", checked as boolean, {
                    shouldValidate: true,
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <FieldLabel
                  htmlFor="medicalRecordsSubmitted"
                  importance="required"
                  className="cursor-pointer text-sm font-semibold uppercase leading-none"
                >
                  I have submitted certified medical records showing a diagnosis
                  of a compensable cancer
                </FieldLabel>
                <p className="mt-2 text-xs text-sage-600">
                  This confirmation is required. You must provide medical
                  documentation that proves the diagnosis of at least one
                  compensable disease selected in Part 10.
                </p>
              </div>
            </div>

            {formErrors.medicalRecordsSubmitted && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {formErrors.medicalRecordsSubmitted.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional: Cancer Registry Authorization */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="optional"
              className="text-base font-semibold text-sage-900"
            >
              State Cancer Registry (Optional)
            </FieldLabel>

            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                cancerRegistryAuthorization
                  ? "border-terracotta-300 bg-terracotta-50"
                  : "border-sage-200 bg-white"
              }`}
            >
              <Checkbox
                id="cancerRegistryAuthorization"
                checked={cancerRegistryAuthorization}
                onCheckedChange={(checked) =>
                  form.setValue(
                    "cancerRegistryAuthorization",
                    checked as boolean
                  )
                }
                className="mt-1"
              />
              <div className="flex-1">
                <FieldLabel
                  htmlFor="cancerRegistryAuthorization"
                  importance="optional"
                  className="cursor-pointer text-sm font-semibold uppercase leading-none"
                >
                  I authorize the Department of Justice to contact a state
                  cancer registry on my behalf
                </FieldLabel>
                <p className="mt-2 text-xs text-sage-600">
                  If you check this box, you must also complete the
                  "Authorization to Release Medical Information" form.{" "}
                  <strong>
                    After the DOJ receives your complete application,
                  </strong>{" "}
                  they will attempt to obtain your medical records directly from
                  the state cancer registry when they begin processing your
                  claim.{" "}
                  <span className="font-medium text-sage-700">
                    RadiantClaims is not involved in this process
                  </span>{" "}
                  — this authorization is between you and the government.
                </p>
              </div>
            </div>

            {cancerRegistryAuthorization && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      Additional Form Required
                    </p>
                    <p className="mb-2 text-sm text-amber-800">
                      You will need to complete the "Authorization to Release
                      Medical and Other Information from a State Cancer
                      Registry" form in a later step. This form authorizes the
                      <strong> Department of Justice</strong> (not
                      RadiantClaims) to request your records from the registry
                      on your behalf.
                    </p>
                    <p className="text-sm text-amber-800">
                      <strong>Important:</strong> The DOJ will only contact the
                      cancer registry after they receive your complete
                      application and begin processing your claim. This process
                      does not start until your full application has been
                      submitted to the DOJ.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RESEP Assistance Section */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="optional"
              className="text-base font-semibold text-sage-900"
            >
              Radiation Exposure Screening and Education Program (RESEP)
            </FieldLabel>

            <p className="text-sm text-sage-600">
              RESEP clinics provide free medical screening and education to
              individuals who may have been exposed to radiation. If you have
              received assistance from a RESEP clinic, please let us know.
            </p>

            <div className="space-y-4">
              <FieldLabel
                htmlFor="resepAssistance"
                importance="recommended"
                className="text-sm font-medium"
              >
                Have you received assistance from a RESEP clinic?
              </FieldLabel>

              <RadioGroup
                value={resepAssistance}
                onValueChange={(value) =>
                  form.setValue("resepAssistance", value as "YES" | "NO", {
                    shouldValidate: true,
                  })
                }
              >
                <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                  <RadioGroupItem value="YES" id="resep-yes" />
                  <Label
                    htmlFor="resep-yes"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    Yes, I have received assistance from a RESEP clinic
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                  <RadioGroupItem value="NO" id="resep-no" />
                  <Label
                    htmlFor="resep-no"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    No, I have not received assistance from a RESEP clinic
                  </Label>
                </div>
              </RadioGroup>

              {/* Conditional: RESEP Clinic Name Input */}
              {resepAssistance === "YES" && (
                <div className="space-y-2 border-l-2 border-terracotta-300 pl-4">
                  <FieldLabel
                    htmlFor="resepClinicName"
                    importance="required"
                    className="text-sm font-medium"
                  >
                    Specify clinic name or location{" "}
                    <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    id="resepClinicName"
                    {...form.register("resepClinicName")}
                    placeholder="e.g., Arizona RESEP Clinic, Flagstaff"
                    className={
                      formErrors.resepClinicName ? "border-red-300" : ""
                    }
                  />
                  {formErrors.resepClinicName && (
                    <p className="text-sm text-red-600">
                      {formErrors.resepClinicName.message}
                    </p>
                  )}
                  <p className="text-xs text-sage-600">
                    Please provide the name or location of the RESEP clinic that
                    assisted you.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Disease-Specific Documentation - Collapsible */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-sage-900">
                Disease-Specific Documentation Requirements
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setIsDiseaseSpecificExpanded(!isDiseaseSpecificExpanded)
                }
                className="gap-2"
              >
                {isDiseaseSpecificExpanded ? (
                  <>
                    Hide <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {isDiseaseSpecificExpanded && (
              <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
                  <div>
                    <p className="mb-3 text-sm text-terracotta-800">
                      Different diseases may require specific types of medical
                      documentation. Examples:
                    </p>
                    <ul className="ml-2 list-inside list-disc space-y-2 text-sm text-terracotta-800">
                      <li>
                        <strong>Leukemia:</strong> Bone marrow biopsy/aspirate
                        report, peripheral white blood cell differential count
                        report
                      </li>
                      <li>
                        <strong>Multiple Myeloma:</strong> Pathology report of
                        tissue biopsy, serum electrophoresis report, X-ray
                        report
                      </li>
                      <li>
                        <strong>Solid Tumors:</strong> Pathology report of
                        tissue biopsy or surgical resection showing primary
                        cancer diagnosis
                      </li>
                    </ul>
                    <p className="mt-3 text-sm text-terracotta-800">
                      <strong>Note:</strong> Detailed requirements for each of
                      the 19 compensable diseases are provided in the Medical
                      Records Attachment (pages 18-24) of the official RECA
                      form. Please review these requirements to ensure you
                      submit the correct documentation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Medical Document Upload */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold text-sage-900">
              Upload Medical Records
            </Label>

            {/* Info card about document upload timing */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="mb-2">
                    <strong>Have medical records ready now?</strong> Upload them
                    here to attach them to your claim.
                  </p>
                  <p>
                    <strong>Don't have them yet?</strong> That's okay! You can
                    continue with the form and upload documents later from your
                    dashboard's document section.
                  </p>
                </div>
              </div>
            </div>

            <MedicalDocumentUpload
              sessionId={sessionId}
              onDocumentsChange={setUploadedDocuments}
              initialDocuments={uploadedDocuments}
            />
          </div>
        </CardContent>
      </Card>

      {/* Important Certification Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="mb-2 font-semibold text-amber-900">
                Certification Requirements
              </p>
              <div className="space-y-2 text-sm text-amber-800">
                <p>
                  <strong>Electronic Filing:</strong> Photocopies of medical
                  records are acceptable
                </p>
                <p>
                  <strong>Mail Filing:</strong> Medical records must be
                  certified copies or originals
                </p>
                <p className="mt-3">
                  <strong>Certification Methods:</strong>
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>
                    Stamped with institutional seal (raised, colored, or signed)
                    from hospital, clinic, or medical facility
                  </li>
                  <li>
                    Cover letter on official letterhead from medical facility
                    stating records are "true and accurate copies"
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Step:</strong> After completing this section, you
                will move on to Part 12 where you will disclose any previous
                payments received related to this illness, including any
                previous RECA awards or Department of Labor EEOICPA claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

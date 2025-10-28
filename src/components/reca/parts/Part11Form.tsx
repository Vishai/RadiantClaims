"use client";

import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Info, AlertCircle, Upload, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { MedicalDocumentUpload, UploadedMedicalDocument } from "../MedicalDocumentUpload";

// Validation schema
const part11Schema = z.object({
  medicalRecordsSubmitted: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you have submitted or will submit certified medical records",
  }),
  cancerRegistryAuthorization: z.boolean().optional(),
  resepAssistance: z.enum(["YES", "NO"]).optional(),
  resepClinicName: z.string().optional(),
}).refine(
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

export default function Part11Form({ initialData, onSubmit, sessionId }: Part11FormProps) {
  const form = useForm<Part11FormData>({
    resolver: zodResolver(part11Schema),
    defaultValues: {
      medicalRecordsSubmitted: initialData?.medicalRecordsSubmitted || false,
      cancerRegistryAuthorization: initialData?.cancerRegistryAuthorization || false,
      resepAssistance: initialData?.resepAssistance || undefined,
      resepClinicName: initialData?.resepClinicName || "",
    },
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedMedicalDocument[]>(
    initialData?.uploadedDocuments?.map((doc) => ({
      ...doc,
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
  const [isDiseaseSpecificExpanded, setIsDiseaseSpecificExpanded] = useState(false);

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if medical records checkbox is checked
      if (values.medicalRecordsSubmitted) {
        const submissionData: Part11ProofOfDisease = {
          ...values,
          uploadedDocuments: uploadedDocuments.filter(doc => doc.status === "success").map((doc) => ({
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
        uploadedDocuments: uploadedDocuments.filter(doc => doc.status === "success").map((doc) => ({
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Part 11: Proof of Disease
          </CardTitle>
          <CardDescription>
            Medical documentation required to establish diagnosis of compensable disease
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acceptable Documents Info */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-2">
                  Acceptable Medical Documentation
                </p>
                <p className="text-sm text-blue-800">
                  You must submit medical records that clearly show a diagnosis of one or more
                  compensable diseases. Review the accepted document types below.
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
                    className="flex items-center gap-3 rounded-md border border-sage-200 p-3 bg-white"
                  >
                    <CheckCircle2 className="h-5 w-5 text-terracotta-500 flex-shrink-0" />
                    <span className="text-sm text-sage-700">{docType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Required: Medical Records Submitted Checkbox */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Medical Records Confirmation <span className="text-red-600">*</span>
            </Label>

            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                formErrors.medicalRecordsSubmitted
                  ? "bg-red-50 border-red-300"
                  : medicalRecordsSubmitted
                  ? "bg-terracotta-50 border-terracotta-300"
                  : "bg-white border-sage-200"
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
                <label
                  htmlFor="medicalRecordsSubmitted"
                  className="text-sm font-semibold leading-none cursor-pointer uppercase"
                >
                  I have submitted certified medical records showing a diagnosis of a compensable
                  cancer
                </label>
                <p className="text-xs text-sage-600 mt-2">
                  This confirmation is required. You must provide medical documentation that proves
                  the diagnosis of at least one compensable disease selected in Part 10.
                </p>
              </div>
            </div>

            {formErrors.medicalRecordsSubmitted && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    {formErrors.medicalRecordsSubmitted.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional: Cancer Registry Authorization */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              State Cancer Registry (Optional)
            </Label>

            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                cancerRegistryAuthorization
                  ? "bg-terracotta-50 border-terracotta-300"
                  : "bg-white border-sage-200"
              }`}
            >
              <Checkbox
                id="cancerRegistryAuthorization"
                checked={cancerRegistryAuthorization}
                onCheckedChange={(checked) =>
                  form.setValue("cancerRegistryAuthorization", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="cancerRegistryAuthorization"
                  className="text-sm font-semibold leading-none cursor-pointer uppercase"
                >
                  I authorize the Department of Justice to contact a state cancer registry on my behalf
                </label>
                <p className="text-xs text-sage-600 mt-2">
                  If you check this box, you must also complete the "Authorization to Release
                  Medical Information" form. The DOJ's RECA program will attempt to obtain your medical
                  records directly from the state cancer registry. <span className="font-medium text-sage-700">RadiantClaims is not involved in this process</span> — this authorization is between you and the government.
                </p>
              </div>
            </div>

            {cancerRegistryAuthorization && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Additional Form Required
                    </p>
                    <p className="text-sm text-amber-800">
                      You will need to complete the "Authorization to Release Medical and Other
                      Information from a State Cancer Registry" form in a later step. This form authorizes the
                      <strong> Department of Justice</strong> (not RadiantClaims) to request your records from the registry on your behalf.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RESEP Assistance Section */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Radiation Exposure Screening and Education Program (RESEP)
            </Label>

            <p className="text-sm text-sage-600">
              RESEP clinics provide free medical screening and education to individuals who may
              have been exposed to radiation. If you have received assistance from a RESEP clinic,
              please let us know.
            </p>

            <div className="space-y-4">
              <Label htmlFor="resepAssistance" className="text-sm font-medium">
                Have you received assistance from a RESEP clinic?
              </Label>

              <RadioGroup
                value={resepAssistance}
                onValueChange={(value) =>
                  form.setValue("resepAssistance", value as "YES" | "NO", {
                    shouldValidate: true,
                  })
                }
              >
                <div className="flex items-center space-x-2 rounded-md border border-sage-200 p-3 bg-white">
                  <RadioGroupItem value="YES" id="resep-yes" />
                  <Label htmlFor="resep-yes" className="cursor-pointer flex-1 font-normal">
                    Yes, I have received assistance from a RESEP clinic
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border border-sage-200 p-3 bg-white">
                  <RadioGroupItem value="NO" id="resep-no" />
                  <Label htmlFor="resep-no" className="cursor-pointer flex-1 font-normal">
                    No, I have not received assistance from a RESEP clinic
                  </Label>
                </div>
              </RadioGroup>

              {/* Conditional: RESEP Clinic Name Input */}
              {resepAssistance === "YES" && (
                <div className="space-y-2 pl-4 border-l-2 border-terracotta-300">
                  <Label htmlFor="resepClinicName" className="text-sm font-medium">
                    Specify clinic name or location <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="resepClinicName"
                    {...form.register("resepClinicName")}
                    placeholder="e.g., Arizona RESEP Clinic, Flagstaff"
                    className={formErrors.resepClinicName ? "border-red-300" : ""}
                  />
                  {formErrors.resepClinicName && (
                    <p className="text-sm text-red-600">{formErrors.resepClinicName.message}</p>
                  )}
                  <p className="text-xs text-sage-600">
                    Please provide the name or location of the RESEP clinic that assisted you.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Disease-Specific Documentation - Collapsible */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-sage-900">
                Disease-Specific Documentation Requirements
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDiseaseSpecificExpanded(!isDiseaseSpecificExpanded)}
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
              <div className="rounded-lg bg-terracotta-50 border border-terracotta-200 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-terracotta-800 mb-3">
                      Different diseases may require specific types of medical documentation. Examples:
                    </p>
                    <ul className="text-sm text-terracotta-800 space-y-2 list-disc list-inside ml-2">
                      <li>
                        <strong>Leukemia:</strong> Bone marrow biopsy/aspirate report, peripheral white
                        blood cell differential count report
                      </li>
                      <li>
                        <strong>Multiple Myeloma:</strong> Pathology report of tissue biopsy, serum
                        electrophoresis report, X-ray report
                      </li>
                      <li>
                        <strong>Solid Tumors:</strong> Pathology report of tissue biopsy or surgical
                        resection showing primary cancer diagnosis
                      </li>
                    </ul>
                    <p className="text-sm text-terracotta-800 mt-3">
                      <strong>Note:</strong> Detailed requirements for each of the 19 compensable
                      diseases are provided in the Medical Records Attachment (pages 18-24) of the
                      official RECA form. Please review these requirements to ensure you submit the
                      correct documentation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Medical Document Upload */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Upload Medical Records
            </Label>
            <p className="text-sm text-sage-600">
              Upload your medical documentation showing diagnosis of a compensable disease.
              Files are automatically saved to your claim.
            </p>

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
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-2">
                Certification Requirements
              </p>
              <div className="text-sm text-amber-800 space-y-2">
                <p>
                  <strong>Electronic Filing:</strong> Photocopies of medical records are
                  acceptable
                </p>
                <p>
                  <strong>Mail Filing:</strong> Medical records must be certified copies or
                  originals
                </p>
                <p className="mt-3">
                  <strong>Certification Methods:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Stamped with institutional seal (raised, colored, or signed) from hospital,
                    clinic, or medical facility
                  </li>
                  <li>
                    Cover letter on official letterhead from medical facility stating records are
                    "true and accurate copies"
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
            <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Step:</strong> After completing this section, you will move on to Part
                12 where you will disclose any previous payments received related to this illness,
                including any previous RECA awards or Department of Labor EEOICPA claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

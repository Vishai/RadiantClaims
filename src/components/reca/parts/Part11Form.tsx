"use client";

import { useEffect } from "react";
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
import { FileText, Info, AlertCircle, Upload, CheckCircle2 } from "lucide-react";

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
}

export default function Part11Form({ initialData, onSubmit }: Part11FormProps) {
  const form = useForm<Part11FormData>({
    resolver: zodResolver(part11Schema),
    defaultValues: {
      medicalRecordsSubmitted: initialData?.medicalRecordsSubmitted || false,
      cancerRegistryAuthorization: initialData?.cancerRegistryAuthorization || false,
      resepAssistance: initialData?.resepAssistance || undefined,
      resepClinicName: initialData?.resepClinicName || "",
    },
  });

  const medicalRecordsSubmitted = form.watch("medicalRecordsSubmitted");
  const cancerRegistryAuthorization = form.watch("cancerRegistryAuthorization");
  const resepAssistance = form.watch("resepAssistance");
  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if medical records checkbox is checked
      if (values.medicalRecordsSubmitted) {
        onSubmit(values as Part11ProofOfDisease);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

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
              <div>
                <p className="font-semibold text-blue-900 mb-2">
                  Acceptable Medical Documentation
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  You must submit medical records that clearly show a diagnosis of one or more
                  compensable diseases. The following types of documentation are accepted:
                </p>
              </div>
            </div>
          </div>

          {/* Document Types Checklist */}
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
                  I want the RECA Program to contact a state cancer registry
                </label>
                <p className="text-xs text-sage-600 mt-2">
                  If you check this box, you must also complete the "Authorization to Release
                  Medical Information" form. The RECA Program will attempt to obtain your medical
                  records directly from the state cancer registry.
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
                      Information from a State Cancer Registry" form in a later step.
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

          {/* Document Upload Placeholder */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Document Upload
            </Label>

            <div className="rounded-lg border-2 border-dashed border-sage-300 p-8 text-center">
              <Upload className="h-12 w-12 text-sage-400 mx-auto mb-4" />
              <p className="text-sage-700 font-medium mb-2">
                Document Upload Coming Soon
              </p>
              <p className="text-sm text-sage-600 max-w-md mx-auto">
                You will be able to upload your medical records and supporting documentation in a
                future step. For now, please ensure you have gathered the necessary medical
                documentation listed above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records Guidance by Disease */}
      <Card className="border-terracotta-200 bg-terracotta-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-terracotta-900 mb-2">
                Disease-Specific Documentation
              </p>
              <p className="text-sm text-terracotta-800 mb-3">
                Different diseases may require specific types of medical documentation. For
                example:
              </p>
              <ul className="text-sm text-terracotta-800 space-y-2 list-disc list-inside">
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

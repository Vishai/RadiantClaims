"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MedicalInformationRelease } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Info, AlertCircle, Shield } from "lucide-react";
import { formatSSN } from "@/lib/utils";

// Validation schema
const medicalInfoReleaseSchema = z.object({
  stateOfResidence: z.string().min(1, "State of residence is required"),
  patientName: z.string().min(1, "Patient name is required"),
  patientSsn: z
    .string()
    .min(1, "Social Security number is required")
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  patientDob: z.string().min(1, "Date of birth is required"),
  patientDod: z.string().optional(),
  requestorName: z.string().optional(),
  requestorRelationship: z.string().optional(),
  signature: z.string().min(1, "Signature is required"),
  signatureDate: z.string().min(1, "Signature date is required"),
});

type MedicalInfoReleaseFormData = z.infer<typeof medicalInfoReleaseSchema>;

interface MedicalInformationReleaseFormProps {
  initialData?: Partial<MedicalInformationRelease>;
  onSubmit: (data: MedicalInformationRelease) => void;
}

export default function MedicalInformationReleaseForm({
  initialData,
  onSubmit,
}: MedicalInformationReleaseFormProps) {
  const form = useForm<MedicalInfoReleaseFormData>({
    resolver: zodResolver(medicalInfoReleaseSchema),
    defaultValues: {
      stateOfResidence: initialData?.stateOfResidence || "",
      patientName: initialData?.patientName || "",
      patientSsn: initialData?.patientSsn || "",
      patientDob: initialData?.patientDob || "",
      patientDod: initialData?.patientDod || "",
      requestorName: initialData?.requestorName || "",
      requestorRelationship: initialData?.requestorRelationship || "",
      signature: initialData?.signature || "",
      signatureDate: initialData?.signatureDate || "",
    },
  });

  const formErrors = form.formState.errors;
  const patientDod = form.watch("patientDod");

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.stateOfResidence &&
        values.patientName &&
        values.patientSsn &&
        values.patientDob &&
        values.signature &&
        values.signatureDate
      ) {
        // Validate SSN format before submitting
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        if (ssnRegex.test(values.patientSsn)) {
          onSubmit(values as MedicalInformationRelease);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Auto-format SSN
  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    form.setValue("patientSsn", formatted);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Authorization to Release Medical Information from State Cancer
            Registry
          </CardTitle>
          <CardDescription>
            Required when requesting cancer registry authorization in Part 11
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Purpose */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  Purpose of This Form
                </p>
                <p className="text-sm text-blue-800">
                  This form authorizes the Department of Justice to obtain
                  medical information from your state cancer registry to support
                  your RECA claim. This helps verify your compensable disease
                  diagnosis without requiring you to obtain medical records
                  directly.
                </p>
              </div>
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-base font-semibold text-sage-900">
              Patient Information
            </h3>

            {/* State of Residence */}
            <div className="space-y-2">
              <Label htmlFor="stateOfResidence">
                State of Residence at Time of Diagnosis{" "}
                <span className="text-red-600">*</span>
              </Label>
              <Input
                id="stateOfResidence"
                {...form.register("stateOfResidence")}
                placeholder="Enter state name"
                className={formErrors.stateOfResidence ? "border-red-300" : ""}
              />
              {formErrors.stateOfResidence && (
                <p className="text-sm text-red-600">
                  {formErrors.stateOfResidence.message}
                </p>
              )}
              <p className="text-xs text-sage-600">
                The state where you resided when the compensable disease was
                diagnosed
              </p>
            </div>

            {/* Patient Name */}
            <div className="space-y-2">
              <Label htmlFor="patientName">
                Name of Individual Whose Records Are to Be Released{" "}
                <span className="text-red-600">*</span>
              </Label>
              <Input
                id="patientName"
                {...form.register("patientName")}
                placeholder="Full legal name"
                className={formErrors.patientName ? "border-red-300" : ""}
              />
              {formErrors.patientName && (
                <p className="text-sm text-red-600">
                  {formErrors.patientName.message}
                </p>
              )}
              <p className="text-xs text-sage-600">
                This should match the claimant name from Part 2
              </p>
            </div>

            {/* Patient SSN */}
            <div className="space-y-2">
              <Label htmlFor="patientSsn">
                Social Security Number <span className="text-red-600">*</span>
              </Label>
              <Input
                id="patientSsn"
                value={form.watch("patientSsn")}
                onChange={handleSsnChange}
                placeholder="XXX-XX-XXXX"
                className={formErrors.patientSsn ? "border-red-300" : ""}
              />
              {formErrors.patientSsn && (
                <p className="text-sm text-red-600">
                  {formErrors.patientSsn.message}
                </p>
              )}
            </div>

            {/* Patient DOB */}
            <div className="space-y-2">
              <Label htmlFor="patientDob">
                Date of Birth <span className="text-red-600">*</span>
              </Label>
              <Input
                id="patientDob"
                {...form.register("patientDob")}
                type="date"
                className={formErrors.patientDob ? "border-red-300" : ""}
              />
              {formErrors.patientDob && (
                <p className="text-sm text-red-600">
                  {formErrors.patientDob.message}
                </p>
              )}
            </div>

            {/* Patient DOD (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="patientDod">Date of Death (if applicable)</Label>
              <Input
                id="patientDod"
                {...form.register("patientDod")}
                type="date"
              />
              <p className="text-xs text-sage-600">
                Leave blank if the patient is living
              </p>
            </div>
          </div>

          {/* Requestor Information (Optional - for survivors) */}
          {patientDod && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-sage-900">
                Requestor Information (If Different from Patient)
              </h3>
              <p className="text-sm text-sage-600">
                If you are filing on behalf of a deceased claimant, provide your
                information below
              </p>

              {/* Requestor Name */}
              <div className="space-y-2">
                <Label htmlFor="requestorName">
                  Name of Individual Requesting Release
                </Label>
                <Input
                  id="requestorName"
                  {...form.register("requestorName")}
                  placeholder="Your full name"
                />
              </div>

              {/* Requestor Relationship */}
              <div className="space-y-2">
                <Label htmlFor="requestorRelationship">
                  Relationship to Patient
                </Label>
                <Input
                  id="requestorRelationship"
                  {...form.register("requestorRelationship")}
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-semibold text-sage-900">
              Authorization Signature
            </h3>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm text-amber-900">
                    By signing below, you authorize the state cancer registry to
                    release medical information to the Department of Justice for
                    the purpose of processing this RECA claim.
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Input */}
            <div className="space-y-2">
              <Label htmlFor="signature">
                Signature <span className="text-red-600">*</span>
              </Label>
              <Input
                id="signature"
                {...form.register("signature")}
                placeholder="Type your full name (electronic signature)"
                className={`text-lg ${formErrors.signature ? "border-red-300" : ""}`}
              />
              {formErrors.signature && (
                <p className="text-sm text-red-600">
                  {formErrors.signature.message}
                </p>
              )}
              <p className="text-xs text-sage-600">
                For the PDF submission, you will provide a handwritten signature
                on the printed form
              </p>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="signatureDate">
                Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="signatureDate"
                {...form.register("signatureDate")}
                type="date"
                className={formErrors.signatureDate ? "border-red-300" : ""}
              />
              {formErrors.signatureDate && (
                <p className="text-sm text-red-600">
                  {formErrors.signatureDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
              <div>
                <p className="mb-2 font-semibold text-sage-900">
                  Privacy Act Notice
                </p>
                <p className="text-sm text-sage-800">
                  Information requested on this form is used solely for the
                  purpose of processing your RECA claim. This authorization is
                  limited to the release of information from state cancer
                  registries to verify compensable disease diagnoses.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

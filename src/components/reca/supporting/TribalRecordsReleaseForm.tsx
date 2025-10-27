"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TribalRecordsRelease } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Info, AlertCircle } from "lucide-react";

// Validation schema
const tribalRecordsSchema = z.object({
  tribalOffice: z.enum(
    [
      "Navajo Nation Office of Vital Records",
      "Hopi Tribe Enrollment Department",
      "San Carlos Apache Tribal Enrollment Office",
      "Other",
    ],
    { required_error: "Please select a tribal office" }
  ),
  otherTribalOffice: z.string().optional(),
  claimantName: z.string().min(1, "Claimant name is required"),
  tribalOrganizationName: z.string().min(1, "Tribal organization name is required"),
  signature: z.string().min(1, "Signature is required"),
  signatureDate: z.string().min(1, "Signature date is required"),
});

type TribalRecordsFormData = z.infer<typeof tribalRecordsSchema>;

interface TribalRecordsReleaseFormProps {
  initialData?: Partial<TribalRecordsRelease>;
  onSubmit: (data: TribalRecordsRelease) => void;
}

export default function TribalRecordsReleaseForm({
  initialData,
  onSubmit,
}: TribalRecordsReleaseFormProps) {
  const form = useForm<TribalRecordsFormData>({
    resolver: zodResolver(tribalRecordsSchema),
    defaultValues: {
      tribalOffice: initialData?.tribalOffice || undefined,
      otherTribalOffice: initialData?.otherTribalOffice || "",
      claimantName: initialData?.claimantName || "",
      tribalOrganizationName: initialData?.tribalOrganizationName || "",
      signature: initialData?.signature || "",
      signatureDate: initialData?.signatureDate || "",
    },
  });

  const formErrors = form.formState.errors;
  const tribalOffice = form.watch("tribalOffice");

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.tribalOffice &&
        values.claimantName &&
        values.tribalOrganizationName &&
        values.signature &&
        values.signatureDate
      ) {
        // If "Other" is selected, require otherTribalOffice
        if (values.tribalOffice === "Other" && !values.otherTribalOffice) {
          return; // Don't submit if "Other" is selected but no value provided
        }
        onSubmit(values as TribalRecordsRelease);
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
            Release of Tribal Vital Records
          </CardTitle>
          <CardDescription>
            Required when tribal affiliation is provided in Part 1
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Purpose */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">Purpose of This Form</p>
                <p className="text-sm text-blue-800">
                  This form authorizes your tribal organization to release vital records (such as
                  birth records, tribal enrollment records, etc.) to the Department of Justice for
                  the purpose of supporting your RECA claim. Tribal records can help establish proof
                  of presence and identity.
                </p>
              </div>
            </div>
          </div>

          {/* Tribal Office Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-sage-900">
                Tribal Office/Organization <span className="text-red-600">*</span>
              </Label>
              <p className="text-sm text-sage-600 mt-1 mb-3">
                Select the tribal office or organization that holds your vital records
              </p>
            </div>

            <RadioGroup
              value={tribalOffice}
              onValueChange={(value) =>
                form.setValue(
                  "tribalOffice",
                  value as
                    | "Navajo Nation Office of Vital Records"
                    | "Hopi Tribe Enrollment Department"
                    | "San Carlos Apache Tribal Enrollment Office"
                    | "Other"
                )
              }
            >
              <div className="space-y-3">
                {/* Navajo Nation */}
                <div className="flex items-start space-x-3 rounded-lg border border-sage-200 bg-white p-4 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-colors">
                  <RadioGroupItem
                    value="Navajo Nation Office of Vital Records"
                    id="navajo"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="navajo" className="cursor-pointer font-medium">
                      Navajo Nation Office of Vital Records
                    </Label>
                    <p className="text-xs text-sage-600 mt-1">
                      For members of the Navajo Nation
                    </p>
                  </div>
                </div>

                {/* Hopi Tribe */}
                <div className="flex items-start space-x-3 rounded-lg border border-sage-200 bg-white p-4 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-colors">
                  <RadioGroupItem
                    value="Hopi Tribe Enrollment Department"
                    id="hopi"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="hopi" className="cursor-pointer font-medium">
                      Hopi Tribe Enrollment Department
                    </Label>
                    <p className="text-xs text-sage-600 mt-1">For members of the Hopi Tribe</p>
                  </div>
                </div>

                {/* San Carlos Apache */}
                <div className="flex items-start space-x-3 rounded-lg border border-sage-200 bg-white p-4 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-colors">
                  <RadioGroupItem
                    value="San Carlos Apache Tribal Enrollment Office"
                    id="apache"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="apache" className="cursor-pointer font-medium">
                      San Carlos Apache Tribal Enrollment Office
                    </Label>
                    <p className="text-xs text-sage-600 mt-1">
                      For members of the San Carlos Apache Tribe
                    </p>
                  </div>
                </div>

                {/* Other */}
                <div className="flex items-start space-x-3 rounded-lg border border-sage-200 bg-white p-4 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-colors">
                  <RadioGroupItem value="Other" id="other" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="other" className="cursor-pointer font-medium">
                      Other Tribal Organization
                    </Label>
                    <p className="text-xs text-sage-600 mt-1">
                      Specify another tribal office or organization
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {formErrors.tribalOffice && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{formErrors.tribalOffice.message}</p>
                </div>
              </div>
            )}

            {/* Other Tribal Office (Conditional) */}
            {tribalOffice === "Other" && (
              <div className="space-y-2 pl-4 border-l-4 border-terracotta-300">
                <Label htmlFor="otherTribalOffice">
                  Specify Tribal Office/Organization <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="otherTribalOffice"
                  {...form.register("otherTribalOffice")}
                  placeholder="Enter the name of the tribal office or organization"
                  className={formErrors.otherTribalOffice ? "border-red-300" : ""}
                />
                {formErrors.otherTribalOffice && (
                  <p className="text-sm text-red-600">{formErrors.otherTribalOffice.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Claimant Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-semibold text-sage-900">Claimant Information</h3>

            {/* Claimant Name */}
            <div className="space-y-2">
              <Label htmlFor="claimantName">
                Claimant Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="claimantName"
                {...form.register("claimantName")}
                placeholder="Full legal name of claimant"
                className={formErrors.claimantName ? "border-red-300" : ""}
              />
              {formErrors.claimantName && (
                <p className="text-sm text-red-600">{formErrors.claimantName.message}</p>
              )}
              <p className="text-xs text-sage-600">
                This should match the claimant name from Part 2 (or Part 1 if self-filing)
              </p>
            </div>

            {/* Tribal Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="tribalOrganizationName">
                Name of Tribal Organization <span className="text-red-600">*</span>
              </Label>
              <Input
                id="tribalOrganizationName"
                {...form.register("tribalOrganizationName")}
                placeholder="Official name of tribe or tribal organization"
                className={formErrors.tribalOrganizationName ? "border-red-300" : ""}
              />
              {formErrors.tribalOrganizationName && (
                <p className="text-sm text-red-600">
                  {formErrors.tribalOrganizationName.message}
                </p>
              )}
              <p className="text-xs text-sage-600">
                This should match the tribal affiliation from Part 1
              </p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-semibold text-sage-900">Authorization Signature</h3>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900">
                    By signing below, you authorize the tribal organization to release your vital
                    records to the Department of Justice for the purpose of processing your RECA
                    claim. Your signature, thumbprint, or mark is acceptable.
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Input */}
            <div className="space-y-2">
              <Label htmlFor="signature">
                Signature, Thumbprint, or Mark <span className="text-red-600">*</span>
              </Label>
              <Input
                id="signature"
                {...form.register("signature")}
                placeholder="Type your full name (electronic signature)"
                className={`text-lg ${formErrors.signature ? "border-red-300" : ""}`}
              />
              {formErrors.signature && (
                <p className="text-sm text-red-600">{formErrors.signature.message}</p>
              )}
              <p className="text-xs text-sage-600">
                For the PDF submission, you may provide a handwritten signature, thumbprint, or
                mark on the printed form
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
                <p className="text-sm text-red-600">{formErrors.signatureDate.message}</p>
              )}
            </div>
          </div>

          {/* Important Information */}
          <div className="rounded-lg bg-sage-50 border border-sage-200 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sage-900 mb-2">Important Information</p>
                <ul className="text-sm text-sage-800 space-y-1 list-disc list-inside ml-2">
                  <li>
                    This authorization applies only to the release of vital records for RECA claim
                    processing
                  </li>
                  <li>
                    Your tribal organization may require additional documentation or verification
                  </li>
                  <li>
                    The Department of Justice will work directly with your tribal office to obtain
                    necessary records
                  </li>
                  <li>
                    You do not need to request or obtain these records yourself - this authorization
                    is sufficient
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

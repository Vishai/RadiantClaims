"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part14AttorneyAcknowledgment } from "@/lib/reca/types";
import { DEFAULT_ATTORNEY_FEE_TYPE } from "@/lib/reca/attorney-info";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { FileCheck, Info, AlertCircle, Shield } from "lucide-react";

// Validation schema — relaxed for non-blocking navigation
const part14Schema = z.object({
  feeType: z.enum(["initial_2_percent", "resubmission_10_percent"]).optional(),
  attorneySignature: z.string().optional(),
  attorneySignatureDate: z.string().optional(),
});

type Part14FormData = z.infer<typeof part14Schema>;

interface Part14FormProps {
  initialData?: Partial<Part14AttorneyAcknowledgment>;
  onSubmit: (data: Part14AttorneyAcknowledgment) => void;
}

export default function Part14Form({ initialData, onSubmit }: Part14FormProps) {
  const form = useForm<Part14FormData>({
    resolver: zodResolver(part14Schema),
    defaultValues: {
      // Pre-select the 2% initial claim fee (standard for RadiantClaims)
      feeType: initialData?.feeType || DEFAULT_ATTORNEY_FEE_TYPE,
      attorneySignature: initialData?.attorneySignature || "",
      attorneySignatureDate: initialData?.attorneySignatureDate || "",
    },
  });

  const feeType = form.watch("feeType");
  const attorneySignature = form.watch("attorneySignature");
  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.feeType &&
        values.attorneySignature &&
        values.attorneySignature.trim().length > 0 &&
        values.attorneySignatureDate &&
        values.attorneySignatureDate.trim().length > 0
      ) {
        onSubmit(values as Part14AttorneyAcknowledgment);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      await onSubmit(data as Part14AttorneyAcknowledgment);
    },
    [onSubmit]
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
            <FileCheck className="h-5 w-5 text-terracotta-500" />
            Part 14: Attorney Acknowledgment
          </CardTitle>
          <CardDescription>
            Attorney acknowledgment of fee limitations under RECA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Important Legal Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  Federal Law Requirement
                </p>
                <p className="mb-2 text-sm text-blue-800">
                  The Radiation Exposure Compensation Act (RECA) limits attorney
                  fees for filing claims. By signing this acknowledgment, the
                  attorney agrees to comply with these federal fee limitations.
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This section is completed by the
                  partner attorney handling your claim. RadiantClaims will
                  coordinate with the attorney to obtain the required signature.
                </p>
              </div>
            </div>
          </div>

          {/* Fee Type Selection */}
          <div className="space-y-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
            >
              Attorney Fee Type <span className="text-red-600">*</span>
            </FieldLabel>

            <p className="text-sm text-sage-600">
              Select the applicable attorney fee percentage based on the type of
              claim filing:
            </p>

            <RadioGroup
              value={feeType}
              onValueChange={(value) =>
                form.setValue(
                  "feeType",
                  value as "initial_2_percent" | "resubmission_10_percent",
                  { shouldValidate: true }
                )
              }
            >
              <div
                className={`flex items-start space-x-3 rounded-md border p-4 ${
                  feeType === "initial_2_percent"
                    ? "border-terracotta-300 bg-terracotta-50"
                    : "border-sage-200 bg-white"
                }`}
              >
                <RadioGroupItem
                  value="initial_2_percent"
                  id="fee-2-percent"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="fee-2-percent"
                    className="cursor-pointer font-semibold"
                  >
                    2% for filing of an initial claim
                  </Label>
                  <p className="mt-1 text-sm text-sage-600">
                    This is the standard fee for first-time RECA claim filings.
                    This applies to all RadiantClaims submissions.
                  </p>
                  {feeType === "initial_2_percent" && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-terracotta-700">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">
                        Selected for your claim
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`flex items-start space-x-3 rounded-md border p-4 ${
                  feeType === "resubmission_10_percent"
                    ? "border-terracotta-300 bg-terracotta-50"
                    : "border-sage-200 bg-white"
                }`}
              >
                <RadioGroupItem
                  value="resubmission_10_percent"
                  id="fee-10-percent"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="fee-10-percent"
                    className="cursor-pointer font-semibold"
                  >
                    10% for contract made before July 10, 2000 or resubmission
                    of denied claim
                  </Label>
                  <p className="mt-1 text-sm text-sage-600">
                    This applies to resubmissions of previously denied claims or
                    attorney contracts executed before July 10, 2000.
                  </p>
                  {feeType === "resubmission_10_percent" && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-terracotta-700">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">
                        Selected for your claim
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>

            {formErrors.feeType && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {formErrors.feeType.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attorney Signature Section */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
            >
              Attorney Signature <span className="text-red-600">*</span>
            </FieldLabel>

            <p className="text-sm text-sage-600">
              The partner attorney will complete this section to acknowledge the
              fee limitations under RECA.
            </p>

            <div className="space-y-4">
              {/* Signature Input */}
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneySignature" importance="required">
                  Signature of Attorney <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="attorneySignature"
                  {...form.register("attorneySignature")}
                  placeholder="Attorney's full name (typed signature)"
                  className={
                    formErrors.attorneySignature ? "border-red-300" : ""
                  }
                />
                {formErrors.attorneySignature && (
                  <p className="text-sm text-red-600">
                    {formErrors.attorneySignature.message}
                  </p>
                )}
                <p className="text-xs text-sage-600">
                  For the PDF submission, the attorney will provide a wet
                  signature. This typed signature is for our records.
                </p>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <FieldLabel
                  htmlFor="attorneySignatureDate"
                  importance="required"
                >
                  Date <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="attorneySignatureDate"
                  {...form.register("attorneySignatureDate")}
                  type="date"
                  className={
                    formErrors.attorneySignatureDate ? "border-red-300" : ""
                  }
                />
                {formErrors.attorneySignatureDate && (
                  <p className="text-sm text-red-600">
                    {formErrors.attorneySignatureDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Attorney Acknowledgment Text */}
          {attorneySignature && (
            <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
              <div className="flex gap-3">
                <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
                <div>
                  <p className="mb-2 text-sm font-semibold text-sage-900">
                    Attorney Acknowledgment
                  </p>
                  <p className="text-sm italic text-sage-700">
                    "I acknowledge that I am aware of and agree to comply with
                    the fee limitations set forth in 42 U.S.C. § 2210 note. I
                    understand that attorney fees are limited to{" "}
                    {feeType === "initial_2_percent" ? "2%" : "10%"} of any
                    award received under the Radiation Exposure Compensation
                    Act."
                  </p>
                  <p className="mt-3 text-sm text-sage-700">
                    <strong>Signed:</strong> {form.watch("attorneySignature")}
                    {form.watch("attorneySignatureDate") && (
                      <>
                        <br />
                        <strong>Date:</strong>{" "}
                        {new Date(
                          form.watch("attorneySignatureDate") || ""
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Penalties Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="mb-2 font-semibold text-red-900">
                Federal Law Penalty for Fee Violations
              </p>
              <p className="mb-2 text-sm text-red-800">
                Attorneys who charge fees in excess of the limitations set forth
                in RECA are subject to:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-red-800">
                <li>
                  <strong>Civil penalty:</strong> Fine of not more than $5,000
                </li>
                <li>
                  <strong>Criminal penalty:</strong> Fine and/or imprisonment
                  for not more than 1 year
                </li>
                <li>
                  <strong>Disbarment:</strong> From practice before the
                  Department of Justice
                </li>
              </ul>
              <p className="mt-2 text-sm text-red-800">
                Reference: 42 U.S.C. § 2210 note, Section 16
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RadiantClaims Process Note */}
      <Card className="border-terracotta-200 bg-terracotta-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
            <div>
              <p className="mb-2 font-semibold text-terracotta-900">
                How RadiantClaims Handles Attorney Signatures
              </p>
              <div className="space-y-2 text-sm text-terracotta-800">
                <p>
                  <strong>During Form Completion:</strong> The attorney
                  acknowledgment information is captured in your claim record.
                  The partner attorney will be notified to review and sign.
                </p>
                <p>
                  <strong>PDF Generation:</strong> When we generate your final
                  RECA claim packet, the partner attorney will provide a wet
                  signature on the printed Part 14 form.
                </p>
                <p>
                  <strong>Your Assurance:</strong> All RadiantClaims partner
                  attorneys are licensed, in good standing, and experienced with
                  RECA claims. They are contractually bound to the 2% fee
                  limitation.
                </p>
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
                will move on to Part 16 (Signature) where you will provide your
                own signature to authorize the claim submission. Part 15 (Legal
                Guardian) is only required if you have a court-appointed legal
                guardian.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

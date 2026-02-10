"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part12PreviousPayments } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Info, AlertCircle } from "lucide-react";

// Validation schema
const part12Schema = z
  .object({
    receivedPayment: z.enum(["YES", "NO"], {
      required_error: "Please indicate whether any payments have been received",
    }),
    paymentDetails: z.string().optional(),
    eeoicpaClaim: z.enum(["YES", "NO"], {
      required_error: "Please indicate whether an EEOICPA claim has been filed",
    }),
  })
  .refine(
    (data) => {
      // If receivedPayment is YES, paymentDetails is required
      if (data.receivedPayment === "YES") {
        return data.paymentDetails && data.paymentDetails.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "Payment details are required when previous payments were received",
      path: ["paymentDetails"],
    }
  );

type Part12FormData = z.infer<typeof part12Schema>;

interface Part12FormProps {
  initialData?: Partial<Part12PreviousPayments>;
  onSubmit: (data: Part12PreviousPayments) => void;
}

export default function Part12Form({ initialData, onSubmit }: Part12FormProps) {
  const form = useForm<Part12FormData>({
    resolver: zodResolver(part12Schema),
    defaultValues: {
      receivedPayment: initialData?.receivedPayment || undefined,
      paymentDetails: initialData?.paymentDetails || "",
      eeoicpaClaim: initialData?.eeoicpaClaim || undefined,
    },
  });

  const receivedPayment = form.watch("receivedPayment");
  const eeoicpaClaim = form.watch("eeoicpaClaim");
  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if both required fields are filled
      if (values.receivedPayment && values.eeoicpaClaim) {
        // Additional check: if receivedPayment is YES, paymentDetails must be filled
        if (
          values.receivedPayment === "NO" ||
          (values.paymentDetails && values.paymentDetails.trim().length > 0)
        ) {
          onSubmit(values as Part12PreviousPayments);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      onSubmit(data as Part12PreviousPayments);
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
            <DollarSign className="h-5 w-5 text-terracotta-500" />
            Part 12: Previous Payments of Money
          </CardTitle>
          <CardDescription>
            Disclosure of any previous payments related to this illness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Important Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  Full Disclosure Required
                </p>
                <p className="mb-2 text-sm text-blue-800">
                  You must disclose all payments received related to this
                  illness, including:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>Previous RECA awards (even for a different illness)</li>
                  <li>Settlements or awards from lawsuits</li>
                  <li>Workers' compensation payments</li>
                  <li>Any other compensation related to radiation exposure</li>
                </ul>
                <p className="mt-2 text-sm text-blue-800">
                  <strong>Note:</strong> Receiving previous payments does not
                  automatically disqualify you from receiving compensation under
                  RECA.
                </p>
              </div>
            </div>
          </div>

          {/* Question 1: Received Payment */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-sage-900">
              Have you or anyone else received payment pursuant to final award
              or settlement based on this illness?{" "}
              <span className="text-red-600">*</span>
            </Label>

            <p className="text-sm text-sage-600">
              Check YES if you or anyone else has already received a RECA award
              for this claimant, even if it was for a different illness.
            </p>

            <RadioGroup
              value={receivedPayment}
              onValueChange={(value) =>
                form.setValue("receivedPayment", value as "YES" | "NO", {
                  shouldValidate: true,
                })
              }
            >
              <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                <RadioGroupItem value="YES" id="payment-yes" />
                <Label
                  htmlFor="payment-yes"
                  className="flex-1 cursor-pointer font-normal"
                >
                  Yes, payments have been received
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                <RadioGroupItem value="NO" id="payment-no" />
                <Label
                  htmlFor="payment-no"
                  className="flex-1 cursor-pointer font-normal"
                >
                  No, no payments have been received
                </Label>
              </div>
            </RadioGroup>

            {formErrors.receivedPayment && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {formErrors.receivedPayment.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Conditional: Payment Details */}
          {receivedPayment === "YES" && (
            <div className="space-y-4 border-l-2 border-terracotta-300 pl-4">
              <Label
                htmlFor="paymentDetails"
                className="text-base font-semibold text-sage-900"
              >
                Payment Details <span className="text-red-600">*</span>
              </Label>

              <p className="text-sm text-sage-600">
                Identify the date, amount, and person/organization for EACH
                payment received, and explain the circumstances under which the
                payment was received.
              </p>

              <Textarea
                id="paymentDetails"
                {...form.register("paymentDetails")}
                placeholder="Example:&#10;&#10;1. RECA payment of $50,000 received on March 15, 2020 for leukemia diagnosis&#10;&#10;2. Workers' compensation settlement of $25,000 from ABC Mining Company on June 1, 2018 for occupational illness&#10;&#10;3. Personal injury lawsuit settlement of $100,000 from XYZ Corp on January 10, 2019"
                rows={8}
                className={`font-mono text-sm ${formErrors.paymentDetails ? "border-red-300" : ""}`}
              />

              {formErrors.paymentDetails && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-800">
                      {formErrors.paymentDetails.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      What to Include
                    </p>
                    <p className="text-sm text-amber-800">
                      For each payment, provide: (1) the exact date received,
                      (2) the amount, (3) who paid it (person or organization),
                      and (4) a brief explanation of what the payment was for.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question 2: EEOICPA Claim */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold text-sage-900">
              Have you or anyone else filed a claim under the Department of
              Labor's Energy Employees Occupational Illness Compensation Program
              Act (EEOICPA)? <span className="text-red-600">*</span>
            </Label>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-blue-900">
                    What is EEOICPA?
                  </p>
                  <p className="text-sm text-blue-800">
                    The Energy Employees Occupational Illness Compensation
                    Program Act (EEOICPA) is a separate federal program that
                    provides compensation to Department of Energy (DOE)
                    employees and contractors who developed illnesses due to
                    radiation exposure or toxic substances. This is different
                    from RECA.
                  </p>
                </div>
              </div>
            </div>

            <RadioGroup
              value={eeoicpaClaim}
              onValueChange={(value) =>
                form.setValue("eeoicpaClaim", value as "YES" | "NO", {
                  shouldValidate: true,
                })
              }
            >
              <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                <RadioGroupItem value="YES" id="eeoicpa-yes" />
                <Label
                  htmlFor="eeoicpa-yes"
                  className="flex-1 cursor-pointer font-normal"
                >
                  Yes, an EEOICPA claim has been filed
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-sage-200 bg-white p-3">
                <RadioGroupItem value="NO" id="eeoicpa-no" />
                <Label
                  htmlFor="eeoicpa-no"
                  className="flex-1 cursor-pointer font-normal"
                >
                  No, no EEOICPA claim has been filed
                </Label>
              </div>
            </RadioGroup>

            {formErrors.eeoicpaClaim && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {formErrors.eeoicpaClaim.message}
                  </p>
                </div>
              </div>
            )}

            {eeoicpaClaim === "YES" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      EEOICPA Claim Filed
                    </p>
                    <p className="text-sm text-amber-800">
                      The RECA Program will coordinate with the Department of
                      Labor regarding your EEOICPA claim. You may be eligible
                      for compensation under both programs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legal Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="mb-2 font-semibold text-red-900">
                Important Legal Notice
              </p>
              <p className="mb-2 text-sm text-red-800">
                <strong>False Claims:</strong> Providing false information or
                failing to disclose previous payments is a federal offense
                punishable by:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-red-800">
                <li>
                  Civil penalty: Forfeiture of $10,000 plus treble damages (31
                  U.S.C. § 3729)
                </li>
                <li>
                  Criminal penalty: Fine and imprisonment up to 5 years (18
                  U.S.C. §§ 287, 1001)
                </li>
              </ul>
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
                will move on to Part 13 where you will indicate whether you have
                hired an attorney to represent you in filing this claim.
                Attorney representation is optional and not required to file a
                RECA claim.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

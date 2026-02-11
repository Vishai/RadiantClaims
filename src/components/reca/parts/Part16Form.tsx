"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part16Signature } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PenTool, Info, AlertCircle, CheckCircle2, Shield } from "lucide-react";

// Validation schema — relaxed for non-blocking navigation (review page flags these as required for submission)
const part16Schema = z.object({
  signature: z.string().optional(),
  signatureDate: z.string().optional(),
  authorizationAcknowledgment: z.boolean().optional(),
});

type Part16FormData = z.infer<typeof part16Schema>;

interface Part16FormProps {
  initialData?: Partial<Part16Signature>;
  onSubmit: (data: Part16Signature) => void;
  claimantName?: {
    firstName: string;
    lastName: string;
  };
}

export default function Part16Form({
  initialData,
  onSubmit,
  claimantName,
}: Part16FormProps) {
  const form = useForm<Part16FormData>({
    resolver: zodResolver(part16Schema),
    defaultValues: {
      signature: initialData?.signature || "",
      signatureDate: initialData?.signatureDate || "",
      authorizationAcknowledgment:
        initialData?.authorizationAcknowledgment || false,
    },
  });

  const signature = form.watch("signature");
  const signatureDate = form.watch("signatureDate");
  const authorizationAcknowledgment = form.watch("authorizationAcknowledgment");
  const formErrors = form.formState.errors;

  // Check if signature matches the claimant name
  const expectedFullName = claimantName
    ? `${claimantName.firstName} ${claimantName.lastName}`.trim().toLowerCase()
    : "";
  const signatureLower = (signature || "").trim().toLowerCase();
  const isNameMismatch =
    expectedFullName &&
    signatureLower &&
    signatureLower !== expectedFullName &&
    !signatureLower.includes(claimantName?.firstName.toLowerCase() || "") &&
    !signatureLower.includes(claimantName?.lastName.toLowerCase() || "");

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.signature &&
        values.signature.trim().length > 0 &&
        values.signatureDate &&
        values.signatureDate.trim().length > 0 &&
        values.authorizationAcknowledgment === true
      ) {
        onSubmit(values as Part16Signature);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      onSubmit(data as Part16Signature);
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
            <PenTool className="h-5 w-5 text-terracotta-500" />
            Part 16: Signature
          </CardTitle>
          <CardDescription>
            Required signature with penalty of perjury declaration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Important Legal Declaration */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  Legal Declaration Under Penalty of Perjury
                </p>
                <p className="mb-2 text-sm text-blue-800">
                  By signing this form, you certify under penalty of perjury
                  that:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>
                    All information provided in this claim is true and correct
                  </li>
                  <li>
                    You understand the penalties for making false statements
                  </li>
                  <li>
                    You authorize DOJ to verify information and share with
                    relevant agencies
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Penalty of Perjury Statement */}
          <div className="rounded-lg border-2 border-sage-300 bg-sage-50 p-6">
            <p className="text-sm leading-relaxed text-sage-900">
              <strong>I declare under penalty of perjury that:</strong>
            </p>
            <ul className="ml-4 mt-3 list-inside list-disc space-y-2 text-sm text-sage-900">
              <li>
                I have read the foregoing claim and know the contents thereof,
                and the contents are true to my knowledge, except as to those
                matters stated to be alleged on information and belief, and as
                to those matters I believe them to be true.
              </li>
              <li>
                I am aware that if any of the foregoing statements are willfully
                false, I am subject to punishment under the penalty of perjury.
              </li>
              <li>
                I authorize the Department of Justice to verify any and all
                information contained in this claim.
              </li>
            </ul>
          </div>

          {/* Authorization Checkbox */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
            >
              Authorization <span className="text-red-600">*</span>
            </FieldLabel>

            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                formErrors.authorizationAcknowledgment
                  ? "border-red-300 bg-red-50"
                  : authorizationAcknowledgment
                    ? "border-terracotta-300 bg-terracotta-50"
                    : "border-sage-200 bg-white"
              }`}
            >
              <Checkbox
                id="authorizationAcknowledgment"
                checked={authorizationAcknowledgment}
                onCheckedChange={(checked) =>
                  form.setValue(
                    "authorizationAcknowledgment",
                    checked as boolean,
                    {
                      shouldValidate: true,
                    }
                  )
                }
                className="mt-1"
              />
              <div className="flex-1">
                <FieldLabel
                  htmlFor="authorizationAcknowledgment"
                  importance="required"
                  className="cursor-pointer text-sm font-medium leading-snug"
                >
                  I authorize the Department of Justice to share information
                  from this claim with the Department of Labor and authorize any
                  physician, hospital, or other person or agency to furnish
                  information to the Department of Justice for the purpose of
                  determining my RECA claim.
                </FieldLabel>
                {authorizationAcknowledgment && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-terracotta-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">
                      Authorization acknowledged
                    </span>
                  </div>
                )}
              </div>
            </div>

            {formErrors.authorizationAcknowledgment && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {formErrors.authorizationAcknowledgment.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <div className="space-y-4 border-t pt-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
            >
              Your Signature <span className="text-red-600">*</span>
            </FieldLabel>

            {/* Important signature matching notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="mb-2 font-semibold text-amber-900">
                    Signature Must Match Your Legal Name
                  </p>
                  <p className="mb-2 text-sm text-amber-800">
                    Your signature must match the name provided in Part 1 of
                    this form{" "}
                    {claimantName && (
                      <strong>
                        ({claimantName.firstName} {claimantName.lastName})
                      </strong>
                    )}
                    . Mismatched signatures can cause significant delays or
                    rejection of your claim by the Department of Justice.
                  </p>
                  <p className="text-sm text-amber-800">
                    If you need to use a different name (such as a legal
                    guardian), you must complete Part 15 first.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Signature Input */}
              <div className="space-y-2">
                <FieldLabel htmlFor="signature" importance="required">
                  Signature <span className="text-red-600">*</span>
                </FieldLabel>
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
                  For the PDF submission to DOJ, you will provide a wet
                  (handwritten) signature on the printed form. This typed
                  signature is for our records.
                </p>
              </div>

              {/* Name Mismatch Warning */}
              {isNameMismatch && claimantName && (
                <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="mb-2 font-semibold text-red-900">
                        ⚠️ Signature Does Not Match Your Name
                      </p>
                      <p className="mb-2 text-sm text-red-800">
                        The signature you entered <strong>"{signature}"</strong>{" "}
                        does not match your name from Part 1:{" "}
                        <strong>
                          {claimantName.firstName} {claimantName.lastName}
                        </strong>
                      </p>
                      <p className="mb-3 text-sm text-red-800">
                        <strong>
                          This will likely cause problems with your claim:
                        </strong>
                      </p>
                      <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-red-800">
                        <li>
                          The DOJ may reject your claim due to signature
                          mismatch
                        </li>
                        <li>
                          Your claim processing will be significantly delayed
                        </li>
                        <li>
                          You may be required to resubmit with corrected
                          information
                        </li>
                      </ul>
                      <p className="mt-3 text-sm font-semibold text-red-900">
                        Please correct your signature to match:{" "}
                        {claimantName.firstName} {claimantName.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-2">
                <FieldLabel htmlFor="signatureDate" importance="required">
                  Date <span className="text-red-600">*</span>
                </FieldLabel>
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
          </div>

          {/* Signature Preview */}
          {signature && signatureDate && authorizationAcknowledgment && (
            <div className="rounded-lg border-2 border-terracotta-300 bg-terracotta-50 p-6">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-terracotta-600" />
                <div className="flex-1">
                  <p className="mb-3 font-semibold text-terracotta-900">
                    ✓ Signature Complete
                  </p>
                  <div className="space-y-2 text-sm text-terracotta-800">
                    <p>
                      <strong>Signed by:</strong>{" "}
                      <span className="font-serif text-lg italic">
                        {signature}
                      </span>
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(signatureDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="border-t border-terracotta-200 pt-2 text-xs">
                      By signing, you affirm that all information provided in
                      this RECA claim is true and correct to the best of your
                      knowledge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Penalties Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex gap-3">
            <Shield className="h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="text-base font-semibold text-red-900">
                Penalties for False Statements
              </h3>
              <p className="mt-1 text-sm text-red-800">
                Federal law imposes severe penalties for knowingly making false
                statements
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg border border-red-300 bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-red-900">
                Civil Penalty (31 U.S.C. § 3729)
              </p>
              <p className="text-sm text-red-800">
                Forfeiture of $10,000 plus treble damages (three times the
                amount of damages sustained by the government)
              </p>
            </div>

            <div className="rounded-lg border border-red-300 bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-red-900">
                Criminal Penalty (18 U.S.C. §§ 287, 1001)
              </p>
              <p className="text-sm text-red-800">
                Fine and imprisonment for not more than 5 years
              </p>
            </div>

            <p className="pt-2 text-xs italic text-red-700">
              The Department of Justice vigorously prosecutes fraud in federal
              benefit programs. Ensure all information provided is accurate and
              truthful.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardHeader>
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-sage-600" />
            <div>
              <h3 className="text-base font-semibold text-sage-900">
                What Happens After You Sign
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                1
              </div>
              <div>
                <p className="font-medium text-sage-900">Form Review</p>
                <p className="text-sm text-sage-700">
                  RadiantClaims will review your completed form for completeness
                  and accuracy
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                2
              </div>
              <div>
                <p className="font-medium text-sage-900">Attorney Review</p>
                <p className="text-sm text-sage-700">
                  Our partner attorney will review and sign Part 14 (Attorney
                  Acknowledgment)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                3
              </div>
              <div>
                <p className="font-medium text-sage-900">PDF Generation</p>
                <p className="text-sm text-sage-700">
                  We will generate your complete RECA claim packet with all
                  required supporting documents
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                4
              </div>
              <div>
                <p className="font-medium text-sage-900">
                  Wet Signature Required
                </p>
                <p className="text-sm text-sage-700">
                  You will receive the PDF to print, sign by hand (wet
                  signature), and mail to the Department of Justice
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-600 font-semibold text-white">
                5
              </div>
              <div>
                <p className="font-medium text-terracotta-900">
                  Claim Submitted
                </p>
                <p className="text-sm text-terracotta-700">
                  Your complete RECA claim will be mailed to DOJ and the review
                  process will begin
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Notice */}
      {signature && signatureDate && authorizationAcknowledgment && (
        <Card className="border-2 border-terracotta-400 bg-gradient-to-br from-terracotta-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-terracotta-600" />
              <div>
                <p className="mb-2 text-lg font-bold text-terracotta-900">
                  🎉 RECA Claim Form Complete!
                </p>
                <p className="mb-3 text-sm text-terracotta-800">
                  You have successfully completed all required sections of the
                  RECA Downwinder Claim Form. Your information has been saved
                  and will be reviewed by our team.
                </p>
                <p className="text-sm font-medium text-terracotta-800">
                  Next steps: We will contact you within 2-3 business days with
                  your completed claim packet and filing instructions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

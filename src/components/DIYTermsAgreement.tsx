"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, FileText } from "lucide-react";

interface DIYTermsAgreementProps {
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
  paymentPlan?: "full" | "installment";
}

export function DIYTermsAgreement({
  onAccept,
  onDecline,
  isLoading = false,
  paymentPlan = "full",
}: DIYTermsAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [acknowledgeRefund, setAcknowledgeRefund] = useState(false);

  const canAccept = hasRead && hasAgreed && acknowledgeRefund;

  const selectedPlanLabel =
    paymentPlan === "installment"
      ? "Installment Plan ($249.99 × 2 payments)"
      : "Pay in Full ($499.00 one-time)";

  // Calculate pricing based on plan (for potential future use)
  // const pricing = paymentPlan === "installment"
  //   ? { total: "$499.98", payment: "$249.99 × 2 payments" }
  //   : { total: "$499.99", payment: "$499.99 one-time" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
          <FileText className="h-8 w-8 text-sage-600" />
        </div>
        <h2 className="text-2xl font-bold text-sage-900">
          DIY Document Preparation - Terms of Service
        </h2>
        <p className="mt-2 text-sage-600">
          Please review and accept the terms below to proceed
        </p>
      </div>

      {/* Important Notice */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Important Notice</p>
            <p className="mt-1">
              This is a binding legal agreement for document preparation
              services. Please read carefully before accepting.
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Text */}
      <div className="rounded-3xl border-2 border-cream-200 bg-white">
        <div className="border-b border-cream-200 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-sage-600" />
            <h3 className="font-semibold text-sage-900">
              Service Agreement & Terms of Service
            </h3>
          </div>
        </div>

        <ScrollArea className="h-96 p-6">
          <div className="space-y-4 text-sm text-sage-700">
            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                1. SERVICES PROVIDED
              </h4>
              <p>
                RadiantClaims ("Company", "we", "us") provides document
                preparation services for Radiation Exposure Compensation Act
                (RECA) claims. By accepting this agreement, you ("Client",
                "you") engage our services for:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Step-by-step guidance through RECA form completion</li>
                <li>Document organization and checklist management</li>
                <li>
                  State-specific resource finder for obtaining required
                  documents
                </li>
                <li>PDF generation of completed RECA claim form</li>
                <li>Progress tracking and secure data storage</li>
                <li>Access to customer portal for document management</li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                2. PRICING & PAYMENT TERMS
              </h4>
              <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
                <p className="font-semibold text-sage-900">Payment Options:</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-sage-600">
                  Selected: {selectedPlanLabel}
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-2 text-sage-900">
                  <li>
                    <strong>Pay in Full:</strong> $499.00 one-time payment (no
                    recurring charges)
                  </li>
                  <li>
                    <strong>2-Payment Installment Plan:</strong> $249.99 × 2
                    payments
                    <ul className="list-circle ml-6 mt-1 text-sm text-sage-700">
                      <li>First payment: $249.99 at signup</li>
                      <li>Second payment: $249.99 after 30 days</li>
                      <li>
                        Total: $499.98 (automatically stops after 2 payments)
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <p className="mt-3">
                <strong>Payment Authorization:</strong> By accepting this
                agreement, you authorize RadiantClaims to charge your payment
                method according to your selected payment plan:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>
                  <strong>Full Payment:</strong> $499.00 charged immediately
                  (one-time)
                </li>
                <li>
                  <strong>Installment Plan:</strong> $249.99 charged
                  immediately, then $249.99 after 30 days (subscription
                  automatically cancels after 2 payments)
                </li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                3. WHAT IS NOT PROVIDED
              </h4>
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900">
                  ⚠️ Important Limitations
                </p>
                <p className="mt-2 text-red-900">
                  RadiantClaims is <strong>NOT a law firm</strong> and does{" "}
                  <strong>NOT</strong> provide:
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-1 text-red-900">
                  <li>Legal advice or legal representation</li>
                  <li>Attorney review of your documents</li>
                  <li>Submission of your claim to the Department of Justice</li>
                  <li>Communication with DOJ on your behalf</li>
                  <li>Appeal representation if your claim is denied</li>
                  <li>Guarantees or promises regarding claim approval</li>
                </ul>
                <p className="mt-2 text-red-900">
                  <strong>You are responsible for:</strong> Gathering documents,
                  uploading them to our portal, downloading the completed form,
                  printing, signing, and mailing it to DOJ yourself.
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                4. REFUND POLICY
              </h4>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">
                  7-Day Money-Back Guarantee
                </p>
                <p className="mt-2 text-blue-900">
                  You may request a full refund of your payment if BOTH
                  conditions are met:
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-1 text-blue-900">
                  <li>You request the refund within 7 days of your payment</li>
                  <li>
                    You have <strong>NOT</strong> downloaded your completed RECA
                    form PDF
                  </li>
                </ul>

                <p className="mt-3 font-semibold text-blue-900">
                  ⚠️ Non-Refundable After PDF Download
                </p>
                <p className="mt-1 text-blue-900">
                  Once you download your completed RECA form PDF, your payment
                  becomes <strong>non-refundable</strong>. This is because you
                  have received the primary deliverable of our service.
                </p>

                {paymentPlan === "installment" ? (
                  <>
                    <div className="mt-3 border-t border-blue-300 pt-3">
                      <p className="font-semibold text-blue-900">
                        Installment Plan Details:
                      </p>
                      <p className="mt-1 text-blue-900">
                        <strong>Within 7 days (no PDF download):</strong> Full
                        refund of your 1st payment ($249.99). The 2nd payment
                        will be waived (not charged).
                      </p>
                      <p className="mt-2 text-blue-900">
                        <strong>After downloading PDF:</strong> Both installment
                        payments ($249.99 × 2 = $499.98 total) become
                        non-refundable. The 2nd installment will be charged on
                        schedule (30 days from initial payment).
                      </p>
                      <p className="mt-2 text-blue-900">
                        <strong>After 7 days (no PDF download):</strong> Your
                        1st payment ($249.99) is non-refundable, but the 2nd
                        payment will be waived if you cancel. Your account data
                        will be retained for 60 days.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-blue-900">
                    <strong>After 7 days:</strong> If you have not downloaded
                    your PDF, your payment ($499.00) remains non-refundable.
                    Your account data will be retained for 60 days if you choose
                    to cancel.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                5. CANCELLATION POLICY
              </h4>

              {paymentPlan === "installment" ? (
                <>
                  <div className="mb-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-900">
                      ⚠️ Installment Plan Commitment
                    </p>
                    <p className="mt-2 text-red-900">
                      By selecting the 2-payment installment plan, you
                      understand that downloading your completed RECA form PDF
                      locks in your payment commitment.
                    </p>
                  </div>

                  <p className="mt-3 font-semibold">
                    Before Downloading Your RECA Form PDF:
                  </p>
                  <ul className="ml-6 mt-2 list-disc space-y-1">
                    <li>
                      <strong>Within 7 days of initial payment:</strong> You may
                      cancel for a full refund of your 1st payment ($249.99).
                      The 2nd payment will be waived (not charged).
                    </li>
                    <li>
                      <strong>After 7 days (but before PDF download):</strong>{" "}
                      You may still cancel, but your 1st payment ($249.99) is
                      non-refundable. The 2nd payment will be waived. Your
                      account data will be retained for 60 days, then deleted.
                    </li>
                  </ul>

                  <p className="mt-3 font-semibold">
                    After Downloading Your RECA Form PDF:
                  </p>
                  <ul className="ml-6 mt-2 list-disc space-y-1">
                    <li>
                      <strong>You cannot cancel.</strong> By downloading the
                      PDF, you have received the primary deliverable of our
                      service.
                    </li>
                    <li>
                      Both installment payments ($249.99 × 2 = $499.98 total)
                      are locked in and non-refundable.
                    </li>
                    <li>
                      The 2nd payment will be automatically charged 30 days from
                      your initial payment date.
                    </li>
                    <li>
                      You retain access to the platform and may re-download your
                      PDFs.
                    </li>
                    <li>
                      Your account data is retained indefinitely while your
                      account remains active.
                    </li>
                  </ul>

                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="font-semibold text-blue-900">
                      Card Payment Failures
                    </p>
                    <p className="mt-1 text-blue-900">
                      If your 2nd installment payment fails (card declined,
                      expired, etc.), we will retry the charge automatically.
                      You remain responsible for the outstanding balance
                      according to the payment schedule you agreed to.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    You may cancel your account at any time. Upon cancellation:
                  </p>
                  <ul className="ml-6 mt-2 list-disc space-y-1">
                    <li>
                      <strong>Within 7 days (before PDF download):</strong> Full
                      refund of $499.00 available
                    </li>
                    <li>
                      <strong>After 7 days or after PDF download:</strong>{" "}
                      Payment is non-refundable
                    </li>
                    <li>
                      You retain access to the platform and may re-download your
                      completed forms
                    </li>
                    <li>
                      Your account data is retained while your account remains
                      active
                    </li>
                    <li>
                      If you cancel after 7 days without downloading your PDF,
                      your account data will be retained for 60 days before
                      permanent deletion
                    </li>
                  </ul>
                </>
              )}
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                6. NO GUARANTEE OF CLAIM APPROVAL
              </h4>
              <p>
                <strong>We make NO guarantees</strong> regarding:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Whether your RECA claim will be approved</li>
                <li>The amount of compensation you may receive</li>
                <li>How long DOJ will take to process your claim</li>
                <li>Whether your documents will be deemed sufficient by DOJ</li>
              </ul>
              <p className="mt-2">
                The Department of Justice makes all final decisions. Our service
                helps you prepare and organize documents, but does not influence
                DOJ's decision-making process.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                7. YOUR RESPONSIBILITIES
              </h4>
              <p>By using our service, you agree to:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Provide accurate and truthful information</li>
                <li>Gather and upload all required documents</li>
                <li>
                  Review all generated forms for accuracy before downloading
                </li>
                <li>
                  Print, sign, and mail your claim to DOJ according to
                  instructions
                </li>
                <li>Track your claim status directly with DOJ</li>
                <li>Comply with all DOJ rules and RECA program requirements</li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                8. DATA SECURITY & PRIVACY
              </h4>
              <p>We take data security seriously. Your information is:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Encrypted in transit and at rest</li>
                <li>Stored on secure servers with regular backups</li>
                <li>
                  Never sold or shared with third parties (except as required by
                  law)
                </li>
                <li>Protected by industry-standard security measures</li>
              </ul>
              <p className="mt-2">
                See our Privacy Policy for complete details on data handling.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                9. LIMITATION OF LIABILITY
              </h4>
              <p>
                RadiantClaims' total liability to you is limited to the amount
                you have paid for our services. We are not liable for:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>DOJ denial of your claim</li>
                <li>Delays in DOJ processing</li>
                <li>Errors in information you provided</li>
                <li>Loss of potential compensation</li>
                <li>Indirect, consequential, or punitive damages</li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                10. DISPUTE RESOLUTION
              </h4>
              <p>
                Any disputes arising from this agreement will be resolved
                through binding arbitration in accordance with the rules of the
                American Arbitration Association. You waive the right to
                participate in class action lawsuits.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                11. CHANGES TO TERMS
              </h4>
              <p>
                We may update these terms at any time. You will be notified of
                material changes via email. Continued use of our service after
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="rounded-lg border border-sage-200 bg-sage-50 p-4">
              <h4 className="mb-2 font-semibold text-sage-900">
                12. EFFECTIVE DATE & ACCEPTANCE
              </h4>
              <p>
                This agreement becomes effective when you click "I Accept and
                Agree" below. By accepting, you confirm:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>You have read and understand all terms</li>
                <li>You agree to the pricing and payment terms</li>
                <li>You understand the refund policy</li>
                <li>You understand we do not provide legal services</li>
                <li>You are 18 years or older</li>
              </ul>
            </section>

            <div className="mt-6 border-t border-cream-200 pt-4 text-xs text-sage-500">
              <p>
                <strong>Questions?</strong> Contact us at
                support@radiantclaims.com
              </p>
              <p className="mt-2">
                <strong>Version:</strong> 1.0 | <strong>Last Updated:</strong>{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Acknowledgment Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border-2 border-cream-200 bg-cream-50 p-4">
          <Checkbox
            id="hasRead"
            checked={hasRead}
            onCheckedChange={(checked) => setHasRead(checked === true)}
            className="mt-1"
          />
          <label
            htmlFor="hasRead"
            className="cursor-pointer text-sm text-sage-700"
          >
            <span className="font-semibold">I have read this agreement</span> –
            I confirm that I have read and understood all sections of this Terms
            of Service agreement.
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-xl border-2 border-cream-200 bg-cream-50 p-4">
          <Checkbox
            id="hasAgreed"
            checked={hasAgreed}
            onCheckedChange={(checked) => setHasAgreed(checked === true)}
            className="mt-1"
          />
          <label
            htmlFor="hasAgreed"
            className="cursor-pointer text-sm text-sage-700"
          >
            <span className="font-semibold">
              I agree to the payment terms ({selectedPlanLabel})
            </span>{" "}
            – I authorize RadiantClaims to charge my payment method according to
            my selected payment plan.
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <Checkbox
            id="acknowledgeRefund"
            checked={acknowledgeRefund}
            onCheckedChange={(checked) =>
              setAcknowledgeRefund(checked === true)
            }
            className="mt-1"
          />
          <label
            htmlFor="acknowledgeRefund"
            className="cursor-pointer text-sm text-blue-900"
          >
            <span className="font-semibold">
              I understand the refund policy
            </span>{" "}
            – I understand that my payment is refundable within 7 days ONLY if I
            have not downloaded my completed RECA form PDF. Once downloaded, the
            payment is non-refundable.
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onDecline}
          disabled={isLoading}
          className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
        >
          Decline
        </Button>
        <Button
          onClick={onAccept}
          disabled={!canAccept || isLoading}
          className="flex-1 rounded-full bg-sage-500 hover:bg-sage-600 disabled:bg-gray-300"
        >
          {isLoading ? "Processing..." : "I Accept and Agree"}
        </Button>
      </div>

      {!canAccept && (
        <p className="text-center text-xs text-sage-500">
          Please check all boxes above to continue
        </p>
      )}
    </div>
  );
}

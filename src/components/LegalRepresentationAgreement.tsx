"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, FileText, Scale } from "lucide-react";

interface LegalRepresentationAgreementProps {
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function LegalRepresentationAgreement({
  onAccept,
  onDecline,
  isLoading = false,
  errorMessage = null,
}: LegalRepresentationAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [acknowledgeTermination, setAcknowledgeTermination] = useState(false);

  const canAccept = hasRead && hasAgreed && acknowledgeTermination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Scale className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-sage-900">
          Legal Representation Agreement
        </h2>
        <p className="mt-2 text-sage-600">
          Please review and accept the terms below to proceed with full legal
          representation
        </p>
        <div className="mx-auto mt-3 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-semibold text-blue-900">
            Plain Language Summary
          </p>
          <p className="mt-1 text-sm text-blue-900">
            This agreement explains how Heritage Law represents you in your RECA
            claim and that you pay nothing unless you receive an award.
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Important Notice</p>
            <p className="mt-1">
              This is a binding legal agreement. Please read carefully before
              accepting.
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
              Contingency Fee Agreement & Legal Services Contract
            </h3>
          </div>
        </div>

        <ScrollArea className="h-96 p-6">
          <div className="space-y-4 text-sm text-sage-700">
            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                1. SCOPE OF REPRESENTATION
              </h4>
              <p>
                By accepting this agreement, you ("Client") retain Heritage Law
                and its affiliated attorneys ("Attorney") to provide full legal
                representation for your Radiation Exposure Compensation Act
                (RECA) claim. This includes:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Review and preparation of all claim documentation</li>
                <li>Professional submission to the Department of Justice</li>
                <li>Communication with DOJ on your behalf</li>
                <li>Appeal representation if your claim is initially denied</li>
                <li>
                  All legal advice and services related to your RECA claim
                </li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                2. ATTORNEY FEE STRUCTURE
              </h4>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">
                  RECA-Compliant Fee Structure
                </p>
                <p className="mt-2 text-emerald-900">
                  <strong>No Upfront Cost:</strong> You will NOT pay any fees
                  unless your RECA claim is approved by the Department of
                  Justice and you receive compensation.
                </p>
                <p className="mt-2 text-emerald-900">
                  <strong>Attorney Fee Upon Approval:</strong> Under 28 CFR §
                  79.82, attorney fees are limited to{" "}
                  <span className="font-semibold">
                    2% of the RECA compensation award
                  </span>
                  . The standard RECA award is{" "}
                  <span className="font-semibold">$100,000</span>.
                </p>
                <p className="mt-2 text-xs text-emerald-800">
                  All fees charged under this agreement will comply with all
                  limitations contained in 28 CFR § 79.82 and any successor
                  regulation.
                </p>
                <p className="mt-2 text-emerald-900">
                  <strong>Your Net Compensation:</strong>
                </p>
                <ul className="ml-6 mt-1 list-disc text-emerald-900">
                  <li>RECA Award: $100,000</li>
                  <li>Attorney Fee (2%): $2,000</li>
                  <li className="font-semibold">You Receive: $98,000</li>
                </ul>
              </div>
              <p className="mt-3">
                <strong>Important:</strong> This fee is paid directly by the
                Department of Justice and deducted from your award. You never
                write a check to the attorney.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                3. BINDING NATURE OF FEE AGREEMENT
              </h4>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">
                  ⚠️ IMPORTANT: Read This Section Carefully
                </p>
                <p className="mt-2 text-emerald-900">
                  This contingency fee agreement becomes binding once you begin
                  working with Attorney on your RECA claim. The fee obligation
                  applies to the work Attorney performs on your behalf,
                  including:
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-1 text-emerald-900">
                  <li>
                    <strong>If your claim is approved</strong> – even if you
                    terminate representation before approval
                  </li>
                  <li>
                    <strong>If you switch attorneys</strong> – Attorney is
                    entitled to compensation for work already performed
                  </li>
                  <li>
                    <strong>If you withdraw your claim</strong> – no fee is owed
                    (claim must be approved for fee to apply)
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                4. YOUR RIGHT TO TERMINATE REPRESENTATION
              </h4>
              <p>
                <strong>You Always Have the Right to Terminate:</strong> You may
                terminate this attorney-client relationship at any time, for any
                reason. However:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>
                  If representation ends before claim determination, Attorney
                  may seek reasonable compensation for work performed,
                  consistent with the Rules of Professional Conduct and subject
                  to fee-arbitration review.
                </li>
                <li>
                  Any disputes over fees will be resolved according to your
                  state's Rules of Professional Conduct and may be subject to
                  mandatory fee arbitration.
                </li>
              </ul>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                5. WHAT HAPPENS IF YOU CANCEL
              </h4>
              <div className="space-y-2">
                <p>
                  <strong>Before Claim Submission:</strong> If you cancel
                  representation before Attorney submits your claim to DOJ, you
                  may owe compensation only for documented work already
                  performed, at Attorney's reasonable hourly rate.
                </p>
                <p>
                  <strong>After Claim Submission:</strong> If you cancel after
                  Attorney has submitted your claim to DOJ, and your claim is
                  later approved, Attorney remains entitled to the agreed-upon
                  contingency fee percentage for the work performed.
                </p>
                <p>
                  <strong>Claim Denied or Withdrawn:</strong> If your claim is
                  denied or you withdraw it, no fee is owed regardless of when
                  you cancel.
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                6. NO GUARANTEE OF OUTCOME
              </h4>
              <p>
                Attorney makes no guarantee or promise regarding the outcome of
                your RECA claim. The Department of Justice makes all final
                decisions regarding claim approval. Attorney will use reasonable
                efforts and professional skill to pursue your claim.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                7. COSTS AND EXPENSES
              </h4>
              <p>
                Attorney will advance all reasonable costs and expenses related
                to your claim (e.g., obtaining medical records, certified
                documents, postage). If your claim is approved, these costs may
                be deducted from your award in addition to the attorney fee. If
                your claim is denied, you will NOT be responsible for
                reimbursing these costs.
              </p>
              <p className="mt-2 text-sm text-sage-600">
                <strong>Note:</strong> All costs are subject to RECA
                reimbursement limits; any non-recoverable costs will be
                disclosed to you in advance.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                8. DISPUTE RESOLUTION
              </h4>
              <p>
                Any disputes regarding fees or services will be resolved through
                mediation or fee arbitration in accordance with state bar rules.
                You retain all rights to file complaints with the state bar
                association.
              </p>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-sage-900">
                9. ACKNOWLEDGMENT OF UNDERSTANDING
              </h4>
              <p>By accepting this agreement, you acknowledge that:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>You have read and understand all terms</li>
                <li>
                  You have had the opportunity to ask questions and seek
                  independent legal advice
                </li>
                <li>You understand the fee structure and when fees apply</li>
                <li>
                  You understand your right to terminate representation at any
                  time
                </li>
                <li>
                  You understand that fees may still apply even after
                  termination if the claim is approved
                </li>
              </ul>
            </section>

            <section className="rounded-lg border border-sage-200 bg-sage-50 p-4">
              <h4 className="mb-2 font-semibold text-sage-900">
                10. EFFECTIVE DATE
              </h4>
              <p>
                This agreement becomes effective when you click "I Accept and
                Agree" below. A copy of this agreement will be provided to you
                via email for your records.
              </p>
            </section>

            <div className="mt-6 border-t border-cream-200 pt-4 text-xs text-sage-500">
              <p>
                <strong>Legal Notice:</strong> This agreement is subject to the
                Rules of Professional Conduct in your state. If any provision is
                found to be unenforceable, the remaining provisions remain in
                full effect. This agreement supersedes any prior oral or written
                agreements regarding representation for this RECA claim.
              </p>
              <p className="mt-2">
                <strong>Version:</strong> 1.0 | <strong>Last Updated:</strong>{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="text-sm text-red-900">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

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
            I confirm that I have read and understood all sections of this Legal
            Representation Agreement.
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
              I agree to the attorney fee structure
            </span>{" "}
            – I understand that if my RECA claim is approved for $100,000,
            Attorney will receive a fee of $2,000 (2% as mandated by federal
            RECA regulations), and this fee obligation applies even if I
            terminate representation before approval.
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <Checkbox
            id="acknowledgeTermination"
            checked={acknowledgeTermination}
            onCheckedChange={(checked) =>
              setAcknowledgeTermination(checked === true)
            }
            className="mt-1"
          />
          <label
            htmlFor="acknowledgeTermination"
            className="cursor-pointer text-sm text-emerald-900"
          >
            <span className="font-semibold">
              I understand my right to terminate
            </span>{" "}
            – I understand that I can terminate this representation at any time,
            but Attorney may still be entitled to fees for work performed if my
            claim is later approved.
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
          className="flex-1 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300"
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

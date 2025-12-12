"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import confetti from "canvas-confetti";
import { RECAWorkflowState } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Download,
  FileText,
  Printer,
  Mail,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface PageProps {
  params: { sessionId: string };
}

export default function RECAReviewPage({ params }: PageProps) {
  const router = useRouter();
  const { status } = useSession();
  const [workflowState, setWorkflowState] = useState<RECAWorkflowState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{
    isInstallmentPlan: boolean;
    hasDownloadedPDF: boolean;
  } | null>(null);
  const [showInstallmentWarning, setShowInstallmentWarning] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  const loadWorkflowState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reca/workflow/${params.sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Workflow session not found");
        }
        throw new Error("Failed to load workflow state");
      }

      const data: RECAWorkflowState = await response.json();
      setWorkflowState(data);
    } catch (err) {
      console.error("Error loading workflow:", err);
      setError(err instanceof Error ? err.message : "Failed to load workflow");
    } finally {
      setIsLoading(false);
    }
  }, [params.sessionId]);

  const loadPaymentInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/subscriptions/status");
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo({
          isInstallmentPlan: data.isInstallmentPlan || false,
          hasDownloadedPDF: data.hasDownloadedPDF || false,
        });
      }
    } catch (err) {
      console.error("Error loading payment info:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/reca/review/${params.sessionId}`);
      return;
    }

    if (status === "authenticated") {
      loadWorkflowState();
      loadPaymentInfo();
    }
  }, [status, params.sessionId, router, loadWorkflowState, loadPaymentInfo]);

  // Trigger confetti when page loads successfully
  useEffect(() => {
    if (!isLoading && workflowState) {
      // Delay confetti slightly so page renders first
      const timer = setTimeout(() => {
        // Fire confetti from both sides
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ["#D97757", "#6B8E6F", "#E8DCC4"]; // terracotta, sage, cream

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, workflowState]);

  const handleDownloadPDF = async () => {
    // Check if user is on installment plan and hasn't downloaded PDF yet
    if (paymentInfo?.isInstallmentPlan && !paymentInfo?.hasDownloadedPDF) {
      setShowInstallmentWarning(true);
      return;
    }

    // Proceed with download
    await performDownload();
  };

  const performDownload = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/reca/pdf/${params.sessionId}`);

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => ({}));
        console.error("PDF generation failed:", errorData);

        if (response.status === 403) {
          throw new Error(
            errorData.error ||
              "Payment is required to download the PDF. " +
                `Debug: tier=${errorData.debug?.tier}, status=${errorData.debug?.status}, paid=${errorData.debug?.hasPaid}`
          );
        }
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RECA-Downwinder-Form-${params.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark PDF as downloaded
      if (paymentInfo?.isInstallmentPlan) {
        await fetch("/api/subscriptions/mark-pdf-downloaded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: params.sessionId }),
        });
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate PDF. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmInstallmentDownload = async () => {
    setShowInstallmentWarning(false);
    setHasAcknowledgedWarning(false);
    await performDownload();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your claim...</p>
        </div>
      </div>
    );
  }

  if (error || !workflowState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-sage-900">Error</h2>
          <p className="mb-6 text-sage-700">{error || "Unknown error"}</p>
          <button
            onClick={() => router.push("/portal")}
            className="rounded-full bg-terracotta-500 px-6 py-3 text-white hover:bg-terracotta-600"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            Form Completed
          </h1>
          <p className="text-sage-600">
            Your RECA form information is complete and will now be reviewed by
            RadiantClaims
          </p>
        </div>

        {/* Completion Card */}
        <Card className="mb-6 border-2 border-terracotta-400 bg-gradient-to-br from-terracotta-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-12 w-12 flex-shrink-0 text-terracotta-600" />
              <div>
                <h2 className="mb-2 text-2xl font-bold text-terracotta-900">
                  🎉 Form Data Complete!
                </h2>
                <p className="mb-2 text-terracotta-800">
                  Congratulations! You've successfully completed all required
                  sections of the RECA form. Your information has been saved and
                  will now be reviewed by RadiantClaims and our law firm
                  partners.
                </p>
                <p className="mb-3 text-terracotta-800">
                  <strong>Next Steps:</strong> We'll compile your complete claim
                  packet and send it to you for final signatures. You'll then
                  mail the signed packet to the Department of Justice.
                </p>
                <p className="text-sm text-terracotta-700">
                  Form completion: {workflowState.completionPercentage}% •
                  Expected packet preparation time: 3-5 business days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Clarification */}
        <Card className="mb-6 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-8 w-8 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-blue-900">
                  Your Claim Has NOT Yet Been Submitted to the DOJ
                </h3>
                <p className="mb-2 text-sm text-blue-800">
                  This page confirms that you've completed the RadiantClaims
                  form. However, your claim will not be officially submitted to
                  the Department of Justice until:
                </p>
                <ol className="ml-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
                  <li>RadiantClaims reviews and prepares your claim packet</li>
                  <li>
                    You receive the packet and add any required original
                    signatures/documents
                  </li>
                  <li>
                    You mail the completed packet to the DOJ address provided
                  </li>
                </ol>
                <p className="mt-3 text-sm font-semibold text-blue-900">
                  Your official claim submission date will be when the DOJ
                  receives your mailed packet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Download className="h-5 w-5 text-terracotta-500" />
              Download Official RECA Form (Pre-Filled)
            </CardTitle>
            <CardDescription>
              Download the official DOJ form with your information pre-filled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-2 font-semibold text-blue-900">
                    What You'll Get:
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                    <li>Official RECA Downwinder Claim Form (DOJ version)</li>
                    <li>
                      All your information pre-filled in the correct fields
                    </li>
                    <li>
                      Ready for review, wet signature, and mailing to the DOJ
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Note:</strong> This is a preview of your form.
                    RadiantClaims will prepare your final packet with
                    instructions and supporting documents.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="h-14 w-full rounded-full bg-terracotta-500 text-lg hover:bg-terracotta-600"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download Pre-Filled RECA Form
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Printer className="h-5 w-5 text-terracotta-500" />
              What Happens Next
            </CardTitle>
            <CardDescription>
              RadiantClaims will handle your claim preparation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    Document Review & Validation
                  </p>
                  <p className="text-sm text-sage-700">
                    RadiantClaims and our law firm partners will carefully
                    review all uploaded documents and information to ensure
                    accuracy, completeness, and validity of your claim.
                  </p>
                  <p className="mt-1 text-sm italic text-sage-600">
                    Timeline: 3-5 business days
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    Claim Packet Compilation
                  </p>
                  <p className="mb-2 text-sm text-sage-700">
                    RadiantClaims will compile an authenticated packet that
                    includes:
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-sage-700">
                    <li>Your completed and authenticated claim form</li>
                    <li>Step-by-step instruction set for final submission</li>
                    <li>
                      Pre-paid envelope pre-addressed to the Department of
                      Justice
                    </li>
                    <li>
                      Instructions for replacing copies with original/certified
                      documents
                    </li>
                    <li>Selected uploaded documents ready for printing</li>
                    <li>Signature guidance and instructions</li>
                  </ul>
                  <p className="mt-1 text-sm italic text-sage-600">
                    Timeline: 2-3 business days after validation
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 font-semibold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-sage-900">
                    You'll Receive Your Packet
                  </p>
                  <p className="text-sm text-sage-700">
                    We'll notify you when your packet is ready. You'll receive
                    detailed instructions on how to finalize any required
                    original documents and signatures.
                  </p>
                  <p className="mt-1 text-sm italic text-sage-600">
                    Notification via email and portal
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-600 font-semibold text-white">
                  4
                </div>
                <div>
                  <p className="font-medium text-terracotta-900">
                    You Submit Your Claim to the DOJ
                  </p>
                  <p className="mb-2 text-sm text-terracotta-700">
                    Once you've completed the simple final steps (adding
                    original documents and wet signatures), you'll mail the
                    packet using the pre-paid envelope to:
                  </p>
                  <div className="rounded border border-sage-200 bg-sage-50 p-3 text-sm text-sage-900">
                    <p>Radiation Exposure Compensation Program</p>
                    <p>U.S. Department of Justice</p>
                    <p>P.O. Box 146</p>
                    <p>Ben Franklin Station</p>
                    <p>Washington, DC 20044-0146</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-terracotta-900">
                    ⚠️ Your claim is officially submitted when the DOJ receives
                    this mailed packet. We recommend using certified mail for
                    tracking purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1 font-semibold text-blue-900">Important</p>
                  <p className="text-sm text-blue-800">
                    You do NOT need to download, print, or fill out the official
                    form yourself. RadiantClaims handles all the technical
                    preparation work. You'll only need to complete simple final
                    steps when you receive your packet.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-sage-200 bg-gradient-to-br from-sage-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Mail className="h-5 w-5 text-terracotta-500" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sage-900">
                  RECA Program Hotline
                </p>
                <p className="text-sage-700">1-800-729-7327</p>
              </div>
              <div>
                <p className="font-medium text-sage-900">Website</p>
                <a
                  href="https://www.justice.gov/civil/reca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta-600 underline hover:text-terracotta-700"
                >
                  www.justice.gov/civil/reca
                </a>
              </div>
              <div>
                <p className="font-medium text-sage-900">
                  RadiantClaims Support
                </p>
                <p className="text-sage-700">
                  If you have questions about this form or need assistance,
                  please contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/reca/supporting/${params.sessionId}`)}
            className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
          >
            Back to Supporting Forms
          </Button>
          <Button
            onClick={() => router.push("/portal")}
            className="rounded-full bg-sage-600 hover:bg-sage-700"
          >
            Return to Portal
          </Button>
        </div>
      </div>

      {/* Installment Plan Warning Dialog */}
      <Dialog
        open={showInstallmentWarning}
        onOpenChange={setShowInstallmentWarning}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-red-900">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Payment Commitment - Please Read Carefully
            </DialogTitle>
            <DialogDescription className="sr-only">
              Installment plan commitment warning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Critical Warning */}
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="mb-2 text-lg font-bold text-red-900">
                ⚠️ By downloading this PDF, you are committing to pay BOTH
                installment payments
              </p>
              <p className="text-red-800">
                You selected the 2-payment installment plan ($249.99 × 2 =
                $499.98 total). Downloading your completed RECA form means you
                have received your deliverable and triggers your payment
                commitment.
              </p>
            </div>

            {/* What This Means */}
            <div>
              <h3 className="mb-2 font-semibold text-sage-900">
                What This Means:
              </h3>
              <ul className="space-y-2 text-sm text-sage-800">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>Both payments become due:</strong> Your 1st payment
                    of $249.99 has been charged. Your 2nd payment of $249.99
                    will be automatically charged 30 days from your initial
                    payment date.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>You cannot cancel:</strong> After downloading the
                    PDF, you cannot cancel your installment plan or request a
                    refund. Both payments are locked in.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>Payment will be charged automatically:</strong> Your
                    2nd installment will be charged to your payment method on
                    file. Ensure your card remains valid.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-red-600">•</span>
                  <span>
                    <strong>You retain platform access:</strong> You will
                    continue to have access to your RadiantClaims portal and
                    documents.
                  </span>
                </li>
              </ul>
            </div>

            {/* Alternative Options */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                Not Ready to Commit Yet?
              </h3>
              <p className="mb-2 text-sm text-blue-800">
                If you're still within the 7-day refund window and want to
                cancel instead:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                <li>Click "Cancel" below and go to your account settings</li>
                <li>
                  Request cancellation within 7 days of your initial payment
                </li>
                <li>
                  You'll receive a full refund of your 1st payment ($249.99)
                </li>
                <li>The 2nd payment will be waived (not charged)</li>
              </ul>
              <p className="mt-2 text-sm font-semibold text-blue-900">
                After 7 days: You can still cancel, but your 1st payment
                ($249.99) is non-refundable. The 2nd payment will be waived.
                Your data will be retained for 60 days.
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <Checkbox
                id="installment-acknowledge"
                checked={hasAcknowledgedWarning}
                onCheckedChange={(checked) =>
                  setHasAcknowledgedWarning(checked === true)
                }
                className="mt-1"
              />
              <label
                htmlFor="installment-acknowledge"
                className="cursor-pointer text-sm text-red-900"
              >
                <span className="font-bold">
                  I understand and agree that by downloading this PDF, I am
                  committing to pay both installment payments ($499.98 total)
                  and waiving my right to cancel or receive any refunds.
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInstallmentWarning(false);
                setHasAcknowledgedWarning(false);
              }}
              className="rounded-full"
            >
              Cancel - Don't Download Yet
            </Button>
            <Button
              onClick={handleConfirmInstallmentDownload}
              disabled={!hasAcknowledgedWarning || isGenerating}
              className="rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                "I Agree - Download PDF"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

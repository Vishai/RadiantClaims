"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RECAWorkflowState } from "@/lib/reca/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, FileText, Printer, Mail, AlertCircle } from "lucide-react";

interface PageProps {
  params: { sessionId: string };
}

export default function RECAReviewPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workflowState, setWorkflowState] = useState<RECAWorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/reca/review/${params.sessionId}`);
      return;
    }

    if (status === "authenticated") {
      loadWorkflowState();
    }
  }, [status, params.sessionId]);

  const loadWorkflowState = async () => {
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
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/reca/pdf/${params.sessionId}`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RECA-Data-Summary-${params.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
          <h2 className="text-2xl font-bold text-sage-900 mb-4">Error</h2>
          <p className="text-sage-700 mb-6">{error || "Unknown error"}</p>
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
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-sage-900 mb-2">Review & Download</h1>
          <p className="text-sage-600">
            Your RECA Downwinder Claim form is complete and ready for submission
          </p>
        </div>

        {/* Completion Card */}
        <Card className="border-2 border-terracotta-400 bg-gradient-to-br from-terracotta-50 to-white mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-12 w-12 text-terracotta-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-terracotta-900 mb-2">
                  🎉 Form Complete!
                </h2>
                <p className="text-terracotta-800 mb-2">
                  Congratulations! You've successfully completed all required sections of the RECA
                  Downwinder Claim Form. Your information has been saved and is ready for review.
                </p>
                <p className="text-sm text-terracotta-700">
                  Completion: {workflowState.completionPercentage}%
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
              Download Your Documents
            </CardTitle>
            <CardDescription>
              Generate and download your completed claim documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">What You'll Receive:</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside ml-2">
                    <li>Your completed form data in an easy-to-read summary format</li>
                    <li>Step-by-step instructions for completing the official form</li>
                    <li>Mailing address and submission guidelines</li>
                    <li>Document checklist based on your relationship type</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="w-full h-14 text-lg rounded-full bg-terracotta-500 hover:bg-terracotta-600"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download Data Summary PDF
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Printer className="h-5 w-5 text-terracotta-500" />
              Next Steps
            </CardTitle>
            <CardDescription>After downloading your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sage-900">Review Your Data Summary</p>
                  <p className="text-sm text-sage-700">
                    Carefully review all information in the PDF for accuracy and completeness
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sage-900">Print the Official Form</p>
                  <p className="text-sm text-sage-700">
                    Download and print the official RECA Downwinder Claim Form from the DOJ website
                  </p>
                  <a
                    href="https://www.justice.gov/civil/reca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-terracotta-600 hover:text-terracotta-700 underline"
                  >
                    Visit www.justice.gov/civil/reca
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sage-900">Fill Out the Official Form</p>
                  <p className="text-sm text-sage-700">
                    Use your data summary to carefully transfer information to the official form
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-sage-900">Sign with Wet Signature</p>
                  <p className="text-sm text-sage-700">
                    Sign the official form by hand - electronic signatures are not accepted
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white font-semibold">
                  5
                </div>
                <div>
                  <p className="font-medium text-sage-900">Gather Required Documents</p>
                  <p className="text-sm text-sage-700">
                    Collect birth certificates, medical records, and proof of presence documents
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-white font-semibold">
                  6
                </div>
                <div>
                  <p className="font-medium text-terracotta-900">Mail to DOJ</p>
                  <p className="text-sm text-terracotta-700 mb-2">
                    Send your completed form and supporting documents to:
                  </p>
                  <div className="text-sm text-sage-900 bg-sage-50 p-3 rounded border border-sage-200">
                    <p>Radiation Exposure Compensation Program</p>
                    <p>U.S. Department of Justice</p>
                    <p>P.O. Box 146</p>
                    <p>Ben Franklin Station</p>
                    <p>Washington, DC 20044-0146</p>
                  </div>
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
                <p className="font-medium text-sage-900">RECA Program Hotline</p>
                <p className="text-sage-700">1-800-729-7327</p>
              </div>
              <div>
                <p className="font-medium text-sage-900">Website</p>
                <a
                  href="https://www.justice.gov/civil/reca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta-600 hover:text-terracotta-700 underline"
                >
                  www.justice.gov/civil/reca
                </a>
              </div>
              <div>
                <p className="font-medium text-sage-900">RadiantClaims Support</p>
                <p className="text-sage-700">
                  If you have questions about this form or need assistance, please contact our
                  support team.
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
    </div>
  );
}

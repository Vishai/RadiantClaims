"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import confetti from "canvas-confetti";
import { RECAWorkflowState, RECAWorkflowSection } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Download,
  FileText,
  Printer,
  Mail,
  AlertCircle,
  Edit3,
  ChevronRight,
  Clock,
  ArrowLeft,
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

// ============================================================================
// Section metadata for completion analysis
// ============================================================================

interface SectionInfo {
  id: RECAWorkflowSection;
  name: string;
  shortName: string;
  required: boolean;
  conditional?: (formData: any) => boolean; // returns true if section is applicable
}

const SECTION_DEFINITIONS: SectionInfo[] = [
  {
    id: "part_1",
    name: "Part 1: Your Information (Filer)",
    shortName: "Filer Info",
    required: true,
  },
  {
    id: "part_2",
    name: "Part 2: Claimant Information",
    shortName: "Claimant Info",
    required: false,
    conditional: (fd) =>
      fd?.part_3?.relationship && fd.part_3.relationship !== "Self",
  },
  {
    id: "part_3",
    name: "Part 3: Relationship to Claimant",
    shortName: "Relationship",
    required: true,
  },
  {
    id: "part_4",
    name: "Part 4: Self-Filer Details",
    shortName: "Self-Filer",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Self",
  },
  {
    id: "part_5",
    name: "Part 5: Surviving Spouse",
    shortName: "Spouse",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Spouse",
  },
  {
    id: "part_6",
    name: "Part 6: Surviving Child",
    shortName: "Child",
    required: false,
    conditional: (fd) => fd?.part_3?.relationship === "Child",
  },
  {
    id: "part_7",
    name: "Part 7: Parent/Grandchild/Grandparent",
    shortName: "Other Relative",
    required: false,
    conditional: (fd) =>
      fd?.part_3?.relationship === "Parent" ||
      fd?.part_3?.relationship === "Grandchild" ||
      fd?.part_3?.relationship === "Grandparent",
  },
  {
    id: "part_8",
    name: "Part 8: Exposure Information",
    shortName: "Exposure",
    required: true,
  },
  {
    id: "part_9",
    name: "Part 9: Proof of Presence",
    shortName: "Proof of Presence",
    required: true,
  },
  {
    id: "part_10",
    name: "Part 10: Compensable Diseases",
    shortName: "Diseases",
    required: true,
  },
  {
    id: "part_11",
    name: "Part 11: Proof of Disease",
    shortName: "Proof of Disease",
    required: true,
  },
  {
    id: "part_12",
    name: "Part 12: Previous Payments",
    shortName: "Prior Payments",
    required: true,
  },
  {
    id: "part_13",
    name: "Part 13: Attorney Representation",
    shortName: "Attorney",
    required: true,
  },
  {
    id: "part_14",
    name: "Part 14: Attorney Acknowledgment",
    shortName: "Attorney Ack.",
    required: false,
    conditional: (fd) =>
      fd?.part_13?.hasAttorney === true || fd?.part_13?.hasAttorney === "YES",
  },
  {
    id: "part_15",
    name: "Part 15: Legal Guardian",
    shortName: "Legal Guardian",
    required: false,
    conditional: (fd) => fd?.part_15 && Object.keys(fd.part_15).length > 0,
  },
  {
    id: "part_16",
    name: "Part 16: Signature & Certification",
    shortName: "Signature",
    required: true,
  },
];

// ============================================================================
// Completion analysis types
// ============================================================================

interface SectionStatus {
  id: RECAWorkflowSection;
  name: string;
  shortName: string;
  status: "complete" | "partial" | "empty" | "not_applicable";
  filledFields: number;
  totalFields: number;
}

interface CompletionAnalysis {
  sections: SectionStatus[];
  completeSections: SectionStatus[];
  incompleteSections: SectionStatus[];
  emptySections: SectionStatus[];
  overallPercentage: number;
  isFormComplete: boolean;
}

// ============================================================================
// Helpers to analyze form data
// ============================================================================

function countFieldsInObject(obj: any): { filled: number; total: number } {
  if (!obj || typeof obj !== "object") return { filled: 0, total: 0 };

  let filled = 0;
  let total = 0;

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal metadata
    if (key === "documentsIdentified" || key === "__meta") continue;

    if (Array.isArray(value)) {
      total++;
      if (value.length > 0) filled++;
    } else if (typeof value === "object" && value !== null) {
      // Recurse into nested objects
      const nested = countFieldsInObject(value);
      filled += nested.filled;
      total += nested.total;
    } else {
      total++;
      if (value !== undefined && value !== null && value !== "") {
        filled++;
      }
    }
  }

  return { filled, total };
}

function analyzeFormCompletion(
  workflowState: RECAWorkflowState
): CompletionAnalysis {
  const formData = workflowState.formData;
  const sections: SectionStatus[] = [];

  for (const def of SECTION_DEFINITIONS) {
    // Check if section is applicable
    if (def.conditional) {
      const isApplicable = def.conditional(formData);
      if (!isApplicable) {
        sections.push({
          id: def.id,
          name: def.name,
          shortName: def.shortName,
          status: "not_applicable",
          filledFields: 0,
          totalFields: 0,
        });
        continue;
      }
    }

    const sectionKey = def.id as keyof typeof formData;
    const sectionData = formData?.[sectionKey];

    if (
      !sectionData ||
      (typeof sectionData === "object" && Object.keys(sectionData).length === 0)
    ) {
      sections.push({
        id: def.id,
        name: def.name,
        shortName: def.shortName,
        status: "empty",
        filledFields: 0,
        totalFields: 1, // At minimum there should be fields
      });
      continue;
    }

    const { filled, total } = countFieldsInObject(sectionData);

    let status: SectionStatus["status"];
    if (total === 0) {
      status = "empty";
    } else if (filled >= total) {
      status = "complete";
    } else if (filled > 0) {
      status = "partial";
    } else {
      status = "empty";
    }

    sections.push({
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      status,
      filledFields: filled,
      totalFields: total,
    });
  }

  const applicableSections = sections.filter(
    (s) => s.status !== "not_applicable"
  );
  const completeSections = applicableSections.filter(
    (s) => s.status === "complete"
  );
  const incompleteSections = applicableSections.filter(
    (s) => s.status === "partial"
  );
  const emptySections = applicableSections.filter((s) => s.status === "empty");

  const overallPercentage =
    applicableSections.length > 0
      ? Math.round(
          ((completeSections.length + incompleteSections.length * 0.5) /
            applicableSections.length) *
            100
        )
      : 0;

  // Use workflowState.completionPercentage if it's available and seems more accurate
  const reportedPercentage = workflowState.completionPercentage || 0;
  const finalPercentage = Math.max(overallPercentage, reportedPercentage);

  const isFormComplete =
    emptySections.length === 0 && incompleteSections.length === 0;

  return {
    sections,
    completeSections,
    incompleteSections,
    emptySections,
    overallPercentage: finalPercentage,
    isFormComplete,
  };
}

// ============================================================================
// Page Component
// ============================================================================

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

  // Completion analysis
  const completion = useMemo<CompletionAnalysis | null>(() => {
    if (!workflowState) return null;
    return analyzeFormCompletion(workflowState);
  }, [workflowState]);

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

  // Trigger confetti only when form is substantially complete
  useEffect(() => {
    if (!isLoading && workflowState && completion?.isFormComplete) {
      const timer = setTimeout(() => {
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
  }, [isLoading, workflowState, completion?.isFormComplete]);

  const handleDownloadPDF = async () => {
    if (paymentInfo?.isInstallmentPlan && !paymentInfo?.hasDownloadedPDF) {
      setShowInstallmentWarning(true);
      return;
    }
    await performDownload();
  };

  const performDownload = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/reca/pdf/${params.sessionId}`);

      if (!response.ok) {
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RECA-Downwinder-Form-${params.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

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

  const navigateToSection = (sectionId: string) => {
    router.push(`/reca/form/${params.sessionId}?section=${sectionId}`);
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

  if (error || !workflowState || !completion) {
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

  const isComplete = completion.isFormComplete;
  const needsAttentionCount =
    completion.incompleteSections.length + completion.emptySections.length;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* ================================================================ */}
        {/* Header — adapts to completion state */}
        {/* ================================================================ */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            {isComplete ? "Form Completed" : "Application Review"}
          </h1>
          <p className="text-sage-600">
            {isComplete
              ? "Your RECA form information is complete and will now be reviewed by RadiantClaims"
              : "Review your progress and complete any remaining sections"}
          </p>
        </div>

        {/* ================================================================ */}
        {/* Completion Status Card */}
        {/* ================================================================ */}
        {isComplete ? (
          /* ——— COMPLETE STATE ——— */
          <Card className="mb-6 border-2 border-terracotta-400 bg-gradient-to-br from-terracotta-50 to-white">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <CheckCircle2 className="h-12 w-12 flex-shrink-0 text-terracotta-600" />
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-terracotta-900">
                    🎉 Form Data Complete!
                  </h2>
                  <p className="mb-2 text-terracotta-800">
                    Congratulations! You&apos;ve successfully completed all
                    required sections of the RECA form. Your information has
                    been saved and will now be reviewed by RadiantClaims and our
                    law firm partners.
                  </p>
                  <p className="mb-3 text-terracotta-800">
                    <strong>Next Steps:</strong> We&apos;ll compile your
                    complete claim packet and send it to you for final
                    signatures. You&apos;ll then mail the signed packet to the
                    Department of Justice.
                  </p>
                  <p className="text-sm text-terracotta-700">
                    Form completion: {completion.overallPercentage}% • Expected
                    packet preparation time: 3-5 business days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ——— IN-PROGRESS STATE ——— */
          <Card className="mb-6 border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Clock className="h-10 w-10 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <h2 className="mb-1 text-2xl font-bold text-amber-900">
                      Application In Progress
                    </h2>
                    <p className="text-amber-800">
                      You&apos;ve made great progress! {needsAttentionCount}{" "}
                      {needsAttentionCount === 1
                        ? "section needs"
                        : "sections need"}{" "}
                      attention before your form is ready for review.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-900">
                      Overall Progress
                    </span>
                    <span className="font-bold text-amber-900">
                      {completion.overallPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={completion.overallPercentage}
                    className="h-3"
                  />
                  <div className="mt-1 flex justify-between text-xs text-amber-700">
                    <span>
                      {completion.completeSections.length} of{" "}
                      {completion.completeSections.length +
                        completion.incompleteSections.length +
                        completion.emptySections.length}{" "}
                      sections complete
                    </span>
                    <span>Ready for submission</span>
                  </div>
                </div>

                {/* Edit Application button — prominent */}
                <Button
                  onClick={() => navigateToSection("part_1")}
                  className="h-12 w-full rounded-full bg-terracotta-500 text-base hover:bg-terracotta-600"
                >
                  <Edit3 className="mr-2 h-5 w-5" />
                  Continue Editing Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================ */}
        {/* Section-by-Section Breakdown (always shown) */}
        {/* ================================================================ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <FileText className="h-5 w-5 text-terracotta-500" />
              Section Status
            </CardTitle>
            <CardDescription>
              {isComplete
                ? "All sections are complete. You can still edit any section if needed."
                : "Review each section's status and complete any remaining items."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Complete Sections */}
              {completion.completeSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete ({completion.completeSections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.completeSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            {section.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-green-700 hover:text-green-900"
                          onClick={() => navigateToSection(section.id)}
                        >
                          Edit
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partially Complete Sections */}
              {completion.incompleteSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Partially Complete ({completion.incompleteSections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.incompleteSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <div>
                            <span className="text-sm font-medium text-amber-900">
                              {section.name}
                            </span>
                            <span className="ml-2 text-xs text-amber-700">
                              ({section.filledFields} of {section.totalFields}{" "}
                              fields)
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 rounded-full bg-amber-600 text-xs hover:bg-amber-700"
                          onClick={() => navigateToSection(section.id)}
                        >
                          Complete
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty / Not Started Sections */}
              {completion.emptySections.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    Not Started ({completion.emptySections.length})
                  </h3>
                  <div className="space-y-1">
                    {completion.emptySections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-red-400" />
                          <span className="text-sm font-medium text-red-900">
                            {section.name}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 rounded-full bg-red-600 text-xs hover:bg-red-700"
                          onClick={() => navigateToSection(section.id)}
                        >
                          Start
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Applicable Sections */}
              {completion.sections.filter((s) => s.status === "not_applicable")
                .length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-sage-500">
                    Not Applicable to Your Claim
                  </h3>
                  <div className="space-y-1">
                    {completion.sections
                      .filter((s) => s.status === "not_applicable")
                      .map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sage-400"
                        >
                          <span className="text-xs">—</span>
                          <span className="text-xs">{section.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Important Clarification (always shown) */}
        {/* ================================================================ */}
        <Card className="mb-6 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-8 w-8 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-blue-900">
                  Your Claim Has NOT Yet Been Submitted to the DOJ
                </h3>
                <p className="mb-2 text-sm text-blue-800">
                  This page confirms your progress on the RadiantClaims form.
                  However, your claim will not be officially submitted to the
                  Department of Justice until:
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

        {/* ================================================================ */}
        {/* Download Section */}
        {/* ================================================================ */}
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
                    What You&apos;ll Get:
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
                  {!isComplete && (
                    <p className="mt-2 text-sm font-medium text-amber-700">
                      ⚠️ Some sections are incomplete. The PDF will be generated
                      with the information you&apos;ve provided so far.
                    </p>
                  )}
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

        {/* ================================================================ */}
        {/* What Happens Next */}
        {/* ================================================================ */}
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
                    Document Review &amp; Validation
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
                    You&apos;ll Receive Your Packet
                  </p>
                  <p className="text-sm text-sage-700">
                    We&apos;ll notify you when your packet is ready. You&apos;ll
                    receive detailed instructions on how to finalize any
                    required original documents and signatures.
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
                    Once you&apos;ve completed the simple final steps (adding
                    original documents and wet signatures), you&apos;ll mail the
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
                    preparation work. You&apos;ll only need to complete simple
                    final steps when you receive your packet.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Contact Information */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* Navigation */}
        {/* ================================================================ */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/reca/supporting/${params.sessionId}`)
              }
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Supporting Forms
            </Button>
            {!isComplete && (
              <Button
                variant="outline"
                onClick={() => navigateToSection("part_1")}
                className="rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Application
              </Button>
            )}
          </div>
          <Button
            onClick={() => router.push("/portal")}
            className="rounded-full bg-sage-600 hover:bg-sage-700"
          >
            Return to Portal
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Installment Plan Warning Dialog */}
      {/* ================================================================ */}
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
                If you&apos;re still within the 7-day refund window and want to
                cancel instead:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                <li>
                  Click &quot;Cancel&quot; below and go to your account settings
                </li>
                <li>
                  Request cancellation within 7 days of your initial payment
                </li>
                <li>
                  You&apos;ll receive a full refund of your 1st payment
                  ($249.99)
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
              Cancel - Don&apos;t Download Yet
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

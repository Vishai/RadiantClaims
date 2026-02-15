"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState, useCallback } from "react";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  BookOpen,
  Menu,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { PacketDeliveryCard } from "@/components/portal/PacketDeliveryCard";
import { DOJMetricsDashboard } from "@/components/doj/DOJMetricsDashboard";
import { NewClaimDialog } from "@/components/claims/NewClaimDialog";
import { InviteCollaboratorDialog } from "@/components/portal/InviteCollaboratorDialog";
import { ManageCollaboratorsDialog } from "@/components/portal/ManageCollaboratorsDialog";
import { generateDocumentRequirements } from "@/lib/reca/document-tracking";
import { RelationshipType } from "@/lib/reca/types";

interface Claimant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  state: string;
  county: string;
  createdAt: string;
  claimType?: string;
  intakeSession: {
    id: string;
    resumeToken: string;
    currentStep: string;
    status: string;
    updatedAt: string;
    uploadedFiles: Array<{
      id: string;
      category?: string | null;
      status: string;
      originalFilename: string;
      sizeBytes: number;
      uploadedAt: string;
    }>;
    packetSubmission: PacketSubmissionMeta | null;
    recaWorkflowStage?: number | null;
    recaWorkflowSection?: string | null;
    recaCompletionPercent?: number | null;
    recaFormData?: any;
  } | null;
}

type PacketStatus =
  | "NOT_READY"
  | "PROCESSING"
  | "READY_FOR_DOJ"
  | "OUTDATED"
  | "UNKNOWN";

interface PacketSubmissionMeta {
  status?: string | null;
  warnings?: unknown;
  generatedAt?: string | null;
  readyAt?: string | null;
  generations?: Array<{
    version: number;
    generatedAt: string;
    status: string;
    generatedBy?: string | null;
  }>;
}

const mapPacketStatus = (status?: string | null): PacketStatus => {
  switch (status) {
    case "READY_FOR_DOJ":
    case "READY":
      return "READY_FOR_DOJ";
    case "PROCESSING":
    case "BUILDING":
      return "PROCESSING";
    case "NOT_READY":
    case "PENDING":
      return "NOT_READY";
    case "OUTDATED":
    case "STALE":
      return "OUTDATED";
    default:
      return "UNKNOWN";
  }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getPartLabel(section: string): string {
  const partNum = section.replace("part_", "");
  const labels: Record<string, string> = {
    "1": "Filer Info",
    "2": "Deceased Info",
    "3": "Relationship",
    "4": "Self-Filer",
    "5": "Surviving Spouse",
    "6": "Surviving Child",
    "7": "Other Relatives",
    "8": "Exposure Info",
    "9": "Proof of Presence",
    "10": "Diseases",
    "11": "Proof of Disease",
    "12": "Previous Payments",
    "13": "Attorney",
    "14": "Attorney Ack.",
    "15": "Legal Guardian",
    "16": "Signature",
  };
  return labels[partNum] || section.replace(/_/g, " ");
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "Self",
  "Spouse",
  "Child",
  "Parent",
  "Grandchild",
  "Grandparent",
];
const VERIFIED_FILE_STATUSES = new Set(["VALIDATED", "APPROVED"]);

function buildNextSteps(
  intakeSession: Claimant["intakeSession"],
  shouldPreferReview: boolean
) {
  if (!intakeSession || !shouldPreferReview) return null;

  const formData = intakeSession.recaFormData ?? {};
  const relationshipCandidate = formData?.part_3?.relationship;
  const relationship = RELATIONSHIP_TYPES.includes(relationshipCandidate)
    ? relationshipCandidate
    : null;

  const requirements = relationship
    ? generateDocumentRequirements(
        relationship,
        formData.part_1,
        formData.part_4
      ).filter((req) => req.required)
    : [];

  const uploadedDocs = intakeSession.uploadedFiles.length;
  const verifiedDocs = intakeSession.uploadedFiles.filter((file) =>
    VERIFIED_FILE_STATUSES.has(file.status)
  ).length;
  const estimatedRequiredDocs = requirements.length;
  const remainingUploadEstimate = Math.max(
    estimatedRequiredDocs - uploadedDocs,
    0
  );
  const pendingVerification = Math.max(uploadedDocs - verifiedDocs, 0);

  const checklist: string[] = [];
  if ((intakeSession.recaCompletionPercent ?? 0) < 100) {
    checklist.push("Confirm remaining form details on Review.");
  }
  if (!relationship) {
    checklist.push(
      "Set claimant relationship to finalize your required document list."
    );
  }
  if (remainingUploadEstimate > 0) {
    checklist.push(
      `Upload approximately ${remainingUploadEstimate} more required document${remainingUploadEstimate === 1 ? "" : "s"}.`
    );
  }
  if (uploadedDocs === 0) {
    checklist.push("Upload your first document packet for this claim.");
  }
  if (pendingVerification > 0) {
    checklist.push(
      `${pendingVerification} uploaded document${pendingVerification === 1 ? "" : "s"} awaiting staff verification.`
    );
  }
  if (
    remainingUploadEstimate === 0 &&
    pendingVerification === 0 &&
    uploadedDocs > 0
  ) {
    checklist.push("All uploaded documents are currently verified/reviewed.");
  }

  return {
    estimatedRequiredDocs,
    uploadedDocs,
    verifiedDocs,
    checklist,
  };
}

export default function CustomerPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);
  const [packetActions, setPacketActions] = useState<
    Record<string, "downloading" | "regenerating" | null>
  >({});
  const [packetActionError, setPacketActionError] = useState<string | null>(
    null
  );
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDOJMetrics, setShowDOJMetrics] = useState(false);
  const [inviteSessionId, setInviteSessionId] = useState<string | null>(null);
  const [manageSessionId, setManageSessionId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/claims");
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error("Failed to load claims:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal");
    } else if (status === "authenticated") {
      loadClaims();
    }
  }, [status, router, loadClaims]);

  const getFilenameFromDisposition = (disposition?: string | null) => {
    if (!disposition) return "radiantclaims-packet.zip";
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).replace(/["]/g, "");
    }
    return "radiantclaims-packet.zip";
  };

  const setPacketAction = (
    sessionId: string,
    action: "downloading" | "regenerating" | null
  ) => {
    setPacketActions((prev) => ({ ...prev, [sessionId]: action }));
  };

  const handleRegeneratePacket = async (sessionId: string) => {
    setPacketActionError(null);
    setPacketAction(sessionId, "regenerating");
    try {
      const response = await fetch(`/api/reca/packet/${sessionId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to regenerate packet");
      }
      await loadClaims();
    } catch (error) {
      setPacketActionError(
        error instanceof Error ? error.message : "Failed to regenerate packet"
      );
    } finally {
      setPacketAction(sessionId, null);
    }
  };

  const handleDownloadPacket = async (sessionId: string) => {
    setPacketActionError(null);
    setPacketAction(sessionId, "downloading");
    try {
      const response = await fetch(`/api/reca/packet/${sessionId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to download packet");
      }
      const blob = await response.blob();
      const filename = getFilenameFromDisposition(
        response.headers.get("Content-Disposition")
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      await loadClaims();
    } catch (error) {
      setPacketActionError(
        error instanceof Error ? error.message : "Failed to download packet"
      );
    } finally {
      setPacketAction(sessionId, null);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    // For pending claims, require "DELETE" confirmation
    // For named claims, require exact name match
    const expectedConfirmation =
      claim.firstName === "Pending"
        ? "DELETE"
        : `${claim.firstName} ${claim.lastName}`;

    if (deleteConfirmName !== expectedConfirmation) {
      const message =
        claim.firstName === "Pending"
          ? 'Please type "DELETE" exactly to confirm.'
          : "Name does not match. Please type the full name exactly.";
      alert(message);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/claimants/${claimId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete claim");
      }

      await loadClaims();
      setClaimToDelete(null);
      setDeleteConfirmName("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete claim");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      DRAFT: {
        label: "Draft",
        className: "bg-sage-100 text-sage-700 border-sage-200",
        icon: Clock,
      },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      },
      READY_FOR_REVIEW: {
        label: "Ready for Review",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
      },
      UNDER_REVIEW: {
        label: "Under Review",
        className: "bg-purple-100 text-purple-700 border-purple-200",
        icon: Clock,
      },
      APPROVED: {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      },
      SUBMITTED: {
        label: "Submitted",
        className:
          "bg-terracotta-100 text-terracotta-700 border-terracotta-200",
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config?.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config?.className || ""}`}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {config?.label}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sage-900">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/portal/settings")}
              className="gap-2 rounded-full border-sage-300 p-2 text-sage-700 hover:bg-sage-50"
              title="Settings"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">My Claims</h1>
          <p className="text-lg text-sage-700">
            Track your RECA claims and manage your documents
          </p>
          <p className="mt-1 text-sm text-sage-600">
            Currently supporting RECA Downwinder claims; additional RECA claim
            types will be added soon.
          </p>
        </div>

        {/* DOJ Metrics Dashboard */}
        <div className="mb-8">
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sage-900">
                    <Activity className="h-5 w-5 text-terracotta-500" />
                    DOJ Processing Metrics
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    National processing trends and backlog insights
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDOJMetrics((prev) => !prev)}
                  className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                >
                  {showDOJMetrics ? "Hide Metrics" : "Show Metrics"}
                  {showDOJMetrics ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>
          {showDOJMetrics && (
            <div className="mt-4">
              <DOJMetricsDashboard />
            </div>
          )}
        </div>

        {/* Claims List */}
        {claims.length === 0 ? (
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-16 w-16 text-sage-300" />
              <h3 className="mb-2 text-xl font-semibold text-sage-900">
                No claims yet
              </h3>
              <p className="mb-6 text-center text-sage-600">
                Start your first claim to begin the process
              </p>
              <Button
                onClick={() => router.push("/intake")}
                className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                <Plus className="h-4 w-4" />
                Start First Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {packetActionError && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {packetActionError}
              </div>
            )}
            {claims.map((claim) => {
              const intakeSession = claim.intakeSession;
              const packetSubmission = intakeSession?.packetSubmission;
              const derivedPacketStatus = mapPacketStatus(
                packetSubmission?.status
              );
              const packetWarnings = Array.isArray(packetSubmission?.warnings)
                ? (packetSubmission?.warnings as string[])
                : [];
              const packetLastGeneratedAt =
                packetSubmission?.generatedAt ?? null;
              const packetReadyAt = packetSubmission?.readyAt ?? null;
              const packetHistory =
                packetSubmission?.generations?.map((generation) => ({
                  version: generation.version,
                  generatedAt: generation.generatedAt,
                  status: mapPacketStatus(generation.status),
                  generatedBy: generation.generatedBy,
                })) ?? [];
              const currentAction = intakeSession
                ? packetActions[intakeSession.id]
                : null;
              const completionPercent =
                intakeSession?.recaCompletionPercent ?? 0;
              const reviewPreferredStatuses = [
                "READY_FOR_REVIEW",
                "UNDER_REVIEW",
                "APPROVED",
                "SUBMITTED",
              ];
              const shouldPreferReview = intakeSession
                ? completionPercent >= 95 ||
                  reviewPreferredStatuses.includes(intakeSession.status)
                : false;
              const reviewRoute = intakeSession
                ? (`/reca/review/${intakeSession.id}` as Route)
                : null;
              const formRoute = intakeSession
                ? intakeSession.recaWorkflowStage
                  ? `/reca/form/${intakeSession.id}?section=${intakeSession.recaWorkflowSection || "part_1"}`
                  : `/reca/start?sessionId=${intakeSession.id}`
                : null;
              const nextSteps = buildNextSteps(
                intakeSession,
                shouldPreferReview
              );

              return (
                <Card
                  key={claim.id}
                  className="overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sage-900">
                          {claim.firstName === "Pending"
                            ? `Claim #${claims.indexOf(claim) + 1} (Name Pending)`
                            : `${claim.firstName} ${claim.lastName}`}
                        </CardTitle>
                        <CardDescription className="text-sage-600">
                          Started on{" "}
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {claim.intakeSession &&
                        getStatusBadge(claim.intakeSession.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Info */}
                      {intakeSession && (
                        <>
                          <div className="space-y-3 rounded-2xl bg-cream-50 p-4">
                            {/* Completion Progress Bar */}
                            {intakeSession.recaWorkflowStage != null && (
                              <div>
                                <div className="mb-1.5 flex items-center justify-between text-sm">
                                  <span className="font-medium text-sage-700">
                                    Application Progress
                                  </span>
                                  <span className="font-semibold text-sage-900">
                                    {intakeSession.recaCompletionPercent ?? 0}%
                                  </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-sage-200">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-terracotta-400 to-terracotta-500 transition-all duration-500"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, intakeSession.recaCompletionPercent ?? 0))}%`,
                                    }}
                                  />
                                </div>
                                {intakeSession.recaWorkflowSection && (
                                  <p className="mt-1 text-xs text-sage-500">
                                    Currently on: Part{" "}
                                    {intakeSession.recaWorkflowSection.replace(
                                      "part_",
                                      ""
                                    )}{" "}
                                    &mdash;{" "}
                                    {getPartLabel(
                                      intakeSession.recaWorkflowSection
                                    )}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Last Saved */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5 font-medium text-sage-700">
                                <Clock className="h-3.5 w-3.5" />
                                Last Saved
                              </span>
                              <span
                                className="text-sage-600"
                                title={new Date(
                                  intakeSession.updatedAt
                                ).toLocaleString()}
                              >
                                {formatTimeAgo(intakeSession.updatedAt)}
                              </span>
                            </div>

                            {/* Documents Uploaded */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5 font-medium text-sage-700">
                                <Upload className="h-3.5 w-3.5" />
                                Documents Uploaded
                              </span>
                              <span
                                className={
                                  intakeSession.uploadedFiles.length > 0
                                    ? "font-medium text-emerald-700"
                                    : "text-sage-500"
                                }
                              >
                                {intakeSession.uploadedFiles.length > 0
                                  ? `${intakeSession.uploadedFiles.length} file${intakeSession.uploadedFiles.length !== 1 ? "s" : ""}`
                                  : "None yet"}
                              </span>
                            </div>

                            {/* Family / sibling help */}
                            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-sage-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-sm text-sage-700">
                                <div className="font-semibold text-sage-900">
                                  Family / Sibling Help
                                </div>
                                <div className="text-xs text-sage-600">
                                  Invite a family member to view this claim,
                                  upload documents, and leave notes. They can’t
                                  edit your answers.
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                                  onClick={() => {
                                    setInviteSessionId(intakeSession.id);
                                    setShowInviteDialog(true);
                                  }}
                                >
                                  Invite
                                </Button>
                                <Button
                                  variant="outline"
                                  className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                                  onClick={() => {
                                    setManageSessionId(intakeSession.id);
                                    setShowManageDialog(true);
                                  }}
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </div>
                          {nextSteps && (
                            <div className="rounded-2xl border border-sage-200 bg-white p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-sage-900">
                                  What&apos;s Left
                                </h4>
                                <span className="text-xs text-sage-500">
                                  Docs verified: {nextSteps.verifiedDocs}/
                                  {nextSteps.uploadedDocs}
                                </span>
                              </div>
                              <div className="mb-2 text-xs text-sage-600">
                                Estimated required docs:{" "}
                                {nextSteps.estimatedRequiredDocs}
                              </div>
                              <ul className="space-y-1 text-sm text-sage-700">
                                {nextSteps.checklist.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {intakeSession && (
                            <PacketDeliveryCard
                              status={derivedPacketStatus}
                              warnings={packetWarnings}
                              lastGeneratedAt={packetLastGeneratedAt}
                              readyAt={packetReadyAt}
                              history={packetHistory}
                              downloadDisabled={
                                derivedPacketStatus !== "READY_FOR_DOJ"
                              }
                              onDownload={
                                derivedPacketStatus === "READY_FOR_DOJ"
                                  ? () => handleDownloadPacket(intakeSession.id)
                                  : undefined
                              }
                              onRegenerate={() =>
                                handleRegeneratePacket(intakeSession.id)
                              }
                              isDownloading={currentAction === "downloading"}
                              isRegenerating={currentAction === "regenerating"}
                            />
                          )}
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        {intakeSession && (
                          <>
                            {shouldPreferReview ? (
                              <>
                                <Button
                                  onClick={() =>
                                    reviewRoute && router.push(reviewRoute)
                                  }
                                  className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Review Application
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() =>
                                    formRoute && router.push(formRoute as Route)
                                  }
                                  className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                                >
                                  <FileText className="h-4 w-4" />
                                  {intakeSession.recaWorkflowStage
                                    ? "Continue Application"
                                    : "Start Application"}
                                </Button>

                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    reviewRoute && router.push(reviewRoute)
                                  }
                                  className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Review Application
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {/* Upload Documents (Session-specific) */}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const docsPath = intakeSession
                              ? `/reca/documents/${intakeSession.id}`
                              : "/portal/documents";
                            router.push(docsPath as Route);
                          }}
                          className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                          <Upload className="h-4 w-4" />
                          Documents
                        </Button>

                        {/* Direct link to Intake Step 2 (document upload flow) */}
                        {intakeSession?.resumeToken && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/intake/step2?token=${intakeSession.resumeToken}`
                              )
                            }
                            className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                            title="Complete after the RECA application to generate hospital/registry request packets"
                          >
                            <Upload className="h-4 w-4" />
                            Document Request Forms
                          </Button>
                        )}

                        {/* Resources Button */}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const params = new URLSearchParams();
                            if (claim.state)
                              params.append("state", claim.state);
                            if (claim.county)
                              params.append("county", claim.county);
                            router.push(
                              `/resources${params.toString() ? `?${params.toString()}` : ""}` as unknown as Route
                            );
                          }}
                          className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                          <BookOpen className="h-4 w-4" />
                          Resources
                        </Button>

                        {/* Delete Claim Button */}
                        <Button
                          variant="outline"
                          onClick={() => setClaimToDelete(claim.id)}
                          className="gap-2 rounded-full border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      <p className="text-xs text-sage-600">
                        Finish the RECA application first. Then complete the
                        Document Request Forms to generate and send your
                        hospital and registry packets.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add New Claim */}
            <Button
              onClick={() => setShowNewClaimDialog(true)}
              variant="outline"
              className="w-full gap-2 rounded-full border-2 border-dashed border-sage-300 py-6 text-sage-700 hover:border-terracotta-400 hover:bg-terracotta-50 hover:text-terracotta-700"
            >
              <Plus className="h-5 w-5" />
              Start Another Claim
            </Button>

            <Card className="rounded-3xl border-2 border-cream-200 bg-white">
              <CardHeader>
                <CardTitle className="text-sage-900">
                  What Happens Next?
                </CardTitle>
                <CardDescription className="text-sage-600">
                  Your path to compensation, explained in plain language.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-sage-700">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-terracotta-50 p-2">
                    <FileText className="h-4 w-4 text-terracotta-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sage-900">
                      RECA Application
                    </p>
                    <p>
                      Complete the form walkthrough first. This locks in
                      eligibility details and sets your document requirements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 p-2">
                    <Upload className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sage-900">
                      Document Request Forms
                    </p>
                    <p>
                      After the application, generate and send hospital/registry
                      packets. This is paramount to start record retrieval.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-sage-50 p-2">
                    <CheckCircle className="h-4 w-4 text-sage-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-sage-900">
                      Document Uploader
                    </p>
                    <p>
                      Upload IDs, birth/death certificates, and other proofs
                      your path requires. We track completeness for you.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-50 p-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sage-900">Sources</p>
                    <p>
                      Find where to request vital records and supporting docs.
                      Tailored to your state/county.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* New Claim Dialog */}
      <NewClaimDialog
        open={showNewClaimDialog}
        onOpenChange={(open) => {
          setShowNewClaimDialog(open);
          if (!open) {
            // Reload claims when dialog closes (in case they completed payment)
            loadClaims();
          }
        }}
        existingClaimCount={claims.length}
      />

      <InviteCollaboratorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        intakeSessionId={inviteSessionId}
      />
      <ManageCollaboratorsDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
        intakeSessionId={manageSessionId}
      />

      {/* Delete Confirmation Dialog */}
      {claimToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md rounded-3xl border-2 border-rose-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-rose-900">Delete Claim?</CardTitle>
              <CardDescription className="text-rose-700">
                This action cannot be undone. This will permanently delete the
                claim and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-sage-700">
                  {(() => {
                    const claim = claims.find((c) => c.id === claimToDelete);
                    return claim?.firstName === "Pending"
                      ? `Type "DELETE" to confirm:`
                      : `Type the claimant's full name to confirm:`;
                  })()}
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={(() => {
                    const claim = claims.find((c) => c.id === claimToDelete);
                    return claim?.firstName === "Pending"
                      ? "DELETE"
                      : `${claim?.firstName} ${claim?.lastName}`;
                  })()}
                  className="w-full rounded-lg border border-sage-300 px-4 py-2 text-sage-900 focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setClaimToDelete(null);
                    setDeleteConfirmName("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (claimToDelete) {
                      handleDeleteClaim(claimToDelete);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700"
                >
                  {isDeleting ? "Deleting..." : "Delete Claim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

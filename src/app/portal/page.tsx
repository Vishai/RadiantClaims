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
} from "lucide-react";
import Link from "next/link";
import { PacketDeliveryCard } from "@/components/portal/PacketDeliveryCard";
import { DOJMetricsDashboard } from "@/components/doj/DOJMetricsDashboard";
import { NewClaimDialog } from "@/components/claims/NewClaimDialog";

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
    uploadedFiles: any[];
    packetSubmission: PacketSubmissionMeta | null;
    recaWorkflowStage?: number | null;
    recaWorkflowSection?: string | null;
    recaCompletionPercent?: number | null;
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
          <DOJMetricsDashboard />
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
                          <div className="rounded-2xl bg-cream-50 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-sage-700">
                                Current Step
                              </span>
                              <span className="text-sage-900">
                                {intakeSession.currentStep.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-sage-700">
                                Documents Uploaded
                              </span>
                              <span className="text-sage-900">
                                {intakeSession.uploadedFiles.length}
                              </span>
                            </div>
                          </div>
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
                        {/* Primary Action: Fill Out Application */}
                        {intakeSession &&
                          intakeSession.status !== "SUBMITTED" && (
                            <Button
                              onClick={() => {
                                // Always route to RECA application form as primary action
                                router.push(
                                  intakeSession.recaWorkflowStage
                                    ? `/reca/form/${intakeSession.id}?section=${intakeSession.recaWorkflowSection || "part_1"}`
                                    : `/reca/start?sessionId=${intakeSession.id}`
                                );
                              }}
                              className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                            >
                              <FileText className="h-4 w-4" />
                              {intakeSession.recaWorkflowStage
                                ? "Continue Application"
                                : "Start Application"}
                            </Button>
                          )}

                        {/* Upload Documents (Optional) */}
                        <Button
                          variant="outline"
                          onClick={() => router.push("/portal/documents")}
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

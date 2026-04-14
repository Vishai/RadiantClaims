"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/analytics/meta-pixel";
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
  Menu,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { DOJMetricsDashboard } from "@/components/doj/DOJMetricsDashboard";
import { InviteCollaboratorDialog } from "@/components/portal/InviteCollaboratorDialog";
import { ManageCollaboratorsDialog } from "@/components/portal/ManageCollaboratorsDialog";
import {
  ClaimSummaryCard,
  type ClaimSummaryData,
  type PacketStatus,
  type PacketSubmissionMeta,
} from "@/components/portal/ClaimSummaryCard";
import { generateDocumentRequirements } from "@/lib/reca/document-tracking";
import type { RelationshipType } from "@/lib/reca/types";

// ============================================================================
// Types
// ============================================================================

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
      category: string | null;
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

const VALID_RELATIONSHIPS: RelationshipType[] = [
  "Self",
  "Spouse",
  "Child",
  "Parent",
  "Grandchild",
  "Grandparent",
];

// ============================================================================
// Helpers
// ============================================================================

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

/**
 * Compute the number of required documents for a claim based on the
 * claimant's relationship and filer info. Returns 0 when relationship
 * isn't yet set.
 */
function computeRequiredDocCount(formData: any): number {
  const relationshipCandidate = formData?.part_3?.relationship;
  const relationship: RelationshipType | null = VALID_RELATIONSHIPS.includes(
    relationshipCandidate
  )
    ? relationshipCandidate
    : null;
  if (!relationship) return 0;
  return generateDocumentRequirements(
    relationship,
    formData?.part_1,
    formData?.part_4
  ).filter((req) => req.required).length;
}

// ============================================================================
// Component
// ============================================================================

export default function CustomerPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claims, setClaims] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);

  // Track purchase conversion from Stripe redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      trackPurchase(249.99, "DIY_PREP");
    }
  }, [searchParams]);

  const [packetActions, setPacketActions] = useState<
    Record<string, "downloading" | "regenerating" | null>
  >({});
  const [packetActionError, setPacketActionError] = useState<string | null>(
    null
  );
  const [claimToDelete, setClaimToDelete] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDOJMetrics, setShowDOJMetrics] = useState(false);
  const [inviteSessionId, setInviteSessionId] = useState<string | null>(null);
  const [inviteSiblingOptions, setInviteSiblingOptions] = useState<string[]>(
    []
  );
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

        {packetActionError && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {packetActionError}
          </div>
        )}

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
                onClick={() => router.push("/service-tiers")}
                className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                <Plus className="h-4 w-4" />
                Start First Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {claims.map((claim, index) => {
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
              const requiredDocCount = computeRequiredDocCount(
                intakeSession?.recaFormData ?? {}
              );

              const claimData: ClaimSummaryData = {
                ...claim,
                claimIndex: index,
              };

              return (
                <ClaimSummaryCard
                  key={claim.id}
                  claim={claimData}
                  packetStatus={derivedPacketStatus}
                  packetWarnings={packetWarnings}
                  packetLastGeneratedAt={packetLastGeneratedAt}
                  packetReadyAt={packetReadyAt}
                  packetHistory={packetHistory}
                  currentAction={currentAction ?? null}
                  requiredDocCount={requiredDocCount}
                  onDownloadPacket={() =>
                    intakeSession && handleDownloadPacket(intakeSession.id)
                  }
                  onRegeneratePacket={() =>
                    intakeSession && handleRegeneratePacket(intakeSession.id)
                  }
                  onDelete={() => setClaimToDelete(claim.id)}
                  onInvite={() => {
                    if (!intakeSession) return;
                    setInviteSessionId(intakeSession.id);
                    setInviteSiblingOptions(
                      Array.isArray(
                        intakeSession.recaFormData?.part_6?.siblings
                      )
                        ? intakeSession.recaFormData.part_6.siblings
                            .map((sibling: { name?: string }) =>
                              sibling?.name?.trim()
                            )
                            .filter(
                              (name: string | undefined): name is string =>
                                !!name
                            )
                        : []
                    );
                    setShowInviteDialog(true);
                  }}
                  onManage={() => {
                    if (!intakeSession) return;
                    setManageSessionId(intakeSession.id);
                    setShowManageDialog(true);
                  }}
                  onMarkedAsSubmitted={() => loadClaims()}
                  getStatusBadge={getStatusBadge}
                />
              );
            })}

            {/* Add New Claim */}
            <Button
              onClick={() => router.push("/service-tiers")}
              variant="outline"
              className="w-full gap-2 rounded-full border-2 border-dashed border-sage-300 py-6 text-sage-700 hover:border-terracotta-400 hover:bg-terracotta-50 hover:text-terracotta-700"
            >
              <Plus className="h-5 w-5" />
              Start Another Claim
            </Button>

            {/* Discoverable: DOJ processing trends — low-priority, tucked at bottom */}
            <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sage-900">
                      <Activity className="h-5 w-5 text-terracotta-500" />
                      DOJ Processing Metrics
                    </CardTitle>
                    <CardDescription className="text-sage-600">
                      National processing trends and backlog insights — useful
                      context, not required to file.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDOJMetrics((prev) => !prev)}
                    className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                  >
                    {showDOJMetrics ? "Hide" : "View trends"}
                    {showDOJMetrics ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {showDOJMetrics && (
                <CardContent>
                  <DOJMetricsDashboard />
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </main>

      <InviteCollaboratorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        intakeSessionId={inviteSessionId}
        siblingOptions={inviteSiblingOptions}
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

"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  MoreHorizontal,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentReadinessCard } from "@/components/portal/DocumentReadinessCard";
import { DOJAnswerSheet } from "@/components/portal/DOJAnswerSheet";
import { ExportForExtension } from "@/components/portal/ExportForExtension";
import { DOJSubmissionCard } from "@/components/portal/DOJSubmissionCard";
import { PacketDeliveryCard } from "@/components/portal/PacketDeliveryCard";
import { FinancialPlanningCard } from "@/components/portal/FinancialPlanningCard";
import { FilingJourneyTracker } from "@/components/portal/FilingJourneyTracker";
import { PersonalizedPathBand } from "@/components/portal/PersonalizedPathBand";
import type { RelationshipType } from "@/lib/reca/types";

// ============================================================================
// Types (mirror the ones in portal/page.tsx for self-contained use)
// ============================================================================

export type PacketStatus =
  | "NOT_READY"
  | "PROCESSING"
  | "READY_FOR_DOJ"
  | "OUTDATED"
  | "UNKNOWN";

export interface PacketSubmissionMeta {
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

export interface ClaimSummaryData {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  state: string;
  county: string;
  claimType?: string;
  claimIndex: number;
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

interface ClaimSummaryCardProps {
  claim: ClaimSummaryData;
  packetStatus: PacketStatus;
  packetWarnings: string[];
  packetLastGeneratedAt: string | null;
  packetReadyAt: string | null;
  packetHistory: Array<{
    version: number;
    generatedAt: string;
    status: PacketStatus;
    generatedBy?: string | null;
  }>;
  currentAction: "downloading" | "regenerating" | null;
  requiredDocCount: number;
  onDownloadPacket: () => void;
  onRegeneratePacket: () => void;
  onDelete: () => void;
  onInvite: () => void;
  onManage: () => void;
  onMarkedAsSubmitted: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

// ============================================================================
// Helpers
// ============================================================================

const VALID_RELATIONSHIPS: RelationshipType[] = [
  "Self",
  "Spouse",
  "Child",
  "Parent",
  "Grandchild",
  "Grandparent",
];

const VERIFIED_FILE_STATUSES = new Set(["VALIDATED", "APPROVED"]);

// Rough minutes-per-section estimate, grounded in the common case
const MINUTES_PER_REMAINING_SECTION = 3;

// All 16 parts
const TOTAL_SECTIONS = 16;

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

/**
 * Parse the numeric index of the current section (1-16). Returns null for
 * non-part sections like "eligibility" or "review".
 */
function parseSectionIndex(section: string | null | undefined): number | null {
  if (!section) return null;
  const match = section.match(/^part_(\d+)$/);
  if (!match || !match[1]) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 1 || num > TOTAL_SECTIONS) return null;
  return num;
}

// ============================================================================
// Component
// ============================================================================

export function ClaimSummaryCard({
  claim,
  packetStatus,
  packetWarnings,
  packetLastGeneratedAt,
  packetReadyAt,
  packetHistory,
  currentAction,
  requiredDocCount,
  onDownloadPacket,
  onRegeneratePacket,
  onDelete,
  onInvite,
  onManage,
  onMarkedAsSubmitted,
  getStatusBadge,
}: ClaimSummaryCardProps) {
  const router = useRouter();
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showFamilyAccess, setShowFamilyAccess] = useState(false);
  const [showDocChecklist, setShowDocChecklist] = useState(false);

  const intakeSession = claim.intakeSession;

  // Unparented claims (no session yet) get a minimal shell
  if (!intakeSession) {
    return (
      <Card className="overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            {claim.firstName === "Pending"
              ? `Claim #${claim.claimIndex + 1} (Name Pending)`
              : `${claim.firstName} ${claim.lastName}`}
          </CardTitle>
          <CardDescription className="text-sage-600">
            Started on {new Date(claim.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={onDelete}
            className="gap-2 rounded-full border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Derived state
  const formData = intakeSession.recaFormData ?? {};
  const relationshipCandidate = formData?.part_3?.relationship;
  const relationship: RelationshipType | null = VALID_RELATIONSHIPS.includes(
    relationshipCandidate
  )
    ? relationshipCandidate
    : null;

  const completionPercent = intakeSession.recaCompletionPercent ?? 0;
  const uploadedDocs = intakeSession.uploadedFiles.length;
  const verifiedDocs = intakeSession.uploadedFiles.filter((file) =>
    VERIFIED_FILE_STATUSES.has(file.status)
  ).length;

  const currentSectionIndex = parseSectionIndex(
    intakeSession.recaWorkflowSection
  );
  const remainingSections = currentSectionIndex
    ? Math.max(TOTAL_SECTIONS - currentSectionIndex + 1, 0)
    : completionPercent >= 100
      ? 0
      : TOTAL_SECTIONS;
  const estimatedMinutesLeft = Math.max(
    remainingSections * MINUTES_PER_REMAINING_SECTION,
    5
  );

  // Decide primary CTA
  const reviewPreferredStatuses = [
    "READY_FOR_REVIEW",
    "UNDER_REVIEW",
    "APPROVED",
    "SUBMITTED",
  ];
  const shouldPreferReview =
    completionPercent >= 95 ||
    reviewPreferredStatuses.includes(intakeSession.status);

  const reviewRoute = `/reca/review/${intakeSession.id}` as Route;
  const formRoute = (
    intakeSession.recaWorkflowStage
      ? `/reca/form/${intakeSession.id}?section=${intakeSession.recaWorkflowSection || "part_1"}`
      : `/reca/start?sessionId=${intakeSession.id}`
  ) as Route;

  const continueHref = shouldPreferReview ? reviewRoute : formRoute;
  const continueLabel = shouldPreferReview
    ? "Review Application"
    : intakeSession.recaWorkflowStage
      ? "Continue Application"
      : "Start Application";

  const documentsHref = `/reca/documents/${intakeSession.id}` as Route;

  // Post-eligibility band visibility:
  // - relationship is set (user passed eligibility gate)
  // - form not yet done
  // - stage is past initial setup (have a recaWorkflowStage > 1)
  const showPersonalizedPathBand =
    relationship !== null &&
    completionPercent < 100 &&
    (intakeSession.recaWorkflowStage ?? 0) >= 2;

  const claimSubmitted = intakeSession.status === "SUBMITTED";
  const packetReady = packetStatus === "READY_FOR_DOJ";

  return (
    <Card className="overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sage-900">
              {claim.firstName === "Pending"
                ? `Claim #${claim.claimIndex + 1} (Name Pending)`
                : `${claim.firstName} ${claim.lastName}`}
            </CardTitle>
            <CardDescription className="text-sage-600">
              Started on {new Date(claim.createdAt).toLocaleDateString()}
              {" · "}
              <span title={new Date(intakeSession.updatedAt).toLocaleString()}>
                Last saved {formatTimeAgo(intakeSession.updatedAt)}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(intakeSession.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 1. Filing Journey Tracker — always visible, always prominent */}
        <FilingJourneyTracker
          formPercent={completionPercent}
          currentSection={intakeSession.recaWorkflowSection ?? null}
          uploadedDocs={uploadedDocs}
          requiredDocs={requiredDocCount}
          packetReady={packetReady}
          claimSubmitted={claimSubmitted}
          continueHref={continueHref}
          continueLabel={continueLabel}
        />

        {/* 2. Personalized Path Band — post-eligibility, pre-form-complete */}
        {showPersonalizedPathBand && relationship && (
          <PersonalizedPathBand
            relationship={relationship}
            remainingSections={remainingSections}
            estimatedMinutesLeft={estimatedMinutesLeft}
            requiredDocs={requiredDocCount}
            uploadedDocs={uploadedDocs}
            continueFormHref={formRoute}
            documentsHref={documentsHref}
          />
        )}

        {/* 3. DOJ Submission Card — only once packet is ready */}
        {packetReady && (
          <DOJSubmissionCard
            packetReady={true}
            onDownloadPacket={onDownloadPacket}
            isDownloading={currentAction === "downloading"}
            uploadedFiles={intakeSession.uploadedFiles}
            claimantId={claim.id}
            onMarkedAsSubmitted={onMarkedAsSubmitted}
          />
        )}

        {/* 4. Financial Planning — only once packet is ready */}
        <FinancialPlanningCard
          sessionId={intakeSession.id}
          visible={packetReady}
        />

        {/* 5. Collapsible: Document checklist */}
        <CollapsibleSection
          label="Document readiness"
          sublabel={
            requiredDocCount > 0
              ? `${uploadedDocs} of ${requiredDocCount} uploaded · ${verifiedDocs} verified`
              : "Complete form to personalize"
          }
          icon={Upload}
          open={showDocChecklist}
          onToggle={() => setShowDocChecklist((v) => !v)}
        >
          <DocumentReadinessCard
            formData={formData}
            uploadedFiles={intakeSession.uploadedFiles}
            sessionId={intakeSession.id}
            claimType={claim.claimType}
          />
        </CollapsibleSection>

        {/* 6. Collapsible: Family access */}
        <CollapsibleSection
          label="Family & sibling access"
          sublabel="Invite family to view, upload, or leave notes"
          icon={Users}
          open={showFamilyAccess}
          onToggle={() => setShowFamilyAccess((v) => !v)}
        >
          <div className="rounded-2xl border border-sage-200 bg-white p-4">
            <p className="mb-3 text-sm text-sage-700">
              Invite a family member to view this claim, upload documents, and
              leave notes. They can&apos;t edit your answers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                onClick={onInvite}
              >
                Invite
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                onClick={onManage}
              >
                Manage
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* 7. Collapsible: More tools (DOJ answer sheet, packet history, extension export) */}
        <CollapsibleSection
          label="More tools"
          sublabel="Answer sheet, packet history, extension export"
          icon={MoreHorizontal}
          open={showMoreTools}
          onToggle={() => setShowMoreTools((v) => !v)}
        >
          <div className="space-y-3">
            <DOJAnswerSheet formData={formData} />
            <ExportForExtension
              sessionId={intakeSession.id}
              claimId={claim.id}
              formData={formData}
              uploadedFiles={intakeSession.uploadedFiles}
            />
            <PacketDeliveryCard
              status={packetStatus}
              warnings={packetWarnings}
              lastGeneratedAt={packetLastGeneratedAt}
              readyAt={packetReadyAt}
              history={packetHistory}
              downloadDisabled={packetStatus !== "READY_FOR_DOJ"}
              onDownload={
                packetStatus === "READY_FOR_DOJ" ? onDownloadPacket : undefined
              }
              onRegenerate={onRegeneratePacket}
              isDownloading={currentAction === "downloading"}
              isRegenerating={currentAction === "regenerating"}
            />
            {intakeSession.resumeToken && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/intake/step2?token=${intakeSession.resumeToken}` as Route
                  )
                }
                className="w-full gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                <FileText className="h-4 w-4" />
                Request Medical Records (pre-filled letters)
              </Button>
            )}
          </div>
        </CollapsibleSection>

        {/* 8. Secondary action row — minimal, just Docs / Resources / Delete */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cream-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(documentsHref)}
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <Upload className="h-4 w-4" />
              Documents
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                if (claim.state) params.append("state", claim.state);
                if (claim.county) params.append("county", claim.county);
                router.push(
                  `/resources${params.toString() ? `?${params.toString()}` : ""}` as Route
                );
              }}
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={onDelete}
            className="gap-2 rounded-full border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CollapsibleSection
// ============================================================================

function CollapsibleSection({
  label,
  sublabel,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-cream-50/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-1.5 shadow-sm">
            <Icon className="h-4 w-4 text-sage-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sage-900">{label}</div>
            <div className="text-xs text-sage-600">{sublabel}</div>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-sage-500" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-sage-500" />
        )}
      </button>
      {open && <div className="border-t border-cream-200 p-4">{children}</div>}
    </div>
  );
}

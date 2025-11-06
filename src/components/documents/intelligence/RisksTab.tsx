"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Image,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import type {
  DocumentContributionStatus,
  RiskAction,
  RiskDisposition,
  RiskFixability,
  RiskFlag,
  RiskHistoryEntry,
} from "@/lib/document-intelligence/schemas";
import type { UserRole } from "@prisma/client";

const CLOSED_DISPOSITIONS: RiskDisposition[] = [
  "RESOLVED",
  "WAIVED",
  "BLOCKING_EXCLUDED",
];

const dispositionMeta: Record<
  RiskDisposition,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Open",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  },
  RESOLVED: {
    label: "Resolved",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  WAIVED: {
    label: "Waived",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
  },
  BLOCKING_EXCLUDED: {
    label: "Excluded",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  },
};

const actorLabels: Record<RiskFixability, string> = {
  CLAIMANT: "Claimant",
  REVIEWER: "Reviewer",
  SYSTEM: "System",
};

function getActorLabel(actor?: RiskHistoryEntry["actorRole"]) {
  if (!actor) return "Unknown";
  if (actor === "SYSTEM_AUTO") return "System";
  return actorLabels[actor] ?? "Unknown";
}

const REVIEWER_ROLES = new Set<UserRole>([
  "ADMIN",
  "ATTORNEY",
  "FIRM_ADMIN",
  "STAFF_REVIEWER",
  "SENIOR_REVIEWER",
]);

const actionLabels: Record<RiskAction, string> = {
  RESOLVE: "Resolve",
  LINK_EVIDENCE: "Link Evidence",
  REQUEST_WAIVER: "Request Waiver",
  EXCLUDE_DOCUMENT: "Exclude Document",
  ACKNOWLEDGE: "Acknowledge",
};

const contributionConfig: Record<
  DocumentContributionStatus,
  { label: string; description: string; badgeClass: string }
> = {
  counts: {
    label: "Counts",
    description: "Document fully contributes to eligibility.",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  provisional: {
    label: "Provisional",
    description: "Blocking risks must be resolved or waived.",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  },
  excluded: {
    label: "Excluded",
    description: "Document is excluded from claim calculations.",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  },
};

function isClosed(disposition?: RiskDisposition): boolean {
  return disposition ? CLOSED_DISPOSITIONS.includes(disposition) : false;
}

function resolveBlockingLevel(risk: RiskFlag) {
  return (
    risk.blockingLevel ?? (risk.severity === "high" ? "BLOCKING" : "ADVISORY")
  );
}

function resolveFixableBy(risk: RiskFlag): RiskFixability {
  return risk.fixableBy ?? "CLAIMANT";
}

function fallbackActions(risk: RiskFlag): RiskAction[] {
  if (risk.availableActions && risk.availableActions.length > 0) {
    return risk.availableActions;
  }

  const fixableBy = resolveFixableBy(risk);
  const blockingLevel = resolveBlockingLevel(risk);
  const actions = new Set<RiskAction>();

  if (fixableBy === "CLAIMANT" || fixableBy === "REVIEWER") {
    actions.add("RESOLVE");
    actions.add("LINK_EVIDENCE");
  }

  if (fixableBy === "CLAIMANT") {
    actions.add("REQUEST_WAIVER");
  }

  if (fixableBy === "REVIEWER") {
    actions.add("REQUEST_WAIVER");
    actions.add("EXCLUDE_DOCUMENT");
  }

  if (fixableBy === "SYSTEM") {
    actions.add("RESOLVE");
  }

  if (blockingLevel === "ADVISORY") {
    actions.add("ACKNOWLEDGE");
  }

  return Array.from(actions);
}

function resolveDisposition(risk: RiskFlag): RiskDisposition {
  return risk.disposition ?? "OPEN";
}

function resolveNextActionBy(risk: RiskFlag): RiskFixability | undefined {
  if (risk.nextActionBy) {
    return risk.nextActionBy;
  }

  const disposition = resolveDisposition(risk);
  if (isClosed(disposition)) {
    return undefined;
  }

  if (disposition === "PENDING_REVIEW") {
    return "REVIEWER";
  }

  return resolveFixableBy(risk);
}

function determineContributionStatus(
  risks: RiskFlag[]
): DocumentContributionStatus {
  if (risks.some((risk) => risk.disposition === "BLOCKING_EXCLUDED")) {
    return "excluded";
  }

  const hasBlockingOpen = risks.some(
    (risk) =>
      resolveBlockingLevel(risk) === "BLOCKING" && !isClosed(risk.disposition)
  );

  if (hasBlockingOpen) {
    return "provisional";
  }

  return "counts";
}

function formatTimestamp(value?: string) {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function getActionOptionsForUser(
  risk: RiskFlag,
  actor: RiskFixability
): RiskAction[] {
  const actions = fallbackActions(risk);
  const blockingLevel = resolveBlockingLevel(risk);
  const effectiveFixableBy = resolveFixableBy(risk);

  if (actor === "REVIEWER") {
    return actions;
  }

  if (actor === "CLAIMANT") {
    if (risk.nextActionBy && risk.nextActionBy !== "CLAIMANT") {
      return [];
    }

    return actions.filter((action) => {
      if (action === "EXCLUDE_DOCUMENT") return false;
      if (action === "ACKNOWLEDGE") {
        return blockingLevel === "ADVISORY";
      }
      if (action === "RESOLVE" || action === "LINK_EVIDENCE") {
        return effectiveFixableBy === "CLAIMANT";
      }
      if (action === "REQUEST_WAIVER") {
        return true;
      }
      return false;
    });
  }

  return [];
}

function canUserActOnRisk(
  risk: RiskFlag,
  actor: RiskFixability,
  hasDocumentId: boolean
) {
  if (!hasDocumentId) return false;
  if (isClosed(risk.disposition)) return false;

  if (actor === "REVIEWER") {
    return true;
  }

  if (actor === "CLAIMANT") {
    return !risk.nextActionBy || risk.nextActionBy === "CLAIMANT";
  }

  return false;
}

interface RisksTabProps {
  data: IntelligenceResponse;
  documentId?: string;
  userRole?: UserRole;
  onRefresh?: () => Promise<unknown> | void;
}

type SortField = "severity" | "category" | "message";
type SortOrder = "asc" | "desc";
type FilterCategory =
  | "all"
  | "compliance"
  | "eligibility"
  | "quality"
  | "consistency"
  | "authenticity";

export function RisksTab({
  data,
  documentId,
  userRole,
  onRefresh,
}: RisksTabProps) {
  const { risks: riskAnalysis } = data;
  const [sortField, setSortField] = useState<SortField>("severity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [expandedRisks, setExpandedRisks] = useState<Set<number>>(new Set());
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingRiskIndex, setProcessingRiskIndex] = useState<number | null>(
    null
  );

  const effectiveRole = (userRole ?? "CUSTOMER") as UserRole;
  const userActor: RiskFixability = REVIEWER_ROLES.has(effectiveRole)
    ? "REVIEWER"
    : "CLAIMANT";

  useEffect(() => {
    if (actionStatus?.type === "success") {
      const timer = setTimeout(() => setActionStatus(null), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [actionStatus]);

  // Defensive check for missing data
  if (!riskAnalysis) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Risk analysis data is not available. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const allRisks = [...(riskAnalysis.risks ?? [])];

  const riskScore = Math.round((riskAnalysis.overallRiskScore ?? 0) * 100);

  // Get risk score color and label
  const getRiskLevel = (score: number) => {
    if (score >= 70)
      return {
        label: "High Risk",
        color: "text-red-500",
        bgColor: "bg-red-500",
      };
    if (score >= 40)
      return {
        label: "Medium Risk",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
      };
    return {
      label: "Low Risk",
      color: "text-green-500",
      bgColor: "bg-green-500",
    };
  };

  const riskLevel = getRiskLevel(riskScore);

  const canMutate = Boolean(documentId);

  const blockingRiskCount =
    riskAnalysis.blockingRiskCount ??
    allRisks.filter((risk) => resolveBlockingLevel(risk) === "BLOCKING").length;

  const advisoryRiskCount =
    riskAnalysis.advisoryRiskCount ??
    Math.max(allRisks.length - blockingRiskCount, 0);

  const pendingReviewCount =
    riskAnalysis.pendingReviewCount ??
    allRisks.filter((risk) => resolveDisposition(risk) === "PENDING_REVIEW")
      .length;

  const awaitingClaimantCount =
    riskAnalysis.awaitingClaimantCount ??
    allRisks.filter((risk) => {
      if (isClosed(risk.disposition)) return false;
      const nextActor = resolveNextActionBy(risk);
      return nextActor === "CLAIMANT";
    }).length;

  const awaitingSystemCount =
    riskAnalysis.awaitingSystemCount ??
    allRisks.filter((risk) => {
      if (isClosed(risk.disposition)) return false;
      const nextActor = resolveNextActionBy(risk);
      return nextActor === "SYSTEM";
    }).length;

  const acknowledgedCount =
    riskAnalysis.acknowledgedCount ??
    allRisks.filter(
      (risk) =>
        resolveBlockingLevel(risk) === "ADVISORY" &&
        Boolean(risk.acknowledgedAt)
    ).length;

  const handleAction = async (risk: RiskFlag, action: RiskAction) => {
    if (!documentId) {
      setActionStatus({
        type: "error",
        message: "Document identifier missing. Unable to perform action.",
      });
      return;
    }

    const riskIndex = allRisks.indexOf(risk);
    if (riskIndex === -1) {
      setActionStatus({
        type: "error",
        message: "Could not locate risk entry.",
      });
      return;
    }

    let comment: string | undefined;
    let linkedDocumentIds: string[] | undefined;
    let waiverExpiration: string | undefined;

    switch (action) {
      case "RESOLVE": {
        const promptText =
          userActor === "CLAIMANT"
            ? "Add a note for reviewers about how you resolved this issue (optional)."
            : "Add resolution notes (optional).";
        const input = window.prompt(promptText);
        if (input !== null) {
          const trimmed = input.trim();
          if (trimmed.length > 0) {
            comment = trimmed;
          }
        }
        break;
      }
      case "LINK_EVIDENCE": {
        const evidenceInput = window.prompt(
          "Enter supporting document IDs separated by commas. Leave blank to clear."
        );
        if (evidenceInput === null) {
          return;
        }
        linkedDocumentIds = evidenceInput
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        if (evidenceInput.trim().length === 0) {
          linkedDocumentIds = [];
        }
        const note = window.prompt(
          "Add context for the linked evidence (optional)."
        );
        if (note !== null) {
          const trimmed = note.trim();
          if (trimmed.length > 0) {
            comment = trimmed;
          }
        }
        break;
      }
      case "REQUEST_WAIVER": {
        const justification = window.prompt(
          userActor === "REVIEWER"
            ? "Provide justification for granting this waiver (required)."
            : "Provide justification for requesting this waiver (required)."
        );
        if (!justification || justification.trim().length === 0) {
          window.alert("Waiver justification is required.");
          return;
        }
        comment = justification.trim();
        const expirationInput = window.prompt(
          "Enter waiver expiration (optional, YYYY-MM-DD). Leave blank for no expiration."
        );
        if (expirationInput && expirationInput.trim().length > 0) {
          const parsed = new Date(expirationInput);
          if (Number.isNaN(parsed.getTime())) {
            window.alert(
              "Invalid expiration date. Please use YYYY-MM-DD format."
            );
            return;
          }
          waiverExpiration = parsed.toISOString();
        }
        break;
      }
      case "EXCLUDE_DOCUMENT": {
        if (
          !window.confirm("Exclude this document from claim consideration?")
        ) {
          return;
        }
        const note = window.prompt(
          "Provide context for excluding the document (optional)."
        );
        if (note !== null) {
          const trimmed = note.trim();
          if (trimmed.length > 0) {
            comment = trimmed;
          }
        }
        break;
      }
      case "ACKNOWLEDGE": {
        if (!window.confirm("Acknowledge this advisory risk?")) {
          return;
        }
        const note = window.prompt("Add acknowledgement notes (optional).");
        if (note !== null) {
          const trimmed = note.trim();
          if (trimmed.length > 0) {
            comment = trimmed;
          }
        }
        break;
      }
      default:
        break;
    }

    try {
      setProcessingRiskIndex(riskIndex);
      setActionStatus(null);

      const payload: Record<string, unknown> = {
        riskIndex,
        action,
      };
      if (comment) {
        payload.comment = comment;
      }
      if (linkedDocumentIds !== undefined) {
        payload.linkedDocumentIds = linkedDocumentIds;
      }
      if (waiverExpiration) {
        payload.waiverExpiration = waiverExpiration;
      }

      const response = await fetch(`/api/documents/${documentId}/risks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to update risk.");
      }

      setActionStatus({
        type: "success",
        message: result.message || "Risk updated successfully.",
      });

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      setActionStatus({
        type: "error",
        message: error?.message || "Failed to update risk.",
      });
    } finally {
      setProcessingRiskIndex(null);
    }
  };

  const documentContributionStatus: DocumentContributionStatus =
    riskAnalysis.documentContributionStatus ??
    determineContributionStatus(allRisks);

  const contributionMeta = contributionConfig[documentContributionStatus];

  const summaryMetrics: Array<{
    key: string;
    label: string;
    value: number;
    description: string;
    accentClass: string;
  }> = [
    {
      key: "blocking",
      label: "Blocking Risks",
      value: blockingRiskCount,
      description: "Must resolve, waive, or exclude.",
      accentClass: "text-red-500",
    },
    {
      key: "advisory",
      label: "Advisory Risks",
      value: advisoryRiskCount,
      description: "Review and acknowledge when ready.",
      accentClass: "text-amber-500",
    },
    {
      key: "pending_review",
      label: "Pending Reviewer",
      value: pendingReviewCount,
      description: "Waiting for staff or attorney decision.",
      accentClass: "text-blue-500",
    },
    {
      key: "awaiting_claimant",
      label: "Awaiting Claimant",
      value: awaitingClaimantCount,
      description: "Needs claimant update or evidence.",
      accentClass: "text-emerald-500",
    },
  ];

  if (awaitingSystemCount > 0) {
    summaryMetrics.push({
      key: "awaiting_system",
      label: "System Fixes",
      value: awaitingSystemCount,
      description: "Queued for automated re-check.",
      accentClass: "text-purple-500",
    });
  }

  if (acknowledgedCount > 0) {
    summaryMetrics.push({
      key: "acknowledged",
      label: "Acknowledged",
      value: acknowledgedCount,
      description: "Advisory risks already reviewed.",
      accentClass: "text-slate-500",
    });
  }

  // Category icons
  const categoryIcons = {
    compliance: FileText,
    eligibility: Shield,
    quality: Image,
    consistency: RefreshCw,
    authenticity: ShieldAlert,
  };

  // Severity icons
  const severityEmoji = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  // Filter risks
  let filteredRisks = [...allRisks];
  if (filterCategory !== "all") {
    filteredRisks = filteredRisks.filter(
      (risk) => risk.category === filterCategory
    );
  }

  // Sort risks
  filteredRisks.sort((a, b) => {
    let comparison = 0;

    if (sortField === "severity") {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      comparison = severityOrder[a.severity] - severityOrder[b.severity];
    } else if (sortField === "category") {
      comparison = a.category.localeCompare(b.category);
    } else if (sortField === "message") {
      comparison = a.message.localeCompare(b.message);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRisks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRisks(newExpanded);
  };

  return (
    <div className="space-y-6 py-4">
      {actionStatus && (
        <Alert
          variant={actionStatus.type === "error" ? "destructive" : "default"}
        >
          {actionStatus.type === "error" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <AlertTitle>
            {actionStatus.type === "error" ? "Action Failed" : "Action Saved"}
          </AlertTitle>
          <AlertDescription>{actionStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* Risk Score Gauge */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Overall Risk Assessment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {contributionMeta.description}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${contributionMeta.badgeClass}`}
          >
            {contributionMeta.label}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="relative h-32 w-32">
            {/* Simple circular gauge */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${riskScore * 2.51} 251`}
                className={riskLevel.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${riskLevel.color}`}>
                {riskScore}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-bold ${riskLevel.color}`}>
              {riskLevel.label}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">High</p>
                <p className="text-xl font-bold text-red-500">
                  {riskAnalysis.highSeverityCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Medium</p>
                <p className="text-xl font-bold text-yellow-500">
                  {riskAnalysis.mediumSeverityCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Low</p>
                <p className="text-xl font-bold text-green-500">
                  {riskAnalysis.lowSeverityCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Risk Workflow Summary</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryMetrics.map((metric) => (
            <div
              key={metric.key}
              className="rounded-md border border-dashed bg-muted/30 p-4"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${metric.accentClass}`}>
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">
          Risk Breakdown by Category
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            All ({allRisks.length})
          </Button>
          {(
            [
              "compliance",
              "eligibility",
              "quality",
              "consistency",
              "authenticity",
            ] as const
          ).map((category) => {
            const count = allRisks.filter(
              (r) => r.category === category
            ).length;
            const Icon = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={filterCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(category)}
                disabled={count === 0}
              >
                <Icon className="mr-1 h-3 w-3" />
                {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Risks Table */}
      {filteredRisks.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-28 cursor-pointer select-none"
                  onClick={() => toggleSort("severity")}
                >
                  <div className="flex items-center gap-1">
                    Severity
                    {sortField === "severity" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === "category" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("message")}
                >
                  <div className="flex items-center gap-1">
                    Issue
                    {sortField === "message" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.map((risk, idx) => {
                const Icon = categoryIcons[risk.category];
                const isExpanded = expandedRisks.has(idx);
                const blockingLevel = resolveBlockingLevel(risk);
                const disposition = resolveDisposition(risk);
                const nextActor = resolveNextActionBy(risk);
                const actions = fallbackActions(risk);
                const baseIndex = allRisks.indexOf(risk);
                const actionOptions = getActionOptionsForUser(risk, userActor);
                const userCanAct = canUserActOnRisk(risk, userActor, canMutate);
                const showActionMenu = userCanAct && actionOptions.length > 0;
                const isProcessing = processingRiskIndex === baseIndex;
                return (
                  <Fragment key={`${risk.flag}-${idx}`}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {severityEmoji[risk.severity]}
                          </span>
                          <Badge
                            variant={
                              risk.severity === "high"
                                ? "destructive"
                                : risk.severity === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {risk.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{risk.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p>{risk.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {risk.actionRequired}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            blockingLevel === "BLOCKING"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                          }
                        >
                          {blockingLevel === "BLOCKING"
                            ? "Blocking"
                            : "Advisory"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-medium ${dispositionMeta[disposition].className}`}
                        >
                          {dispositionMeta[disposition].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {nextActor
                              ? `${actorLabels[nextActor]} action needed`
                              : "No further action"}
                          </p>
                          {actions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {actions.map((action) => (
                                <Badge
                                  key={action}
                                  variant="outline"
                                  className="border-dashed px-2 text-xs"
                                >
                                  {actionLabels[action]}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No actions configured
                            </p>
                          )}
                          {showActionMenu && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  disabled={isProcessing}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="mr-2 h-3 w-3" />
                                  )}
                                  Take action
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {actionOptions.map((option) => (
                                  <DropdownMenuItem
                                    key={option}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!isProcessing) {
                                        void handleAction(risk, option);
                                      }
                                    }}
                                  >
                                    {actionLabels[option]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {risk.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpanded(idx)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="space-y-4 p-4 text-sm">
                            {risk.details && (
                              <div>
                                <p className="font-medium">Details</p>
                                <p className="mt-1 text-muted-foreground">
                                  {risk.details}
                                </p>
                              </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="rounded border border-dashed bg-white/40 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Fixable By
                                </p>
                                <p className="mt-1 font-semibold">
                                  {actorLabels[resolveFixableBy(risk)]}
                                </p>
                                {risk.nextActionBy &&
                                  !isClosed(risk.disposition) && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Next actor:{" "}
                                      {actorLabels[risk.nextActionBy]}
                                    </p>
                                  )}
                              </div>

                              <div className="rounded border border-dashed bg-white/40 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Evidence
                                </p>
                                <p className="mt-1 font-semibold">
                                  {(risk.linkedDocumentIds ?? []).length > 0
                                    ? `${risk.linkedDocumentIds?.length} linked`
                                    : "No evidence linked"}
                                </p>
                                {risk.linkedDocumentIds &&
                                  risk.linkedDocumentIds.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                      {risk.linkedDocumentIds.map((docId) => (
                                        <li key={docId} className="font-mono">
                                          {docId}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </div>

                              <div className="rounded border border-dashed bg-white/40 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Timeline
                                </p>
                                <p className="mt-1 font-semibold">
                                  {formatTimestamp(risk.lastUpdatedAt) ??
                                    "Unknown"}
                                </p>
                                {(risk.waiverExpiration ||
                                  risk.acknowledgedAt) && (
                                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    {risk.waiverExpiration && (
                                      <p>
                                        Waiver expires:{" "}
                                        {formatTimestamp(risk.waiverExpiration)}
                                      </p>
                                    )}
                                    {risk.acknowledgedAt && (
                                      <p>
                                        Acknowledged:{" "}
                                        {formatTimestamp(risk.acknowledgedAt)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {risk.history && risk.history.length > 0 && (
                              <div>
                                <p className="font-medium">History</p>
                                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                                  {risk.history.map((entry, entryIdx) => (
                                    <li key={entryIdx}>
                                      <span className="font-medium text-slate-600 dark:text-slate-200">
                                        {dispositionMeta[entry.disposition]
                                          ?.label ?? entry.disposition}
                                      </span>
                                      {" • "}
                                      <span>
                                        {getActorLabel(entry.actorRole)}
                                      </span>
                                      {" • "}
                                      <span>
                                        {formatTimestamp(entry.timestamp)}
                                      </span>
                                      {entry.comment && (
                                        <>
                                          <br />
                                          <span>{entry.comment}</span>
                                        </>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {risk.affectedPages &&
                              risk.affectedPages.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Affected pages:{" "}
                                  {risk.affectedPages.join(", ")}
                                </p>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No risks found in this category
        </div>
      )}

      {/* Recommended Actions */}
      {riskAnalysis.recommendedActions.length > 0 && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-3 text-lg font-semibold">Recommended Actions</h3>
          <ul className="space-y-2">
            {riskAnalysis.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 font-bold text-blue-500">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

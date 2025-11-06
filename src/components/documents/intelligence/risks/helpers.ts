import type {
  DocumentContributionStatus,
  RiskAction,
  RiskDisposition,
  RiskFlag,
  RiskFixability,
} from "@/lib/document-intelligence/schemas";
import type { UserRole } from "@prisma/client";

export const CLOSED_DISPOSITIONS: RiskDisposition[] = [
  "RESOLVED",
  "WAIVED",
  "BLOCKING_EXCLUDED",
];

export const REVIEWER_ROLES = new Set<UserRole>([
  "ADMIN",
  "ATTORNEY",
  "FIRM_ADMIN",
  "STAFF_REVIEWER",
  "SENIOR_REVIEWER",
]);

export const actorLabels: Record<RiskFixability, string> = {
  CLAIMANT: "Claimant",
  REVIEWER: "Reviewer",
  SYSTEM: "System",
};

export const actionLabels: Record<RiskAction, string> = {
  RESOLVE: "Mark Resolved",
  LINK_EVIDENCE: "Attach Evidence",
  REQUEST_WAIVER: "Dismiss Risk",
  EXCLUDE_DOCUMENT: "Exclude Document",
  ACKNOWLEDGE: "Acknowledge",
};

export const dispositionMeta: Record<
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

export const contributionConfig: Record<
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

export type SortField = "severity" | "category" | "message";
export type SortOrder = "asc" | "desc";
export type FilterCategory =
  | "all"
  | "compliance"
  | "eligibility"
  | "quality"
  | "consistency"
  | "authenticity";

export const severityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function isClosed(disposition?: RiskDisposition): boolean {
  return disposition ? CLOSED_DISPOSITIONS.includes(disposition) : false;
}

export function resolveFixableBy(risk: RiskFlag): RiskFixability {
  return risk.fixableBy ?? "CLAIMANT";
}

export function resolveBlockingLevel(risk: RiskFlag) {
  return (
    risk.blockingLevel ?? (risk.severity === "high" ? "BLOCKING" : "ADVISORY")
  );
}

export function resolveDisposition(risk: RiskFlag): RiskDisposition {
  return risk.disposition ?? "OPEN";
}

export function resolveNextActionBy(
  risk: RiskFlag
): RiskFixability | undefined {
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

export function determineContributionStatus(
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

export function getActorLabel(actor?: RiskFixability | "SYSTEM_AUTO") {
  if (!actor) return "Unknown";
  if (actor === "SYSTEM_AUTO") return "System";
  return actorLabels[actor] ?? "Unknown";
}

export function resolveAvailableActions(risk: RiskFlag): RiskAction[] {
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

  if (fixableBy === "CLAIMANT" || fixableBy === "REVIEWER") {
    actions.add("REQUEST_WAIVER");
  }

  if (fixableBy === "REVIEWER") {
    actions.add("EXCLUDE_DOCUMENT");
  }

  if (blockingLevel === "ADVISORY") {
    actions.add("ACKNOWLEDGE");
  }

  return Array.from(actions);
}

export function getActionOptionsForUser(
  risk: RiskFlag,
  actor: RiskFixability
): RiskAction[] {
  const actions = resolveAvailableActions(risk);
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

export function canUserActOnRisk(
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

export function formatTimestamp(value?: string) {
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

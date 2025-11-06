import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isRiskClosed,
  summarizeRiskLifecycle,
} from "@/lib/document-intelligence/risk-analysis";
import type {
  RiskAction,
  RiskFlag,
  RiskFixability,
  RiskHistoryEntry,
} from "@/lib/document-intelligence/schemas";
import { UserRole } from "@prisma/client";

// Reviewer roles permitted to take administrative actions
const REVIEWER_ROLES = new Set<UserRole>([
  "ADMIN",
  "ATTORNEY",
  "FIRM_ADMIN",
  "STAFF_REVIEWER",
  "SENIOR_REVIEWER",
]);

const RISK_SUCCESS_MESSAGES: Partial<
  Record<RiskAction, { claimant: string; reviewer: string }>
> = {
  RESOLVE: {
    claimant: "Resolution submitted for reviewer validation.",
    reviewer: "Risk marked as resolved.",
  },
  LINK_EVIDENCE: {
    claimant: "Evidence linked and sent for review.",
    reviewer: "Evidence links updated.",
  },
  REQUEST_WAIVER: {
    claimant: "Waiver request sent to reviewers.",
    reviewer: "Waiver granted for this risk.",
  },
  EXCLUDE_DOCUMENT: {
    claimant: "Document exclusion request recorded.",
    reviewer: "Document excluded from claim consideration.",
  },
  ACKNOWLEDGE: {
    claimant: "Risk acknowledged.",
    reviewer: "Risk acknowledgement recorded.",
  },
};

function resolveFixableBy(risk: RiskFlag): RiskFixability {
  return risk.fixableBy ?? "CLAIMANT";
}

function resolveBlockingLevel(risk: RiskFlag) {
  return (
    risk.blockingLevel ?? (risk.severity === "high" ? "BLOCKING" : "ADVISORY")
  );
}

function computeAvailableActions(risk: RiskFlag): RiskAction[] {
  const actions = new Set<RiskAction>();
  const fixableBy = resolveFixableBy(risk);
  const blockingLevel = resolveBlockingLevel(risk);

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

function determineNextActor(risk: RiskFlag): RiskFixability | undefined {
  if (isRiskClosed(risk.disposition)) {
    return undefined;
  }

  if (risk.disposition === "PENDING_REVIEW") {
    return "REVIEWER";
  }

  return resolveFixableBy(risk);
}

function isActionAllowed(
  risk: RiskFlag,
  action: RiskAction,
  actor: RiskFixability
): boolean {
  if (isRiskClosed(risk.disposition)) {
    return false;
  }

  if (actor === "REVIEWER") {
    return true;
  }

  if (actor === "CLAIMANT") {
    if (risk.nextActionBy && risk.nextActionBy !== "CLAIMANT") {
      return false;
    }

    switch (action) {
      case "RESOLVE":
      case "LINK_EVIDENCE":
        return resolveFixableBy(risk) === "CLAIMANT";
      case "REQUEST_WAIVER":
      case "ACKNOWLEDGE":
        return true;
      case "EXCLUDE_DOCUMENT":
        return false;
      default:
        return false;
    }
  }

  return false;
}

function normalizeHistoryComment(comment?: unknown) {
  if (typeof comment !== "string") return undefined;
  const trimmed = comment.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function ensureRiskHistory(risk: RiskFlag): RiskHistoryEntry[] {
  if (Array.isArray(risk.history)) {
    return [...risk.history];
  }
  return [];
}

function cloneRisk(risk: RiskFlag): RiskFlag {
  return {
    ...risk,
    history: ensureRiskHistory(risk),
    affectedPages: risk.affectedPages ? [...risk.affectedPages] : undefined,
    relatedDocuments: risk.relatedDocuments
      ? [...risk.relatedDocuments]
      : undefined,
    linkedDocumentIds: risk.linkedDocumentIds
      ? [...risk.linkedDocumentIds]
      : undefined,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { riskIndex, action, comment, linkedDocumentIds, waiverExpiration } =
      body as {
        riskIndex?: number;
        action?: RiskAction;
        comment?: string;
        linkedDocumentIds?: string[];
        waiverExpiration?: string;
      };

    if (typeof riskIndex !== "number" || riskIndex < 0) {
      return NextResponse.json(
        { error: "Valid riskIndex is required." },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required." },
        { status: 400 }
      );
    }

    const { id } = params;
    const file = await db.uploadedFile.findUnique({
      where: { id },
      include: {
        intakeSession: {
          include: {
            claimant: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    const userRole = session.user.role as UserRole;
    const isReviewer = REVIEWER_ROLES.has(userRole);
    const isOwner =
      file.intakeSession?.claimant?.userId &&
      file.intakeSession.claimant.userId === session.user.id;

    if (!isReviewer && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!file.metadata) {
      return NextResponse.json(
        { error: "No intelligence metadata available for this document." },
        { status: 400 }
      );
    }

    let metadata: any;
    try {
      metadata =
        typeof file.metadata === "string"
          ? JSON.parse(file.metadata)
          : file.metadata;
    } catch (error) {
      console.error("Failed to parse document metadata", error);
      return NextResponse.json(
        { error: "Document metadata could not be parsed." },
        { status: 500 }
      );
    }

    if (!metadata?.risks?.risks || !Array.isArray(metadata.risks.risks)) {
      return NextResponse.json(
        { error: "Risk analysis data is not available for this document." },
        { status: 400 }
      );
    }

    const risks: RiskFlag[] = metadata.risks.risks;
    const risk = risks[riskIndex];
    if (!risk) {
      return NextResponse.json(
        { error: "Risk entry not found." },
        { status: 404 }
      );
    }

    const actor: RiskFixability = isReviewer ? "REVIEWER" : "CLAIMANT";
    if (!isActionAllowed(risk, action, actor)) {
      return NextResponse.json(
        { error: "You are not permitted to perform this action." },
        { status: 403 }
      );
    }

    let sanitizedLinks: string[] | undefined;
    if (linkedDocumentIds !== undefined) {
      if (!Array.isArray(linkedDocumentIds)) {
        return NextResponse.json(
          { error: "linkedDocumentIds must be an array of document IDs." },
          { status: 400 }
        );
      }
      sanitizedLinks = linkedDocumentIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean);

      if (sanitizedLinks.length > 0) {
        const relatedDocs = await db.uploadedFile.findMany({
          where: {
            id: { in: sanitizedLinks },
            intakeSessionId: file.intakeSessionId,
          },
          select: { id: true },
        });
        const validIds = new Set(relatedDocs.map((doc) => doc.id));
        const invalidIds = sanitizedLinks.filter((id) => !validIds.has(id));
        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              error: `Invalid supporting document IDs: ${invalidIds.join(
                ", "
              )}`,
            },
            { status: 400 }
          );
        }
      }
    }

    let sanitizedExpiration: string | undefined;
    if (waiverExpiration) {
      const date = new Date(waiverExpiration);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid waiver expiration date." },
          { status: 400 }
        );
      }
      sanitizedExpiration = date.toISOString();
    }

    const updatedRisk = cloneRisk(risk);
    const now = new Date().toISOString();
    const historyComment = normalizeHistoryComment(comment);

    switch (action) {
      case "RESOLVE":
        if (actor === "CLAIMANT") {
          updatedRisk.disposition = "PENDING_REVIEW";
        } else {
          updatedRisk.disposition = "RESOLVED";
        }
        break;

      case "LINK_EVIDENCE":
        updatedRisk.linkedDocumentIds = sanitizedLinks ?? [];
        if (actor === "CLAIMANT") {
          updatedRisk.disposition = "PENDING_REVIEW";
        }
        break;

      case "REQUEST_WAIVER":
        if (actor === "CLAIMANT") {
          updatedRisk.disposition = "PENDING_REVIEW";
        } else {
          updatedRisk.disposition = "WAIVED";
          updatedRisk.waiverExpiration = sanitizedExpiration;
        }
        break;

      case "EXCLUDE_DOCUMENT":
        if (!isReviewer) {
          return NextResponse.json(
            { error: "Only reviewers can exclude documents." },
            { status: 403 }
          );
        }
        updatedRisk.disposition = "BLOCKING_EXCLUDED";
        break;

      case "ACKNOWLEDGE":
        if (resolveBlockingLevel(updatedRisk) !== "ADVISORY") {
          return NextResponse.json(
            { error: "Only advisory risks can be acknowledged." },
            { status: 400 }
          );
        }
        updatedRisk.acknowledgedAt = now;
        if (!updatedRisk.disposition) {
          updatedRisk.disposition = "OPEN";
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    updatedRisk.availableActions = computeAvailableActions(updatedRisk);
    updatedRisk.nextActionBy = determineNextActor(updatedRisk);
    updatedRisk.lastUpdatedAt = now;
    const history = ensureRiskHistory(updatedRisk);
    history.push({
      disposition: updatedRisk.disposition ?? "OPEN",
      actorRole: actor,
      actorId: session.user.id,
      timestamp: now,
      comment: historyComment,
    });
    updatedRisk.history = history;

    risks[riskIndex] = updatedRisk;
    const lifecycle = summarizeRiskLifecycle(risks);

    metadata.risks = {
      ...metadata.risks,
      risks,
      totalRisks: risks.length,
      blockingRiskCount: lifecycle.blockingRiskCount,
      advisoryRiskCount: lifecycle.advisoryRiskCount,
      pendingReviewCount: lifecycle.pendingReviewCount,
      awaitingClaimantCount: lifecycle.awaitingClaimantCount,
      awaitingSystemCount: lifecycle.awaitingSystemCount,
      acknowledgedCount: lifecycle.acknowledgedCount,
      documentContributionStatus: lifecycle.documentContributionStatus,
      lastUpdatedAt: now,
    };

    metadata.documentContributionStatus = lifecycle.documentContributionStatus;

    await db.uploadedFile.update({
      where: { id },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    const successCopy =
      RISK_SUCCESS_MESSAGES[action]?.[isReviewer ? "reviewer" : "claimant"] ||
      "Risk updated.";

    return NextResponse.json(
      {
        success: true,
        message: successCopy,
        risk: updatedRisk,
        summary: lifecycle,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update risk disposition", error);
    return NextResponse.json(
      { error: "Failed to update risk." },
      { status: 500 }
    );
  }
}

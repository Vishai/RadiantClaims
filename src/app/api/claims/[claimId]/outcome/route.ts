import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ClaimOutcomeStatus, PaidMethod } from "@prisma/client";

/**
 * GET /api/claims/[claimId]/outcome
 * PUT /api/claims/[claimId]/outcome
 *
 * User-reported DOJ claim outcome. Distinct from ClaimLifecycle
 * (admin-tracked). See `docs/CAMPAIGN_PLAYBOOK.md` §10 and
 * `prisma/schema.prisma` ClaimOutcome for the data model.
 *
 * Authorization mirrors the DOJ claim number route: owner, admin,
 * attorney, or staff reviewer.
 */

const VALID_OUTCOMES = new Set<ClaimOutcomeStatus>([
  "AWARDED",
  "DENIED",
  "WITHDRAWN",
  "PENDING",
]);

const VALID_PAID_METHODS = new Set<PaidMethod>([
  "CHECK",
  "DIRECT_DEPOSIT",
  "WIRE",
  "OTHER",
]);

async function authorizeClaimant(
  claimantId: string,
  userId: string,
  role: string | null | undefined
) {
  const claimant = await db.claimant.findUnique({
    where: { id: claimantId },
    select: { id: true, userId: true },
  });

  if (!claimant) return { ok: false as const, status: 404 };

  const isOwner = claimant.userId === userId;
  const isAdmin = role === "ADMIN";
  const isAttorney = role === "ATTORNEY";
  const isStaff = role === "STAFF_REVIEWER" || role === "SENIOR_REVIEWER";

  if (!isOwner && !isAdmin && !isAttorney && !isStaff) {
    return { ok: false as const, status: 403 };
  }

  return { ok: true as const, claimant };
}

// ─── GET ──────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId: claimantId } = params;
    const auth = await authorizeClaimant(
      claimantId,
      session.user.id,
      session.user.role
    );
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.status === 404 ? "Claimant not found" : "Forbidden" },
        { status: auth.status }
      );
    }

    const outcome = await db.claimOutcome.findUnique({
      where: { claimantId },
    });

    return NextResponse.json({ outcome: outcome ?? null });
  } catch (error) {
    console.error("[GET /claims/:id/outcome] failed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch outcome",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── PUT (upsert) ─────────────────────────────────────────────

interface PutBody {
  outcome?: string;
  awardAmount?: number | null;
  awardReceivedAt?: string | null;
  paidMethod?: string | null;
  denialReason?: string | null;
  appealed?: boolean;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId: claimantId } = params;
    const auth = await authorizeClaimant(
      claimantId,
      session.user.id,
      session.user.role
    );
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.status === 404 ? "Claimant not found" : "Forbidden" },
        { status: auth.status }
      );
    }

    const body: PutBody = await req.json();
    const outcomeRaw = (body.outcome ?? "").toUpperCase();

    if (!VALID_OUTCOMES.has(outcomeRaw as ClaimOutcomeStatus)) {
      return NextResponse.json(
        {
          error:
            "Invalid outcome. Must be one of: awarded, denied, withdrawn, pending",
        },
        { status: 400 }
      );
    }
    const outcome = outcomeRaw as ClaimOutcomeStatus;

    // Narrow the data per branch — don't persist award fields on a
    // denied/pending record and vice versa.
    let awardAmount: number | null = null;
    let awardReceivedAt: Date | null = null;
    let paidMethod: PaidMethod | null = null;
    let denialReason: string | null = null;
    let appealed = false;

    if (outcome === "AWARDED") {
      if (typeof body.awardAmount === "number" && body.awardAmount > 0) {
        awardAmount = body.awardAmount;
      }
      if (body.awardReceivedAt) {
        const parsed = new Date(body.awardReceivedAt);
        if (!isNaN(parsed.getTime())) awardReceivedAt = parsed;
      }
      if (body.paidMethod) {
        const pm = body.paidMethod.toUpperCase();
        if (VALID_PAID_METHODS.has(pm as PaidMethod)) {
          paidMethod = pm as PaidMethod;
        }
      }
    } else if (outcome === "DENIED") {
      denialReason =
        typeof body.denialReason === "string" && body.denialReason.trim().length
          ? body.denialReason.trim().slice(0, 4000)
          : null;
      appealed = body.appealed === true;
    }

    // Upsert — one outcome per claimant
    const saved = await db.claimOutcome.upsert({
      where: { claimantId },
      create: {
        claimantId,
        outcome,
        awardAmount,
        awardReceivedAt,
        paidMethod,
        denialReason,
        appealed,
        selfReportedAt: new Date(),
      },
      update: {
        outcome,
        awardAmount,
        awardReceivedAt,
        paidMethod,
        denialReason,
        appealed,
        selfReportedAt: new Date(),
      },
    });

    // Audit log — mirrors the pattern in doj-claim-number/route.ts
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CLAIMANT_UPDATED",
        resourceType: "ClaimOutcome",
        resourceId: saved.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        metadata: JSON.stringify({
          claimantId,
          outcome,
          hasAwardAmount: awardAmount != null,
          appealed,
          details: "User self-reported DOJ claim outcome",
        }),
      },
    });

    return NextResponse.json({ success: true, outcome: saved });
  } catch (error) {
    console.error("[PUT /claims/:id/outcome] failed:", error);
    return NextResponse.json(
      {
        error: "Failed to save outcome",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

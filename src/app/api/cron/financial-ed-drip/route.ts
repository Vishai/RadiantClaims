import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendFinancialEdCalculatorEmail,
  sendFinancialEdTipsEmail,
  sendFinancialEdAdvisorEmail,
} from "@/lib/email";

/**
 * POST /api/cron/financial-ed-drip
 *
 * Cron job that sends emails 2-4 of the financial education drip sequence
 * based on days elapsed since the trigger (DOJ claim number submission).
 *
 * RECA processing times vary, so the drip is paced conservatively:
 *
 * Email 1 (celebration): Sent immediately at trigger time
 * Email 2 (calculator): Day 14 — first nudge to explore compound growth
 * Email 3 (tips): Day 60 — practical planning tips mid-wait
 * Email 4 (advisor): Day 180 — warm P4 Wealth intro at ~6 months
 *
 * Schedule: Daily at 4 PM UTC (noon EST) via Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * DAY_MS);

    const results = {
      email2Sent: 0,
      email3Sent: 0,
      email4Sent: 0,
      errors: [] as string[],
    };

    // ── Email 2: Calculator (Day 14) ──
    const email2Candidates = await prisma.financialEdDrip.findMany({
      where: {
        email1SentAt: { not: null },
        email2SentAt: null,
        triggeredAt: { lte: fourteenDaysAgo },
      },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            email: true,
            intakeSession: {
              select: { id: true },
            },
          },
        },
      },
      take: 50,
    });

    for (const drip of email2Candidates) {
      const { claimant } = drip;
      const sessionId = claimant.intakeSession?.id;
      if (!claimant.email || !sessionId) continue;

      try {
        await sendFinancialEdCalculatorEmail({
          to: claimant.email,
          claimantName: claimant.firstName || undefined,
          sessionId,
        });

        await prisma.financialEdDrip.update({
          where: { id: drip.id },
          data: { email2SentAt: new Date() },
        });

        results.email2Sent++;
      } catch (error) {
        results.errors.push(`Email 2 failed for ${claimant.id}: ${error}`);
      }
    }

    // ── Email 3: Tips (Day 60) ──
    const email3Candidates = await prisma.financialEdDrip.findMany({
      where: {
        email2SentAt: { not: null },
        email3SentAt: null,
        triggeredAt: { lte: sixtyDaysAgo },
      },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            email: true,
            intakeSession: {
              select: { id: true },
            },
          },
        },
      },
      take: 50,
    });

    for (const drip of email3Candidates) {
      const { claimant } = drip;
      const sessionId = claimant.intakeSession?.id;
      if (!claimant.email || !sessionId) continue;

      try {
        await sendFinancialEdTipsEmail({
          to: claimant.email,
          claimantName: claimant.firstName || undefined,
          sessionId,
        });

        await prisma.financialEdDrip.update({
          where: { id: drip.id },
          data: { email3SentAt: new Date() },
        });

        results.email3Sent++;
      } catch (error) {
        results.errors.push(`Email 3 failed for ${claimant.id}: ${error}`);
      }
    }

    // ── Email 4: Advisor (Day 180) ──
    const email4Candidates = await prisma.financialEdDrip.findMany({
      where: {
        email3SentAt: { not: null },
        email4SentAt: null,
        triggeredAt: { lte: oneEightyDaysAgo },
      },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            email: true,
            intakeSession: {
              select: { id: true },
            },
          },
        },
      },
      take: 50,
    });

    for (const drip of email4Candidates) {
      const { claimant } = drip;
      const sessionId = claimant.intakeSession?.id;
      if (!claimant.email || !sessionId) continue;

      try {
        await sendFinancialEdAdvisorEmail({
          to: claimant.email,
          claimantName: claimant.firstName || undefined,
          sessionId,
        });

        await prisma.financialEdDrip.update({
          where: { id: drip.id },
          data: { email4SentAt: new Date() },
        });

        results.email4Sent++;
      } catch (error) {
        results.errors.push(`Email 4 failed for ${claimant.id}: ${error}`);
      }
    }

    console.log(
      `Financial ed drip: sent ${results.email2Sent} email2, ${results.email3Sent} email3, ${results.email4Sent} email4, ${results.errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in financial-ed-drip cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

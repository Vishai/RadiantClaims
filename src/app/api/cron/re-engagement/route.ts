import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReengagementEmail } from "@/lib/email";

/**
 * POST /api/cron/re-engagement
 *
 * Cron job that finds users inactive for 14+ days with incomplete claims
 * and sends re-engagement emails to bring them back.
 *
 * Schedule: Daily at 10 AM EST (via Vercel Cron or external scheduler)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const results = {
      emailsSent: 0,
      errors: [] as string[],
    };

    // Find sessions that haven't been updated in 14+ days and are still incomplete
    const inactiveSessions = await prisma.intakeSession.findMany({
      where: {
        updatedAt: { lte: fourteenDaysAgo },
        status: { in: ["DRAFT", "IN_PROGRESS"] },
        claimant: {
          email: { not: "" },
        },
      },
      select: {
        id: true,
        updatedAt: true,
        resumeToken: true,
        recaCompletionPercent: true,
        claimant: {
          select: { email: true, firstName: true, lastName: true },
        },
        uploadedFiles: {
          select: { id: true },
        },
      },
      take: 100,
    });

    for (const session of inactiveSessions) {
      if (!session.claimant?.email) continue;

      // Calculate days inactive
      const daysInactive = Math.floor(
        (now.getTime() - session.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Use recaCompletionPercent for progress and docs for engagement scoring
      const completionPercent = session.recaCompletionPercent || 0;
      const docCount = session.uploadedFiles?.length || 0;
      const priorityScore = Math.min(
        100,
        Math.round(completionPercent * 0.6 + Math.min(docCount / 5, 1) * 40)
      );

      // Determine recommended action
      let recommendedAction = "Continue filling out your claim form";
      if (docCount === 0 && completionPercent > 30) {
        recommendedAction = "Upload your supporting documents";
      } else if (completionPercent < 20) {
        recommendedAction = "Complete the basic information sections";
      } else if (completionPercent > 70) {
        recommendedAction = "You're almost done — just a few more steps";
      }

      try {
        await sendReengagementEmail({
          to: session.claimant.email,
          claimantName: `${session.claimant.firstName} ${session.claimant.lastName}`,
          daysInactive,
          priorityScore,
          recommendedAction,
        });

        results.emailsSent++;
        console.log(
          `Sent re-engagement email for session ${session.id} (${daysInactive} days inactive)`
        );
      } catch (error) {
        const errorMsg = `Failed to send re-engagement for session ${session.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in re-engagement cron:", error);
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

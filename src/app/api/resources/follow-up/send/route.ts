import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendResourceFollowUpEmail,
  sendResourceAlternativesEmail,
} from "@/lib/email";
import { calculateAllMetrics } from "@/lib/doj-metrics-calculator";

/**
 * Combined Daily Cron Job
 *
 * Runs daily at 10 AM EST (3 PM UTC) to:
 * 1. Send follow-up emails for pending ResourceInteractions
 * 2. Calculate DOJ processing metrics
 *
 * Follow-up emails check:
 * - First follow-up: followUpScheduledFor <= NOW && followUpSentAt IS NULL
 * - Second follow-up: followUpSentAt + 7 days <= NOW && followUpReminderSent = false && no feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results = {
      firstFollowUpsSent: 0,
      secondFollowUpsSent: 0,
      errors: [] as string[],
    };

    // FIRST FOLLOW-UP: Find interactions ready for initial follow-up
    const pendingFirstFollowUps = await prisma.resourceInteraction.findMany({
      where: {
        followUpScheduledFor: {
          lte: now,
        },
        followUpSentAt: null,
        email: {
          not: null,
        },
      },
      include: {
        resource: true,
      },
      take: 100, // Process in batches to avoid timeouts
    });

    console.log(
      `Found ${pendingFirstFollowUps.length} interactions ready for first follow-up`
    );

    // Send first follow-up emails
    for (const interaction of pendingFirstFollowUps) {
      if (!interaction.email) continue;

      try {
        const baseUrl =
          process.env.NEXTAUTH_URL || "https://app.radiantclaims.com";
        const feedbackUrl = `${baseUrl}/feedback/${interaction.id}`;
        const alternativesUrl = `${baseUrl}/chat`; // Or resource search page

        await sendResourceFollowUpEmail({
          to: interaction.email,
          claimantName: undefined, // Could get from User table if userId is set
          officeName: interaction.resource.name,
          officeType: interaction.resource.resourceType,
          documentType: interaction.documentType,
          searchQuery: interaction.searchQuery || undefined,
          feedbackUrl,
          alternativesUrl,
        });

        // Mark as sent
        await prisma.resourceInteraction.update({
          where: { id: interaction.id },
          data: {
            followUpSentAt: now,
            followUpMethod: "email",
          },
        });

        results.firstFollowUpsSent++;
        console.log(`Sent first follow-up for interaction ${interaction.id}`);
      } catch (error) {
        const errorMsg = `Failed to send first follow-up for ${interaction.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // SECOND FOLLOW-UP: Find interactions sent 7+ days ago with no response
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pendingSecondFollowUps = await prisma.resourceInteraction.findMany({
      where: {
        followUpSentAt: {
          lte: sevenDaysAgo,
        },
        followUpReminderSent: false,
        followUpCompletedAt: null, // No feedback provided yet
        email: {
          not: null,
        },
      },
      include: {
        resource: true,
      },
      take: 100,
    });

    console.log(
      `Found ${pendingSecondFollowUps.length} interactions ready for second follow-up`
    );

    // Send second follow-up emails (alternatives)
    for (const interaction of pendingSecondFollowUps) {
      if (!interaction.email) continue;

      try {
        const baseUrl =
          process.env.NEXTAUTH_URL || "https://app.radiantclaims.com";
        const feedbackUrl = `${baseUrl}/feedback/${interaction.id}`;
        const chatUrl = `${baseUrl}/chat`;

        // TODO: Fetch alternative resources from database
        // For now, send without alternatives (email template handles empty array)
        const alternativeResources: Array<{
          name: string;
          type: string;
          phone?: string;
        }> = [];

        await sendResourceAlternativesEmail({
          to: interaction.email,
          claimantName: undefined,
          officeName: interaction.resource.name,
          documentType: interaction.documentType,
          alternativeResources,
          feedbackUrl,
          chatUrl,
        });

        // Mark reminder as sent
        await prisma.resourceInteraction.update({
          where: { id: interaction.id },
          data: {
            followUpReminderSent: true,
          },
        });

        results.secondFollowUpsSent++;
        console.log(`Sent second follow-up for interaction ${interaction.id}`);
      } catch (error) {
        const errorMsg = `Failed to send second follow-up for ${interaction.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // CALCULATE DOJ METRICS
    console.log("\n🚀 Calculating DOJ processing metrics...");
    let dojMetricsCalculated = 0;
    try {
      const metrics = await calculateAllMetrics("DOWNWINDER");
      dojMetricsCalculated = metrics.length;
      console.log(
        `✅ Successfully calculated metrics for ${dojMetricsCalculated} time windows`
      );
    } catch (dojError) {
      const errorMsg = `Failed to calculate DOJ metrics: ${dojError}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return NextResponse.json({
      success: true,
      ...results,
      dojMetricsCalculated,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in daily cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing/manual trigger
export async function GET(request: NextRequest) {
  return POST(request);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAttorneyActivitySummaryEmail } from "@/lib/email";
import type {
  SummaryMetrics,
  ActivityItem,
} from "@/emails/attorney/activity-summary";

/**
 * POST /api/cron/attorney-summary
 *
 * Cron job that sends daily activity summary emails to attorneys.
 * Aggregates recent activity logs per firm and sends a digest.
 *
 * Schedule: Daily at 6 AM and 2 PM Mountain (via Vercel Cron or external scheduler)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const results = {
      emailsSent: 0,
      firmsProcessed: 0,
      errors: [] as string[],
    };

    // Get all active law firms with their attorneys
    const firms = await prisma.lawFirm.findMany({
      where: { status: "ACTIVE" },
      include: {
        users: {
          where: { role: "ATTORNEY" },
          select: { email: true, name: true },
        },
      },
    });

    for (const firm of firms) {
      if (firm.users.length === 0) continue;

      // Get recent activity logs for this firm
      const activities = await prisma.attorneyActivityLog.findMany({
        where: {
          firmId: firm.id,
          createdAt: { gte: oneDayAgo },
          includedInSummary: false,
        },
        include: {
          claimant: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // Skip firms with no new activity
      if (activities.length === 0) continue;

      results.firmsProcessed++;

      // Calculate metrics
      const metrics: SummaryMetrics = {
        newClients: activities.filter(
          (a) => a.activityType === "NEW_CLIENT_SIGNUP"
        ).length,
        packetsReady: activities.filter(
          (a) => a.activityType === "PACKET_GENERATED"
        ).length,
        documentsUploaded: activities.filter(
          (a) => a.activityType === "DOCUMENT_UPLOADED"
        ).length,
        claimantResponses: activities.filter(
          (a) => a.activityType === "CLAIMANT_RESPONDED"
        ).length,
        followUpsDue: activities.filter(
          (a) => a.activityType === "FOLLOW_UP_COMPLETED"
        ).length,
        queueDepth: activities.length,
      };

      // Map activities to email format
      const activityItems: ActivityItem[] = activities
        .slice(0, 10)
        .map((a) => ({
          id: a.id,
          title: a.title,
          type: a.activityType,
          timestamp: a.createdAt.toISOString(),
          description: a.description || undefined,
          claimantName: a.claimant
            ? `${a.claimant.firstName} ${a.claimant.lastName}`
            : undefined,
          priority:
            a.activityType === "NEW_CLIENT_SIGNUP" ||
            a.activityType === "PACKET_GENERATED"
              ? "high"
              : "medium",
        }));

      // Determine timeframe label
      const hour = now.getHours();
      const timeframeLabel =
        hour < 12 ? "Morning Summary" : "Afternoon Summary";

      // Create notification log
      const notificationLog = await prisma.attorneyNotificationLog.create({
        data: {
          firmId: firm.id,
          notificationType: "SCHEDULED_SUMMARY",
          recipients: firm.users
            .map((u) => u.email)
            .filter((e): e is string => e !== null),
          subject: `Activity Summary — ${timeframeLabel}`,
          activityIds: activities.map((a) => a.id),
        },
      });

      // Mark activities as included in summary
      await prisma.attorneyActivityLog.updateMany({
        where: {
          id: { in: activities.map((a) => a.id) },
        },
        data: {
          includedInSummary: true,
          summaryEmailId: notificationLog.id,
        },
      });

      // Send to each attorney in the firm
      for (const attorney of firm.users) {
        if (!attorney.email) continue;
        try {
          await sendAttorneyActivitySummaryEmail({
            to: attorney.email,
            timeframeLabel,
            metrics,
            activities: activityItems,
          });

          results.emailsSent++;
          console.log(
            `Sent activity summary to ${attorney.email} for firm ${firm.name}`
          );
        } catch (error) {
          const errorMsg = `Failed to send summary to ${attorney.email}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in attorney summary cron:", error);
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

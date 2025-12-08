/**
 * DOJ Processing Metrics - Public API Endpoint
 *
 * Returns LIMITED metrics for public landing page
 * Creates urgency without revealing premium dashboard insights
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Get the most recent data point
    const latestData = await db.dOJDailyStats.findFirst({
      where: {
        claimCategory: "DOWNWINDER",
        scrapingSuccess: true,
      },
      orderBy: { reportDate: "desc" },
    });

    if (!latestData) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    // Calculate 7-day averages for recent velocity
    const sevenDaysAgo = subDays(latestData.reportDate, 7);
    const recentData = await db.dOJDailyStats.findMany({
      where: {
        claimCategory: "DOWNWINDER",
        scrapingSuccess: true,
        reportDate: {
          gte: sevenDaysAgo,
          lte: latestData.reportDate,
        },
      },
      orderBy: { reportDate: "asc" },
    });

    // Calculate averages
    const approvalsPerDay =
      recentData
        .filter((d) => d.dailyApproved !== null)
        .reduce((sum, d) => sum + (d.dailyApproved || 0), 0) /
      Math.max(recentData.filter((d) => d.dailyApproved !== null).length, 1);

    const submissionsPerDay =
      recentData
        .filter((d) => d.dailySubmitted !== null)
        .reduce((sum, d) => sum + (d.dailySubmitted || 0), 0) /
      Math.max(
        recentData.filter((d) => d.dailySubmitted !== null).length,
        1
      );

    // Calculate ratio
    const ratio =
      approvalsPerDay > 0 ? submissionsPerDay / approvalsPerDay : 0;

    // Calculate estimated wait time (30-day average for stability)
    const thirtyDaysAgo = subDays(latestData.reportDate, 30);
    const last30Days = await db.dOJDailyStats.findMany({
      where: {
        claimCategory: "DOWNWINDER",
        scrapingSuccess: true,
        reportDate: {
          gte: thirtyDaysAgo,
          lte: latestData.reportDate,
        },
      },
    });

    const avg30DayApprovals =
      last30Days
        .filter((d) => d.dailyApproved !== null)
        .reduce((sum, d) => sum + (d.dailyApproved || 0), 0) /
      Math.max(last30Days.filter((d) => d.dailyApproved !== null).length, 1);

    const estimatedWaitDays =
      avg30DayApprovals > 0
        ? Math.round(latestData.pending / avg30DayApprovals)
        : 180; // Default to 6 months if no data

    // Return ONLY the limited public data
    return NextResponse.json({
      queueSize: latestData.pending,
      estimatedWaitDays,
      applicationsPerDay: Math.round(submissionsPerDay * 10) / 10, // Round to 1 decimal
      approvalsPerDay: Math.round(approvalsPerDay * 10) / 10,
      ratio: Math.round(ratio * 10) / 10,
      asOfDate: latestData.reportDate.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching public DOJ metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

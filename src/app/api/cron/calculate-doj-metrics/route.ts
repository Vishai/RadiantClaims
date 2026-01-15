import { NextRequest, NextResponse } from "next/server";
import { calculateAllMetrics } from "@/lib/doj-metrics-calculator";

/**
 * Cron job endpoint to calculate DOJ processing metrics
 * Runs daily to update metrics based on latest DOJ data
 *
 * This should be called automatically by Vercel Cron
 * Schedule: Daily at 3 AM (after DOJ scraper runs at 2 AM)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting automated DOJ metrics calculation...");

    // Calculate metrics for all time windows
    const metrics = await calculateAllMetrics("DOWNWINDER");

    console.log(
      `✅ Successfully calculated metrics for ${metrics.length} time windows`
    );

    return NextResponse.json({
      success: true,
      metricsCalculated: metrics.length,
      windows: metrics.map((m) => m.windowType),
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in DOJ metrics calculation cron job:", error);
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

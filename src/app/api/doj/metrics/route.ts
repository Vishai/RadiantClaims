/**
 * DOJ Processing Metrics API Endpoint
 *
 * Returns comprehensive metrics about DOJ claim processing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { generateInsightsSummary } from "@/lib/doj-metrics-calculator";

export async function GET(_req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate insights for Downwinder claims
    const insights = await generateInsightsSummary("DOWNWINDER");

    if (!insights) {
      // Return a more helpful error with 503 (Service Unavailable) instead of 404
      // This indicates the service exists but data isn't ready yet
      return NextResponse.json(
        {
          error: "DOJ metrics not available",
          message:
            "Metrics haven't been calculated yet. Please run: npx tsx scripts/calculate-doj-metrics.ts",
          requiresData: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching DOJ metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch DOJ metrics" },
      { status: 500 }
    );
  }
}

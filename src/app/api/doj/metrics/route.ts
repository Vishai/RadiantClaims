/**
 * DOJ Processing Metrics API Endpoint
 *
 * Returns comprehensive metrics about DOJ claim processing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { generateInsightsSummary } from "@/lib/doj-metrics-calculator";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate insights for Downwinder claims
    const insights = await generateInsightsSummary("DOWNWINDER");

    if (!insights) {
      return NextResponse.json(
        { error: "No DOJ data available" },
        { status: 404 }
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

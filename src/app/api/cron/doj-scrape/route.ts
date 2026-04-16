import { NextRequest, NextResponse } from "next/server";
import { scrapeDOJDailyDataAPI } from "@/lib/doj-scraper-webfetch";

/**
 * GET /api/cron/doj-scrape
 *
 * Daily cron that scrapes DOJ RECA claim statistics (awards, denials,
 * pending count, dollars approved) from the DOJ Civil Division awards
 * page and persists them to the database. Powers the Daily DOJ Status
 * content pillar (see docs/CONTENT_PILLARS.md §Pillar 1) and the
 * DOJMetricsDashboard component in the portal.
 *
 * Schedule: 13:00 UTC daily (= 7am Mountain Time = morning content window)
 * Configured in vercel.json crons array.
 *
 * Vercel Cron sends GET requests by default. The existing scraper entry
 * point (`scrapeDOJDailyDataAPI`) targets "yesterday" so a morning run
 * picks up the previous day's now-finalized numbers.
 *
 * Authentication:
 *   If CRON_SECRET is set, we require `Authorization: Bearer <secret>`.
 *   Vercel Cron automatically sends this header when CRON_SECRET is
 *   configured as an environment variable.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Scrape yesterday's DOJ data — yesterday's numbers are finalized,
    // today's are still in-flight and can shift.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const started = Date.now();
    const result = await scrapeDOJDailyDataAPI(yesterday);
    const durationMs = Date.now() - started;

    return NextResponse.json({
      success: true,
      scrapedDate: yesterday.toISOString().slice(0, 10),
      durationMs,
      result,
    });
  } catch (error) {
    console.error("[cron/doj-scrape] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

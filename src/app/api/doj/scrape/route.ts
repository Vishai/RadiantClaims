import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseDOJForDate } from "@/lib/doj-scraper/parse";

/**
 * DOJ Scraping API Endpoint
 *
 * GET /api/doj/scrape?date=MMDDYYYY
 *
 * Fetches the DOJ Civil Division awards page for the specified date and
 * returns structured claim statistics. This endpoint is primarily used for
 * manual/admin triggering and debugging. The daily automated scrape runs
 * via `/api/cron/doj-scrape` (configured in vercel.json) which calls the
 * same underlying `fetchAndParseDOJForDate` helper directly.
 *
 * Date format: MMDDYYYY (e.g. 04142026)
 *
 * Returns:
 *   200 + parsed data on success
 *   400 on missing/invalid date
 *   404 on DOJ returning no data (e.g. weekend/holiday/future date)
 *   500 on unexpected scraper errors
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const dateParam = searchParams.get("date");

  if (!dateParam || !/^\d{8}$/.test(dateParam)) {
    return NextResponse.json(
      { error: "Missing or invalid date parameter (format: MMDDYYYY)" },
      { status: 400 }
    );
  }

  // Parse MMDDYYYY into a Date
  const month = parseInt(dateParam.slice(0, 2), 10);
  const day = parseInt(dateParam.slice(2, 4), 10);
  const year = parseInt(dateParam.slice(4, 8), 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid date", dateParam },
      { status: 400 }
    );
  }

  try {
    const data = await fetchAndParseDOJForDate(date);

    if (!data) {
      return NextResponse.json(
        {
          error: "DOJ returned no data for this date (weekend/holiday/future?)",
          dateParam,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error scraping DOJ:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape DOJ data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

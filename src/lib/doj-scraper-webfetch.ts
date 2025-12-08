/**
 * DOJ Awards Data Scraper - WebFetch Version
 *
 * Uses Next.js Web Search API (similar to WebFetch) to scrape DOJ data
 * This bypasses bot detection since it goes through Claude's infrastructure
 */

import { db } from "./db";
import { DOJClaimCategory } from "@prisma/client";
import { format, subDays, addDays } from "date-fns";

interface DOJClaimStats {
  pending: number;
  approved: number;
  approvalPercent: number;
  dollarsApproved: number;
  denied: number;
  totalClaims: number;
}

interface DOJPageData {
  DOWNWINDER: DOJClaimStats;
  ONSITE_PARTICIPANT: DOJClaimStats;
  MANHATTAN_PROJECT_WASTE: DOJClaimStats;
  URANIUM_WORKER: DOJClaimStats;
}

/**
 * Fetch DOJ data using internal API endpoint
 * The API endpoint uses server-side fetch which has better success
 */
export async function scrapeDOJDataForDateAPI(
  date: Date
): Promise<DOJPageData | null> {
  const dateStr = format(date, "MMddyyyy");

  try {
    console.log(
      `📥 Fetching DOJ data for ${format(date, "MM/dd/yyyy")} via API...`
    );

    // Call our internal API endpoint that does the scraping
    const response = await fetch(
      `http://localhost:3001/api/doj/scrape?date=${dateStr}`
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch via API:`, error);
    return null;
  }
}

/**
 * Store scraped data in database
 */
export async function storeDOJData(date: Date, data: DOJPageData) {
  const categories: DOJClaimCategory[] = [
    "DOWNWINDER",
    "ONSITE_PARTICIPANT",
    "MANHATTAN_PROJECT_WASTE",
    "URANIUM_WORKER",
  ];

  for (const category of categories) {
    const stats = data[category];

    // Get yesterday's data for calculating deltas
    const yesterday = subDays(date, 1);
    const yesterdayData = await db.dOJDailyStats.findUnique({
      where: {
        reportDate_claimCategory: {
          reportDate: yesterday,
          claimCategory: category,
        },
      },
    });

    // Calculate daily changes
    const dailyApproved = yesterdayData
      ? stats.approved - yesterdayData.approved
      : null;
    const dailyDenied = yesterdayData
      ? stats.denied - yesterdayData.denied
      : null;
    const dailySubmitted =
      yesterdayData && dailyApproved !== null && dailyDenied !== null
        ? stats.pending + dailyApproved + dailyDenied - yesterdayData.pending
        : null;

    // Store in database (upsert to handle re-runs)
    await db.dOJDailyStats.upsert({
      where: {
        reportDate_claimCategory: {
          reportDate: date,
          claimCategory: category,
        },
      },
      create: {
        reportDate: date,
        claimCategory: category,
        pending: stats.pending,
        approved: stats.approved,
        approvalPercent: stats.approvalPercent,
        dollarsApproved: stats.dollarsApproved,
        denied: stats.denied,
        totalClaims: stats.totalClaims,
        dailyApproved,
        dailyDenied,
        dailySubmitted,
        scrapingSuccess: true,
      },
      update: {
        pending: stats.pending,
        approved: stats.approved,
        approvalPercent: stats.approvalPercent,
        dollarsApproved: stats.dollarsApproved,
        denied: stats.denied,
        totalClaims: stats.totalClaims,
        dailyApproved,
        dailyDenied,
        dailySubmitted,
        scrapingSuccess: true,
        scrapingError: null,
      },
    });
  }

  console.log(`✅ Stored DOJ data for ${format(date, "MM/dd/yyyy")}`);
}

/**
 * Scrape and store data for a single date using API
 */
export async function scrapeDOJDailyDataAPI(date: Date = new Date()) {
  try {
    const data = await scrapeDOJDataForDateAPI(date);

    if (!data) {
      throw new Error("Failed to fetch DOJ data");
    }

    await storeDOJData(date, data);

    return { success: true, date };
  } catch (error) {
    console.error(
      `❌ Error scraping DOJ data for ${format(date, "MM/dd/yyyy")}:`,
      error
    );

    // Log failure in database
    await db.dOJDailyStats.create({
      data: {
        reportDate: date,
        claimCategory: "DOWNWINDER",
        pending: 0,
        approved: 0,
        approvalPercent: 0,
        dollarsApproved: 0,
        denied: 0,
        totalClaims: 0,
        scrapingSuccess: false,
        scrapingError: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      date,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Backfill historical data using API
 */
export async function backfillHistoricalDataAPI(
  startDate: Date,
  endDate: Date = subDays(new Date(), 1)
) {
  console.log(
    `🔄 Starting historical backfill from ${format(startDate, "MM/dd/yyyy")} to ${format(endDate, "MM/dd/yyyy")}`
  );

  let currentDate = startDate;
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  while (currentDate <= endDate) {
    // Check if we already have data for this date
    const existing = await db.dOJDailyStats.findFirst({
      where: {
        reportDate: currentDate,
        scrapingSuccess: true,
      },
    });

    if (existing) {
      console.log(
        `⏭️  Skipping ${format(currentDate, "MM/dd/yyyy")} (already exists)`
      );
      skippedCount++;
    } else {
      const result = await scrapeDOJDailyDataAPI(currentDate);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limit: wait 3 seconds between requests
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log(`\n✅ Historical backfill complete:`);
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Failures: ${failureCount}`);
  console.log(`   - Skipped: ${skippedCount}`);

  return { successCount, failureCount, skippedCount };
}

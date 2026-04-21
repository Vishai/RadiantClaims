/**
 * DOJ Awards Data Scraper - WebFetch Version
 *
 * Uses Next.js Web Search API (similar to WebFetch) to scrape DOJ data
 * This bypasses bot detection since it goes through Claude's infrastructure
 */

import { db } from "./db";
import { DOJClaimCategory } from "@prisma/client";
import { format, addDays, differenceInCalendarDays, subDays } from "date-fns";
import {
  fetchAndParseDOJForDate,
  type DOJClaimStats,
  type DOJPageData,
} from "./doj-scraper/parse";

// Re-export types for callers that still import them from this file
export type { DOJClaimStats, DOJPageData };

/**
 * Fetch DOJ data for a specific date.
 *
 * Previously went through an internal HTTP hop (localhost:3001/api/doj/scrape)
 * which worked in dev but silently failed in production. Now calls
 * `fetchAndParseDOJForDate` directly — single fetch, no internal routing.
 *
 * Returns null when the DOJ page doesn't exist (e.g. weekends, holidays)
 * or when the fetch fails. Callers should treat null as "no new data for
 * this date" and move on.
 */
export async function scrapeDOJDataForDateAPI(
  date: Date
): Promise<DOJPageData | null> {
  console.log(
    `📥 Fetching DOJ data for ${format(date, "MM/dd/yyyy")} directly...`
  );
  return fetchAndParseDOJForDate(date);
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

    // Find the most recent prior scrape with real data (not a failure row
    // and not an all-zeros category row). DOJ skips weekends/holidays, so
    // "yesterday" is unreliable as a reference point — always walk back to
    // the last known-good row for this category. Delta is then normalized
    // per calendar day elapsed so "dailyApproved" truly means per-day rate.
    const prior = await db.dOJDailyStats.findFirst({
      where: {
        reportDate: { lt: date },
        claimCategory: category,
        scrapingSuccess: true,
        totalClaims: { gt: 0 },
      },
      orderBy: { reportDate: "desc" },
    });

    let dailyApproved: number | null = null;
    let dailyDenied: number | null = null;
    let dailySubmitted: number | null = null;

    if (prior) {
      const daysBetween = Math.max(
        1,
        differenceInCalendarDays(date, prior.reportDate)
      );
      const approvedDelta = stats.approved - prior.approved;
      const deniedDelta = stats.denied - prior.denied;
      const submittedDelta =
        stats.pending +
        stats.approved +
        stats.denied -
        (prior.pending + prior.approved + prior.denied);
      dailyApproved = Math.round(approvedDelta / daysBetween);
      dailyDenied = Math.round(deniedDelta / daysBetween);
      dailySubmitted = Math.round(submittedDelta / daysBetween);
    }

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

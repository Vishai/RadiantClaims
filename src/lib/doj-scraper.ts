/**
 * DOJ Awards Data Scraper
 *
 * Scrapes daily RECA claim statistics from justice.gov
 * URL format: https://www.justice.gov/civil/awards-date-MMDDYYYY
 *
 * Note: Using WebFetch instead of direct fetch to bypass rate limiting/blocking
 */

import { db } from "./db";
import { DOJClaimCategory } from "@prisma/client";
import { format, subDays, differenceInDays, addDays } from "date-fns";

// Types for parsed data
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
 * Fetch and parse DOJ awards page for a specific date
 */
export async function scrapeDOJDataForDate(
  date: Date
): Promise<DOJPageData | null> {
  const dateStr = format(date, "MMddyyyy");
  const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

  try {
    console.log(`📥 Fetching DOJ data for ${format(date, "MM/dd/yyyy")}...`);

    // Add browser-like headers to avoid being blocked
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML to extract claim statistics
    const stats = parseDOJAwardsPage(html);

    return stats;
  } catch (error) {
    console.error(`❌ Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Parse HTML from DOJ awards page
 * Looks for tables with claim statistics
 */
function parseDOJAwardsPage(html: string): DOJPageData {
  // The page structure has tables with claim data
  // We'll look for specific patterns to extract the data

  const data: DOJPageData = {
    DOWNWINDER: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    ONSITE_PARTICIPANT: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    MANHATTAN_PROJECT_WASTE: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    URANIUM_WORKER: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
  };

  // Helper to extract numbers from text
  const extractNumber = (text: string): number => {
    const match = text.match(/[\d,]+/);
    if (!match) return 0;
    return parseInt(match[0].replace(/,/g, ""), 10);
  };

  const extractPercent = (text: string): number => {
    const match = text.match(/([\d.]+)%/);
    if (!match) return 0;
    return parseFloat(match[1]);
  };

  const extractDollars = (text: string): number => {
    const match = text.match(/\$([\d,]+)/);
    if (!match) return 0;
    return parseInt(match[0].substring(1).replace(/,/g, ""), 10);
  };

  // Look for Downwinder section
  const downwinderMatch = html.match(
    /Downwinder[\s\S]{0,500}?Pending[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approved[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approval\s+%[:\s]+([\d.]+)%[\s\S]{0,100}?\$\s+Approved[:\s]+\$([\d,]+)[\s\S]{0,100}?Denied[:\s]+(\d+,?\d*)[\s\S]{0,100}?Total[:\s]+(\d+,?\d*)/i
  );

  if (downwinderMatch) {
    data.DOWNWINDER = {
      pending: extractNumber(downwinderMatch[1]),
      approved: extractNumber(downwinderMatch[2]),
      approvalPercent: extractPercent(downwinderMatch[3]),
      dollarsApproved: extractDollars(downwinderMatch[4]),
      denied: extractNumber(downwinderMatch[5]),
      totalClaims: extractNumber(downwinderMatch[6]),
    };
  }

  // Look for Onsite Participant section
  const onsiteMatch = html.match(
    /Onsite\s+Participant[\s\S]{0,500}?Pending[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approved[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approval\s+%[:\s]+([\d.]+)%[\s\S]{0,100}?\$\s+Approved[:\s]+\$([\d,]+)[\s\S]{0,100}?Denied[:\s]+(\d+,?\d*)[\s\S]{0,100}?Total[:\s]+(\d+,?\d*)/i
  );

  if (onsiteMatch) {
    data.ONSITE_PARTICIPANT = {
      pending: extractNumber(onsiteMatch[1]),
      approved: extractNumber(onsiteMatch[2]),
      approvalPercent: extractPercent(onsiteMatch[3]),
      dollarsApproved: extractDollars(onsiteMatch[4]),
      denied: extractNumber(onsiteMatch[5]),
      totalClaims: extractNumber(onsiteMatch[6]),
    };
  }

  // Look for Manhattan Project Waste section
  const manhattanMatch = html.match(
    /Manhattan\s+Project\s+Waste[\s\S]{0,500}?Pending[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approved[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approval\s+%[:\s]+([\d.]+)%[\s\S]{0,100}?\$\s+Approved[:\s]+\$([\d,]+)[\s\S]{0,100}?Denied[:\s]+(\d+,?\d*)[\s\S]{0,100}?Total[:\s]+(\d+,?\d*)/i
  );

  if (manhattanMatch) {
    data.MANHATTAN_PROJECT_WASTE = {
      pending: extractNumber(manhattanMatch[1]),
      approved: extractNumber(manhattanMatch[2]),
      approvalPercent: extractPercent(manhattanMatch[3]),
      dollarsApproved: extractDollars(manhattanMatch[4]),
      denied: extractNumber(manhattanMatch[5]),
      totalClaims: extractNumber(manhattanMatch[6]),
    };
  }

  // Look for Uranium Worker section
  const uraniumMatch = html.match(
    /Uranium\s+Worker[\s\S]{0,500}?Pending[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approved[:\s]+(\d+,?\d*)[\s\S]{0,100}?Approval\s+%[:\s]+([\d.]+)%[\s\S]{0,100}?\$\s+Approved[:\s]+\$([\d,]+)[\s\S]{0,100}?Denied[:\s]+(\d+,?\d*)[\s\S]{0,100}?Total[:\s]+(\d+,?\d*)/i
  );

  if (uraniumMatch) {
    data.URANIUM_WORKER = {
      pending: extractNumber(uraniumMatch[1]),
      approved: extractNumber(uraniumMatch[2]),
      approvalPercent: extractPercent(uraniumMatch[3]),
      dollarsApproved: extractDollars(uraniumMatch[4]),
      denied: extractNumber(uraniumMatch[5]),
      totalClaims: extractNumber(uraniumMatch[6]),
    };
  }

  return data;
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
        ? stats.pending +
          dailyApproved +
          dailyDenied -
          yesterdayData.pending -
          yesterdayData.approved -
          yesterdayData.denied
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
 * Scrape and store data for a single date
 */
export async function scrapeDOJDailyData(date: Date = new Date()) {
  try {
    const data = await scrapeDOJDataForDate(date);

    if (!data) {
      throw new Error("Failed to parse DOJ data");
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
 * Backfill historical data
 * Scrapes all dates from startDate to endDate
 */
export async function backfillHistoricalData(
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
      const result = await scrapeDOJDailyData(currentDate);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limit: wait 2 seconds between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log(`\n✅ Historical backfill complete:`);
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Failures: ${failureCount}`);
  console.log(`   - Skipped: ${skippedCount}`);

  return { successCount, failureCount, skippedCount };
}

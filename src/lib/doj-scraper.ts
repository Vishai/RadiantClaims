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
import { format, subDays, addDays, startOfDay } from "date-fns";

function normalizeReportDate(date: Date): Date {
  // Enforce a stable key for the @@unique([reportDate, claimCategory]) constraint.
  // Without this, the same calendar day can be stored multiple times at different hours.
  return startOfDay(date);
}

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

// Array of user agents to rotate through (anti-detection)
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

/**
 * Get a random user agent from the pool
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
}

/**
 * Sleep for a random duration (anti-detection)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    // Random delay between 1-3 seconds (anti-detection)
    const delay = 1000 + Math.random() * 2000;
    console.log(`   Waiting ${Math.round(delay / 1000)}s before request...`);
    await sleep(delay);

    // Add browser-like headers to avoid being blocked
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
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
        Referer: "https://www.justice.gov/",
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
  // The page has HTML tables with claim data
  // We parse the table structure to extract numbers for each claim type

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

  // Helper to extract numbers from text (handles commas)
  const extractNumber = (text: string | undefined): number => {
    if (!text) return 0;
    const match = text.match(/[\d,]+/);
    if (!match) return 0;
    return parseInt(match[0].replace(/,/g, ""), 10);
  };

  // Helper to parse a table row with claim data
  // Format: ClaimType | Pending | Approved | %Approved | $Approved | Denied | Total
  const parseRow = (claimTypeName: string): DOJClaimStats | null => {
    // Match the claim type row with all its data cells
    // The HTML structure has the claim name followed by numbers in <td> or <p> tags
    const rowPattern = new RegExp(
      `${claimTypeName}[\\s\\S]*?` + // Claim type name
        `<p[^>]*?text-align-right[^>]*?>\\s*([\\d,]+)\\s*</p>[\\s\\S]*?` + // Pending
        `<p[^>]*?text-align-right[^>]*?>\\s*([\\d,]+)\\s*</p>[\\s\\S]*?` + // Approved
        `<p[^>]*?text-align-right[^>]*?>\\s*([\\d.]+)\\s*</p>[\\s\\S]*?` + // Approval %
        `<p[^>]*?text-align-right[^>]*?>\\s*\\$([\\d,]+)\\s*</p>[\\s\\S]*?` + // $ Approved
        `<p[^>]*?text-align-right[^>]*?>\\s*([\\d,]+)\\s*</p>[\\s\\S]*?` + // Denied
        `<p[^>]*?text-align-right[^>]*?>\\s*([\\d,]+)\\s*</p>`, // Total
      "i"
    );

    const match = html.match(rowPattern);
    if (!match) return null;

    return {
      pending: extractNumber(match[1]),
      approved: extractNumber(match[2]),
      approvalPercent: match[3] ? parseFloat(match[3]) : 0,
      dollarsApproved: extractNumber(match[4]),
      denied: extractNumber(match[5]),
      totalClaims: extractNumber(match[6]),
    };
  };

  // Parse each claim type
  const downwinderData = parseRow("Downwinder");
  if (downwinderData) {
    data.DOWNWINDER = downwinderData;
  }

  const onsiteData = parseRow("Onsite<span[^>]*?>[^<]*?</span>Participant");
  if (onsiteData) {
    data.ONSITE_PARTICIPANT = onsiteData;
  }

  const manhattanData = parseRow(
    "Manhattan<span[^>]*?>[^<]*?</span>Project<span[^>]*?>[^<]*?</span>Waste"
  );
  if (manhattanData) {
    data.MANHATTAN_PROJECT_WASTE = manhattanData;
  }

  const uraniumData = parseRow("Uranium<span[^>]*?>[^<]*?</span>Worker");
  if (uraniumData) {
    data.URANIUM_WORKER = uraniumData;
  }

  return data;
}

/**
 * Store scraped data in database
 */
export async function storeDOJData(date: Date, data: DOJPageData) {
  const reportDate = normalizeReportDate(date);
  const categories: DOJClaimCategory[] = [
    "DOWNWINDER",
    "ONSITE_PARTICIPANT",
    "MANHATTAN_PROJECT_WASTE",
    "URANIUM_WORKER",
  ];

  for (const category of categories) {
    const stats = data[category];

    // Find the previous successful publish-day for calculating deltas.
    // DOJ does not publish every calendar day (weekends/holidays), so comparing
    // to "yesterday" can create nonsensical negative deltas.
    const previousData = await db.dOJDailyStats.findFirst({
      where: {
        claimCategory: category,
        scrapingSuccess: true,
        reportDate: {
          lt: reportDate,
        },
      },
      orderBy: { reportDate: "desc" },
    });

    // Calculate changes vs the prior publish day (not necessarily yesterday)
    const dailyApproved = previousData
      ? stats.approved - previousData.approved
      : null;
    const dailyDenied = previousData
      ? stats.denied - previousData.denied
      : null;

    // New submissions are inferred from total-claims growth between publish days.
    // totalClaims = pending + approved + denied
    const currentTotal = stats.pending + stats.approved + stats.denied;
    const previousTotal = previousData
      ? previousData.pending + previousData.approved + previousData.denied
      : null;

    const dailySubmitted =
      previousTotal !== null ? currentTotal - previousTotal : null;

    // Store in database (upsert to handle re-runs)
    await db.dOJDailyStats.upsert({
      where: {
        reportDate_claimCategory: {
          reportDate: reportDate,
          claimCategory: category,
        },
      },
      create: {
        reportDate: reportDate,
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

  console.log(`✅ Stored DOJ data for ${format(reportDate, "MM/dd/yyyy")}`);
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

    // Log failure in database (normalized reportDate). We upsert so a later
    // successful run can overwrite the failure row for the same calendar day.
    const reportDate = normalizeReportDate(date);
    const categories: DOJClaimCategory[] = [
      "DOWNWINDER",
      "ONSITE_PARTICIPANT",
      "MANHATTAN_PROJECT_WASTE",
      "URANIUM_WORKER",
    ];

    for (const claimCategory of categories) {
      await db.dOJDailyStats.upsert({
        where: {
          reportDate_claimCategory: {
            reportDate,
            claimCategory,
          },
        },
        create: {
          reportDate,
          claimCategory,
          pending: 0,
          approved: 0,
          approvalPercent: 0,
          dollarsApproved: 0,
          denied: 0,
          totalClaims: 0,
          scrapingSuccess: false,
          scrapingError:
            error instanceof Error ? error.message : "Unknown error",
          dataSource: "http_scraper",
        },
        update: {
          scrapingSuccess: false,
          scrapingError:
            error instanceof Error ? error.message : "Unknown error",
          dataSource: "http_scraper",
        },
      });
    }

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
/**
 * Scrape and store DOJ stats for a specific date string (MMDDYYYY format)
 * Used by the daily scraper script
 */
export async function scrapeAndStoreDOJStats(dateString: string) {
  try {
    // Parse date from MMDDYYYY format
    const month = dateString.substring(0, 2);
    const day = dateString.substring(2, 4);
    const year = dateString.substring(4, 8);
    const date = normalizeReportDate(
      new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    );

    console.log(`\nScraping DOJ data for ${format(date, "MM/dd/yyyy")}...`);

    const data = await scrapeDOJDataForDate(date);

    if (!data) {
      return {
        success: false,
        error: "Failed to fetch or parse DOJ data",
        recordsCreated: 0,
        recordsUpdated: 0,
      };
    }

    // Store data in database
    await storeDOJData(date, data);

    // Count how many records were created/updated
    const categories: DOJClaimCategory[] = [
      "DOWNWINDER",
      "ONSITE_PARTICIPANT",
      "MANHATTAN_PROJECT_WASTE",
      "URANIUM_WORKER",
    ];

    return {
      success: true,
      recordsCreated: categories.length,
      recordsUpdated: 0,
    };
  } catch (error) {
    console.error(`Error in scrapeAndStoreDOJStats:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      recordsCreated: 0,
      recordsUpdated: 0,
    };
  }
}

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

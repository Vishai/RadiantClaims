/**
 * DOJ Awards Data Scraper - Puppeteer Version
 *
 * Uses headless Chrome to bypass bot detection
 */

import puppeteer from "puppeteer";
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
 * Scrape DOJ data using Puppeteer
 */
export async function scrapeDOJDataWithPuppeteer(
  date: Date
): Promise<DOJPageData | null> {
  const dateStr = format(date, "MMddyyyy");
  const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

  let browser;

  try {
    console.log(
      `🌐 Launching browser to fetch ${format(date, "MM/dd/yyyy")}...`
    );

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to page
    console.log(`📥 Fetching ${url}...`);
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (!response || response.status() !== 200) {
      throw new Error(`HTTP ${response?.status() || "unknown"}`);
    }

    // Get page content
    const html = await page.content();

    // Parse the HTML
    const data = parseDOJAwardsPage(html);

    await browser.close();

    console.log(`✅ Successfully scraped ${format(date, "MM/dd/yyyy")}`);

    return data;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error(`❌ Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Parse HTML from DOJ awards page
 */
function parseDOJAwardsPage(html: string): DOJPageData {
  const extractNumber = (text: string): number => {
    const match = text.match(/[\d,]+/);
    if (!match) return 0;
    return parseInt(match[0].replace(/,/g, ""), 10);
  };

  const extractPercent = (text: string): number => {
    const match = text.match(/([\d.]+)/);
    if (!match) return 0;
    return parseFloat(match[1]);
  };

  const extractDollars = (text: string): number => {
    const match = text.match(/[\d,]+/);
    if (!match) return 0;
    return parseInt(match[0].replace(/,/g, ""), 10);
  };

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

  // Look for Downwinder section
  const downwinderMatch = html.match(
    /Downwinder[\s\S]{0,800}?Pending[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approved[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approval\s*%[:\s]*([\d.]+)[\s\S]{0,150}?\$\s*Approved[:\s]*\$?([\d,]+)[\s\S]{0,150}?Denied[:\s]*(\d+,?\d*)[\s\S]{0,150}?Total(?:\s+Claims)?[:\s]*(\d+,?\d*)/i
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

  // Look for Onsite Participant
  const onsiteMatch = html.match(
    /Onsite\s+Participant[\s\S]{0,800}?Pending[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approved[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approval\s*%[:\s]*([\d.]+)[\s\S]{0,150}?\$\s*Approved[:\s]*\$?([\d,]+)[\s\S]{0,150}?Denied[:\s]*(\d+,?\d*)[\s\S]{0,150}?Total(?:\s+Claims)?[:\s]*(\d+,?\d*)/i
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

  // Look for Manhattan Project Waste
  const manhattanMatch = html.match(
    /Manhattan\s+Project\s+Waste[\s\S]{0,800}?Pending[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approved[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approval\s*%[:\s]*([\d.]+)[\s\S]{0,150}?\$\s*Approved[:\s]*\$?([\d,]+)[\s\S]{0,150}?Denied[:\s]*(\d+,?\d*)[\s\S]{0,150}?Total(?:\s+Claims)?[:\s]*(\d+,?\d*)/i
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

  // Look for Uranium Worker
  const uraniumMatch = html.match(
    /Uranium\s+Worker[\s\S]{0,800}?Pending[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approved[:\s]*(\d+,?\d*)[\s\S]{0,150}?Approval\s*%[:\s]*([\d.]+)[\s\S]{0,150}?\$\s*Approved[:\s]*\$?([\d,]+)[\s\S]{0,150}?Denied[:\s]*(\d+,?\d*)[\s\S]{0,150}?Total(?:\s+Claims)?[:\s]*(\d+,?\d*)/i
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

  console.log(`💾 Stored DOJ data for ${format(date, "MM/dd/yyyy")}`);
}

/**
 * Scrape and store data for a single date
 */
export async function scrapeDOJDailyData(date: Date = new Date()) {
  try {
    const data = await scrapeDOJDataWithPuppeteer(date);

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

    // Log failure in database (use upsert to handle duplicates)
    await db.dOJDailyStats.upsert({
      where: {
        reportDate_claimCategory: {
          reportDate: date,
          claimCategory: "DOWNWINDER",
        },
      },
      create: {
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
      update: {
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
 */
export async function backfillHistoricalData(
  startDate: Date,
  endDate: Date = subDays(new Date(), 1)
) {
  console.log(
    `🔄 Starting historical backfill from ${format(startDate, "MM/dd/yyyy")} to ${format(endDate, "MM/dd/yyyy")}\n`
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

      // Rate limit: wait 5 seconds between requests (Puppeteer is slower)
      console.log("⏳ Waiting 5 seconds before next request...\n");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log(`\n✅ Historical backfill complete:`);
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Failures: ${failureCount}`);
  console.log(`   - Skipped: ${skippedCount}`);

  return { successCount, failureCount, skippedCount };
}

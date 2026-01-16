/**
 * Backfill DOJ Data using HTTP Scraper
 *
 * Uses simple HTTP requests (no Puppeteer) to avoid bot detection
 * Fills in missing dates from Dec 9, 2025 to yesterday
 */

import { db } from "../src/lib/db";
import { format, subDays, addDays } from "date-fns";

async function scrapeDateWithHTTP(date: Date) {
  const dateStr = format(date, "MMddyyyy");
  const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

  try {
    console.log(`🌐 Fetching ${format(date, "MM/dd/yyyy")}...`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.log(
        `⚠️  HTTP ${response.status} for ${format(date, "MM/dd/yyyy")} - likely no data (weekend/holiday)`
      );
      return { success: false, reason: "no_data" };
    }

    const html = await response.text();

    // Parse Downwinder data
    const downwinderMatch = html.match(
      /Downwinder[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
    );

    if (!downwinderMatch) {
      console.log(`⚠️  Could not parse data for ${format(date, "MM/dd/yyyy")}`);
      return { success: false, reason: "parse_failed" };
    }

    const extractNumber = (text: string | undefined): number => {
      if (!text) return 0;
      return parseInt(text.replace(/,/g, ""), 10);
    };

    const extractPercent = (text: string | undefined): number => {
      if (!text) return 0;
      return parseFloat(text);
    };

    const stats = {
      pending: extractNumber(downwinderMatch[1]),
      approved: extractNumber(downwinderMatch[2]),
      approvalPercent: extractPercent(downwinderMatch[3]),
      dollarsApproved: extractNumber(downwinderMatch[4]),
      denied: extractNumber(downwinderMatch[5]),
      totalClaims: extractNumber(downwinderMatch[6]),
    };

    // Get yesterday's data for calculating deltas
    const dayBefore = subDays(date, 1);
    const yesterdayData = await db.dOJDailyStats.findUnique({
      where: {
        reportDate_claimCategory: {
          reportDate: dayBefore,
          claimCategory: "DOWNWINDER",
        },
      },
    });

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

    // Store in database
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
        dataSource: "http_backfill",
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
        dataSource: "http_backfill",
        scrapingError: null,
      },
    });

    console.log(
      `✅ ${format(date, "MM/dd/yyyy")}: ${stats.pending} pending, ${stats.approved} approved`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `❌ Error scraping ${format(date, "MM/dd/yyyy")}:`,
      error instanceof Error ? error.message : error
    );
    return { success: false, reason: "error", error };
  }
}

async function main() {
  console.log("🚀 Starting HTTP Backfill for DOJ Data\n");

  const startDate = new Date("2025-12-09");
  startDate.setHours(7, 0, 0, 0);

  const endDate = subDays(new Date(), 1); // Yesterday
  endDate.setHours(7, 0, 0, 0);

  console.log(
    `Backfilling from ${format(startDate, "MM/dd/yyyy")} to ${format(endDate, "MM/dd/yyyy")}\n`
  );

  let currentDate = startDate;
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  while (currentDate <= endDate) {
    // Check if we already have data for this date
    const existing = await db.dOJDailyStats.findUnique({
      where: {
        reportDate_claimCategory: {
          reportDate: currentDate,
          claimCategory: "DOWNWINDER",
        },
      },
    });

    if (existing && existing.scrapingSuccess) {
      console.log(
        `⏭️  Skipping ${format(currentDate, "MM/dd/yyyy")} (already exists)`
      );
      skippedCount++;
    } else {
      const result = await scrapeDateWithHTTP(currentDate);

      if (result.success) {
        successCount++;
      } else if (result.reason === "no_data") {
        skippedCount++;
      } else {
        errorCount++;
      }

      // Rate limit: wait 2 seconds between requests
      console.log("⏳ Waiting 2 seconds...\n");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log("\n📊 Backfill Results:");
  console.log(`   ✅ Successfully scraped: ${successCount}`);
  console.log(`   ⏭️  Skipped (already exists or no data): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  await db.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error during backfill:", error);
  process.exit(1);
});

/**
 * Daily DOJ Scraper
 *
 * Runs once per day (Monday-Friday) to scrape updated statistics from the DOJ website.
 * Implements anti-detection measures to avoid sophisticated scraping countermeasures.
 *
 * Usage:
 * - Manual: npx tsx src/scripts/daily-doj-scraper.ts
 * - Scheduled: Set up as cron job or GitHub Action
 */

import { db } from "@/lib/db";
import { scrapeAndStoreDOJStats } from "@/lib/doj-scraper";
import { fillMissingDOJDaysUpTo } from "@/lib/doj-gap-filler";
import { subDays } from "date-fns";

async function runDailyScraper() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Skip weekends (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log(
      `Skipping scraper - today is ${today.toDateString()} (weekend)`
    );
    return;
  }

  console.log(`\n========================================`);
  console.log(`Daily DOJ Scraper - ${today.toISOString()}`);
  console.log(`========================================\n`);

  try {
    // Check if we already scraped today
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existingData = await db.dOJDailyStats.findFirst({
      where: {
        reportDate: {
          gte: todayStart,
          lt: todayEnd,
        },
        scrapingSuccess: true,
      },
    });

    if (existingData) {
      console.log(
        `✓ Data already scraped today (${existingData.reportDate.toISOString()})`
      );
      console.log(`  - Queue: ${existingData.pending} pending claims`);
      if (existingData.dailyApproved !== null) {
        console.log(`  - Approved: ${existingData.dailyApproved} claims`);
      }
      if (existingData.dailySubmitted !== null) {
        console.log(`  - Submitted: ${existingData.dailySubmitted} claims`);
      }
      console.log(`\nSkipping to avoid duplicate scraping.`);
      return;
    }

    console.log(`Starting scrape for ${today.toDateString()}...\n`);

    // 1) Fill missing days (weekends/holidays) so our analytics have a continuous series.
    await fillMissingDOJDaysUpTo(today);

    // 2) Scrape: DOJ might not publish today's page (holidays / delayed updates).
    // Try today, then walk backwards up to 7 days until we find a publish day.
    let result: Awaited<ReturnType<typeof scrapeAndStoreDOJStats>> | null =
      null;

    for (let i = 0; i <= 7; i++) {
      const d = subDays(today, i);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      const targetDate = `${month}${day}${year}`;

      console.log(`Attempt ${i + 1}/8: ${targetDate}`);
      // eslint-disable-next-line no-await-in-loop
      result = await scrapeAndStoreDOJStats(targetDate);

      if (result.success) {
        console.log(`\n✓ Successfully scraped DOJ data for ${targetDate}`);
        console.log(`  - Records created: ${result.recordsCreated || 0}`);
        console.log(`  - Records updated: ${result.recordsUpdated || 0}`);
        break;
      } else {
        console.warn(`  ✗ Not available / failed: ${result.error}`);
      }
    }

    if (!result?.success) {
      console.error(`\n✗ Failed to scrape DOJ data after 8 attempts`);
      console.error(`  - Last error: ${result?.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n✗ Scraper error:`, error);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`Scraper completed successfully`);
  console.log(`========================================\n`);
}

// Run the scraper
runDailyScraper()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

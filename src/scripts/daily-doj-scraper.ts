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

    // Run the scraper with anti-detection measures
    // The scrapeAndStoreDOJStats function should handle:
    // - Random user agents
    // - Request delays
    // - Rate limiting
    // - Error handling
    // Format date as MMDDYYYY
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();
    const targetDate = `${month}${day}${year}`;

    const result = await scrapeAndStoreDOJStats(targetDate);

    if (result.success) {
      console.log(`\n✓ Successfully scraped DOJ data for ${targetDate}`);
      console.log(`  - Records created: ${result.recordsCreated || 0}`);
      console.log(`  - Records updated: ${result.recordsUpdated || 0}`);
    } else {
      console.error(`\n✗ Failed to scrape DOJ data`);
      console.error(`  - Error: ${result.error}`);
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

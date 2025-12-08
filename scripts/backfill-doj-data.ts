/**
 * Historical DOJ Data Backfill Script
 *
 * Scrapes all available DOJ RECA claim data from 11/03/2024 to yesterday
 * Uses Puppeteer for reliable scraping
 *
 * Usage:
 *   npx tsx scripts/backfill-doj-data.ts
 */

import { backfillHistoricalData } from "../src/lib/doj-scraper-puppeteer";

async function main() {
  console.log("🚀 Starting DOJ Historical Data Backfill\n");

  // Earliest available date on justice.gov
  const startDate = new Date("2024-11-03");

  // Yesterday (today's data might not be available yet)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(0, 0, 0, 0);

  const result = await backfillHistoricalData(startDate, endDate);

  console.log("\n📊 Backfill Results:");
  console.log(
    `   Total processed: ${result.successCount + result.failureCount}`
  );
  console.log(`   ✅ Successful: ${result.successCount}`);
  console.log(`   ❌ Failed: ${result.failureCount}`);
  console.log(`   ⏭️  Skipped (already exists): ${result.skippedCount}`);

  if (result.failureCount > 0) {
    console.log(
      "\n⚠️  Some dates failed to scrape. Check the logs above for details."
    );
    process.exit(1);
  }

  console.log("\n✅ Backfill complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error during backfill:", error);
  process.exit(1);
});

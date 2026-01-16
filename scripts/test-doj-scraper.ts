/**
 * Test DOJ Scraper
 *
 * Quick test to verify scraping works for a single date
 * Uses Puppeteer for reliable scraping
 */

import { scrapeDOJDailyData } from "../src/lib/doj-scraper-puppeteer";

async function main() {
  console.log("🧪 Testing DOJ scraper with yesterday's date...\n");

  // Test with yesterday (today's data might not be published yet)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(7, 0, 0, 0); // Set to 7 AM to match scraper

  console.log(`Testing date: ${yesterday.toLocaleDateString()}\n`);

  const result = await scrapeDOJDailyData(yesterday);

  if (result.success) {
    console.log("\n✅ Test successful!");
    console.log("Data scraped and stored in database.");
  } else {
    console.log("\n❌ Test failed!");
    console.log("Error:", result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

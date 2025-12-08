/**
 * Test DOJ Scraper
 *
 * Quick test to verify scraping works for a single date
 * Uses Puppeteer for reliable scraping
 */

import { scrapeDOJDailyData } from "../src/lib/doj-scraper-puppeteer";

async function main() {
  console.log("🧪 Testing DOJ scraper with today's date...\n");

  // Test with Dec 5, 2024 (we know this exists)
  const testDate = new Date("2024-12-05");

  const result = await scrapeDOJDailyData(testDate);

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

/**
 * Test DOJ Scraper with a specific date
 */

import { scrapeDOJDailyData } from "../src/lib/doj-scraper-puppeteer";

async function main() {
  // Test with Dec 12, 2025 (Thursday - should have data)
  const testDate = new Date("2025-12-12");
  testDate.setHours(7, 0, 0, 0);

  console.log(
    `🧪 Testing DOJ scraper with ${testDate.toLocaleDateString()}...\n`
  );

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

/**
 * Test DOJ Scraper (Puppeteer)
 *
 * Usage:
 *   npx tsx scripts/test-doj-scraper-puppeteer.ts 02142026
 *   npx tsx scripts/test-doj-scraper-puppeteer.ts 02132026
 */

import { scrapeDOJDailyData } from "../src/lib/doj-scraper-puppeteer";

function parseMMDDYYYY(mmddyyyy: string): Date {
  const month = parseInt(mmddyyyy.slice(0, 2), 10);
  const day = parseInt(mmddyyyy.slice(2, 4), 10);
  const year = parseInt(mmddyyyy.slice(4, 8), 10);
  const d = new Date(year, month - 1, day);
  d.setHours(7, 0, 0, 0);
  return d;
}

async function main() {
  const dateArg = process.argv[2];
  if (!dateArg || !/^\d{8}$/.test(dateArg)) {
    console.error("Please provide a date as MMDDYYYY (e.g., 02142026)");
    process.exit(1);
  }

  const date = parseMMDDYYYY(dateArg);
  console.log(
    `🧪 Testing Puppeteer DOJ scraper for ${date.toLocaleDateString()} (${dateArg})...`
  );

  const res = await scrapeDOJDailyData(date);

  if (!res.success) {
    console.error("❌ Puppeteer scraper failed:", res.error);
    process.exit(1);
  }

  console.log("✅ Puppeteer scraper succeeded.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

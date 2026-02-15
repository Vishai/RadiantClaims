/**
 * Test DOJ Scraper (fetch-based)
 *
 * Verifies whether the plain fetch scraper works for a single date.
 * Usage:
 *   npx tsx scripts/test-doj-scraper-fetch.ts 02142026
 *   npx tsx scripts/test-doj-scraper-fetch.ts 02132026
 */

import { scrapeAndStoreDOJStats } from "../src/lib/doj-scraper";

async function main() {
  const dateArg = process.argv[2];
  if (!dateArg || !/^\d{8}$/.test(dateArg)) {
    console.error("Please provide a date as MMDDYYYY (e.g., 02142026)");
    process.exit(1);
  }

  console.log(`🧪 Testing fetch-based DOJ scraper for ${dateArg}...`);
  const res = await scrapeAndStoreDOJStats(dateArg);

  if (!res.success) {
    console.error("❌ Fetch-based scraper failed:", res.error);
    process.exit(1);
  }

  console.log("✅ Fetch-based scraper succeeded.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

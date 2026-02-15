/**
 * Backfill DOJ daily stats from 2026-01-01 through yesterday (or a provided end date).
 *
 * This uses the fetch-based scraper (not Puppeteer) because Puppeteer is blocked (401).
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/backfill-doj-jan-2026.ts
 *   npx tsx scripts/backfill-doj-jan-2026.ts 2026-02-13
 */

import { scrapeAndStoreDOJStats } from "../src/lib/doj-scraper";
import { fillMissingDOJDaysUpTo } from "../src/lib/doj-gap-filler";

function mmddyyyy(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}${day}${y}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const start = new Date("2026-01-01T00:00:00");
  start.setHours(0, 0, 0, 0);

  const endArg = process.argv[2];
  const end = endArg ? new Date(`${endArg}T00:00:00`) : new Date();
  if (!endArg) {
    // default: yesterday
    end.setDate(end.getDate() - 1);
  }
  end.setHours(0, 0, 0, 0);

  console.log(
    `🔄 Backfilling DOJ data: ${start.toDateString()} → ${end.toDateString()}`
  );

  let ok = 0;
  let fail = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = mmddyyyy(d);

    // DOJ does not reliably publish on weekends; we still try, but treat failures as non-fatal.
    console.log(`\n📅 ${d.toDateString()} (${ds})`);

    // Light pacing to reduce blocks
    const delay = 2500 + Math.random() * 4500;
    // eslint-disable-next-line no-await-in-loop
    await sleep(delay);

    // Retry a couple times for transient 403/5xx
    let success = false;
    let lastErr: string | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`  Attempt ${attempt}/3...`);
      // eslint-disable-next-line no-await-in-loop
      const res = await scrapeAndStoreDOJStats(ds);
      if (res.success) {
        success = true;
        break;
      }
      lastErr = res.error;

      // eslint-disable-next-line no-await-in-loop
      await sleep(1500 + Math.random() * 2500);
    }

    if (success) {
      ok++;
      console.log(`  ✅ Stored ${ds}`);
    } else {
      fail++;
      console.log(`  ⚠️  Could not fetch/parse ${ds} (${lastErr})`);
    }
  }

  // After backfill, fill missing days up to today for continuity.
  await fillMissingDOJDaysUpTo(new Date());

  console.log(`\n✅ Backfill complete. Success: ${ok}. Failures: ${fail}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

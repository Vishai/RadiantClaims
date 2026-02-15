/**
 * Compute exact weekly growth percent for DOWNWINDER queue.
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/compute-exact-weekly-growth.ts
 */

import { db } from "../src/lib/db";
import { subDays } from "date-fns";

async function main() {
  const latest = await db.dOJDailyStats.findFirst({
    where: { claimCategory: "DOWNWINDER", scrapingSuccess: true },
    orderBy: { reportDate: "desc" },
  });

  if (!latest) {
    console.log("No latest DOWNWINDER stat found.");
    return;
  }

  const sevenDaysAgo = subDays(latest.reportDate, 7);

  const prev = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory: "DOWNWINDER",
      scrapingSuccess: true,
      reportDate: { lte: sevenDaysAgo },
    },
    orderBy: { reportDate: "desc" },
  });

  console.log(
    `Latest: ${latest.reportDate.toISOString().slice(0, 10)} pending=${latest.pending}`
  );

  if (!prev) {
    console.log("No previous-week data point found.");
    return;
  }

  const change = latest.pending - prev.pending;
  const pct = (change / prev.pending) * 100;

  console.log(
    `Prev (<=7d ago): ${prev.reportDate.toISOString().slice(0, 10)} pending=${prev.pending}`
  );
  console.log(`Change: ${change}`);
  console.log(`Exact weekly growth %: ${pct}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

/**
 * Audit DOJ daily stats coverage (by calendar day).
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/audit-doj-coverage.ts
 */

import { db } from "../src/lib/db";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

const CATEGORY = "DOWNWINDER" as const;

function key(d: Date) {
  return startOfDay(d).toISOString().slice(0, 10);
}

async function main() {
  const rows = await db.dOJDailyStats.findMany({
    where: { claimCategory: CATEGORY, scrapingSuccess: true },
    orderBy: { reportDate: "asc" },
    select: { reportDate: true, dataSource: true },
  });

  if (rows.length === 0) {
    console.log("No successful DOJDailyStats rows found.");
    return;
  }

  const start = startOfDay(rows[0]!.reportDate);
  const end = startOfDay(rows[rows.length - 1]!.reportDate);

  const have = new Set(rows.map((r) => key(r.reportDate)));

  const missing: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const k = key(d);
    if (!have.has(k)) missing.push(k);
  }

  const rangeDays = differenceInCalendarDays(end, start) + 1;

  console.log(`Category: ${CATEGORY}`);
  console.log(`Range: ${key(start)} .. ${key(end)} (${rangeDays} days)`);
  console.log(`Successful records: ${rows.length}`);
  console.log(`Missing calendar days: ${missing.length}`);

  if (missing.length) {
    console.log("\nMissing days (last 60):");
    console.log(missing.slice(-60).join("\n"));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

/**
 * Inspect DOJDailyStats rows in a date window (DOWNWINDER)
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/inspect-doj-window.ts 2026-02-06 2026-02-13
 */

import { db } from "../src/lib/db";
import { startOfDay } from "date-fns";

async function main() {
  const startArg = process.argv[2];
  const endArg = process.argv[3];

  if (!startArg || !endArg) {
    console.error("Provide start and end dates like YYYY-MM-DD YYYY-MM-DD");
    process.exit(1);
  }

  const start = startOfDay(new Date(`${startArg}T00:00:00`));
  const end = startOfDay(new Date(`${endArg}T00:00:00`));

  const rows = await db.dOJDailyStats.findMany({
    where: {
      claimCategory: "DOWNWINDER",
      scrapingSuccess: true,
      reportDate: { gte: start, lte: end },
    },
    orderBy: { reportDate: "asc" },
    select: {
      reportDate: true,
      pending: true,
      approved: true,
      denied: true,
      dailySubmitted: true,
      dailyApproved: true,
      dataSource: true,
    },
  });

  console.table(
    rows.map((r) => ({
      date: r.reportDate.toISOString().slice(0, 10),
      pending: r.pending,
      approved: r.approved,
      denied: r.denied,
      dailySubmitted: r.dailySubmitted,
      dailyApproved: r.dailyApproved,
      src: r.dataSource,
    }))
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

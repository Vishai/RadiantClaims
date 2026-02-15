/**
 * Recompute DOJDailyStats deltas (dailyApproved/dailyDenied/dailySubmitted)
 * using the previous successful publish-day as the baseline.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/recompute-doj-deltas.ts 2026-01-01 2026-02-13
 */

import { db } from "../src/lib/db";
import { DOJClaimCategory } from "@prisma/client";
import { startOfDay } from "date-fns";

const CATEGORIES: DOJClaimCategory[] = [
  "DOWNWINDER",
  "ONSITE_PARTICIPANT",
  "MANHATTAN_PROJECT_WASTE",
  "URANIUM_WORKER",
];

async function main() {
  const startArg = process.argv[2];
  const endArg = process.argv[3];

  if (!startArg || !endArg) {
    console.error("Provide start and end like YYYY-MM-DD YYYY-MM-DD");
    process.exit(1);
  }

  const start = startOfDay(new Date(`${startArg}T00:00:00`));
  const end = startOfDay(new Date(`${endArg}T00:00:00`));

  let updated = 0;

  for (const claimCategory of CATEGORIES) {
    const rows = await db.dOJDailyStats.findMany({
      where: {
        claimCategory,
        scrapingSuccess: true,
        reportDate: { gte: start, lte: end },
      },
      orderBy: { reportDate: "asc" },
    });

    let prev: (typeof rows)[number] | null = null;

    for (const row of rows) {
      if (!prev) {
        // first datapoint in range: set null deltas
        await db.dOJDailyStats.update({
          where: { id: row.id },
          data: {
            dailyApproved: null,
            dailyDenied: null,
            dailySubmitted: null,
          },
        });
        updated++;
        prev = row;
        continue;
      }

      const dailyApproved = row.approved - prev.approved;
      const dailyDenied = row.denied - prev.denied;

      const rowTotal = row.pending + row.approved + row.denied;
      const prevTotal = prev.pending + prev.approved + prev.denied;
      const dailySubmitted = rowTotal - prevTotal;

      await db.dOJDailyStats.update({
        where: { id: row.id },
        data: {
          dailyApproved,
          dailyDenied,
          dailySubmitted,
        },
      });
      updated++;
      prev = row;
    }
  }

  console.log(`✅ Recomputed deltas. Rows updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

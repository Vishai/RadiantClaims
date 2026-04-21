/**
 * Recompute DOJDailyStats deltas (dailyApproved/dailyDenied/dailySubmitted)
 * using the previous successful publish-day as the baseline, normalized to
 * a per-CALENDAR-DAY rate (matches the scraper logic in
 * src/lib/doj-scraper-webfetch.ts → storeDOJData).
 *
 * Without normalization, a Monday scrape stores 3 calendar days of delta as
 * "yesterday's" count, inflating every downstream average. Dividing by
 * calendar-days-elapsed since the last successful scrape keeps rates
 * comparable across rows.
 *
 * Usage (all time):
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/recompute-doj-deltas.ts
 *
 * Usage (range):
 *   npx tsx scripts/recompute-doj-deltas.ts 2026-01-01 2026-02-13
 */

import { db } from "../src/lib/db";
import { DOJClaimCategory } from "@prisma/client";
import { differenceInCalendarDays, startOfDay } from "date-fns";

const CATEGORIES: DOJClaimCategory[] = [
  "DOWNWINDER",
  "ONSITE_PARTICIPANT",
  "MANHATTAN_PROJECT_WASTE",
  "URANIUM_WORKER",
];

async function main() {
  const startArg = process.argv[2];
  const endArg = process.argv[3];

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (startArg) dateFilter.gte = startOfDay(new Date(`${startArg}T00:00:00`));
  if (endArg) dateFilter.lte = startOfDay(new Date(`${endArg}T00:00:00`));

  let updated = 0;

  for (const claimCategory of CATEGORIES) {
    const rows = await db.dOJDailyStats.findMany({
      where: {
        claimCategory,
        scrapingSuccess: true,
        totalClaims: { gt: 0 },
        ...(startArg || endArg ? { reportDate: dateFilter } : {}),
      },
      orderBy: { reportDate: "asc" },
    });

    console.log(`[${claimCategory}] ${rows.length} rows`);

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

      const daysBetween = Math.max(
        1,
        differenceInCalendarDays(row.reportDate, prev.reportDate)
      );

      const approvedDelta = row.approved - prev.approved;
      const deniedDelta = row.denied - prev.denied;
      const rowTotal = row.pending + row.approved + row.denied;
      const prevTotal = prev.pending + prev.approved + prev.denied;
      const submittedDelta = rowTotal - prevTotal;

      const dailyApproved = Math.round(approvedDelta / daysBetween);
      const dailyDenied = Math.round(deniedDelta / daysBetween);
      const dailySubmitted = Math.round(submittedDelta / daysBetween);

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

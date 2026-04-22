/**
 * Backfill DOJDailyStats daily* fields so they represent a per-calendar-day
 * rate instead of the raw delta between publish days.
 *
 * Historical rows were written by an older storeDOJData that did:
 *   dailySubmitted = currentTotal - previousTotal
 * — without dividing by days elapsed since the previous publish. After a long
 * weekend or holiday, that raw delta gets stored as a single day's volume,
 * which shows up in the Daily DOJ Post as numbers like "15,204 new
 * applications yesterday."
 *
 * This script walks each claim category in reportDate order, finds the most
 * recent prior known-good row (scrapingSuccess=true, totalClaims>0), and
 * rewrites dailyApproved / dailyDenied / dailySubmitted using the same
 * daysBetween normalization now used at write time.
 *
 * Safe to re-run (idempotent). Does NOT touch rows inserted by the gap-filler
 * (totalClaims=0, dataSource="imputed") — those intentionally stay zeroed.
 *
 * Usage:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/backfill-doj-daily-deltas.ts --dry-run
 *   npx tsx scripts/backfill-doj-daily-deltas.ts --apply
 */

import { db } from "../src/lib/db";
import { DOJClaimCategory } from "@prisma/client";
import { differenceInCalendarDays, format } from "date-fns";

const CATEGORIES: DOJClaimCategory[] = [
  "DOWNWINDER",
  "ONSITE_PARTICIPANT",
  "MANHATTAN_PROJECT_WASTE",
  "URANIUM_WORKER",
];

async function main() {
  const mode = process.argv.includes("--apply")
    ? "apply"
    : process.argv.includes("--dry-run")
      ? "dry-run"
      : null;

  if (!mode) {
    console.error("Pass --dry-run or --apply");
    process.exit(1);
  }

  console.log(`Mode: ${mode}\n`);

  let totalChanged = 0;
  let totalScanned = 0;

  for (const category of CATEGORIES) {
    const rows = await db.dOJDailyStats.findMany({
      where: {
        claimCategory: category,
        scrapingSuccess: true,
        totalClaims: { gt: 0 },
      },
      orderBy: { reportDate: "asc" },
    });

    console.log(`── ${category}: ${rows.length} rows ──`);

    let prior: (typeof rows)[number] | null = null;
    let changedInCategory = 0;

    for (const row of rows) {
      totalScanned++;

      let newApproved: number | null = null;
      let newDenied: number | null = null;
      let newSubmitted: number | null = null;

      if (prior) {
        const daysBetween = Math.max(
          1,
          differenceInCalendarDays(row.reportDate, prior.reportDate)
        );
        const approvedDelta = row.approved - prior.approved;
        const deniedDelta = row.denied - prior.denied;
        const currentTotal = row.pending + row.approved + row.denied;
        const priorTotal = prior.pending + prior.approved + prior.denied;
        const submittedDelta = currentTotal - priorTotal;

        newApproved = Math.round(approvedDelta / daysBetween);
        newDenied = Math.round(deniedDelta / daysBetween);
        newSubmitted = Math.round(submittedDelta / daysBetween);
      }

      const changed =
        row.dailyApproved !== newApproved ||
        row.dailyDenied !== newDenied ||
        row.dailySubmitted !== newSubmitted;

      if (changed) {
        changedInCategory++;
        totalChanged++;
        const dateStr = format(row.reportDate, "yyyy-MM-dd");
        console.log(
          `  ${dateStr}  submitted ${row.dailySubmitted} → ${newSubmitted}  ` +
            `approved ${row.dailyApproved} → ${newApproved}  ` +
            `denied ${row.dailyDenied} → ${newDenied}`
        );

        if (mode === "apply") {
          await db.dOJDailyStats.update({
            where: {
              reportDate_claimCategory: {
                reportDate: row.reportDate,
                claimCategory: category,
              },
            },
            data: {
              dailyApproved: newApproved,
              dailyDenied: newDenied,
              dailySubmitted: newSubmitted,
            },
          });
        }
      }

      prior = row;
    }

    console.log(`  → ${changedInCategory} rows changed\n`);
  }

  console.log(
    `\nScanned ${totalScanned} rows. ${totalChanged} would change.` +
      (mode === "dry-run" ? " Re-run with --apply to write." : " Applied.")
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

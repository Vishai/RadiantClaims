/**
 * One-off: the Apr 20 2026 scrape produced all-zero rows for ONSITE_PARTICIPANT,
 * MANHATTAN_PROJECT_WASTE, and URANIUM_WORKER (parser failed on 3 of 4 tables),
 * then storeDOJData computed massive negative deltas against the real Apr 19
 * prior rows. This script rewrites those three rows as proper gap-fill
 * carry-forwards from Apr 19.
 *
 * The DOWNWINDER row for Apr 20 is fine and is left alone.
 *
 * Usage:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/_tmp_fix_apr20_broken_rows.ts --dry-run
 *   npx tsx scripts/_tmp_fix_apr20_broken_rows.ts --apply
 */

import { db } from "../src/lib/db";
import { DOJClaimCategory } from "@prisma/client";

const BROKEN_CATS: DOJClaimCategory[] = [
  "ONSITE_PARTICIPANT",
  "MANHATTAN_PROJECT_WASTE",
  "URANIUM_WORKER",
];

const APR_19 = new Date("2026-04-19T00:00:00.000Z");
const APR_20 = new Date("2026-04-20T00:00:00.000Z");

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

  for (const category of BROKEN_CATS) {
    const prior = await db.dOJDailyStats.findUnique({
      where: {
        reportDate_claimCategory: {
          reportDate: APR_19,
          claimCategory: category,
        },
      },
    });
    if (!prior) {
      console.warn(`No Apr 19 row for ${category} — skipping`);
      continue;
    }

    const current = await db.dOJDailyStats.findUnique({
      where: {
        reportDate_claimCategory: {
          reportDate: APR_20,
          claimCategory: category,
        },
      },
    });
    if (!current) {
      console.warn(`No Apr 20 row for ${category} — skipping`);
      continue;
    }

    console.log(
      `${category}:  was pending=${current.pending} total=${current.totalClaims} dSub=${current.dailySubmitted}  ` +
        `→ will become pending=${prior.pending} total=${prior.totalClaims} dSub=0`
    );

    if (mode === "apply") {
      await db.dOJDailyStats.update({
        where: {
          reportDate_claimCategory: {
            reportDate: APR_20,
            claimCategory: category,
          },
        },
        data: {
          pending: prior.pending,
          approved: prior.approved,
          approvalPercent: prior.approvalPercent,
          dollarsApproved: prior.dollarsApproved,
          denied: prior.denied,
          totalClaims: prior.totalClaims,
          dailyApproved: 0,
          dailyDenied: 0,
          dailySubmitted: 0,
          dataSource: "imputed",
          scrapingError: null,
        },
      });
    }
  }

  console.log(
    mode === "dry-run" ? "\nDry-run only. Re-run with --apply." : "\nApplied."
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

/**
 * Audit DOJDailyStats deltas for obvious problems.
 * Flags:
 * - negative dailyApproved/dailyDenied/dailySubmitted
 * - totals that decrease between successive successful publish days
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/audit-doj-deltas.ts 2026-01-01 2026-02-13
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

  const issues: any[] = [];

  for (const claimCategory of CATEGORIES) {
    const rows = await db.dOJDailyStats.findMany({
      where: {
        claimCategory,
        scrapingSuccess: true,
        reportDate: { gte: start, lte: end },
      },
      orderBy: { reportDate: "asc" },
      select: {
        reportDate: true,
        pending: true,
        approved: true,
        denied: true,
        dailyApproved: true,
        dailyDenied: true,
        dailySubmitted: true,
        dataSource: true,
      },
    });

    let prevTotal: number | null = null;
    for (const r of rows) {
      const total = r.pending + r.approved + r.denied;
      const date = r.reportDate.toISOString().slice(0, 10);

      if (prevTotal !== null && total < prevTotal) {
        issues.push({
          claimCategory,
          date,
          issue: "total_decreased",
          prevTotal,
          total,
        });
      }

      const neg = (n: number | null) => n !== null && n < 0;
      if (neg(r.dailyApproved)) {
        issues.push({
          claimCategory,
          date,
          issue: "negative_dailyApproved",
          value: r.dailyApproved,
        });
      }
      if (neg(r.dailyDenied)) {
        issues.push({
          claimCategory,
          date,
          issue: "negative_dailyDenied",
          value: r.dailyDenied,
        });
      }
      if (neg(r.dailySubmitted)) {
        issues.push({
          claimCategory,
          date,
          issue: "negative_dailySubmitted",
          value: r.dailySubmitted,
        });
      }

      prevTotal = total;
    }
  }

  console.log(`Issues found: ${issues.length}`);
  if (issues.length) {
    console.table(issues.slice(0, 50));
    if (issues.length > 50) {
      console.log(`(showing first 50)`);
    }
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

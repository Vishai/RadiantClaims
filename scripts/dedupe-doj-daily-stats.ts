/**
 * Dedupe DOJDailyStats by calendar day + claimCategory.
 *
 * Why:
 * - Historically we stored reportDate with different times (e.g., 00:00 vs 07:00),
 *   which defeats the @@unique([reportDate, claimCategory]) intent.
 * - This can cause the UI/metrics to pick up the wrong record (often the 0/0 failure row).
 *
 * What it does:
 * - Groups rows by start-of-day(reportDate) + claimCategory
 * - Picks a "winner" row (prefer scrapingSuccess=true; then newest scrapedAt)
 * - Rewrites the winner's reportDate to start-of-day
 * - Deletes the other rows in that group
 *
 * DRY RUN by default. To execute deletions/updates, pass --apply
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/dedupe-doj-daily-stats.ts        # dry run
 *   npx tsx scripts/dedupe-doj-daily-stats.ts --apply
 */

import { db } from "../src/lib/db";

/**
 * UTC-midnight start-of-day. Previously this file used date-fns `startOfDay`
 * which normalizes to LOCAL-timezone midnight — that incorrectly grouped
 * rows like (Apr 17 00:00Z) and (Apr 16 13:00Z) into the same "Apr 16 local"
 * bucket, even though they represent two distinct DOJ publish days. Merging
 * them would overwrite Apr 16's data with Apr 17's.
 */
function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

const apply = process.argv.includes("--apply");

type Row = {
  id: string;
  reportDate: Date;
  scrapedAt: Date;
  claimCategory: string;
  scrapingSuccess: boolean;
  pending: number;
  approved: number;
  denied: number;
  totalClaims: number;
};

function key(row: Row) {
  return `${startOfUTCDay(row.reportDate).toISOString()}|${row.claimCategory}`;
}

async function main() {
  const rows = (await db.dOJDailyStats.findMany({
    select: {
      id: true,
      reportDate: true,
      scrapedAt: true,
      claimCategory: true,
      scrapingSuccess: true,
      pending: true,
      approved: true,
      denied: true,
      totalClaims: true,
    },
    orderBy: { reportDate: "asc" },
  })) as Row[];

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = key(r);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const dupes = [...groups.entries()].filter(([, g]) => g.length > 1);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Duplicate day+category groups: ${dupes.length}`);

  let deleteCount = 0;
  let updateCount = 0;

  for (const [k, g] of dupes) {
    // Winner selection:
    // 1) prefer scrapingSuccess true
    // 2) prefer higher totals (approved+pending+denied)
    // 3) prefer newest scrapedAt
    const sorted = [...g].sort((a, b) => {
      if (a.scrapingSuccess !== b.scrapingSuccess) {
        return a.scrapingSuccess ? -1 : 1;
      }
      const aTot = a.approved + a.pending + a.denied;
      const bTot = b.approved + b.pending + b.denied;
      if (aTot !== bTot) return bTot - aTot;
      return b.scrapedAt.getTime() - a.scrapedAt.getTime();
    });

    const winner = sorted[0]!;
    const losers = sorted.slice(1);

    const normalized = startOfUTCDay(winner.reportDate);

    console.log(`\n${k}`);
    console.log(
      `  winner: ${winner.id} ${winner.reportDate.toISOString()} success=${winner.scrapingSuccess} pending=${winner.pending} approved=${winner.approved}`
    );
    for (const l of losers) {
      console.log(
        `  delete: ${l.id} ${l.reportDate.toISOString()} success=${l.scrapingSuccess} pending=${l.pending} approved=${l.approved}`
      );
    }

    if (!apply) continue;

    // Delete losers FIRST — if a loser already sits at the normalized
    // midnight-UTC timestamp and we try to update the winner's reportDate
    // to that same value before the loser is gone, we hit P2002 on the
    // (reportDate, claimCategory) unique constraint.
    await db.dOJDailyStats.deleteMany({
      where: { id: { in: losers.map((l) => l.id) } },
    });
    deleteCount += losers.length;

    // Now normalize the winner's reportDate (may already be normalized)
    if (winner.reportDate.getTime() !== normalized.getTime()) {
      await db.dOJDailyStats.update({
        where: { id: winner.id },
        data: { reportDate: normalized },
      });
      updateCount++;
    }
  }

  if (apply) {
    console.log(`\nApplied. Updated: ${updateCount}. Deleted: ${deleteCount}.`);
  } else {
    console.log(
      `\nDry run only. Re-run with --apply to update/delete. Would delete: ${dupes.reduce(
        (sum, [, g]) => sum + (g.length - 1),
        0
      )}`
    );
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

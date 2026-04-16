import { db } from "@/lib/db";
import type { DOJDailyStats } from "@prisma/client";

/**
 * Data-access layer for the Daily DOJ Post generator.
 *
 * The scraper writes one row per (reportDate, claimCategory) pair into
 * `dOJDailyStats`. For the Daily DOJ content pillar we typically want
 * aggregates across all four categories (DOWNWINDER, ONSITE_PARTICIPANT,
 * MANHATTAN_PROJECT_WASTE, URANIUM_WORKER), since the social audience
 * thinks of "the RECA program" as one thing.
 *
 * All functions gracefully handle missing data and return nulls so the
 * generator can decide whether to fall back to placeholder text.
 */

export interface AggregateStats {
  reportDate: Date;
  dailySubmitted: number;
  dailyApproved: number;
  dailyDenied: number;
  pending: number;
  approved: number;
  denied: number;
  totalClaims: number;
  rowCount: number; // how many category rows contributed
}

/**
 * Sum the four category rows for a single report date. Returns null
 * if no rows exist for that date (e.g. the scraper hasn't run yet).
 */
export async function getAggregateForDate(
  date: Date
): Promise<AggregateStats | null> {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const rows = await db.dOJDailyStats.findMany({
    where: {
      reportDate: { gte: start, lte: end },
      scrapingSuccess: true,
    },
  });

  if (rows.length === 0) return null;

  return aggregate(rows);
}

/**
 * Get the most recent aggregate available — useful when you want
 * "yesterday's numbers" but the scraper may be a day behind for
 * various reasons (weekends, DOJ publishing delays, etc.).
 */
export async function getMostRecentAggregate(): Promise<AggregateStats | null> {
  // Find the most recent reportDate with at least one successful row
  const latest = await db.dOJDailyStats.findFirst({
    where: { scrapingSuccess: true },
    orderBy: { reportDate: "desc" },
    select: { reportDate: true },
  });

  if (!latest) return null;
  return getAggregateForDate(latest.reportDate);
}

/**
 * Sum daily deltas over a date range (inclusive). Used for Monday's
 * weekly reset and Friday's weekly summary.
 */
export async function getRangeAggregate(
  startDate: Date,
  endDate: Date
): Promise<AggregateStats | null> {
  const rows = await db.dOJDailyStats.findMany({
    where: {
      reportDate: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      scrapingSuccess: true,
    },
  });

  if (rows.length === 0) return null;

  // For ranges, cumulative fields (pending, approved, denied, totalClaims)
  // should use the LATEST row's values, not a sum. Daily deltas should sum.
  const sortedByDate = [...rows].sort(
    (a, b) => b.reportDate.getTime() - a.reportDate.getTime()
  );
  const latestDate = sortedByDate[0]!.reportDate;
  const latestRows = rows.filter(
    (r) => r.reportDate.getTime() === latestDate.getTime()
  );

  const deltaSummed = rows.reduce(
    (acc, r) => ({
      dailySubmitted: acc.dailySubmitted + (r.dailySubmitted ?? 0),
      dailyApproved: acc.dailyApproved + (r.dailyApproved ?? 0),
      dailyDenied: acc.dailyDenied + (r.dailyDenied ?? 0),
    }),
    { dailySubmitted: 0, dailyApproved: 0, dailyDenied: 0 }
  );

  const latestAgg = aggregate(latestRows);

  return {
    ...latestAgg,
    reportDate: latestDate,
    dailySubmitted: deltaSummed.dailySubmitted,
    dailyApproved: deltaSummed.dailyApproved,
    dailyDenied: deltaSummed.dailyDenied,
    rowCount: rows.length,
  };
}

/**
 * Compute an average daily approval rate from the last N days of data.
 * Used to estimate the queue wait time.
 */
export async function getAverageDailyApprovalRate(
  days: number = 14
): Promise<number | null> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const rows = await db.dOJDailyStats.findMany({
    where: {
      reportDate: { gte: startOfDay(start), lte: endOfDay(end) },
      scrapingSuccess: true,
      dailyApproved: { not: null },
    },
    select: { dailyApproved: true, reportDate: true },
  });

  if (rows.length === 0) return null;

  // Group by date, sum categories for each date, then average over dates
  const byDate = new Map<string, number>();
  for (const r of rows) {
    const key = r.reportDate.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + (r.dailyApproved ?? 0));
  }
  const dailyTotals = Array.from(byDate.values());
  const sum = dailyTotals.reduce((a, b) => a + b, 0);
  return sum / dailyTotals.length;
}

// ─── internals ─────────────────────────────────────────────────

function aggregate(rows: DOJDailyStats[]): AggregateStats {
  const reportDate = rows[0]!.reportDate;
  return {
    reportDate,
    dailySubmitted: sum(rows.map((r) => r.dailySubmitted ?? 0)),
    dailyApproved: sum(rows.map((r) => r.dailyApproved ?? 0)),
    dailyDenied: sum(rows.map((r) => r.dailyDenied ?? 0)),
    pending: sum(rows.map((r) => r.pending)),
    approved: sum(rows.map((r) => r.approved)),
    denied: sum(rows.map((r) => r.denied)),
    totalClaims: sum(rows.map((r) => r.totalClaims)),
    rowCount: rows.length,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(23, 59, 59, 999);
  return out;
}

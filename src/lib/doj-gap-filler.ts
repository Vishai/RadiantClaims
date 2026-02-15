/**
 * DOJ Gap Filler
 *
 * DOJ doesn't publish updates on weekends/holidays. For UI/analytics we want a
 * continuous daily time series, so we "carry forward" the most recent *successful*
 * totals into missing dates.
 *
 * This does NOT invent new DOJ changes; it simply creates flat days with
 * dailyApproved/dailyDenied/dailySubmitted = 0 so charts/timelines don't break.
 */

import { db } from "./db";
import { DOJClaimCategory } from "@prisma/client";
import { addDays, format, startOfDay, subDays } from "date-fns";

const CATEGORIES: DOJClaimCategory[] = [
  "DOWNWINDER",
  "ONSITE_PARTICIPANT",
  "MANHATTAN_PROJECT_WASTE",
  "URANIUM_WORKER",
];

function normalize(d: Date) {
  return startOfDay(d);
}

export async function fillMissingDOJDaysUpTo(targetDate: Date) {
  const target = normalize(targetDate);
  const lastDayToFill = normalize(subDays(target, 1));

  const latest = await db.dOJDailyStats.findFirst({
    where: { scrapingSuccess: true },
    orderBy: { reportDate: "desc" },
    select: { reportDate: true },
  });

  if (!latest) return { filledDays: 0 };

  const latestDate = normalize(latest.reportDate);
  if (latestDate >= lastDayToFill) return { filledDays: 0 };

  const latestTotals = await db.dOJDailyStats.findMany({
    where: {
      reportDate: latestDate,
      scrapingSuccess: true,
      claimCategory: { in: CATEGORIES },
    },
  });

  if (latestTotals.length === 0) return { filledDays: 0 };

  let filledDays = 0;
  let current = addDays(latestDate, 1);

  while (current <= lastDayToFill) {
    for (const category of CATEGORIES) {
      const base = latestTotals.find((t) => t.claimCategory === category);
      if (!base) continue;

      await db.dOJDailyStats.upsert({
        where: {
          reportDate_claimCategory: {
            reportDate: current,
            claimCategory: category,
          },
        },
        create: {
          reportDate: current,
          claimCategory: category,
          pending: base.pending,
          approved: base.approved,
          approvalPercent: base.approvalPercent,
          dollarsApproved: base.dollarsApproved,
          denied: base.denied,
          totalClaims: base.totalClaims,
          dailyApproved: 0,
          dailyDenied: 0,
          dailySubmitted: 0,
          scrapingSuccess: true,
          scrapingError: null,
          dataSource: "imputed",
        },
        update: {
          pending: base.pending,
          approved: base.approved,
          approvalPercent: base.approvalPercent,
          dollarsApproved: base.dollarsApproved,
          denied: base.denied,
          totalClaims: base.totalClaims,
          dailyApproved: 0,
          dailyDenied: 0,
          dailySubmitted: 0,
          scrapingSuccess: true,
          scrapingError: null,
          dataSource: "imputed",
        },
      });
    }

    filledDays++;
    current = addDays(current, 1);
  }

  console.log(
    `🧩 Filled ${filledDays} missing DOJ day(s) through ${format(lastDayToFill, "MM/dd/yyyy")}`
  );

  return { filledDays };
}

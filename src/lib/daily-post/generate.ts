import {
  getAggregateForDate,
  getMostRecentAggregate,
  getAverageDailyApprovalRate,
  type AggregateStats,
} from "./query";

/**
 * Generate the Daily DOJ Status post for a given reference date.
 *
 * Single template — an emoji-bulleted summary of yesterday's Downwinder
 * numbers plus a wait-time estimate. The shape is designed to be pasted
 * directly into Meta Business Suite.
 *
 * If data is missing (scraper hasn't run yet), placeholders are left in
 * place with a "[DATA PENDING]" marker so the operator knows to refill
 * before posting.
 */

export type DayTemplate = "monday" | "wednesday" | "friday" | "standard";

export interface DailyPostResult {
  text: string;
  template: DayTemplate;
  referenceDate: Date;
  hasData: boolean;
  warnings: string[];
}

export async function generateDailyPost(
  referenceDate: Date = new Date()
): Promise<DailyPostResult> {
  const template = selectTemplate(referenceDate);
  const warnings: string[] = [];

  // Yesterday's numbers (the scraper targets "yesterday")
  const yesterday = new Date(referenceDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const todayStats = await getAggregateForDate(yesterday);
  const mostRecent = todayStats ?? (await getMostRecentAggregate());

  if (!todayStats) {
    warnings.push(
      `No scraped data for ${yesterday.toISOString().slice(0, 10)}. Using most recent data instead.`
    );
  }
  if (!mostRecent) {
    warnings.push(
      "No DOJ stats available at all. Post will use [DATA PENDING] placeholders."
    );
  }

  const approvalRate = await getAverageDailyApprovalRate(14);
  const estimatedWaitMonths = estimateWaitMonths(
    mostRecent?.pending ?? null,
    approvalRate
  );

  const text = generateDaily(yesterday, mostRecent, estimatedWaitMonths);

  return {
    text,
    template,
    referenceDate,
    hasData: mostRecent !== null,
    warnings,
  };
}

// ─── template selector (kept for API compat; always "standard") ─

function selectTemplate(_date: Date): DayTemplate {
  return "standard";
}

// ─── template ──────────────────────────────────────────────────

// Short weekday abbreviations matching the preferred post style
// ("Tues"/"Thurs" are intentional to match the social-copy voice).
const SHORT_DAYS = [
  "Sun",
  "Mon",
  "Tues",
  "Wed",
  "Thurs",
  "Fri",
  "Sat",
] as const;

function headerLine(dataDate: Date): string {
  const parts = dataDate
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Denver",
    })
    .split(", ");
  // parts = ["Tue", "Apr 21"] — override the weekday to our preferred abbrev
  const dow = SHORT_DAYS[dataDate.getUTCDay()];
  const md = parts[1] ?? parts[0];
  return `📊 RECA Queue Status — ${dow}, ${md}`;
}

function generateDaily(
  dataDate: Date,
  stats: AggregateStats | null,
  waitMonths: number | null
): string {
  const header = headerLine(dataDate);
  const submitted = stats?.dailySubmitted ?? null;
  const approved = stats?.dailyApproved ?? null;

  const waitLine =
    waitMonths !== null && waitMonths > 0
      ? `⏳ ~${fmt(waitMonths)} months current wait from filing to decision`
      : `⏳ Current wait estimate pending`;

  const lines = [
    header,
    `🟠 ${fmt(submitted)} new applications joined the queue yesterday`,
    `🟢 ${fmt(approved)} claims were decided`,
    waitLine,
    `Source: U.S. Department of Justice, RECA Program · Updated daily.`,
  ];

  return lines.join("\n");
}

// ─── helpers ───────────────────────────────────────────────────

function fmt(n: number | null | undefined, unit: string = ""): string {
  if (n === null || n === undefined || !Number.isFinite(n)) {
    return "[DATA PENDING]";
  }
  const rounded = Math.round(n);
  const formatted = rounded.toLocaleString("en-US");
  return unit ? `${formatted} ${unit}` : formatted;
}

function estimateWaitMonths(
  pending: number | null,
  dailyRate: number | null
): number | null {
  if (pending === null || dailyRate === null || dailyRate <= 0) return null;
  // `dailyRate` is a per-CALENDAR-day average (see storeDOJData — deltas are
  // divided by calendar days elapsed since the last successful scrape). So
  // convert to months via 30.4 calendar days/month, NOT 21.5 workdays.
  const months = pending / (dailyRate * 30.4);
  return Math.round(months);
}

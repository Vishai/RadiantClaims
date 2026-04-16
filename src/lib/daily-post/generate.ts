import {
  getAggregateForDate,
  getMostRecentAggregate,
  getRangeAggregate,
  getAverageDailyApprovalRate,
  type AggregateStats,
} from "./query";

/**
 * Generate the Daily DOJ Status post for a given reference date,
 * selecting the right template based on day of week.
 *
 * Templates come from `docs/CONTENT_PILLARS.md` §Pillar 1. The shape
 * of the returned text is designed to be pasted directly into Meta
 * Business Suite. Numbers are pulled live from `dOJDailyStats`.
 *
 * If data is missing (scraper hasn't run yet), placeholders are left
 * in place with a "[DATA PENDING]" marker so the operator knows to
 * refill before posting.
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

  let text: string;
  switch (template) {
    case "monday":
      text = await generateMondayWeeklyReset(
        referenceDate,
        estimatedWaitMonths
      );
      break;
    case "wednesday":
      text = generateWednesdayMidweek(
        referenceDate,
        mostRecent,
        estimatedWaitMonths
      );
      break;
    case "friday":
      text = await generateFridayWeeklySummary(
        referenceDate,
        estimatedWaitMonths
      );
      break;
    case "standard":
      text = generateStandardDaily(
        referenceDate,
        mostRecent,
        estimatedWaitMonths
      );
      break;
  }

  return {
    text,
    template,
    referenceDate,
    hasData: mostRecent !== null,
    warnings,
  };
}

// ─── template selector ─────────────────────────────────────────

function selectTemplate(date: Date): DayTemplate {
  // getUTCDay: 0 = Sunday, 1 = Monday, ... 6 = Saturday
  // We post in MT, so use a MT-adjusted day. At 7am MT, UTC date is
  // 13:00-14:00 UTC of the same calendar day, so getUTCDay works.
  const day = date.getUTCDay();
  switch (day) {
    case 1:
      return "monday";
    case 3:
      return "wednesday";
    case 5:
      return "friday";
    default:
      return "standard";
  }
}

// ─── templates ─────────────────────────────────────────────────

function headerLine(date: Date): string {
  const dow = date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/Denver",
  });
  const md = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  });
  return `📊 RECA Queue Status — ${dow}, ${md}`;
}

function generateStandardDaily(
  referenceDate: Date,
  stats: AggregateStats | null,
  waitMonths: number | null
): string {
  const header = headerLine(referenceDate);
  const submitted = stats?.dailySubmitted ?? null;
  const approved = stats?.dailyApproved ?? null;
  const wait = waitMonths;

  const body =
    `Yesterday the DOJ received ${fmt(submitted)} new applications. ` +
    `${fmt(approved)} were processed.\n\n` +
    `Current estimated wait: ~${fmt(wait, "months")} from submission to decision.`;

  return join(header, body, footerStandard());
}

function generateWednesdayMidweek(
  referenceDate: Date,
  stats: AggregateStats | null,
  waitMonths: number | null
): string {
  const header = headerLine(referenceDate);
  const submitted = stats?.dailySubmitted ?? null;
  const approved = stats?.dailyApproved ?? null;

  let insight: string;
  if (submitted !== null && approved !== null && approved > 0) {
    const ratio = Math.round(submitted / approved);
    insight =
      `The gap between "received" and "processed" is the entire story of this program. ` +
      `The DOJ staffs for ~${approved} decisions/day. ` +
      `Applications come in at ~${ratio}x that rate.\n\n` +
      `What this means: if you're waiting to file because you think you have time, the backlog itself is eating your time.`;
  } else {
    insight =
      `The gap between received and processed applications is the entire story of this program. ` +
      `If you're waiting to file because you think you have time, the backlog itself is eating your time.`;
  }

  const tailLine = `Estimated wait today: ~${fmt(waitMonths, "months")}.`;

  const body =
    `${fmt(submitted)} new applications yesterday. ${fmt(approved)} processed.\n\n` +
    `${insight}\n\n` +
    tailLine;

  return join(header, body, footerStandard());
}

async function generateMondayWeeklyReset(
  referenceDate: Date,
  waitMonths: number | null
): Promise<string> {
  const header = headerLine(referenceDate);

  const { lastWeek, priorWeek } = await getWeeklyWindows(referenceDate);

  const lastWeekAgg = await getRangeAggregate(lastWeek.start, lastWeek.end);
  const priorWeekAgg = await getRangeAggregate(priorWeek.start, priorWeek.end);

  const newApps = lastWeekAgg?.dailySubmitted ?? null;
  const processed = lastWeekAgg?.dailyApproved ?? null;
  const priorNew = priorWeekAgg?.dailySubmitted ?? null;

  const netChange =
    newApps !== null && processed !== null ? newApps - processed : null;

  let compareLine = "";
  if (newApps !== null && priorNew !== null) {
    const delta = newApps - priorNew;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const pct =
      priorNew > 0 ? Math.round((Math.abs(delta) / priorNew) * 100) : 0;
    compareLine =
      delta === 0
        ? ` (flat vs the week before)`
        : ` (${direction} ${pct}% vs the week before)`;
  }

  const body =
    `Last week: ${fmt(newApps)} new applications${compareLine}. ` +
    `Processing ran at ~${fmt(processed)} claims/week.\n\n` +
    `Net: the queue grew by ${fmt(netChange)} people last week. ` +
    `At current pace, a family filing today will wait ~${fmt(waitMonths, "months")} for a decision.\n\n` +
    `The RECA program sunsets December 2027. If you're thinking about filing, the clock is not on your side.`;

  return join(header, body, footerStandard());
}

async function generateFridayWeeklySummary(
  referenceDate: Date,
  waitMonths: number | null
): Promise<string> {
  const header = headerLine(referenceDate);
  const { thisWeek } = await getWeeklyWindows(referenceDate);
  const thisWeekAgg = await getRangeAggregate(thisWeek.start, thisWeek.end);
  const mostRecent = await getMostRecentAggregate();

  const newApps = thisWeekAgg?.dailySubmitted ?? null;
  const processed = thisWeekAgg?.dailyApproved ?? null;
  const queueSize = mostRecent?.pending ?? null;

  const body =
    `**This week's numbers:**\n` +
    `• New applications: ${fmt(newApps)}\n` +
    `• Processed: ${fmt(processed)}\n` +
    `• Queue size: ${fmt(queueSize)} people ahead of today's filer\n` +
    `• Estimated wait: ~${fmt(waitMonths, "months")}\n\n` +
    `Have a good weekend. We'll be back Monday with fresh numbers.`;

  return join(header, body, footerStandard());
}

// ─── helpers ───────────────────────────────────────────────────

function footerStandard(): string {
  return (
    `Source: U.S. Department of Justice, RECA Program. ` +
    `Data scraped daily by RadiantClaims at 7am MT.\n\n` +
    `#RECA #Downwinders #NuclearJustice`
  );
}

function join(...parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

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
  // Business-day approximation: DOJ processes on weekdays, so
  // ~21.5 workdays/month. Pending / (rate * workdays) = months.
  const months = pending / (dailyRate * 21.5);
  return Math.round(months);
}

async function getWeeklyWindows(referenceDate: Date): Promise<{
  thisWeek: { start: Date; end: Date };
  lastWeek: { start: Date; end: Date };
  priorWeek: { start: Date; end: Date };
}> {
  // thisWeek = last 7 days ending yesterday
  // lastWeek = prior 7 days
  // priorWeek = 7 days before that
  const yesterday = new Date(referenceDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const minus = (base: Date, days: number) => {
    const out = new Date(base);
    out.setUTCDate(out.getUTCDate() - days);
    return out;
  };

  return {
    thisWeek: { start: minus(yesterday, 6), end: yesterday },
    lastWeek: { start: minus(yesterday, 13), end: minus(yesterday, 7) },
    priorWeek: { start: minus(yesterday, 20), end: minus(yesterday, 14) },
  };
}

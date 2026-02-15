/**
 * DOJ Processing Metrics Calculator
 *
 * Calculates performance metrics from DOJ daily statistics
 * - Processing velocity (claims/day)
 * - Queue trends
 * - Time-based comparisons
 * - Predictive analytics
 */

import { db } from "./db";
import { DOJClaimCategory, MetricWindow, TrendDirection } from "@prisma/client";
import { subDays } from "date-fns";

// Statistical helpers
function mean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/**
 * Get date range for a metric window
 */
async function getWindowDates(
  window: MetricWindow,
  claimCategory: DOJClaimCategory
): Promise<{ startDate: Date; endDate: Date }> {
  // Get the most recent data point as our "end date"
  const latestData = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory,
      scrapingSuccess: true,
    },
    orderBy: { reportDate: "desc" },
  });

  const endDate = latestData ? latestData.reportDate : new Date();

  let startDate: Date;
  switch (window) {
    case "LAST_7_DAYS":
      startDate = subDays(endDate, 7);
      break;
    case "LAST_14_DAYS":
      startDate = subDays(endDate, 14);
      break;
    case "LAST_30_DAYS":
      startDate = subDays(endDate, 30);
      break;
    case "LAST_60_DAYS":
      startDate = subDays(endDate, 60);
      break;
    case "ALL_TIME":
      // Get the earliest data point
      const earliestData = await db.dOJDailyStats.findFirst({
        where: {
          claimCategory,
          scrapingSuccess: true,
        },
        orderBy: { reportDate: "asc" },
      });
      startDate = earliestData
        ? earliestData.reportDate
        : new Date("2024-10-17");
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate trend direction and percentage change
 */
function calculateTrend(
  currentPeriod: number[],
  previousPeriod: number[]
): { trend: TrendDirection; change: number } {
  if (currentPeriod.length === 0 || previousPeriod.length === 0) {
    return { trend: "STABLE", change: 0 };
  }

  const currentAvg = mean(currentPeriod);
  const previousAvg = mean(previousPeriod);

  if (previousAvg === 0) {
    return { trend: "STABLE", change: 0 };
  }

  const change = ((currentAvg - previousAvg) / previousAvg) * 100;

  // Consider < 5% change as stable
  if (Math.abs(change) < 5) {
    return { trend: "STABLE", change };
  }

  return {
    trend: change > 0 ? "FASTER" : "SLOWER",
    change,
  };
}

/**
 * Calculate metrics for a specific time window
 */
export async function calculateMetricsForWindow(
  claimCategory: DOJClaimCategory,
  window: MetricWindow
) {
  const { startDate, endDate } = await getWindowDates(window, claimCategory);

  console.log(
    `📊 Calculating ${window} metrics for ${claimCategory} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
  );

  // Get daily stats for this window
  const dailyStats = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      reportDate: {
        gte: startDate,
        lte: endDate,
      },
      scrapingSuccess: true,
    },
    orderBy: { reportDate: "asc" },
  });

  if (dailyStats.length < 2) {
    console.log(`⚠️  Not enough data for ${window} (need at least 2 days)`);
    return null;
  }

  // Extract approval and submission rates
  const approvalsPerDay = dailyStats
    .filter((s) => s.dailyApproved !== null && s.dailyApproved > 0)
    .map((s) => s.dailyApproved!);

  const submissionsPerDay = dailyStats
    .filter((s) => s.dailySubmitted !== null && s.dailySubmitted > 0)
    .map((s) => s.dailySubmitted!);

  const pendingQueue = dailyStats.map((s) => s.pending);

  // Calculate velocity metrics
  const avgApprovalsPerDay =
    approvalsPerDay.length > 0 ? mean(approvalsPerDay) : 0;
  const medianApprovalsPerDay =
    approvalsPerDay.length > 0 ? median(approvalsPerDay) : 0;
  const avgSubmissionsPerDay =
    submissionsPerDay.length > 0 ? mean(submissionsPerDay) : 0;

  // Calculate queue metrics
  const avgPendingQueue = mean(pendingQueue);

  // Estimate processing time (days)
  const avgProcessingTime =
    avgApprovalsPerDay > 0 ? avgPendingQueue / avgApprovalsPerDay : null;

  // Calculate approval rate
  const latestStats = dailyStats[dailyStats.length - 1];
  const approvalRate = latestStats ? latestStats.approvalPercent : 0;
  const denialRate = 100 - approvalRate;

  // Calculate trends (compare first half vs second half of period)
  const midpoint = Math.floor(dailyStats.length / 2);
  const firstHalfApprovals = dailyStats
    .slice(0, midpoint)
    .filter((s) => s.dailyApproved !== null)
    .map((s) => s.dailyApproved!);
  const secondHalfApprovals = dailyStats
    .slice(midpoint)
    .filter((s) => s.dailyApproved !== null)
    .map((s) => s.dailyApproved!);

  const { trend: velocityTrend, change: velocityChange } = calculateTrend(
    secondHalfApprovals,
    firstHalfApprovals
  );

  const firstHalfQueue = dailyStats.slice(0, midpoint).map((s) => s.pending);
  const secondHalfQueue = dailyStats.slice(midpoint).map((s) => s.pending);

  const { trend: queueTrend, change: queueChange } = calculateTrend(
    secondHalfQueue,
    firstHalfQueue
  );

  // Store metrics in database
  const metrics = await db.dOJProcessingMetrics.create({
    data: {
      claimCategory,
      windowStart: startDate,
      windowEnd: endDate,
      windowType: window,
      avgApprovalsPerDay,
      medianApprovalsPerDay,
      avgSubmissionsPerDay,
      avgPendingQueue,
      avgProcessingTime,
      approvalRate,
      denialRate,
      velocityTrend,
      velocityChange,
      queueTrend,
      queueChange,
      daysInSample: dailyStats.length,
    },
  });

  console.log(`✅ ${window}: ${avgApprovalsPerDay.toFixed(1)} approvals/day`);

  return metrics;
}

/**
 * Calculate all metrics for all windows
 */
export async function calculateAllMetrics(
  claimCategory: DOJClaimCategory = "DOWNWINDER"
) {
  console.log(`\n🔄 Calculating processing metrics for ${claimCategory}...\n`);

  const windows: MetricWindow[] = [
    "LAST_7_DAYS",
    "LAST_14_DAYS",
    "LAST_30_DAYS",
    "LAST_60_DAYS",
    "ALL_TIME",
  ];

  const results = [];

  for (const window of windows) {
    try {
      const metrics = await calculateMetricsForWindow(claimCategory, window);
      if (metrics) {
        results.push(metrics);
      }
    } catch (error) {
      console.error(`❌ Error calculating ${window}:`, error);
    }
  }

  console.log(`\n✅ Calculated metrics for ${results.length} time windows`);

  return results;
}

/**
 * Get latest metrics for a specific window
 */
export async function getLatestMetrics(
  claimCategory: DOJClaimCategory,
  window: MetricWindow
) {
  return await db.dOJProcessingMetrics.findFirst({
    where: {
      claimCategory,
      windowType: window,
    },
    orderBy: { calculatedAt: "desc" },
  });
}

/**
 * Generate insights summary
 */
export async function generateInsightsSummary(
  claimCategory: DOJClaimCategory = "DOWNWINDER"
) {
  const last7Days = await getLatestMetrics(claimCategory, "LAST_7_DAYS");
  const last30Days = await getLatestMetrics(claimCategory, "LAST_30_DAYS");
  const allTime = await getLatestMetrics(claimCategory, "ALL_TIME");

  if (!last7Days || !last30Days || !allTime) {
    return null;
  }

  // Latest publish day
  const latestStat = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory,
      scrapingSuccess: true,
    },
    orderBy: { reportDate: "desc" },
  });

  if (!latestStat) {
    return null;
  }

  // Exact WoW queue growth (best-available: closest data point on/before 7 days ago)
  const sevenDaysAgo = subDays(latestStat.reportDate, 7);
  const previousWeekStat = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory,
      scrapingSuccess: true,
      reportDate: {
        lte: sevenDaysAgo,
      },
    },
    orderBy: { reportDate: "desc" },
  });

  const weeklyQueueChange = previousWeekStat
    ? latestStat.pending - previousWeekStat.pending
    : null;
  const weeklyQueueGrowthPercent =
    previousWeekStat && previousWeekStat.pending > 0
      ? (weeklyQueueChange! / previousWeekStat.pending) * 100
      : null;

  // Data quality window (calendar 7 days, ending at latest publish day)
  const windowRows = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      scrapingSuccess: true,
      reportDate: {
        gte: sevenDaysAgo,
        lte: latestStat.reportDate,
      },
    },
    orderBy: { reportDate: "asc" },
    select: {
      pending: true,
      approved: true,
      denied: true,
      dailyApproved: true,
      dailyDenied: true,
      dailySubmitted: true,
      dataSource: true,
    },
  });

  const publishDays = windowRows.filter(
    (r) => r.dataSource !== "imputed"
  ).length;
  const imputedDays = windowRows.filter(
    (r) => r.dataSource === "imputed"
  ).length;

  const negativeDeltaDays = windowRows.filter((r) => {
    const neg = (n: number | null) => n !== null && n < 0;
    return neg(r.dailyApproved) || neg(r.dailyDenied) || neg(r.dailySubmitted);
  }).length;

  // Count days where totals decreased vs previous publish day (in this window)
  let totalDecreasedDays = 0;
  let prevTotal: number | null = null;
  for (const r of windowRows) {
    const total = r.pending + r.approved + r.denied;
    if (prevTotal !== null && total < prevTotal) totalDecreasedDays++;
    prevTotal = total;
  }

  return {
    currentQueue: {
      pending: latestStat.pending,
      approved: latestStat.approved,
      totalClaims: latestStat.totalClaims,
      asOfDate: latestStat.reportDate,
    },
    exactWeeklyQueue: {
      previousWeekAsOfDate: previousWeekStat?.reportDate ?? null,
      previousWeekQueueSize: previousWeekStat?.pending ?? null,
      weeklyQueueChange,
      weeklyQueueGrowthPercent,
    },
    dataQuality: {
      windowStart: sevenDaysAgo,
      windowEnd: latestStat.reportDate,
      publishDays,
      imputedDays,
      negativeDeltaDays,
      totalDecreasedDays,
    },
    velocity: {
      last7Days: last7Days.avgApprovalsPerDay,
      last30Days: last30Days.avgApprovalsPerDay,
      allTime: allTime.avgApprovalsPerDay,
      trend: last7Days.velocityTrend,
      trendChange: last7Days.velocityChange,
    },
    queue: {
      current: latestStat.pending,
      avg7Days: last7Days.avgPendingQueue,
      avg30Days: last30Days.avgPendingQueue,
      trend: last7Days.queueTrend,
      trendChange: last7Days.queueChange,
    },
    processingTime: {
      estimated7Days: last7Days.avgProcessingTime,
      estimated30Days: last30Days.avgProcessingTime,
      estimatedAllTime: allTime.avgProcessingTime,
    },
    approvalRate: {
      current: latestStat.approvalPercent,
      allTime: allTime.approvalRate,
    },
    insights: generateTextualInsights(
      last7Days,
      last30Days,
      allTime,
      latestStat
    ),
  };
}

/**
 * Generate human-readable insights
 */
function generateTextualInsights(
  last7Days: any,
  last30Days: any,
  allTime: any,
  latestStat: any
): string[] {
  const insights: string[] = [];

  // Velocity insights
  if (last7Days.velocityTrend === "FASTER") {
    insights.push(
      `🟢 DOJ processing speed has increased by ${Math.abs(last7Days.velocityChange).toFixed(1)}% in the last 7 days`
    );
  } else if (last7Days.velocityTrend === "SLOWER") {
    insights.push(
      `🔴 DOJ processing speed has decreased by ${Math.abs(last7Days.velocityChange).toFixed(1)}% in the last 7 days`
    );
  } else {
    insights.push(
      `🟡 DOJ processing speed has remained stable in the last 7 days`
    );
  }

  // Queue insights
  if (last7Days.queueTrend === "FASTER") {
    insights.push(
      `📈 Queue is growing: ${Math.abs(last7Days.queueChange).toFixed(1)}% increase in pending claims`
    );
  } else if (last7Days.queueTrend === "SLOWER") {
    insights.push(
      `📉 Queue is shrinking: ${Math.abs(last7Days.queueChange).toFixed(1)}% decrease in pending claims`
    );
  }

  // Processing time insights
  if (last7Days.avgProcessingTime && last30Days.avgProcessingTime) {
    const timeDiff = last7Days.avgProcessingTime - last30Days.avgProcessingTime;
    if (Math.abs(timeDiff) > 10) {
      if (timeDiff < 0) {
        insights.push(
          `⚡ Estimated wait time improved by ${Math.abs(timeDiff).toFixed(0)} days compared to last month`
        );
      } else {
        insights.push(
          `⏳ Estimated wait time increased by ${timeDiff.toFixed(0)} days compared to last month`
        );
      }
    }
  }

  // Current rate insights
  const currentRate = last7Days.avgApprovalsPerDay;
  const historicalRate = allTime.avgApprovalsPerDay;
  const rateDiff = ((currentRate - historicalRate) / historicalRate) * 100;

  if (Math.abs(rateDiff) > 10) {
    if (rateDiff > 0) {
      insights.push(
        `📊 Current approval rate (${currentRate.toFixed(1)}/day) is ${Math.abs(rateDiff).toFixed(0)}% above historical average`
      );
    } else {
      insights.push(
        `📊 Current approval rate (${currentRate.toFixed(1)}/day) is ${Math.abs(rateDiff).toFixed(0)}% below historical average`
      );
    }
  }

  // Approval rate insights
  if (latestStat.approvalPercent === 100) {
    insights.push(
      `✅ 100% approval rate for Downwinder claims (${latestStat.approved} approved, ${latestStat.denied} denied)`
    );
  }

  // Submission vs approval insights with ratio
  const submissionRate = last7Days.avgSubmissionsPerDay;
  const approvalRate = last7Days.avgApprovalsPerDay;

  if (submissionRate > 0 && approvalRate > 0) {
    const ratio = submissionRate / approvalRate;

    if (submissionRate > approvalRate * 1.2) {
      insights.push(
        `⚠️  Applications to Approvals Ratio: ${ratio.toFixed(2)}:1 — New submissions (${submissionRate.toFixed(1)}/day) are outpacing approvals (${approvalRate.toFixed(1)}/day), queue is growing`
      );
    } else if (approvalRate > submissionRate * 1.2) {
      insights.push(
        `💪 Applications to Approvals Ratio: ${ratio.toFixed(2)}:1 — Approvals (${approvalRate.toFixed(1)}/day) are outpacing new submissions (${submissionRate.toFixed(1)}/day), queue is shrinking`
      );
    } else {
      insights.push(
        `⚖️  Applications to Approvals Ratio: ${ratio.toFixed(2)}:1 — New submissions (${submissionRate.toFixed(1)}/day) and approvals (${approvalRate.toFixed(1)}/day) are relatively balanced`
      );
    }
  }

  return insights;
}

/**
 * Calculate week-over-week comparison
 */
export async function calculateWeekOverWeek(
  claimCategory: DOJClaimCategory = "DOWNWINDER"
) {
  // Get the most recent data point
  const latestData = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory,
      scrapingSuccess: true,
    },
    orderBy: { reportDate: "desc" },
  });

  const thisWeekEnd = latestData ? latestData.reportDate : new Date();
  const thisWeekStart = subDays(thisWeekEnd, 7);

  const lastWeekEnd = subDays(thisWeekStart, 1);
  const lastWeekStart = subDays(lastWeekEnd, 7);

  // Get this week's data
  const thisWeek = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      reportDate: { gte: thisWeekStart, lte: thisWeekEnd },
      scrapingSuccess: true,
    },
  });

  // Get last week's data
  const lastWeek = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      reportDate: { gte: lastWeekStart, lte: lastWeekEnd },
      scrapingSuccess: true,
    },
  });

  const thisWeekApprovals = thisWeek
    .filter((s) => s.dailyApproved)
    .map((s) => s.dailyApproved!);
  const lastWeekApprovals = lastWeek
    .filter((s) => s.dailyApproved)
    .map((s) => s.dailyApproved!);

  const thisWeekAvg = mean(thisWeekApprovals);
  const lastWeekAvg = mean(lastWeekApprovals);

  const change =
    lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

  return {
    thisWeek: {
      avg: thisWeekAvg,
      total: thisWeekApprovals.reduce((a, b) => a + b, 0),
      days: thisWeek.length,
    },
    lastWeek: {
      avg: lastWeekAvg,
      total: lastWeekApprovals.reduce((a, b) => a + b, 0),
      days: lastWeek.length,
    },
    change: {
      percent: change,
      trend: Math.abs(change) < 5 ? "STABLE" : change > 0 ? "FASTER" : "SLOWER",
    },
  };
}

/**
 * Calculate month-over-month comparison
 */
export async function calculateMonthOverMonth(
  claimCategory: DOJClaimCategory = "DOWNWINDER"
) {
  // Get the most recent data point as our "end date"
  const latestData = await db.dOJDailyStats.findFirst({
    where: {
      claimCategory,
      scrapingSuccess: true,
    },
    orderBy: { reportDate: "desc" },
  });

  const thisMonthEnd = latestData ? latestData.reportDate : new Date();
  thisMonthEnd.setHours(0, 0, 0, 0);
  const thisMonthStart = subDays(thisMonthEnd, 30);

  const lastMonthEnd = subDays(thisMonthStart, 1);
  const lastMonthStart = subDays(lastMonthEnd, 30);

  // Get this month's data
  const thisMonth = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      reportDate: { gte: thisMonthStart, lte: thisMonthEnd },
      scrapingSuccess: true,
    },
  });

  // Get last month's data
  const lastMonth = await db.dOJDailyStats.findMany({
    where: {
      claimCategory,
      reportDate: { gte: lastMonthStart, lte: lastMonthEnd },
      scrapingSuccess: true,
    },
  });

  const thisMonthApprovals = thisMonth
    .filter((s) => s.dailyApproved)
    .map((s) => s.dailyApproved!);
  const lastMonthApprovals = lastMonth
    .filter((s) => s.dailyApproved)
    .map((s) => s.dailyApproved!);

  const thisMonthAvg = mean(thisMonthApprovals);
  const lastMonthAvg = mean(lastMonthApprovals);

  const change =
    lastMonthAvg > 0 ? ((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100 : 0;

  return {
    thisMonth: {
      avg: thisMonthAvg,
      total: thisMonthApprovals.reduce((a, b) => a + b, 0),
      days: thisMonth.length,
    },
    lastMonth: {
      avg: lastMonthAvg,
      total: lastMonthApprovals.reduce((a, b) => a + b, 0),
      days: lastMonth.length,
    },
    change: {
      percent: change,
      trend: Math.abs(change) < 5 ? "STABLE" : change > 0 ? "FASTER" : "SLOWER",
    },
  };
}

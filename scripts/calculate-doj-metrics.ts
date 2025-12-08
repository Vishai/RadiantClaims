/**
 * Calculate DOJ Processing Metrics
 *
 * Runs analysis on DOJ daily statistics and generates metrics
 *
 * Usage:
 *   npx tsx scripts/calculate-doj-metrics.ts
 */

import {
  calculateAllMetrics,
  generateInsightsSummary,
  calculateWeekOverWeek,
  calculateMonthOverMonth,
} from "../src/lib/doj-metrics-calculator";

async function main() {
  console.log("🚀 Starting DOJ Metrics Calculation\n");

  // Calculate metrics for all time windows
  await calculateAllMetrics("DOWNWINDER");

  // Generate insights summary
  console.log("\n📊 Generating insights summary...\n");
  const insights = await generateInsightsSummary("DOWNWINDER");

  if (insights) {
    console.log("═══════════════════════════════════════════════════════");
    console.log("📈 DOJ PROCESSING INSIGHTS");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📋 Current Queue Status:");
    console.log(
      `   As of: ${new Date(insights.currentQueue.asOfDate).toLocaleDateString()}`
    );
    console.log(
      `   Pending: ${insights.currentQueue.pending.toLocaleString()}`
    );
    console.log(
      `   Approved: ${insights.currentQueue.approved.toLocaleString()}`
    );
    console.log(
      `   Total: ${insights.currentQueue.totalClaims.toLocaleString()}\n`
    );

    console.log("⚡ Processing Velocity:");
    console.log(
      `   Last 7 days: ${insights.velocity.last7Days.toFixed(1)} approvals/day`
    );
    console.log(
      `   Last 30 days: ${insights.velocity.last30Days.toFixed(1)} approvals/day`
    );
    console.log(
      `   All time: ${insights.velocity.allTime.toFixed(1)} approvals/day`
    );
    console.log(
      `   Trend: ${insights.velocity.trend} (${insights.velocity.trendChange.toFixed(1)}%)\n`
    );

    console.log("📦 Queue Status:");
    console.log(
      `   Current: ${insights.queue.current.toLocaleString()} claims`
    );
    console.log(`   7-day avg: ${insights.queue.avg7Days.toFixed(0)} claims`);
    console.log(`   30-day avg: ${insights.queue.avg30Days.toFixed(0)} claims`);
    console.log(
      `   Trend: ${insights.queue.trend} (${insights.queue.trendChange.toFixed(1)}%)\n`
    );

    console.log("⏱️  Estimated Wait Time:");
    if (insights.processingTime.estimated7Days) {
      console.log(
        `   Based on last 7 days: ${insights.processingTime.estimated7Days.toFixed(0)} days`
      );
    }
    if (insights.processingTime.estimated30Days) {
      console.log(
        `   Based on last 30 days: ${insights.processingTime.estimated30Days.toFixed(0)} days`
      );
    }
    if (insights.processingTime.estimatedAllTime) {
      console.log(
        `   Based on all time: ${insights.processingTime.estimatedAllTime.toFixed(0)} days\n`
      );
    }

    console.log("✅ Approval Rate:");
    console.log(`   Current: ${insights.approvalRate.current}%`);
    console.log(`   All time: ${insights.approvalRate.allTime.toFixed(1)}%\n`);

    console.log("💡 Key Insights:");
    insights.insights.forEach((insight) => {
      console.log(`   ${insight}`);
    });

    console.log("\n═══════════════════════════════════════════════════════");
  }

  // Week-over-week comparison
  console.log("\n📅 Week-over-Week Comparison\n");
  const wow = await calculateWeekOverWeek("DOWNWINDER");
  console.log(`This Week:`);
  console.log(`   Average: ${wow.thisWeek.avg.toFixed(1)} approvals/day`);
  console.log(`   Total: ${wow.thisWeek.total} approvals`);
  console.log(`   Days: ${wow.thisWeek.days}\n`);

  console.log(`Last Week:`);
  console.log(`   Average: ${wow.lastWeek.avg.toFixed(1)} approvals/day`);
  console.log(`   Total: ${wow.lastWeek.total} approvals`);
  console.log(`   Days: ${wow.lastWeek.days}\n`);

  console.log(
    `Change: ${wow.change.trend} (${wow.change.percent > 0 ? "+" : ""}${wow.change.percent.toFixed(1)}%)\n`
  );

  // Month-over-month comparison
  console.log("📆 Month-over-Month Comparison\n");
  const mom = await calculateMonthOverMonth("DOWNWINDER");
  console.log(`This Month (last 30 days):`);
  console.log(`   Average: ${mom.thisMonth.avg.toFixed(1)} approvals/day`);
  console.log(`   Total: ${mom.thisMonth.total} approvals`);
  console.log(`   Days: ${mom.thisMonth.days}\n`);

  console.log(`Last Month (30 days before):`);
  console.log(`   Average: ${mom.lastMonth.avg.toFixed(1)} approvals/day`);
  console.log(`   Total: ${mom.lastMonth.total} approvals`);
  console.log(`   Days: ${mom.lastMonth.days}\n`);

  console.log(
    `Change: ${mom.change.trend} (${mom.change.percent > 0 ? "+" : ""}${mom.change.percent.toFixed(1)}%)\n`
  );

  console.log("✅ Metrics calculation complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

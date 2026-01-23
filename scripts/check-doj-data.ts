/**
 * Check what DOJ data we currently have in the database
 */

import { db } from "../src/lib/db";

async function main() {
  console.log("\n📅 Checking DOJ Data Coverage...\n");

  const data = await db.dOJDailyStats.findMany({
    where: { claimCategory: "DOWNWINDER" },
    orderBy: { reportDate: "desc" },
    select: {
      reportDate: true,
      pending: true,
      approved: true,
      scrapingSuccess: true,
      dataSource: true,
    },
  });

  console.log(`Total records: ${data.length}\n`);

  console.log("Most Recent 15 Data Points:");
  console.log("===========================");
  data.slice(0, 15).forEach((d) => {
    const date = new Date(d.reportDate).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      weekday: "short",
    });
    const source = d.dataSource || "scraper";
    console.log(
      `${date}: ${d.pending} pending, ${d.approved} approved (source: ${source})`
    );
  });

  // Find date range
  if (data.length > 0) {
    const oldest = data[data.length - 1];
    const newest = data[0];
    console.log(`\nDate Range:`);
    console.log(
      `  Oldest: ${new Date(oldest.reportDate).toLocaleDateString()}`
    );
    console.log(
      `  Newest: ${new Date(newest.reportDate).toLocaleDateString()}`
    );
  }

  await db.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

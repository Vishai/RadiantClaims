/**
 * Import DOJ Data from CSV
 *
 * Imports historical DOJ RECA data from manually collected CSV
 *
 * Usage:
 *   npx tsx scripts/import-doj-csv.ts
 */

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { db } from "../src/lib/db";
import { subDays } from "date-fns";

interface CSVRow {
  Date: string;
  "": string; // Day of week column
  Pending: string;
  Approved: string;
  "% Approved": string;
  "$ Approved": string;
  Denied: string;
  Totals: string;
}

async function main() {
  console.log("📥 Importing DOJ data from CSV...\n");

  // Read CSV file
  const csvPath =
    "/Users/brandonarmstrong/Downloads/DOJ RECA Pulse - Sheet1.csv";
  const csvContent = readFileSync(csvPath, "utf-8");

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CSVRow[];

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const row of records) {
    try {
      // Skip rows with no data (holidays, weekends, etc.)
      if (
        !row.Pending ||
        row.Pending === "" ||
        row.Pending.toUpperCase().includes("VETERANS") ||
        row.Pending.toUpperCase().includes("THANKSGIVING") ||
        row.Pending.toUpperCase().includes("NO DATA")
      ) {
        console.log(`⏭️  Skipping ${row.Date} (${row[""]})`);
        skipCount++;
        continue;
      }

      // Parse date (format: MM/DD)
      const [month, day] = row.Date.split("/").map(Number);

      // All data is from 2025
      const year = 2025;

      const date = new Date(year, month - 1, day);
      date.setHours(7, 0, 0, 0); // Set to 7 AM to match scraper

      // Parse numbers
      const pending = parseInt(row.Pending.replace(/,/g, ""), 10);
      const approved = parseInt(row.Approved.replace(/,/g, ""), 10);
      const approvalPercent = parseFloat(row["% Approved"]);
      const dollarsApproved = parseInt(row["$ Approved"].replace(/,/g, ""), 10);
      const denied = parseInt(row.Denied.replace(/,/g, ""), 10);
      const totalClaims = parseInt(row.Totals.replace(/,/g, ""), 10);

      // Calculate daily changes (compare to previous day if exists)
      const yesterday = subDays(date, 1);
      const yesterdayData = await db.dOJDailyStats.findUnique({
        where: {
          reportDate_claimCategory: {
            reportDate: yesterday,
            claimCategory: "DOWNWINDER",
          },
        },
      });

      const dailyApproved = yesterdayData
        ? approved - yesterdayData.approved
        : null;
      const dailyDenied = yesterdayData ? denied - yesterdayData.denied : null;
      const dailySubmitted =
        yesterdayData && dailyApproved !== null && dailyDenied !== null
          ? pending + dailyApproved + dailyDenied - yesterdayData.pending
          : null;

      // Insert into database (Downwinder category only from this CSV)
      await db.dOJDailyStats.upsert({
        where: {
          reportDate_claimCategory: {
            reportDate: date,
            claimCategory: "DOWNWINDER",
          },
        },
        create: {
          reportDate: date,
          claimCategory: "DOWNWINDER",
          pending,
          approved,
          approvalPercent,
          dollarsApproved,
          denied,
          totalClaims,
          dailyApproved,
          dailyDenied,
          dailySubmitted,
          scrapingSuccess: true,
          dataSource: "manual_csv_import",
        },
        update: {
          pending,
          approved,
          approvalPercent,
          dollarsApproved,
          denied,
          totalClaims,
          dailyApproved,
          dailyDenied,
          dailySubmitted,
          scrapingSuccess: true,
          dataSource: "manual_csv_import",
          scrapingError: null,
        },
      });

      console.log(
        `✅ Imported ${month}/${day}/${year}: ${pending} pending, ${approved} approved`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Error importing ${row.Date}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${successCount}`);
  console.log(`   ⏭️  Skipped (no data): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log(`\n🎉 CSV import complete!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Import completed with errors.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error during import:", error);
  process.exit(1);
});

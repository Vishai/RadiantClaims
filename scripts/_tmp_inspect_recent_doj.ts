import { db } from "../src/lib/db";
import { format } from "date-fns";

async function main() {
  const rows = await db.dOJDailyStats.findMany({
    where: { reportDate: { gte: new Date("2026-04-15") } },
    orderBy: [{ reportDate: "desc" }, { claimCategory: "asc" }],
  });

  console.table(
    rows.map((r) => ({
      date: format(r.reportDate, "yyyy-MM-dd"),
      cat: r.claimCategory,
      pending: r.pending,
      approved: r.approved,
      denied: r.denied,
      total: r.totalClaims,
      dSub: r.dailySubmitted,
      dApp: r.dailyApproved,
      src: r.dataSource,
    }))
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

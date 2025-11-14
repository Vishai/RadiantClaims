/**
 * Test script for Attorney Activity Summary Email
 * Sends a test email to brandon@radiantclaims.com
 */

import { sendAttorneyActivitySummaryEmail } from "@/lib/notification-emails";
import { db } from "@/lib/db";

async function main() {
  console.log("🧪 Testing Attorney Activity Summary Email\n");

  // Get demo data from database
  const lawFirm = await db.lawFirm.findFirst({
    where: { slug: "heritage-law" },
  });

  const activities = await db.attorneyActivityLog.findMany({
    where: { firmId: lawFirm?.id },
    include: {
      claimant: true,
      session: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (!lawFirm || activities.length === 0) {
    console.error("❌ Demo data not found. Run seed script first.");
    process.exit(1);
  }

  console.log("📧 Sending test email with data:");
  console.log(`   Law Firm: ${lawFirm.name}`);
  console.log(`   Activities: ${activities.length}`);
  console.log(`   Recipient: ${lawFirm.primaryContactEmail}\n`);

  const result = await sendAttorneyActivitySummaryEmail({
    recipients: lawFirm.primaryContactEmail!,
    firmName: lawFirm.name,
    summaryPeriod: "Last 12 hours",
    activities: activities.map((a) => ({
      type: a.activityType,
      title: a.title,
      description: a.description || "",
      claimantName: a.claimant
        ? `${a.claimant.firstName} ${a.claimant.lastName}`
        : "Unknown",
      timestamp: a.createdAt.toISOString(),
      actionUrl: `${process.env.NEXTAUTH_URL}/attorney/claimants/${a.claimantId}`,
    })),
    totalActivities: activities.length,
    dashboardUrl: `${process.env.NEXTAUTH_URL}/attorney/dashboard`,
  });

  if (result.success) {
    console.log(`✅ Email sent successfully!`);
    console.log(`   Sent to: ${result.sentCount} recipient(s)`);
    if (result.skippedRecipients.length > 0) {
      console.log(`   Skipped: ${result.skippedRecipients.join(", ")}`);
    }
  } else {
    console.error("❌ Email failed to send");
    if (result.errors.length > 0) {
      result.errors.forEach((err) => {
        console.error(`   ${err.recipient}: ${err.message}`);
      });
    }
  }

  console.log("\n📬 Check brandon@radiantclaims.com for the email!");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

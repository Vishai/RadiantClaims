/**
 * Test script for Attorney New Client Notification Email
 * Sends a test email to brandon@radiantclaims.com
 */

import { sendAttorneyNewClientNotificationEmail } from "@/lib/notification-emails";
import { db } from "@/lib/db";

async function main() {
  console.log("🧪 Testing Attorney New Client Notification Email\n");

  // Get demo data from database
  const claimant = await db.claimant.findFirst({
    where: { email: "brandon@radiantclaims.com" },
  });

  const lawFirm = await db.lawFirm.findFirst({
    where: { slug: "heritage-law" },
  });

  const intakeSession = await db.intakeSession.findFirst({
    where: { claimantId: claimant?.id },
  });

  if (!claimant || !lawFirm || !intakeSession) {
    console.error("❌ Demo data not found. Run seed script first.");
    process.exit(1);
  }

  console.log("📧 Sending test email with data:");
  console.log(`   Claimant: ${claimant.firstName} ${claimant.lastName}`);
  console.log(`   Email: ${claimant.email}`);
  console.log(`   Law Firm: ${lawFirm.name}`);
  console.log(`   Recipient: ${lawFirm.primaryContactEmail}\n`);

  const result = await sendAttorneyNewClientNotificationEmail({
    recipients: lawFirm.primaryContactEmail!,
    claimantName: `${claimant.firstName} ${claimant.lastName}`,
    claimantEmail: claimant.email || "",
    claimantPhone: claimant.phone || "Not provided",
    location: `${claimant.city}, ${claimant.state}`,
    county: claimant.county || "Not provided",
    claimId: intakeSession.id,
    exposurePeriod: "1955-1962",
    disease: "Lung Cancer (Primary)",
    diagnosisDate: "March 2024",
    completionPercent: intakeSession.recaCompletionPercent || 0,
    dashboardUrl: `${process.env.NEXTAUTH_URL}/attorney/dashboard`,
    claimDetailsUrl: `${process.env.NEXTAUTH_URL}/attorney/claimants/${claimant.id}`,
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

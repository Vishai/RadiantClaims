/**
 * Test script for Client Document Follow-Up Email
 * Sends a test email to brandon@radiantclaims.com
 */

import { sendClientDocumentFollowUpEmail } from "@/lib/notification-emails";
import { db } from "@/lib/db";

async function main() {
  console.log("🧪 Testing Client Document Follow-Up Email\n");

  // Get demo data from database
  const claimant = await db.claimant.findFirst({
    where: { email: "brandon@radiantclaims.com" },
  });

  const followUp = await db.claimantFollowUp.findFirst({
    where: { claimantId: claimant?.id },
  });

  if (!claimant || !followUp) {
    console.error("❌ Demo data not found. Run seed script first.");
    process.exit(1);
  }

  console.log("📧 Sending test email with data:");
  console.log(`   Claimant: ${claimant.firstName} ${claimant.lastName}`);
  console.log(`   Email: ${claimant.email}`);
  console.log(`   Document Type: ${followUp.documentType}\n`);

  const result = await sendClientDocumentFollowUpEmail({
    recipients: claimant.email!,
    claimantFirstName: claimant.firstName,
    documentType: followUp.documentType || "Required Documents",
    missingDocuments: [
      followUp.documentType || "Proof of Residency",
      "Medical Records",
      "Exposure Evidence",
    ],
    daysRemaining: 5,
    resumeUrl: `${process.env.NEXTAUTH_URL}/reca/resume?token=demo-token`,
    supportEmail: "support@radiantclaims.com",
    supportPhone: "1-800-555-RECA",
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

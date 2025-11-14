/**
 * Test script for Attorney Packet Ready Notification Email
 * Sends a test email to brandon@radiantclaims.com
 */

import { sendAttorneyPacketReadyNotificationEmail } from "@/lib/notification-emails";
import { db } from "@/lib/db";

async function main() {
  console.log("🧪 Testing Attorney Packet Ready Notification Email\n");

  // Get demo data from database
  const claimant = await db.claimant.findFirst({
    where: { email: "brandon@radiantclaims.com" },
  });

  const lawFirm = await db.lawFirm.findFirst({
    where: { slug: "heritage-law" },
  });

  const documents = await db.document.findMany({
    where: { claimantId: claimant?.id },
  });

  if (!claimant || !lawFirm) {
    console.error("❌ Demo data not found. Run seed script first.");
    process.exit(1);
  }

  console.log("📧 Sending test email with data:");
  console.log(`   Claimant: ${claimant.firstName} ${claimant.lastName}`);
  console.log(`   Law Firm: ${lawFirm.name}`);
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Recipient: ${lawFirm.primaryContactEmail}\n`);

  const result = await sendAttorneyPacketReadyNotificationEmail({
    recipients: lawFirm.primaryContactEmail!,
    claimantName: `${claimant.firstName} ${claimant.lastName}`,
    claimantId: claimant.id,
    packetId: "demo-packet-id",
    documentCount: documents.length,
    documentTypes: documents.map((d) => d.type),
    completionDate: new Date().toISOString(),
    reviewUrl: `${process.env.NEXTAUTH_URL}/attorney/claimants/${claimant.id}`,
    downloadUrl: `${process.env.NEXTAUTH_URL}/api/attorney/packets/demo-packet-id/download`,
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

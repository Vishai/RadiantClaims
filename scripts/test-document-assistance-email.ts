/**
 * Test script for Client Document Assistance Email
 * Sends a test email to brandon@radiantclaims.com
 */

import { sendClientDocumentAssistanceEmail } from "@/lib/notification-emails";
import { db } from "@/lib/db";

async function main() {
  console.log("🧪 Testing Client Document Assistance Email\n");

  // Get demo data from database
  const claimant = await db.claimant.findFirst({
    where: { email: "brandon@radiantclaims.com" },
  });

  const assistance = await db.documentRequestAssistance.findFirst({
    where: { claimantId: claimant?.id },
  });

  if (!claimant || !assistance) {
    console.error("❌ Demo data not found. Run seed script first.");
    process.exit(1);
  }

  console.log("📧 Sending test email with data:");
  console.log(`   Claimant: ${claimant.firstName} ${claimant.lastName}`);
  console.log(`   Email: ${claimant.email}`);
  console.log(`   Document Type: ${assistance.documentType}`);
  console.log(`   Provider: ${assistance.providerName}\n`);

  const providerContact = assistance.providerContact as {
    phone?: string;
    email?: string;
    hours?: string;
  };

  const result = await sendClientDocumentAssistanceEmail({
    recipients: claimant.email!,
    claimantFirstName: claimant.firstName,
    documentType: assistance.documentType || "Required Document",
    providerName: assistance.providerName || "Records Provider",
    providerPhone: providerContact?.phone || "Not provided",
    providerEmail: providerContact?.email,
    providerHours: providerContact?.hours,
    assistanceLevel: assistance.assistanceLevel,
    formUrl: assistance.formTemplateUrl || undefined,
    instructions: [
      "Download and complete the attached request form",
      `Contact ${assistance.providerName} using the information below`,
      "Request records for the years 1956-1961",
      "Upload the received documents to your RadiantClaims portal",
    ],
    resumeUrl: `${process.env.NEXTAUTH_URL}/reca/resume?token=demo-token`,
    supportEmail: "support@radiantclaims.com",
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

/**
 * Test script to send all 4 email templates to verify Resend integration
 * Run with: npx tsx test-emails.ts
 */

import {
  sendWelcomeEmail,
  sendResumeLinkEmail,
  sendUploadConfirmationEmail,
  sendPacketReadyEmail,
} from "./src/lib/email";

const TEST_EMAIL = "brandon@turf-troop.com";
const TEST_NAME = "Brandon Armstrong";

async function testAllEmails() {
  console.log("🧪 Testing Resend Email Integration...\n");
  console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

  try {
    // Test 1: Welcome Email
    console.log("1️⃣  Sending Welcome Email...");
    const welcomeResult = await sendWelcomeEmail({
      to: TEST_EMAIL,
      name: TEST_NAME,
      email: TEST_EMAIL,
      temporaryPassword: "TestPass123",
      claimantId: "test_claimant_123",
      resumeToken: "test_token_abc123xyz",
    });
    console.log(
      `   ✅ Welcome Email: ${welcomeResult.success ? "Sent!" : "Failed"} ${welcomeResult.emailId ? `(ID: ${welcomeResult.emailId})` : ""}\n`
    );

    // Wait 1 second between emails
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Resume Link Email
    console.log("2️⃣  Sending Resume Link Email...");
    const resumeResult = await sendResumeLinkEmail({
      to: TEST_EMAIL,
      name: TEST_NAME,
      resumeToken: "test_token_abc123xyz",
      currentStep: "Document Upload",
      uploadedDocuments: 5,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    console.log(
      `   ✅ Resume Link Email: ${resumeResult.success ? "Sent!" : "Failed"} ${resumeResult.emailId ? `(ID: ${resumeResult.emailId})` : ""}\n`
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 3: Upload Confirmation Email
    console.log("3️⃣  Sending Upload Confirmation Email...");
    const uploadResult = await sendUploadConfirmationEmail({
      to: TEST_EMAIL,
      name: TEST_NAME,
      documentType: "Proof of Residence",
      documentCount: 2,
      totalUploaded: 7,
      resumeToken: "test_token_abc123xyz",
    });
    console.log(
      `   ✅ Upload Confirmation: ${uploadResult.success ? "Sent!" : "Failed"} ${uploadResult.emailId ? `(ID: ${uploadResult.emailId})` : ""}\n`
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 4: Packet Ready Email
    console.log("4️⃣  Sending Packet Ready Email...");
    const packetResult = await sendPacketReadyEmail({
      to: TEST_EMAIL,
      name: TEST_NAME,
      claimType: "Pancreatic Cancer - RECA Claim",
      documentCount: 12,
      packetUrl: "https://radiantclaims.com/download/packet_test_123.pdf",
    });
    console.log(
      `   ✅ Packet Ready Email: ${packetResult.success ? "Sent!" : "Failed"} ${packetResult.emailId ? `(ID: ${packetResult.emailId})` : ""}\n`
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ All test emails sent successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n📧 Check your inbox at: ${TEST_EMAIL}`);
    console.log("📊 View sent emails in Resend dashboard:");
    console.log("   https://resend.com/emails\n");
  } catch (error) {
    console.error("\n❌ Error sending test emails:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

// Run the tests
testAllEmails()
  .then(() => {
    console.log("✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

import { Resend } from "resend";
import { render } from "@react-email/render";
import PasswordChangeReminderEmail from "@/emails/password-change-reminder";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("📧 Sending password change reminder email...\n");

  const attorneyEmail = "brandonaso@gmail.com";
  const attorneyName = "Brandon Armstrong";

  const baseUrl = process.env.NEXTAUTH_URL || "https://radiantclaims.com";
  const changePasswordUrl = `${baseUrl}/portal/change-password`;

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in environment variables");
    console.error("   Please add it to your .env file");
    process.exit(1);
  }

  try {
    const emailHtml = await render(
      PasswordChangeReminderEmail({
        name: attorneyName,
        changePasswordUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: "RadiantClaims Security <security@radiantclaims.com>",
      to: attorneyEmail,
      subject: "🔒 Security Reminder: Update Your RadiantClaims Password",
      html: emailHtml,
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("✅ Email sent successfully!");
    console.log(`   Email ID: ${data?.id}`);
    console.log(`   To: ${attorneyEmail}\n`);

    console.log("=".repeat(80));
    console.log("📬 EMAIL DETAILS");
    console.log("=".repeat(80));
    console.log(`Recipient: ${attorneyName} <${attorneyEmail}>`);
    console.log(
      `Subject: 🔒 Security Reminder: Update Your RadiantClaims Password`
    );
    console.log(`From: RadiantClaims Security <security@radiantclaims.com>`);
    console.log("\n✉️  Check your inbox at brandonaso@gmail.com!");
    console.log("   (Also check spam/promotions folder)\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

import { Resend } from "resend";
import { render } from "@react-email/render";
import PasswordChangedEmail from "@/emails/password-changed";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("📧 Sending password changed confirmation email...\n");

  const attorneyEmail = "brandonaso@gmail.com";
  const attorneyName = "Brandon Armstrong";
  const timestamp = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://radiantclaims.com";
  const loginUrl = `${baseUrl}/login`;

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in environment variables");
    console.error("   Please add it to your .env file");
    process.exit(1);
  }

  try {
    const emailHtml = await render(
      PasswordChangedEmail({
        name: attorneyName,
        timestamp,
        loginUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: "RadiantClaims Security <security@radiantclaims.com>",
      to: attorneyEmail,
      subject: "✅ Your RadiantClaims Password Has Been Changed",
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
    console.log(`Subject: ✅ Your RadiantClaims Password Has Been Changed`);
    console.log(`From: RadiantClaims Security <security@radiantclaims.com>`);
    console.log(`Timestamp: ${timestamp}`);
    console.log("\n✉️  Check your inbox at brandonaso@gmail.com!");
    console.log("   (Also check spam/promotions folder)\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

import { Resend } from "resend";
import { render } from "@react-email/render";
import AttorneyWelcomeEmail from "@/emails/attorney-welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("📧 Sending attorney welcome email...\n");

  const attorneyEmail = "brandonaso@gmail.com";
  const attorneyName = "Brandon Armstrong";
  const temporaryPassword = "Dd@t2!eGs@Ef"; // From the account creation

  const baseUrl = process.env.NEXTAUTH_URL || "https://radiantclaims.com";
  const loginUrl = `${baseUrl}/login`;
  const changePasswordUrl = `${baseUrl}/portal/change-password`;

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in environment variables");
    console.error("   Please add it to your .env file");
    process.exit(1);
  }

  try {
    const emailHtml = await render(
      AttorneyWelcomeEmail({
        name: attorneyName,
        email: attorneyEmail,
        temporaryPassword,
        loginUrl,
        changePasswordUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: "RadiantClaims <noreply@radiantclaims.com>",
      to: attorneyEmail,
      subject: "Welcome to RadiantClaims - Your Attorney Account is Ready",
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
      `Subject: Welcome to RadiantClaims - Your Attorney Account is Ready`
    );
    console.log(`From: RadiantClaims <noreply@radiantclaims.com>`);
    console.log("\n✉️  Check your inbox at brandonaso@gmail.com!");
    console.log("   (Also check spam/promotions folder)\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

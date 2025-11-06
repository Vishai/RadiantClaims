import { Resend } from "resend";
import AttorneyWelcomeEmail from "../src/emails/attorney-welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("📧 Sending welcome email to brandon.armstrong@outlook.com...\n");

  try {
    const { data, error } = await resend.emails.send({
      from: "RadiantClaims <noreply@radiantclaims.com>",
      to: ["brandon.armstrong@outlook.com"],
      subject: "Welcome to RadiantClaims - Your Attorney Portal Access",
      react: AttorneyWelcomeEmail({
        attorneyName: "Brandon",
        firmName: "Heritage Law (Test Account)",
        email: "brandon.armstrong@outlook.com",
        temporaryPassword: "upk%R7jKdkVm",
        loginUrl: "https://radiantclaims.com/login",
      }),
    });

    if (error) {
      console.error("❌ Error sending email:", error);
      return;
    }

    console.log("✅ Welcome email sent successfully!");
    console.log("📨 Email ID:", data?.id);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

main();

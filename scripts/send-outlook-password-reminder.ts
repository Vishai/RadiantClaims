import { Resend } from "resend";
import PasswordChangeReminderEmail from "../src/emails/password-change-reminder";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log(
    "📧 Sending password change reminder to brandon.armstrong@outlook.com...\n"
  );

  try {
    const { data, error } = await resend.emails.send({
      from: "RadiantClaims <noreply@radiantclaims.com>",
      to: ["brandon.armstrong@outlook.com"],
      subject: "Security Reminder: Change Your RadiantClaims Password",
      react: PasswordChangeReminderEmail({
        attorneyName: "Brandon",
        changePasswordUrl:
          "https://radiantclaims.com/portal/change-password?required=true",
      }),
    });

    if (error) {
      console.error("❌ Error sending email:", error);
      return;
    }

    console.log("✅ Password change reminder sent successfully!");
    console.log("📨 Email ID:", data?.id);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

main();

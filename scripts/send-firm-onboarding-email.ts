import { Resend } from "resend";
import FirmOnboardingEmail from "../src/emails/firm-onboarding";
import * as fs from "fs";
import * as path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log(
    "📧 Sending firm onboarding email (DRAFT) to brandon.armstrong@outlook.com...\n"
  );

  // Read the PDF file
  const pdfPath = path.join(
    __dirname,
    "..",
    "Legal_Agreements",
    "Working Agreement Heritage Law Offices & 0tomait LLC dba Radiant Claims.pdf"
  );

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = fs.readFileSync(pdfPath);
    console.log("✅ PDF file loaded successfully");
  } catch (error) {
    console.error("❌ Error loading PDF file:", error);
    console.log("📧 Sending email without attachment...\n");
  }

  try {
    const emailData: any = {
      from: "RadiantClaims <noreply@radiantclaims.com>",
      to: ["brandon.armstrong@outlook.com"],
      subject:
        "[DRAFT] Welcome to RadiantClaims Partnership - Portal Access & Agreement",
      react: FirmOnboardingEmail({
        firmName: "Heritage Law Offices",
        contactName: "Ryan",
        attorneyEmail: "ryan.heritagelaw@gmail.com",
        attorneyPassword: "[ATTORNEY_PASSWORD_HERE]",
        demoEmail: "demo@heritagelaw.com",
        demoPassword: "DemoAccess2025!",
        loginUrl: "https://radiantclaims.com/login",
      }),
    };

    // Add attachment if PDF was loaded
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: "Working_Agreement_Heritage_Law_RadiantClaims.pdf",
          content: pdfBuffer,
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("❌ Error sending email:", error);
      return;
    }

    console.log(
      "✅ DRAFT email sent successfully to brandon.armstrong@outlook.com!"
    );
    console.log("📨 Email ID:", data?.id);
    console.log(
      "\n📝 This is a preview. The actual email to the firm will include:"
    );
    console.log(
      "   • The real attorney password (currently shown as placeholder)"
    );
    console.log("   • Sent to the firm's actual email addresses");
    console.log("   • Working Agreement PDF attached");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

main();

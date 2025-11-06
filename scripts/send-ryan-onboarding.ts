import { Resend } from "resend";
import FirmOnboardingEmail from "../src/emails/firm-onboarding";
import * as fs from "fs";
import * as path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("📧 Sending firm onboarding email to Ryan...\n");

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
      from: "Brandon Armstrong <brandon@radiantclaims.com>",
      to: ["Ryan.heritagelaw@gmail.com"],
      subject:
        "Welcome to RadiantClaims Partnership - Portal Access & Agreement",
      react: FirmOnboardingEmail({
        firmName: "Heritage Law Offices",
        contactName: "Ryan",
        attorneyEmail: "ryan.heritagelaw@gmail.com",
        attorneyPassword: "Xu3V@b3cG6Xg",
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

    console.log("\n✅ Onboarding email sent successfully to Ryan!");
    console.log("📨 Email ID:", data?.id);
    console.log("\n📋 Email contents:");
    console.log("   • Working Agreement PDF attached");
    console.log("   • Attorney credentials: ryan.heritagelaw@gmail.com");
    console.log("   • Demo account: demo@heritagelaw.com / DemoAccess2025!");
    console.log("\n✉️  Sent from: brandon@radiantclaims.com");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

main();

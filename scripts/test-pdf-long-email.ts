/**
 * Test script for PDF form filling with long email address
 * This script specifically tests the email overflow handling
 */

import * as fs from "fs";
import * as path from "path";
import { fillOfficialRECAPDF } from "../src/lib/reca/pdf-form-filler";
import { RECAFormData } from "../src/lib/reca/types";

async function testLongEmailPDF() {
  console.log("🧪 Testing PDF Form Filling with Long Email...\n");

  // Sample data with intentionally long email to test overflow
  const sampleFormData: Partial<RECAFormData> = {
    part_1: {
      firstName: "MARY",
      middleName: "ELIZABETH",
      lastName: "JOHNSON",
      formerNames: ["MARY E. WILLIAMS"],
      ssn: "987-65-4321",
      dob: "1958-11-22",
      mailingAddress: "456 Desert View Road",
      city: "St. George",
      state: "Utah", // Will be converted to "UT"
      zipCode: "84770",
      phoneDay: "435-555-0123",
      phoneEvening: "435-555-0124",
      // Very long email that exceeds 26 characters
      email:
        "mary.elizabeth.johnson.downwinder.claim.2024@radiantclaimsprocessing.com",
      residenceAddress: "456 Desert View Road, St. George, UT 84770",
      tribalAffiliation: "",
      tribalCensusNumber: "",
      tribalAssistance: ["no"],
    },
    part_2: {
      firstName: "ROBERT",
      middleName: "JAMES",
      lastName: "JOHNSON",
      ssn: "123-45-6789",
      dob: "1955-06-15",
      dod: "2023-08-14",
    },
    part_3: {
      relationship: "Spouse",
    },
    part_8: {
      exposureOptions: ["option_1a"],
      affectedAreas: [
        {
          state: "Utah",
          townCity: "St. George",
          timePeriod: "1958-1962",
        },
        {
          state: "Nevada",
          townCity: "Las Vegas",
          timePeriod: "1955-1958",
        },
      ],
      arizonaCounties: [],
      nevadaCounties: [
        {
          county: "Clark",
          townCity: "Las Vegas",
          timePeriod: "1955-1958",
        },
      ],
    },
    part_10: {
      diseases: ["breast", "thyroid"],
    },
    part_13: {
      hasAttorney: true,
      attorneyName: "Sarah Mitchell",
      attorneyAddress: "789 Legal Plaza",
      attorneyCity: "Salt Lake City",
      attorneyState: "Utah",
      attorneyZip: "84101",
      attorneyPhone: "801-555-0199",
      attorneyFax: "801-555-0200",
    },
    part_16: {
      signature: "MARY E. JOHNSON",
      signatureDate: new Date().toLocaleDateString(),
      authorizationAcknowledgment: true,
    },
  };

  // Also test with a shorter email for comparison
  const shortEmailFormData: Partial<RECAFormData> = {
    ...sampleFormData,
    part_1: {
      ...sampleFormData.part_1!,
      firstName: "JOHN",
      middleName: "A",
      lastName: "DOE",
      email: "john.doe@example.com", // Short email that fits in boxes
      state: "California", // Will be converted to "CA"
    },
  };

  try {
    const officialPdfPath = path.join(
      process.cwd(),
      "docs",
      "RECA Downwinder Claim Form.pdf"
    );

    if (!fs.existsSync(officialPdfPath)) {
      console.error("❌ Official PDF not found at:", officialPdfPath);
      process.exit(1);
    }

    console.log("📄 Loading official PDF from:", officialPdfPath);

    // Generate PDF with long email
    console.log("\n📧 Generating PDF with LONG email (73 characters)...");
    const longEmailPdfBytes = await fillOfficialRECAPDF({
      formData: sampleFormData,
      supportingForms: {},
      sessionId: "test-long-email",
      officialPdfPath,
    });

    // Save the long email PDF
    const longEmailOutputPath = path.join(
      process.cwd(),
      "docs",
      "test-output",
      "filled-reca-form-long-email.pdf"
    );
    const outputDir = path.dirname(longEmailOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(longEmailOutputPath, longEmailPdfBytes);
    console.log("✅ Long email PDF saved to:", longEmailOutputPath);

    // Generate PDF with short email for comparison
    console.log("\n📧 Generating PDF with SHORT email (20 characters)...");
    const shortEmailPdfBytes = await fillOfficialRECAPDF({
      formData: shortEmailFormData,
      supportingForms: {},
      sessionId: "test-short-email",
      officialPdfPath,
    });

    const shortEmailOutputPath = path.join(
      process.cwd(),
      "docs",
      "test-output",
      "filled-reca-form-short-email.pdf"
    );
    fs.writeFileSync(shortEmailOutputPath, shortEmailPdfBytes);
    console.log("✅ Short email PDF saved to:", shortEmailOutputPath);

    console.log("\n" + "=".repeat(70));
    console.log("📊 COMPARISON TEST COMPLETE");
    console.log("=".repeat(70));

    console.log("\n📋 Long Email Test (Mary Johnson):");
    console.log(
      "  - Email: mary.elizabeth.johnson.downwinder.claim.2024@radiantclaimsprocessing.com"
    );
    console.log("  - Length: 73 characters (exceeds 26 char limit)");
    console.log('  - State: Utah → Should display as "UT"');
    console.log(
      "  - Expected: First 26 chars in boxes + full email written below"
    );

    console.log("\n📋 Short Email Test (John Doe):");
    console.log("  - Email: john.doe@example.com");
    console.log("  - Length: 20 characters (within limit)");
    console.log('  - State: California → Should display as "CA"');
    console.log("  - Expected: Full email in boxes, no supplemental text");

    console.log("\n🔍 What to verify on Page 1:");
    console.log("  1. LONG EMAIL PDF - Should show:");
    console.log('     • Boxes: "MARY.ELIZABETH.JOHNSON.DOW" (26 chars)');
    console.log(
      '     • Below boxes: "Full email: mary.elizabeth.johnson.downwinder.claim.2024@radiantclaimsprocessing.com"'
    );
    console.log('     • State: "UT" (not "Utah")');
    console.log("\n  2. SHORT EMAIL PDF - Should show:");
    console.log('     • Boxes: "JOHN.DOE@EXAMPLE.COM" (complete email)');
    console.log("     • No supplemental text below");
    console.log('     • State: "CA" (not "California")');

    console.log("\n📂 Files created:");
    console.log(
      "  - Long email: docs/test-output/filled-reca-form-long-email.pdf"
    );
    console.log(
      "  - Short email: docs/test-output/filled-reca-form-short-email.pdf"
    );
    console.log("\n✨ Opening both PDFs for comparison...\n");

    // Open both PDFs for comparison
    const { exec } = require("child_process");
    exec(`open "${longEmailOutputPath}"`);
    setTimeout(() => {
      exec(`open "${shortEmailOutputPath}"`);
    }, 1000);
  } catch (error) {
    console.error("❌ Error filling PDF:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testLongEmailPDF().catch(console.error);

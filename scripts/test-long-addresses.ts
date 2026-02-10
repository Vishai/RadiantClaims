/**
 * Test script for PDF form filling with various address lengths
 * Tests residence address overflow handling on page 2
 */

import * as fs from "fs";
import * as path from "path";
import { fillOfficialRECAPDF } from "../src/lib/reca/pdf-form-filler";
import { RECAFormData } from "../src/lib/reca/types";

async function testAddressOverflow() {
  console.log("🧪 Testing Residence Address Overflow Handling...\n");

  // Test Case 1: Short address (fits on one line - under 26 chars)
  const shortAddressData: Partial<RECAFormData> = {
    part_1: {
      firstName: "ALICE",
      middleName: "MARIE",
      lastName: "SMITH",
      formerNames: [],
      ssn: "111-22-3333",
      dob: "1960-01-15",
      mailingAddress: "789 Oak Street",
      city: "Provo",
      state: "Utah",
      zipCode: "84601",
      phoneDay: "801-555-0111",
      phoneEvening: "801-555-0112",
      email: "alice@example.com",
      // SHORT: 24 characters - fits on line 1
      residenceAddress: "789 Oak St, Provo, UT",
      tribalAffiliation: "",
      tribalCensusNumber: "",
      tribalAssistance: ["no"],
    },
    part_2: {
      firstName: "ROBERT",
      middleName: "",
      lastName: "SMITH",
      ssn: "444-55-6666",
      dob: "1958-03-20",
      dod: "",
    },
    part_3: {
      relationship: "Self",
    },
  };

  // Test Case 2: Medium address (needs two lines - between 26-52 chars)
  const mediumAddressData: Partial<RECAFormData> = {
    ...shortAddressData,
    part_1: {
      ...shortAddressData.part_1!,
      firstName: "BARBARA",
      // MEDIUM: 48 characters - needs intelligent split
      residenceAddress: "12345 North Mountain View Road, St. George, UT",
    },
  };

  // Test Case 3: Long address (exceeds 52 chars - needs supplemental text)
  const longAddressData: Partial<RECAFormData> = {
    ...shortAddressData,
    part_1: {
      ...shortAddressData.part_1!,
      firstName: "CHARLES",
      // LONG: 78 characters - exceeds both lines
      residenceAddress:
        "98765 West Desert Canyon Boulevard Unit 12B, Salt Lake City, Utah 84101-1234",
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
    const outputDir = path.join(process.cwd(), "docs", "test-output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PDF 1: Short Address
    console.log("\n📍 Test 1: SHORT Address (24 chars - fits on line 1)...");
    console.log('   Address: "789 Oak St, Provo, UT"');

    const shortPdfBytes = await fillOfficialRECAPDF({
      formData: shortAddressData,
      supportingForms: {},
      sessionId: "test-short-addr",
      officialPdfPath,
    });

    const shortPath = path.join(outputDir, "filled-reca-short-address.pdf");
    fs.writeFileSync(shortPath, shortPdfBytes);
    console.log("   ✅ Saved to:", shortPath);

    // Generate PDF 2: Medium Address
    console.log(
      "\n📍 Test 2: MEDIUM Address (48 chars - smart split across 2 lines)..."
    );
    console.log('   Address: "12345 North Mountain View Road, St. George, UT"');
    console.log("   Expected: Line 1: Street | Line 2: City, State");

    const mediumPdfBytes = await fillOfficialRECAPDF({
      formData: mediumAddressData,
      supportingForms: {},
      sessionId: "test-medium-addr",
      officialPdfPath,
    });

    const mediumPath = path.join(outputDir, "filled-reca-medium-address.pdf");
    fs.writeFileSync(mediumPath, mediumPdfBytes);
    console.log("   ✅ Saved to:", mediumPath);

    // Generate PDF 3: Long Address
    console.log(
      "\n📍 Test 3: LONG Address (78 chars - needs supplemental text)..."
    );
    console.log(
      '   Address: "98765 West Desert Canyon Boulevard Unit 12B, Salt Lake City, Utah 84101-1234"'
    );
    console.log(
      "   Expected: First 52 chars in boxes + full address printed below"
    );

    const longPdfBytes = await fillOfficialRECAPDF({
      formData: longAddressData,
      supportingForms: {},
      sessionId: "test-long-addr",
      officialPdfPath,
    });

    const longPath = path.join(outputDir, "filled-reca-long-address.pdf");
    fs.writeFileSync(longPath, longPdfBytes);
    console.log("   ✅ Saved to:", longPath);

    console.log("\n" + "=".repeat(70));
    console.log("📊 ADDRESS OVERFLOW TEST COMPLETE");
    console.log("=".repeat(70));

    console.log("\n🔍 What to check on PAGE 2 (Residence Address Section):");
    console.log("\n1️⃣  SHORT ADDRESS PDF (Alice Smith):");
    console.log('   • Line 1: "789 OAK ST, PROVO, UT" (all fits)');
    console.log("   • Line 2: [empty]");
    console.log("   • No supplemental text");

    console.log("\n2️⃣  MEDIUM ADDRESS PDF (Barbara Smith):");
    console.log('   • Line 1: "12345 NORTH MOUNTAIN VIEW " (street part)');
    console.log('   • Line 2: "ROAD, ST. GEORGE, UT" (city/state)');
    console.log("   • No supplemental text (fits in 52 chars)");

    console.log("\n3️⃣  LONG ADDRESS PDF (Charles Smith):");
    console.log('   • Line 1: "98765 WEST DESERT CANYON B" (first 26 chars)');
    console.log('   • Line 2: "OULEVARD UNIT 12B, SALT LA" (next 26 chars)');
    console.log(
      '   • Below boxes: "Full address: 98765 West Desert Canyon Boulevard Unit 12B"'
    );
    console.log(
      '                  "              Salt Lake City, UT 84101-1234"'
    );

    console.log("\n📂 Files created:");
    console.log("  1. Short:  docs/test-output/filled-reca-short-address.pdf");
    console.log("  2. Medium: docs/test-output/filled-reca-medium-address.pdf");
    console.log("  3. Long:   docs/test-output/filled-reca-long-address.pdf");

    console.log("\n✨ Opening all PDFs for comparison...\n");

    // Open all PDFs with delays
    const { exec } = require("child_process");
    exec(`open "${shortPath}"`);
    setTimeout(() => {
      exec(`open "${mediumPath}"`);
    }, 1000);
    setTimeout(() => {
      exec(`open "${longPath}"`);
    }, 2000);

    console.log(
      "📝 Note: Check PAGE 2 of each PDF to see the residence address handling."
    );
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
testAddressOverflow().catch(console.error);

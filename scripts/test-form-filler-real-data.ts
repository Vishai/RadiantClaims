/**
 * Test script to generate a filled RECA PDF from real database session
 */

import { db } from "../src/lib/db";
import { fillOfficialRECAPDF } from "../src/lib/reca/pdf-form-filler";
import * as fs from "fs";
import * as path from "path";

async function testPDFGeneration() {
  const sessionId = "cmh9ofs2t0000r7siub6zrf3o"; // Phil Donahue - most complete session

  console.log(`\n🧪 Testing PDF Form Filler with real data\n`);
  console.log(`Session ID: ${sessionId}\n`);

  // Get the session data from database
  const intakeSession = await db.intakeSession.findUnique({
    where: { id: sessionId },
  });

  if (!intakeSession) {
    console.error("❌ Session not found!");
    process.exit(1);
  }

  console.log("✅ Session found:");
  console.log(`   - Claim Type: ${intakeSession.claimType}`);
  console.log(`   - Has Form Data: ${!!intakeSession.recaFormData}`);

  const formData = intakeSession.recaFormData as any;
  const supportingForms = intakeSession.recaSupportingForms as any;

  console.log(`   - Form Parts: ${Object.keys(formData || {}).join(", ")}\n`);

  // Path to the official RECA PDF template
  const officialPdfPath = path.join(
    process.cwd(),
    "public",
    "forms",
    "reca-downwinder-claim-form.pdf"
  );

  if (!fs.existsSync(officialPdfPath)) {
    console.error(`❌ Official PDF template not found at: ${officialPdfPath}`);
    process.exit(1);
  }

  console.log("✅ Official PDF template found\n");

  try {
    console.log("📝 Generating filled PDF...");
    const pdfBytes = await fillOfficialRECAPDF({
      formData: formData || {},
      supportingForms: supportingForms || {},
      sessionId,
      officialPdfPath,
    });

    // Save to test output
    const outputDir = path.join(process.cwd(), "docs", "test-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "filled-form-phil-donahue.pdf");
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`\n✅ Success! PDF generated and saved`);
    console.log(`   - Location: ${outputPath}`);
    console.log(`   - Size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
    console.log(`\n👉 Open the PDF to review the filled form!\n`);
  } catch (error) {
    console.error("\n❌ Error generating PDF:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

testPDFGeneration()
  .then(() => {
    console.log("✨ Test completed successfully!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

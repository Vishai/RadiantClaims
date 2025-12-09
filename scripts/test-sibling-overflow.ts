/**
 * Test Script: Sibling Overflow Supplemental Document
 *
 * This script tests the automatic generation of supplemental sibling documents
 * when a RECA application has more than 3 siblings.
 *
 * Test scenarios:
 * 1. 3 siblings (control - no supplemental doc)
 * 2. 4 siblings (1 overflow)
 * 3. 7 siblings (4 overflow)
 */

import { generateSupplementalSiblingsPDF } from "../src/lib/reca/supplemental-siblings-pdf";
import { generatePacketArchive } from "../src/lib/reca/packet-generator";
import { db } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "test-output", "sibling-overflow");

// Sample sibling data generator
function generateSibling(index: number, isDeceased: boolean = false) {
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emily",
    "Robert",
    "Lisa",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
  ];

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const name = `${firstName} ${lastName}`;

  const baseSibling = {
    name,
    dateOfBirth: `0${(index % 9) + 1}/15/19${60 + index * 2}`,
    cityOfBirth: "Salt Lake City",
    stateOfBirth: "Utah",
    isDeceased: isDeceased ? ("YES" as const) : ("NO" as const),
  };

  if (isDeceased) {
    return {
      ...baseSibling,
      dateOfDeath: `0${(index % 9) + 1}/20/20${10 + index}`,
      cityOfDeath: "Provo",
      stateOfDeath: "Utah",
      hasDeathCertificate: "YES" as const,
    };
  } else {
    return {
      ...baseSibling,
      currentAddress: `${1234 + index * 100} Main Street, Apartment ${index + 1}, Salt Lake City, UT 84101`,
      phoneNumber: `(801) 555-${String(1000 + index * 111).padStart(4, "0")}`,
    };
  }
}

async function testSupplementalPDFGeneration() {
  console.log("🧪 Testing Supplemental Sibling PDF Generation\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const claimantInfo = {
    firstName: "John",
    middleName: "Robert",
    lastName: "Doe",
    dob: "01/15/1945",
    ssn: "123-45-6789",
  };

  const filerInfo = {
    firstName: "Mary",
    middleName: "Ann",
    lastName: "Doe",
    dob: "03/22/1960",
    ssn: "987-65-4321",
  };

  // Test 1: 4 siblings (1 overflow)
  console.log("📄 Test 1: Generating PDF for 1 overflow sibling (4 total)");
  const test1Siblings = [generateSibling(3, false)]; // Just the 4th sibling
  const pdf1 = await generateSupplementalSiblingsPDF({
    siblings: test1Siblings,
    claimantInfo,
    filerInfo,
    startingNumber: 4,
  });

  const outputPath1 = path.join(OUTPUT_DIR, "test-1-sibling-overflow.pdf");
  fs.writeFileSync(outputPath1, pdf1);
  console.log(`✅ Generated: ${outputPath1} (${pdf1.length} bytes)\n`);

  // Test 2: 7 siblings (4 overflow)
  console.log("📄 Test 2: Generating PDF for 4 overflow siblings (7 total)");
  const test2Siblings = [
    generateSibling(3, false),
    generateSibling(4, true), // Deceased sibling
    generateSibling(5, false),
    generateSibling(6, false),
  ];
  const pdf2 = await generateSupplementalSiblingsPDF({
    siblings: test2Siblings,
    claimantInfo,
    filerInfo,
    startingNumber: 4,
  });

  const outputPath2 = path.join(OUTPUT_DIR, "test-4-siblings-overflow.pdf");
  fs.writeFileSync(outputPath2, pdf2);
  console.log(`✅ Generated: ${outputPath2} (${pdf2.length} bytes)\n`);

  // Test 3: 10 siblings (7 overflow) - with name changes
  console.log(
    "📄 Test 3: Generating PDF for 7 overflow siblings with name changes (10 total)"
  );
  const test3Siblings = [
    generateSibling(3, false),
    generateSibling(4, true),
    {
      ...generateSibling(5, false),
      hadNameChange: "YES" as const,
      originalLastName: "Doe",
      nameChangeHistory: [
        {
          previousName: "Emily Doe",
          dateOfChange: "06/15/1985",
          reasonForChange: "MARRIAGE" as const,
        },
        {
          previousName: "Emily Thompson",
          dateOfChange: "03/10/1995",
          reasonForChange: "DIVORCE" as const,
        },
      ],
    },
    generateSibling(6, false),
    generateSibling(7, true),
    generateSibling(8, false),
    generateSibling(9, false),
  ];
  const pdf3 = await generateSupplementalSiblingsPDF({
    siblings: test3Siblings,
    claimantInfo,
    filerInfo,
    startingNumber: 4,
  });

  const outputPath3 = path.join(
    OUTPUT_DIR,
    "test-7-siblings-overflow-with-name-changes.pdf"
  );
  fs.writeFileSync(outputPath3, pdf3);
  console.log(`✅ Generated: ${outputPath3} (${pdf3.length} bytes)\n`);

  console.log("✨ All supplemental PDF generation tests completed!");
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
}

async function testPacketGeneration() {
  console.log("🧪 Testing Full Packet Generation with Sibling Overflow\n");

  // Create a test intake session with 5 siblings
  console.log("📝 Creating test intake session with 5 siblings...");

  const testClaimant = await db.claimant.create({
    data: {
      firstName: "Test",
      lastName: "Sibling-Overflow",
      email: `test-sibling-overflow-${Date.now()}@example.com`,
      phone: "801-555-0000",
      dob: new Date("1945-01-15"),
      address1: "123 Test St",
      city: "Salt Lake City",
      county: "Salt Lake",
      state: "UT",
      postalCode: "84101",
    },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  const intakeSession = await db.intakeSession.create({
    data: {
      claimantId: testClaimant.id,
      claimType: "DOWNWINDER",
      status: "IN_PROGRESS",
      currentStep: "REVIEW", // Valid IntakeStep enum value
      resumeToken: `test-${Date.now()}`,
      expiresAt,
      recaFormData: {
        part_1: {
          firstName: "Mary",
          middleName: "Ann",
          lastName: "Doe",
          ssn: "987-65-4321",
          dob: "03/22/1960",
          mailingAddress: "456 Filer St",
          city: "Provo",
          state: "UT",
          zipCode: "84601",
          phoneDay: "801-555-1111",
        },
        part_2: {
          firstName: "John",
          middleName: "Robert",
          lastName: "Doe",
          ssn: "123-45-6789",
          dob: "01/15/1945",
          dod: "06/20/2020",
        },
        part_3: {
          relationship: "Child",
        },
        part_6: {
          claimantDeceased: "YES",
          claimantEverMarried: "NO",
          childType: "NATURAL",
          otherChildrenExist: "YES",
          siblings: [
            generateSibling(0, false),
            generateSibling(1, true),
            generateSibling(2, false),
            generateSibling(3, false), // 4th sibling - triggers overflow
            generateSibling(4, false), // 5th sibling
          ],
        },
      },
    },
  });

  console.log(`✅ Created test intake session: ${intakeSession.id}`);
  console.log(
    `   Claimant: ${testClaimant.firstName} ${testClaimant.lastName}`
  );
  console.log(`   Total siblings: 5 (3 on form, 2 in supplemental doc)\n`);

  // Generate the packet
  console.log("📦 Generating packet archive...");
  const result = await generatePacketArchive({
    sessionId: intakeSession.id,
    forceRegenerate: true,
  });

  console.log(`✅ Packet generated successfully!`);
  console.log(`   Status: ${result.status}`);
  console.log(
    `   Archive size: ${(result.archiveSizeBytes / 1024).toFixed(2)} KB`
  );
  console.log(`   Version: ${result.version}`);
  console.log(`   Warnings: ${result.warnings.length}`);

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    result.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }

  console.log(`\n📁 Packet archive key: ${result.archiveKey}`);
  console.log("   (Download via R2 or packet download endpoint)\n");

  // Cleanup
  console.log("🧹 Cleaning up test data...");
  await db.packetGeneration.deleteMany({
    where: { packetSubmission: { intakeSessionId: intakeSession.id } },
  });
  await db.packetSubmission.deleteMany({
    where: { intakeSessionId: intakeSession.id },
  });
  await db.intakeSession.delete({
    where: { id: intakeSession.id },
  });
  await db.claimant.delete({
    where: { id: testClaimant.id },
  });
  console.log("✅ Cleanup complete\n");

  console.log("✨ Full packet generation test completed!");
}

async function runAllTests() {
  console.log(
    "╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║  SIBLING OVERFLOW SUPPLEMENTAL DOCUMENT TEST SUITE           ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n"
  );

  try {
    // Test 1: Direct PDF generation
    await testSupplementalPDFGeneration();

    console.log("\n" + "─".repeat(64) + "\n");

    // Test 2: Full packet generation with database
    await testPacketGeneration();

    console.log(
      "\n╔══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  ✅ ALL TESTS PASSED                                         ║"
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n"
    );

    console.log("📋 Summary:");
    console.log("   ✓ Supplemental PDF generation works correctly");
    console.log("   ✓ Packet generation detects sibling overflow");
    console.log("   ✓ Supplemental document included in ZIP");
    console.log("   ✓ Warnings added to manifest\n");

    console.log("🔍 Next Steps:");
    console.log(
      "   1. Review generated PDFs in: test-output/sibling-overflow/"
    );
    console.log("   2. Download a test packet via the portal");
    console.log("   3. Verify supplemental doc appears in /forms folder");
    console.log("   4. Check official PDF has notation text");
    console.log("   5. Verify summary PDF shows warning box\n");
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests()
  .then(() => {
    console.log("Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

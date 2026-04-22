/**
 * Test Script for AI Validation Orchestration Service
 *
 * This script tests the orchestration service by:
 * 1. Creating a test intake session with sample documents
 * 2. Running the full validation pipeline
 * 3. Verifying results in the database
 *
 * Usage:
 *   npx tsx scripts/test-orchestration.ts
 */

import { db } from "@/lib/db";
import {
  validateDocument,
  validateSession,
  extractSessionData,
  checkSessionCompleteness,
  runFullValidation,
  getValidationStatus,
} from "@/lib/ai-agents/orchestration-service";

// Test configuration
const TEST_SESSION_NAME = "Test AI Validation Session";
const MOCK_FILE_KEY = "test/sample-document.pdf";

/**
 * Cleanup: Remove any existing test data
 */
async function cleanup() {
  console.log("🧹 Cleaning up previous test data...");

  // Find test sessions
  const testSessions = await db.intakeSession.findMany({
    where: {
      claimant: {
        email: { contains: "test-orchestration@" },
      },
    },
    include: {
      uploadedFiles: true,
      claimReadiness: true,
    },
  });

  for (const session of testSessions) {
    // Delete related data
    if (session.claimReadiness) {
      await db.claimReadiness.delete({
        where: { id: session.claimReadiness.id },
      });
    }

    for (const file of session.uploadedFiles) {
      // Delete document validations
      await db.documentValidation.deleteMany({
        where: { uploadedFileId: file.id },
      });

      // Delete agent logs
      await db.agentExecutionLog.deleteMany({
        where: { uploadedFileId: file.id },
      });
    }

    // Delete uploaded files
    await db.uploadedFile.deleteMany({
      where: { intakeSessionId: session.id },
    });

    // Delete the session
    await db.intakeSession.delete({
      where: { id: session.id },
    });
  }

  // Delete test claimants
  await db.claimant.deleteMany({
    where: {
      email: { contains: "test-orchestration@" },
    },
  });

  console.log("✅ Cleanup complete\n");
}

/**
 * Create a test claimant and intake session
 */
async function createTestSession(): Promise<string> {
  console.log("📝 Creating test session...");

  // Create test claimant
  const claimant = await db.claimant.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      email: `test-orchestration@example.com`,
      phone: "555-0100",
      dob: new Date("1950-01-01"),
      address1: "123 Test St",
      city: "Las Vegas",
      county: "Clark",
      state: "NV",
      postalCode: "89101",
      claimType: "THYROID_CANCER",
    },
  });

  // Create intake session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  const session = await db.intakeSession.create({
    data: {
      claimantId: claimant.id,
      status: "IN_PROGRESS",
      currentStep: "MEDICAL",
      resumeToken: `test-${Date.now()}`,
      expiresAt,
    },
  });

  console.log(`✅ Created test session: ${session.id}`);
  console.log(`   Claimant: ${claimant.firstName} ${claimant.lastName}\n`);

  return session.id;
}

/**
 * Create sample uploaded files for testing
 */
async function createSampleDocuments(sessionId: string): Promise<string[]> {
  console.log("📄 Creating sample documents...");

  const documents = [
    {
      name: "birth_certificate.pdf",
      category: "IDENTITY" as const,
      text: "BIRTH CERTIFICATE\nState of Nevada\nName: John Doe\nDate of Birth: January 1, 1950\nPlace of Birth: Las Vegas, Clark County, Nevada",
    },
    {
      name: "pathology_report.pdf",
      category: "PATHOLOGY_REPORT" as const,
      text: "PATHOLOGY REPORT\nPatient: John Doe\nDiagnosis: Papillary Thyroid Carcinoma\nDate: 2023-05-15\nPathologist: Dr. Smith",
    },
    {
      name: "utility_bill.pdf",
      category: "UTILITY_BILL" as const,
      text: "NEVADA POWER COMPANY\nAccount Holder: John Doe\nService Address: 123 Main St, Las Vegas, NV 89101\nBilling Period: January 1952",
    },
    {
      name: "employment_letter.pdf",
      category: "EMPLOYMENT_RECORDS" as const,
      text: "EMPLOYMENT VERIFICATION\nEmployee: John Doe\nEmployer: Nevada Test Site\nPosition: Technician\nEmployment Period: 1951-1958",
    },
  ];

  const fileIds: string[] = [];

  for (const doc of documents) {
    const file = await db.uploadedFile.create({
      data: {
        intakeSessionId: sessionId,
        fileKey: `${MOCK_FILE_KEY}/${doc.name}`,
        originalFilename: doc.name,
        mimeType: "application/pdf",
        sizeBytes: 1024,
        category: doc.category,
        status: "READY",
        ocrText: doc.text,
        ocrConfidence: 0.95,
      },
    });

    fileIds.push(file.id);
    console.log(`   ✅ Created: ${doc.name} (${doc.category})`);
  }

  console.log(`\n✅ Created ${fileIds.length} sample documents\n`);
  return fileIds;
}

/**
 * Test 1: Validate a single document
 */
async function testValidateDocument(fileId: string) {
  console.log("🧪 TEST 1: Validate Single Document");
  console.log("=====================================");

  try {
    const result = await validateDocument(fileId);
    console.log("✅ Result:", result);

    // Check database
    const validation = await db.documentValidation.findUnique({
      where: { uploadedFileId: fileId },
    });

    console.log("📊 Database record:", {
      status: validation?.status,
      category: validation?.documentCategory,
      confidence: validation?.overallConfidence,
    });
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("\n");
}

/**
 * Test 2: Validate entire session (parallel)
 */
async function testValidateSession(sessionId: string) {
  console.log("🧪 TEST 2: Validate Entire Session (Parallel)");
  console.log("===============================================");

  try {
    const result = await validateSession(sessionId);
    console.log("✅ Result:", result);
    console.log(`   Validated: ${result.validated}/${result.totalDocuments}`);
    console.log(`   Failed: ${result.failed}`);

    // Check validation status
    const status = await getValidationStatus(sessionId);
    console.log("📊 Validation Status:", status);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("\n");
}

/**
 * Test 3: Extract session data
 */
async function testExtractSessionData(sessionId: string) {
  console.log("🧪 TEST 3: Extract Session Data");
  console.log("=================================");

  try {
    await extractSessionData(sessionId);
    console.log("✅ Data extraction completed");

    // Check database
    const session = await db.intakeSession.findUnique({
      where: { id: sessionId },
      select: { recaFormData: true },
    });

    console.log("📊 Extracted Data:", {
      hasData: !!session?.recaFormData,
      dataKeys: session?.recaFormData
        ? Object.keys(session.recaFormData as object)
        : [],
    });
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("\n");
}

/**
 * Test 4: Check completeness
 */
async function testCheckCompleteness(sessionId: string) {
  console.log("🧪 TEST 4: Check Session Completeness");
  console.log("======================================");

  try {
    const result = await checkSessionCompleteness(sessionId);
    console.log("✅ Completeness Result:");
    console.log(`   Readiness Score: ${result.readinessScore}/100`);
    console.log(`   Ready for Submission: ${result.isReadyForSubmission}`);
    console.log(`   Critical Blockers: ${result.criticalBlockers.length}`);
    console.log(`   Warnings: ${result.warnings.length}`);
    console.log(`   Recommendations: ${result.recommendations.length}`);

    // Check database
    const readiness = await db.claimReadiness.findUnique({
      where: { intakeSessionId: sessionId },
    });

    console.log("📊 Database record:", {
      readinessScore: readiness?.readinessScore,
      isReady: readiness?.isReadyForSubmission,
      nameConsistent: readiness?.nameConsistent,
      datesConsistent: readiness?.datesConsistent,
    });
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("\n");
}

/**
 * Test 5: Run full validation pipeline
 */
async function testFullValidation(sessionId: string) {
  console.log("🧪 TEST 5: Run Full Validation Pipeline");
  console.log("=========================================");

  try {
    const result = await runFullValidation(sessionId);
    console.log("✅ Full Validation Result:");
    console.log(`   Documents Validated: ${result.documentsValidated}`);
    console.log(`   Documents Failed: ${result.documentsFailed}`);
    console.log(`   Data Extracted: ${result.dataExtracted}`);
    console.log(`   Readiness Score: ${result.readinessScore}/100`);
    console.log(`   Ready for Submission: ${result.isReadyForSubmission}`);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("\n");
}

/**
 * Display final summary
 */
async function displaySummary(sessionId: string) {
  console.log("📊 FINAL SUMMARY");
  console.log("================");

  const session = await db.intakeSession.findUnique({
    where: { id: sessionId },
    include: {
      uploadedFiles: {
        include: {
          validation: true,
        },
      },
      claimReadiness: true,
      agentLogs: true,
    },
  });

  if (!session) {
    console.log("❌ Session not found");
    return;
  }

  console.log(`\n📁 Session: ${session.id}`);
  console.log(`   Status: ${session.status}`);

  console.log(`\n📄 Documents (${session.uploadedFiles.length}):`);
  for (const file of session.uploadedFiles) {
    console.log(`   - ${file.originalFilename}`);
    console.log(`     Category: ${file.validation?.documentCategory || "N/A"}`);
    console.log(`     Status: ${file.validation?.status || "N/A"}`);
    console.log(
      `     Confidence: ${file.validation?.overallConfidence || "N/A"}`
    );
  }

  console.log(`\n🤖 Agent Executions (${session.agentLogs.length}):`);
  const agentStats = session.agentLogs.reduce(
    (acc, log) => {
      acc[log.agentName] = (acc[log.agentName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [agent, count] of Object.entries(agentStats)) {
    console.log(`   - ${agent}: ${count} executions`);
  }

  if (session.claimReadiness) {
    console.log(`\n✅ Claim Readiness:`);
    console.log(`   Score: ${session.claimReadiness.readinessScore}/100`);
    console.log(`   Ready: ${session.claimReadiness.isReadyForSubmission}`);
    console.log(
      `   Critical Blockers: ${session.claimReadiness.criticalBlockers.length}`
    );
    console.log(`   Warnings: ${session.claimReadiness.warnings.length}`);
  }

  console.log("\n");
}

/**
 * Main test runner
 */
async function main() {
  console.log("🚀 AI Validation Orchestration Service Test\n");
  console.log("===========================================\n");

  try {
    // Cleanup previous test data
    await cleanup();

    // Create test session
    const sessionId = await createTestSession();

    // Create sample documents
    const fileIds = await createSampleDocuments(sessionId);

    // Run tests
    console.log("🧪 RUNNING TESTS\n");

    // Test individual document validation
    await testValidateDocument(fileIds[0]);

    // Test session validation (this will validate remaining documents)
    await testValidateSession(sessionId);

    // Test data extraction
    await testExtractSessionData(sessionId);

    // Test completeness check
    await testCheckCompleteness(sessionId);

    // Display summary
    await displaySummary(sessionId);

    console.log("✅ ALL TESTS COMPLETED!\n");
    console.log(
      "💡 To test the full pipeline on a fresh session, uncomment the"
    );
    console.log("   testFullValidation() call in the script.\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the tests
main();

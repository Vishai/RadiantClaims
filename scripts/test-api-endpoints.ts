/**
 * Test Script for Validation API Endpoints
 *
 * This script tests the API endpoints by making HTTP requests.
 * Note: This requires the dev server to be running.
 *
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. In another terminal: npx tsx scripts/test-api-endpoints.ts
 */

import { db } from "@/lib/db";

const API_BASE = "http://localhost:3000/api";

/**
 * Setup: Create test data
 */
async function setupTestData() {
  console.log("📝 Setting up test data...\n");

  // Create test claimant
  const claimant = await db.claimant.create({
    data: {
      firstName: "Jane",
      lastName: "Smith",
      email: `test-api-${Date.now()}@example.com`,
      phone: "555-0200",
      dob: new Date("1955-01-01"),
      address1: "456 Test Ave",
      city: "Phoenix",
      county: "Maricopa",
      state: "AZ",
      postalCode: "85001",
      claimType: "LUNG_CANCER",
    },
  });

  // Create intake session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session = await db.intakeSession.create({
    data: {
      claimantId: claimant.id,
      status: "IN_PROGRESS",
      currentStep: "MEDICAL",
      resumeToken: `test-api-${Date.now()}`,
      expiresAt,
    },
  });

  // Create sample documents
  const documents = [
    {
      name: "drivers_license.pdf",
      category: "IDENTITY" as const,
      text: "DRIVER LICENSE\nState of Arizona\nName: Jane Smith\nDOB: 01/01/1955",
    },
    {
      name: "medical_diagnosis.pdf",
      category: "MEDICAL_RECORDS" as const,
      text: "MEDICAL REPORT\nPatient: Jane Smith\nDiagnosis: Non-small cell lung cancer\nDate: 2023-06-20",
    },
  ];

  const fileIds: string[] = [];

  for (const doc of documents) {
    const file = await db.uploadedFile.create({
      data: {
        intakeSessionId: session.id,
        fileKey: `test/api/${doc.name}`,
        originalFilename: doc.name,
        mimeType: "application/pdf",
        sizeBytes: 2048,
        category: doc.category,
        status: "READY",
        ocrText: doc.text,
        ocrConfidence: 0.92,
      },
    });
    fileIds.push(file.id);
  }

  console.log(`✅ Created session: ${session.id}`);
  console.log(`✅ Created ${fileIds.length} documents\n`);

  return { sessionId: session.id, fileIds };
}

/**
 * Cleanup test data
 */
async function cleanup(sessionId: string) {
  console.log("\n🧹 Cleaning up test data...");

  const session = await db.intakeSession.findUnique({
    where: { id: sessionId },
    include: {
      uploadedFiles: true,
      claimant: true,
      claimReadiness: true,
    },
  });

  if (session) {
    // Delete claim readiness
    if (session.claimReadiness) {
      await db.claimReadiness.delete({
        where: { id: session.claimReadiness.id },
      });
    }

    // Delete validations and files
    for (const file of session.uploadedFiles) {
      await db.documentValidation.deleteMany({
        where: { uploadedFileId: file.id },
      });
      await db.agentExecutionLog.deleteMany({
        where: { uploadedFileId: file.id },
      });
    }

    await db.uploadedFile.deleteMany({
      where: { intakeSessionId: session.id },
    });

    await db.intakeSession.delete({
      where: { id: session.id },
    });

    if (session.claimant) {
      await db.claimant.delete({
        where: { id: session.claimant.id },
      });
    }
  }

  console.log("✅ Cleanup complete\n");
}

/**
 * Test 1: POST /api/validation/document
 */
async function testDocumentEndpoint(fileId: string) {
  console.log("🧪 TEST 1: POST /api/validation/document");
  console.log("==========================================");

  try {
    const response = await fetch(`${API_BASE}/validation/document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadedFileId: fileId }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ Document validation endpoint working!\n");
    } else {
      console.log("❌ Document validation endpoint failed\n");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Test 2: POST /api/validation/session (documents only)
 */
async function testSessionEndpoint(sessionId: string) {
  console.log("🧪 TEST 2: POST /api/validation/session (documents only)");
  console.log("==========================================================");

  try {
    const response = await fetch(`${API_BASE}/validation/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeSessionId: sessionId,
        runFullPipeline: false,
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ Session validation endpoint working!\n");
    } else {
      console.log("❌ Session validation endpoint failed\n");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Test 3: POST /api/validation/session (full pipeline)
 */
async function testFullPipelineEndpoint(sessionId: string) {
  console.log("🧪 TEST 3: POST /api/validation/session (full pipeline)");
  console.log("=========================================================");

  try {
    const response = await fetch(`${API_BASE}/validation/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeSessionId: sessionId,
        runFullPipeline: true,
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ Full pipeline endpoint working!\n");
    } else {
      console.log("❌ Full pipeline endpoint failed\n");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Test 4: GET /api/validation/status/[sessionId]
 */
async function testStatusEndpoint(sessionId: string) {
  console.log("🧪 TEST 4: GET /api/validation/status/[sessionId]");
  console.log("===================================================");

  try {
    const response = await fetch(`${API_BASE}/validation/status/${sessionId}`, {
      method: "GET",
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ Status endpoint working!\n");
    } else {
      console.log("❌ Status endpoint failed\n");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("🚀 API Endpoints Test Suite\n");
  console.log("============================\n");

  let sessionId: string | undefined;

  try {
    // Setup test data
    const { sessionId: sid, fileIds } = await setupTestData();
    sessionId = sid;

    // Wait a moment for database
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Run tests
    console.log("🧪 RUNNING API TESTS\n");

    // Test 1: Single document validation
    await testDocumentEndpoint(fileIds[0]);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Session validation (documents only)
    await testSessionEndpoint(sessionId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 3: Status check
    await testStatusEndpoint(sessionId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 4: Full pipeline (this one takes longer)
    console.log(
      "⏳ Running full pipeline test (this may take 30-60 seconds)...\n"
    );
    await testFullPipelineEndpoint(sessionId);

    // Final status check
    console.log("🔍 Final status check after full pipeline:");
    await testStatusEndpoint(sessionId);

    console.log("\n✅ ALL API TESTS COMPLETED!\n");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  } finally {
    // Cleanup
    if (sessionId) {
      await cleanup(sessionId);
    }
    await db.$disconnect();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return true;
  } catch {
    return false;
  }
}

// Run tests
checkServer().then((isRunning) => {
  if (!isRunning) {
    console.error("❌ Error: Dev server is not running!");
    console.log("\nPlease start the dev server first:");
    console.log("  npm run dev\n");
    console.log("Then run this script in another terminal:\n");
    console.log("  npx tsx scripts/test-api-endpoints.ts\n");
    process.exit(1);
  } else {
    main();
  }
});

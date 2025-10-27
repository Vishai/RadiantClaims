/**
 * Script to seed fake documents for testing the attorney portal
 *
 * Usage: npx tsx scripts/seed-documents.ts
 */

import { db } from "../src/lib/db";
import { FileCategory, FileStatus } from "@prisma/client";

const INTAKE_SESSIONS = [
  "intake-jane-001",
  "intake-brandon-002",
  "cmh7b4fdb000f13lhr679hci3"
];

const DOCUMENT_CATEGORIES: FileCategory[] = [
  "IDENTITY",
  "PROOF_OF_RESIDENCE",
  "PATHOLOGY_REPORT",
  "MEDICAL_RECORDS",
  "UTILITY_BILL",
];

interface FakeDocument {
  intakeSessionId: string;
  fileKey: string;
  originalFilename: string;
  category: FileCategory;
  status: FileStatus;
  sizeBytes: number;
  mimeType: string;
}

function generateFakeDocuments(): FakeDocument[] {
  const documents: FakeDocument[] = [];
  let docCounter = 1;

  for (const sessionId of INTAKE_SESSIONS) {
    // Generate 3-5 documents per session
    const numDocs = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numDocs; i++) {
      const category = DOCUMENT_CATEGORIES[i % DOCUMENT_CATEGORIES.length];
      const status: FileStatus =
        Math.random() > 0.3 ? "VALIDATED" :
        Math.random() > 0.5 ? "READY" : "AWAITING_REVIEW";

      documents.push({
        intakeSessionId: sessionId,
        fileKey: `fake-documents/${sessionId}/doc-${docCounter}.pdf`,
        originalFilename: `${category?.toLowerCase().replace(/_/g, "-") || 'document'}-${docCounter}.pdf`,
        category: category || "IDENTITY",
        status,
        sizeBytes: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        mimeType: "application/pdf",
      });

      docCounter++;
    }
  }

  return documents;
}

async function seedDocuments() {
  console.log("🌱 Seeding fake documents...\n");

  try {
    const documents = generateFakeDocuments();

    console.log(`📄 Generating ${documents.length} fake documents...`);

    for (const doc of documents) {
      const created = await db.uploadedFile.create({
        data: {
          intakeSessionId: doc.intakeSessionId,
          fileKey: doc.fileKey,
          originalFilename: doc.originalFilename,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          category: doc.category,
          status: doc.status,
          isRequired: true,
          requiresOriginal: doc.category === "PATHOLOGY_REPORT",
          validatedBy: doc.status === "VALIDATED" ? "admin@radiantclaims.dev" : null,
          validatedAt: doc.status === "VALIDATED" ? new Date() : null,
          uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
          processedAt: new Date(),
        },
      });

      console.log(`  ✓ Created: ${created.originalFilename} (${created.category})`);
    }

    // Get summary
    const summary = await db.uploadedFile.groupBy({
      by: ["intakeSessionId"],
      _count: true,
      where: {
        intakeSessionId: {
          in: INTAKE_SESSIONS,
        },
      },
    });

    console.log("\n📊 Summary:");
    for (const item of summary) {
      const session = await db.intakeSession.findUnique({
        where: { id: item.intakeSessionId },
        include: { claimant: true },
      });

      if (session?.claimant) {
        console.log(
          `  ${session.claimant.firstName} ${session.claimant.lastName}: ${item._count} documents`
        );
      }
    }

    console.log("\n✅ Document seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding documents:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
seedDocuments();

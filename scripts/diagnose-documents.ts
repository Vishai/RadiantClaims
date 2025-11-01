/**
 * Diagnostic script to check document upload and processing status
 * Run with: npx tsx scripts/diagnose-documents.ts
 */

import { db } from "../src/lib/db";

async function diagnoseDocuments() {
  console.log("🔍 Diagnosing document upload and processing...\n");

  try {
    // Get all recent uploaded files
    const recentFiles = await db.uploadedFile.findMany({
      orderBy: { uploadedAt: "desc" },
      take: 10,
      include: {
        intakeSession: {
          select: {
            id: true,
            claimant: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tags: true,
      },
    });

    console.log(`Found ${recentFiles.length} recent files:\n`);

    for (const file of recentFiles) {
      console.log(`📄 File: ${file.originalFilename}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Status: ${file.status}`);
      console.log(`   Category: ${file.category || "N/A"}`);
      console.log(`   File Key: ${file.fileKey}`);
      console.log(`   Size: ${(file.sizeBytes / 1024).toFixed(1)} KB`);
      console.log(`   Uploaded: ${file.uploadedAt.toISOString()}`);
      console.log(
        `   Processed: ${file.processedAt?.toISOString() || "Not yet"}`
      );
      console.log(
        `   OCR Confidence: ${file.ocrConfidence ? (file.ocrConfidence * 100).toFixed(0) + "%" : "N/A"}`
      );
      console.log(`   OCR Text Length: ${file.ocrText?.length || 0} chars`);
      console.log(
        `   Tags: ${file.tags.length > 0 ? file.tags.map((t) => t.tag).join(", ") : "None"}`
      );

      // Check metadata
      let metadata: any = null;
      if (file.metadata) {
        try {
          metadata =
            typeof file.metadata === "string"
              ? JSON.parse(file.metadata)
              : file.metadata;
        } catch (e) {
          console.log(`   ⚠️  Failed to parse metadata`);
        }
      }

      if (metadata) {
        console.log(`   Metadata Present: ✓`);
        console.log(
          `     - OCR Confidence: ${metadata.ocrConfidence ? (metadata.ocrConfidence * 100).toFixed(0) + "%" : "N/A"}`
        );
        console.log(`     - Page Count: ${metadata.pageCount || "N/A"}`);
        console.log(`     - Entities: ${metadata.entities ? "✓" : "✗"}`);
        console.log(`     - Compliance: ${metadata.compliance ? "✓" : "✗"}`);
        console.log(`     - Risks: ${metadata.risks ? "✓" : "✗"}`);
        console.log(
          `     - AI Categorization: ${metadata.aiCategorization ? "✓" : "✗"}`
        );

        if (metadata.compliance) {
          console.log(
            `     - Claim Type: ${metadata.compliance.claimTypeSuspected || "N/A"}`
          );
          console.log(
            `     - Checklist Coverage: ${metadata.compliance.checklistCoverage ? (metadata.compliance.checklistCoverage * 100).toFixed(0) + "%" : "N/A"}`
          );
        }
      } else {
        console.log(`   Metadata: ✗ (No AI analysis data)`);
      }

      console.log("");
    }

    // Check for failed files
    const failedFiles = await db.uploadedFile.count({
      where: { status: "FAILED" },
    });

    const processingFiles = await db.uploadedFile.count({
      where: { status: "PROCESSING" },
    });

    const uploadingFiles = await db.uploadedFile.count({
      where: { status: "UPLOADING" },
    });

    console.log("\n📊 Status Summary:");
    console.log(`   Failed files: ${failedFiles}`);
    console.log(`   Processing files: ${processingFiles}`);
    console.log(`   Uploading files: ${uploadingFiles}`);

    // Check for files without metadata
    const filesWithoutMetadata = await db.uploadedFile.count({
      where: {
        status: "READY",
        metadata: null,
      },
    });

    console.log(`   Ready files without metadata: ${filesWithoutMetadata}`);

    // Check R2 configuration
    console.log("\n🔑 R2 Configuration:");
    console.log(
      `   CLOUDFLARE_ACCOUNT_ID: ${process.env.CLOUDFLARE_ACCOUNT_ID ? "✓" : "✗"}`
    );
    console.log(
      `   CLOUDFLARE_R2_ACCESS_KEY_ID: ${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? "✓" : "✗"}`
    );
    console.log(
      `   CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? "✓" : "✗"}`
    );
    console.log(
      `   CLOUDFLARE_R2_BUCKET_NAME: ${process.env.CLOUDFLARE_R2_BUCKET_NAME || "N/A"}`
    );

    // Check OpenAI configuration
    console.log("\n🤖 OpenAI Configuration:");
    console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✓" : "✗"}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

diagnoseDocuments();

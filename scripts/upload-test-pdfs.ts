/**
 * Script to generate fake PDF documents and upload them to Cloudflare R2
 *
 * Usage: npx tsx scripts/upload-test-pdfs.ts
 */

import PDFDocument from "pdfkit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/lib/db";
import { env } from "../src/env.mjs";

// Initialize R2 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});

interface DocumentToGenerate {
  id: string;
  fileKey: string;
  originalFilename: string;
  category: string;
  claimantName: string;
}

/**
 * Generate a fake PDF document with sample content
 */
async function generatePDF(doc: DocumentToGenerate): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument();
    const chunks: Buffer[] = [];

    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    // Add header
    pdf.fontSize(20).text("RECA Claim Document", { align: "center" });
    pdf.moveDown();

    // Add document type
    pdf.fontSize(16).text(`Document Type: ${doc.category.replace(/_/g, " ")}`, {
      underline: true,
    });
    pdf.moveDown();

    // Add claimant info
    pdf.fontSize(12).text(`Claimant: ${doc.claimantName}`);
    pdf.text(`Document ID: ${doc.id}`);
    pdf.text(`File: ${doc.originalFilename}`);
    pdf.text(`Generated: ${new Date().toLocaleString()}`);
    pdf.moveDown(2);

    // Add sample content based on category
    pdf.fontSize(11);

    if (doc.category === "IDENTITY") {
      pdf.text("DRIVER'S LICENSE", { bold: true });
      pdf.moveDown();
      pdf.text("Name: " + doc.claimantName);
      pdf.text("License #: DL-" + Math.random().toString(36).substring(2, 11).toUpperCase());
      pdf.text("DOB: 01/15/1960");
      pdf.text("Address: 123 Main St, Salt Lake City, UT 84101");
      pdf.text("Issued: 01/01/2020");
      pdf.text("Expires: 01/01/2030");
    } else if (doc.category === "PROOF_OF_RESIDENCE") {
      pdf.text("UTILITY BILL", { bold: true });
      pdf.moveDown();
      pdf.text("Account Holder: " + doc.claimantName);
      pdf.text("Service Address: 123 Main St, Salt Lake City, UT 84101");
      pdf.text("Account #: UTIL-" + Math.random().toString(36).substring(2, 11).toUpperCase());
      pdf.text("Billing Period: January 1956 - December 1962");
      pdf.moveDown();
      pdf.text("This utility bill confirms residence at the above address during");
      pdf.text("the period of atmospheric nuclear testing.");
    } else if (doc.category === "PATHOLOGY_REPORT") {
      pdf.text("PATHOLOGY REPORT", { bold: true });
      pdf.moveDown();
      pdf.text("Patient: " + doc.claimantName);
      pdf.text("Report Date: " + new Date().toLocaleDateString());
      pdf.text("Diagnosis: Thyroid Carcinoma");
      pdf.moveDown();
      pdf.text("Specimen: Thyroid, Right Lobe");
      pdf.text("Diagnosis: Papillary Thyroid Carcinoma, 2.5 cm");
      pdf.text("Tumor Stage: pT2N0M0");
      pdf.moveDown();
      pdf.text("This confirms the diagnosis of thyroid cancer, a condition");
      pdf.text("potentially linked to radiation exposure from nuclear testing.");
    } else if (doc.category === "MEDICAL_RECORDS") {
      pdf.text("MEDICAL RECORDS SUMMARY", { bold: true });
      pdf.moveDown();
      pdf.text("Patient: " + doc.claimantName);
      pdf.text("Date Range: 1950 - Present");
      pdf.moveDown();
      pdf.text("Medical History:");
      pdf.text("- 1955: Routine physical examination");
      pdf.text("- 1960: Treatment for suspected radiation exposure symptoms");
      pdf.text("- 1985: Diagnosed with cancer");
      pdf.text("- 1985-1986: Cancer treatment and recovery");
      pdf.moveDown();
      pdf.text("These records document the medical history relevant to the RECA claim.");
    } else {
      pdf.text("SUPPORTING DOCUMENT", { bold: true });
      pdf.moveDown();
      pdf.text("This document provides supporting evidence for the RECA claim");
      pdf.text("submitted by " + doc.claimantName + ".");
      pdf.moveDown();
      pdf.text("Document Category: " + doc.category.replace(/_/g, " "));
      pdf.text("This is a test document generated for demonstration purposes.");
    }

    // Add footer
    pdf.moveDown(3);
    pdf.fontSize(9).text(
      "This is a test document generated for attorney portal demonstration.",
      { align: "center", color: "gray" }
    );

    pdf.end();
  });
}

/**
 * Upload PDF buffer to R2
 */
async function uploadToR2(fileKey: string, buffer: Buffer): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: fileKey,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await s3Client.send(command);
}

async function main() {
  console.log("🚀 Generating and uploading test PDFs to Cloudflare R2...\n");

  try {
    // Get all uploaded files from database
    const files = await db.uploadedFile.findMany({
      where: {
        intakeSessionId: {
          in: ["intake-jane-001", "intake-brandon-002", "cmh7b4fdb000f13lhr679hci3"],
        },
      },
      include: {
        intakeSession: {
          include: {
            claimant: true,
          },
        },
      },
    });

    console.log(`📄 Found ${files.length} documents to generate\n`);

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      if (!file.intakeSession?.claimant) {
        console.log(`⚠️  Skipping ${file.originalFilename} - no claimant data`);
        failed++;
        continue;
      }

      const claimantName = `${file.intakeSession.claimant.firstName} ${file.intakeSession.claimant.lastName}`;

      try {
        console.log(`📝 Generating: ${file.originalFilename}...`);

        // Generate PDF
        const pdfBuffer = await generatePDF({
          id: file.id,
          fileKey: file.fileKey,
          originalFilename: file.originalFilename,
          category: file.category || "OTHER",
          claimantName,
        });

        // Upload to R2
        console.log(`☁️  Uploading: ${file.fileKey}...`);
        await uploadToR2(file.fileKey, pdfBuffer);

        uploaded++;
        console.log(`✅ Uploaded: ${file.originalFilename} (${(pdfBuffer.length / 1024).toFixed(2)} KB)\n`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed: ${file.originalFilename}`, error);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`  ✅ Successfully uploaded: ${uploaded}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📦 Total size: Varies by document\n`);

    console.log("🎉 Upload complete!");
    console.log(`\n💡 Files are now accessible at: ${env.R2_ENDPOINT}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
main();

/**
 * Test Entity Extraction
 * Tests the entity extraction system with an existing processed document
 *
 * Usage: pnpm tsx scripts/test-entity-extraction.ts [document-id]
 */

import { PrismaClient } from "@prisma/client";
import { extractEntities } from "../src/lib/document-intelligence/entity-extraction";

const db = new PrismaClient();

async function main() {
  // Get document ID from command line or use default
  const documentId = process.argv[2] || "cmhfak8mc0001xncrg434n7lc"; // Default to RECA test document

  console.log(`\n🔍 Testing Entity Extraction`);
  console.log(`Document ID: ${documentId}\n`);

  // Fetch document from database
  const document = await db.uploadedFile.findUnique({
    where: { id: documentId },
    include: { tags: true },
  });

  if (!document) {
    console.error(`❌ Document not found: ${documentId}`);
    process.exit(1);
  }

  console.log(`📄 Document: ${document.originalFilename}`);
  console.log(`📁 Category: ${document.category}`);
  console.log(`📊 Status: ${document.status}`);
  console.log(
    `📄 Pages: ${document.metadata ? JSON.parse(document.metadata).pageCount || 1 : 1}`
  );
  console.log(
    `🔤 OCR Text Length: ${document.ocrText?.length || 0} characters`
  );
  console.log(
    `✅ OCR Confidence: ${document.ocrConfidence ? (document.ocrConfidence * 100).toFixed(1) : "N/A"}%\n`
  );

  if (!document.ocrText) {
    console.error(`❌ No OCR text available for this document`);
    process.exit(1);
  }

  // Extract metadata
  const metadata = document.metadata ? JSON.parse(document.metadata) : {};
  const pageCount = metadata.pageCount || 1;

  console.log(`⏳ Extracting entities using GPT-4o...\n`);

  const startTime = Date.now();

  try {
    const entities = await extractEntities(
      document.ocrText,
      document.category as any,
      pageCount
    );

    const duration = Date.now() - startTime;

    console.log(
      `✅ Entity extraction completed in ${(duration / 1000).toFixed(2)}s\n`
    );

    // Display results
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`📊 EXTRACTION RESULTS`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    // Persons
    if (entities.persons.length > 0) {
      console.log(`👤 PERSONS (${entities.persons.length}):`);
      entities.persons.forEach((person, idx) => {
        console.log(`  ${idx + 1}. ${person.name}`);
        console.log(`     Role: ${person.role}`);
        console.log(
          `     Confidence: ${(person.confidence * 100).toFixed(1)}%`
        );
        console.log(`     Mentions: ${person.mentions.length} time(s)`);
        person.mentions.forEach((mention, mIdx) => {
          console.log(
            `       - Page ${mention.page}: "${mention.context.substring(0, 60)}..."`
          );
        });
        console.log();
      });
    } else {
      console.log(`👤 PERSONS: None found\n`);
    }

    // Dates
    if (entities.dates.length > 0) {
      console.log(`📅 DATES (${entities.dates.length}):`);
      entities.dates.forEach((date, idx) => {
        console.log(`  ${idx + 1}. ${date.label}: ${date.value}`);
        console.log(`     Confidence: ${(date.confidence * 100).toFixed(1)}%`);
        console.log(`     Page: ${date.page}`);
        if (date.context) {
          console.log(`     Context: "${date.context.substring(0, 60)}..."`);
        }
        console.log();
      });
    } else {
      console.log(`📅 DATES: None found\n`);
    }

    // Addresses
    if (entities.addresses.length > 0) {
      console.log(`📍 ADDRESSES (${entities.addresses.length}):`);
      entities.addresses.forEach((address, idx) => {
        console.log(`  ${idx + 1}. ${address.label}: ${address.full_address}`);
        if (address.county) {
          console.log(
            `     County: ${address.county}, ${address.state || "?"}`
          );
        }
        if (address.years) {
          console.log(`     Years: ${address.years}`);
        }
        console.log(
          `     Confidence: ${(address.confidence * 100).toFixed(1)}%`
        );
        console.log(`     Page: ${address.page}`);
        console.log();
      });
    } else {
      console.log(`📍 ADDRESSES: None found\n`);
    }

    // Medical
    if (entities.medical.length > 0) {
      console.log(`🏥 MEDICAL RECORDS (${entities.medical.length}):`);
      entities.medical.forEach((medical, idx) => {
        console.log(`  ${idx + 1}.`);
        if (medical.diagnosis) {
          console.log(`     Diagnosis: ${medical.diagnosis}`);
        }
        if (medical.icd_code) {
          console.log(`     ICD Code: ${medical.icd_code}`);
        }
        if (medical.facility) {
          console.log(`     Facility: ${medical.facility}`);
        }
        if (medical.doctor) {
          console.log(`     Doctor: ${medical.doctor}`);
        }
        if (medical.diagnosis_date) {
          console.log(`     Diagnosis Date: ${medical.diagnosis_date}`);
        }
        console.log(
          `     Confidence: ${(medical.confidence * 100).toFixed(1)}%`
        );
        console.log(`     Page: ${medical.page}`);
        console.log();
      });
    } else {
      console.log(`🏥 MEDICAL RECORDS: None found\n`);
    }

    // Employment
    if (entities.employment.length > 0) {
      console.log(`💼 EMPLOYMENT (${entities.employment.length}):`);
      entities.employment.forEach((emp, idx) => {
        console.log(`  ${idx + 1}. ${emp.employer}`);
        if (emp.job_title) {
          console.log(`     Title: ${emp.job_title}`);
        }
        if (emp.location) {
          console.log(`     Location: ${emp.location}`);
        }
        if (emp.start_date || emp.end_date) {
          console.log(
            `     Period: ${emp.start_date || "?"} to ${emp.end_date || "?"}`
          );
        }
        if (emp.nuclear_facility) {
          console.log(`     ⚠️  NUCLEAR FACILITY`);
        }
        console.log(`     Confidence: ${(emp.confidence * 100).toFixed(1)}%`);
        console.log(`     Page: ${emp.page}`);
        console.log();
      });
    } else {
      console.log(`💼 EMPLOYMENT: None found\n`);
    }

    console.log(`═══════════════════════════════════════════════════════`);

    // Summary
    const totalEntities =
      entities.persons.length +
      entities.dates.length +
      entities.addresses.length +
      entities.medical.length +
      entities.employment.length;

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Entities: ${totalEntities}`);
    console.log(`   Processing Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   Estimated API Cost: ~$0.015 USD`);

    // Optionally save to database
    console.log(
      `\n💾 Save these entities to database? (This would update metadata)`
    );
    console.log(`   Run with --save flag to persist results\n`);

    if (process.argv.includes("--save")) {
      const updatedMetadata = {
        ...metadata,
        entities,
        entitiesExtractedAt: new Date().toISOString(),
      };

      await db.uploadedFile.update({
        where: { id: documentId },
        data: {
          metadata: JSON.stringify(updatedMetadata),
        },
      });

      console.log(`✅ Entities saved to database\n`);
    }
  } catch (error) {
    console.error(`\n❌ Entity extraction failed:`, error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

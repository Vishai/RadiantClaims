/**
 * Test RECA Compliance Checker
 * Tests the compliance validation system with existing documents
 *
 * Usage: pnpm tsx scripts/test-compliance-checker.ts [session-id]
 */

import { PrismaClient } from "@prisma/client";
import { checkRECACompliance } from "../src/lib/document-intelligence/reca-compliance";
import { EntityExtractionResult } from "../src/lib/document-intelligence/schemas/entity-schema";

const db = new PrismaClient();

async function main() {
  // Get session ID from command line
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error(
      "❌ Usage: pnpm tsx scripts/test-compliance-checker.ts [session-id]"
    );
    console.error("\nTo find your session ID, check the database or URL");
    process.exit(1);
  }

  console.log(`\n🔍 Testing RECA Compliance Checker`);
  console.log(`Session ID: ${sessionId}\n`);

  // Fetch all documents for this session
  const documents = await db.uploadedFile.findMany({
    where: { intakeSessionId: sessionId },
    include: { tags: true },
  });

  if (documents.length === 0) {
    console.error(`❌ No documents found for session: ${sessionId}`);
    process.exit(1);
  }

  console.log(`📄 Found ${documents.length} document(s) in session\n`);

  // Display documents
  documents.forEach((doc, idx) => {
    console.log(`${idx + 1}. ${doc.originalFilename}`);
    console.log(`   Category: ${doc.category || "N/A"}`);
    console.log(`   Status: ${doc.status}`);
    console.log(`   OCR Text: ${doc.ocrText?.length || 0} chars`);
  });

  // Find a document with entities (prefer one with entities already extracted)
  let targetDoc = documents.find((doc) => {
    if (!doc.metadata) return false;
    const metadata = JSON.parse(doc.metadata);
    return metadata.entities && Object.keys(metadata.entities).length > 0;
  });

  // If no document with entities, use first document with OCR text
  if (!targetDoc) {
    targetDoc = documents.find(
      (doc) => doc.ocrText && doc.ocrText.length > 100
    );
  }

  if (!targetDoc || !targetDoc.ocrText) {
    console.error(`\n❌ No suitable document found with OCR text`);
    process.exit(1);
  }

  console.log(`\n📋 Using document: ${targetDoc.originalFilename}\n`);

  // Extract entities from metadata or use empty
  let entities: EntityExtractionResult;
  if (targetDoc.metadata) {
    const metadata = JSON.parse(targetDoc.metadata);
    if (metadata.entities) {
      entities = metadata.entities;
      console.log(`✓ Using existing entities from metadata\n`);
    } else {
      console.log(`⚠️  No entities in metadata, using empty entities\n`);
      entities = {
        persons: [],
        dates: [],
        addresses: [],
        medical: [],
        employment: [],
      };
    }
  } else {
    console.log(`⚠️  No metadata found, using empty entities\n`);
    entities = {
      persons: [],
      dates: [],
      addresses: [],
      medical: [],
      employment: [],
    };
  }

  console.log(`⏳ Running compliance checks...\n`);

  const startTime = Date.now();

  try {
    const complianceResult = await checkRECACompliance(
      entities,
      documents.map((doc) => ({
        id: doc.id,
        category: doc.category,
        ocrText: doc.ocrText,
        metadata: doc.metadata,
      })),
      targetDoc.ocrText
    );

    const duration = Date.now() - startTime;

    console.log(
      `✅ Compliance check completed in ${(duration / 1000).toFixed(2)}s\n`
    );

    // Display results
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`📊 COMPLIANCE CHECK RESULTS`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    // Claim Type
    console.log(`🎯 CLAIM TYPE:`);
    console.log(
      `   Type: ${complianceResult.claimTypeSuspected.toUpperCase()}`
    );
    console.log(
      `   Confidence: ${(complianceResult.claimTypeConfidence * 100).toFixed(1)}%`
    );
    console.log(`   Reasoning: ${complianceResult.claimTypeReasoning}\n`);

    // Completeness
    console.log(`📈 CLAIM COMPLETENESS:`);
    console.log(
      `   Coverage: ${(complianceResult.checklistCoverage * 100).toFixed(1)}%`
    );
    console.log(
      `   Status: ${complianceResult.checklistCoverage >= 0.8 ? "✅ Ready for submission" : complianceResult.checklistCoverage >= 0.5 ? "⚠️  Partially complete" : "❌ Incomplete"}\n`
    );

    // Missing Requirements
    if (complianceResult.missingRequirements.length > 0) {
      console.log(
        `📋 MISSING REQUIREMENTS (${complianceResult.missingRequirements.length}):`
      );
      complianceResult.missingRequirements.forEach((req, idx) => {
        const priorityIcon =
          req.priority === "high"
            ? "🔴"
            : req.priority === "medium"
              ? "🟡"
              : "🟢";
        console.log(`  ${idx + 1}. ${priorityIcon} ${req.item}`);
        console.log(`     Category: ${req.category}`);
        console.log(`     Priority: ${req.priority.toUpperCase()}`);
        console.log(`     Suggestion: ${req.suggestion}`);
        console.log();
      });
    } else {
      console.log(
        `📋 MISSING REQUIREMENTS: None - All required documents present! ✅\n`
      );
    }

    // Jurisdiction
    console.log(`🗺️  JURISDICTION CHECK:`);
    if (complianceResult.jurisdictionMatch.inCoveredCounties) {
      console.log(`   ✅ IN COVERED AREA`);
      if (complianceResult.jurisdictionMatch.county) {
        console.log(
          `   County: ${complianceResult.jurisdictionMatch.county}, ${complianceResult.jurisdictionMatch.state}`
        );
      }
      console.log(
        `   Confidence: ${(complianceResult.jurisdictionMatch.confidence * 100).toFixed(1)}%`
      );
    } else {
      console.log(`   ❌ NOT IN COVERED AREA`);
      if (complianceResult.jurisdictionMatch.issues) {
        complianceResult.jurisdictionMatch.issues.forEach((issue) => {
          console.log(`   Issue: ${issue}`);
        });
      }
    }
    console.log();

    // Date Sanity
    if (complianceResult.dateSanity.length > 0) {
      console.log(
        `📅 DATE SANITY CHECKS (${complianceResult.dateSanity.length}):`
      );
      complianceResult.dateSanity.forEach((check, idx) => {
        const severityIcon =
          check.severity === "high"
            ? "🔴"
            : check.severity === "medium"
              ? "🟡"
              : "🟢";
        console.log(`  ${idx + 1}. ${severityIcon} ${check.issue}`);
        console.log(`     Severity: ${check.severity.toUpperCase()}`);
        console.log(`     Details: ${check.details}`);
        console.log();
      });
    } else {
      console.log(`📅 DATE SANITY CHECKS: All dates are consistent ✅\n`);
    }

    // Name Consistency
    console.log(`👤 NAME CONSISTENCY:`);
    complianceResult.nameConsistency.forEach((check) => {
      const statusIcon =
        check.status === "ok" ? "✅" : check.status === "warning" ? "⚠️" : "❌";
      console.log(`   ${statusIcon} ${check.issue}`);
      if (check.details) {
        console.log(`   Details: ${check.details}`);
      }
    });
    console.log();

    // Eligibility Flags
    if (complianceResult.eligibilityFlags.length > 0) {
      console.log(
        `🎫 ELIGIBILITY FLAGS (${complianceResult.eligibilityFlags.length}):`
      );
      complianceResult.eligibilityFlags.forEach((flag, idx) => {
        const statusIcon =
          flag.status === "meets_requirement"
            ? "✅"
            : flag.status === "does_not_meet"
              ? "❌"
              : "⚠️";
        console.log(`  ${idx + 1}. ${statusIcon} ${flag.flag}`);
        console.log(
          `     Status: ${flag.status.replace(/_/g, " ").toUpperCase()}`
        );
        console.log(`     Details: ${flag.details}`);
        console.log();
      });
    } else {
      console.log(`🎫 ELIGIBILITY FLAGS: None\n`);
    }

    // Disease Match
    if (complianceResult.diseaseMatch) {
      console.log(`🏥 DISEASE MATCH:`);
      if (complianceResult.diseaseMatch.diagnosisFound) {
        console.log(`   Diagnosis Found: ✅`);
        console.log(
          `   Diagnosis: ${complianceResult.diseaseMatch.diagnosisName}`
        );
        console.log(
          `   Covered by RECA: ${complianceResult.diseaseMatch.isCoveredDisease ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `   Confidence: ${(complianceResult.diseaseMatch.confidence * 100).toFixed(1)}%`
        );
      } else {
        console.log(`   Diagnosis Found: ❌`);
        console.log(`   Note: Medical diagnosis is required for RECA claim`);
      }
      console.log();
    }

    console.log(`═══════════════════════════════════════════════════════\n`);

    // Summary
    console.log(`📊 SUMMARY:`);
    console.log(
      `   Claim Type: ${complianceResult.claimTypeSuspected.toUpperCase()}`
    );
    console.log(
      `   Completeness: ${(complianceResult.checklistCoverage * 100).toFixed(1)}%`
    );
    console.log(
      `   Missing Documents: ${complianceResult.missingRequirements.length}`
    );
    console.log(`   Issues Found: ${complianceResult.dateSanity.length}`);
    console.log(
      `   Ready for Submission: ${complianceResult.checklistCoverage >= 0.8 && complianceResult.dateSanity.filter((d) => d.severity === "high").length === 0 ? "YES ✅" : "NO ❌"}\n`
    );
  } catch (error) {
    console.error(`\n❌ Compliance check failed:`, error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

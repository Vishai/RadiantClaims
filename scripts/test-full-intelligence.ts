/**
 * Test Full Document Intelligence Pipeline
 * Runs entity extraction, compliance check, and risk analysis together
 *
 * Usage: pnpm tsx scripts/test-full-intelligence.ts [document-id]
 */

import { PrismaClient } from "@prisma/client";
import { extractEntities } from "../src/lib/document-intelligence/entity-extraction";
import { checkRECACompliance } from "../src/lib/document-intelligence/reca-compliance";
import { analyzeRisks } from "../src/lib/document-intelligence/risk-analysis";

const db = new PrismaClient();

async function main() {
  const documentId = process.argv[2] || "cmhfak8mc0001xncrg434n7lc";

  console.log(`\n🔬 Testing Full Document Intelligence Pipeline`);
  console.log(`Document ID: ${documentId}\n`);

  // Fetch document
  const document = await db.uploadedFile.findUnique({
    where: { id: documentId },
    include: { tags: true },
  });

  if (!document || !document.ocrText) {
    console.error(`❌ Document not found or has no OCR text`);
    process.exit(1);
  }

  console.log(`📄 Document: ${document.originalFilename}`);
  console.log(`📁 Category: ${document.category}`);
  console.log(`🔤 OCR Text: ${document.ocrText.length} characters\n`);

  const metadata = document.metadata ? JSON.parse(document.metadata) : {};

  // Step 1: Entity Extraction
  console.log(`⏳ Step 1: Extracting entities...\n`);
  const entities = await extractEntities(
    document.ocrText,
    document.category as any,
    metadata.pageCount || 1
  );

  console.log(`✅ Entities extracted:`);
  console.log(`   👤 Persons: ${entities.persons.length}`);
  console.log(`   📅 Dates: ${entities.dates.length}`);
  console.log(`   📍 Addresses: ${entities.addresses.length}`);
  console.log(`   🏥 Medical: ${entities.medical.length}`);
  console.log(`   💼 Employment: ${entities.employment.length}\n`);

  // Step 2: Compliance Check
  console.log(`⏳ Step 2: Running compliance checks...\n`);

  // Get all documents in session
  const allDocuments = await db.uploadedFile.findMany({
    where: { intakeSessionId: document.intakeSessionId },
    select: { id: true, category: true, ocrText: true, metadata: true },
  });

  const compliance = await checkRECACompliance(
    entities,
    allDocuments,
    document.ocrText
  );

  console.log(`✅ Compliance checked:`);
  console.log(
    `   🎯 Claim Type: ${compliance.claimTypeSuspected.toUpperCase()}`
  );
  console.log(
    `   📊 Completeness: ${(compliance.checklistCoverage * 100).toFixed(0)}%`
  );
  console.log(`   📋 Missing Docs: ${compliance.missingRequirements.length}`);
  console.log(`   ⚠️  Issues: ${compliance.dateSanity.length}\n`);

  // Step 3: Risk Analysis
  console.log(`⏳ Step 3: Analyzing risks...\n`);

  const riskAnalysis = await analyzeRisks(
    entities,
    compliance,
    metadata.qualityMetrics
  );

  console.log(`✅ Risks analyzed:`);
  console.log(`   Total Risks: ${riskAnalysis.totalRisks}`);
  console.log(`   🔴 High: ${riskAnalysis.highSeverityCount}`);
  console.log(`   🟡 Medium: ${riskAnalysis.mediumSeverityCount}`);
  console.log(`   🟢 Low: ${riskAnalysis.lowSeverityCount}`);
  console.log(
    `   Risk Score: ${(riskAnalysis.overallRiskScore * 100).toFixed(0)}%\n`
  );

  // Display full results
  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`📊 COMPLETE INTELLIGENCE REPORT`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Entities
  console.log(`👥 EXTRACTED ENTITIES:\n`);
  if (entities.persons.length > 0) {
    console.log(`   Persons:`);
    entities.persons.forEach((p) => console.log(`   - ${p.name} (${p.role})`));
  }
  if (entities.dates.length > 0) {
    console.log(`   Dates:`);
    entities.dates
      .slice(0, 3)
      .forEach((d) => console.log(`   - ${d.label}: ${d.value}`));
    if (entities.dates.length > 3)
      console.log(`   - ... and ${entities.dates.length - 3} more`);
  }
  if (entities.addresses.length > 0) {
    console.log(`   Addresses:`);
    entities.addresses.forEach((a) => console.log(`   - ${a.full_address}`));
  }
  console.log();

  // Compliance
  console.log(`📋 COMPLIANCE STATUS:\n`);
  console.log(
    `   Claim Type: ${compliance.claimTypeSuspected.toUpperCase()} (${(compliance.claimTypeConfidence * 100).toFixed(0)}% confidence)`
  );
  console.log(
    `   Completeness: ${(compliance.checklistCoverage * 100).toFixed(0)}%`
  );
  console.log(
    `   Jurisdiction: ${compliance.jurisdictionMatch.inCoveredCounties ? "✅ In covered area" : "❌ Not in covered area"}`
  );
  console.log(
    `   Disease: ${compliance.diseaseMatch?.isCoveredDisease ? "✅ Covered" : "❌ Not covered"}\n`
  );

  if (compliance.missingRequirements.length > 0) {
    console.log(`   Missing Documents:`);
    compliance.missingRequirements.slice(0, 3).forEach((req) => {
      console.log(`   - ${req.item} (${req.priority})`);
    });
    if (compliance.missingRequirements.length > 3) {
      console.log(
        `   - ... and ${compliance.missingRequirements.length - 3} more`
      );
    }
    console.log();
  }

  // Risks
  console.log(`⚠️  RISK ASSESSMENT:\n`);
  console.log(
    `   Risk Score: ${(riskAnalysis.overallRiskScore * 100).toFixed(0)}% (${riskAnalysis.overallRiskScore < 0.3 ? "Low Risk" : riskAnalysis.overallRiskScore < 0.7 ? "Medium Risk" : "High Risk"})\n`
  );

  if (riskAnalysis.risks.length > 0) {
    console.log(`   Top Risks:`);
    riskAnalysis.risks.slice(0, 5).forEach((risk) => {
      const icon =
        risk.severity === "high"
          ? "🔴"
          : risk.severity === "medium"
            ? "🟡"
            : "🟢";
      console.log(`   ${icon} ${risk.message}`);
    });
    if (riskAnalysis.risks.length > 5) {
      console.log(`   ... and ${riskAnalysis.risks.length - 5} more`);
    }
    console.log();
  }

  console.log(`   Recommended Actions:`);
  riskAnalysis.recommendedActions.forEach((action) => {
    console.log(`   • ${action}`);
  });
  console.log();

  console.log(`═══════════════════════════════════════════════════════\n`);

  // Save to database if requested
  if (process.argv.includes("--save")) {
    console.log(`💾 Saving intelligence to database...\n`);

    const updatedMetadata = {
      ...metadata,
      entities,
      entitiesExtractedAt: new Date().toISOString(),
      compliance,
      complianceCheckedAt: new Date().toISOString(),
      risks: riskAnalysis,
      risksAnalyzedAt: new Date().toISOString(),
    };

    await db.uploadedFile.update({
      where: { id: documentId },
      data: { metadata: JSON.stringify(updatedMetadata) },
    });

    console.log(`✅ Intelligence saved to database\n`);
  }

  await db.$disconnect();
}

main();

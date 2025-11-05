/**
 * Test Risk Analyzer
 * Tests the risk analysis system with existing documents
 *
 * Usage: pnpm tsx scripts/test-risk-analyzer.ts [session-id]
 */

import { PrismaClient } from "@prisma/client";
import { analyzeRisks } from "../src/lib/document-intelligence/risk-analysis";
import { EntityExtractionResult } from "../src/lib/document-intelligence/schemas/entity-schema";
import { RECAComplianceResult } from "../src/lib/document-intelligence/schemas/compliance-schema";

const db = new PrismaClient();

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error(
      "❌ Usage: pnpm tsx scripts/test-risk-analyzer.ts [session-id]"
    );
    process.exit(1);
  }

  console.log(`\n🔍 Testing Risk Analyzer`);
  console.log(`Session ID: ${sessionId}\n`);

  // Fetch documents
  const documents = await db.uploadedFile.findMany({
    where: { intakeSessionId: sessionId },
  });

  if (documents.length === 0) {
    console.error(`❌ No documents found for session: ${sessionId}`);
    process.exit(1);
  }

  console.log(`📄 Found ${documents.length} document(s)\n`);

  // Find document with complete metadata
  const targetDoc = documents.find((doc) => {
    if (!doc.metadata) return false;
    const metadata = JSON.parse(doc.metadata);
    return metadata.entities && metadata.compliance;
  });

  if (!targetDoc || !targetDoc.metadata) {
    console.error(`❌ No document found with entities and compliance data`);
    console.error(`Run entity extraction and compliance check first`);
    process.exit(1);
  }

  const metadata = JSON.parse(targetDoc.metadata);
  const entities: EntityExtractionResult = metadata.entities;
  const compliance: RECAComplianceResult = metadata.compliance;
  const qualityMetrics = metadata.qualityMetrics;

  console.log(`📋 Using document: ${targetDoc.originalFilename}`);
  console.log(
    `   Entities: ${entities.persons.length} persons, ${entities.dates.length} dates`
  );
  console.log(
    `   Compliance: ${(compliance.checklistCoverage * 100).toFixed(0)}% complete`
  );
  console.log(
    `   Quality: ${qualityMetrics ? (qualityMetrics.qualityScore * 100).toFixed(0) + "%" : "N/A"}\n`
  );

  console.log(`⏳ Analyzing risks...\n`);

  const startTime = Date.now();

  try {
    const riskAnalysis = await analyzeRisks(entities, compliance, {
      qualityMetrics: qualityMetrics || undefined,
      documentText: ocrText,
    });

    const duration = Date.now() - startTime;

    console.log(
      `✅ Risk analysis completed in ${(duration / 1000).toFixed(2)}s\n`
    );

    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`⚠️  RISK ANALYSIS RESULTS`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    // Overall Summary
    console.log(`📊 OVERALL RISK ASSESSMENT:`);
    console.log(`   Total Risks: ${riskAnalysis.totalRisks}`);
    console.log(`   🔴 High Severity: ${riskAnalysis.highSeverityCount}`);
    console.log(`   🟡 Medium Severity: ${riskAnalysis.mediumSeverityCount}`);
    console.log(`   🟢 Low Severity: ${riskAnalysis.lowSeverityCount}`);
    console.log(
      `   Risk Score: ${(riskAnalysis.overallRiskScore * 100).toFixed(0)}% (${riskAnalysis.overallRiskScore < 0.3 ? "Low" : riskAnalysis.overallRiskScore < 0.7 ? "Medium" : "High"})`
    );
    console.log();

    // Risk Details
    if (riskAnalysis.risks.length > 0) {
      console.log(`⚠️  IDENTIFIED RISKS (${riskAnalysis.risks.length}):\n`);

      riskAnalysis.risks.forEach((risk, idx) => {
        const severityIcon =
          risk.severity === "high"
            ? "🔴"
            : risk.severity === "medium"
              ? "🟡"
              : "🟢";
        const categoryEmojiMap = {
          compliance: "📋",
          eligibility: "✅",
          quality: "📸",
          consistency: "🔄",
          authenticity: "🛡️",
        } as const;
        const categoryEmoji =
          categoryEmojiMap[risk.category as keyof typeof categoryEmojiMap] ??
          "❓";

        console.log(
          `${idx + 1}. ${severityIcon} ${categoryEmoji} ${risk.message}`
        );
        console.log(`   Severity: ${risk.severity.toUpperCase()}`);
        console.log(`   Category: ${risk.category}`);
        console.log(`   Action Required: ${risk.actionRequired}`);
        if (risk.details) {
          console.log(`   Details: ${risk.details}`);
        }
        if (risk.affectedPages && risk.affectedPages.length > 0) {
          console.log(`   Affected Pages: ${risk.affectedPages.join(", ")}`);
        }
        console.log();
      });
    } else {
      console.log(`✅ NO RISKS IDENTIFIED - Claim looks good!\n`);
    }

    // Recommended Actions
    console.log(`💡 RECOMMENDED ACTIONS:\n`);
    riskAnalysis.recommendedActions.forEach((action, idx) => {
      console.log(`   ${idx + 1}. ${action}`);
    });
    console.log();

    console.log(`═══════════════════════════════════════════════════════\n`);

    // Risk Breakdown by Category
    console.log(`📊 RISK BREAKDOWN:\n`);

    const byCategory = {
      compliance: riskAnalysis.risks.filter((r) => r.category === "compliance"),
      eligibility: riskAnalysis.risks.filter(
        (r) => r.category === "eligibility"
      ),
      quality: riskAnalysis.risks.filter((r) => r.category === "quality"),
      consistency: riskAnalysis.risks.filter(
        (r) => r.category === "consistency"
      ),
    };

    console.log(`   📋 Compliance Issues: ${byCategory.compliance.length}`);
    console.log(`   ✅ Eligibility Issues: ${byCategory.eligibility.length}`);
    console.log(`   📸 Quality Issues: ${byCategory.quality.length}`);
    console.log(`   🔄 Consistency Issues: ${byCategory.consistency.length}`);
    console.log();

    // Recommendation
    if (riskAnalysis.highSeverityCount > 0) {
      console.log(
        `🚨 RECOMMENDATION: Address ${riskAnalysis.highSeverityCount} critical issue${riskAnalysis.highSeverityCount > 1 ? "s" : ""} before claim submission`
      );
    } else if (riskAnalysis.mediumSeverityCount > 0) {
      console.log(
        `⚠️  RECOMMENDATION: Review and address ${riskAnalysis.mediumSeverityCount} warning${riskAnalysis.mediumSeverityCount > 1 ? "s" : ""} to improve approval chances`
      );
    } else if (riskAnalysis.lowSeverityCount > 0) {
      console.log(
        `✅ RECOMMENDATION: Claim is in good shape. Consider addressing minor issues for best results`
      );
    } else {
      console.log(`✨ RECOMMENDATION: Claim appears ready for submission!`);
    }
    console.log();
  } catch (error) {
    console.error(`\n❌ Risk analysis failed:`, error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

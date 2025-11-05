/**
 * OCR Multi-Tier Testing Script
 *
 * Tests all 4 OCR tiers with real documents and generates detailed reports.
 *
 * Usage:
 *   pnpm test:ocr [document-path]
 *
 * Example:
 *   pnpm test:ocr ./test-docs/pathology-report.pdf
 */

import fs from "fs";
import path from "path";
import { extractTextFromPDF } from "../src/lib/document-intelligence/ocr";

interface TierResult {
  attempted: boolean;
  success: boolean;
  charsExtracted: number;
  timeMs: number;
  cost: number;
  confidence?: number;
  error?: string;
  method?: string;
}

interface OCRTestResult {
  documentId: string;
  documentType: string;
  fileSize: number;

  // Per-tier metrics
  tier1: TierResult;
  tier2: TierResult;
  tier3: TierResult;
  tier4: TierResult;

  // Summary
  finalTierUsed: 1 | 2 | 3 | 4 | null;
  totalCost: number;
  totalTimeMs: number;
  success: boolean;
  extractedText: string;
  method?: string;
}

/**
 * Calculate cost per tier based on method used
 */
function calculateTierCost(method: string | undefined): number {
  switch (method) {
    case "pdf-parse":
    case "pdfjs":
      return 0; // Free
    case "aws-textract":
      return 0.0015; // $1.50 per 1,000 pages
    case "google-vision":
      return 0.0015; // $1.50 per 1,000 images
    case "gpt-4o-vision":
      return 0.025; // ~$0.025 per document
    default:
      return 0;
  }
}

/**
 * Map method to tier number
 */
function getTierNumber(method: string | undefined): 1 | 2 | 3 | 4 | null {
  switch (method) {
    case "pdf-parse":
    case "pdfjs":
      return 1;
    case "aws-textract":
      return 2;
    case "google-vision":
      return 3;
    case "gpt-4o-vision":
      return 4;
    default:
      return null;
  }
}

/**
 * Test all OCR tiers with a document
 */
async function testAllOCRTiers(documentPath: string): Promise<OCRTestResult> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 Testing OCR Tiers for: ${path.basename(documentPath)}`);
  console.log(`${"=".repeat(80)}\n`);

  // Initialize result
  const results: OCRTestResult = {
    documentId: path.basename(documentPath, path.extname(documentPath)),
    documentType: path.extname(documentPath),
    fileSize: fs.statSync(documentPath).size,
    tier1: {
      attempted: false,
      success: false,
      charsExtracted: 0,
      timeMs: 0,
      cost: 0,
    },
    tier2: {
      attempted: false,
      success: false,
      charsExtracted: 0,
      timeMs: 0,
      cost: 0,
    },
    tier3: {
      attempted: false,
      success: false,
      charsExtracted: 0,
      timeMs: 0,
      cost: 0,
    },
    tier4: {
      attempted: false,
      success: false,
      charsExtracted: 0,
      timeMs: 0,
      cost: 0,
    },
    finalTierUsed: null,
    totalCost: 0,
    totalTimeMs: 0,
    success: false,
    extractedText: "",
  };

  // Read document
  const pdfBuffer = fs.readFileSync(documentPath);

  // Test the full OCR pipeline (it will automatically try all tiers)
  const startTime = Date.now();
  try {
    const ocrResult = await extractTextFromPDF(pdfBuffer);

    results.totalTimeMs = Date.now() - startTime;
    results.success = ocrResult.text.length > 50;
    results.extractedText = ocrResult.text;
    results.method = ocrResult.method;
    results.finalTierUsed = getTierNumber(ocrResult.method);
    results.totalCost = calculateTierCost(ocrResult.method);

    // Map result to tier
    const tierNum = getTierNumber(ocrResult.method);
    if (tierNum) {
      const tierKey = `tier${tierNum}` as keyof Pick<
        OCRTestResult,
        "tier1" | "tier2" | "tier3" | "tier4"
      >;
      results[tierKey] = {
        attempted: true,
        success: results.success,
        charsExtracted: ocrResult.text.length,
        timeMs: results.totalTimeMs,
        cost: results.totalCost,
        confidence: ocrResult.confidence,
        method: ocrResult.method,
      };
    }

    // Display results
    console.log(`\n📊 Final Result:`);
    console.log(`${"─".repeat(80)}`);
    console.log(`✅ Success: ${results.success ? "YES" : "NO"}`);
    console.log(
      `🎯 Tier Used: ${results.finalTierUsed || "NONE"} (${ocrResult.method || "none"})`
    );
    console.log(`📝 Characters Extracted: ${ocrResult.text.length}`);
    console.log(`⏱️  Processing Time: ${results.totalTimeMs}ms`);
    console.log(`💰 Cost: $${results.totalCost.toFixed(4)}`);
    console.log(
      `🎲 Confidence: ${ocrResult.confidence ? (ocrResult.confidence * 100).toFixed(1) + "%" : "N/A"}`
    );

    // Show text preview (first 200 chars)
    if (ocrResult.text.length > 0) {
      console.log(`\n📄 Text Preview (first 200 chars):`);
      console.log(`${"─".repeat(80)}`);
      console.log(ocrResult.text.substring(0, 200) + "...");
    }
  } catch (error) {
    results.totalTimeMs = Date.now() - startTime;
    results.success = false;
    console.error(`\n❌ Test Failed:`, error);

    if (error instanceof Error) {
      results.tier1.error = error.message;
    }
  }

  console.log(`\n${"=".repeat(80)}\n`);

  return results;
}

/**
 * Generate summary report from multiple test results
 */
function generateSummaryReport(results: OCRTestResult[]): string {
  const totalTests = results.length;
  const successfulTests = results.filter((r) => r.success).length;
  const successRate = (successfulTests / totalTests) * 100;

  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const avgCost = totalCost / totalTests;

  const avgTime =
    results.reduce((sum, r) => sum + r.totalTimeMs, 0) / totalTests;

  const tierUsage = {
    tier1: results.filter((r) => r.finalTierUsed === 1).length,
    tier2: results.filter((r) => r.finalTierUsed === 2).length,
    tier3: results.filter((r) => r.finalTierUsed === 3).length,
    tier4: results.filter((r) => r.finalTierUsed === 4).length,
    failed: results.filter((r) => r.finalTierUsed === null).length,
  };

  let report = `
# OCR Multi-Tier Test Results

## Summary Statistics

- **Total Tests:** ${totalTests}
- **Successful:** ${successfulTests} (${successRate.toFixed(1)}%)
- **Failed:** ${totalTests - successfulTests}
- **Total Cost:** $${totalCost.toFixed(4)}
- **Average Cost:** $${avgCost.toFixed(4)} per document
- **Average Time:** ${avgTime.toFixed(0)}ms per document

## Tier Distribution

| Tier | Method | Count | Percentage | Cost per Doc |
|------|--------|-------|------------|--------------|
| Tier 1 | PDF.js/pdf-parse | ${tierUsage.tier1} | ${((tierUsage.tier1 / totalTests) * 100).toFixed(1)}% | $0.00 |
| Tier 2 | AWS Textract | ${tierUsage.tier2} | ${((tierUsage.tier2 / totalTests) * 100).toFixed(1)}% | $0.0015 |
| Tier 3 | Google Vision | ${tierUsage.tier3} | ${((tierUsage.tier3 / totalTests) * 100).toFixed(1)}% | $0.0015 |
| Tier 4 | GPT-4o Vision | ${tierUsage.tier4} | ${((tierUsage.tier4 / totalTests) * 100).toFixed(1)}% | $0.025 |
| Failed | None | ${tierUsage.failed} | ${((tierUsage.failed / totalTests) * 100).toFixed(1)}% | N/A |

## Cost Projection (Monthly)

Assuming similar document distribution:

- **100 docs/month:** $${(avgCost * 100).toFixed(2)}
- **500 docs/month:** $${(avgCost * 500).toFixed(2)}
- **1,000 docs/month:** $${(avgCost * 1000).toFixed(2)}
- **7,500 docs/month:** $${(avgCost * 7500).toFixed(2)} (500 customers × 15 docs)
- **15,000 docs/month:** $${(avgCost * 15000).toFixed(2)} (1,000 customers × 15 docs)

## Recommendations

${successRate >= 99 ? "✅ Excellent success rate! System is performing optimally." : ""}
${successRate >= 95 && successRate < 99 ? "✅ Good success rate, but there's room for improvement." : ""}
${successRate < 95 ? "⚠️  Success rate below target. Consider adding more fallback tiers or improving document quality checks." : ""}

${avgCost < 0.001 ? "✅ Cost is very low. Tier 1 is handling most documents." : ""}
${avgCost >= 0.001 && avgCost < 0.005 ? "✅ Cost is reasonable and within budget." : ""}
${avgCost >= 0.005 ? "⚠️  Average cost is higher than expected. Consider optimizing Tier 1 success rate." : ""}

${avgTime < 1000 ? "✅ Processing time is excellent (<1 second average)." : ""}
${avgTime >= 1000 && avgTime < 3000 ? "✅ Processing time is acceptable (1-3 seconds average)." : ""}
${avgTime >= 3000 ? "⚠️  Processing time is slow. Consider optimizing or adding caching." : ""}

## Test Details

`;

  results.forEach((result, index) => {
    report += `
### Test ${index + 1}: ${result.documentId}

- **File Size:** ${(result.fileSize / 1024).toFixed(1)} KB
- **Success:** ${result.success ? "✅ YES" : "❌ NO"}
- **Tier Used:** ${result.finalTierUsed || "None"} (${result.method || "none"})
- **Characters:** ${result.extractedText.length}
- **Time:** ${result.totalTimeMs}ms
- **Cost:** $${result.totalCost.toFixed(4)}

`;
  });

  return report;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
OCR Multi-Tier Testing Script
==============================

Usage:
  pnpm test:ocr <document-path> [<document-path> ...]

Examples:
  pnpm test:ocr ./test-docs/sample.pdf
  pnpm test:ocr ./test-docs/*.pdf

Tests all OCR tiers and generates a detailed report.
    `);
    process.exit(1);
  }

  const results: OCRTestResult[] = [];

  // Test each document
  for (const docPath of args) {
    if (!fs.existsSync(docPath)) {
      console.error(`❌ File not found: ${docPath}`);
      continue;
    }

    try {
      const result = await testAllOCRTiers(docPath);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to test ${docPath}:`, error);
    }
  }

  // Generate reports
  if (results.length > 0) {
    // Create test-results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Save JSON report
    const jsonPath = path.join(resultsDir, `ocr-test-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);

    // Save markdown summary
    const markdownPath = path.join(resultsDir, `ocr-summary-${timestamp}.md`);
    const summary = generateSummaryReport(results);
    fs.writeFileSync(markdownPath, summary);
    console.log(`📄 Markdown summary saved: ${markdownPath}`);

    console.log(`\n✅ Testing complete! Tested ${results.length} document(s).`);
  }
}

main().catch(console.error);

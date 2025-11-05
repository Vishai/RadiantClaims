/**
 * AWS Textract OCR Integration (Tier 2)
 *
 * Extracts text from scanned documents, forms, and tables using AWS Textract.
 *
 * Pricing: $1.50 per 1,000 pages
 * Success Rate: 95%+ on scanned documents
 * Processing Time: 2-3 seconds per document
 *
 * Use for:
 * - Scanned PDFs (no embedded text)
 * - Photocopied documents
 * - Faxed documents
 * - Forms with structure
 */

import {
  TextractClient,
  DetectDocumentTextCommand,
  type Block,
} from "@aws-sdk/client-textract";

export interface TextractResult {
  text: string;
  confidence: number;
  blocks: Block[];
}

/**
 * Extract text from a document using AWS Textract
 *
 * @param pdfBuffer - Buffer containing the PDF or image data
 * @returns Extracted text with confidence score and block information
 */
export async function extractTextWithTextract(
  pdfBuffer: Buffer
): Promise<TextractResult> {
  // Initialize AWS Textract client
  const client = new TextractClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  try {
    console.log("📤 Sending document to AWS Textract...");

    // Call Textract DetectDocumentText API
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: pdfBuffer,
      },
    });

    const response = await client.send(command);

    if (!response.Blocks || response.Blocks.length === 0) {
      console.log("⚠️  Textract returned no blocks");
      return { text: "", confidence: 0, blocks: [] };
    }

    // Extract text from LINE blocks (preserves reading order)
    const lines = response.Blocks.filter(
      (block) => block.BlockType === "LINE" && block.Text
    ).map((block) => block.Text!);

    const fullText = lines.join("\n");

    // Calculate average confidence from LINE blocks
    const confidenceScores = response.Blocks.filter(
      (block) =>
        block.BlockType === "LINE" &&
        block.Confidence !== undefined &&
        block.Confidence !== null
    ).map((block) => block.Confidence!);

    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) /
          confidenceScores.length /
          100 // Convert 0-100 to 0-1
        : 0;

    console.log(
      `✅ Textract extracted ${fullText.length} chars (${Math.round(avgConfidence * 100)}% confidence)`
    );

    return {
      text: fullText,
      confidence: avgConfidence,
      blocks: response.Blocks,
    };
  } catch (error) {
    console.error("❌ AWS Textract failed:", error);
    throw error;
  }
}

/**
 * Google Cloud Vision OCR Integration (Tier 3)
 *
 * Extracts text from photos, poor quality scans, and handwritten documents.
 *
 * Pricing: $1.50 per 1,000 images
 * Success Rate: 92-98% accuracy
 * Processing Time: 1-2 seconds per document
 *
 * Use for:
 * - Phone photos of documents
 * - Poor quality scans
 * - Handwritten text (better than Textract)
 * - Multi-language documents
 */

import vision from "@google-cloud/vision";

export interface GoogleVisionResult {
  text: string;
  confidence: number;
}

/**
 * Extract text from a document using Google Cloud Vision
 *
 * Supports two authentication methods:
 * 1. Service account file path (GOOGLE_CLOUD_CREDENTIALS)
 * 2. Base64-encoded service account JSON (GOOGLE_CLOUD_CREDENTIALS_BASE64)
 *
 * @param imageBuffer - Buffer containing the image or PDF data
 * @returns Extracted text with confidence score
 */
export async function extractTextWithGoogleVision(
  imageBuffer: Buffer
): Promise<GoogleVisionResult> {
  try {
    console.log("📤 Sending document to Google Cloud Vision...");

    // Initialize Google Vision client
    // Support both file path and base64-encoded credentials
    const clientOptions: any = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    };

    // Check for base64-encoded credentials (better for serverless)
    if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
      const credentialsJson = Buffer.from(
        process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64,
        "base64"
      ).toString("utf-8");
      clientOptions.credentials = JSON.parse(credentialsJson);
    }
    // Fall back to file path
    else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      clientOptions.keyFilename = process.env.GOOGLE_CLOUD_CREDENTIALS;
    }

    const client = new vision.ImageAnnotatorClient(clientOptions);

    // Use documentTextDetection for better document OCR (preserves layout)
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.log("⚠️  Google Vision returned no text");
      return { text: "", confidence: 0 };
    }

    // Calculate average confidence from pages
    let avgConfidence = 0.8; // Default confidence if not provided

    if (fullTextAnnotation.pages && fullTextAnnotation.pages.length > 0) {
      const confidenceScores = fullTextAnnotation.pages
        .filter(
          (page) => page.confidence !== undefined && page.confidence !== null
        )
        .map((page) => page.confidence!);

      if (confidenceScores.length > 0) {
        avgConfidence =
          confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
      }
    }

    console.log(
      `✅ Google Vision extracted ${fullTextAnnotation.text.length} chars (${Math.round(avgConfidence * 100)}% confidence)`
    );

    return {
      text: fullTextAnnotation.text,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error("❌ Google Cloud Vision failed:", error);
    throw error;
  }
}

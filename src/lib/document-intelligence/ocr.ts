/**
 * OCR Processing Utility
 * Extracts text from images and PDFs using Tesseract.js
 */

import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";
// @ts-ignore - pdf-parse doesn't have proper types
import pdfParse from "pdf-parse";

export interface OCRResult {
  text: string;
  confidence: number; // 0-1
  language: string;
  processingTimeMs: number;
  pageCount?: number;
}

export interface ImageQualityMetrics {
  resolution: { width: number; height: number };
  size: number; // bytes
  isBlurry: boolean;
  isLowContrast: boolean;
  qualityScore: number; // 0-1
  recommendations: string[];
}

/**
 * Extract text from an image buffer using Tesseract.js
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<OCRResult> {
  const startTime = Date.now();

  let worker: Worker | null = null;

  try {
    // Preprocess image for better OCR accuracy
    const processedImage = await preprocessImage(imageBuffer);

    // Initialize Tesseract worker
    worker = await createWorker("eng", 1, {
      logger: () => {}, // Suppress logs
    });

    // Perform OCR
    const {
      data: { text, confidence },
    } = await worker.recognize(processedImage);

    const processingTimeMs = Date.now() - startTime;

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert 0-100 to 0-1
      language: "eng",
      processingTimeMs,
    };
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw new Error(
      `Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // @ts-ignore - pdf-parse types issue
    const data = await pdfParse(pdfBuffer);

    const processingTimeMs = Date.now() - startTime;

    // PDF extraction doesn't provide confidence, so we estimate based on text length
    const confidence = data.text.length > 50 ? 0.95 : 0.7;

    return {
      text: data.text.trim(),
      confidence,
      language: "eng",
      processingTimeMs,
      pageCount: data.numpages,
    };
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Preprocess image to improve OCR accuracy
 * - Resize to optimal dimensions
 * - Increase contrast
 * - Convert to grayscale
 * - Sharpen
 */
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Only process if image is reasonable size
    if (!metadata.width || !metadata.height) {
      return imageBuffer;
    }

    // Resize if too large (OCR works best at ~300 DPI)
    let processed = image;
    const maxDimension = 3000;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      processed = processed.resize(maxDimension, maxDimension, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Apply image enhancements
    processed = processed
      .greyscale() // Convert to grayscale
      .normalize() // Normalize histogram for better contrast
      .sharpen(); // Sharpen edges

    return await processed.png().toBuffer();
  } catch (error) {
    console.error("Image preprocessing failed:", error);
    // Return original if preprocessing fails
    return imageBuffer;
  }
}

/**
 * Analyze image quality and provide recommendations
 */
export async function analyzeImageQuality(
  imageBuffer: Buffer
): Promise<ImageQualityMetrics> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const stats = await image.stats();

    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image metadata");
    }

    const recommendations: string[] = [];
    let qualityScore = 1.0;

    // Check resolution (lower score if too small)
    const minRecommendedWidth = 800;
    const isLowResolution = metadata.width < minRecommendedWidth;
    if (isLowResolution) {
      qualityScore -= 0.2;
      recommendations.push(
        "Image resolution is low. Try scanning at a higher DPI (300+ recommended)."
      );
    }

    // Check file size (very small files may indicate compression issues)
    const isSmallFile = imageBuffer.length < 50000; // 50KB
    if (isSmallFile && metadata.width > 1000) {
      qualityScore -= 0.15;
      recommendations.push(
        "Image appears heavily compressed. Use less compression for clearer text."
      );
    }

    // Estimate blur (using variance of laplacian - simplified here)
    // In a real implementation, you'd calculate the Laplacian variance
    const isBlurry = false; // Placeholder - would need actual blur detection
    if (isBlurry) {
      qualityScore -= 0.3;
      recommendations.push(
        "Image appears blurry. Hold camera steady or use better lighting."
      );
    }

    // Check contrast (standard deviation of pixel values)
    const channelStats = stats.channels[0];
    const isLowContrast =
      channelStats && channelStats.stdev !== undefined
        ? channelStats.stdev < 30
        : false;
    if (isLowContrast) {
      qualityScore -= 0.2;
      recommendations.push(
        "Image has low contrast. Ensure good lighting and avoid shadows."
      );
    }

    // Ensure quality score stays in bounds
    qualityScore = Math.max(0, Math.min(1, qualityScore));

    if (qualityScore >= 0.9) {
      recommendations.push("Excellent image quality!");
    } else if (qualityScore >= 0.7) {
      recommendations.push("Good image quality - should work well for OCR.");
    }

    return {
      resolution: {
        width: metadata.width,
        height: metadata.height,
      },
      size: imageBuffer.length,
      isBlurry,
      isLowContrast,
      qualityScore,
      recommendations,
    };
  } catch (error) {
    console.error("Image quality analysis failed:", error);
    // Return default metrics if analysis fails
    return {
      resolution: { width: 0, height: 0 },
      size: imageBuffer.length,
      isBlurry: false,
      isLowContrast: false,
      qualityScore: 0.5,
      recommendations: ["Unable to analyze image quality."],
    };
  }
}

/**
 * Main processing function - determines file type and extracts text
 */
export async function processDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{
  ocrResult: OCRResult;
  qualityMetrics?: ImageQualityMetrics;
}> {
  // Handle PDFs
  if (mimeType === "application/pdf") {
    const ocrResult = await extractTextFromPDF(fileBuffer);
    return { ocrResult };
  }

  // Handle images
  if (mimeType.startsWith("image/")) {
    const [ocrResult, qualityMetrics] = await Promise.all([
      extractTextFromImage(fileBuffer),
      analyzeImageQuality(fileBuffer),
    ]);

    return { ocrResult, qualityMetrics };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * OCR Processing Utility
 *
 * Text extraction runs through the per-page, confidence-driven cascade in
 * ./ocr-cascade (pdfjs → Tesseract → Google Cloud Vision → AWS Textract).
 * This module keeps the public entry points and the image quality analysis.
 */

import sharp from "sharp";
import {
  cascadeImage,
  cascadePdf,
  type CascadeResult,
  type OcrTier,
  type PageOcr,
} from "./ocr-cascade";

export interface OCRResult {
  text: string;
  confidence: number; // 0-1
  language: string;
  processingTimeMs: number;
  pageCount?: number;
  /** The most expensive cascade tier any page needed. */
  method?: OcrTier | "none";
  /** Which tier each page landed on, with its confidence and every attempt. */
  pages?: PageOcr[];
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
 * Extract text from an image (photo or scan) through the OCR cascade:
 * Tesseract → Google Cloud Vision → AWS Textract, escalating on low confidence.
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<OCRResult> {
  return toOcrResult(await cascadeImage(imageBuffer));
}

/**
 * Extract text from a PDF, page by page, through the OCR cascade:
 * pdfjs text layer → Tesseract → Google Cloud Vision → AWS Textract. Each page
 * escalates only when the cheaper tier's confidence or text falls short.
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<OCRResult> {
  return toOcrResult(await cascadePdf(pdfBuffer));
}

function toOcrResult(r: CascadeResult): OCRResult {
  return {
    text: r.text,
    confidence: r.confidence,
    language: "eng",
    processingTimeMs: r.processingTimeMs,
    pageCount: r.pageCount,
    method: r.method,
    pages: r.pages,
  };
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
 * Generate quality metrics for PDF documents based on OCR results
 */
function generatePdfQualityMetrics(ocrResult: OCRResult): ImageQualityMetrics {
  const recommendations: string[] = [];
  let qualityScore = 1.0;

  // Every page passing on its text layer indicates a born-digital PDF
  const isBornDigital = ocrResult.method === "pdfjs";

  // Evaluate text extraction success
  const charsPerPage = ocrResult.pageCount
    ? ocrResult.text.length / ocrResult.pageCount
    : ocrResult.text.length;

  if (ocrResult.text.length === 0) {
    qualityScore = 0;
    recommendations.push(
      "No text could be extracted from this PDF. The file may be corrupted or contain only images without embedded text."
    );
  } else if (
    charsPerPage < 50 &&
    ocrResult.pageCount &&
    ocrResult.pageCount > 0
  ) {
    qualityScore -= 0.3;
    recommendations.push(
      "Very little text was extracted per page. This may be a scanned document with limited readable content."
    );
  }

  // Factor in OCR confidence
  if (ocrResult.confidence < 0.6) {
    qualityScore -= 0.3;
    recommendations.push(
      "Text recognition confidence is low. Some extracted information may be inaccurate."
    );
  } else if (ocrResult.confidence < 0.8) {
    qualityScore -= 0.1;
    recommendations.push(
      "Text recognition confidence is moderate. Most information should be accurate."
    );
  }

  // Scanned PDFs that needed OCR fallback get lower scores
  if (!isBornDigital && ocrResult.method !== "none") {
    qualityScore -= 0.15;
    recommendations.push(
      "This appears to be a scanned document. Text was extracted using OCR, which may have minor inaccuracies."
    );
  }

  // Good quality messages
  if (qualityScore >= 0.85) {
    if (isBornDigital) {
      recommendations.push(
        "This is a born-digital PDF with excellent text quality. All text was extracted natively."
      );
    } else {
      recommendations.push(
        "Good document quality. Text extraction completed successfully."
      );
    }
  }

  qualityScore = Math.max(0, Math.min(1, qualityScore));

  return {
    resolution: { width: 0, height: 0 }, // Not applicable for PDFs
    size: 0,
    isBlurry: false,
    isLowContrast: false,
    qualityScore,
    recommendations,
  };
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
    const qualityMetrics = generatePdfQualityMetrics(ocrResult);
    return { ocrResult, qualityMetrics };
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

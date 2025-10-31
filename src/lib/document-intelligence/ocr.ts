/**
 * OCR Processing Utility
 * Extracts text from images and PDFs using Tesseract.js
 */

import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { pdfToPng } from "pdf-to-png";

// Use dynamic import for pdfjs-dist to avoid Next.js build issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

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
 * Extract text from a PDF buffer using a hybrid approach:
 * 1. First try pdfjs-dist for digital PDFs with embedded text
 * 2. If no text found, fall back to OCR (convert pages to images and use Tesseract)
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // Step 1: Try extracting text using PDF.js (works for digital PDFs)
    const textContent = await extractTextWithPDFJS(pdfBuffer);

    // If we got substantial text, return it
    if (textContent.text.length > 50) {
      console.log(
        `✓ Extracted ${textContent.text.length} characters from PDF using PDF.js`
      );
      return {
        text: textContent.text,
        confidence: 0.95,
        language: "eng",
        processingTimeMs: Date.now() - startTime,
        pageCount: textContent.pageCount,
      };
    }

    // Step 2: If no text found, it's likely a scanned PDF - use OCR
    console.log(
      "No text found in PDF, falling back to OCR for scanned document..."
    );
    const ocrResult = await extractTextFromScannedPDF(pdfBuffer);

    return {
      ...ocrResult,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from a digital PDF using PDF.js
 */
async function extractTextWithPDFJS(
  pdfBuffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  try {
    // Lazy load pdfjs-dist (only loads when needed)
    if (!pdfjsLib) {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items
      const pageText = textContent.items
        .map((item: any) => {
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      fullText += pageText + "\n";
    }

    return {
      text: fullText.trim(),
      pageCount,
    };
  } catch (error) {
    console.error("PDF.js text extraction failed:", error);
    return { text: "", pageCount: 0 };
  }
}

/**
 * Extract text from a scanned PDF using OCR
 * Converts PDF pages to images and runs Tesseract on each page
 */
async function extractTextFromScannedPDF(
  pdfBuffer: Buffer
): Promise<OCRResult> {
  try {
    // Convert PDF pages to PNG images
    const pngPages = await pdfToPng(pdfBuffer, {
      disableFontFace: true,
      useSystemFonts: false,
    });

    console.log(`Converting ${pngPages.length} PDF pages to images for OCR...`);

    let fullText = "";
    let totalConfidence = 0;
    let worker: Worker | null = null;

    try {
      // Initialize Tesseract worker once for all pages
      worker = await createWorker("eng", 1, {
        logger: () => {}, // Suppress logs
      });

      // Process each page
      for (let i = 0; i < pngPages.length; i++) {
        console.log(`Processing page ${i + 1}/${pngPages.length} with OCR...`);

        const pageBuffer = pngPages[i].content;

        // Preprocess the image for better OCR
        const processedImage = await preprocessImage(pageBuffer);

        // Run OCR on the page
        const {
          data: { text, confidence },
        } = await worker.recognize(processedImage);

        fullText += `\n--- Page ${i + 1} ---\n${text}\n`;
        totalConfidence += confidence;
      }

      const averageConfidence = totalConfidence / pngPages.length / 100; // Convert to 0-1

      return {
        text: fullText.trim(),
        confidence: averageConfidence,
        language: "eng",
        processingTimeMs: 0, // Will be set by caller
        pageCount: pngPages.length,
      };
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  } catch (error) {
    console.error("Scanned PDF OCR failed:", error);
    throw new Error(
      `Failed to OCR scanned PDF: ${error instanceof Error ? error.message : "Unknown error"}`
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

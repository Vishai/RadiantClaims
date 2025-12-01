/**
 * PDF to Image Conversion Utility
 *
 * Uses 'pdf-to-png' (which requires Ghostscript) to convert PDF pages to images.
 * Used as a fallback for OCR when pdf-parse/pdf.js fails (e.g. scanned documents).
 */

// Import using require to handle the CommonJS export structure of pdf-to-png
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfToPngLib = require("pdf-to-png");

// Helper to handle the module export which might be the function itself or have a default
const pdfToPng = pdfToPngLib.default || pdfToPngLib;

/**
 * Convert PDF first page to PNG image
 *
 * @param pdfBuffer - PDF file as Buffer
 * @returns Base64-encoded PNG image (data URL format)
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<string> {
  try {
    // The pdf-to-png library is promise-based, not callback-based.
    // It returns a Promise<PngPage[]>.
    const pngPages = await pdfToPng(pdfBuffer, {
      viewportScale: 2.0,
      pagesToProcess: [1],
    });

    if (Array.isArray(pngPages) && pngPages.length > 0 && pngPages[0].content) {
      const imageBuffer = pngPages[0].content;
      const base64 = imageBuffer.toString("base64");
      return `data:image/png;base64,${base64}`;
    } else {
      throw new Error("No image data returned from PDF conversion");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.toLowerCase().includes("command not found") ||
      errorMessage.toLowerCase().includes("gs") ||
      errorMessage.toLowerCase().includes("ghostscript")
    ) {
      throw new Error(
        "Ghostscript is required for PDF conversion. Please install it (e.g., 'brew install ghostscript')."
      );
    }

    throw new Error(`PDF conversion failed: ${errorMessage}`);
  }
}

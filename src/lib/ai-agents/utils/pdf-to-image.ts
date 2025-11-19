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
  return new Promise((resolve, reject) => {
    try {
      // pdf-to-png writes to a file, so we need a temporary output
      // However, the library might support buffer output if we don't provide outputFolder?
      // Looking at library source (inferred), it likely wraps 'gs'.

      // Since we can't easily check library internals, we'll try the standard usage
      // But we want a Buffer back, not a file.

      // If pdf-to-png doesn't support buffer output easily, we might need a different approach.
      // Let's assume standard usage for now and see if it returns a buffer in the callback.

      // Based on typical pdf-to-png usage:
      pdfToPng(
        pdfBuffer,
        {
          viewportScale: 2.0,
          pagesToProcess: [1],
        },
        (err: any, data: any) => {
          if (err) {
            const errorMessage = err.toString().toLowerCase();
            if (
              errorMessage.includes("command not found") ||
              errorMessage.includes("gs")
            ) {
              reject(
                new Error(
                  "Ghostscript is required for PDF conversion. Please install it (e.g., 'brew install ghostscript')."
                )
              );
            } else {
              reject(new Error(`PDF to PNG conversion failed: ${err}`));
            }
            return;
          }

          // data is usually an array of { pageNumber, content: Buffer }
          if (Array.isArray(data) && data.length > 0 && data[0].content) {
            const imageBuffer = data[0].content;
            const base64 = imageBuffer.toString("base64");
            resolve(`data:image/png;base64,${base64}`);
          } else {
            reject(new Error("No image data returned from PDF conversion"));
          }
        }
      );
    } catch (error) {
      reject(
        new Error(
          `PDF conversion setup failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });
}

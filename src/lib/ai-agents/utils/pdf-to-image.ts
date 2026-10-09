/**
 * PDF to Image Conversion Utility
 *
 * Renders a PDF page to PNG with pdfjs and @napi-rs/canvas (no Ghostscript),
 * the same renderer the OCR cascade uses. Used when the classifier has to look
 * at a page because its text was unreadable.
 */

import { renderPdfPage } from "@/lib/document-intelligence/ocr-cascade";

/**
 * Convert PDF first page to PNG image
 *
 * @param pdfBuffer - PDF file as Buffer
 * @returns Base64-encoded PNG image (data URL format)
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<string> {
  try {
    const png = await renderPdfPage(pdfBuffer, 1);
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF conversion failed: ${errorMessage}`);
  }
}

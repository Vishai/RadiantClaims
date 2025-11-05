/**
 * PDF to Image Conversion Utility
 *
 * NOTE: This utility is currently disabled due to canvas native module issues.
 * GPT-4o Vision fallback will not work until this is fixed.
 *
 * To enable:
 * 1. Install canvas native dependencies: brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
 * 2. Install canvas: pnpm add canvas
 * 3. Rebuild canvas: pnpm rebuild canvas
 * 4. Uncomment the implementation below
 */

/**
 * Convert PDF first page to PNG image
 *
 * CURRENTLY DISABLED - Returns error until canvas module is properly configured
 *
 * @param pdfBuffer - PDF file as Buffer
 * @returns Base64-encoded PNG image (data URL format)
 */
export async function convertPdfToImage(_pdfBuffer: Buffer): Promise<string> {
  throw new Error(
    "PDF to image conversion is currently disabled. " +
      "Canvas native module requires manual setup. " +
      "See src/lib/ai-agents/utils/pdf-to-image.ts for instructions."
  );

  // DISABLED IMPLEMENTATION (requires canvas module):
  //
  // try {
  //   console.log(`📄 Converting PDF to PNG (${pdfBuffer.length} bytes)...`);
  //
  //   const { createCanvas } = await import('canvas');
  //   const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  //
  //   const loadingTask = pdfjsLib.getDocument({
  //     data: new Uint8Array(pdfBuffer),
  //     useSystemFonts: true,
  //     verbosity: 0,
  //   });
  //
  //   const pdfDocument = await loadingTask.promise;
  //   const page = await pdfDocument.getPage(1);
  //   const viewport = page.getViewport({ scale: 2.0 });
  //
  //   const canvas = createCanvas(viewport.width, viewport.height);
  //   const context = canvas.getContext('2d');
  //
  //   await page.render({ canvasContext: context, viewport }).promise;
  //
  //   return canvas.toDataURL('image/png');
  // } catch (error) {
  //   throw new Error(`PDF to PNG conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  // }
}

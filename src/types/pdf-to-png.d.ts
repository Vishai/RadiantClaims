declare module "pdf-to-png" {
  export interface PdfToPngOptions {
    disableFontFace?: boolean;
    useSystemFonts?: boolean;
    viewportScale?: number;
    outputFolder?: string;
    strictPagesToProcess?: boolean;
    pagesToProcess?: number[];
  }

  export interface PngPage {
    name: string;
    content: Buffer;
    path?: string;
  }

  export function pdfToPng(
    pdfBuffer: Buffer,
    options?: PdfToPngOptions
  ): Promise<PngPage[]>;
}

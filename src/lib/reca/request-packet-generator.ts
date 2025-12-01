import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import sharp from "sharp";

// Color scheme matching our UI
const COLORS = {
  sage: rgb(0.38, 0.44, 0.35), // #617059
  terracotta: rgb(0.82, 0.49, 0.37), // #D17D5E
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
};

interface RequestPacketOptions {
  hospitalName: string;
  hospitalAddress?: string;
  hospitalCity?: string;
  hospitalState?: string;
  hospitalZip?: string;
  hospitalPhone?: string;
  treatmentYear: string;
  cancerType: string;
  patientName: string;
  patientDob: string;
  patientSsn?: string; // Optional for privacy in demo
  idFileBuffer: Buffer;
  idFileType: string; // 'application/pdf', 'image/png', 'image/jpeg'
}

export class RequestPacketGenerator {
  private pdfDoc!: PDFDocument;
  private options: RequestPacketOptions;
  private font!: any;
  private boldFont!: any;

  constructor(options: RequestPacketOptions) {
    this.options = options;
  }

  async generate(): Promise<Uint8Array> {
    this.pdfDoc = await PDFDocument.create();
    this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Cover Letter
    await this.generateCoverLetter();

    // 2. HIPAA Release (Text-based for now)
    await this.generateHipaaForm();

    // 3. ID Page
    await this.generateIdPage();

    return await this.pdfDoc.save();
  }

  private async generateCoverLetter() {
    const page = this.pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Header
    page.drawText("MEDICAL RECORDS REQUEST", {
      x: margin,
      y,
      size: 18,
      font: this.boldFont,
      color: COLORS.terracotta,
    });
    y -= 30;

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: margin,
      y,
      size: 12,
      font: this.font,
      color: COLORS.gray,
    });
    y -= 40;

    // Recipient
    page.drawText("To: Medical Records / ROI Department", {
      x: margin,
      y,
      size: 12,
      font: this.boldFont,
    });
    y -= 20;
    page.drawText(this.options.hospitalName, {
      x: margin,
      y,
      size: 12,
      font: this.font,
    });
    y -= 20;

    // Address block if available
    if (this.options.hospitalAddress) {
      page.drawText(this.options.hospitalAddress, {
        x: margin,
        y,
        size: 12,
        font: this.font,
      });
      y -= 20;
    }

    if (this.options.hospitalCity && this.options.hospitalState) {
      const cityStateZip = `${this.options.hospitalCity}, ${this.options.hospitalState} ${this.options.hospitalZip || ""}`;
      page.drawText(cityStateZip, {
        x: margin,
        y,
        size: 12,
        font: this.font,
      });
      y -= 20;
    }

    if (this.options.hospitalPhone) {
      page.drawText(`Phone: ${this.options.hospitalPhone}`, {
        x: margin,
        y,
        size: 12,
        font: this.font,
      });
      y -= 20;
    }

    y -= 20; // Extra spacing

    // Subject
    page.drawText(
      `RE: Patient Records Request for ${this.options.patientName}`,
      {
        x: margin,
        y,
        size: 12,
        font: this.boldFont,
      }
    );
    y -= 20;
    page.drawText(`DOB: ${this.options.patientDob}`, {
      x: margin,
      y,
      size: 12,
      font: this.font,
    });
    y -= 40;

    // Body
    const bodyText = `To Whom It May Concern:

I am writing to request a complete copy of my medical records, specifically Pathology Reports and Discharge Summaries, related to my treatment for ${this.options.cancerType} around the year ${this.options.treatmentYear}.

I am applying for the Radiation Exposure Compensation Act (RECA) federal program, which requires specific proof of diagnosis.

Please find attached:
1. A signed HIPAA Authorization Form (Form 4097 equivalent).
2. A copy of my Government-Issued Photo ID.

Please process this request as soon as possible, as there are strict federal deadlines for this program.

Sincerely,

${this.options.patientName}`;

    page.drawText(bodyText, {
      x: margin,
      y,
      size: 12,
      font: this.font,
      lineHeight: 18,
      maxWidth: width - 2 * margin,
    });
  }

  private async generateHipaaForm() {
    const page = this.pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    page.drawText("HIPAA AUTHORIZATION FOR RELEASE OF INFORMATION", {
      x: margin,
      y,
      size: 16,
      font: this.boldFont,
      color: COLORS.black,
    });
    y -= 40;

    const text = `I, ${this.options.patientName}, hereby authorize ${this.options.hospitalName} to release my health information as described below.

1. Patient Information:
   Name: ${this.options.patientName}
   Date of Birth: ${this.options.patientDob}

2. Information to be Released:
   - Pathology Reports
   - Discharge Summaries
   - Operative Reports
   - Oncology Records
   
   Specifically related to: ${this.options.cancerType} (${this.options.treatmentYear})

3. Purpose of Release:
   Federal Compensation Claim (RECA Program)

4. Expiration:
   This authorization shall expire 1 year from the date of signature.

I understand that I have the right to revoke this authorization at any time.`;

    page.drawText(text, {
      x: margin,
      y,
      size: 12,
      font: this.font,
      lineHeight: 20,
      maxWidth: width - 2 * margin,
    });

    y -= 350;

    // Signature Block
    page.drawLine({
      start: { x: margin, y },
      end: { x: width / 2 - 20, y },
      thickness: 1,
      color: COLORS.black,
    });

    page.drawText("Signature of Patient", {
      x: margin,
      y: y - 20,
      size: 10,
      font: this.font,
    });

    page.drawLine({
      start: { x: width / 2 + 20, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: COLORS.black,
    });

    page.drawText("Date", {
      x: width / 2 + 20,
      y: y - 20,
      size: 10,
      font: this.font,
    });
  }

  private async generateIdPage() {
    // If ID is PDF, merge it
    if (this.options.idFileType === "application/pdf") {
      try {
        const idPdf = await PDFDocument.load(this.options.idFileBuffer);
        const copiedPages = await this.pdfDoc.copyPages(idPdf, [0]); // Just take first page
        this.pdfDoc.addPage(copiedPages[0]);
        console.log("✓ Successfully merged ID PDF page");
      } catch (e) {
        console.error("❌ Failed to merge ID PDF:", e);
        console.error("PDF buffer size:", this.options.idFileBuffer.length);
        this.addErrorPage(
          `Could not merge ID PDF. Error: ${e instanceof Error ? e.message : "Unknown error"}. Please attach manually.`
        );
      }
    }
    // Use sharp to convert HEIC/JPG/PNG/Other to PNG for embedding
    else {
      const page = this.pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;

      page.drawText("ATTACHMENT: GOVERNMENT ID", {
        x: margin,
        y: height - margin,
        size: 16,
        font: this.boldFont,
      });

      console.log(
        `[ID Embedding] Attempting to embed ID image. Type: ${this.options.idFileType}, Buffer size: ${this.options.idFileBuffer.length} bytes`
      );

      try {
        // First, try to use sharp to convert to PNG (handles HEIC, JPEG, PNG, WebP, etc.)
        console.log("[ID Embedding] Converting image to PNG with sharp...");
        const processedBuffer = await sharp(this.options.idFileBuffer)
          .png()
          .toBuffer();

        console.log(
          `[ID Embedding] Sharp conversion successful. PNG buffer size: ${processedBuffer.length} bytes`
        );

        const image = await this.pdfDoc.embedPng(processedBuffer);
        console.log(
          `[ID Embedding] PNG embedded successfully. Dimensions: ${image.width}x${image.height}`
        );

        // Scale image to fit
        const maxWidth = width - 2 * margin;
        const maxHeight = height - 150;
        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height
        );

        page.drawImage(image, {
          x: margin,
          y: height - margin - 50 - image.height * scale,
          width: image.width * scale,
          height: image.height * scale,
        });

        console.log("✓ ID image embedded successfully in PDF");
      } catch (sharpError) {
        console.error(
          "❌ Sharp conversion or PNG embedding failed:",
          sharpError
        );
        console.error("Error details:", {
          message:
            sharpError instanceof Error ? sharpError.message : "Unknown error",
          mimeType: this.options.idFileType,
          bufferSize: this.options.idFileBuffer.length,
        });

        // Fallback: Try direct embedding without sharp
        console.log(
          "[ID Embedding] Attempting fallback: direct embed without sharp..."
        );
        try {
          let image;

          // Try PNG first
          if (
            this.options.idFileType === "image/png" ||
            this.options.idFileType.includes("png")
          ) {
            console.log("[ID Embedding] Attempting direct PNG embed...");
            image = await this.pdfDoc.embedPng(this.options.idFileBuffer);
          }
          // Try JPEG
          else if (
            this.options.idFileType === "image/jpeg" ||
            this.options.idFileType === "image/jpg" ||
            this.options.idFileType.includes("jpeg") ||
            this.options.idFileType.includes("jpg")
          ) {
            console.log("[ID Embedding] Attempting direct JPEG embed...");
            image = await this.pdfDoc.embedJpg(this.options.idFileBuffer);
          }
          // For other types, try PNG then JPEG
          else {
            console.log("[ID Embedding] Unknown type, trying PNG then JPEG...");
            try {
              image = await this.pdfDoc.embedPng(this.options.idFileBuffer);
            } catch {
              console.log("[ID Embedding] PNG failed, trying JPEG...");
              image = await this.pdfDoc.embedJpg(this.options.idFileBuffer);
            }
          }

          if (image) {
            console.log(
              `[ID Embedding] Direct embed successful! Dimensions: ${image.width}x${image.height}`
            );

            // Scale image to fit
            const maxWidth = width - 2 * margin;
            const maxHeight = height - 150;
            const scale = Math.min(
              maxWidth / image.width,
              maxHeight / image.height
            );

            page.drawImage(image, {
              x: margin,
              y: height - margin - 50 - image.height * scale,
              width: image.width * scale,
              height: image.height * scale,
            });

            console.log("✓ ID image embedded successfully via fallback method");
          } else {
            throw new Error(
              "Failed to create image object from buffer (all methods failed)"
            );
          }
        } catch (fallbackError) {
          console.error(
            "❌ All embedding methods failed (sharp + direct):",
            fallbackError
          );
          console.error("Final error details:", {
            sharpError:
              sharpError instanceof Error
                ? sharpError.message
                : "Unknown sharp error",
            fallbackError:
              fallbackError instanceof Error
                ? fallbackError.message
                : "Unknown fallback error",
            mimeType: this.options.idFileType,
            bufferSize: this.options.idFileBuffer.length,
          });

          this.addErrorPage(
            `Could not embed ID Image. \n\nError: ${
              fallbackError instanceof Error
                ? fallbackError.message
                : "Unknown error"
            }\n\nFile type: ${this.options.idFileType}\n\nPlease verify the ID image is a valid PNG, JPEG, or PDF file and try again.\n\nIf this problem persists, please contact support with the error details above.`
          );
        }
      }
    }
  }

  private addErrorPage(message: string) {
    const page = this.pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Header
    page.drawText("⚠ ATTACHMENT ERROR", {
      x: margin,
      y,
      size: 18,
      font: this.boldFont,
      color: rgb(0.8, 0, 0),
    });
    y -= 40;

    // Error message - split by newlines for better formatting
    const lines = message.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        page.drawText(line, {
          x: margin,
          y,
          size: 11,
          font: this.font,
          color: rgb(0, 0, 0),
          maxWidth: width - 2 * margin,
        });
        y -= 18;
      } else {
        y -= 10; // Smaller gap for empty lines
      }
    }
  }
}

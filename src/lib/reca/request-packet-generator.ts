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
      } catch (e) {
        console.error("Failed to merge ID PDF", e);
        this.addErrorPage("Could not merge ID PDF. Please attach manually.");
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

      try {
        const processedBuffer = await sharp(this.options.idFileBuffer)
          .png()
          .toBuffer();

        const image = await this.pdfDoc.embedPng(processedBuffer);

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
      } catch (e) {
        console.error("Failed to embed ID Image", e);
        this.addErrorPage("Could not embed ID Image. Please attach manually.");
      }
    }
  }

  private addErrorPage(message: string) {
    const page = this.pdfDoc.addPage();
    page.drawText(message, {
      x: 50,
      y: 700,
      size: 12,
      color: rgb(1, 0, 0),
    });
  }
}

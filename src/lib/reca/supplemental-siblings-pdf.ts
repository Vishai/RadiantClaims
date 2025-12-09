/**
 * Supplemental Sibling Information PDF Generator
 * Creates a professional document for siblings beyond the 3-sibling limit on the official RECA form
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { SiblingInformation } from "./types";

// Color scheme matching our UI and other PDFs
const COLORS = {
  sage: rgb(0.38, 0.44, 0.35), // #617059
  terracotta: rgb(0.82, 0.49, 0.37), // #D17D5E
  cream: rgb(0.98, 0.96, 0.91), // #FAF5E9
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  white: rgb(1, 1, 1),
  lightGray: rgb(0.95, 0.95, 0.95),
};

interface ClaimantReference {
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  ssn?: string;
}

interface SupplementalSiblingsPDFOptions {
  siblings: SiblingInformation[]; // Siblings 4+
  claimantInfo: ClaimantReference;
  filerInfo?: ClaimantReference; // Person filling out the form (if different)
  startingNumber?: number; // What number to start counting from (default: 4)
}

export class SupplementalSiblingsPDFGenerator {
  private pdfDoc!: PDFDocument;
  private currentPage!: PDFPage;
  private currentY: number = 0;
  private pageWidth: number = 612; // US Letter width in points
  private pageHeight: number = 792; // US Letter height in points
  private margin: number = 50;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private siblings: SiblingInformation[];
  private claimantInfo: ClaimantReference;
  private filerInfo?: ClaimantReference;
  private startingNumber: number;

  constructor(options: SupplementalSiblingsPDFOptions) {
    this.siblings = options.siblings;
    this.claimantInfo = options.claimantInfo;
    this.filerInfo = options.filerInfo;
    this.startingNumber = options.startingNumber || 4;
  }

  async generate(): Promise<Uint8Array> {
    this.pdfDoc = await PDFDocument.create();
    this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate header page
    await this.generateHeaderPage();

    // Generate sibling detail pages
    await this.generateSiblingPages();

    return await this.pdfDoc.save();
  }

  private addNewPage(): PDFPage {
    this.currentPage = this.pdfDoc.addPage([this.pageWidth, this.pageHeight]);
    this.currentY = this.pageHeight - this.margin;
    return this.currentPage;
  }

  private async generateHeaderPage() {
    this.addNewPage();

    // Title
    this.currentY = this.pageHeight - 60;
    this.drawText("SUPPLEMENTAL SIBLING INFORMATION", {
      x: this.margin,
      y: this.currentY,
      size: 18,
      font: this.boldFont,
      color: COLORS.terracotta,
    });

    this.currentY -= 25;
    this.drawText("Attachment to RECA Downwinder Claim Form", {
      x: this.margin,
      y: this.currentY,
      size: 14,
      font: this.boldFont,
      color: COLORS.sage,
    });

    this.currentY -= 40;
    this.drawHorizontalLine(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin
    );

    // Claimant Information Box
    this.currentY -= 30;
    this.drawText("CLAIMANT INFORMATION (Person Who Became Ill)", {
      x: this.margin,
      y: this.currentY,
      size: 12,
      font: this.boldFont,
      color: COLORS.sage,
    });

    this.currentY -= 25;
    const claimantName = [
      this.claimantInfo.firstName,
      this.claimantInfo.middleName,
      this.claimantInfo.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    this.drawField("Full Name:", claimantName);
    this.drawField("Date of Birth:", this.formatDate(this.claimantInfo.dob));
    if (this.claimantInfo.ssn) {
      this.drawField(
        "Social Security Number:",
        this.formatSSN(this.claimantInfo.ssn)
      );
    }

    // Filer Information (if different)
    if (this.filerInfo) {
      this.currentY -= 30;
      this.drawText("FILER INFORMATION (Person Completing This Form)", {
        x: this.margin,
        y: this.currentY,
        size: 12,
        font: this.boldFont,
        color: COLORS.sage,
      });

      this.currentY -= 25;
      const filerName = [
        this.filerInfo.firstName,
        this.filerInfo.middleName,
        this.filerInfo.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      this.drawField("Full Name:", filerName);
      this.drawField("Date of Birth:", this.formatDate(this.filerInfo.dob));
    }

    // Purpose statement
    this.currentY -= 40;
    this.drawBox({
      x: this.margin,
      y: this.currentY - 100,
      width: this.pageWidth - 2 * this.margin,
      height: 100,
      fillColor: COLORS.lightGray,
      borderColor: COLORS.sage,
    });

    this.currentY -= 20;
    this.drawText("PURPOSE OF THIS DOCUMENT:", {
      x: this.margin + 10,
      y: this.currentY,
      size: 11,
      font: this.boldFont,
      color: COLORS.black,
    });

    this.currentY -= 20;
    const purposeLines = [
      "The official RECA Downwinder Claim Form has space for three (3) siblings in Part 6.",
      `This supplemental document provides complete information for siblings ${this.startingNumber} through ${this.startingNumber + this.siblings.length - 1}.`,
      "",
      "This document should be submitted with your complete RECA claim packet.",
    ];

    purposeLines.forEach((line) => {
      if (line === "") {
        this.currentY -= 5;
        return;
      }
      this.drawText(line, {
        x: this.margin + 10,
        y: this.currentY,
        size: 10,
        color: COLORS.black,
      });
      this.currentY -= 15;
    });

    // Summary count
    this.currentY -= 30;
    this.drawText(
      `Total Additional Siblings Listed in This Document: ${this.siblings.length}`,
      {
        x: this.margin,
        y: this.currentY,
        size: 12,
        font: this.boldFont,
        color: COLORS.terracotta,
      }
    );

    this.currentY -= 20;
    this.drawText(
      `Generated: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      {
        x: this.margin,
        y: this.currentY,
        size: 9,
        color: COLORS.gray,
      }
    );
  }

  private async generateSiblingPages() {
    this.siblings.forEach((sibling, index) => {
      const siblingNumber = this.startingNumber + index;

      // Check if we need a new page (rough estimate)
      if (this.currentY < 250) {
        this.addNewPage();
        this.currentY -= 20;
      }

      // Sibling header
      this.currentY -= 40;
      this.drawBox({
        x: this.margin,
        y: this.currentY - 30,
        width: this.pageWidth - 2 * this.margin,
        height: 30,
        fillColor: COLORS.sage,
        borderColor: COLORS.sage,
      });

      this.currentY -= 20;
      this.drawText(`SIBLING ${siblingNumber}: ${sibling.name}`, {
        x: this.margin + 10,
        y: this.currentY,
        size: 13,
        font: this.boldFont,
        color: COLORS.white,
      });

      // Sibling details
      this.currentY -= 35;
      this.drawField("Full Name:", sibling.name);
      this.drawField("Date of Birth:", sibling.dateOfBirth);
      this.drawField("City of Birth:", sibling.cityOfBirth);
      this.drawField("State of Birth:", sibling.stateOfBirth);

      // Deceased information
      this.currentY -= 5;
      this.drawField("Deceased:", sibling.isDeceased === "YES" ? "Yes" : "No");

      if (sibling.isDeceased === "YES") {
        if (sibling.dateOfDeath) {
          this.drawField("Date of Death:", sibling.dateOfDeath);
        }
        if (sibling.cityOfDeath) {
          this.drawField("City of Death:", sibling.cityOfDeath);
        }
        if (sibling.stateOfDeath) {
          this.drawField("State of Death:", sibling.stateOfDeath);
        }
        if (sibling.hasDeathCertificate) {
          const deathCertStatus =
            sibling.hasDeathCertificate === "YES"
              ? "Death Certificate Attached"
              : sibling.hasDeathCertificate === "WILL_OBTAIN"
                ? "Will Obtain Death Certificate"
                : "No Death Certificate";
          this.drawField("Death Certificate:", deathCertStatus);
        }
      } else {
        // Living sibling contact info
        if (sibling.currentAddress) {
          this.drawField("Current Address:", sibling.currentAddress);
        }
        if (sibling.phoneNumber) {
          this.drawField("Phone Number:", sibling.phoneNumber);
        }
      }

      // Name change history
      if (sibling.hadNameChange === "YES") {
        this.currentY -= 10;
        this.drawText("Name Change History:", {
          x: this.margin + 10,
          y: this.currentY,
          size: 10,
          font: this.boldFont,
          color: COLORS.black,
        });
        this.currentY -= 15;

        if (sibling.originalLastName) {
          this.drawText(`Original Last Name: ${sibling.originalLastName}`, {
            x: this.margin + 20,
            y: this.currentY,
            size: 9,
            color: COLORS.gray,
          });
          this.currentY -= 15;
        }

        if (sibling.nameChangeHistory && sibling.nameChangeHistory.length > 0) {
          sibling.nameChangeHistory.forEach((change, changeIndex) => {
            this.drawText(`${changeIndex + 1}. ${change.previousName}`, {
              x: this.margin + 20,
              y: this.currentY,
              size: 9,
              color: COLORS.black,
            });
            this.currentY -= 12;

            const reason =
              change.reasonForChange === "OTHER" && change.otherReason
                ? change.otherReason
                : change.reasonForChange.replace(/_/g, " ");

            this.drawText(
              `   Changed on ${change.dateOfChange} due to ${reason}`,
              {
                x: this.margin + 20,
                y: this.currentY,
                size: 8,
                color: COLORS.gray,
              }
            );
            this.currentY -= 15;
          });
        }
      }

      // Separator line between siblings
      this.currentY -= 10;
      this.drawHorizontalLine(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        COLORS.cream
      );
    });

    // Final page footer
    this.currentY = this.margin + 30;
    this.drawText("END OF SUPPLEMENTAL SIBLING INFORMATION", {
      x: this.margin,
      y: this.currentY,
      size: 10,
      font: this.boldFont,
      color: COLORS.sage,
    });

    this.currentY -= 15;
    this.drawText(
      "Please attach this document to your RECA Downwinder Claim Form (Part 6)",
      {
        x: this.margin,
        y: this.currentY,
        size: 9,
        color: COLORS.gray,
      }
    );
  }

  private drawField(label: string, value?: string) {
    if (!value) return;

    this.drawText(label, {
      x: this.margin + 10,
      y: this.currentY,
      size: 9,
      font: this.boldFont,
      color: COLORS.gray,
    });

    this.drawText(value, {
      x: this.margin + 150,
      y: this.currentY,
      size: 10,
      color: COLORS.black,
    });

    this.currentY -= 15;
  }

  private drawText(
    text: string,
    options: {
      x: number;
      y: number;
      size?: number;
      font?: PDFFont;
      color?: { red: number; green: number; blue: number };
    }
  ) {
    this.currentPage.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size || 10,
      font: options.font || this.font,
      color: options.color || COLORS.black,
    });
  }

  private drawBox(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor?: { red: number; green: number; blue: number };
    borderColor?: { red: number; green: number; blue: number };
  }) {
    if (options.fillColor) {
      this.currentPage.drawRectangle({
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        color: options.fillColor,
      });
    }

    if (options.borderColor) {
      this.currentPage.drawRectangle({
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        borderColor: options.borderColor,
        borderWidth: 1,
      });
    }
  }

  private drawHorizontalLine(
    x: number,
    y: number,
    width: number,
    color = COLORS.sage
  ) {
    this.currentPage.drawLine({
      start: { x, y },
      end: { x: x + width, y },
      thickness: 1,
      color,
    });
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return "Not provided";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  private formatSSN(ssn: string): string {
    // Format as XXX-XX-XXXX
    const cleaned = ssn.replace(/\D/g, "");
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  }
}

/**
 * Helper function to generate supplemental siblings PDF
 */
export async function generateSupplementalSiblingsPDF(
  options: SupplementalSiblingsPDFOptions
): Promise<Uint8Array> {
  const generator = new SupplementalSiblingsPDFGenerator(options);
  return await generator.generate();
}

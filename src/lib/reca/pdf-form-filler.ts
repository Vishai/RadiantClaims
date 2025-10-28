/**
 * RECA PDF Form Filler
 * Overlays form data onto the official RECA Downwinder Claim Form PDF
 * Since the PDF doesn't have fillable fields, we overlay text at specific coordinates
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { RECAFormData, RECASupportingForms } from "./types";

// PDF dimensions (US Letter: 8.5" x 11" at 72 DPI)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

// Font sizes
const FONT_SIZES = {
  small: 8,
  normal: 10,
  medium: 12,
  large: 14,
};

// Colors
const COLORS = {
  black: rgb(0, 0, 0),
  blue: rgb(0, 0, 0.5),
};

interface FieldCoordinate {
  page: number; // 0-indexed
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  type?: "text" | "checkbox" | "date";
  characterSpacing?: number; // For SSN and date fields with boxes per character
}

/**
 * Coordinate mappings for each form field
 * These coordinates are measured from the bottom-left corner of each page
 * Y-axis: 0 is bottom, 792 is top
 * X-axis: 0 is left, 612 is right
 */
const FIELD_COORDINATES: Record<string, FieldCoordinate> = {
  // PART 1: YOU, the person filling out this form (Page 1)
  // Calibrated from fine-grid overlay - 14pt character spacing
  "part1.firstName": {
    page: 0,
    x: 80,
    y: 420,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.middleName": {
    page: 0,
    x: 322,
    y: 420,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.lastName": {
    page: 0,
    x: 80,
    y: 380,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.formerNames": {
    page: 0,
    x: 80,
    y: 340,
    fontSize: 12,
    characterSpacing: 18,
  },
  // SSN split into 3 segments (XXX - XX - XXXX)
  "part1.ssn.part1": {
    page: 0,
    x: 80,
    y: 300,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.ssn.part2": {
    page: 0,
    x: 150,
    y: 300,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.ssn.part3": {
    page: 0,
    x: 200,
    y: 300,
    fontSize: 12,
    characterSpacing: 18,
  },
  // DOB split into 3 segments (MM / DD / YYYY)
  "part1.dob.month": {
    page: 0,
    x: 330,
    y: 303,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.dob.day": {
    page: 0,
    x: 382,
    y: 303,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.dob.year": {
    page: 0,
    x: 440,
    y: 303,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.mailingAddress": {
    page: 0,
    x: 78,
    y: 245,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 490,
  },
  "part1.mailingAddress2": {
    page: 0,
    x: 78,
    y: 210,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 490,
  },
  "part1.city": {
    page: 0,
    x: 78,
    y: 170,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 308,
  },
  "part1.state": {
    page: 0,
    x: 385,
    y: 170,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 28,
  },
  "part1.zipCode": {
    page: 0,
    x: 444,
    y: 170,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 140,
  },
  // Phone Day split into 3 segments (XXX - XXX - XXXX)
  "part1.phoneDay.part1": {
    page: 0,
    x: 78,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.phoneDay.part2": {
    page: 0,
    x: 150,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.phoneDay.part3": {
    page: 0,
    x: 218,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Phone Evening split into 3 segments (XXX - XXX - XXXX)
  "part1.phoneEvening.part1": {
    page: 0,
    x: 330,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.phoneEvening.part2": {
    page: 0,
    x: 400,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.phoneEvening.part3": {
    page: 0,
    x: 470,
    y: 118,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part1.email": {
    page: 0,
    x: 76,
    y: 78,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 490,
  },

  // PART 1: Residence Address (Page 2)
  // Applied same offset: +28 X, -150 Y
  "part1.residenceAddress": {
    page: 1,
    x: 78,
    y: 580,
    fontSize: 10,
    maxWidth: 500,
  },
  "part1.residenceAddress2": {
    page: 1,
    x: 78,
    y: 550,
    fontSize: 10,
    maxWidth: 500,
  },
  "part1.tribe": { page: 1, x: 128, y: 440, fontSize: 10, maxWidth: 300 },
  "part1.censusNumber": {
    page: 1,
    x: 188,
    y: 410,
    fontSize: 10,
    maxWidth: 200,
  },
  "part1.tribalAssistance.navajo": { page: 1, x: 70, y: 370, type: "checkbox" },
  "part1.tribalAssistance.other": { page: 1, x: 70, y: 350, type: "checkbox" },
  "part1.tribalAssistance.otherName": {
    page: 1,
    x: 158,
    y: 350,
    fontSize: 10,
    maxWidth: 300,
  },
  "part1.tribalAssistance.no": { page: 1, x: 70, y: 330, type: "checkbox" },

  // PART 2: THE CLAIMANT (Page 2)
  // Applied same offset: +28 X, -150 Y from original
  "part2.firstName": {
    page: 1,
    x: 78,
    y: 220,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.middleName": {
    page: 1,
    x: 328,
    y: 220,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.lastName": {
    page: 1,
    x: 78,
    y: 190,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.formerNames": {
    page: 1,
    x: 78,
    y: 160,
    fontSize: 10,
    characterSpacing: 11,
  },
  // Part 2 SSN split into 3 segments
  "part2.ssn.part1": {
    page: 1,
    x: 78,
    y: 130,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.ssn.part2": {
    page: 1,
    x: 130,
    y: 130,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.ssn.part3": {
    page: 1,
    x: 172,
    y: 130,
    fontSize: 10,
    characterSpacing: 11,
  },
  // Part 2 DOB split into 3 segments
  "part2.dob.month": {
    page: 1,
    x: 78,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.dob.day": {
    page: 1,
    x: 115,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.dob.year": {
    page: 1,
    x: 160,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },
  // Part 2 DOD split into 3 segments
  "part2.dod.month": {
    page: 1,
    x: 328,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.dod.day": {
    page: 1,
    x: 365,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },
  "part2.dod.year": {
    page: 1,
    x: 410,
    y: 100,
    fontSize: 10,
    characterSpacing: 11,
  },

  // PART 3: RELATIONSHIP (Page 3)
  // Applied same offset: +28 X, -150 Y from original
  "part3.self": { page: 2, x: 70, y: 530, type: "checkbox" },
  "part3.spouse": { page: 2, x: 70, y: 500, type: "checkbox" },
  "part3.child": { page: 2, x: 70, y: 470, type: "checkbox" },
  "part3.parent": { page: 2, x: 338, y: 530, type: "checkbox" },
  "part3.grandchild": { page: 2, x: 338, y: 500, type: "checkbox" },
  "part3.grandparent": { page: 2, x: 338, y: 470, type: "checkbox" },

  // PART 8: EXPOSURE (Pages 6-7, 0-indexed: pages 5-6)
  // Exposure period options (Page 6)
  "part8.option1a": { page: 5, x: 42, y: 450, type: "checkbox" }, // designated area 1+ year, Jan 21 1951 - Nov 6 1962
  "part8.option1b": { page: 5, x: 42, y: 425, type: "checkbox" }, // designated area entire period, June 30 - July 31 1962
  "part8.option2": { page: 5, x: 42, y: 370, type: "checkbox" }, // New Mexico 1+ year, Sept 24 1944 - Nov 6 1962

  // Location fields (Page 7, 0-indexed: page 6)
  // Simple states (no county)
  "part8.idaho.townCity": {
    page: 6,
    x: 120,
    y: 680,
    fontSize: 10,
    maxWidth: 200,
  },
  "part8.idaho.timePeriod": {
    page: 6,
    x: 450,
    y: 680,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.newMexico.townCity": {
    page: 6,
    x: 120,
    y: 652,
    fontSize: 10,
    maxWidth: 200,
  },
  "part8.newMexico.timePeriod": {
    page: 6,
    x: 450,
    y: 652,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.utah.townCity": {
    page: 6,
    x: 120,
    y: 624,
    fontSize: 10,
    maxWidth: 200,
  },
  "part8.utah.timePeriod": {
    page: 6,
    x: 450,
    y: 624,
    fontSize: 10,
    maxWidth: 120,
  },

  // Arizona counties (6 rows)
  "part8.arizona.coconino.townCity": {
    page: 6,
    x: 270,
    y: 560,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.coconino.timePeriod": {
    page: 6,
    x: 450,
    y: 560,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.arizona.yavapai.townCity": {
    page: 6,
    x: 270,
    y: 532,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.yavapai.timePeriod": {
    page: 6,
    x: 450,
    y: 532,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.arizona.navajo.townCity": {
    page: 6,
    x: 270,
    y: 504,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.navajo.timePeriod": {
    page: 6,
    x: 450,
    y: 504,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.arizona.apache.townCity": {
    page: 6,
    x: 270,
    y: 476,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.apache.timePeriod": {
    page: 6,
    x: 450,
    y: 476,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.arizona.gila.townCity": {
    page: 6,
    x: 270,
    y: 448,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.gila.timePeriod": {
    page: 6,
    x: 450,
    y: 448,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.arizona.mohave.townCity": {
    page: 6,
    x: 270,
    y: 420,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.arizona.mohave.timePeriod": {
    page: 6,
    x: 450,
    y: 420,
    fontSize: 10,
    maxWidth: 120,
  },

  // Nevada counties (6 rows)
  "part8.nevada.whitePine.townCity": {
    page: 6,
    x: 270,
    y: 380,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.whitePine.timePeriod": {
    page: 6,
    x: 450,
    y: 380,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.nevada.nye.townCity": {
    page: 6,
    x: 270,
    y: 352,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.nye.timePeriod": {
    page: 6,
    x: 450,
    y: 352,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.nevada.lander.townCity": {
    page: 6,
    x: 270,
    y: 324,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.lander.timePeriod": {
    page: 6,
    x: 450,
    y: 324,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.nevada.lincoln.townCity": {
    page: 6,
    x: 270,
    y: 296,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.lincoln.timePeriod": {
    page: 6,
    x: 450,
    y: 296,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.nevada.eureka.townCity": {
    page: 6,
    x: 270,
    y: 268,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.eureka.timePeriod": {
    page: 6,
    x: 450,
    y: 268,
    fontSize: 10,
    maxWidth: 120,
  },
  "part8.nevada.clark.townCity": {
    page: 6,
    x: 270,
    y: 228,
    fontSize: 10,
    maxWidth: 160,
  },
  "part8.nevada.clark.timePeriod": {
    page: 6,
    x: 450,
    y: 228,
    fontSize: 10,
    maxWidth: 120,
  },

  // PART 10: COMPENSABLE DISEASES (Page 9, 0-indexed: page 8)
  // Left column diseases
  "part10.leukemia": { page: 8, x: 42, y: 655, type: "checkbox" },
  "part10.multipleMyeloma": { page: 8, x: 42, y: 625, type: "checkbox" },
  "part10.lymphomas": { page: 8, x: 42, y: 595, type: "checkbox" },
  "part10.thyroid": { page: 8, x: 42, y: 565, type: "checkbox" },
  "part10.breast": { page: 8, x: 42, y: 535, type: "checkbox" },
  "part10.esophagus": { page: 8, x: 42, y: 505, type: "checkbox" },
  "part10.stomach": { page: 8, x: 42, y: 475, type: "checkbox" },
  "part10.pharynx": { page: 8, x: 42, y: 445, type: "checkbox" },
  "part10.smallIntestine": { page: 8, x: 42, y: 415, type: "checkbox" },

  // Right column diseases
  "part10.pancreas": { page: 8, x: 310, y: 655, type: "checkbox" },
  "part10.bileDucts": { page: 8, x: 310, y: 625, type: "checkbox" },
  "part10.gallBladder": { page: 8, x: 310, y: 595, type: "checkbox" },
  "part10.salivaryGland": { page: 8, x: 310, y: 565, type: "checkbox" },
  "part10.urinaryBladder": { page: 8, x: 310, y: 535, type: "checkbox" },
  "part10.brain": { page: 8, x: 310, y: 505, type: "checkbox" },
  "part10.colon": { page: 8, x: 310, y: 475, type: "checkbox" },
  "part10.ovary": { page: 8, x: 310, y: 445, type: "checkbox" },
  "part10.liver": { page: 8, x: 310, y: 415, type: "checkbox" },
  "part10.lung": { page: 8, x: 310, y: 385, type: "checkbox" },

  // PART 16: SIGNATURE (Page 13, 0-indexed: page 12)
  "part16.signatureDate": {
    page: 12,
    x: 500,
    y: 545,
    fontSize: 10,
    maxWidth: 80,
  },

  // We'll add more coordinates as we map each section
};

interface PDFFormFillerOptions {
  formData: Partial<RECAFormData>;
  supportingForms: Partial<RECASupportingForms>;
  sessionId: string;
  officialPdfPath: string;
}

export class RECAPDFFormFiller {
  private pdfDoc!: PDFDocument;
  private pages: PDFPage[] = [];
  private font: any;
  private boldFont: any;
  private formData: Partial<RECAFormData>;
  private supportingForms: Partial<RECASupportingForms>;
  private officialPdfPath: string;

  constructor(options: PDFFormFillerOptions) {
    this.formData = options.formData;
    this.supportingForms = options.supportingForms;
    this.officialPdfPath = options.officialPdfPath;
  }

  async fill(): Promise<Uint8Array> {
    // Load the official PDF
    const pdfBytes = fs.readFileSync(this.officialPdfPath);
    this.pdfDoc = await PDFDocument.load(pdfBytes);

    // Get all pages
    this.pages = this.pdfDoc.getPages();

    // Embed fonts
    this.font = await this.pdfDoc.embedFont(StandardFonts.Courier);
    this.boldFont = await this.pdfDoc.embedFont(StandardFonts.CourierBold);

    // Fill in each part
    await this.fillPart1();
    await this.fillPart2();
    await this.fillPart3();
    await this.fillPart5();
    await this.fillPart6();
    await this.fillPart7();
    await this.fillPart8();
    await this.fillPart9();
    await this.fillPart10();
    await this.fillPart11();
    await this.fillPart12();
    await this.fillPart13();
    await this.fillPart14();
    await this.fillPart15();
    await this.fillPart16();

    return await this.pdfDoc.save();
  }

  private async fillPart1() {
    if (!this.formData.part_1) return;

    const part1 = this.formData.part_1;

    // Fill name fields with character spacing for boxes
    this.drawTextInBoxes("part1.firstName", part1.firstName);
    this.drawTextInBoxes("part1.middleName", part1.middleName);
    this.drawTextInBoxes("part1.lastName", part1.lastName);
    this.drawTextInBoxes("part1.formerNames", part1.formerNames);

    // Fill SSN in segments (XXX-XX-XXXX)
    this.drawSSN("part1.ssn", part1.ssn);

    // Fill DOB in segments (MM/DD/YYYY)
    this.drawDate("part1.dob", part1.dob);

    // Fill address fields
    this.drawText("part1.mailingAddress", part1.mailingAddress);
    this.drawText("part1.city", part1.city);
    this.drawText("part1.state", part1.state);
    this.drawText("part1.zipCode", part1.zipCode);

    // Fill phone numbers in segments
    this.drawPhone("part1.phoneDay", part1.phoneDay);
    this.drawPhone("part1.phoneEvening", part1.phoneEvening);

    // Fill email
    this.drawText("part1.email", part1.email);

    // Fill residence address if different
    this.drawText("part1.residenceAddress", part1.residenceAddress);

    // Fill tribal information
    this.drawText("part1.tribe", part1.tribalAffiliation);
    this.drawText("part1.censusNumber", part1.tribalCensusNumber);

    // Check tribal assistance checkboxes
    if (part1.tribalAssistance) {
      if (part1.tribalAssistance === "navajo") {
        this.drawCheckbox("part1.tribalAssistance.navajo");
      } else if (part1.tribalAssistance === "other") {
        this.drawCheckbox("part1.tribalAssistance.other");
        this.drawText(
          "part1.tribalAssistance.otherName",
          part1.tribalAssistanceOther
        );
      } else if (part1.tribalAssistance === "no") {
        this.drawCheckbox("part1.tribalAssistance.no");
      }
    }
  }

  private async fillPart2() {
    if (!this.formData.part_2) return;

    const part2 = this.formData.part_2;

    this.drawTextInBoxes("part2.firstName", part2.firstName);
    this.drawTextInBoxes("part2.middleName", part2.middleName);
    this.drawTextInBoxes("part2.lastName", part2.lastName);
    this.drawTextInBoxes("part2.formerNames", part2.formerNames);

    // Fill SSN in segments
    this.drawSSN("part2.ssn", part2.ssn);

    // Fill DOB in segments
    this.drawDate("part2.dob", part2.dob);

    // Fill DOD (date of death) in segments
    this.drawDate("part2.dod", part2.dod);
  }

  private async fillPart3() {
    if (!this.formData.part_3) return;

    const relationship = this.formData.part_3.relationship;

    const checkboxMap: Record<string, string> = {
      self: "part3.self",
      spouse: "part3.spouse",
      child: "part3.child",
      parent: "part3.parent",
      grandchild: "part3.grandchild",
      grandparent: "part3.grandparent",
    };

    if (relationship && checkboxMap[relationship]) {
      this.drawCheckbox(checkboxMap[relationship]);
    }
  }

  private async fillPart5() {
    // TODO: Implement Part 5 - Surviving Spouse
    if (!this.formData.part_5) return;
    // Add coordinate mappings and implement
  }

  private async fillPart6() {
    // TODO: Implement Part 6 - Surviving Child
    if (!this.formData.part_6) return;
    // Add coordinate mappings and implement
  }

  private async fillPart7() {
    // TODO: Implement Part 7 - Other Relatives
    if (!this.formData.part_7) return;
    // Add coordinate mappings and implement
  }

  private async fillPart8() {
    if (!this.formData.part_8) return;

    const part8 = this.formData.part_8;

    // Check exposure period option
    if (part8.exposureOption) {
      if (part8.exposureOption === "designated_1year") {
        this.drawCheckbox("part8.option1a");
      } else if (part8.exposureOption === "designated_june_july_1962") {
        this.drawCheckbox("part8.option1b");
      } else if (part8.exposureOption === "new_mexico_1year") {
        this.drawCheckbox("part8.option2");
      }
    }

    // Fill location data
    if (part8.locations) {
      // Simple states (no county)
      if (part8.locations.idaho) {
        this.drawText("part8.idaho.townCity", part8.locations.idaho.townCity);
        this.drawText(
          "part8.idaho.timePeriod",
          part8.locations.idaho.timePeriod
        );
      }
      if (part8.locations.newMexico) {
        this.drawText(
          "part8.newMexico.townCity",
          part8.locations.newMexico.townCity
        );
        this.drawText(
          "part8.newMexico.timePeriod",
          part8.locations.newMexico.timePeriod
        );
      }
      if (part8.locations.utah) {
        this.drawText("part8.utah.townCity", part8.locations.utah.townCity);
        this.drawText("part8.utah.timePeriod", part8.locations.utah.timePeriod);
      }

      // Arizona counties
      if (part8.locations.arizona && Array.isArray(part8.locations.arizona)) {
        part8.locations.arizona.forEach((location) => {
          const county = location.county.toLowerCase();
          this.drawText(`part8.arizona.${county}.townCity`, location.townCity);
          this.drawText(
            `part8.arizona.${county}.timePeriod`,
            location.timePeriod
          );
        });
      }

      // Nevada counties
      if (part8.locations.nevada && Array.isArray(part8.locations.nevada)) {
        part8.locations.nevada.forEach((location) => {
          const county = location.county.toLowerCase().replace(" ", "");
          // Convert "White Pine" -> "whitePine"
          const countyKey = county.charAt(0).toLowerCase() + county.slice(1);
          this.drawText(
            `part8.nevada.${countyKey}.townCity`,
            location.townCity
          );
          this.drawText(
            `part8.nevada.${countyKey}.timePeriod`,
            location.timePeriod
          );
        });
      }
    }
  }

  private async fillPart9() {
    // TODO: Implement Part 9 - Proof of Presence
    if (!this.formData.part_9) return;
    // Add coordinate mappings and implement
  }

  private async fillPart10() {
    if (!this.formData.part_10) return;

    const part10 = this.formData.part_10;

    // Map disease names to checkbox field keys
    const diseaseCheckboxMap: Record<string, string> = {
      leukemia: "part10.leukemia",
      multiple_myeloma: "part10.multipleMyeloma",
      lymphomas: "part10.lymphomas",
      thyroid: "part10.thyroid",
      breast: "part10.breast",
      esophagus: "part10.esophagus",
      stomach: "part10.stomach",
      pharynx: "part10.pharynx",
      small_intestine: "part10.smallIntestine",
      pancreas: "part10.pancreas",
      bile_ducts: "part10.bileDucts",
      gall_bladder: "part10.gallBladder",
      salivary_gland: "part10.salivaryGland",
      urinary_bladder: "part10.urinaryBladder",
      brain: "part10.brain",
      colon: "part10.colon",
      ovary: "part10.ovary",
      liver: "part10.liver",
      lung: "part10.lung",
    };

    // Check the boxes for selected diseases
    if (part10.diseases && Array.isArray(part10.diseases)) {
      part10.diseases.forEach((disease) => {
        const checkboxKey = diseaseCheckboxMap[disease];
        if (checkboxKey) {
          this.drawCheckbox(checkboxKey);
        }
      });
    }
  }

  private async fillPart11() {
    // TODO: Implement Part 11 - Proof of Disease
    if (!this.formData.part_11) return;
    // Add coordinate mappings and implement
  }

  private async fillPart12() {
    // TODO: Implement Part 12 - Previous Payments
    if (!this.formData.part_12) return;
    // Add coordinate mappings and implement
  }

  private async fillPart13() {
    // TODO: Implement Part 13 - Attorney Representation
    if (!this.formData.part_13) return;
    // Add coordinate mappings and implement
  }

  private async fillPart14() {
    // TODO: Implement Part 14 - Attorney Acknowledgment
    if (!this.formData.part_14) return;
    // Add coordinate mappings and implement
  }

  private async fillPart15() {
    // TODO: Implement Part 15 - Legal Guardian
    if (!this.formData.part_15) return;
    // Add coordinate mappings and implement
  }

  private async fillPart16() {
    if (!this.formData.part_16) return;

    const part16 = this.formData.part_16;

    // Fill signature date (signature itself is manual)
    if (part16.signatureDate) {
      this.drawText("part16.signatureDate", part16.signatureDate);
    }
  }

  // Helper methods

  /**
   * Draw text at specified coordinates
   * If characterSpacing is defined, use character-by-character spacing
   */
  private drawText(fieldKey: string, text?: string | null) {
    if (!text) return;

    const coords = FIELD_COORDINATES[fieldKey];
    if (!coords) {
      console.warn(`No coordinates found for field: ${fieldKey}`);
      return;
    }

    // If character spacing is defined, use drawTextInBoxes instead
    if (coords.characterSpacing) {
      this.drawTextInBoxes(fieldKey, text);
      return;
    }

    const page = this.pages[coords.page];
    if (!page) {
      console.warn(`Page ${coords.page} not found for field: ${fieldKey}`);
      return;
    }

    const fontSize = coords.fontSize || FONT_SIZES.normal;
    const maxWidth = coords.maxWidth || PAGE_WIDTH - coords.x - 50;

    // Truncate text if it exceeds maxWidth
    let displayText = text;
    const textWidth = this.font.widthOfTextAtSize(displayText, fontSize);
    if (textWidth > maxWidth) {
      while (
        this.font.widthOfTextAtSize(displayText + "...", fontSize) > maxWidth &&
        displayText.length > 0
      ) {
        displayText = displayText.slice(0, -1);
      }
      displayText += "...";
    }

    page.drawText(displayText, {
      x: coords.x,
      y: coords.y,
      size: fontSize,
      font: this.font,
      color: COLORS.black,
    });
  }

  /**
   * Draw text with character spacing (for forms with individual boxes per character)
   */
  private drawTextInBoxes(fieldKey: string, text?: string | null) {
    if (!text) return;

    const coords = FIELD_COORDINATES[fieldKey];
    if (!coords || !coords.characterSpacing) {
      // Fallback to regular text drawing
      this.drawText(fieldKey, text);
      return;
    }

    const page = this.pages[coords.page];
    if (!page) return;

    const fontSize = coords.fontSize || FONT_SIZES.normal;
    const spacing = coords.characterSpacing;

    // Draw each character with spacing
    const characters = text.toUpperCase().split("");
    characters.forEach((char, index) => {
      page.drawText(char, {
        x: coords.x + index * spacing,
        y: coords.y,
        size: fontSize,
        font: this.font,
        color: COLORS.black,
      });
    });
  }

  /**
   * Draw SSN in segments (XXX - XX - XXXX)
   * Draws each part separately to work around pre-printed dashes
   */
  private drawSSN(fieldKeyPrefix: string, ssn?: string | null) {
    if (!ssn) return;

    // Remove any existing dashes
    const cleanSSN = ssn.replace(/-/g, "");

    // Validate length
    if (cleanSSN.length !== 9) {
      console.warn(
        `Invalid SSN length for ${fieldKeyPrefix}: ${cleanSSN.length} (expected 9)`
      );
      return;
    }

    // Split into parts: XXX-XX-XXXX
    const part1 = cleanSSN.substring(0, 3); // First 3 digits
    const part2 = cleanSSN.substring(3, 5); // Middle 2 digits
    const part3 = cleanSSN.substring(5, 9); // Last 4 digits

    // Draw each part separately
    this.drawTextInBoxes(`${fieldKeyPrefix}.part1`, part1);
    this.drawTextInBoxes(`${fieldKeyPrefix}.part2`, part2);
    this.drawTextInBoxes(`${fieldKeyPrefix}.part3`, part3);
  }

  /**
   * Draw phone number in segments (XXX - XXX - XXXX)
   * Draws each part separately to work around pre-printed dashes
   */
  private drawPhone(fieldKeyPrefix: string, phone?: string | null) {
    if (!phone) return;

    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, "");

    // Validate length
    if (cleanPhone.length !== 10) {
      console.warn(
        `Invalid phone length for ${fieldKeyPrefix}: ${cleanPhone.length} (expected 10)`
      );
      return;
    }

    // Split into parts: XXX-XXX-XXXX
    const part1 = cleanPhone.substring(0, 3); // Area code
    const part2 = cleanPhone.substring(3, 6); // Exchange
    const part3 = cleanPhone.substring(6, 10); // Line number

    // Draw each part separately
    this.drawTextInBoxes(`${fieldKeyPrefix}.part1`, part1);
    this.drawTextInBoxes(`${fieldKeyPrefix}.part2`, part2);
    this.drawTextInBoxes(`${fieldKeyPrefix}.part3`, part3);
  }

  /**
   * Draw a date in MM/DD/YYYY format with segments
   * Draws each part separately to work around pre-printed slashes
   */
  private drawDate(fieldKeyPrefix: string, dateString?: string | null) {
    if (!dateString) return;

    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = String(date.getFullYear());

      // Draw each segment separately
      this.drawTextInBoxes(`${fieldKeyPrefix}.month`, month);
      this.drawTextInBoxes(`${fieldKeyPrefix}.day`, day);
      this.drawTextInBoxes(`${fieldKeyPrefix}.year`, year);
    } catch (err) {
      console.error(`Error formatting date for ${fieldKeyPrefix}:`, err);
    }
  }

  /**
   * Draw a checkbox (X mark)
   */
  private drawCheckbox(fieldKey: string, checked: boolean = true) {
    if (!checked) return;

    const coords = FIELD_COORDINATES[fieldKey];
    if (!coords) return;

    const page = this.pages[coords.page];
    if (!page) return;

    // Draw an X in the checkbox
    page.drawText("X", {
      x: coords.x,
      y: coords.y,
      size: 12,
      font: this.boldFont,
      color: COLORS.black,
    });
  }

  /**
   * Format phone number
   */
  private formatPhone(phone?: string | null): string {
    if (!phone) return "";
    // Remove non-digits
    const digits = phone.replace(/\D/g, "");
    // Format as XXX-XXX-XXXX
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }
}

/**
 * Export function to fill the official RECA PDF
 */
export async function fillOfficialRECAPDF(
  options: PDFFormFillerOptions
): Promise<Uint8Array> {
  const filler = new RECAPDFFormFiller(options);
  return await filler.fill();
}

/**
 * RECA PDF Form Filler
 * Overlays form data onto the official RECA Downwinder Claim Form PDF
 * Since the PDF doesn't have fillable fields, we overlay text at specific coordinates
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import { RECAFormData, RECASupportingForms } from "./types";

// PDF dimensions (US Letter: 8.5" x 11" at 72 DPI)
const PAGE_WIDTH = 612;

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
    y: 683,
    fontSize: 12,
    maxWidth: 500,
    characterSpacing: 18,
  },
  "part1.residenceAddress2": {
    page: 1,
    x: 78,
    y: 652,
    fontSize: 12,
    maxWidth: 500,
    characterSpacing: 18,
  },
  "part1.tribe": { page: 1, x: 230, y: 555, fontSize: 10, maxWidth: 300 },
  "part1.censusNumber": {
    page: 1,
    x: 230,
    y: 527,
    fontSize: 10,
    maxWidth: 200,
  },
  "part1.tribalAssistance.navajo": { page: 1, x: 74, y: 480, type: "checkbox" },
  "part1.tribalAssistance.other": { page: 1, x: 74, y: 466, type: "checkbox" },
  "part1.tribalAssistance.otherName": {
    page: 1,
    x: 160,
    y: 466,
    fontSize: 10,
    maxWidth: 300,
  },
  "part1.tribalAssistance.no": { page: 1, x: 74, y: 450, type: "checkbox" },

  // PART 2: THE CLAIMANT (Page 2)
  // Applied same offset: +28 X, -150 Y from original
  "part2.firstName": {
    page: 1,
    x: 78,
    y: 326,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.middleName": {
    page: 1,
    x: 323,
    y: 326,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.lastName": {
    page: 1,
    x: 78,
    y: 286,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.formerNames": {
    page: 1,
    x: 78,
    y: 242,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Part 2 SSN split into 3 segments
  "part2.ssn.part1": {
    page: 1,
    x: 78,
    y: 197,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.ssn.part2": {
    page: 1,
    x: 149,
    y: 197,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.ssn.part3": {
    page: 1,
    x: 200,
    y: 197,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Part 2 DOB split into 3 segments
  "part2.dob.month": {
    page: 1,
    x: 78,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.dob.day": {
    page: 1,
    x: 130,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.dob.year": {
    page: 1,
    x: 182,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Part 2 DOD split into 3 segments
  "part2.dod.month": {
    page: 1,
    x: 328,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.dod.day": {
    page: 1,
    x: 380,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part2.dod.year": {
    page: 1,
    x: 433,
    y: 160,
    fontSize: 12,
    characterSpacing: 18,
  },

  // PART 3: RELATIONSHIP (Page 3)
  // Applied same offset: +28 X, -150 Y from original
  "part3.self": { page: 2, x: 74, y: 661, type: "checkbox" },
  "part3.spouse": { page: 2, x: 74, y: 628, type: "checkbox" },
  "part3.child": { page: 2, x: 74, y: 594, type: "checkbox" },
  "part3.parent": { page: 2, x: 309, y: 661, type: "checkbox" },
  "part3.grandchild": { page: 2, x: 309, y: 628, type: "checkbox" },
  "part3.grandparent": { page: 2, x: 309, y: 594, type: "checkbox" },

  // PART 4: SELF-FILERS (Page 3, 0-indexed: page 2)
  // Document requirement checkboxes
  "part4.birthCertificate": { page: 2, x: 74, y: 487, type: "checkbox" },
  "part4.marriageCertificates": { page: 2, x: 74, y: 465, type: "checkbox" },

  // PART 5: SURVIVING SPOUSE (Page 3-4, 0-indexed: pages 2-3)
  // Question checkboxes (Page 3)
  "part5.claimantDeceased.yes": { page: 2, x: 293, y: 320, type: "checkbox" },
  "part5.claimantDeceased.no": { page: 2, x: 340, y: 320, type: "checkbox" },
  "part5.marriedOneYear.yes": { page: 2, x: 293, y: 263, type: "checkbox" },
  "part5.marriedOneYear.no": { page: 2, x: 340, y: 263, type: "checkbox" },
  "part5.claimantPreviousMarriages.yes": {
    page: 2,
    x: 293,
    y: 220,
    type: "checkbox",
  },
  "part5.claimantPreviousMarriages.no": {
    page: 2,
    x: 338,
    y: 220,
    type: "checkbox",
  },
  // Text lines for claimant's previous marriages (if YES above)
  "part5.claimantPreviousSpouse1": {
    page: 2,
    x: 72,
    y: 162,
    fontSize: 10,
    maxWidth: 530,
  },
  "part5.claimantPreviousSpouse2": {
    page: 2,
    x: 72,
    y: 149,
    fontSize: 10,
    maxWidth: 530,
  },

  "part5.filerOtherMarriages.yes": {
    page: 2,
    x: 293,
    y: 107,
    type: "checkbox",
  },
  "part5.filerOtherMarriages.no": { page: 2, x: 338, y: 107, type: "checkbox" },

  // Text lines for filer's other marriages (if YES above)
  "part5.filerOtherSpouse1": {
    page: 3,
    x: 76,
    y: 693,
    fontSize: 10,
    maxWidth: 530,
  },
  "part5.filerOtherSpouse2": {
    page: 3,
    x: 76,
    y: 680,
    fontSize: 10,
    maxWidth: 530,
  },
  "part5.filerOtherSpouse3": {
    page: 3,
    x: 76,
    y: 664,
    fontSize: 10,
    maxWidth: 530,
  },
  "part5.filerOtherSpouse4": {
    page: 3,
    x: 76,
    y: 650,
    fontSize: 10,
    maxWidth: 530,
  },

  // Document requirement checkboxes (Page 4, 0-indexed: page 3)
  "part5.birthCertificateClaimant": {
    page: 3,
    x: 74,
    y: 553,
    type: "checkbox",
  },
  "part5.deathCertificate": { page: 3, x: 74, y: 533, type: "checkbox" },
  "part5.marriageCertificate": { page: 3, x: 74, y: 514, type: "checkbox" },
  "part5.marriageCertificatesPrevious": {
    page: 3,
    x: 74,
    y: 493,
    type: "checkbox",
  },
  "part5.divorceDecreesPrevious": { page: 3, x: 74, y: 461, type: "checkbox" },
  "part5.birthCertificateFiler": { page: 3, x: 74, y: 429, type: "checkbox" },
  "part5.marriageCertificatesFiler": {
    page: 3,
    x: 74,
    y: 409,
    type: "checkbox",
  },
  "part5.divorceDecreesFiler": { page: 3, x: 74, y: 389, type: "checkbox" },

  // PART 6: SURVIVING CHILD (Pages 4-6, 0-indexed: pages 3-5)
  // Question checkboxes (Page 4)
  "part6.claimantDeceased.yes": { page: 3, x: 290, y: 199, type: "checkbox" },
  "part6.claimantDeceased.no": { page: 3, x: 340, y: 199, type: "checkbox" },
  "part6.claimantEverMarried.yes": {
    page: 3,
    x: 290,
    y: 154,
    type: "checkbox",
  },
  "part6.claimantEverMarried.no": { page: 3, x: 337, y: 154, type: "checkbox" },

  // Spouse list write-in fields at top of Page 4 (for surviving child section)
  "part6.spouseInfo1": { page: 3, x: 76, y: 120, fontSize: 10, maxWidth: 530 },
  "part6.spouseInfo2": { page: 3, x: 76, y: 107, fontSize: 10, maxWidth: 530 },
  "part6.spouseInfo3": { page: 3, x: 76, y: 94, fontSize: 10, maxWidth: 530 },

  // Child type checkboxes (Page 5, 0-indexed: page 4)
  "part6.childType.natural": { page: 4, x: 215, y: 640, type: "checkbox" },
  "part6.childType.adopted": { page: 4, x: 348, y: 640, type: "checkbox" },
  "part6.childType.stepChild": { page: 4, x: 450, y: 640, type: "checkbox" },
  "part6.otherChildren.yes": { page: 4, x: 430, y: 610, type: "checkbox" },
  "part6.otherChildren.no": { page: 4, x: 480, y: 610, type: "checkbox" },
  "part6.additionalChildrenAttached": {
    page: 4,
    x: 362,
    y: 355,
    type: "checkbox",
  },

  // Children information write-in fields (Page 5, 0-indexed: page 4)
  // Name, date/place of birth, phone, address OR date/place of death
  "part6.child1.name": { page: 4, x: 120, y: 553, fontSize: 12, maxWidth: 200 },
  "part6.child1.birthDate": {
    page: 4,
    x: 420,
    y: 553,
    fontSize: 8,
    maxWidth: 80,
  },
  "part6.child1.birthPlace": {
    page: 4,
    x: 475,
    y: 553,
    fontSize: 8,
    maxWidth: 210,
  },
  "part6.child1.phone": {
    page: 4,
    x: 213,
    y: 511,
    fontSize: 10,
    maxWidth: 120,
  },
  "part6.child1.address": {
    page: 4,
    x: 220,
    y: 525,
    fontSize: 10,
    maxWidth: 375,
  },
  "part6.child1.deathDate": {
    page: 4,
    x: 263,
    y: 540,
    fontSize: 10,
    maxWidth: 80,
  },
  "part6.child1.deathPlace": {
    page: 4,
    x: 320,
    y: 543,
    fontSize: 10,
    maxWidth: 415,
  },

  "part6.child2.name": { page: 4, x: 120, y: 497, fontSize: 12, maxWidth: 200 },
  "part6.child2.birthDate": {
    page: 4,
    x: 422,
    y: 497,
    fontSize: 8,
    maxWidth: 80,
  },
  "part6.child2.birthPlace": {
    page: 4,
    x: 475,
    y: 497,
    fontSize: 8,
    maxWidth: 210,
  },
  "part6.child2.phone": {
    page: 4,
    x: 218,
    y: 453,
    fontSize: 10,
    maxWidth: 120,
  },
  "part6.child2.address": {
    page: 4,
    x: 220,
    y: 469,
    fontSize: 10,
    maxWidth: 375,
  },
  "part6.child2.deathDate": {
    page: 4,
    x: 255,
    y: 482,
    fontSize: 8,
    maxWidth: 80,
  },
  "part6.child2.deathPlace": {
    page: 4,
    x: 310,
    y: 482,
    fontSize: 8,
    maxWidth: 415,
  },

  "part6.child3.name": { page: 4, x: 120, y: 442, fontSize: 12, maxWidth: 200 },
  "part6.child3.birthDate": {
    page: 4,
    x: 420,
    y: 442,
    fontSize: 8,
    maxWidth: 80,
  },
  "part6.child3.birthPlace": {
    page: 4,
    x: 470,
    y: 442,
    fontSize: 8,
    maxWidth: 210,
  },
  "part6.child3.phone": {
    page: 4,
    x: 218,
    y: 396,
    fontSize: 10,
    maxWidth: 120,
  },
  "part6.child3.address": {
    page: 4,
    x: 220,
    y: 410,
    fontSize: 10,
    maxWidth: 375,
  },
  "part6.child3.deathDate": {
    page: 4,
    x: 258,
    y: 425,
    fontSize: 8,
    maxWidth: 80,
  },
  "part6.child3.deathPlace": {
    page: 4,
    x: 315,
    y: 425,
    fontSize: 8,
    maxWidth: 415,
  },

  // We need another checkbox field here as a check for more children, if there are more children we will have to add a supplemental attachment with that information ( this is for later when we are attaching the pdf to the form we are filling out through /reca/start form stuff)

  // Document requirement checkboxes (Page 5)
  "part6.birthCertificateClaimant": {
    page: 4,
    x: 73,
    y: 256,
    type: "checkbox",
  },
  "part6.deathCertificate": { page: 4, x: 73, y: 239, type: "checkbox" },
  "part6.marriageCertificates": { page: 4, x: 73, y: 219, type: "checkbox" },
  "part6.divorceDecrees": { page: 4, x: 73, y: 199, type: "checkbox" },
  "part6.birthCertificateFiler": { page: 4, x: 73, y: 170, type: "checkbox" },
  "part6.marriageCertificatesFiler": {
    page: 4,
    x: 73,
    y: 151,
    type: "checkbox",
  },
  "part6.stepChildProof": { page: 4, x: 73, y: 131, type: "checkbox" },
  "part6.siblingDeathCertificates": {
    page: 4,
    x: 73,
    y: 86,
    type: "checkbox",
  },

  // Additional document checkboxes (Page 6, 0-indexed: page 5)
  "part6.birthCertificatesSiblings": {
    page: 5,
    x: 72,
    y: 681,
    type: "checkbox",
  },
  "part6.marriageCertificatesSiblings": {
    page: 5,
    x: 72,
    y: 662,
    type: "checkbox",
  },
  "part6.expeditedSignatures": { page: 5, x: 72, y: 615, type: "checkbox" },

  // PART 7: OTHER RELATIVES (Page 6, 0-indexed: page 5)
  // Relationship type checkboxes
  "part7.parent": { page: 5, x: 211, y: 438, type: "checkbox" },
  "part7.grandchild": { page: 5, x: 323, y: 438, type: "checkbox" },
  "part7.grandparent": { page: 5, x: 448, y: 438, type: "checkbox" },

  // Document requirement checkboxes
  "part7.birthCertificateClaimant": {
    page: 5,
    x: 73,
    y: 399,
    type: "checkbox",
  },
  "part7.deathCertificate": { page: 5, x: 73, y: 377, type: "checkbox" },
  "part7.marriageCertificates": { page: 5, x: 73, y: 355, type: "checkbox" },
  "part7.divorceDecrees": { page: 5, x: 73, y: 333, type: "checkbox" },
  "part7.siblingDeathCertificates": {
    page: 5,
    x: 73,
    y: 299,
    type: "checkbox",
  },
  "part7.birthCertificateFiler": { page: 5, x: 73, y: 276, type: "checkbox" },
  "part7.marriageCertificatesFiler": {
    page: 5,
    x: 73,
    y: 254,
    type: "checkbox",
  },

  // PART 8: EXPOSURE (Pages 6-7, 0-indexed: pages 5-6)
  // Exposure period options (Page 6)
  "part8.option1a": { page: 5, x: 105, y: 171, type: "checkbox" }, // designated area 1+ year, Jan 21 1951 - Nov 6 1962
  "part8.option1b": { page: 5, x: 105, y: 136, type: "checkbox" }, // designated area entire period, June 30 - July 31 1962
  "part8.option2": { page: 5, x: 105, y: 96, type: "checkbox" }, // New Mexico 1+ year, Sept 24 1944 - Nov 6 1962

  // Location fields (Page 7, 0-indexed: page 6)
  // Simple states (no county)
  "part8.idaho.townCity": {
    page: 6,
    x: 150,
    y: 542,
    fontSize: 12,
    maxWidth: 200,
  },
  "part8.idaho.timePeriod": {
    page: 6,
    x: 430,
    y: 542,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.newMexico.townCity": {
    page: 6,
    x: 150,
    y: 512,
    fontSize: 12,
    maxWidth: 200,
  },
  "part8.newMexico.timePeriod": {
    page: 6,
    x: 430,
    y: 512,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.utah.townCity": {
    page: 6,
    x: 150,
    y: 482,
    fontSize: 12,
    maxWidth: 200,
  },
  "part8.utah.timePeriod": {
    page: 6,
    x: 430,
    y: 482,
    fontSize: 12,
    maxWidth: 120,
  },

  // Arizona counties (6 rows)
  "part8.arizona.coconino.townCity": {
    page: 6,
    x: 220,
    y: 417,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.coconino.timePeriod": {
    page: 6,
    x: 430,
    y: 417,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.arizona.yavapai.townCity": {
    page: 6,
    x: 220,
    y: 392,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.yavapai.timePeriod": {
    page: 6,
    x: 430,
    y: 392,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.arizona.navajo.townCity": {
    page: 6,
    x: 220,
    y: 370,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.navajo.timePeriod": {
    page: 6,
    x: 430,
    y: 370,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.arizona.apache.townCity": {
    page: 6,
    x: 220,
    y: 345,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.apache.timePeriod": {
    page: 6,
    x: 430,
    y: 345,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.arizona.gila.townCity": {
    page: 6,
    x: 220,
    y: 323,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.gila.timePeriod": {
    page: 6,
    x: 430,
    y: 323,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.arizona.mohave.townCity": {
    page: 6,
    x: 220,
    y: 299,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.arizona.mohave.timePeriod": {
    page: 6,
    x: 430,
    y: 299,
    fontSize: 12,
    maxWidth: 120,
  },

  // Nevada counties (6 rows)
  "part8.nevada.whitePine.townCity": {
    page: 6,
    x: 220,
    y: 274,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.whitePine.timePeriod": {
    page: 6,
    x: 430,
    y: 274,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.nevada.nye.townCity": {
    page: 6,
    x: 220,
    y: 250,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.nye.timePeriod": {
    page: 6,
    x: 430,
    y: 250,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.nevada.lander.townCity": {
    page: 6,
    x: 220,
    y: 225,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.lander.timePeriod": {
    page: 6,
    x: 430,
    y: 225,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.nevada.lincoln.townCity": {
    page: 6,
    x: 220,
    y: 204,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.lincoln.timePeriod": {
    page: 6,
    x: 430,
    y: 204,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.nevada.eureka.townCity": {
    page: 6,
    x: 220,
    y: 179,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.eureka.timePeriod": {
    page: 6,
    x: 430,
    y: 179,
    fontSize: 12,
    maxWidth: 120,
  },
  "part8.nevada.clark.townCity": {
    page: 6,
    x: 220,
    y: 122,
    fontSize: 12,
    maxWidth: 160,
  },
  "part8.nevada.clark.timePeriod": {
    page: 6,
    x: 430,
    y: 122,
    fontSize: 12,
    maxWidth: 120,
  },

  // PART 10: COMPENSABLE DISEASES (Page 9, 0-indexed: page 8)
  // Left column diseases
  "part10.leukemia": { page: 8, x: 74, y: 620, type: "checkbox" },
  "part10.multipleMyeloma": { page: 8, x: 74, y: 583, type: "checkbox" },
  "part10.lymphomas": { page: 8, x: 74, y: 560, type: "checkbox" },
  "part10.thyroid": { page: 8, x: 74, y: 523, type: "checkbox" },
  "part10.breast": { page: 8, x: 74, y: 500, type: "checkbox" },
  "part10.esophagus": { page: 8, x: 74, y: 463, type: "checkbox" },
  "part10.stomach": { page: 8, x: 74, y: 442, type: "checkbox" },
  "part10.pharynx": { page: 8, x: 74, y: 418, type: "checkbox" },
  "part10.smallIntestine": { page: 8, x: 74, y: 395, type: "checkbox" },

  // Right column diseases
  "part10.pancreas": { page: 8, x: 325, y: 613, type: "checkbox" },
  "part10.bileDucts": { page: 8, x: 325, y: 590, type: "checkbox" },
  "part10.gallBladder": { page: 8, x: 325, y: 566, type: "checkbox" },
  "part10.salivaryGland": { page: 8, x: 325, y: 544, type: "checkbox" },
  "part10.urinaryBladder": { page: 8, x: 325, y: 521, type: "checkbox" },
  "part10.brain": { page: 8, x: 325, y: 499, type: "checkbox" },
  "part10.colon": { page: 8, x: 325, y: 475, type: "checkbox" },
  "part10.ovary": { page: 8, x: 325, y: 453, type: "checkbox" },
  "part10.liver": { page: 8, x: 325, y: 431, type: "checkbox" },
  "part10.lung": { page: 8, x: 325, y: 393, type: "checkbox" },

  // PART 9: PROOF OF PRESENCE (Page 8, 0-indexed: page 7)
  "part9.contactedChurchLDS": { page: 7, x: 73, y: 161, type: "checkbox" },

  // PART 11: PROOF OF DISEASE (Pages 9-10, 0-indexed: pages 8-9)
  "part11.submittedMedicalRecords": {
    page: 8,
    x: 73,
    y: 111,
    type: "checkbox",
  },
  "part11.cancerRegistryAuthorization": {
    page: 9,
    x: 73,
    y: 659,
    type: "checkbox",
  },
  "part11.resepAssistance.yes": { page: 9, x: 281, y: 573, type: "checkbox" },
  "part11.resepAssistance.no": { page: 9, x: 329, y: 573, type: "checkbox" },
  "part11.resepClinicName": {
    page: 9,
    x: 208,
    y: 530,
    fontSize: 10,
    maxWidth: 530,
  },

  // PART 12: PREVIOUS PAYMENTS (Page 10, 0-indexed: page 9)
  "part12.receivedPayment.yes": { page: 9, x: 286, y: 373, type: "checkbox" },
  "part12.receivedPayment.no": { page: 9, x: 343, y: 373, type: "checkbox" },
  "part12.eeoicpaClaim.yes": { page: 9, x: 283, y: 245, type: "checkbox" },
  "part12.eeoicpaClaim.no": { page: 9, x: 345, y: 245, type: "checkbox" },

  // PART 13: ATTORNEY REPRESENTATION (Page 11, 0-indexed: page 10)
  "part13.hasAttorney.yes": { page: 10, x: 290, y: 679, type: "checkbox" },
  "part13.hasAttorney.no": { page: 10, x: 360, y: 679, type: "checkbox" },
  "part13.attorneyFirstName": {
    page: 10,
    x: 75,
    y: 378,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyLastName": {
    page: 10,
    x: 322,
    y: 378,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyFirm": {
    page: 10,
    x: 75,
    y: 335,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 445, // Max to x: 520
  },
  "part13.attorneyFirm2": {
    page: 10,
    x: 75,
    y: 300, // Second line below first
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 445, // Max to x: 520
  },
  "part13.attorneyAddress": {
    page: 10,
    x: 75,
    y: 248,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 530,
  },
  "part13.attorneyCity": {
    page: 10,
    x: 75,
    y: 172,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 308,
  },
  "part13.attorneyState": {
    page: 10,
    x: 382,
    y: 172,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 28,
  },
  "part13.attorneyZip": {
    page: 10,
    x: 442,
    y: 172,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 140,
  },
  // Attorney phone split into 3 segments (XXX - XXX - XXXX)
  "part13.attorneyPhone.part1": {
    page: 10,
    x: 75,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyPhone.part2": {
    page: 10,
    x: 150,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyPhone.part3": {
    page: 10,
    x: 220,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Attorney fax split into 3 segments
  "part13.attorneyFax.part1": {
    page: 10,
    x: 330,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyFax.part2": {
    page: 10,
    x: 400,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyFax.part3": {
    page: 10,
    x: 470,
    y: 120,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part13.attorneyEmail": {
    page: 10,
    x: 75,
    y: 80,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 530,
  },

  // PART 14: ATTORNEY ACKNOWLEDGMENT (Page 12, 0-indexed: page 11)
  "part14.feeType.initial2Percent": {
    page: 11,
    x: 110,
    y: 610,
    type: "checkbox",
  },
  "part14.feeType.resubmission10Percent": {
    page: 11,
    x: 110,
    y: 572,
    type: "checkbox",
  },
  "part14.signatureDate": {
    page: 11,
    x: 420,
    y: 535,
    fontSize: 10,
    maxWidth: 80,
  },

  // PART 15: LEGAL GUARDIAN (Page 12, 0-indexed: page 11)
  "part15.guardianFirstName": {
    page: 11,
    x: 75,
    y: 364,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianMiddleName": {
    page: 11,
    x: 322,
    y: 364,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianLastName": {
    page: 11,
    x: 75,
    y: 322,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianAddress": {
    page: 11,
    x: 75,
    y: 274,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 445, // Max to x: 520
  },
  "part15.guardianAddress2": {
    page: 11,
    x: 75,
    y: 240, // Second line below first
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 445, // Max to x: 520
  },
  "part15.guardianCity": {
    page: 11,
    x: 75,
    y: 200,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 308,
  },
  "part15.guardianState": {
    page: 11,
    x: 382,
    y: 200,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 28,
  },
  "part15.guardianZip": {
    page: 11,
    x: 442,
    y: 200,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 140,
  },
  // Guardian phone day split into 3 segments
  "part15.guardianPhoneDay.part1": {
    page: 11,
    x: 75,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianPhoneDay.part2": {
    page: 11,
    x: 150,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianPhoneDay.part3": {
    page: 11,
    x: 220,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  // Guardian phone evening split into 3 segments
  "part15.guardianPhoneEvening.part1": {
    page: 11,
    x: 330,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianPhoneEvening.part2": {
    page: 11,
    x: 400,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianPhoneEvening.part3": {
    page: 11,
    x: 470,
    y: 145,
    fontSize: 12,
    characterSpacing: 18,
  },
  "part15.guardianEmail": {
    page: 11,
    x: 75,
    y: 107,
    fontSize: 12,
    characterSpacing: 18,
    maxWidth: 530,
  },

  // PART 16: SIGNATURE (Page 13, 0-indexed: page 12)
  "part16.signatureDate": {
    page: 12,
    x: 380,
    y: 468,
    fontSize: 10,
    maxWidth: 80,
  },

  // SUPPLEMENTAL PAGES (Pages 14-18, 0-indexed: pages 13-17)
  // These pages are typically for additional information that doesn't fit in the main form
  // Common uses: Additional children, additional marriages, additional locations, etc.

  // PAGE 14 (0-indexed: page 13) - AUTHORIZATION TO RELEASE MEDICAL RECORDS
  // State Cancer Registry Authorization Form
  "medicalRelease.stateOfResidence": {
    page: 13,
    x: 340,
    y: 650,
    fontSize: 12,
    maxWidth: 250,
  },

  // 1. Name of individual whose records are to be released
  "medicalRelease.patientName": {
    page: 13,
    x: 75,
    y: 493,
    fontSize: 12,
    maxWidth: 680,
  },

  // 2. Social Security number of the individual
  "medicalRelease.patientSSN": {
    page: 13,
    x: 75,
    y: 423,
    fontSize: 12,
    maxWidth: 320,
  },

  // 3. Birth date of the individual
  "medicalRelease.patientDOB": {
    page: 13,
    x: 335,
    y: 423,
    fontSize: 12,
    maxWidth: 310,
  },

  // 4. Date of death (if applicable)
  "medicalRelease.patientDOD": {
    page: 13,
    x: 75,
    y: 368,
    fontSize: 12,
    maxWidth: 240,
  },

  // 5. Name of individual requesting release (if different)
  "medicalRelease.requesterName": {
    page: 13,
    x: 75,
    y: 287,
    fontSize: 12,
    maxWidth: 660,
  },

  // 5. Relationship to individual
  "medicalRelease.requesterRelationship": {
    page: 13,
    x: 320,
    y: 287,
    fontSize: 12,
    maxWidth: 680,
  },

  // Signature date
  "medicalRelease.signatureDate": {
    page: 13,
    x: 425,
    y: 240,
    fontSize: 12,
    maxWidth: 150,
  },

  // PAGE 15 (0-indexed: page 14) - CERTIFICATION OF IDENTITY AND PRIVACY ACT RELEASE
  // Claim number (top of page)
  "privacyRelease.claimNumber": {
    page: 14,
    x: 280,
    y: 638,
    fontSize: 12,
    maxWidth: 200,
  },

  // Section 1: Certification of Identity
  "privacyRelease.fullName": {
    page: 14,
    x: 140,
    y: 510,
    fontSize: 12,
    maxWidth: 620,
  },

  "privacyRelease.citizenshipStatus": {
    page: 14,
    x: 165,
    y: 485,
    fontSize: 12,
    maxWidth: 190,
  },

  "privacyRelease.ssn": {
    page: 14,
    x: 405,
    y: 485,
    fontSize: 12,
    maxWidth: 200,
  },

  "privacyRelease.currentAddress": {
    page: 14,
    x: 155,
    y: 460,
    fontSize: 12,
    maxWidth: 580,
  },

  "privacyRelease.dob": {
    page: 14,
    x: 140,
    y: 435,
    fontSize: 12,
    maxWidth: 210,
  },

  "privacyRelease.placeOfBirth": {
    page: 14,
    x: 355,
    y: 435,
    fontSize: 12,
    maxWidth: 280,
  },

  "privacyRelease.section1SignatureDate": {
    page: 14,
    x: 450,
    y: 343,
    fontSize: 12,
    maxWidth: 130,
  },

  // Section 2: Authorization to Release Information (OPTIONAL)
  "privacyRelease.authorizeName": {
    page: 14,
    x: 165,
    y: 215,
    fontSize: 12,
    maxWidth: 175,
  },

  "privacyRelease.authorizeRelationship": {
    page: 14,
    x: 415,
    y: 215,
    fontSize: 12,
    maxWidth: 195,
  },

  "privacyRelease.authorizePhone": {
    page: 14,
    x: 150,
    y: 190,
    fontSize: 12,
    maxWidth: 220,
  },

  "privacyRelease.authorizeAddress": {
    page: 14,
    x: 370,
    y: 190,
    fontSize: 7,
    maxWidth: 260,
  },

  "privacyRelease.section2SignatureDate": {
    page: 14,
    x: 450,
    y: 167,
    fontSize: 12,
    maxWidth: 130,
  },

  // PAGE 16 (0-indexed: page 15) - RELEASE OF TRIBAL VITAL RECORDS
  // Checkboxes for tribal enrollment offices
  "tribalRelease.navajo": {
    page: 15,
    x: 433,
    y: 645,
    type: "checkbox",
  },

  "tribalRelease.hopi": {
    page: 15,
    x: 433,
    y: 624,
    type: "checkbox",
  },

  "tribalRelease.sanCarlosApache": {
    page: 15,
    x: 433,
    y: 581,
    type: "checkbox",
  },

  "tribalRelease.otherTribe": {
    page: 15,
    x: 433,
    y: 581,
    type: "checkbox",
  },

  // Other Tribal Records Office (write-in line)
  "tribalRelease.otherTribeName": {
    page: 15,
    x: 112,
    y: 581,
    fontSize: 12,
    maxWidth: 370,
  },

  // Claimant Name
  "tribalRelease.claimantName": {
    page: 15,
    x: 235,
    y: 455,
    fontSize: 12,
    maxWidth: 310,
  },

  // Name of tribal organization (in authorization paragraph)
  "tribalRelease.tribalOrganizationName": {
    page: 15,
    x: 80,
    y: 385,
    fontSize: 12,
    maxWidth: 270,
  },

  // Date
  "tribalRelease.signatureDate": {
    page: 15,
    x: 115,
    y: 208,
    fontSize: 12,
    maxWidth: 280,
  },

  // PAGE 17 (0-indexed: page 16) - ATTACHED SIGNATURES OF ELIGIBLE SURVIVING BENEFICIARIES
  // Beneficiary 1
  "beneficiarySignatures.beneficiary1.name": {
    page: 16,
    x: 350,
    y: 562,
    fontSize: 12,
    maxWidth: 260,
  },
  "beneficiarySignatures.beneficiary1.ssn": {
    page: 16,
    x: 193,
    y: 550,
    fontSize: 12,
    maxWidth: 270,
  },
  "beneficiarySignatures.beneficiary1.date": {
    page: 16,
    x: 408,
    y: 550,
    fontSize: 12,
    maxWidth: 180,
  },
  "beneficiarySignatures.beneficiary1.attorneyName": {
    page: 16,
    x: 385,
    y: 520,
    fontSize: 12,
    maxWidth: 190,
  },
  "beneficiarySignatures.beneficiary1.phoneNumber": {
    page: 16,
    x: 150,
    y: 508,
    fontSize: 12,
    maxWidth: 155,
  },

  // Beneficiary 2
  "beneficiarySignatures.beneficiary2.name": {
    page: 16,
    x: 350,
    y: 480,
    fontSize: 12,
    maxWidth: 260,
  },
  "beneficiarySignatures.beneficiary2.ssn": {
    page: 16,
    x: 190,
    y: 468,
    fontSize: 12,
    maxWidth: 270,
  },
  "beneficiarySignatures.beneficiary2.date": {
    page: 16,
    x: 408,
    y: 468,
    fontSize: 12,
    maxWidth: 180,
  },
  "beneficiarySignatures.beneficiary2.attorneyName": {
    page: 16,
    x: 385,
    y: 440,
    fontSize: 12,
    maxWidth: 190,
  },
  "beneficiarySignatures.beneficiary2.phoneNumber": {
    page: 16,
    x: 150,
    y: 425,
    fontSize: 12,
    maxWidth: 155,
  },

  // Beneficiary 3
  "beneficiarySignatures.beneficiary3.name": {
    page: 16,
    x: 350,
    y: 397,
    fontSize: 12,
    maxWidth: 260,
  },
  "beneficiarySignatures.beneficiary3.ssn": {
    page: 16,
    x: 190,
    y: 382,
    fontSize: 12,
    maxWidth: 270,
  },
  "beneficiarySignatures.beneficiary3.date": {
    page: 16,
    x: 408,
    y: 382,
    fontSize: 12,
    maxWidth: 180,
  },
  "beneficiarySignatures.beneficiary3.attorneyName": {
    page: 16,
    x: 385,
    y: 353,
    fontSize: 12,
    maxWidth: 190,
  },
  "beneficiarySignatures.beneficiary3.phoneNumber": {
    page: 16,
    x: 150,
    y: 340,
    fontSize: 12,
    maxWidth: 155,
  },

  // Beneficiary 4
  "beneficiarySignatures.beneficiary4.name": {
    page: 16,
    x: 350,
    y: 314,
    fontSize: 12,
    maxWidth: 260,
  },
  "beneficiarySignatures.beneficiary4.ssn": {
    page: 16,
    x: 190,
    y: 300,
    fontSize: 12,
    maxWidth: 270,
  },
  "beneficiarySignatures.beneficiary4.date": {
    page: 16,
    x: 408,
    y: 300,
    fontSize: 12,
    maxWidth: 180,
  },
  "beneficiarySignatures.beneficiary4.attorneyName": {
    page: 16,
    x: 385,
    y: 272,
    fontSize: 12,
    maxWidth: 190,
  },
  "beneficiarySignatures.beneficiary4.phoneNumber": {
    page: 16,
    x: 150,
    y: 260,
    fontSize: 12,
    maxWidth: 155,
  },

  // Checkbox for additional children
  "beneficiarySignatures.additionalChildrenAttached": {
    page: 16,
    x: 74,
    y: 231,
    type: "checkbox",
  },

  // PAGE 18 (0-indexed: page 17) - Supplemental Attachment Page 5
  // TODO: Map fields based on what this page contains
  "supplement5.placeholder": {
    page: 17,
    x: 75,
    y: 700,
    fontSize: 12,
    characterSpacing: 18,
  },
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
    await this.fillPart4();
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

    // Fill supplemental forms
    await this.fillMedicalReleaseForm();
    await this.fillPrivacyReleaseForm();
    await this.fillTribalReleaseForm();
    await this.fillBeneficiarySignaturesForm();

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

    // Cast to any for optional properties not in types
    const part1Any = part1 as any;

    // Fill address fields
    this.drawText("part1.mailingAddress", part1.mailingAddress);
    this.drawText("part1.mailingAddress2", part1Any.mailingAddress2);
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
    this.drawText("part1.residenceAddress2", part1Any.residenceAddress2);

    // Fill tribal information
    this.drawText("part1.tribe", part1.tribalAffiliation);
    this.drawText("part1.censusNumber", part1.tribalCensusNumber);

    // Check tribal assistance checkboxes
    // tribalAssistance is stored as an array of strings in the types
    if (part1Any.tribalAssistance) {
      if (Array.isArray(part1Any.tribalAssistance)) {
        // Handle array format
        if (part1Any.tribalAssistance.includes("navajo")) {
          this.drawCheckbox("part1.tribalAssistance.navajo");
        }
        if (part1Any.tribalAssistance.includes("other")) {
          this.drawCheckbox("part1.tribalAssistance.other");
          if (part1Any.tribalAssistanceOther) {
            this.drawText(
              "part1.tribalAssistance.otherName",
              part1Any.tribalAssistanceOther
            );
          }
        }
        if (part1Any.tribalAssistance.includes("no")) {
          this.drawCheckbox("part1.tribalAssistance.no");
        }
      } else {
        // Handle string format
        if (part1Any.tribalAssistance === "navajo") {
          this.drawCheckbox("part1.tribalAssistance.navajo");
        } else if (part1Any.tribalAssistance === "other") {
          this.drawCheckbox("part1.tribalAssistance.other");
          if (part1Any.tribalAssistanceOther) {
            this.drawText(
              "part1.tribalAssistance.otherName",
              part1Any.tribalAssistanceOther
            );
          }
        } else if (part1Any.tribalAssistance === "no") {
          this.drawCheckbox("part1.tribalAssistance.no");
        }
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

    const part3 = this.formData.part_3 as any;
    const relationship = part3.relationship;

    const checkboxMap: Record<string, string> = {
      Self: "part3.self",
      Spouse: "part3.spouse",
      Child: "part3.child",
      Parent: "part3.parent",
      Grandchild: "part3.grandchild",
      Grandparent: "part3.grandparent",
      // Also support lowercase for backwards compatibility
      self: "part3.self",
      spouse: "part3.spouse",
      child: "part3.child",
      parent: "part3.parent",
      grandchild: "part3.grandchild",
      grandparent: "part3.grandparent",
    };

    // Test mode: mark all checkboxes for calibration
    if (part3.testAllCheckboxes) {
      Object.values(checkboxMap).forEach((checkboxKey) => {
        this.drawCheckbox(checkboxKey);
      });
      return;
    }

    // Normal mode: mark only the selected relationship
    if (relationship && checkboxMap[relationship]) {
      this.drawCheckbox(checkboxMap[relationship]);
    }
  }

  private async fillPart4() {
    if (!this.formData.part_4) return;

    const part4 = this.formData.part_4 as any;

    // Self-filer document checkboxes
    if (part4.birthCertificate) {
      this.drawCheckbox("part4.birthCertificate");
    }
    if (part4.marriageCertificates) {
      this.drawCheckbox("part4.marriageCertificates");
    }
  }

  private async fillPart5() {
    if (!this.formData.part_5) return;

    const part5 = this.formData.part_5;

    // Question checkboxes
    if (part5.claimantDeceased === "YES") {
      this.drawCheckbox("part5.claimantDeceased.yes");
    } else if (part5.claimantDeceased === "NO") {
      this.drawCheckbox("part5.claimantDeceased.no");
    }

    if (part5.marriedOneYear === "YES") {
      this.drawCheckbox("part5.marriedOneYear.yes");
    } else if (part5.marriedOneYear === "NO") {
      this.drawCheckbox("part5.marriedOneYear.no");
    }

    if (part5.claimantPreviousMarriages === "YES") {
      this.drawCheckbox("part5.claimantPreviousMarriages.yes");

      // Fill in claimant's previous spouses
      if (
        part5.claimantPreviousSpouses &&
        Array.isArray(part5.claimantPreviousSpouses)
      ) {
        part5.claimantPreviousSpouses.forEach((spouse, index) => {
          if (index < 2) {
            // We have 2 lines for previous spouses
            const lineNum = index + 1;
            const text = `${spouse.spouseName} - ${spouse.marriageStart} to ${spouse.marriageEnd}`;
            this.drawText(`part5.claimantPreviousSpouse${lineNum}`, text);
          }
        });
      }
    } else if (part5.claimantPreviousMarriages === "NO") {
      this.drawCheckbox("part5.claimantPreviousMarriages.no");
    }

    if (part5.filerOtherMarriages === "YES") {
      this.drawCheckbox("part5.filerOtherMarriages.yes");

      // Fill in filer's other spouses
      if (part5.filerOtherSpouses && Array.isArray(part5.filerOtherSpouses)) {
        part5.filerOtherSpouses.forEach((spouse, index) => {
          if (index < 4) {
            // We have 4 lines for filer's other spouses
            const lineNum = index + 1;
            const text = `${spouse.spouseName} - ${spouse.marriageStart} to ${spouse.marriageEnd}`;
            this.drawText(`part5.filerOtherSpouse${lineNum}`, text);
          }
        });
      }
    } else if (part5.filerOtherMarriages === "NO") {
      this.drawCheckbox("part5.filerOtherMarriages.no");
    }

    // Document requirement checkboxes (Page 4)
    const part5Any = part5 as any;
    if (part5Any.birthCertificateClaimant) {
      this.drawCheckbox("part5.birthCertificateClaimant");
    }
    if (part5Any.deathCertificate) {
      this.drawCheckbox("part5.deathCertificate");
    }
    if (part5Any.marriageCertificate) {
      this.drawCheckbox("part5.marriageCertificate");
    }
    if (part5Any.marriageCertificatesPrevious) {
      this.drawCheckbox("part5.marriageCertificatesPrevious");
    }
    if (part5Any.divorceDecreesPrevious) {
      this.drawCheckbox("part5.divorceDecreesPrevious");
    }
    if (part5Any.birthCertificateFiler) {
      this.drawCheckbox("part5.birthCertificateFiler");
    }
    if (part5Any.marriageCertificatesFiler) {
      this.drawCheckbox("part5.marriageCertificatesFiler");
    }
    if (part5Any.divorceDecreesFiler) {
      this.drawCheckbox("part5.divorceDecreesFiler");
    }
  }

  private async fillPart6() {
    if (!this.formData.part_6) return;

    const part6 = this.formData.part_6;

    // Question checkboxes
    if (part6.claimantDeceased === "YES") {
      this.drawCheckbox("part6.claimantDeceased.yes");
    } else if (part6.claimantDeceased === "NO") {
      this.drawCheckbox("part6.claimantDeceased.no");
    }

    if (part6.claimantEverMarried === "YES") {
      this.drawCheckbox("part6.claimantEverMarried.yes");
    } else if (part6.claimantEverMarried === "NO") {
      this.drawCheckbox("part6.claimantEverMarried.no");
    }

    // Child type checkboxes
    if (part6.childType === "NATURAL") {
      this.drawCheckbox("part6.childType.natural");
    } else if (part6.childType === "ADOPTED CHILD") {
      this.drawCheckbox("part6.childType.adopted");
    } else if (part6.childType === "STEP-CHILD") {
      this.drawCheckbox("part6.childType.stepChild");
    }

    // Other children checkbox
    if (part6.otherChildrenExist === "YES") {
      this.drawCheckbox("part6.otherChildren.yes");
    } else if (part6.otherChildrenExist === "NO") {
      this.drawCheckbox("part6.otherChildren.no");
    }

    // Spouse information (Page 4, top section for surviving child)
    const part6Any = part6 as any;
    if (part6Any.spouseInfo && Array.isArray(part6Any.spouseInfo)) {
      part6Any.spouseInfo.forEach((spouse: any, index: number) => {
        if (index < 3) {
          const lineNum = index + 1;
          const text = `${spouse.name} - Married: ${spouse.marriageDate} to ${spouse.endDate || "present"}`;
          this.drawText(`part6.spouseInfo${lineNum}`, text);
        }
      });
    }

    // Children information (Page 5, detailed fields)
    if (part6Any.children && Array.isArray(part6Any.children)) {
      part6Any.children.forEach((child: any, index: number) => {
        if (index < 3) {
          const childNum = index + 1;
          // Child name and birth info
          this.drawText(`part6.child${childNum}.name`, child.name);
          this.drawText(`part6.child${childNum}.birthDate`, child.birthDate);
          this.drawText(`part6.child${childNum}.birthPlace`, child.birthPlace);

          // Living child: phone and address
          if (child.isLiving) {
            this.drawText(`part6.child${childNum}.phone`, child.phone);
            this.drawText(`part6.child${childNum}.address`, child.address);
          } else {
            // Deceased child: death date and place
            this.drawText(`part6.child${childNum}.deathDate`, child.deathDate);
            this.drawText(
              `part6.child${childNum}.deathPlace`,
              child.deathPlace
            );
          }
        }
      });
    }

    // Additional children checkbox (if more than 3 children, supplemental attachment required)
    if (part6Any.additionalChildrenAttached) {
      this.drawCheckbox("part6.additionalChildrenAttached");
    }

    // Add notation if there are more than 3 siblings
    if (
      part6.siblings &&
      part6.siblings.length > 3 &&
      this.pdfPages &&
      this.pdfPages.length > 0
    ) {
      const additionalCount = part6.siblings.length - 3;
      const notationText = `See Supplemental Sibling Information Document (${additionalCount} additional sibling${additionalCount > 1 ? "s" : ""})`;

      // Draw text overlay on the appropriate page/location
      // This will appear near the sibling section to alert DOJ reviewers
      // Coordinates may need adjustment based on actual PDF layout
      const pageIndex = Math.min(4, this.pdfPages.length - 1); // Use page 5 or last available page
      const targetPage = this.pdfPages[pageIndex];
      if (targetPage) {
        try {
          targetPage.drawText(notationText, {
            x: 70,
            y: 350, // Adjust Y coordinate as needed based on actual form layout
            size: 9,
            font: this.font,
            color: rgb(0, 0, 0),
          });
        } catch (error) {
          console.warn(
            "Could not add sibling overflow notation to PDF:",
            error
          );
        }
      }
    }

    // Document requirement checkboxes (Page 5)
    if (part6Any.birthCertificateClaimant) {
      this.drawCheckbox("part6.birthCertificateClaimant");
    }
    if (part6Any.deathCertificate) {
      this.drawCheckbox("part6.deathCertificate");
    }
    if (part6Any.marriageCertificates) {
      this.drawCheckbox("part6.marriageCertificates");
    }
    if (part6Any.divorceDecrees) {
      this.drawCheckbox("part6.divorceDecrees");
    }
    if (part6Any.birthCertificateFiler) {
      this.drawCheckbox("part6.birthCertificateFiler");
    }
    if (part6Any.marriageCertificatesFiler) {
      this.drawCheckbox("part6.marriageCertificatesFiler");
    }
    if (part6Any.stepChildProof) {
      this.drawCheckbox("part6.stepChildProof");
    }
    if (part6Any.siblingDeathCertificates) {
      this.drawCheckbox("part6.siblingDeathCertificates");
    }
  }

  private async fillPart7() {
    if (!this.formData.part_7) return;

    const part7 = this.formData.part_7;

    // Relationship type checkboxes
    if (part7.relationshipType === "PARENT") {
      this.drawCheckbox("part7.parent");
    } else if (part7.relationshipType === "GRANDCHILD") {
      this.drawCheckbox("part7.grandchild");
    } else if (part7.relationshipType === "GRANDPARENT") {
      this.drawCheckbox("part7.grandparent");
    }
  }

  private async fillPart8() {
    if (!this.formData.part_8) return;

    const part8 = this.formData.part_8;

    // Check exposure options (user can select multiple)
    if (part8.exposureOptions && Array.isArray(part8.exposureOptions)) {
      if (part8.exposureOptions.includes("option_1a")) {
        this.drawCheckbox("part8.option1a");
      }
      if (part8.exposureOptions.includes("option_1b")) {
        this.drawCheckbox("part8.option1b");
      }
      if (part8.exposureOptions.includes("option_2")) {
        this.drawCheckbox("part8.option2");
      }
    }

    // Fill affected areas (Idaho, New Mexico, Utah)
    if (part8.affectedAreas && Array.isArray(part8.affectedAreas)) {
      part8.affectedAreas.forEach((area, index) => {
        const stateKey = area.state.toLowerCase().replace(/\s+/g, "");
        if (index === 0) {
          // First entry for each state
          this.drawText(`part8.${stateKey}.townCity`, area.townCity);
          this.drawText(`part8.${stateKey}.timePeriod`, area.timePeriod);
        }
      });
    }

    // Fill Arizona counties
    if (part8.arizonaCounties && Array.isArray(part8.arizonaCounties)) {
      part8.arizonaCounties.forEach((county, index) => {
        const countyKey = county.county.toLowerCase().replace(/\s+/g, "");
        if (index === 0) {
          // First entry for each county
          this.drawText(`part8.arizona.${countyKey}.townCity`, county.townCity);
          this.drawText(
            `part8.arizona.${countyKey}.timePeriod`,
            county.timePeriod
          );
        }
      });
    }

    // Fill Nevada counties
    if (part8.nevadaCounties && Array.isArray(part8.nevadaCounties)) {
      part8.nevadaCounties.forEach((county, index) => {
        // Convert "White Pine" -> "whitePine", "Nye" -> "nye", etc.
        const countyKey = county.county
          .split(" ")
          .map((word, i) => {
            if (i === 0) {
              return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join("");

        if (index === 0) {
          // First entry for each county
          this.drawText(`part8.nevada.${countyKey}.townCity`, county.townCity);
          this.drawText(
            `part8.nevada.${countyKey}.timePeriod`,
            county.timePeriod
          );
        }
      });
    }
  }

  private async fillPart9() {
    if (!this.formData.part_9) return;

    const part9 = this.formData.part_9 as any;

    // Checkbox for Church of LDS contact
    if (part9.contactedChurchLDS) {
      this.drawCheckbox("part9.contactedChurchLDS");
    }
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
    if (!this.formData.part_11) return;

    const part11 = this.formData.part_11;

    // Checkboxes
    if (part11.medicalRecordsSubmitted) {
      this.drawCheckbox("part11.submittedMedicalRecords");
    }

    if (part11.cancerRegistryAuthorization) {
      this.drawCheckbox("part11.cancerRegistryAuthorization");
    }

    if (part11.resepAssistance === "YES") {
      this.drawCheckbox("part11.resepAssistance.yes");
      this.drawText("part11.resepClinicName", part11.resepClinicName);
    } else if (part11.resepAssistance === "NO") {
      this.drawCheckbox("part11.resepAssistance.no");
    }
  }

  private async fillPart12() {
    if (!this.formData.part_12) return;

    const part12 = this.formData.part_12;

    if (part12.receivedPayment === "YES") {
      this.drawCheckbox("part12.receivedPayment.yes");
    } else if (part12.receivedPayment === "NO") {
      this.drawCheckbox("part12.receivedPayment.no");
    }

    if (part12.eeoicpaClaim === "YES") {
      this.drawCheckbox("part12.eeoicpaClaim.yes");
    } else if (part12.eeoicpaClaim === "NO") {
      this.drawCheckbox("part12.eeoicpaClaim.no");
    }
  }

  private async fillPart13() {
    if (!this.formData.part_13) return;

    const part13 = this.formData.part_13;

    if (part13.hasAttorney === "YES") {
      this.drawCheckbox("part13.hasAttorney.yes");

      // Fill attorney information
      this.drawText("part13.attorneyFirstName", part13.attorneyFirstName);
      this.drawText("part13.attorneyLastName", part13.attorneyLastName);

      // Handle attorney firm name with automatic line breaking at x: 520
      if (part13.attorneyFirm) {
        const firmCoords = FIELD_COORDINATES["part13.attorneyFirm"];
        const charSpacing = firmCoords?.characterSpacing;
        const maxWidth = firmCoords?.maxWidth ?? 445;

        if (charSpacing && charSpacing > 0) {
          // Calculate characters that fit: maxWidth / characterSpacing
          // With characterSpacing of 18 and maxWidth 445: 445/18 = ~24 characters
          const charsPerLine = Math.floor(maxWidth / charSpacing);

          if (part13.attorneyFirm.length <= charsPerLine) {
            // Fits on one line
            this.drawText("part13.attorneyFirm", part13.attorneyFirm);
          } else {
            // Need to split across two lines
            // Find the last space before the character limit
            let splitIndex = part13.attorneyFirm.lastIndexOf(" ", charsPerLine);
            if (splitIndex === -1) {
              // No space found, force break at character limit
              splitIndex = charsPerLine;
            }

            const line1 = part13.attorneyFirm.substring(0, splitIndex).trim();
            const line2 = part13.attorneyFirm.substring(splitIndex).trim();

            this.drawText("part13.attorneyFirm", line1);
            this.drawText("part13.attorneyFirm2", line2);
          }
        } else {
          this.drawText("part13.attorneyFirm", part13.attorneyFirm);
        }
      }

      this.drawText("part13.attorneyAddress", part13.attorneyAddress);
      this.drawText("part13.attorneyCity", part13.attorneyCity);
      this.drawText("part13.attorneyState", part13.attorneyState);
      this.drawText("part13.attorneyZip", part13.attorneyZip);
      this.drawPhone("part13.attorneyPhone", part13.attorneyPhone);
      this.drawPhone("part13.attorneyFax", part13.attorneyFax);
      this.drawText("part13.attorneyEmail", part13.attorneyEmail);
    } else if (part13.hasAttorney === "NO") {
      this.drawCheckbox("part13.hasAttorney.no");
    }
  }

  private async fillPart14() {
    if (!this.formData.part_14) return;

    const part14 = this.formData.part_14;

    if (part14.feeType === "initial_2_percent") {
      this.drawCheckbox("part14.feeType.initial2Percent");
    } else if (part14.feeType === "resubmission_10_percent") {
      this.drawCheckbox("part14.feeType.resubmission10Percent");
    }

    this.drawText("part14.signatureDate", part14.attorneySignatureDate);
  }

  private async fillPart15() {
    if (!this.formData.part_15) return;

    const part15 = this.formData.part_15;

    // Fill guardian information
    this.drawText("part15.guardianFirstName", part15.guardianFirstName);
    this.drawText("part15.guardianMiddleName", part15.guardianMiddleName);
    this.drawText("part15.guardianLastName", part15.guardianLastName);

    // Handle guardian address with automatic line breaking at x: 520
    if (part15.guardianAddress) {
      const addressCoords = FIELD_COORDINATES["part15.guardianAddress"];
      const charSpacing = addressCoords?.characterSpacing;
      const maxWidth = addressCoords?.maxWidth ?? 445;

      if (charSpacing && charSpacing > 0) {
        // Calculate characters that fit: maxWidth / characterSpacing
        // With characterSpacing of 18 and maxWidth 445: 445/18 = ~24 characters
        const charsPerLine = Math.floor(maxWidth / charSpacing);

        if (part15.guardianAddress.length <= charsPerLine) {
          // Fits on one line
          this.drawText("part15.guardianAddress", part15.guardianAddress);
        } else {
          // Need to split across two lines
          // Find the last space before the character limit
          let splitIndex = part15.guardianAddress.lastIndexOf(
            " ",
            charsPerLine
          );
          if (splitIndex === -1) {
            // No space found, force break at character limit
            splitIndex = charsPerLine;
          }

          const line1 = part15.guardianAddress.substring(0, splitIndex).trim();
          const line2 = part15.guardianAddress.substring(splitIndex).trim();

          this.drawText("part15.guardianAddress", line1);
          this.drawText("part15.guardianAddress2", line2);
        }
      } else {
        this.drawText("part15.guardianAddress", part15.guardianAddress);
      }
    }

    this.drawText("part15.guardianCity", part15.guardianCity);
    this.drawText("part15.guardianState", part15.guardianState);
    this.drawText("part15.guardianZip", part15.guardianZip);
    this.drawPhone("part15.guardianPhoneDay", part15.guardianPhoneDay);
    this.drawPhone("part15.guardianPhoneEvening", part15.guardianPhoneEvening);
    this.drawText("part15.guardianEmail", part15.guardianEmail);
  }

  private async fillPart16() {
    if (!this.formData.part_16) return;

    const part16 = this.formData.part_16;

    // Fill signature date (signature itself is manual)
    if (part16.signatureDate) {
      this.drawText("part16.signatureDate", part16.signatureDate);
    }
  }

  private async fillMedicalReleaseForm() {
    const medicalRelease = this.supportingForms.medicalInformationRelease;
    if (!medicalRelease) return;

    // State of residence at time of diagnosis
    this.drawText(
      "medicalRelease.stateOfResidence",
      medicalRelease.stateOfResidence
    );

    // 1. Name of individual whose records are to be released
    this.drawText("medicalRelease.patientName", medicalRelease.patientName);

    // 2. Social Security number
    this.drawText("medicalRelease.patientSSN", medicalRelease.patientSsn);

    // 3. Birth date
    this.drawText("medicalRelease.patientDOB", medicalRelease.patientDob);

    // 4. Date of death (if applicable)
    if (medicalRelease.patientDod) {
      this.drawText("medicalRelease.patientDOD", medicalRelease.patientDod);
    }

    // 5. Name of individual requesting release (if different)
    if (medicalRelease.requestorName) {
      this.drawText(
        "medicalRelease.requesterName",
        medicalRelease.requestorName
      );
    }

    // 5. Relationship to individual
    if (medicalRelease.requestorRelationship) {
      this.drawText(
        "medicalRelease.requesterRelationship",
        medicalRelease.requestorRelationship
      );
    }

    // Signature date
    this.drawText("medicalRelease.signatureDate", medicalRelease.signatureDate);
  }

  private async fillPrivacyReleaseForm() {
    const privacyRelease = this.supportingForms.certificationOfIdentity;
    if (!privacyRelease) return;

    // Claim number
    if (privacyRelease.claimNumber) {
      this.drawText("privacyRelease.claimNumber", privacyRelease.claimNumber);
    }

    // Section 1: Certification of Identity
    this.drawText("privacyRelease.fullName", privacyRelease.fullName);
    this.drawText(
      "privacyRelease.citizenshipStatus",
      privacyRelease.citizenshipStatus
    );
    this.drawText("privacyRelease.ssn", privacyRelease.ssn);
    this.drawText(
      "privacyRelease.currentAddress",
      privacyRelease.currentAddress
    );
    this.drawText("privacyRelease.dob", privacyRelease.dob);
    this.drawText("privacyRelease.placeOfBirth", privacyRelease.placeOfBirth);
    this.drawText(
      "privacyRelease.section1SignatureDate",
      privacyRelease.signatureDate
    );

    // Section 2: Authorization to Release Information (OPTIONAL)
    if (privacyRelease.authorizedPersonName) {
      this.drawText(
        "privacyRelease.authorizeName",
        privacyRelease.authorizedPersonName
      );
    }
    if (privacyRelease.relationshipToRequester) {
      this.drawText(
        "privacyRelease.authorizeRelationship",
        privacyRelease.relationshipToRequester
      );
    }
    if (privacyRelease.authorizedPhoneNumber) {
      this.drawText(
        "privacyRelease.authorizePhone",
        privacyRelease.authorizedPhoneNumber
      );
    }
    if (privacyRelease.authorizedCurrentAddress) {
      this.drawText(
        "privacyRelease.authorizeAddress",
        privacyRelease.authorizedCurrentAddress
      );
    }
    if (privacyRelease.authorizedSignatureDate) {
      this.drawText(
        "privacyRelease.section2SignatureDate",
        privacyRelease.authorizedSignatureDate
      );
    }
  }

  private async fillTribalReleaseForm() {
    const tribalRelease = this.supportingForms.tribalRecordsRelease;
    if (!tribalRelease) return;

    // Tribal office checkboxes
    if (
      tribalRelease.tribalOffice === "Navajo Nation Office of Vital Records"
    ) {
      this.drawCheckbox("tribalRelease.navajo");
    } else if (
      tribalRelease.tribalOffice === "Hopi Tribe Enrollment Department"
    ) {
      this.drawCheckbox("tribalRelease.hopi");
    } else if (
      tribalRelease.tribalOffice ===
      "San Carlos Apache Tribal Enrollment Office"
    ) {
      this.drawCheckbox("tribalRelease.sanCarlosApache");
    } else if (tribalRelease.tribalOffice === "Other") {
      this.drawCheckbox("tribalRelease.otherTribe");
      if (tribalRelease.otherTribalOffice) {
        this.drawText(
          "tribalRelease.otherTribeName",
          tribalRelease.otherTribalOffice
        );
      }
    }

    // Claimant name
    this.drawText("tribalRelease.claimantName", tribalRelease.claimantName);

    // Tribal organization name (in authorization text)
    if (tribalRelease.tribalOrganizationName) {
      this.drawText(
        "tribalRelease.tribalOrganizationName",
        tribalRelease.tribalOrganizationName
      );
    }

    // Signature date
    this.drawText("tribalRelease.signatureDate", tribalRelease.signatureDate);
  }

  private async fillBeneficiarySignaturesForm() {
    const beneficiarySignatures =
      this.supportingForms.survivingBeneficiariesSignatures;
    if (!beneficiarySignatures) return;

    // Fill beneficiary 1
    const ben1 = beneficiarySignatures.beneficiaries?.[0];
    if (ben1) {
      this.drawText(
        "beneficiarySignatures.beneficiary1.name",
        ben1.beneficiaryName
      );
      this.drawText(
        "beneficiarySignatures.beneficiary1.ssn",
        ben1.beneficiarySsn
      );
      this.drawText(
        "beneficiarySignatures.beneficiary1.date",
        ben1.signatureDate
      );
      if (ben1.attorneyName) {
        this.drawText(
          "beneficiarySignatures.beneficiary1.attorneyName",
          ben1.attorneyName
        );
      }
      if (ben1.attorneyPhone) {
        this.drawText(
          "beneficiarySignatures.beneficiary1.phoneNumber",
          ben1.attorneyPhone
        );
      }
    }

    // Fill beneficiary 2
    const ben2 = beneficiarySignatures.beneficiaries?.[1];
    if (ben2) {
      this.drawText(
        "beneficiarySignatures.beneficiary2.name",
        ben2.beneficiaryName
      );
      this.drawText(
        "beneficiarySignatures.beneficiary2.ssn",
        ben2.beneficiarySsn
      );
      this.drawText(
        "beneficiarySignatures.beneficiary2.date",
        ben2.signatureDate
      );
      if (ben2.attorneyName) {
        this.drawText(
          "beneficiarySignatures.beneficiary2.attorneyName",
          ben2.attorneyName
        );
      }
      if (ben2.attorneyPhone) {
        this.drawText(
          "beneficiarySignatures.beneficiary2.phoneNumber",
          ben2.attorneyPhone
        );
      }
    }

    // Fill beneficiary 3
    const ben3 = beneficiarySignatures.beneficiaries?.[2];
    if (ben3) {
      this.drawText(
        "beneficiarySignatures.beneficiary3.name",
        ben3.beneficiaryName
      );
      this.drawText(
        "beneficiarySignatures.beneficiary3.ssn",
        ben3.beneficiarySsn
      );
      this.drawText(
        "beneficiarySignatures.beneficiary3.date",
        ben3.signatureDate
      );
      if (ben3.attorneyName) {
        this.drawText(
          "beneficiarySignatures.beneficiary3.attorneyName",
          ben3.attorneyName
        );
      }
      if (ben3.attorneyPhone) {
        this.drawText(
          "beneficiarySignatures.beneficiary3.phoneNumber",
          ben3.attorneyPhone
        );
      }
    }

    // Fill beneficiary 4
    const ben4 = beneficiarySignatures.beneficiaries?.[3];
    if (ben4) {
      this.drawText(
        "beneficiarySignatures.beneficiary4.name",
        ben4.beneficiaryName
      );
      this.drawText(
        "beneficiarySignatures.beneficiary4.ssn",
        ben4.beneficiarySsn
      );
      this.drawText(
        "beneficiarySignatures.beneficiary4.date",
        ben4.signatureDate
      );
      if (ben4.attorneyName) {
        this.drawText(
          "beneficiarySignatures.beneficiary4.attorneyName",
          ben4.attorneyName
        );
      }
      if (ben4.attorneyPhone) {
        this.drawText(
          "beneficiarySignatures.beneficiary4.phoneNumber",
          ben4.attorneyPhone
        );
      }
    }

    // Additional children checkbox
    if (beneficiarySignatures.additionalChildrenAttached) {
      this.drawCheckbox("beneficiarySignatures.additionalChildrenAttached");
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

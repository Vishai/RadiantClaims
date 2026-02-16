/**
 * Coversheet / Index PDF Generator
 *
 * Generates a one-page PDF listing:
 * - Claimant info
 * - Packet contents (forms + documents)
 * - Where each document maps to in the DOJ portal
 *
 * Intended as the first page of the packet ZIP — a quick reference
 * for users filing through the DOJ portal or mailing.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import type { RECAFormData } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoversheetFile {
  filename: string;
  category: string | null;
  sizeBytes: number;
}

interface CoversheetOptions {
  sessionId: string;
  formData: Partial<RECAFormData>;
  files: CoversheetFile[];
  generatedAt?: Date;
}

// ---------------------------------------------------------------------------
// DOJ portal tab mapping for document categories
// ---------------------------------------------------------------------------

const CATEGORY_TO_DOJ_TAB: Record<string, string> = {
  // Identity docs
  IDENTITY: "Tab 2: Identification Documentation",
  BIRTH_CERTIFICATE: "Tab 2: Identification Documentation",
  MARRIAGE_CERTIFICATE: "Tab 2: Identification Documentation",
  DIVORCE_DECREE: "Tab 2: Identification Documentation",

  // Residence / presence docs
  UTILITY_BILL: "Tab 4: Proof of Presence",
  SCHOOL_RECORDS: "Tab 4: Proof of Presence",
  MORTGAGE_STATEMENT: "Tab 4: Proof of Presence",
  PROPERTY_RECORDS: "Tab 4: Proof of Presence",
  TAX_RETURN: "Tab 4: Proof of Presence",
  EMPLOYMENT_RECORDS: "Tab 4: Proof of Presence",
  LDS_CHURCH_RECORDS: "Tab 4: Proof of Presence",
  PROOF_OF_RESIDENCE: "Tab 4: Proof of Presence",
  VOTING_RECORDS: "Tab 4: Proof of Presence",
  CENSUS_RECORDS: "Tab 4: Proof of Presence",
  CHURCH_RECORDS: "Tab 4: Proof of Presence",

  // Medical docs
  PATHOLOGY_REPORT: "Tab 5: Compensable and Proof of Disease",
  MEDICAL_RECORDS: "Tab 5: Compensable and Proof of Disease",
  DISCHARGE_SUMMARY: "Tab 5: Compensable and Proof of Disease",
  TREATMENT_RECORDS: "Tab 5: Compensable and Proof of Disease",
  DEATH_CERTIFICATE: "Tab 5: Compensable and Proof of Disease",

  // Other
  OTHER: "See notes",
};

function getDOJTab(category: string | null): string {
  if (!category) return "Uncategorized";
  return CATEGORY_TO_DOJ_TAB[category] ?? "See notes";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateCoversheetPDF(
  options: CoversheetOptions
): Promise<Uint8Array> {
  const { sessionId, formData, files, generatedAt = new Date() } = options;
  const p1 = formData.part_1;
  const claimantName = p1
    ? `${p1.firstName ?? ""} ${p1.middleName ?? ""} ${p1.lastName ?? ""}`
        .replace(/\s+/g, " ")
        .trim()
    : "Unknown";

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612; // US Letter
  const H = 792;
  const M = 50; // margin
  let page = doc.addPage([W, H]);
  let y = H - M;

  // ── Helpers ──

  function drawText(
    text: string,
    x: number,
    yPos: number,
    f: PDFFont,
    size: number,
    color = rgb(0, 0, 0)
  ) {
    page.drawText(text, { x, y: yPos, font: f, size, color });
  }

  function drawLine(yPos: number) {
    page.drawLine({
      start: { x: M, y: yPos },
      end: { x: W - M, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  function checkNewPage() {
    if (y < M + 40) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  }

  // ── Header ──

  drawText("RECA Claim Packet — Coversheet & Index", M, y, bold, 14);
  y -= 20;
  drawText("Prepared by RadiantClaims", M, y, font, 9, rgb(0.5, 0.5, 0.5));
  drawText(
    generatedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    W - M - 120,
    y,
    font,
    9,
    rgb(0.5, 0.5, 0.5)
  );
  y -= 12;
  drawLine(y);
  y -= 20;

  // ── Claimant Info ──

  drawText("Claimant Information", M, y, bold, 11);
  y -= 16;

  const infoRows: [string, string][] = [
    ["Name", claimantName],
    [
      "Date of Birth",
      p1?.dob ? new Date(p1.dob).toLocaleDateString("en-US") : "—",
    ],
    ["Claim Type", "Downwinder (Self-Filer)"],
    ["Session ID", sessionId.slice(0, 12) + "…"],
  ];

  if (p1?.city && p1?.state) {
    infoRows.push(["Location", `${p1.city}, ${p1.state} ${p1.zipCode ?? ""}`]);
  }

  for (const [label, value] of infoRows) {
    drawText(`${label}:`, M + 4, y, bold, 9);
    drawText(value, M + 110, y, font, 9);
    y -= 14;
  }

  y -= 8;
  drawLine(y);
  y -= 20;

  // ── Forms Included ──

  drawText("Forms Included", M, y, bold, 11);
  y -= 16;

  const formsList = [
    "RECA-Downwinder-*.pdf — Pre-filled official RECA claim form (reference copy)",
    "RadiantClaims-Summary-*.pdf — Complete data summary of your answers",
    "Coversheet-Index-*.pdf — This document",
  ];

  for (const item of formsList) {
    drawText(`•  ${item}`, M + 4, y, font, 8.5);
    y -= 13;
  }

  y -= 8;
  drawLine(y);
  y -= 20;

  // ── Documents Table ──

  drawText("Supporting Documents", M, y, bold, 11);
  y -= 6;
  drawText(
    "Upload each document to the matching DOJ portal tab shown below.",
    M,
    y,
    font,
    8,
    rgb(0.45, 0.45, 0.45)
  );
  y -= 16;

  // Table header
  const col1 = M + 4;
  const col2 = M + 220;
  const col3 = M + 400;

  drawText("Document", col1, y, bold, 8.5);
  drawText("DOJ Portal Upload Tab", col2, y, bold, 8.5);
  drawText("Size", col3, y, bold, 8.5);
  y -= 4;
  drawLine(y);
  y -= 12;

  if (files.length === 0) {
    drawText(
      "No supporting documents uploaded yet.",
      col1,
      y,
      font,
      8.5,
      rgb(0.6, 0.3, 0.3)
    );
    y -= 14;
  } else {
    for (const file of files) {
      checkNewPage();

      // Truncate long filenames
      let displayName = file.filename;
      if (displayName.length > 35) {
        displayName = displayName.slice(0, 32) + "…";
      }

      drawText(displayName, col1, y, font, 8);
      drawText(getDOJTab(file.category), col2, y, font, 8);
      drawText(formatBytes(file.sizeBytes), col3, y, font, 8);
      y -= 13;
    }
  }

  y -= 8;
  drawLine(y);
  y -= 20;

  // ── Filing Instructions ──

  checkNewPage();
  drawText("Filing Instructions", M, y, bold, 11);
  y -= 16;

  const instructions = [
    "Option A — File Online (Recommended):",
    "  1. Go to https://reca.justice.gov/ and log in or create an account",
    "  2. Start a new claim and select your claim category (Downwinder)",
    '  3. Use the "DOJ Portal Answer Sheet" in RadiantClaims to copy your answers',
    "  4. Upload your supporting documents to the matching portal tabs listed above",
    '  5. Review and click "Submit My Claim"',
    "",
    "Option B — File by Mail:",
    "  1. Print the pre-filled RECA form PDF from this packet",
    "  2. Include original or certified copies of your supporting documents",
    "  3. Mail to: DOJ, RECA Program, P.O. Box 146, Ben Franklin Station,",
    "     Washington, DC 20044-0146",
    "",
    "Important: All claims must be filed by December 31, 2027.",
    "DOJ may request original/certified documents after e-filing to validate authenticity.",
  ];

  for (const line of instructions) {
    checkNewPage();
    const isBold = line.startsWith("Option") || line.startsWith("Important:");
    drawText(line, M + 4, y, isBold ? bold : font, 8.5);
    y -= line === "" ? 8 : 13;
  }

  // ── Footer ──

  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = doc.getPage(i);
    p.drawText(
      `RadiantClaims — radiantclaims.com — Page ${i + 1} of ${totalPages}`,
      {
        x: M,
        y: 25,
        font,
        size: 7,
        color: rgb(0.6, 0.6, 0.6),
      }
    );
  }

  return doc.save();
}

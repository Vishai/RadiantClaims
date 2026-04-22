/**
 * PDF Coordinate Calibration Tool
 *
 * This script helps you find the exact coordinates for form fields
 * by overlaying a grid on the PDF pages
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

async function addGridToPDF() {
  console.log("📐 Creating calibration grid PDF...\n");

  try {
    // Load the official PDF
    const officialPdfPath = path.join(
      process.cwd(),
      "docs",
      "RECA Downwinder Claim Form.pdf"
    );
    const pdfBytes = fs.readFileSync(officialPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    // Add grid to first 3 pages only (for performance)
    const pagesToCalibrate = Math.min(3, pages.length);

    for (let pageIndex = 0; pageIndex < pagesToCalibrate; pageIndex++) {
      const page = pages[pageIndex];
      if (!page) {
        console.warn(`Skipping page ${pageIndex + 1}: missing in source PDF`);
        continue;
      }

      // Draw vertical lines every 50 points with labels
      for (let x = 0; x <= PAGE_WIDTH; x += 50) {
        // Draw line
        page.drawLine({
          start: { x, y: 0 },
          end: { x, y: PAGE_HEIGHT },
          thickness: x % 100 === 0 ? 1 : 0.5,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.5,
        });

        // Add label every 100 points
        if (x % 100 === 0) {
          page.drawText(`${x}`, {
            x: x - 10,
            y: PAGE_HEIGHT - 20,
            size: 8,
            font,
            color: rgb(1, 0, 0),
          });
          page.drawText(`${x}`, {
            x: x - 10,
            y: 10,
            size: 8,
            font,
            color: rgb(1, 0, 0),
          });
        }
      }

      // Draw horizontal lines every 50 points with labels
      for (let y = 0; y <= PAGE_HEIGHT; y += 50) {
        // Draw line
        page.drawLine({
          start: { x: 0, y },
          end: { x: PAGE_WIDTH, y },
          thickness: y % 100 === 0 ? 1 : 0.5,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.5,
        });

        // Add label every 100 points
        if (y % 100 === 0) {
          page.drawText(`${y}`, {
            x: 10,
            y: y - 5,
            size: 8,
            font,
            color: rgb(0, 0, 1),
          });
          page.drawText(`${y}`, {
            x: PAGE_WIDTH - 30,
            y: y - 5,
            size: 8,
            font,
            color: rgb(0, 0, 1),
          });
        }
      }

      // Add page title
      page.drawText(`Page ${pageIndex + 1} - Calibration Grid`, {
        x: PAGE_WIDTH / 2 - 80,
        y: PAGE_HEIGHT - 40,
        size: 12,
        font,
        color: rgb(1, 0, 0),
      });

      // Add instructions
      const instructions = [
        "X-axis (horizontal): Red numbers (0 = left, 612 = right)",
        "Y-axis (vertical): Blue numbers (0 = bottom, 792 = top)",
        "Grid spacing: Major lines every 100 pts, minor every 50 pts",
      ];

      instructions.forEach((instruction, i) => {
        page.drawText(instruction, {
          x: 10,
          y: PAGE_HEIGHT - 60 - i * 12,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
      });
    }

    // Save the calibration PDF
    const outputPath = path.join(
      process.cwd(),
      "docs",
      "test-output",
      "calibration-grid.pdf"
    );
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);

    console.log("✅ Calibration grid PDF created!");
    console.log("📁 Saved to:", outputPath);
    console.log("\n📋 How to use this calibration grid:");
    console.log("  1. Open the calibration PDF");
    console.log("  2. Find the field you want to fill");
    console.log("  3. Read the X coordinate (red, horizontal)");
    console.log("  4. Read the Y coordinate (blue, vertical)");
    console.log("  5. Update FIELD_COORDINATES in pdf-form-filler.ts\n");
    console.log("💡 Tips:");
    console.log(
      "  - Y-axis: 0 is at the BOTTOM (opposite of most graphics programs)"
    );
    console.log("  - Start X coordinate slightly to the left of the field");
    console.log(
      "  - Set Y coordinate at the baseline of where text should sit"
    );
    console.log("  - Use the filled test PDF to verify your coordinates\n");
  } catch (error) {
    console.error("❌ Error creating calibration grid:", error);
    process.exit(1);
  }
}

// Run calibration
addGridToPDF();

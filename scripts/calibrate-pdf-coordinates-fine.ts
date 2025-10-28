/**
 * Fine-Grained PDF Coordinate Calibration Tool
 *
 * Creates a tight grid overlay for precise character-by-character positioning
 * Grid spacing: 10 points (to match single-character boxes)
 * Labels: Every 10 points for precise coordinate reading
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

// Fine grid settings for character-level positioning
const GRID_SPACING = 10; // 10 points between lines (roughly 3.5mm)
const LABEL_INTERVAL = 20; // Label every 20 points (more readable)

async function addFineGridToPDF() {
  console.log('📐 Creating fine-grained calibration grid PDF...\n');

  try {
    // Load the official PDF
    const officialPdfPath = path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf');
    const pdfBytes = fs.readFileSync(officialPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add grid to first 3 pages only (for performance)
    const pagesToCalibrate = Math.min(3, pdfDoc.getPageCount());

    for (let pageIndex = 0; pageIndex < pagesToCalibrate; pageIndex++) {
      const page = pdfDoc.getPages()[pageIndex];

      console.log(`  Adding fine grid to page ${pageIndex + 1}...`);

      // Draw vertical lines with fine spacing
      for (let x = 0; x <= PAGE_WIDTH; x += GRID_SPACING) {
        // Vary line thickness: thicker every 50 points, medium every 20
        let thickness = 0.25;
        if (x % 50 === 0) thickness = 0.8;
        else if (x % 20 === 0) thickness = 0.4;

        page.drawLine({
          start: { x, y: 0 },
          end: { x, y: PAGE_HEIGHT },
          thickness,
          color: rgb(0.7, 0.7, 0.7),
          opacity: x % 50 === 0 ? 0.6 : 0.3,
        });

        // Add labels every LABEL_INTERVAL points
        if (x % LABEL_INTERVAL === 0 && x > 0 && x < PAGE_WIDTH) {
          const xLabel = `${x}`;
          const labelWidth = xLabel.length * 4; // Approximate width

          // Top label
          page.drawText(xLabel, {
            x: x - labelWidth / 2,
            y: PAGE_HEIGHT - 18,
            size: 7,
            font,
            color: rgb(1, 0, 0),
          });
          // Bottom label
          page.drawText(xLabel, {
            x: x - labelWidth / 2,
            y: 5,
            size: 7,
            font,
            color: rgb(1, 0, 0),
          });
        }
      }

      // Draw horizontal lines with fine spacing
      for (let y = 0; y <= PAGE_HEIGHT; y += GRID_SPACING) {
        // Vary line thickness: thicker every 50 points, medium every 20
        let thickness = 0.25;
        if (y % 50 === 0) thickness = 0.8;
        else if (y % 20 === 0) thickness = 0.4;

        page.drawLine({
          start: { x: 0, y },
          end: { x: PAGE_WIDTH, y },
          thickness,
          color: rgb(0.7, 0.7, 0.7),
          opacity: y % 50 === 0 ? 0.6 : 0.3,
        });

        // Add labels every LABEL_INTERVAL points
        if (y % LABEL_INTERVAL === 0 && y > 0 && y < PAGE_HEIGHT) {
          const yLabel = `${y}`;

          // Left label
          page.drawText(yLabel, {
            x: 5,
            y: y - 3,
            size: 7,
            font,
            color: rgb(0, 0, 1),
          });
          // Right label
          page.drawText(yLabel, {
            x: PAGE_WIDTH - 28,
            y: y - 3,
            size: 7,
            font,
            color: rgb(0, 0, 1),
          });
        }
      }

      // Add page title with semi-transparent background
      page.drawRectangle({
        x: PAGE_WIDTH / 2 - 110,
        y: PAGE_HEIGHT - 50,
        width: 220,
        height: 35,
        color: rgb(1, 1, 1),
        opacity: 0.8,
      });

      page.drawText(`Page ${pageIndex + 1} - Fine Calibration Grid`, {
        x: PAGE_WIDTH / 2 - 95,
        y: PAGE_HEIGHT - 35,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // Add coordinate info
      page.drawText(`Grid: ${GRID_SPACING}pt spacing | Labels: every ${LABEL_INTERVAL}pt`, {
        x: PAGE_WIDTH / 2 - 85,
        y: PAGE_HEIGHT - 45,
        size: 7,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // Save the calibration PDF
    const outputPath = path.join(process.cwd(), 'docs', 'test-output', 'calibration-grid-fine.pdf');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);

    console.log('\n✅ Fine calibration grid PDF created!');
    console.log('📁 Saved to:', outputPath);
    console.log('\n📋 Grid specifications:');
    console.log(`  • Grid spacing: ${GRID_SPACING} points (~${(GRID_SPACING * 0.0353).toFixed(1)}cm or ~${(GRID_SPACING / 72).toFixed(2)}in)`);
    console.log(`  • Coordinate labels: Every ${LABEL_INTERVAL} points`);
    console.log(`  • Line thickness: Bold every 50pt, medium every 20pt, fine every 10pt`);
    console.log('\n📋 How to use this fine calibration grid:');
    console.log('  1. Open calibration-grid-fine.pdf in a PDF viewer');
    console.log('  2. Find the character box you want to fill');
    console.log('  3. Read X coordinate (RED numbers) at the LEFT edge of the box');
    console.log('  4. Read Y coordinate (BLUE numbers) at the BOTTOM edge of text baseline');
    console.log('  5. Each character box is roughly 10-15 points wide');
    console.log('\n💡 Character positioning tips:');
    console.log('  - Each box holds ONE character');
    console.log('  - X coordinate: Start at the left edge of the first box');
    console.log('  - Character spacing: Add 10-15 points per character');
    console.log('  - Y coordinate: Text baseline (not top or middle of box)');
    console.log('  - PDF Y-axis: 0 = BOTTOM, 792 = TOP (inverted from graphics programs)');
    console.log('\n🎯 Next steps:');
    console.log('  1. Overlay this grid in your viewer alongside the form');
    console.log('  2. Measure exact coordinates for First Name, Last Name, etc.');
    console.log('  3. Update FIELD_COORDINATES in pdf-form-filler.ts');
    console.log('  4. Run: npx tsx scripts/test-pdf-form-filling.ts');
    console.log('  5. Iterate until characters align perfectly\n');

  } catch (error) {
    console.error('❌ Error creating fine calibration grid:', error);
    process.exit(1);
  }
}

// Run calibration
addFineGridToPDF();

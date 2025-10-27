/**
 * Analyze PDF structure to understand pages and layout
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function analyzePDF() {
  try {
    const pdfPath = path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    console.log('\n=== RECA Downwinder Claim Form - PDF Analysis ===\n');
    console.log(`Total pages: ${pages.length}\n`);

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      console.log(`Page ${index + 1}:`);
      console.log(`  Dimensions: ${width} x ${height} points`);
      console.log(`  Size (inches): ${(width / 72).toFixed(2)}" x ${(height / 72).toFixed(2)}"`);
    });

    console.log('\n✅ PDF loaded successfully');
    console.log('📝 Note: This PDF does not have fillable form fields.');
    console.log('📌 Strategy: We will overlay text at specific coordinates.\n');

  } catch (error) {
    console.error('❌ Error analyzing PDF:', error);
    process.exit(1);
  }
}

analyzePDF();

import fs from "fs";
import { PDFDocument, PDFName, PDFRawStream, PDFImage } from "pdf-lib";

async function extractImages(pdfPath: string) {
  console.log(`Processing ${pdfPath}...`);
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];

  // This is a simplified extraction and might not work for all PDF structures
  // Accessing internal XObjects directly
  const { Resources } = page.node as any;
  if (!Resources || !Resources.get(PDFName.of("XObject"))) {
    console.log("No XObjects found on page 1");
    return;
  }

  const xObjects = Resources.get(PDFName.of("XObject"));
  if (!xObjects) return;

  const xObjectMap = xObjects.asMap();

  let imageCount = 0;

  xObjectMap.forEach((ref, name) => {
    // In a real implementation we would dereference and check if it's a Subtype Image
    console.log(`Found XObject: ${name.toString()}`);
    imageCount++;
  });

  console.log(`Found ${imageCount} XObjects on page 1.`);
}

// Run on a likely vector PDF
extractImages("docs/RECA Claim Form.pdf").catch(console.error);

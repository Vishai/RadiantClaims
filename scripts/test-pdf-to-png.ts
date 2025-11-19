import pdfToPng from "pdf-to-png";
import fs from "fs";

async function testConversion() {
  try {
    const pdfBuffer = fs.readFileSync("docs/RECA Claim Form.pdf");
    console.log("Converting PDF to PNG...");
    const pngPages = await pdfToPng(pdfBuffer, {
      outputFolder: "tmp",
      outputFileMask: "page",
      pagesToProcess: [1],
    });
    console.log("Success!", pngPages);
  } catch (error) {
    console.error("Conversion failed:", error);
  }
}

testConversion();

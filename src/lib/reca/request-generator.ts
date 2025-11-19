import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate } from "@/lib/utils";

interface RequestPacketData {
  hospitalName: string;
  hospitalAddress?: string;
  hospitalCity?: string;
  hospitalState?: string;
  hospitalZip?: string;
  patientName: string;
  patientDOB: string;
  patientSSN: string; // Last 4 digits or full? Usually full for medical requests
  requesterName: string;
  requesterAddress: string;
  requesterCity: string;
  requesterState: string;
  requesterZip: string;
  requesterPhone: string;
  requesterEmail?: string;
  relationship: string;
  treatmentDates?: string; // "1950-1970"
}

export async function generateMedicalRequestPacket(
  data: RequestPacketData,
  hipaaReleasePdfBytes?: Uint8Array, // Optional: Attach signed HIPAA release if available
  idCardImageBytes?: Uint8Array // Optional: Attach ID card image
): Promise<Uint8Array> {
  // Create a new PDFDocument
  const doc = await PDFDocument.create();

  // Embed fonts
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Add Cover Letter Page
  const page = doc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 11;
  const margin = 50;
  let yPosition = height - margin;

  const drawText = (
    text: string,
    options: { x?: number; size?: number; font?: any } = {}
  ) => {
    page.drawText(text, {
      x: options.x || margin,
      y: yPosition,
      size: options.size || fontSize,
      font: options.font || font,
      color: rgb(0, 0, 0),
    });
  };

  const moveDown = (amount: number) => {
    yPosition -= amount;
  };

  // Date
  drawText(formatDate(new Date()), { font: boldFont });
  moveDown(30);

  // Hospital Address Block
  drawText(data.hospitalName, { font: boldFont });
  moveDown(15);
  if (data.hospitalAddress) {
    drawText(data.hospitalAddress);
    moveDown(15);
    drawText(
      `${data.hospitalCity || ""}, ${data.hospitalState || ""} ${data.hospitalZip || ""}`
    );
    moveDown(30);
  } else {
    drawText("Medical Records Department");
    moveDown(30);
  }

  // Requester Address Block (From)
  drawText(`FROM: ${data.requesterName}`);
  moveDown(15);
  drawText(data.requesterAddress);
  moveDown(15);
  drawText(
    `${data.requesterCity}, ${data.requesterState} ${data.requesterZip}`
  );
  moveDown(15);
  drawText(`Phone: ${data.requesterPhone}`);
  if (data.requesterEmail) {
    moveDown(15);
    drawText(`Email: ${data.requesterEmail}`);
  }
  moveDown(40);

  // Subject
  drawText(`RE: Medical Records Request for ${data.patientName}`, {
    font: boldFont,
    size: 12,
  });
  moveDown(15);
  drawText(`DOB: ${data.patientDOB}`);
  moveDown(15);
  drawText(`SSN: ${data.patientSSN}`);
  if (data.treatmentDates) {
    moveDown(15);
    drawText(`Treatment Dates: ${data.treatmentDates}`);
  }
  moveDown(40);

  // Body
  const bodyText = `To Whom It May Concern:

I am writing to request a complete copy of the medical records for the above-named patient. 
This request is made for the purpose of filing a claim under the Radiation Exposure Compensation 
Act (RECA), a federal program administered by the U.S. Department of Justice.

Please provide all available records, including but not limited to:
- Admission and discharge summaries
- History and physical examinations
- Operative reports
- Pathology reports (specifically cancer diagnoses)
- Radiology reports
- Oncology records

As this request is for a federal compensation program, I kindly ask that you expedite processing.
Attached to this letter, please find:
1. A signed HIPAA authorization form.
2. A copy of my identification.

If you have any questions or require additional information, please contact me immediately at 
the phone number listed above.

Thank you for your assistance in this time-sensitive matter.

Sincerely,`;

  const lines = bodyText.split("\n");
  for (const line of lines) {
    if (line.trim() === "") {
      moveDown(15);
    } else {
      // Simple text wrapping could be added here, but for now assuming standard width lines
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: font,
        maxWidth: width - margin * 2,
        lineHeight: 14,
      });
      // Estimate height taken (simplified)
      moveDown(14 + (line.length > 90 ? 14 : 0));
    }
  }

  moveDown(40);
  drawText(data.requesterName); // Signature placeholder
  moveDown(15);
  drawText("Claimant / Authorized Representative");

  // Attach HIPAA Release if provided
  if (hipaaReleasePdfBytes) {
    const hipaaDoc = await PDFDocument.load(hipaaReleasePdfBytes);
    const copiedPages = await doc.copyPages(
      hipaaDoc,
      hipaaDoc.getPageIndices()
    );
    copiedPages.forEach((page) => doc.addPage(page));
  }

  // Attach ID Image if provided
  if (idCardImageBytes) {
    const idPage = doc.addPage();
    let idImage;
    try {
      // Try PNG first, then JPG
      idImage = await doc.embedPng(idCardImageBytes);
    } catch (e) {
      try {
        idImage = await doc.embedJpg(idCardImageBytes);
      } catch (e2) {
        console.error("Failed to embed ID image");
      }
    }

    if (idImage) {
      const { width: imgW, height: imgH } = idImage.scaleToFit(
        width - 100,
        height - 100
      );
      idPage.drawText("Attached Identification", {
        x: 50,
        y: height - 50,
        size: 14,
        font: boldFont,
      });
      idPage.drawImage(idImage, {
        x: 50,
        y: height - 80 - imgH,
        width: imgW,
        height: imgH,
      });
    }
  }

  return await doc.save();
}

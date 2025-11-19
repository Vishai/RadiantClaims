import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getObject } from "@/lib/r2";
import { RequestPacketGenerator } from "@/lib/reca/request-packet-generator";

export const dynamic = "force-dynamic";

const generateRequestSchema = z.object({
  intakeSessionId: z.string(),
  hospitalName: z.string().min(1),
  treatmentYear: z.string().min(4),
  cancerType: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { intakeSessionId, hospitalName, treatmentYear, cancerType } =
      generateRequestSchema.parse(body);

    // 2. Fetch Session & Claimant
    const session = await db.intakeSession.findUnique({
      where: { id: intakeSessionId },
      include: {
        claimant: true,
        uploadedFiles: true,
      },
    });

    if (!session || !session.claimant) {
      return NextResponse.json(
        { error: "Session or claimant not found" },
        { status: 404 }
      );
    }

    if (session.claimant.email !== authSession.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Find ID File
    // We look for a file that is successfully uploaded (not UPLOADING, FAILED, or REJECTED)
    const idFile = session.uploadedFiles.find(
      (f) =>
        f.category === "IDENTITY" &&
        [
          "READY",
          "PROCESSING",
          "VALIDATED",
          "AWAITING_REVIEW",
          "APPROVED",
        ].includes(f.status)
    );

    if (!idFile) {
      return NextResponse.json(
        { error: "No ID file found. Please upload ID first." },
        { status: 400 }
      );
    }

    // 4. Fetch ID File from R2
    const idBuffer = await getObject(idFile.fileKey);
    if (!idBuffer) {
      return NextResponse.json(
        { error: "Failed to retrieve ID file" },
        { status: 500 }
      );
    }

    // 5. Generate PDF Packet
    const generator = new RequestPacketGenerator({
      hospitalName,
      treatmentYear,
      cancerType,
      patientName: `${session.claimant.firstName} ${session.claimant.lastName}`,
      patientDob: session.claimant.dob
        ? new Date(session.claimant.dob).toLocaleDateString()
        : "Unknown",
      idFileBuffer: idBuffer,
      idFileType: idFile.mimeType,
    });

    const pdfBytes = await generator.generate();

    // 6. Return PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Medical_Request_${session.claimant.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate Request Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

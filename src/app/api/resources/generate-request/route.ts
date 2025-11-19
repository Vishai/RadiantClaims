import { NextRequest, NextResponse } from "next/server";
import { generateMedicalRequestPacket } from "@/lib/reca/request-generator";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // TODO: In a real scenario, fetch the user's signed HIPAA release and ID from R2
    // const hipaaBytes = await fetchFromR2(user.hipaaReleaseUrl);
    // const idBytes = await fetchFromR2(user.idCardUrl);

    const pdfBytes = await generateMedicalRequestPacket(data);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Medical_Request_${data.hospitalName.replace(/\s/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating request packet:", error);
    return NextResponse.json(
      { error: "Failed to generate packet" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getObject } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const file = await db.uploadedFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Fetch the file from R2
    const buffer = await getObject(file.fileKey);

    if (!buffer) {
      return NextResponse.json(
        { error: "Failed to fetch file from storage" },
        { status: 500 }
      );
    }

    // Return file with download headers
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalFilename}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

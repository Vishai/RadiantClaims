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

    // Return file for inline viewing
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.originalFilename}"`,
      },
    });
  } catch (error) {
    console.error("View error:", error);
    return NextResponse.json({ error: "Failed to view file" }, { status: 500 });
  }
}

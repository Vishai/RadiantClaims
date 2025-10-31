import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // If thumbnail exists, serve it
    if (file.thumbnailKey) {
      return NextResponse.redirect(file.thumbnailKey);
    }

    // For images, serve the original file as thumbnail
    if (file.mimeType.startsWith("image/")) {
      return NextResponse.redirect(file.fileKey);
    }

    // No thumbnail available
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error("Thumbnail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thumbnail" },
      { status: 500 }
    );
  }
}

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

    // Redirect to the blob URL for viewing
    return NextResponse.redirect(file.fileKey);
  } catch (error) {
    console.error("View error:", error);
    return NextResponse.json({ error: "Failed to view file" }, { status: 500 });
  }
}

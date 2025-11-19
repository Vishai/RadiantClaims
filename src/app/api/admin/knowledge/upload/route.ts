import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag/ingest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Basic Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      // Allow attorneys to upload private docs? For now, strictly ADMIN for global knowledge.
      // To expand to attorneys: check if (role === ADMIN || role === ATTORNEY)
      if (session?.user.role !== "ATTORNEY") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const isPublic = formData.get("isPublic") === "true";
    const claimantId = formData.get("claimantId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await ingestDocument({
      filename: file.name,
      fileBuffer: buffer,
      isPublic,
      claimantId: claimantId || undefined,
      uploadedBy: session.user.id,
    });

    return NextResponse.json({ success: true, chunks: result.chunks });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

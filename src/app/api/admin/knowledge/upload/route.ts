import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag/ingest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToR2, generateFileKey } from "@/lib/r2";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Basic Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      // Allow attorneys to upload private docs
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

    // 1. Upload to R2
    const fileKey = generateFileKey(file.name);
    await uploadToR2(fileKey, buffer, file.type || "application/pdf");

    // 2. Create KnowledgeSource Record
    const knowledgeSource = await db.knowledgeSource.create({
      data: {
        fileName: file.name,
        fileKey: fileKey,
        mimeType: file.type || "application/pdf",
        sizeBytes: file.size,
        isPublic,
        claimantId: claimantId || undefined,
        uploadedById: session.user.id,
      },
    });

    // 3. Ingest into Vector DB
    const result = await ingestDocument({
      filename: file.name,
      fileBuffer: buffer,
      isPublic,
      claimantId: claimantId || undefined,
      uploadedBy: session.user.id,
      knowledgeSourceId: knowledgeSource.id,
    });

    // Update chunk count
    await db.knowledgeSource.update({
      where: { id: knowledgeSource.id },
      data: { chunkCount: result.chunks },
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

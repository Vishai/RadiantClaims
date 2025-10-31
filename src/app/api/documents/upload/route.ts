import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;
    const category = formData.get("category") as string | null;
    const requiresOriginal = formData.get("requiresOriginal") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Document category is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await db.intakeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 404 }
      );
    }

    // Generate unique file key
    const fileExtension = file.name.split(".").pop();
    const fileKey = `${sessionId}/${nanoid()}.${fileExtension}`;

    // Upload to Vercel Blob (or your storage provider)
    const blob = await put(fileKey, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Create database record
    const uploadedFile = await db.uploadedFile.create({
      data: {
        intakeSessionId: sessionId,
        fileKey: blob.url, // Store the blob URL as fileKey
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        category: category as any,
        status: "PENDING" as any,
        requiresOriginal: requiresOriginal,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        fileId: uploadedFile.id,
        category: uploadedFile.category,
        requiresOriginal: uploadedFile.requiresOriginal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all documents for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const files = await db.uploadedFile.findMany({
      where: { intakeSessionId: sessionId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

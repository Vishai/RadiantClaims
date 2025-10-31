import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const documentSchema = z.object({
  claimantId: z.string(),
  type: z.enum(["ID", "Medical", "ProofOfResidency", "Other"]),
  fileKey: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

/**
 * GET /api/documents?sessionId=xxx
 * Get all uploaded documents for a session
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Get uploaded files for this session
    const files = await db.uploadedFile.findMany({
      where: {
        intakeSessionId: sessionId,
        status: "READY",
      },
      orderBy: {
        uploadedAt: "desc",
      },
      select: {
        id: true,
        category: true,
        originalFilename: true,
        fileKey: true,
        sizeBytes: true,
        uploadedAt: true,
        requiresOriginal: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = documentSchema.parse(body);

    const document = await db.document.create({
      data: validated,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

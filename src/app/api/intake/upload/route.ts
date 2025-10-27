import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPresignedPutUrl, generateFileKey } from "@/lib/r2";
import { db } from "@/lib/db";
import { z } from "zod";

const uploadRequestSchema = z.object({
  intakeSessionId: z.string(),
  fileName: z.string().min(1).max(255),
  contentType: z.string(),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
  category: z.enum([
    "IDENTITY",
    "PROOF_OF_RESIDENCE",
    "PATHOLOGY_REPORT",
    "MEDICAL_RECORDS",
    "DISCHARGE_SUMMARY",
    "TUMOR_REGISTRY",
    "TREATMENT_RECORDS",
    "UTILITY_BILL",
    "MORTGAGE_STATEMENT",
    "TAX_RETURN",
    "SCHOOL_RECORDS",
    "EMPLOYMENT_RECORDS",
    "OTHER",
  ]).optional(),
});

/**
 * POST /api/intake/upload
 * Step 1: Request a presigned upload URL for a file
 * Returns a presigned PUT URL and creates an UploadedFile record in UPLOADING status
 * REQUIRES AUTHENTICATION - User must own the session
 */
export async function POST(req: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { intakeSessionId, fileName, contentType, sizeBytes, category } =
      uploadRequestSchema.parse(body);

    // Verify intake session exists and user owns it
    const session = await db.intakeSession.findUnique({
      where: { id: intakeSessionId },
      include: {
        claimant: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Intake session not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION CHECK: User must own this session
    if (session.claimant?.email !== authSession.user.email) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to upload to this session" },
        { status: 403 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Intake session has expired" },
        { status: 403 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(fileName);

    // Get presigned URL
    const { putUrl } = await getPresignedPutUrl(fileKey, contentType);

    // Create UploadedFile record in database
    const uploadedFile = await db.uploadedFile.create({
      data: {
        intakeSessionId,
        fileKey,
        originalFilename: fileName,
        mimeType: contentType,
        sizeBytes,
        category: category || null,
        status: "UPLOADING",
      },
    });

    // Update session last activity
    await db.intakeSession.update({
      where: { id: intakeSessionId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      uploadedFileId: uploadedFile.id,
      putUrl,
      fileKey,
      message:
        "Use PUT method to upload file to putUrl, then call PATCH /api/intake/upload/:id to mark as uploaded",
    });
  } catch (error) {
    console.error("Upload request error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

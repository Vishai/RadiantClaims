import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const confirmUploadSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * PATCH /api/intake/upload/:id
 * Step 2: Confirm upload completion or failure
 * Updates the UploadedFile status from UPLOADING to PROCESSING/FAILED
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { success, error } = confirmUploadSchema.parse(body);

    // Find the uploaded file
    const file = await db.uploadedFile.findUnique({
      where: { id },
      include: { intakeSession: true },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Uploaded file not found" },
        { status: 404 }
      );
    }

    // Update file status
    const updatedFile = await db.uploadedFile.update({
      where: { id },
      data: {
        status: success ? "PROCESSING" : "FAILED",
        rejectionReason: error || null,
      },
    });

    // If successful, trigger background processing (OCR, validation, etc.)
    // TODO: Add background job here to process file (OCR extraction, thumbnail generation)
    if (success) {
      // For now, just mark as READY immediately
      // Later: trigger background job and keep status as PROCESSING
      await db.uploadedFile.update({
        where: { id },
        data: { status: "READY", processedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      file: updatedFile,
    });
  } catch (error) {
    console.error("Upload confirmation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/intake/upload/:id
 * Delete an uploaded file
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find the uploaded file
    const file = await db.uploadedFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Uploaded file not found" },
        { status: 404 }
      );
    }

    // Delete from database
    // TODO: Also delete from R2 storage
    await db.uploadedFile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { validateDocument } from "@/lib/ai-agents/orchestration-service";

const confirmUploadSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * GET /api/intake/upload/:id
 * Get uploaded file details including validation status
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Find the uploaded file with validation
    const file = await db.uploadedFile.findUnique({
      where: { id },
      include: {
        validation: true,
        intakeSession: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Uploaded file not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error("File retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/intake/upload/:id
 * Step 2: Confirm upload completion or failure
 * Updates the UploadedFile status from UPLOADING to PROCESSING/FAILED
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // If successful, trigger AI validation
    if (success) {
      // Mark file as READY
      await db.uploadedFile.update({
        where: { id },
        data: { status: "READY", processedAt: new Date() },
      });

      // Trigger AI validation asynchronously (don't await - runs in background)
      // This validates the document and stores results in DocumentValidation table
      validateDocument(id).catch((err) => {
        console.error(`Background validation failed for file ${id}:`, err);
        // Validation failure doesn't block the upload - file is still READY
        // Staff can review and manually validate if needed
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
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

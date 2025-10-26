import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSessionSchema = z.object({
  currentStep: z
    .enum([
      "SCREENING",
      "IDENTITY",
      "RESIDENCE",
      "MEDICAL",
      "ADDITIONAL",
      "CONSENT",
      "REVIEW",
    ])
    .optional(),
  status: z
    .enum([
      "DRAFT",
      "IN_PROGRESS",
      "READY_FOR_REVIEW",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "SUBMITTED",
    ])
    .optional(),
  claimType: z
    .enum([
      "PANCREATIC_CANCER",
      "THYROID_CANCER",
      "KIDNEY_CANCER",
      "LUNG_CANCER",
      "BRAIN_CANCER",
      "OTHER_CANCER",
      "NON_CANCER",
    ])
    .optional(),
  isPremiumService: z.boolean().optional(),
  completedSteps: z.array(z.string()).optional(),
  claimantId: z.string().optional(),
});

/**
 * PATCH /api/intake/session/:id
 * Update intake session progress
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const updateData = updateSessionSchema.parse(body);

    const session = await db.intakeSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 403 }
      );
    }

    const updatedSession = await db.intakeSession.update({
      where: { id },
      data: {
        ...updateData,
        lastActivityAt: new Date(),
      },
      include: {
        claimant: true,
        uploadedFiles: {
          orderBy: { uploadedAt: "desc" },
        },
        intakeResponses: true,
      },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Session update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intake/session/:id
 * Get session by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const session = await db.intakeSession.findUnique({
      where: { id },
      include: {
        claimant: true,
        uploadedFiles: {
          orderBy: { uploadedAt: "desc" },
        },
        intakeResponses: true,
        consentRecords: true,
        packetSubmission: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 403 }
      );
    }

    // Update last activity
    await db.intakeSession.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}

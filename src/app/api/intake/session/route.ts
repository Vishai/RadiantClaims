import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const createSessionSchema = z.object({
  claimantId: z.string().optional(),
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
});

/**
 * POST /api/intake/session
 * Create a new intake session with a unique resume token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claimantId, claimType, isPremiumService } =
      createSessionSchema.parse(body);

    // Check if session already exists for this claimant
    if (claimantId) {
      const existingSession = await db.intakeSession.findUnique({
        where: { claimantId },
      });

      if (existingSession) {
        // Return existing session instead of creating new one
        return NextResponse.json({
          session: {
            id: existingSession.id,
            resumeToken: existingSession.resumeToken,
            currentStep: existingSession.currentStep,
            status: existingSession.status,
            expiresAt: existingSession.expiresAt,
          },
          resumeUrl: `${req.nextUrl.origin}/intake/step2?token=${existingSession.resumeToken}`,
        });
      }
    }

    // Generate unique resume token (URL-safe)
    const resumeToken = randomBytes(32).toString("base64url");

    // Session expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create intake session
    const session = await db.intakeSession.create({
      data: {
        resumeToken,
        claimantId: claimantId || null,
        claimType: claimType || null,
        isPremiumService: isPremiumService || false,
        expiresAt,
        currentStep: "SCREENING",
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        resumeToken: session.resumeToken,
        currentStep: session.currentStep,
        status: session.status,
        expiresAt: session.expiresAt,
      },
      resumeUrl: `${req.nextUrl.origin}/intake/step2?token=${resumeToken}`,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create intake session" },
      { status: 500 }
    );
  }
}

const getSessionSchema = z.object({
  token: z.string(),
});

/**
 * GET /api/intake/session?token=xxx
 * Retrieve intake session by resume token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Resume token is required" },
        { status: 400 }
      );
    }

    const session = await db.intakeSession.findUnique({
      where: { resumeToken: token },
      include: {
        claimant: true,
        uploadedFiles: {
          orderBy: { uploadedAt: "desc" },
        },
        intakeResponses: true,
        consentRecords: true,
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
      where: { id: session.id },
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

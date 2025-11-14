import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

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
  let claimantId: string | undefined;

  try {
    const body = await req.json();
    const parsed = createSessionSchema.parse(body);
    claimantId = parsed.claimantId;
    const { claimType, isPremiumService } = parsed;

    // Check if session already exists for this claimant
    if (claimantId) {
      const existingSession = await db.intakeSession.findUnique({
        where: { claimantId },
        include: {
          claimant: true,
        },
      });

      if (existingSession) {
        // Return existing session instead of creating new one
        return NextResponse.json({
          session: existingSession,
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
      include: {
        claimant: true,
      },
    });

    return NextResponse.json({
      session,
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

    // Handle unique constraint violation (race condition)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002" &&
      claimantId
    ) {
      // Session was created by another concurrent request, fetch and return it
      const existingSession = await db.intakeSession.findUnique({
        where: { claimantId },
        include: { claimant: true },
      });

      if (existingSession) {
        return NextResponse.json({
          session: existingSession,
          resumeUrl: `${req.nextUrl.origin}/intake/step2?token=${existingSession.resumeToken}`,
        });
      }
    }

    return NextResponse.json(
      { error: "Failed to create intake session" },
      { status: 500 }
    );
  }
}

// Schema for validating query params when fetching session by token
// Currently unused but kept for future implementation
// const getSessionSchema = z.object({
//   token: z.string(),
// });

/**
 * GET /api/intake/session?token=xxx
 * Retrieve intake session by resume token
 * REQUIRES AUTHENTICATION - User must own the session
 */
export async function GET(req: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

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
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 403 }
      );
    }

    // AUTHORIZATION CHECK: User must own this session
    if (session.claimant?.email !== authSession.user.email) {
      return NextResponse.json(
        {
          error: "Forbidden - You don't have permission to access this session",
        },
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

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/claims
 * Get all claims for the logged-in customer
 */
export async function GET(_req: NextRequest) {
  try {
    console.log("[Portal Claims API] Starting request");
    const session = await getServerAuthSession();
    console.log(
      "[Portal Claims API] Session:",
      session
        ? `Found - User ID: ${session.user?.id}, Email: ${session.user?.email}`
        : "Not found"
    );

    if (!session?.user?.email) {
      console.log("[Portal Claims API] No session or email, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Portal Claims API] Looking up user:", session.user.email);
    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error(
        "[Portal Claims API] SECURITY WARNING: User not found in database for session email:",
        session.user.email,
        "Session user ID:",
        session.user.id
      );
      return NextResponse.json({
        claims: [],
        warning: "User account record was not found for this session",
      });
    }

    // SECURITY: Validate that session user ID matches database user ID
    if (session.user.id !== user.id) {
      console.error(
        "[Portal Claims API] CRITICAL SECURITY ERROR: Session user ID mismatch!",
        "Session ID:",
        session.user.id,
        "Database ID:",
        user.id,
        "Email:",
        user.email
      );
      return NextResponse.json(
        { error: "Session validation failed" },
        { status: 403 }
      );
    }

    console.log("[Portal Claims API] Fetching claims for user:", user.id);
    // Get all claimants for this user
    const claims = await db.claimant.findMany({
      where: { userId: user.id },
      include: {
        intakeSession: {
          select: {
            id: true,
            resumeToken: true,
            currentStep: true,
            status: true,
            uploadedFiles: {
              where: {
                status: {
                  notIn: ["FAILED", "REJECTED"],
                },
              },
              select: {
                id: true,
                category: true,
                status: true,
                originalFilename: true,
                sizeBytes: true,
                uploadedAt: true,
              },
            },
            packetSubmission: {
              include: {
                generations: {
                  orderBy: { version: "desc" },
                  take: 5,
                },
              },
            },
            updatedAt: true,
            // RECA workflow fields
            recaWorkflowStage: true,
            recaWorkflowSection: true,
            recaCompletionPercent: true,
            recaFormData: true, // Include form data for client-side logic
          },
        },
        referral: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[Portal Claims API] Found", claims.length, "claims");
    return NextResponse.json({ claims });
  } catch (error) {
    console.error("[Portal Claims API] ERROR:", error);
    console.error(
      "[Portal Claims API] Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      {
        error: "Failed to fetch claims",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * RECA Workflow Creation API
 * Creates a new RECA workflow session for authenticated, paying users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimType, isGuest = false } = body;

    // Require authenticated users – guest access is disabled for paid launch
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "You must be signed in to start a RECA claim." },
        { status: 401 }
      );
    }

    if (isGuest) {
      return NextResponse.json(
        {
          error:
            "Guest access is no longer available. Please sign in with an active subscription.",
        },
        { status: 403 }
      );
    }

    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        tier: true,
        status: true,
        setupFeePaid: true,
      },
    });

    const isLegalTier = subscription?.tier === "LEGAL_REP";
    const isActiveDIY =
      subscription?.tier === "DIY_PREP" &&
      subscription?.setupFeePaid === true &&
      subscription?.status === "ACTIVE";

    if (!subscription || (!isLegalTier && !isActiveDIY)) {
      return NextResponse.json(
        {
          error:
            "An active RadiantClaims subscription is required to access the RECA form.",
        },
        { status: 403 }
      );
    }

    let claimantId: string | null = null;

    // Associate workflow with the caller's claimant profile
    if (session.user.email && session.user.id) {
      let claimant = await db.claimant.findFirst({
        where: {
          OR: [{ email: session.user.email }, { userId: session.user.id }],
        },
      });

      if (!claimant) {
        // Create a new claimant record for authenticated user
        claimant = await db.claimant.create({
          data: {
            userId: session.user.id, // Link to user account
            email: session.user.email,
            firstName: session.user.name?.split(" ")[0] || "",
            lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
            phone: "",
            dob: new Date().toISOString(),
            address1: "",
            city: "",
            county: "",
            state: "",
            postalCode: "",
            claimType: claimType || "DOWNWINDER",
          },
        });
      } else if (!claimant.userId) {
        // If claimant exists but not linked to user, link it now
        claimant = await db.claimant.update({
          where: { id: claimant.id },
          data: { userId: session.user.id },
        });
      }
      claimantId = claimant.id;
    }

    // Generate resume token so the user can resume progress
    const resumeToken = `reca_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create intake session for RECA workflow (claimant linked when available)
    const intakeSession = await db.intakeSession.create({
      data: {
        resumeToken: resumeToken,
        ...(claimantId && {
          claimant: {
            connect: { id: claimantId },
          },
        }),
        currentStep: "SCREENING", // IntakeStep enum
        recaFormData: {},
        recaSupportingForms: {},
        recaEligibilityData: undefined,
        recaWorkflowSection: "part_1", // Fixed field name
        recaWorkflowStage: 1, // Fixed field name
        recaCompletionPercent: 0, // Fixed field name
        expiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      sessionId: intakeSession.id,
      claimantId: claimantId,
      message: "RECA workflow session created successfully",
    });
  } catch (error) {
    console.error("Error creating RECA workflow session:", error);
    return NextResponse.json(
      {
        error: "Failed to create workflow session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

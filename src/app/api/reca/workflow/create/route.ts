/**
 * RECA Workflow Creation API
 * Creates a new RECA workflow session (anonymous or authenticated)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimType, isGuest = false } = body;

    // Check if user is authenticated (optional - allows anonymous workflow)
    const session = await getServerSession(authOptions);

    let claimantId: string | null = null;

    // If authenticated and not explicitly requesting guest mode, try to associate with existing claimant
    if (session?.user?.email && !isGuest) {
      let claimant = await db.claimant.findUnique({
        where: { email: session.user.email },
      });

      if (!claimant) {
        // Create a new claimant record for authenticated user
        claimant = await db.claimant.create({
          data: {
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
      }
      claimantId = claimant.id;
    }

    // Generate resume token for anonymous sessions
    const resumeToken = `reca_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create intake session for RECA workflow (with or without claimant)
    // Claimant will be created later from form data if not authenticated
    const intakeSession = await db.intakeSession.create({
      data: {
        resumeToken: resumeToken,
        ...(claimantId && {
          claimant: {
            connect: { id: claimantId }
          }
        }),
        currentStep: "SCREENING", // IntakeStep enum
        recaFormData: {},
        recaSupportingForms: {},
        recaEligibilityData: null,
        recaWorkflowSection: "part_1",  // Fixed field name
        recaWorkflowStage: 1,           // Fixed field name
        recaCompletionPercent: 0,       // Fixed field name
        expiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      sessionId: intakeSession.id,
      claimantId: claimantId,
      message: "RECA workflow session created successfully",
      isAnonymous: !session?.user?.email,
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

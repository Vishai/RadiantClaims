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
    const {
      claimType,
      isGuest = false,
      eligibilityData: clientEligibilityData,
      claimantId: providedClaimantId, // NEW: Allow providing claimant ID from subscription flow
    } = body;

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
        id: true,
        tier: true,
        status: true,
        setupFeePaid: true,
        isInstallmentPlan: true,
        installmentPaymentCount: true,
      },
    });

    // User has access if they've paid anything (full $499 or started installments)
    const hasPaid =
      subscription?.setupFeePaid ||
      (subscription?.installmentPaymentCount ?? 0) > 0;

    if (!subscription || !hasPaid) {
      return NextResponse.json(
        {
          error:
            "Payment is required to access the RECA form. Please complete your payment to continue.",
        },
        { status: 403 }
      );
    }

    // Check existing claims count
    const existingClaims = await db.claimant.findMany({
      where: { userId: session.user.id },
    });

    let claimantId: string | null = null;
    let eligibilityDataFromDB: any = null;

    // If this is a subsequent claim (2nd+), require claim subscription
    if (existingClaims.length > 0) {
      // Subsequent claim - must have claimantId from subscription flow
      if (!providedClaimantId) {
        return NextResponse.json(
          {
            error: "SUBSEQUENT_CLAIM_REQUIRES_SUBSCRIPTION",
            message:
              "This is your 2nd or additional claim. Please complete payment for this claim before starting the form.",
            existingClaimCount: existingClaims.length,
            nextClaimOrder: existingClaims.length + 1,
          },
          { status: 402 } // 402 Payment Required
        );
      }

      // Verify claimant exists and has subscription
      const claimant = await db.claimant.findUnique({
        where: { id: providedClaimantId },
        include: { claimSubscription: true },
      });

      if (!claimant || claimant.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Invalid claimant ID" },
          { status: 400 }
        );
      }

      // Verify claim subscription is paid
      if (
        !claimant.claimSubscription ||
        !claimant.claimSubscription.setupFeePaid
      ) {
        return NextResponse.json(
          {
            error: "CLAIM_SUBSCRIPTION_NOT_PAID",
            message:
              "Payment is required for this claim before you can start the form.",
            claimantId: providedClaimantId,
          },
          { status: 402 }
        );
      }

      claimantId = claimant.id;
      eligibilityDataFromDB = claimant.eligibilityData;
    } else {
      // First claim - covered by initial service subscription
      // Associate workflow with the caller's claimant profile
      if (session.user.email && session.user.id) {
        let claimant = await db.claimant.findFirst({
          where: {
            OR: [{ email: session.user.email }, { userId: session.user.id }],
          },
          select: {
            id: true,
            userId: true,
            email: true,
            eligibilityData: true,
          },
        });

        if (!claimant) {
          // Create a new claimant record for authenticated user (first claim)
          claimant = await db.claimant.create({
            data: {
              userId: session.user.id,
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
            select: {
              id: true,
              userId: true,
              email: true,
              eligibilityData: true,
            },
          });
        } else {
          // Store eligibility data from claimant if it exists
          eligibilityDataFromDB = claimant.eligibilityData;

          if (!claimant.userId) {
            // If claimant exists but not linked to user, link it now
            claimant = await db.claimant.update({
              where: { id: claimant.id },
              data: {
                userId: session.user.id,
                leadStatus: "CONVERTED",
                conversionStage: "FORM_STARTED",
              },
              select: {
                id: true,
                userId: true,
                email: true,
                eligibilityData: true,
              },
            });
          } else {
            // User already linked, update conversion stage
            await db.claimant.update({
              where: { id: claimant.id },
              data: {
                leadStatus: "CONVERTED",
                conversionStage: "FORM_STARTED",
              },
            });
          }
        }
        claimantId = claimant.id;
      }
    }

    // Generate resume token so the user can resume progress
    const resumeToken = `reca_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Use eligibility data from database if available, otherwise use client-provided data
    // This ensures data persists across sessions even if localStorage is cleared
    const finalEligibilityData =
      eligibilityDataFromDB || clientEligibilityData || undefined;

    console.log("[RECA Workflow Create] Eligibility data sources:", {
      fromDatabase: !!eligibilityDataFromDB,
      fromClient: !!clientEligibilityData,
      using: finalEligibilityData ? "database or client" : "none",
    });

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
        recaEligibilityData: finalEligibilityData,
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

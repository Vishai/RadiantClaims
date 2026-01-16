/**
 * Subsequent Claim Eligibility Check API
 *
 * Checks eligibility for users filing additional claims.
 * Allows bypass with warning, but recommends going through eligibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eligibilityData, bypassCheck = false } = body;

    // Get user's existing claims
    const existingClaims = await db.claimant.findMany({
      where: { userId: session.user.id },
    });

    // Check if user has service subscription
    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No service subscription found" },
        { status: 400 }
      );
    }

    // If bypassing check, return warning
    if (bypassCheck) {
      return NextResponse.json({
        bypassed: true,
        eligible: true,
        warning:
          "You've chosen to bypass the eligibility check. We recommend completing the eligibility questionnaire to ensure you meet RECA requirements.",
        existingClaimCount: existingClaims.length,
        nextClaimOrder: existingClaims.length + 1,
      });
    }

    // If no eligibility data provided, return instructions
    if (!eligibilityData) {
      return NextResponse.json({
        requiresEligibilityCheck: true,
        message:
          "Please complete the eligibility questionnaire for your new claim",
        existingClaimCount: existingClaims.length,
        nextClaimOrder: existingClaims.length + 1,
      });
    }

    // Validate eligibility data
    const { relationship, exposure, disease, claimType } = eligibilityData;

    // Basic validation logic (same as initial eligibility check)
    const isEligible = !!(relationship && exposure && disease && claimType);

    if (!isEligible) {
      return NextResponse.json({
        eligible: false,
        reason:
          "Based on your responses, this claim may not meet RECA eligibility requirements.",
        recommendation:
          "We recommend consulting with a RECA specialist before proceeding.",
        canBypass: true,
      });
    }

    return NextResponse.json({
      eligible: true,
      eligibilityData,
      existingClaimCount: existingClaims.length,
      nextClaimOrder: existingClaims.length + 1,
      message: "This claim appears to meet RECA eligibility requirements.",
    });
  } catch (error) {
    console.error("Error checking subsequent claim eligibility:", error);
    return NextResponse.json(
      {
        error: "Failed to check eligibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Create Placeholder Claimant API
 *
 * Creates a minimal claimant record for subsequent claims.
 * This claimant will then be used to create a ClaimSubscription.
 * Once paid, user can start the RECA form for this claimant.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureServiceSubscriptionForUser } from "@/lib/ensure-service-subscription";

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
    const { claimType, eligibilityData } = body;

    // Verify user has service subscription.
    // Backfill legacy/QA accounts that already have claims.
    let subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    const existingClaims = await db.claimant.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!subscription && existingClaims.length > 0) {
      subscription = await ensureServiceSubscriptionForUser(session.user.id);
    }

    if (!subscription) {
      return NextResponse.json(
        {
          error: "No service subscription found",
          needsServiceTier: true,
          redirectTo: "/service-tiers",
        },
        { status: 400 }
      );
    }

    // Get claim count for naming
    // (We already queried existingClaims above)

    const claimOrder = existingClaims.length + 1;

    // Create placeholder claimant
    // Note: Name will be filled in during RECA form when user identifies the exposed individual
    const claimant = await db.claimant.create({
      data: {
        userId: session.user.id,
        email: session.user.email!,
        firstName: "Pending", // Will be filled in during form with actual exposed individual's name
        lastName: `Claim ${claimOrder}`, // Will be filled in during form
        phone: "",
        dob: new Date().toISOString(),
        address1: "",
        city: "",
        county: "",
        state: "",
        postalCode: "",
        claimType: claimType || "DOWNWINDER",
        eligibilityData: eligibilityData || undefined,
        leadStatus: "CONVERTED",
        conversionStage: "PAYMENT_PENDING", // Waiting for claim subscription payment
      },
    });

    return NextResponse.json({
      success: true,
      claimantId: claimant.id,
      claimOrder,
      message: `Placeholder claim created. Proceed with payment for Claim ${claimOrder}.`,
    });
  } catch (error) {
    console.error("Error creating placeholder claimant:", error);
    return NextResponse.json(
      {
        error: "Failed to create placeholder claim",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

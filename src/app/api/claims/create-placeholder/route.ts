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

    // Verify user has service subscription
    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No service subscription found" },
        { status: 400 }
      );
    }

    // Get claim count for naming
    const existingClaims = await db.claimant.findMany({
      where: { userId: session.user.id },
    });

    const claimOrder = existingClaims.length + 1;

    // Create placeholder claimant
    const claimant = await db.claimant.create({
      data: {
        userId: session.user.id,
        email: session.user.email!,
        firstName: `Claim ${claimOrder}`, // Placeholder - will be filled in during form
        lastName: session.user.name || "",
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

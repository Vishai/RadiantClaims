/**
 * Cancel Claim Subscription API
 *
 * Cancels a claim subscription and recalculates pricing for remaining claims.
 * Handles:
 * - Cancelling Stripe subscription
 * - Reordering remaining claims
 * - Updating monthly fees based on new order
 * - Refunding setup fee (lawyer track only, if applicable)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  cancelClaimSubscription,
  getTotalMonthlyFee,
} from "@/lib/claim-subscription-manager";

export const dynamic = "force-dynamic";

/**
 * POST /api/claims/[claimId]/cancel-subscription
 *
 * Cancels the subscription for a specific claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = params;

    // Get claimant and verify ownership
    const claimant = await db.claimant.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        claimSubscription: true,
      },
    });

    if (!claimant) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claimant.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this claim" },
        { status: 403 }
      );
    }

    if (!claimant.claimSubscription) {
      return NextResponse.json(
        { error: "No active subscription for this claim" },
        { status: 400 }
      );
    }

    if (claimant.claimSubscription.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: `Claim subscription is already ${claimant.claimSubscription.status.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    // Get old monthly fee before cancellation
    const oldMonthlyFee = await getTotalMonthlyFee(
      claimant.claimSubscription.serviceSubscriptionId
    );

    // Cancel the claim subscription
    const result = await cancelClaimSubscription(claimant.claimSubscription.id);

    // Get new monthly fee after cancellation
    const newMonthlyFee = await getTotalMonthlyFee(
      claimant.claimSubscription.serviceSubscriptionId
    );

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "SUBSCRIPTION_CANCELED",
      resourceType: "ClaimSubscription",
      resourceId: claimant.claimSubscription.id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        claimantId: claimant.id,
        claimOrder: result.cancelled.claimOrder,
        oldMonthlyFee,
        newMonthlyFee,
        recalculatedClaims: result.recalculated.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Claim subscription cancelled successfully",
      cancelled: {
        claimId: claimant.id,
        claimOrder: result.cancelled.claimOrder,
        monthlyFee: result.cancelled.monthlyFeeAmount,
      },
      recalculated: result.recalculated.map((r) => ({
        claimId: r.id,
        newClaimOrder: r.newOrder,
        newMonthlyFee: r.newMonthlyFee,
      })),
      totals: {
        oldMonthlyTotal: oldMonthlyFee,
        newMonthlyTotal: newMonthlyFee,
        monthlySavings: oldMonthlyFee - newMonthlyFee,
      },
    });
  } catch (error) {
    console.error("Error cancelling claim subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel claim subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claims/[claimId]/cancel-subscription
 *
 * Preview what would happen if this claim subscription was cancelled
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = params;

    // Get claimant and verify ownership
    const claimant = await db.claimant.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        claimSubscription: {
          include: {
            serviceSubscription: true,
          },
        },
      },
    });

    if (!claimant || claimant.userId !== session.user.id) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (!claimant.claimSubscription) {
      return NextResponse.json(
        { error: "No active subscription for this claim" },
        { status: 400 }
      );
    }

    // Get all active claims
    const activeClaims = await db.claimSubscription.findMany({
      where: {
        serviceSubscriptionId: claimant.claimSubscription.serviceSubscriptionId,
        status: "ACTIVE",
      },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        claimant: {
          createdAt: "asc",
        },
      },
    });

    // Calculate current monthly total
    const currentMonthlyTotal = activeClaims.reduce(
      (sum, c) => sum + c.monthlyFeeAmount,
      0
    );

    // Calculate what monthly total would be after cancellation
    const remainingClaims = activeClaims.filter(
      (c) => c.id !== claimant.claimSubscription!.id
    );
    const newMonthlyTotal = remainingClaims.reduce(
      (sum, c) => sum + c.monthlyFeeAmount,
      0
    );

    // For DIY, check if cancelling claim 1 would affect claim 2
    const tier = claimant.claimSubscription.serviceSubscription.tier;
    let affectedClaims: Array<{
      claimId: string;
      claimName: string;
      currentOrder: number;
      newOrder: number;
      currentMonthlyFee: number;
      newMonthlyFee: number;
      feeChange: number;
    }> = [];

    if (
      tier === "DIY_PREP" &&
      claimant.claimSubscription.claimOrder === 1 &&
      remainingClaims.length > 0
    ) {
      // Claim 2 would become claim 1 (fee increases from $14.99 to $24.99)
      const claim2 = remainingClaims[0];
      affectedClaims.push({
        claimId: claim2.claimant.id,
        claimName: `${claim2.claimant.firstName} ${claim2.claimant.lastName}`,
        currentOrder: claim2.claimOrder,
        newOrder: 1,
        currentMonthlyFee: claim2.monthlyFeeAmount,
        newMonthlyFee: 24.99,
        feeChange: 24.99 - claim2.monthlyFeeAmount,
      });
    }

    return NextResponse.json({
      currentClaim: {
        claimId: claimant.id,
        claimName: `${claimant.firstName} ${claimant.lastName}`,
        claimOrder: claimant.claimSubscription.claimOrder,
        monthlyFee: claimant.claimSubscription.monthlyFeeAmount,
      },
      impact: {
        currentMonthlyTotal,
        newMonthlyTotal,
        monthlySavings: currentMonthlyTotal - newMonthlyTotal,
        affectedClaims,
      },
      remainingClaimsCount: remainingClaims.length,
      canCancel: activeClaims.length > 0, // Can always cancel
      warnings:
        affectedClaims.length > 0
          ? [
              `Cancelling this claim will increase monthly fee for ${affectedClaims[0].claimName} from $${affectedClaims[0].currentMonthlyFee.toFixed(2)} to $${affectedClaims[0].newMonthlyFee.toFixed(2)}`,
            ]
          : [],
    });
  } catch (error) {
    console.error("Error previewing claim cancellation:", error);
    return NextResponse.json(
      {
        error: "Failed to preview cancellation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

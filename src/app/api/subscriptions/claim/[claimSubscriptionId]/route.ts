import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/subscriptions/claim/[claimSubscriptionId]
 * Get a single claim subscription by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { claimSubscriptionId: string } }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimSubscriptionId } = params;

    // Get claim subscription with claimant details
    const claimSubscription = await db.claimSubscription.findUnique({
      where: { id: claimSubscriptionId },
      include: {
        claimant: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        serviceSubscription: {
          select: {
            id: true,
            userId: true,
            tier: true,
          },
        },
      },
    });

    if (!claimSubscription) {
      return NextResponse.json(
        { error: "Claim subscription not found" },
        { status: 404 }
      );
    }

    // Verify user owns this claim subscription
    if (claimSubscription.serviceSubscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - not your claim subscription" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: claimSubscription.id,
      claimantId: claimSubscription.claimantId,
      serviceSubscriptionId: claimSubscription.serviceSubscriptionId,
      claimOrder: claimSubscription.claimOrder,
      setupFeePaid: claimSubscription.setupFeePaid,
      setupFeeAmount: claimSubscription.setupFeeAmount,
      setupFeeRefunded: claimSubscription.setupFeeRefunded,
      monthlyFeeAmount: claimSubscription.monthlyFeeAmount,
      status: claimSubscription.status,
      startedAt: claimSubscription.startedAt.toISOString(),
      canceledAt: claimSubscription.canceledAt?.toISOString() || null,
      claimant: claimSubscription.claimant,
      tier: claimSubscription.serviceSubscription.tier,
    });
  } catch (error) {
    console.error("Error fetching claim subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch claim subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

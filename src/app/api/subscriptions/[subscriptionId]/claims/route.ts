import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/subscriptions/[subscriptionId]/claims
 * Get all claims (subscribed and unsubscribed) for a service subscription
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = params;

    // Verify user owns this subscription
    const subscription = await db.serviceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - not your subscription" },
        { status: 403 }
      );
    }

    // Get all claim subscriptions for this service subscription
    const claimSubscriptions = await db.claimSubscription.findMany({
      where: { serviceSubscriptionId: subscriptionId },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { claimOrder: "asc" },
    });

    // Get all claimants owned by this user
    const allUserClaimants = await db.claimant.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        userId: true,
      },
    });

    // Find claimants without subscriptions
    const subscribedClaimantIds = new Set(
      claimSubscriptions.map((cs) => cs.claimantId)
    );
    const unsubscribedClaims = allUserClaimants.filter(
      (claimant) => !subscribedClaimantIds.has(claimant.id)
    );

    return NextResponse.json({
      claimSubscriptions: claimSubscriptions.map((cs) => ({
        id: cs.id,
        claimantId: cs.claimantId,
        claimOrder: cs.claimOrder,
        setupFeePaid: cs.setupFeePaid,
        setupFeeAmount: cs.setupFeeAmount,
        setupFeeRefunded: cs.setupFeeRefunded,
        monthlyFeeAmount: cs.monthlyFeeAmount,
        status: cs.status,
        startedAt: cs.startedAt.toISOString(),
        canceledAt: cs.canceledAt?.toISOString() || null,
        claimant: cs.claimant,
      })),
      unsubscribedClaims,
      totalMonthlyFee: claimSubscriptions
        .filter((cs) => cs.status === "ACTIVE" && cs.setupFeePaid)
        .reduce((sum, cs) => sum + cs.monthlyFeeAmount, 0),
    });
  } catch (error) {
    console.error("Error fetching claim subscriptions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch claim subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

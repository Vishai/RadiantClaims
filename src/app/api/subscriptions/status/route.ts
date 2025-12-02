import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/status
 *
 * Returns the current user's service subscription status.
 * Used by the RECA form to determine if user has paid and can access the form.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        referredToFirm: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // No subscription = needs to select a tier
    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        needsToSelectTier: true,
        tier: null,
        status: null,
        canAccessForms: false,
      });
    }

    // Legal path users - must have ACTIVE status (after first payment)
    if (subscription.tier === "LEGAL_REP") {
      const canAccessForms = subscription.status === "ACTIVE";

      return NextResponse.json({
        hasSubscription: true,
        needsToSelectTier: false,
        tier: "LEGAL_REP",
        status: subscription.status,
        canAccessForms,
        needsPayment: !canAccessForms,
        referredToFirm: subscription.referredToFirm,
        referredAt: subscription.referredAt,
      });
    }

    // DIY path users - must have ACTIVE status (set by webhook after payment)
    // OR have setupFeePaid flag set (legacy/manual cases)
    const canAccessForms =
      subscription.tier === "DIY_PREP" &&
      (subscription.status === "ACTIVE" || subscription.setupFeePaid === true);

    return NextResponse.json({
      hasSubscription: true,
      needsToSelectTier: false,
      tier: subscription.tier,
      status: subscription.status,
      setupFeePaid: subscription.setupFeePaid,
      setupFeePaidAt: subscription.setupFeePaidAt,
      nextBillingDate: subscription.nextBillingDate,
      canAccessForms,
      needsPayment: !canAccessForms,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

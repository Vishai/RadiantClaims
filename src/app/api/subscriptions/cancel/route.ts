/**
 * POST /api/subscriptions/cancel
 *
 * Cancels the user's subscription.
 * - DIY subscriptions will be canceled in Stripe
 * - Legal subscriptions will be marked as canceled (no billing involved)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (subscription.status === "CANCELED") {
      return NextResponse.json(
        { error: "Subscription is already canceled" },
        { status: 400 }
      );
    }

    // Cancel Stripe subscription if it exists (DIY tier)
    if (subscription.tier === "DIY_PREP" && subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription status in database
    await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        cancelReason: "User requested cancellation",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_CANCELED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          tier: subscription.tier,
          canceledAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your subscription has been canceled successfully.",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

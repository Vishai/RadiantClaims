/**
 * Create Stripe Monthly Subscription for DIY Path
 *
 * This route is called AFTER the setup fee has been paid to create
 * the recurring $24.99/month subscription.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (!subscription.setupFeePaid) {
      return NextResponse.json(
        {
          error: "Setup fee must be paid before creating monthly subscription",
        },
        { status: 400 }
      );
    }

    if (subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Monthly subscription already exists" },
        { status: 400 }
      );
    }

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID not found" },
        { status: 400 }
      );
    }

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: subscription.stripeCustomerId,
      items: [
        {
          price: STRIPE_CONFIG.DIY_MONTHLY.priceId,
        },
      ],
      metadata: {
        userId: session.user.id,
        subscriptionId: subscription.id,
      },
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    // Calculate next billing date
    const subscriptionData = stripeSubscription as Stripe.Subscription;
    const currentPeriodEnd =
      subscriptionData.items.data[0]?.current_period_end ?? null;
    const nextBillingDate =
      currentPeriodEnd !== null ? new Date(currentPeriodEnd * 1000) : null;
    const billingCycleDay = nextBillingDate?.getDate() ?? null;

    // Update subscription record
    await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        billingCycleDay,
        nextBillingDate,
        lastBillingDate: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          stripeSubscriptionId: stripeSubscription.id,
          billingCycleDay,
          monthlyAmount: 24.99,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: stripeSubscription.id,
      nextBillingDate,
    });
  } catch (error) {
    console.error("Error creating monthly subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to create monthly subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

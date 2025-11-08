/**
 * Create Monthly-Only Subscription (No Setup Fee)
 *
 * This route creates a DIY subscription that starts with monthly billing immediately,
 * skipping the $149.99 setup fee. Used for:
 * - Pilot accounts
 * - Promotional campaigns
 * - Special circumstances where setup fee is waived
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  applyTieredDiscount,
  recordPromoCodeUsage,
} from "@/lib/promo-code-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { promoCode } = await req.json();

    // Check if user already has a subscription
    const existingSubscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription && existingSubscription.setupFeePaid) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    // Validate promo code if provided
    let promoCodeRecord = null;
    let tieredDiscountResult = null;
    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findUnique({
        where: { code: promoCode },
      });

      if (!promoCodeRecord) {
        return NextResponse.json(
          { error: "Invalid promo code" },
          { status: 400 }
        );
      }

      if (!promoCodeRecord.isActive) {
        return NextResponse.json(
          { error: "This promo code is no longer active" },
          { status: 400 }
        );
      }

      if (promoCodeRecord.expiresAt && promoCodeRecord.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "This promo code has expired" },
          { status: 400 }
        );
      }

      if (
        promoCodeRecord.maxUses &&
        promoCodeRecord.currentUses >= promoCodeRecord.maxUses
      ) {
        return NextResponse.json(
          { error: "This promo code has reached its usage limit" },
          { status: 400 }
        );
      }

      // Verify promo code allows waiving setup fee
      if (
        promoCodeRecord.type !== "WAIVE_SETUP" &&
        promoCodeRecord.type !== "PILOT_ACCOUNT"
      ) {
        return NextResponse.json(
          {
            error: "This promo code does not waive the setup fee",
          },
          { status: 400 }
        );
      }

      // Check path restrictions
      if (
        promoCodeRecord.allowedTiers.length > 0 &&
        !promoCodeRecord.allowedTiers.includes("DIY_PREP")
      ) {
        return NextResponse.json(
          {
            error: "This promo code is not valid for the DIY path",
          },
          { status: 400 }
        );
      }

      // Apply tiered discount if enabled
      if (promoCodeRecord.useTieredDiscounts) {
        tieredDiscountResult = await applyTieredDiscount(
          promoCodeRecord.id,
          24.99 // Monthly fee amount
        );
      }
    }

    // Get or create Stripe customer
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name || undefined,
      metadata: {
        userId: session.user.id,
      },
    });

    // Create or update subscription record
    const isPilot = promoCodeRecord?.type === "PILOT_ACCOUNT";
    const pilotExpiresAt = isPilot
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      : null;

    const subscription = await prisma.serviceSubscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        tier: "DIY_PREP",
        status: "ACTIVE",
        setupFeePaid: true, // Mark as paid since we're waiving it
        setupFeeWaived: true,
        setupFeeAmount: 0,
        setupFeePaidAt: new Date(),
        monthlyFeeAmount: 24.99,
        stripeCustomerId: customer.id,
        promoCodeId: promoCodeRecord?.id,
        isPilotAccount: isPilot,
        pilotExpiresAt,
        stripeCouponId: promoCodeRecord?.stripeCouponId,
      },
      update: {
        stripeCustomerId: customer.id,
        setupFeeWaived: true,
        promoCodeId: promoCodeRecord?.id,
        isPilotAccount: isPilot,
        pilotExpiresAt,
      },
    });

    // Create Stripe subscription starting immediately
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: STRIPE_CONFIG.DIY_MONTHLY.priceId,
        },
      ],
      metadata: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        promoCode: promoCode || "",
        wavedSetupFee: "true",
      },
      // Apply tiered discount coupon if available, or standard coupon for pilot accounts
      ...(tieredDiscountResult?.stripeCouponId
        ? { coupon: tieredDiscountResult.stripeCouponId }
        : isPilot && promoCodeRecord?.stripeCouponId
          ? { coupon: promoCodeRecord.stripeCouponId }
          : {}),
    });

    // Calculate next billing date
    const nextBillingDate = new Date(
      (stripeSubscription.current_period_end || 0) * 1000
    );
    const billingCycleDay = nextBillingDate.getDate();

    // Update subscription with Stripe details
    await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        billingCycleDay,
        nextBillingDate,
        lastBillingDate: new Date(),
      },
    });

    // Increment promo code usage and record detailed usage
    if (promoCodeRecord) {
      await prisma.promoCode.update({
        where: { id: promoCodeRecord.id },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });

      // Record detailed usage tracking
      await recordPromoCodeUsage({
        promoCodeId: promoCodeRecord.id,
        tierId: tieredDiscountResult?.tier?.id || null,
        subscriptionId: subscription.id,
        userId: session.user.id,
        discountApplied: tieredDiscountResult?.discountApplied || 0,
        discountType: tieredDiscountResult?.discountType || "NONE",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    }

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
          tier: "DIY_PREP",
          setupFeeWaived: true,
          isPilotAccount: isPilot,
          promoCode: promoCode || null,
          stripeSubscriptionId: stripeSubscription.id,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: stripeSubscription.id,
        nextBillingDate,
        setupFeeWaived: true,
        isPilotAccount: isPilot,
      },
    });
  } catch (error) {
    console.error("Error creating monthly-only subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

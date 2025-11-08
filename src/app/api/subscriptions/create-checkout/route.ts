/**
 * Create Stripe Checkout Session for DIY Path Setup Fee
 *
 * This route creates a Stripe Checkout session for the $149.99 setup fee.
 * After payment, it will create a ServiceSubscription record and redirect
 * the user to continue with the RECA form.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  applyTieredDiscount,
  recordPromoCodeUsage,
  type TieredDiscountResult,
} from "@/lib/promo-code-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to purchase a subscription" },
        { status: 401 }
      );
    }

    const { intakeSessionId, promoCode } = await req.json();

    if (!intakeSessionId) {
      return NextResponse.json(
        { error: "Intake session ID is required" },
        { status: 400 }
      );
    }

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

    // Verify the intake session belongs to this user or create link
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: intakeSessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Intake session not found" },
        { status: 404 }
      );
    }

    // Validate promo code if provided
    let promoCodeRecord = null;
    let discounts: string[] = [];
    let tieredDiscountResult: TieredDiscountResult | null = null;
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

      // Apply tiered discount if enabled, otherwise use standard discount
      if (promoCodeRecord.useTieredDiscounts) {
        tieredDiscountResult = await applyTieredDiscount(
          promoCodeRecord.id,
          149.99 // Setup fee amount
        );
        if (tieredDiscountResult.stripeCouponId) {
          discounts.push(tieredDiscountResult.stripeCouponId);
        }
      } else {
        // Add standard Stripe coupon if available
        if (promoCodeRecord.stripeCouponId) {
          discounts.push(promoCodeRecord.stripeCouponId);
        }
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

    const tieredStripeCouponId = tieredDiscountResult?.stripeCouponId || null;
    const appliedStripeCouponId =
      tieredStripeCouponId || promoCodeRecord?.stripeCouponId || null;
    const appliedDiscountPercent =
      tieredDiscountResult?.discountType === "PERCENT"
        ? (tieredDiscountResult?.tier?.percentOff ?? null)
        : (promoCodeRecord?.percentOff ?? null);
    const appliedDiscountAmount =
      tieredDiscountResult?.discountType === "AMOUNT"
        ? (tieredDiscountResult?.tier?.amountOff ??
          tieredDiscountResult?.discountApplied ??
          null)
        : (promoCodeRecord?.amountOff ?? null);

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
        setupFeePaid: false,
        setupFeeAmount: 149.99,
        monthlyFeeAmount: 24.99,
        stripeCustomerId: customer.id,
        promoCodeId: promoCodeRecord?.id,
        isPilotAccount: isPilot,
        pilotExpiresAt,
        stripeCouponId: appliedStripeCouponId,
        discountPercent: appliedDiscountPercent,
        discountAmount: appliedDiscountAmount,
      },
      update: {
        stripeCustomerId: customer.id,
        promoCodeId: promoCodeRecord?.id,
        isPilotAccount: isPilot,
        pilotExpiresAt,
        stripeCouponId: appliedStripeCouponId,
        discountPercent: appliedDiscountPercent,
        discountAmount: appliedDiscountAmount,
      },
    });

    // Link intake session to subscription
    await prisma.intakeSession.update({
      where: { id: intakeSessionId },
      data: { serviceSubscriptionId: subscription.id },
    });

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_CONFIG.DIY_SETUP_FEE.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/reca/form/${intakeSessionId}?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/reca/start?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        intakeSessionId,
        paymentType: "SETUP_FEE",
        promoCode: promoCode || "",
      },
      // Apply Stripe coupon if available from promo code
      ...(discounts.length > 0 && {
        discounts: discounts.map((coupon) => ({ coupon })),
      }),
      allow_promotion_codes: true, // Still allow Stripe's native promo codes
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        paymentType: "SETUP_FEE",
        amount: 149.99,
        currency: "USD",
        status: "PENDING",
        stripePaymentIntentId: checkoutSession.payment_intent as string,
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
          checkoutSessionId: checkoutSession.id,
          promoCode: promoCode || null,
          isPilotAccount: isPilot,
        }),
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

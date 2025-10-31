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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to purchase a subscription" },
        { status: 401 }
      );
    }

    const { intakeSessionId } = await req.json();

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

    // Get or create Stripe customer
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name || undefined,
      metadata: {
        userId: session.user.id,
      },
    });

    // Create or update subscription record
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
      },
      update: {
        stripeCustomerId: customer.id,
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
      },
      allow_promotion_codes: true,
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

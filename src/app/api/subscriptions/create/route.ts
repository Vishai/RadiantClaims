import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, policyType, policyVersion, ipAddress } = body;

    if (!tier || !["DIY_PREP", "LEGAL_REP"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Check if user already has a subscription
    const existingSubscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Subscription already exists" },
        { status: 400 }
      );
    }

    // Create policy acceptance record
    const policyAcceptance = await db.policyAcceptance.create({
      data: {
        userId: session.user.id,
        policyType: policyType || "TERMS_OF_SERVICE",
        policyVersion: policyVersion || "1.0",
        policyText:
          tier === "DIY_PREP"
            ? "DIY Terms Agreement"
            : "Legal Representation Agreement",
        ipAddress:
          ipAddress || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (tier === "LEGAL_REP") {
      // For Legal Rep: No payment needed, create subscription immediately
      const subscription = await db.serviceSubscription.create({
        data: {
          userId: session.user.id,
          tier: "LEGAL_REP",
          status: "ACTIVE",
          setupFeePaid: true, // No setup fee for legal
          setupFeeAmount: 0,
          setupFeePaidAt: new Date(),
        },
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          tier: "LEGAL_REP",
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      return NextResponse.json({
        success: true,
        subscription,
        redirectTo: "/portal",
      });
    } else {
      // For DIY: Create subscription and Stripe checkout session
      const subscription = await db.serviceSubscription.create({
        data: {
          userId: session.user.id,
          tier: "DIY_PREP",
          status: "ACTIVE",
          setupFeePaid: false,
          setupFeeAmount: 149.99,
          monthlyFeeAmount: 24.99,
        },
      });

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
        },
      });

      // Update subscription with Stripe customer ID
      await db.serviceSubscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customer.id },
      });

      // Create Stripe Checkout Session for setup fee + monthly subscription
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID_DIY_SETUP!,
            quantity: 1,
          },
          {
            price: process.env.STRIPE_PRICE_ID_DIY_MONTHLY!,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/portal?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/service-tiers?payment=canceled`,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          tier: "DIY_PREP",
          stripeCheckoutSessionId: checkoutSession.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      return NextResponse.json({
        success: true,
        subscription,
        checkoutUrl: checkoutSession.url,
      });
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

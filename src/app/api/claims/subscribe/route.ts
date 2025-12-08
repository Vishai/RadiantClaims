/**
 * Create Claim Subscription API
 *
 * Creates a per-claim subscription when a user files a new claim.
 * Handles:
 * - Determining claim order
 * - Calculating pricing
 * - Creating Stripe subscription
 * - Charging setup fee
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  createClaimSubscription,
  chargeClaimSetupFee,
  getActiveClaimCount,
} from "@/lib/claim-subscription-manager";
import {
  calculateClaimPricing,
  type ServiceTier,
} from "@/lib/pricing-calculator";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/claims/subscribe
 *
 * Body:
 * {
 *   claimantId: string;  // The claimant/claim to subscribe
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { claimantId } = body;

    if (!claimantId) {
      return NextResponse.json(
        { error: "claimantId is required" },
        { status: 400 }
      );
    }

    // Verify claimant exists and belongs to user
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      include: { user: { include: { serviceSubscription: true } } },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    if (claimant.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this claimant" },
        { status: 403 }
      );
    }

    // Check if user has a service subscription
    if (!claimant.user?.serviceSubscription) {
      return NextResponse.json(
        {
          error:
            "No service subscription found. Please subscribe to a service tier first.",
          code: "NO_SERVICE_SUBSCRIPTION",
        },
        { status: 400 }
      );
    }

    const serviceSubscription = claimant.user.serviceSubscription;
    const tier = serviceSubscription.tier as ServiceTier;

    // Check if claim already has a subscription
    const existingClaimSub = await db.claimSubscription.findUnique({
      where: { claimantId },
    });

    if (existingClaimSub) {
      return NextResponse.json(
        {
          error: "Claim already has a subscription",
          claimSubscription: existingClaimSub,
        },
        { status: 400 }
      );
    }

    // Get current claim count to show pricing preview
    const currentClaimCount = await getActiveClaimCount(serviceSubscription.id);
    const newClaimOrder = currentClaimCount + 1;
    const pricing = calculateClaimPricing(tier, newClaimOrder);

    // Ensure Stripe customer exists
    let stripeCustomerId = serviceSubscription.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripe = (await import("@/lib/stripe")).stripe;
      const customer = await stripe.customers.create({
        email: claimant.user.email || undefined,
        name: claimant.user.name || undefined,
        metadata: {
          userId: claimant.user.id,
          serviceSubscriptionId: serviceSubscription.id,
        },
      });

      await db.serviceSubscription.update({
        where: { id: serviceSubscription.id },
        data: { stripeCustomerId: customer.id },
      });

      stripeCustomerId = customer.id;
    }

    // Create claim subscription
    const claimSubscription = await createClaimSubscription({
      claimantId,
      serviceSubscriptionId: serviceSubscription.id,
      tier,
      stripeCustomerId,
    });

    // Charge setup fee
    const paymentIntent = await chargeClaimSetupFee(
      claimSubscription.id,
      stripeCustomerId
    );

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "CLAIM_SUBSCRIPTION_CREATED",
      resourceType: "ClaimSubscription",
      resourceId: claimSubscription.id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        claimantId,
        claimOrder: claimSubscription.claimOrder,
        tier,
        setupFeeAmount: claimSubscription.setupFeeAmount,
        monthlyFeeAmount: claimSubscription.monthlyFeeAmount,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      success: true,
      claimSubscription: {
        id: claimSubscription.id,
        claimOrder: claimSubscription.claimOrder,
        setupFeeAmount: claimSubscription.setupFeeAmount,
        monthlyFeeAmount: claimSubscription.monthlyFeeAmount,
        status: claimSubscription.status,
      },
      pricing: {
        claimOrder: newClaimOrder,
        setupFee: pricing.setupFee,
        monthlyFee: pricing.monthlyFee,
        setupFeeRefundable: pricing.setupFeeRefundable,
      },
      payment: {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
      message: `Claim ${newClaimOrder} subscription created. Setup fee: $${pricing.setupFee.toFixed(2)}, Monthly: $${pricing.monthlyFee.toFixed(2)}/mo`,
    });
  } catch (error) {
    console.error("Error creating claim subscription:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment setup failed",
          code: error.code ?? "STRIPE_ERROR",
          details: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create claim subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claims/subscribe?claimantId=xxx
 *
 * Get pricing preview for a claim subscription
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const claimantId = searchParams.get("claimantId");

    if (!claimantId) {
      return NextResponse.json(
        { error: "claimantId is required" },
        { status: 400 }
      );
    }

    // Verify claimant exists and belongs to user
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      include: { user: { include: { serviceSubscription: true } } },
    });

    if (!claimant || claimant.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    if (!claimant.user?.serviceSubscription) {
      return NextResponse.json(
        { error: "No service subscription found" },
        { status: 400 }
      );
    }

    const serviceSubscription = claimant.user.serviceSubscription;
    const tier = serviceSubscription.tier as ServiceTier;

    // Get current claim count
    const currentClaimCount = await getActiveClaimCount(serviceSubscription.id);
    const newClaimOrder = currentClaimCount + 1;

    // Calculate pricing
    const pricing = calculateClaimPricing(tier, newClaimOrder);

    return NextResponse.json({
      claimOrder: newClaimOrder,
      currentActiveClaimsCount: currentClaimCount,
      pricing: {
        setupFee: pricing.setupFee,
        monthlyFee: pricing.monthlyFee,
        setupFeeRefundable: pricing.setupFeeRefundable,
      },
      tier,
    });
  } catch (error) {
    console.error("Error getting claim pricing:", error);
    return NextResponse.json(
      {
        error: "Failed to get pricing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

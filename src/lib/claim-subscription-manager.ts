/**
 * Claim Subscription Manager
 *
 * Handles all per-claim subscription operations:
 * - Creating claim subscriptions
 * - Calculating pricing based on claim order
 * - Handling claim cancellations with recalculation
 * - Managing Stripe subscriptions per claim
 */

import { db } from "./db";
import { stripe, STRIPE_CONFIG } from "./stripe";
import {
  calculateClaimPricing,
  recalculateClaimOrders,
} from "./pricing-calculator";
import type { ServiceTier } from "./pricing-calculator";

export interface CreateClaimSubscriptionParams {
  claimantId: string;
  serviceSubscriptionId: string;
  tier: ServiceTier;
  stripeCustomerId: string;
}

export interface ClaimSubscriptionWithDetails {
  id: string;
  claimantId: string;
  claimOrder: number;
  setupFeePaid: boolean;
  setupFeeAmount: number;
  monthlyFeeAmount: number;
  stripeSubscriptionId: string | null;
  status: string;
}

/**
 * Get the number of active claims for a service subscription
 */
export async function getActiveClaimCount(
  serviceSubscriptionId: string
): Promise<number> {
  return await db.claimSubscription.count({
    where: {
      serviceSubscriptionId,
      status: "ACTIVE",
    },
  });
}

/**
 * Get all active claim subscriptions for a service subscription
 * Ordered by creation date (oldest first)
 */
export async function getActiveClaimSubscriptions(
  serviceSubscriptionId: string
) {
  return await db.claimSubscription.findMany({
    where: {
      serviceSubscriptionId,
      status: "ACTIVE",
    },
    include: {
      claimant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      claimant: {
        createdAt: "asc", // Oldest claim = claim 1
      },
    },
  });
}

/**
 * Create a new claim subscription
 * Automatically determines claim order and pricing
 */
export async function createClaimSubscription(
  params: CreateClaimSubscriptionParams
): Promise<ClaimSubscriptionWithDetails> {
  const { claimantId, serviceSubscriptionId, tier, stripeCustomerId } = params;

  // Check if claim subscription already exists
  const existing = await db.claimSubscription.findUnique({
    where: { claimantId },
  });

  if (existing) {
    throw new Error("Claim subscription already exists for this claimant");
  }

  // Get current active claim count to determine claim order
  const activeClaimCount = await getActiveClaimCount(serviceSubscriptionId);
  const claimOrder = activeClaimCount + 1;

  // Calculate pricing based on tier and claim order
  const pricing = calculateClaimPricing(tier, claimOrder);

  // Determine which Stripe price ID to use for monthly fee
  let monthlyStripePriceId: string;

  if (tier === "DIY_PREP") {
    monthlyStripePriceId =
      claimOrder === 1
        ? STRIPE_CONFIG.DIY_MONTHLY_FIRST_CLAIM.priceId
        : STRIPE_CONFIG.DIY_MONTHLY_ADDITIONAL.priceId;
  } else {
    // LEGAL_REP - same price for all claims
    monthlyStripePriceId = STRIPE_CONFIG.LEGAL_MONTHLY_PER_CLAIM.priceId;
  }

  // Create Stripe subscription for this claim's monthly fee (if applicable)
  // Some environments/configurations use a one-time setup fee only.
  let stripeSubscriptionId: string | null = null;
  let stripePriceId: string | null = null;

  if (pricing.monthlyFee > 0) {
    if (!monthlyStripePriceId) {
      throw new Error(
        "Monthly fee pricing is configured but STRIPE price id is missing"
      );
    }

    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: monthlyStripePriceId }],
      trial_period_days: 30, // First month covered by setup fee
      metadata: {
        claimantId,
        serviceSubscriptionId,
        claimOrder: claimOrder.toString(),
        tier,
      },
    });

    stripeSubscriptionId = stripeSubscription.id;
    stripePriceId = monthlyStripePriceId;
  }

  // Create claim subscription in database
  const claimSubscription = await db.claimSubscription.create({
    data: {
      claimantId,
      serviceSubscriptionId,
      claimOrder,
      setupFeeAmount: pricing.setupFee,
      monthlyFeeAmount: pricing.monthlyFee,
      setupFeePaid: false, // Will be set true after setup fee payment
      setupFeeRefunded: false,
      lawyerTrackNoDiscount: tier === "LEGAL_REP",
      stripeSubscriptionId,
      stripePriceId,
      status: "PENDING", // Will become ACTIVE after setup fee payment
    },
  });

  return claimSubscription as ClaimSubscriptionWithDetails;
}

/**
 * Charge setup fee for a claim
 * Returns Stripe PaymentIntent
 */
export async function chargeClaimSetupFee(
  claimSubscriptionId: string,
  stripeCustomerId: string
) {
  const claimSub = await db.claimSubscription.findUnique({
    where: { id: claimSubscriptionId },
    include: { serviceSubscription: true },
  });

  if (!claimSub) {
    throw new Error("Claim subscription not found");
  }

  if (claimSub.setupFeePaid) {
    throw new Error("Setup fee already paid");
  }

  const tier = claimSub.serviceSubscription.tier as ServiceTier;

  // Create one-time payment for setup fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(claimSub.setupFeeAmount * 100), // Convert to cents
    currency: "usd",
    customer: stripeCustomerId,
    description: `Setup fee for claim ${claimSub.claimOrder}`,
    metadata: {
      claimSubscriptionId: claimSub.id,
      claimantId: claimSub.claimantId,
      serviceSubscriptionId: claimSub.serviceSubscriptionId,
      tier,
      setupFee: "true",
    },
  });

  return paymentIntent;
}

/**
 * Mark setup fee as paid
 * Activates the claim subscription
 */
export async function markSetupFeePaid(claimSubscriptionId: string) {
  return await db.claimSubscription.update({
    where: { id: claimSubscriptionId },
    data: {
      setupFeePaid: true,
      setupFeePaidAt: new Date(),
      status: "ACTIVE",
    },
  });
}

/**
 * Cancel a claim subscription
 * Recalculates claim orders and monthly fees for remaining claims
 */
export async function cancelClaimSubscription(
  claimSubscriptionId: string
): Promise<{
  cancelled: ClaimSubscriptionWithDetails;
  recalculated: Array<{ id: string; newOrder: number; newMonthlyFee: number }>;
}> {
  const claimSub = await db.claimSubscription.findUnique({
    where: { id: claimSubscriptionId },
    include: {
      claimant: true,
      serviceSubscription: true,
    },
  });

  if (!claimSub) {
    throw new Error("Claim subscription not found");
  }

  // Cancel Stripe subscription for this claim
  if (claimSub.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(claimSub.stripeSubscriptionId);
  }

  // Mark as cancelled
  await db.claimSubscription.update({
    where: { id: claimSubscriptionId },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  // Get all remaining active claims
  const remainingClaims = await getActiveClaimSubscriptions(
    claimSub.serviceSubscriptionId
  );

  // Recalculate claim orders
  const newOrders = recalculateClaimOrders(
    remainingClaims.map((c) => ({
      id: c.id,
      currentOrder: c.claimOrder,
      createdAt: c.claimant.createdAt,
    }))
  );

  const tier = claimSub.serviceSubscription.tier as ServiceTier;
  const recalculated: Array<{
    id: string;
    newOrder: number;
    newMonthlyFee: number;
  }> = [];

  // Update each claim with new order and pricing
  for (const { id, newOrder } of newOrders) {
    const claim = remainingClaims.find((c) => c.id === id);
    if (!claim) continue;

    // Calculate new pricing
    const newPricing = calculateClaimPricing(tier, newOrder);

    // Determine new Stripe price ID
    let newStripePriceId: string;
    if (tier === "DIY_PREP") {
      newStripePriceId =
        newOrder === 1
          ? STRIPE_CONFIG.DIY_MONTHLY_FIRST_CLAIM.priceId
          : STRIPE_CONFIG.DIY_MONTHLY_ADDITIONAL.priceId;
    } else {
      newStripePriceId = STRIPE_CONFIG.LEGAL_MONTHLY_PER_CLAIM.priceId;
    }

    // Only update if something changed
    if (
      claim.claimOrder !== newOrder ||
      claim.monthlyFeeAmount !== newPricing.monthlyFee
    ) {
      // Update database
      await db.claimSubscription.update({
        where: { id },
        data: {
          claimOrder: newOrder,
          monthlyFeeAmount: newPricing.monthlyFee,
          stripePriceId: newStripePriceId,
        },
      });

      // Update Stripe subscription if price changed
      if (
        claim.stripeSubscriptionId &&
        claim.stripePriceId !== newStripePriceId
      ) {
        const subscription = await stripe.subscriptions.retrieve(
          claim.stripeSubscriptionId
        );

        await stripe.subscriptions.update(claim.stripeSubscriptionId, {
          items: [
            {
              id: subscription.items.data[0]?.id,
              price: newStripePriceId,
            },
          ],
          metadata: {
            ...subscription.metadata,
            claimOrder: newOrder.toString(),
          },
        });
      }

      recalculated.push({
        id,
        newOrder,
        newMonthlyFee: newPricing.monthlyFee,
      });
    }
  }

  return {
    cancelled: claimSub as ClaimSubscriptionWithDetails,
    recalculated,
  };
}

/**
 * Refund setup fee (lawyer track only)
 * Called when DOJ receives the claim
 */
export async function refundClaimSetupFee(claimSubscriptionId: string) {
  const claimSub = await db.claimSubscription.findUnique({
    where: { id: claimSubscriptionId },
    include: { serviceSubscription: true },
  });

  if (!claimSub) {
    throw new Error("Claim subscription not found");
  }

  if (claimSub.serviceSubscription.tier !== "LEGAL_REP") {
    throw new Error("Setup fee refunds only available for lawyer track");
  }

  if (!claimSub.setupFeePaid) {
    throw new Error("Setup fee not paid, nothing to refund");
  }

  if (claimSub.setupFeeRefunded) {
    throw new Error("Setup fee already refunded");
  }

  // TODO: Find the original payment intent and refund it
  // This requires storing the payment intent ID when setup fee is paid
  // For now, we'll just mark as refunded in the database

  await db.claimSubscription.update({
    where: { id: claimSubscriptionId },
    data: {
      setupFeeRefunded: true,
      setupFeeRefundedAt: new Date(),
    },
  });

  return claimSub;
}

/**
 * Get total monthly cost for all active claims in a subscription
 */
export async function getTotalMonthlyFee(
  serviceSubscriptionId: string
): Promise<number> {
  const claims = await db.claimSubscription.findMany({
    where: {
      serviceSubscriptionId,
      status: "ACTIVE",
    },
  });

  return claims.reduce((total, claim) => total + claim.monthlyFeeAmount, 0);
}

/**
 * Stripe Webhook Handlers for Per-Claim Subscriptions
 *
 * Additional handlers for claim-level subscription events
 */

import Stripe from "stripe";
import { db } from "./db";
import { markSetupFeePaid } from "./claim-subscription-manager";

/**
 * Handle payment_intent.succeeded for claim setup fees
 * This fires when a one-time setup fee payment completes
 */
export async function handleClaimSetupFeePayment(
  paymentIntent: Stripe.PaymentIntent
) {
  const metadata = paymentIntent.metadata;
  const claimSubscriptionId = metadata.claimSubscriptionId;
  const setupFee = metadata.setupFee;

  if (!claimSubscriptionId || setupFee !== "true") {
    // Not a claim setup fee payment
    return false;
  }

  console.log(`💰 Claim setup fee payment succeeded: ${claimSubscriptionId}`);

  // Mark setup fee as paid
  await markSetupFeePaid(claimSubscriptionId);

  // Create payment record
  await db.payment.create({
    data: {
      subscriptionId: metadata.serviceSubscriptionId as string,
      paymentType: "SETUP_FEE",
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      status: "COMPLETED",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
      metadata: JSON.stringify({
        claimSubscriptionId,
        claimantId: metadata.claimantId,
        tier: metadata.tier,
        claimSetupFee: true,
      }),
    },
  });

  // Create audit log
  if (metadata.claimantId) {
    const claimant = await db.claimant.findUnique({
      where: { id: metadata.claimantId },
      select: { userId: true },
    });

    if (claimant?.userId) {
      await db.auditLog.create({
        data: {
          userId: claimant.userId,
          action: "PAYMENT_SUCCEEDED",
          resourceType: "ClaimSubscription",
          resourceId: claimSubscriptionId,
          ipAddress: "stripe-webhook",
          metadata: JSON.stringify({
            paymentType: "CLAIM_SETUP_FEE",
            amount: paymentIntent.amount / 100,
            paymentIntentId: paymentIntent.id,
            tier: metadata.tier,
          }),
        },
      });
    }
  }

  return true; // Handled
}

/**
 * Handle invoice.payment_succeeded for claim monthly fees
 * This fires when a monthly subscription payment is successful
 */
export async function handleClaimMonthlyPayment(invoice: Stripe.Invoice) {
  const subscriptionMetadata =
    typeof invoice.subscription === "object"
      ? invoice.subscription?.metadata
      : undefined;

  const claimSubscriptionId = subscriptionMetadata?.claimSubscriptionId;

  if (!claimSubscriptionId) {
    // Not a claim subscription invoice
    return false;
  }

  console.log(`💰 Claim monthly payment succeeded: ${claimSubscriptionId}`);

  const claimSub = await db.claimSubscription.findUnique({
    where: { id: claimSubscriptionId },
    include: { serviceSubscription: true },
  });

  if (!claimSub) {
    console.error(`Claim subscription not found: ${claimSubscriptionId}`);
    return true; // Handled (even though error)
  }

  // Create payment record
  await db.payment.create({
    data: {
      subscriptionId: claimSub.serviceSubscriptionId,
      paymentType: "MONTHLY_FEE",
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: "COMPLETED",
      paidAt: new Date(),
      stripeInvoiceId: invoice.id,
      metadata: JSON.stringify({
        claimSubscriptionId,
        claimantId: claimSub.claimantId,
        claimOrder: claimSub.claimOrder,
        claimMonthlyFee: true,
      }),
    },
  });

  // Update last billing date (on serviceSubscription level)
  await db.serviceSubscription.update({
    where: { id: claimSub.serviceSubscriptionId },
    data: {
      lastBillingDate: new Date(),
    },
  });

  return true; // Handled
}

/**
 * Handle subscription cancellation for individual claims
 */
export async function handleClaimSubscriptionCancelled(
  subscription: Stripe.Subscription
) {
  const claimSubscriptionId = subscription.metadata.claimSubscriptionId;

  if (!claimSubscriptionId) {
    // Not a claim subscription
    return false;
  }

  console.log(`🚫 Claim subscription cancelled: ${claimSubscriptionId}`);

  // Update claim subscription status
  await db.claimSubscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "CANCELLED",
      canceledAt: new Date(),
    },
  });

  return true; // Handled
}

/**
 * Handle subscription updates for individual claims
 * This fires when a claim's monthly subscription is modified (e.g., price change due to reordering)
 */
export async function handleClaimSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const claimSubscriptionId = subscription.metadata.claimSubscriptionId;

  if (!claimSubscriptionId) {
    // Not a claim subscription
    return false;
  }

  console.log(`🔄 Claim subscription updated: ${claimSubscriptionId}`);

  // Update claim subscription with new stripe metadata if needed
  const claimSub = await db.claimSubscription.findUnique({
    where: { id: claimSubscriptionId },
  });

  if (claimSub) {
    // Check if price changed in Stripe
    const stripePrice = subscription.items.data[0]?.price;

    if (stripePrice && stripePrice.id !== claimSub.stripePriceId) {
      // Price was updated in Stripe, update our record
      await db.claimSubscription.update({
        where: { id: claimSubscriptionId },
        data: {
          stripePriceId: stripePrice.id,
          // Don't update monthlyFeeAmount here - that should only be updated
          // through our cancelClaimSubscription logic
        },
      });
    }
  }

  return true; // Handled
}

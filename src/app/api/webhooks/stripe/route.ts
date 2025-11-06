/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhook events including:
 * - checkout.session.completed (setup fee paid)
 * - invoice.payment_succeeded (monthly payment successful)
 * - invoice.payment_failed (monthly payment failed)
 * - customer.subscription.deleted (subscription canceled)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * This fires when the setup fee payment is successful
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, subscriptionId } = session.metadata || {};

  if (!userId || !subscriptionId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  console.log(`💰 Checkout completed for user ${userId}`);

  // Update subscription
  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      setupFeePaid: true,
      setupFeePaidAt: new Date(),
      status: "ACTIVE",
    },
  });

  // Update payment record
  if (session.payment_intent) {
    await prisma.payment.updateMany({
      where: {
        subscriptionId,
        stripePaymentIntentId: session.payment_intent as string,
      },
      data: {
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });
  } else {
    // Create payment record if it doesn't exist
    await prisma.payment.create({
      data: {
        subscriptionId,
        paymentType: "SETUP_FEE",
        amount: 149.99,
        currency: "USD",
        status: "COMPLETED",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PAYMENT_SUCCEEDED",
      resourceType: "Payment",
      resourceId: subscriptionId,
      ipAddress: "stripe-webhook",
      metadata: JSON.stringify({
        paymentType: "SETUP_FEE",
        amount: 149.99,
        checkoutSessionId: session.id,
      }),
    },
  });

  // Automatically create monthly subscription after setup fee, starting 31 days from now
  try {
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { promoCode: true },
    });

    if (subscription?.stripeCustomerId && !subscription.stripeSubscriptionId) {
      // Check if this is a pilot account or has setup fee waived
      // If setup fee was waived, they likely already have a subscription created
      if (subscription.setupFeeWaived || subscription.isPilotAccount) {
        console.log(
          `ℹ️  Skipping auto-subscription creation for pilot/waived account ${subscriptionId}`
        );
        return;
      }

      // Calculate the billing anchor date (31 days from now)
      const billingAnchorDate = new Date();
      billingAnchorDate.setDate(billingAnchorDate.getDate() + 31);
      const billingAnchorTimestamp = Math.floor(
        billingAnchorDate.getTime() / 1000
      );

      // Check if there's a Stripe coupon to apply
      const couponId = subscription.stripeCouponId || undefined;

      const stripeSubscription = await stripe.subscriptions.create({
        customer: subscription.stripeCustomerId,
        items: [{ price: STRIPE_CONFIG.DIY_MONTHLY.priceId }],
        billing_cycle_anchor: billingAnchorTimestamp,
        proration_behavior: "none",
        ...(couponId && { coupon: couponId }),
        metadata: {
          userId,
          subscriptionId,
          promoCode: subscription.promoCode?.code || "",
        },
      });

      const subscriptionData = stripeSubscription as Stripe.Subscription;
      const nextBillingDate = getNextBillingDate(subscriptionData);
      await prisma.serviceSubscription.update({
        where: { id: subscriptionId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          billingCycleDay: nextBillingDate?.getDate() ?? null,
          nextBillingDate,
          lastBillingDate: null, // No billing has occurred yet for the monthly subscription
        },
      });

      console.log(
        `✅ Monthly subscription created: ${stripeSubscription.id} (billing starts ${billingAnchorDate.toISOString()})`
      );
    }
  } catch (error) {
    console.error("Error creating monthly subscription:", error);
  }
}

/**
 * Handle invoice.payment_succeeded
 * This fires when a monthly subscription payment is successful
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.metadata?.subscriptionId;

  if (!subscriptionId) {
    console.log("No subscriptionId in invoice metadata, skipping");
    return;
  }

  console.log(
    `💰 Invoice payment succeeded for subscription ${subscriptionId}`
  );

  // Check if this is a pilot account that has expired
  const subscription = await prisma.serviceSubscription.findUnique({
    where: { id: subscriptionId },
  });

  if (
    subscription?.isPilotAccount &&
    subscription.pilotExpiresAt &&
    subscription.pilotExpiresAt < new Date()
  ) {
    console.log(
      `⚠️  Pilot account ${subscriptionId} has expired. Converting to regular billing.`
    );
    // Update to non-pilot status
    await prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        isPilotAccount: false,
        pilotExpiresAt: null,
      },
    });
  }

  // Create payment record
  await prisma.payment.create({
    data: {
      subscriptionId,
      paymentType: "MONTHLY_FEE",
      amount: (invoice.amount_paid || 0) / 100,
      currency: "USD",
      status: "COMPLETED",
      paidAt: new Date(),
      stripePaymentIntentId: getPaymentIntentId(invoice) ?? undefined,
      stripeInvoiceId: invoice.id,
    },
  });

  // Update subscription
  const stripeSubscriptionId = getStripeSubscriptionId(invoice);
  let nextBillingDate: Date | null = null;

  if (stripeSubscriptionId) {
    const subscriptionResponse =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscription = subscriptionResponse as Stripe.Subscription;
    nextBillingDate = getNextBillingDate(subscription);
  }

  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      lastBillingDate: new Date(),
      nextBillingDate,
    },
  });

  // Create audit log
  const userId = invoice.metadata?.userId;
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_SUCCEEDED",
        resourceType: "Payment",
        resourceId: subscriptionId,
        ipAddress: "stripe-webhook",
        metadata: JSON.stringify({
          paymentType: "MONTHLY_FEE",
          amount: (invoice.amount_paid || 0) / 100,
          invoiceId: invoice.id,
        }),
      },
    });
  }
}

/**
 * Handle invoice.payment_failed
 * This fires when a monthly subscription payment fails
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.metadata?.subscriptionId;

  if (!subscriptionId) {
    return;
  }

  console.log(`❌ Invoice payment failed for subscription ${subscriptionId}`);

  // Create failed payment record
  await prisma.payment.create({
    data: {
      subscriptionId,
      paymentType: "MONTHLY_FEE",
      amount: (invoice.amount_due || 0) / 100,
      currency: "USD",
      status: "FAILED",
      failedAt: new Date(),
      failureReason:
        invoice.last_finalization_error?.message || "Payment failed",
      stripePaymentIntentId: getPaymentIntentId(invoice) ?? undefined,
      stripeInvoiceId: invoice.id,
    },
  });

  // Update subscription status to PAST_DUE
  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "PAST_DUE",
    },
  });

  // Create audit log
  const userId = invoice.metadata?.userId;
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_FAILED",
        resourceType: "Payment",
        resourceId: subscriptionId,
        ipAddress: "stripe-webhook",
        severity: "WARNING",
        metadata: JSON.stringify({
          paymentType: "MONTHLY_FEE",
          amount: (invoice.amount_due || 0) / 100,
          reason: invoice.last_finalization_error?.message,
        }),
      },
    });
  }
}

/**
 * Handle customer.subscription.deleted
 * This fires when a subscription is canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.metadata?.subscriptionId;

  if (!subscriptionId) {
    return;
  }

  console.log(`🗑️  Subscription deleted: ${subscriptionId}`);

  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      cancelReason: "User canceled subscription in Stripe",
    },
  });

  // Create audit log
  const userId = subscription.metadata?.userId;
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CANCELED",
        resourceType: "ServiceSubscription",
        resourceId: subscriptionId,
        ipAddress: "stripe-webhook",
        metadata: JSON.stringify({
          canceledAt: new Date().toISOString(),
        }),
      },
    });
  }
}

/**
 * Handle customer.subscription.updated
 * This fires when subscription details change
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.metadata?.subscriptionId;

  if (!subscriptionId) {
    return;
  }

  const nextBillingDate = getNextBillingDate(subscription);

  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      nextBillingDate,
    },
  });
}

function getNextBillingDate(subscription: Stripe.Subscription): Date | null {
  const firstItem = subscription.items.data[0];
  if (!firstItem?.current_period_end) {
    return null;
  }

  return new Date(firstItem.current_period_end * 1000);
}

function getPaymentIntentId(invoice: Stripe.Invoice): string | null {
  const raw = (
    invoice as {
      payment_intent?: string | Stripe.PaymentIntent;
    }
  ).payment_intent;

  if (!raw) {
    return null;
  }

  return typeof raw === "string" ? raw : raw.id;
}

function getStripeSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (
    invoice as {
      subscription?: string | Stripe.Subscription;
    }
  ).subscription;

  if (legacy) {
    return typeof legacy === "string" ? legacy : legacy.id;
  }

  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (!parentSubscription) {
    return null;
  }

  return typeof parentSubscription === "string"
    ? parentSubscription
    : parentSubscription.id;
}

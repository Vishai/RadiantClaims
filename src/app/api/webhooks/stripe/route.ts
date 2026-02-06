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
import { stripe, STRIPE_CONFIG, isStripeTestMode } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  handleClaimSetupFeePayment,
  handleClaimMonthlyPayment,
  handleClaimSubscriptionCancelled,
  handleClaimSubscriptionUpdated,
} from "@/lib/stripe-webhook-handlers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  // SECURITY FIX: Validate webhook secret is configured
  if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
    console.error("⚠️  STRIPE_WEBHOOK_SECRET is not configured!");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
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

  console.log(
    `✅ Webhook received: ${event.type}${isStripeTestMode ? " [TEST MODE]" : ""}`
  );

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded": {
        // Handle claim setup fee payments
        const handled = await handleClaimSetupFeePayment(
          event.data.object as Stripe.PaymentIntent
        );
        if (!handled) {
          console.log("Payment intent not related to claim setup fee");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Try claim subscription handler first
        const invoice = event.data.object as Stripe.Invoice;
        const handledByClaim = await handleClaimMonthlyPayment(invoice);

        // Fall back to account-level handler if not a claim payment
        if (!handledByClaim) {
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
      }

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted": {
        // Try claim subscription handler first
        const subscription = event.data.object as Stripe.Subscription;
        const handledByClaim =
          await handleClaimSubscriptionCancelled(subscription);

        // Fall back to account-level handler if not a claim subscription
        if (!handledByClaim) {
          await handleSubscriptionDeleted(subscription);
        }
        break;
      }

      case "customer.subscription.updated": {
        // Try claim subscription handler first
        const subscription = event.data.object as Stripe.Subscription;
        const handledByClaim =
          await handleClaimSubscriptionUpdated(subscription);

        // Fall back to account-level handler if not a claim subscription
        if (!handledByClaim) {
          await handleSubscriptionUpdated(subscription);
        }
        break;
      }

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
 * DIY: setup fee checkout completion
 * Legal Rep: subscription checkout completion (no setup fee)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = (session.metadata || {}) as Record<
    string,
    string | undefined
  >;
  const userId = metadata.userId;
  const subscriptionId = metadata.subscriptionId;

  if (!userId || !subscriptionId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // IDEMPOTENCY CHECK: Prevent duplicate processing if webhook is retried
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentIntentId) {
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (existingPayment) {
      console.log(
        `⏭️  Skipping duplicate checkout webhook for payment intent ${paymentIntentId}`
      );
      return;
    }
  }

  const subscription = await prisma.serviceSubscription.findUnique({
    where: { id: subscriptionId },
  });

  // SECURITY FIX: Don't process payments for canceled subscriptions
  if (subscription?.status === "CANCELED") {
    console.log(
      `⚠️  Ignoring checkout for canceled subscription ${subscriptionId}`
    );
    return;
  }

  const tier = metadata.tier || subscription?.tier;

  console.log(`💰 Checkout completed for user ${userId}`);

  // Extract subscription ID from session if available (for mode='subscription')
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  // Legal Rep: monthly subscription only, no setup fee
  if (tier === "LEGAL_REP") {
    await prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        ...(stripeSubscriptionId && { stripeSubscriptionId }),
      },
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SUBSCRIPTION_CREATED",
          resourceType: "ServiceSubscription",
          resourceId: subscriptionId,
          ipAddress: "stripe-webhook",
          metadata: JSON.stringify({
            tier: "LEGAL_REP",
            checkoutSessionId: session.id,
            amount: session.amount_total ? session.amount_total / 100 : null,
          }),
        },
      });
    }

    return;
  }

  const paymentPlan = metadata.paymentPlan || "full";
  const isInstallmentPlan = paymentPlan === "installment";
  const paymentAmount =
    session.amount_total !== null && session.amount_total !== undefined
      ? (session.amount_total as number) / 100
      : isInstallmentPlan
        ? 249.99
        : 499.0;

  if (isInstallmentPlan && !stripeSubscriptionId) {
    console.error(
      `Missing Stripe subscription ID for installment checkout ${session.id}`
    );
    return;
  }

  if (isInstallmentPlan && stripeSubscriptionId) {
    // Mark as active and store Stripe sub for installment billing; payment will be recorded via invoice webhook
    await prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        stripeSubscriptionId,
        isInstallmentPlan: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscriptionId,
        ipAddress: "stripe-webhook",
        metadata: JSON.stringify({
          tier: "DIY_PREP",
          checkoutSessionId: session.id,
          paymentPlan,
          stripeSubscriptionId,
        }),
      },
    });

    return;
  }

  // One-time payment path
  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      setupFeePaid: true,
      setupFeePaidAt: new Date(),
      status: "ACTIVE",
    },
  });

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
    await prisma.payment.create({
      data: {
        subscriptionId,
        paymentType: "SETUP_FEE",
        amount: paymentAmount,
        currency: "USD",
        status: "COMPLETED",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
        metadata: JSON.stringify({
          paymentPlan,
        }),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "PAYMENT_SUCCEEDED",
      resourceType: "Payment",
      resourceId: subscriptionId,
      ipAddress: "stripe-webhook",
      metadata: JSON.stringify({
        paymentType: "FULL_PAYMENT",
        amount: paymentAmount,
        checkoutSessionId: session.id,
        paymentPlan,
      }),
    },
  });
}

/**
 * Handle invoice.payment_succeeded
 * This fires when a monthly subscription payment is successful
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionIdFromMetadata = invoice.metadata?.subscriptionId;
  const stripeSubscriptionId = (() => {
    const sub = (
      invoice as Stripe.Invoice & {
        subscription?: string | { id?: string } | null;
      }
    ).subscription;
    if (!sub) return null;
    return typeof sub === "string" ? sub : (sub.id ?? null);
  })();

  const whereClauses: Array<{
    id?: string;
    stripeSubscriptionId?: string;
  }> = [];
  if (subscriptionIdFromMetadata) {
    whereClauses.push({ id: subscriptionIdFromMetadata });
  }
  if (stripeSubscriptionId) {
    whereClauses.push({ stripeSubscriptionId });
  }

  if (whereClauses.length === 0) {
    console.log("No subscription reference in invoice, skipping");
    return;
  }

  const subscription =
    (await prisma.serviceSubscription.findFirst({
      where: { OR: whereClauses },
    })) || undefined;

  if (!subscription) {
    console.log(
      `No matching service subscription for invoice ${invoice.id}, skipping`
    );
    return;
  }

  const subscriptionId = subscription.id;
  console.log(
    `💰 Invoice payment succeeded for subscription ${subscriptionId}`
  );

  // SECURITY FIX: Don't process payments for canceled subscriptions
  if (subscription.status === "CANCELED") {
    console.log(
      `⚠️  Ignoring payment for canceled subscription ${subscriptionId}`
    );
    return;
  }

  // IDEMPOTENCY CHECK: Prevent duplicate processing if webhook is retried
  const invoicePaymentIntentId = getPaymentIntentId(invoice);
  if (invoicePaymentIntentId) {
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: invoicePaymentIntentId },
    });

    if (existingPayment) {
      console.log(
        `⏭️  Skipping duplicate invoice webhook for payment intent ${invoicePaymentIntentId}`
      );
      return;
    }
  }

  // Check if this is a pilot account that has expired
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

  const amountPaid = (invoice.amount_paid || 0) / 100;

  if (subscription.isInstallmentPlan) {
    // SECURITY FIX: Validate installment payment amount
    const expectedInstallmentAmount = 249.99;
    const amountTolerance = 1.0; // Allow $1 tolerance for rounding

    if (Math.abs(amountPaid - expectedInstallmentAmount) > amountTolerance) {
      console.error(
        `⚠️  Unexpected installment amount for subscription ${subscriptionId}: ` +
          `expected ~$${expectedInstallmentAmount}, got $${amountPaid}`
      );
      // Still process but log the discrepancy for investigation
    }

    const currentCount = subscription.installmentPaymentCount || 0;
    const newCount = currentCount + 1;

    // IDEMPOTENCY FIX: Use conditional update to prevent race conditions on retry
    const updateResult = await prisma.serviceSubscription.updateMany({
      where: {
        id: subscriptionId,
        installmentPaymentCount: currentCount, // Only update if count hasn't changed
      },
      data: {
        installmentPaymentCount: newCount,
        status: "ACTIVE",
        lastBillingDate: new Date(),
      },
    });

    if (updateResult.count === 0) {
      console.log(
        `⏭️  Installment count already incremented for ${subscriptionId}, skipping duplicate`
      );
      return;
    }

    // Handle final installment (2nd payment) - mark as fully paid
    if (newCount >= 2) {
      await prisma.serviceSubscription.update({
        where: { id: subscriptionId },
        data: {
          setupFeePaid: true,
          setupFeePaidAt: new Date(),
          installmentCompleted: true,
          nextBillingDate: null,
        },
      });

      if (stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        } catch (error) {
          console.error(
            "Error canceling installment subscription after final payment",
            error
          );
        }
      }
    } else if (stripeSubscriptionId) {
      // First installment - update next billing date
      const subscriptionResponse =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const stripeSubscription = subscriptionResponse as Stripe.Subscription;
      const nextBillingDate = getNextBillingDate(stripeSubscription);
      await prisma.serviceSubscription.update({
        where: { id: subscriptionId },
        data: { nextBillingDate },
      });
    }

    await prisma.payment.create({
      data: {
        subscriptionId,
        paymentType: "MONTHLY_FEE",
        amount: amountPaid,
        currency: "USD",
        status: "COMPLETED",
        paidAt: new Date(),
        stripePaymentIntentId: getPaymentIntentId(invoice) ?? undefined,
        stripeInvoiceId: invoice.id,
        metadata: JSON.stringify({
          paymentPlan: "installment",
          installmentNumber: newCount,
        }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: invoice.metadata?.userId || subscription.userId,
        action: "PAYMENT_SUCCEEDED",
        resourceType: "Payment",
        resourceId: subscriptionId,
        ipAddress: "stripe-webhook",
        metadata: JSON.stringify({
          paymentType: newCount === 1 ? "INSTALLMENT_1" : "INSTALLMENT_2",
          amount: amountPaid,
          invoiceId: invoice.id,
          paymentPlan: "installment",
        }),
      },
    });

    return;
  }

  // Non-installment (legacy) flow
  await prisma.payment.create({
    data: {
      subscriptionId,
      paymentType: "MONTHLY_FEE",
      amount: amountPaid,
      currency: "USD",
      status: "COMPLETED",
      paidAt: new Date(),
      stripePaymentIntentId: getPaymentIntentId(invoice) ?? undefined,
      stripeInvoiceId: invoice.id,
    },
  });

  let nextBillingDate: Date | null = null;

  if (stripeSubscriptionId) {
    const subscriptionResponse =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const stripeSubscription = subscriptionResponse as Stripe.Subscription;
    nextBillingDate = getNextBillingDate(stripeSubscription);
  }

  await prisma.serviceSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      lastBillingDate: new Date(),
      nextBillingDate,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: invoice.metadata?.userId || subscription.userId,
      action: "PAYMENT_SUCCEEDED",
      resourceType: "Payment",
      resourceId: subscriptionId,
      ipAddress: "stripe-webhook",
      metadata: JSON.stringify({
        paymentType: "MONTHLY_FEE",
        amount: amountPaid,
        invoiceId: invoice.id,
      }),
    },
  });
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

/**
 * Sync Stripe Payments Script
 *
 * This script checks for subscriptions in PENDING status and verifies
 * if payment was completed in Stripe but webhook failed to fire.
 *
 * Usage: npx tsx scripts/sync-stripe-payments.ts
 */

import { prisma } from "../src/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function syncStripePayments() {
  console.log("🔍 Checking for PENDING subscriptions...\n");

  // Find all subscriptions with PENDING status
  const pendingSubscriptions = await prisma.serviceSubscription.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        {
          AND: [
            { tier: "DIY_PREP" },
            { setupFeePaid: false },
            { status: "ACTIVE" },
          ],
        },
      ],
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  console.log(`Found ${pendingSubscriptions.length} subscriptions to check\n`);

  for (const subscription of pendingSubscriptions) {
    console.log(`\n📋 Checking subscription ${subscription.id}`);
    console.log(`   User: ${subscription.user.email}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Setup Fee Paid: ${subscription.setupFeePaid}`);
    console.log(
      `   Stripe Customer: ${subscription.stripeCustomerId || "N/A"}`
    );

    if (!subscription.stripeCustomerId) {
      console.log("   ⚠️  No Stripe customer ID - subscription not processed");
      continue;
    }

    try {
      // Check if customer has any successful checkout sessions
      const checkoutSessions = await stripe.checkout.sessions.list({
        customer: subscription.stripeCustomerId,
        limit: 10,
      });

      const completedSession = checkoutSessions.data.find(
        (session) =>
          session.payment_status === "paid" &&
          session.metadata?.subscriptionId === subscription.id
      );

      if (completedSession) {
        console.log(
          `   ✅ Found completed checkout session: ${completedSession.id}`
        );
        console.log(`      Payment Status: ${completedSession.payment_status}`);
        console.log(
          `      Amount: $${(completedSession.amount_total || 0) / 100}`
        );

        // Update subscription to ACTIVE and mark setup fee as paid
        await prisma.serviceSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            setupFeePaid: true,
            setupFeePaidAt: new Date(completedSession.created * 1000),
            stripeSubscriptionId:
              typeof completedSession.subscription === "string"
                ? completedSession.subscription
                : completedSession.subscription?.id || null,
          },
        });

        console.log(
          `   🎉 Updated subscription to ACTIVE with setupFeePaid = true`
        );

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: subscription.userId,
            action: "PAYMENT_SYNCED",
            resourceType: "ServiceSubscription",
            resourceId: subscription.id,
            ipAddress: "sync-script",
            metadata: JSON.stringify({
              checkoutSessionId: completedSession.id,
              syncedAt: new Date().toISOString(),
              reason: "Webhook failed - manual sync",
            }),
          },
        });
      } else {
        console.log(`   ℹ️  No completed checkout session found`);

        // Check if there's an active subscription in Stripe
        if (subscription.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
          );

          if (stripeSubscription.status === "active") {
            console.log(
              `   ✅ Found active Stripe subscription: ${stripeSubscription.id}`
            );

            await prisma.serviceSubscription.update({
              where: { id: subscription.id },
              data: {
                status: "ACTIVE",
                setupFeePaid: true,
                setupFeePaidAt: new Date(),
              },
            });

            console.log(`   🎉 Updated subscription to ACTIVE`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error checking subscription:`, error);
    }
  }

  console.log("\n✅ Sync complete!\n");
}

// Run the sync
syncStripePayments()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

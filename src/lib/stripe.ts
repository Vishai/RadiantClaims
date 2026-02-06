/**
 * Stripe Configuration
 * Server-side Stripe client initialization
 *
 * Supports test/live mode toggle via STRIPE_TEST_MODE env var.
 * When STRIPE_TEST_MODE=true, uses test keys, test price IDs, and test webhook secret.
 * This allows safe payment testing without swapping env vars.
 */

import Stripe from "stripe";

/**
 * Test mode flag - set STRIPE_TEST_MODE=true in env to use test keys
 */
export const isStripeTestMode =
  process.env.STRIPE_TEST_MODE === "true" ||
  process.env.STRIPE_TEST_MODE === "1";

// Resolve the correct secret key based on mode
const stripeSecretKey = isStripeTestMode
  ? process.env.STRIPE_SECRET_TEST_KEY
  : process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    isStripeTestMode
      ? "STRIPE_SECRET_TEST_KEY is not set. Add it to your .env for test mode."
      : "STRIPE_SECRET_KEY is not set. Please add it to your .env file."
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  typescript: true,
  appInfo: {
    name: "RadiantClaims",
    version: "1.0.0",
  },
});

if (isStripeTestMode) {
  console.log(
    "⚠️  Stripe is running in TEST MODE — no real charges will be made"
  );
}

/**
 * Stripe Product & Price IDs
 *
 * NEW PRICING STRUCTURE (Dec 2024):
 * - DIY: $499.00 one-time OR 2 payments of $249.99
 * - Lawyer: $0 Upfront for user (Backend B2B billing)
 *
 * In test mode, uses STRIPE_TEST_PRICE_ID_* env vars instead.
 */
export const STRIPE_CONFIG = {
  // DIY Path - NEW PRICING
  DIY_PACKET_FULL: {
    priceId: isStripeTestMode
      ? process.env.STRIPE_TEST_PRICE_ID_DIY_PACKET || ""
      : process.env.STRIPE_PRICE_ID_DIY_PACKET ||
        process.env.STRIPE_PRICE_ID_DIY_SETUP ||
        "",
    amount: 49900, // $499.00 in cents
    currency: "usd",
    description: "RadiantClaims DIY - Complete Packet (One-time $499.00)",
  },
  DIY_PACKET_INSTALLMENT: {
    priceId: isStripeTestMode
      ? process.env.STRIPE_TEST_PRICE_ID_DIY_INSTALLMENT || ""
      : process.env.STRIPE_PRICE_ID_DIY_INSTALLMENT ||
        process.env.STRIPE_PRICE_ID_PACKET_2_PAYMENTS ||
        "",
    amount: 24999, // $249.99 per payment in cents
    currency: "usd",
    interval: "month" as const,
    maxPayments: 2,
    description: "RadiantClaims DIY - 2 Payment Plan ($249.99 × 2)",
  },

  // DEPRECATED - Legacy pricing (kept for backwards compatibility)
  DIY_SETUP_FEE: {
    priceId: process.env.STRIPE_PRICE_ID_DIY_SETUP || "",
    amount: 49999,
    currency: "usd",
    description: "DEPRECATED: Use DIY_PACKET_FULL instead",
  },
  DIY_MONTHLY_FIRST_CLAIM: {
    priceId: "",
    amount: 0,
    currency: "usd",
    interval: "month" as const,
    description: "DEPRECATED",
  },
  DIY_MONTHLY_ADDITIONAL: {
    priceId: "",
    amount: 0,
    currency: "usd",
    interval: "month" as const,
    description: "DEPRECATED",
  },
  LEGAL_SETUP_FEE: {
    priceId: "",
    amount: 0,
    currency: "usd",
    description: "RadiantClaims Legal - No Upfront Cost",
  },
  LEGAL_MONTHLY_PER_CLAIM: {
    priceId: "",
    amount: 0,
    currency: "usd",
    interval: "month" as const,
    description: "DEPRECATED",
  },

  // Webhook configuration - uses test secret in test mode
  WEBHOOK_SECRET: isStripeTestMode
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET || ""
    : process.env.STRIPE_WEBHOOK_SECRET || "",
} as const;

/**
 * Helper function to format amount for Stripe (convert dollars to cents)
 */
export function toStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Helper function to format Stripe amount for display (convert cents to dollars)
 */
export function fromStripeAmount(cents: number): number {
  return cents / 100;
}

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a Stripe customer ID in database
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId },
    });

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Update subscription record with Stripe customer ID
    if (subscription) {
      await prisma.serviceSubscription.update({
        where: { userId },
        data: { stripeCustomerId: customer.id },
      });
    }

    return customer.id;
  } finally {
    await prisma.$disconnect();
  }
}

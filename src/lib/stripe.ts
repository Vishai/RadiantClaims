/**
 * Stripe Configuration
 * Server-side Stripe client initialization
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Please add it to your .env file."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  typescript: true,
  appInfo: {
    name: "RadiantClaims",
    version: "1.0.0",
  },
});

/**
 * Stripe Product & Price IDs
 * These will be set after creating products in Stripe Dashboard
 *
 * NEW PER-CLAIM PRICING STRUCTURE (Dec 2025 Pivot):
 * - DIY: $499.00 Flat Fee (One-time payment)
 * - Lawyer: $0 Upfront for user (Backend B2B billing)
 */
export const STRIPE_CONFIG = {
  // DIY Path - Flat Fee (one-time payment)
  DIY_SETUP_FEE: {
    priceId: process.env.STRIPE_PRICE_ID_DIY_SETUP || "",
    amount: 49900, // $499.00 in cents
    currency: "usd",
    description: "RadiantClaims DIY - Complete Packet (One-time)",
  },

  // Legacy/Unused Keys (kept to avoid immediate breaking changes if referenced elsewhere, but should be deprecated)
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

  // Webhook configuration
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
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

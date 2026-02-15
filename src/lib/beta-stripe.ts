/**
 * Beta Stripe Coupon Helpers (server-side only)
 *
 * Handles:
 * 1. Creating/reusing a Stripe coupon for the beta discount
 * 2. Counting beta redemptions to enforce the 30-user cap
 * 3. Returning the coupon ID to apply at checkout
 */

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { BETA_CONFIG, isBetaActive } from "@/lib/constants/beta-config";

/**
 * Count how many beta-discounted checkouts have been completed.
 * Uses the audit log to count successful beta-discounted subscriptions.
 */
export async function countBetaRedemptions(): Promise<number> {
  const count = await db.auditLog.count({
    where: {
      action: "SUBSCRIPTION_CREATED",
      OR: [
        {
          // metadata is stored as JSON string (AuditLog.metadata is Text)
          metadata: { contains: '"betaDiscount":true' },
        },
        {
          metadata: { contains: '"betaDiscount":"true"' },
        },
      ],
    },
  });
  return count;
}

/**
 * Check if the beta discount is still available (enabled + under cap).
 */
export async function isBetaAvailable(): Promise<boolean> {
  if (!isBetaActive()) return false;
  const used = await countBetaRedemptions();
  return used < BETA_CONFIG.maxRedemptions;
}

/**
 * Get or create the Stripe coupon for the beta discount.
 * Returns the coupon ID if beta is available, null otherwise.
 *
 * The coupon is created once and reused. We look it up by metadata
 * to avoid creating duplicates.
 */
export async function getBetaStripeCouponId(): Promise<string | null> {
  const available = await isBetaAvailable();
  if (!available) return null;

  // Try to find existing beta coupon by listing coupons
  const existingCoupons = await stripe.coupons.list({ limit: 100 });
  const betaCoupon = existingCoupons.data.find(
    (c) => c.metadata?.betaCoupon === "true" && c.valid
  );

  if (betaCoupon) {
    return betaCoupon.id;
  }

  // Create a new coupon
  const coupon = await stripe.coupons.create({
    percent_off: BETA_CONFIG.discountPercent,
    duration: "once",
    name: `${BETA_CONFIG.stripeCouponName} - ${BETA_CONFIG.discountPercent}% Off (Beta)`,
    metadata: {
      betaCoupon: "true",
      discountPercent: String(BETA_CONFIG.discountPercent),
      maxRedemptions: String(BETA_CONFIG.maxRedemptions),
    },
  });

  return coupon.id;
}

/**
 * Get remaining beta slots.
 */
export async function getBetaRemainingSlots(): Promise<number> {
  if (!isBetaActive()) return 0;
  const used = await countBetaRedemptions();
  return Math.max(0, BETA_CONFIG.maxRedemptions - used);
}

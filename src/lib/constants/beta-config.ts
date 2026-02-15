/**
 * Beta Configuration
 *
 * Single source of truth for all beta-related settings.
 * When beta is over, set BETA_ENABLED to false — all beta pricing,
 * banners, and messaging will disappear automatically.
 */

export const BETA_CONFIG = {
  /** Master switch — set to false to end beta instantly */
  enabled: true,

  /** Discount percentage applied during beta (0–100) */
  discountPercent: 50,

  /** Maximum number of beta-discounted signups before auto-disabling */
  maxRedemptions: 30,

  /** Stripe coupon name prefix */
  stripeCouponName: "BETA50",

  /** Label shown on pricing UI */
  label: "Early Access",

  /** Short tagline for banners */
  tagline:
    "RECA expires December 2027 — we're launching early so you have time to file. 50% off while we grow.",

  /** Longer description for pricing pages */
  description:
    "The RECA program closes in December 2027. We're launching now — ahead of schedule — to give you the maximum time to prepare and file your claim. As an early user, you'll get 50% off while we continue building.",

  /** Badge text on pricing cards */
  badge: "Early Access — 50% Off",

  /** When the beta period ends (null = no auto-expiry, controlled manually) */
  expiresAt: null as Date | null,
} as const;

/**
 * Calculate the beta-discounted price.
 * Returns the original price when beta is disabled.
 */
export function getBetaPrice(originalPrice: number): number {
  if (!isBetaActive()) return originalPrice;
  return (
    Math.round(originalPrice * (1 - BETA_CONFIG.discountPercent / 100) * 100) /
    100
  );
}

/**
 * Check if beta is currently active (enabled + not expired).
 */
export function isBetaActive(): boolean {
  if (!BETA_CONFIG.enabled) return false;
  if (BETA_CONFIG.expiresAt && new Date() > BETA_CONFIG.expiresAt) return false;
  return true;
}

/**
 * Format a price with beta strikethrough info.
 * Returns both original and discounted prices for UI rendering.
 */
export function getBetaPricing(originalPrice: number) {
  const active = isBetaActive();
  return {
    isActive: active,
    originalPrice,
    finalPrice: active ? getBetaPrice(originalPrice) : originalPrice,
    discountPercent: active ? BETA_CONFIG.discountPercent : 0,
    label: active ? BETA_CONFIG.label : null,
    badge: active ? BETA_CONFIG.badge : null,
  };
}

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

  /** Label shown on pricing UI */
  label: "Beta",

  /** Short tagline for banners */
  tagline: "Early access pricing — help us build the best RECA platform",

  /** Longer description for pricing pages */
  description:
    "You're among our first users. In exchange for your feedback as we refine the platform, enjoy 50% off.",

  /** Badge text on pricing cards */
  badge: "Beta Pricing",

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

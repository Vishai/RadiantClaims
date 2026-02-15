"use client";

import { BETA_CONFIG, isBetaActive } from "@/lib/constants/beta-config";
import { Sparkles } from "lucide-react";

/**
 * Thin site-wide beta banner.
 * Renders nothing when beta is inactive — zero cleanup needed later.
 */
export function BetaBanner() {
  if (!isBetaActive()) return null;

  return (
    <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 px-4 py-2 text-center text-sm font-medium text-white">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span>
          <strong>{BETA_CONFIG.badge}</strong> — {BETA_CONFIG.tagline}
        </span>
        <Sparkles className="h-4 w-4" />
      </div>
    </div>
  );
}

/**
 * Inline beta badge for pricing cards.
 * Renders nothing when beta is inactive.
 */
export function BetaBadge({ className }: { className?: string }) {
  if (!isBetaActive()) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-terracotta-100 px-3 py-1 text-xs font-semibold text-terracotta-700 ${className ?? ""}`}
    >
      <Sparkles className="h-3 w-3" />
      {BETA_CONFIG.badge}
    </span>
  );
}

/**
 * Strikethrough price display for beta discounts.
 * Shows original price crossed out with new price highlighted.
 * Renders just the price normally when beta is inactive.
 */
export function BetaPrice({
  originalPrice,
  discountedPrice,
  suffix,
  className,
}: {
  originalPrice: number;
  discountedPrice: number;
  suffix?: string;
  className?: string;
}) {
  const active = isBetaActive();
  const formattedOriginal = `$${originalPrice.toFixed(originalPrice % 1 === 0 ? 0 : 2)}`;
  const formattedDiscounted = `$${discountedPrice.toFixed(discountedPrice % 1 === 0 ? 0 : 2)}`;

  if (!active || originalPrice === discountedPrice) {
    return (
      <span className={className}>
        {formattedOriginal}
        {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </span>
    );
  }

  return (
    <span className={className}>
      <span className="text-lg text-sage-400 line-through">
        {formattedOriginal}
      </span>{" "}
      <span>{formattedDiscounted}</span>
      {suffix && <span className="text-sm font-normal">{suffix}</span>}
    </span>
  );
}

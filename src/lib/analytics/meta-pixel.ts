/**
 * Meta Pixel Event Helpers
 *
 * Fire conversion events for Facebook ad tracking.
 * Events are only sent if the Meta Pixel is loaded (NEXT_PUBLIC_META_PIXEL_ID is set).
 *
 * Standard events used:
 * - Lead: Eligibility check completed
 * - InitiateCheckout: Service tier selected (before payment)
 * - Purchase: Stripe payment completed
 * - CompleteRegistration: User account created
 *
 * Custom events:
 * - EligibilityCheck: Started the eligibility check
 * - FormSectionComplete: Completed a form section
 * - ClaimFiled: User confirmed they filed with DOJ
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

// ─── Standard Events ───────────────────────────────────────────

/** User completed the eligibility check */
export function trackEligibilityComplete(result: string) {
  fbq("track", "Lead", {
    content_name: "Eligibility Check",
    content_category: "RECA",
    status: result, // "likely", "unlikely", "ineligible"
  });
}

/** User selected a service tier (before payment) */
export function trackTierSelected(tier: "DIY_PREP" | "LEGAL_REP") {
  fbq("track", "InitiateCheckout", {
    content_name: tier,
    content_category: "RECA",
    currency: "USD",
    value: tier === "DIY_PREP" ? 249.99 : 0,
  });
}

/** Stripe payment completed */
export function trackPurchase(amount: number, tier: string) {
  fbq("track", "Purchase", {
    content_name: tier,
    content_category: "RECA",
    currency: "USD",
    value: amount,
  });
}

/** User created an account */
export function trackRegistration() {
  fbq("track", "CompleteRegistration", {
    content_name: "Account Created",
    content_category: "RECA",
  });
}

// ─── Custom Events ─────────────────────────────────────────────

/** User started the eligibility check */
export function trackEligibilityStart() {
  fbq("trackCustom", "EligibilityCheck", {
    action: "started",
  });
}

/** User completed a form section */
export function trackFormSection(section: string, completionPercent: number) {
  fbq("trackCustom", "FormSectionComplete", {
    section,
    completion_percent: completionPercent,
  });
}

/** User confirmed they filed with DOJ */
export function trackClaimFiled(method: "e-file" | "mail") {
  fbq("trackCustom", "ClaimFiled", {
    method,
  });
}

/**
 * Generic CTA click tracker. Use for A/B-testable buttons and links
 * where you want to measure engagement without adding a bespoke event.
 *
 * @param ctaName  Short identifier for the CTA (e.g. "see-full-comparison")
 * @param location Where the CTA lives (e.g. "homepage-two-ways", "portal-tracker")
 */
export function trackCtaClick(ctaName: string, location: string) {
  fbq("trackCustom", "CtaClick", {
    cta_name: ctaName,
    location,
  });
}

// ─── Claim Outcome (user-reported) ─────────────────────────────

export type ClaimOutcomeKind = "awarded" | "denied" | "withdrawn" | "pending";

/**
 * Bucket an exact award amount into a compliance-safe range.
 * We never send exact dollar amounts to third parties — both to avoid
 * leaking PII-adjacent data and to reduce blast radius if a pixel event
 * is ever exposed in logs. Buckets align with the RECA program's
 * typical award tiers (Downwinder $50k, OSP $75k, Uranium Worker $100k).
 */
export function bucketAwardAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return "unknown";
  }
  if (amount < 25_000) return "<$25k";
  if (amount < 50_000) return "$25k-$50k";
  if (amount < 75_000) return "$50k-$75k";
  if (amount < 100_000) return "$75k-$100k";
  return "$100k+";
}

/**
 * User self-reported the outcome of their DOJ claim. Fires a custom
 * pixel event so we can build an aggregate "path to payout" funnel.
 * Never send raw award amounts — only a bucketed range.
 */
export function trackClaimOutcome(
  outcome: ClaimOutcomeKind,
  awardAmount?: number | null
) {
  const payload: Record<string, string> = { outcome };
  if (outcome === "awarded") {
    payload.amount_range = bucketAwardAmount(awardAmount);
  }
  fbq("trackCustom", "ClaimOutcome", payload);
}

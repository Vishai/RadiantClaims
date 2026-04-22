/**
 * Analytics Event Helpers
 *
 * One function per conversion event. Each function fires into BOTH
 * Meta Pixel (`fbq`) AND Google Analytics 4 (`gtag`) so we have a
 * single source of truth for every tracked action.
 *
 * Call one of these — never call `fbq` or `gtag` directly from a
 * component. That way event naming, payload shape, and privacy
 * bucketing stay consistent across both platforms.
 *
 * Meta Pixel standard events used:
 * - Lead: Eligibility check completed
 * - InitiateCheckout: Service tier selected (before payment)
 * - Purchase: Stripe payment completed
 * - CompleteRegistration: User account created
 *
 * GA4 recommended events used (where they map cleanly):
 * - generate_lead, begin_checkout, purchase, sign_up
 * - All others are custom events; GA4 allows any name.
 *
 * File name kept as `meta-pixel.ts` for backwards-compat with
 * existing imports — the module is now dual-tracker.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// ─── Low-level emitters ────────────────────────────────────────

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

function gtagEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

// Fire-and-forget POST to our own server-side log. Ground truth that
// survives ad-blockers, Safari ITP, and Meta Pixel category restrictions.
// Drops silently on failure — missed rows are acceptable; blocking UX is not.
function logEligibilityEventToServer(payload: {
  phase: "started" | "completed";
  result?: string;
  intent?: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      phase: payload.phase,
      result: payload.result,
      intent: payload.intent ?? null,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    });

    // sendBeacon survives page unload (e.g. user clicks away right after
    // the result renders). Fall back to fetch if sendBeacon isn't available.
    const url = "/api/analytics/eligibility-event";
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore — analytics must never throw into user flow
  }
}

// ─── Standard Events ───────────────────────────────────────────

/** User completed the eligibility check */
export function trackEligibilityComplete(
  result: string,
  intent?: string | null
) {
  fbq("track", "Lead", {
    content_name: "Eligibility Check",
    content_category: "RECA",
    status: result, // "likely", "unlikely", "ineligible"
  });
  gtagEvent("generate_lead", {
    event_category: "RECA",
    event_label: "Eligibility Check",
    status: result,
  });
  logEligibilityEventToServer({ phase: "completed", result, intent });
}

/** User selected a service tier (before payment) */
export function trackTierSelected(tier: "DIY_PREP" | "LEGAL_REP") {
  const value = tier === "DIY_PREP" ? 249.99 : 0;
  fbq("track", "InitiateCheckout", {
    content_name: tier,
    content_category: "RECA",
    currency: "USD",
    value,
  });
  gtagEvent("begin_checkout", {
    currency: "USD",
    value,
    items: [{ item_name: tier, item_category: "RECA" }],
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
  gtagEvent("purchase", {
    currency: "USD",
    value: amount,
    items: [{ item_name: tier, item_category: "RECA" }],
  });
}

/** User created an account */
export function trackRegistration() {
  fbq("track", "CompleteRegistration", {
    content_name: "Account Created",
    content_category: "RECA",
  });
  gtagEvent("sign_up", {
    event_category: "RECA",
    method: "email",
  });
}

// ─── Custom Events ─────────────────────────────────────────────

/** User started the eligibility check */
export function trackEligibilityStart() {
  fbq("trackCustom", "EligibilityCheck", { action: "started" });
  gtagEvent("eligibility_check_start", {
    event_category: "RECA",
  });
  logEligibilityEventToServer({ phase: "started" });
}

/** User completed a form section */
export function trackFormSection(section: string, completionPercent: number) {
  fbq("trackCustom", "FormSectionComplete", {
    section,
    completion_percent: completionPercent,
  });
  gtagEvent("form_section_complete", {
    event_category: "RECA",
    section,
    completion_percent: completionPercent,
  });
}

/** User confirmed they filed with DOJ */
export function trackClaimFiled(method: "e-file" | "mail") {
  fbq("trackCustom", "ClaimFiled", { method });
  gtagEvent("claim_filed", {
    event_category: "RECA",
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
  gtagEvent("cta_click", {
    event_category: "engagement",
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
  gtagEvent("claim_outcome", {
    event_category: "RECA",
    ...payload,
  });
}

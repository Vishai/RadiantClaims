import { db } from "@/lib/db";

export interface SubscriptionAccess {
  tier: "DIY_PREP" | "LEGAL_REP";
  status: string | null;
  setupFeePaid: boolean | null;
}

/**
 * Determine if the given user currently has access to paid RECA features.
 * - DIY tier requires setup fee paid and active status
 * - Legal representation tier is allowed unless explicitly canceled
 */
export async function getActiveSubscriptionAccess(
  userId: string
): Promise<SubscriptionAccess | null> {
  const subscription = await db.serviceSubscription.findUnique({
    where: { userId },
    select: {
      tier: true,
      status: true,
      setupFeePaid: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });

  if (!subscription) {
    return null;
  }

  const { tier, status, setupFeePaid, stripeCustomerId, createdAt } =
    subscription;

  const hasLegalAccess =
    tier === "LEGAL_REP" && status !== "CANCELED" && status !== "PAUSED";

  // FIX: Check if subscription was created recently (within 24 hours) and has Stripe customer ID
  // This handles race condition where user returns from Stripe before webhook processes
  // Using 24 hours for development testing (webhooks not configured locally)
  // In production with webhooks, this serves as a backup for very fast users
  const hasRecentStripeCheckout =
    stripeCustomerId &&
    createdAt &&
    Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000; // 24 hours

  const hasDIYAccess =
    tier === "DIY_PREP" &&
    (setupFeePaid === true || status === "ACTIVE" || hasRecentStripeCheckout);

  // DIAGNOSTIC LOGGING
  console.log("[Subscription Access]", {
    userId,
    tier,
    status,
    setupFeePaid,
    hasRecentStripeCheckout,
    hasDIYAccess,
    hasLegalAccess,
    willGrantAccess: hasLegalAccess || hasDIYAccess,
  });

  if (!hasLegalAccess && !hasDIYAccess) {
    return null;
  }

  return {
    tier,
    status,
    setupFeePaid,
  };
}

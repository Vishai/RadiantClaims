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
    },
  });

  if (!subscription) {
    return null;
  }

  const { tier, status, setupFeePaid } = subscription;

  const hasLegalAccess =
    tier === "LEGAL_REP" && status !== "CANCELED" && status !== "PAUSED";

  const hasDIYAccess =
    tier === "DIY_PREP" && setupFeePaid === true && status === "ACTIVE";

  if (!hasLegalAccess && !hasDIYAccess) {
    return null;
  }

  return {
    tier,
    status,
    setupFeePaid,
  };
}

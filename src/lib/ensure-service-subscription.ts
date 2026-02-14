import { db } from "@/lib/db";

/**
 * Legacy/backfill helper.
 *
 * Some older or QA-created accounts can have Claimant/Intake data but no
 * ServiceSubscription row (which newer subsequent-claims flow expects).
 *
 * This helper creates a minimal ServiceSubscription record when missing.
 */
export async function ensureServiceSubscriptionForUser(userId: string) {
  const existing = await db.serviceSubscription.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return await db.serviceSubscription.create({
    data: {
      userId,
      tier: "DIY_PREP",
      status: "ACTIVE",
      // Treat as a pilot/backfill record so we don't imply Stripe was charged.
      isPilotAccount: true,
      setupFeeWaived: true,
      setupFeePaid: true,
      setupFeePaidAt: new Date(),
      installmentPaymentCount: 1,
    },
  });
}

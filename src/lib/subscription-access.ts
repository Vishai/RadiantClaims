import { db } from "@/lib/db";

// NOTE: "Subscription" is legacy terminology - this is actually ONE-TIME PAYMENT access
// We track payment status, not subscription status (no recurring charges)
export interface SubscriptionAccess {
  tier: "DIY_PREP" | "LEGAL_REP";
  status: string | null;
  setupFeePaid: boolean | null; // Legacy field name - actually means "service fee paid"
  hasPaid: boolean;
}

/**
 * Check if user has paid for RECA service access.
 *
 * PAYMENT MODEL (Dec 2024):
 * - One-time service fee of $499 OR 2 installments of $249.99 each
 * - NO recurring subscription/monthly charges
 * - User has access once they pay anything (full payment OR first installment)
 *
 * NOTE: Function name contains "Subscription" for backwards compatibility,
 * but this checks ONE-TIME PAYMENT status, not subscription status.
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
      isInstallmentPlan: true,
      installmentPaymentCount: true,
      installmentCompleted: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });

  if (!subscription) {
    return null;
  }

  const {
    tier,
    status,
    setupFeePaid,
    isInstallmentPlan,
    installmentPaymentCount,
    installmentCompleted,
  } = subscription;

  // SECURITY FIX: Removed 24-hour grace period that allowed access before payment confirmation.
  // Access is now ONLY granted when webhook confirms payment (setupFeePaid=true or installmentPaymentCount>0).
  // This prevents users from accessing paid content without completing payment.

  // User has paid if:
  // - Full payment made (setupFeePaid = true)
  // - Any installment payment made (installmentPaymentCount > 0)
  const hasPaid = setupFeePaid === true || (installmentPaymentCount ?? 0) > 0;

  // DIAGNOSTIC LOGGING
  console.log("[Payment Access Check]", {
    userId,
    tier,
    serviceFeeStatus: setupFeePaid ? "PAID" : "UNPAID",
    isInstallmentPlan,
    installmentPaymentCount,
    installmentCompleted,
    hasPaid,
    accessGranted: hasPaid,
  });

  if (!hasPaid) {
    return null;
  }

  return {
    tier,
    status,
    setupFeePaid,
    hasPaid,
  };
}

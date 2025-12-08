/**
 * Pricing Calculator for Per-Claim Subscriptions
 *
 * Handles all pricing calculations for DIY and Lawyer tracks with per-claim pricing:
 * - DIY: $149.99 setup (includes month 1) + $24.99/mo first claim + $14.99/mo additional
 * - Lawyer: $89.99 setup (refundable) + $24.99/mo per claim (no discount)
 */

import { SERVICE_TIERS } from "./constants/service-tiers";

export type ServiceTier = "DIY_PREP" | "LEGAL_REP";

export interface ClaimPricing {
  claimOrder: number; // 1 = first claim, 2+ = additional
  setupFee: number;
  monthlyFee: number;
  setupFeeRefundable: boolean;
}

export interface AccountPricing {
  totalClaims: number;
  setupFeePerClaim: number;
  totalSetupFees: number;
  monthlyFeeBreakdown: ClaimPricing[];
  totalMonthlyFee: number;
  firstMonthTotal: number; // Setup fees (includes month 1)
  recurringMonthlyTotal: number; // Starting month 2
}

/**
 * Calculate pricing for a single claim
 */
export function calculateClaimPricing(
  tier: ServiceTier,
  claimOrder: number
): ClaimPricing {
  const tierConfig = SERVICE_TIERS[tier];

  if (tier === "DIY_PREP") {
    const pricing = tierConfig.pricing as any;
    return {
      claimOrder,
      setupFee: pricing.setupFee,
      monthlyFee:
        claimOrder === 1
          ? pricing.monthlyFeeFirstClaim
          : pricing.monthlyFeeAdditional,
      setupFeeRefundable: false,
    };
  } else {
    // LEGAL_REP - no discount for additional claims
    const pricing = tierConfig.pricing as any;
    return {
      claimOrder,
      setupFee: pricing.setupFee,
      monthlyFee: pricing.monthlyFeePerClaim,
      setupFeeRefundable: pricing.setupFeeRefundable ?? false,
    };
  }
}

/**
 * Calculate total pricing for an account with multiple claims
 */
export function calculateAccountPricing(
  tier: ServiceTier,
  numberOfClaims: number
): AccountPricing {
  const monthlyFeeBreakdown: ClaimPricing[] = [];
  let totalMonthlyFee = 0;

  for (let i = 1; i <= numberOfClaims; i++) {
    const claimPricing = calculateClaimPricing(tier, i);
    monthlyFeeBreakdown.push(claimPricing);
    totalMonthlyFee += claimPricing.monthlyFee;
  }

  const setupFeePerClaim =
    tier === "DIY_PREP"
      ? SERVICE_TIERS.DIY_PREP.pricing.setupFee
      : SERVICE_TIERS.LEGAL_REP.pricing.setupFee;

  const totalSetupFees = setupFeePerClaim * numberOfClaims;

  return {
    totalClaims: numberOfClaims,
    setupFeePerClaim,
    totalSetupFees,
    monthlyFeeBreakdown,
    totalMonthlyFee,
    firstMonthTotal: totalSetupFees, // Setup includes first month
    recurringMonthlyTotal: totalMonthlyFee, // Starting month 2
  };
}

/**
 * Recalculate claim orders after a claim is cancelled
 * Returns the new claim order for each remaining claim
 */
export function recalculateClaimOrders(
  activeClaims: Array<{ id: string; currentOrder: number; createdAt: Date }>
): Array<{ id: string; newOrder: number }> {
  // Sort by creation date (oldest first)
  const sortedClaims = [...activeClaims].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  // Reassign orders sequentially
  return sortedClaims.map((claim, index) => ({
    id: claim.id,
    newOrder: index + 1,
  }));
}

/**
 * Calculate the fee adjustment when a claim is cancelled
 * Returns the monthly fee difference (positive = reduction, negative = increase)
 */
export function calculateCancellationFeeAdjustment(
  tier: ServiceTier,
  claimOrderCancelled: number,
  totalClaimsBeforeCancellation: number
): {
  oldMonthlyTotal: number;
  newMonthlyTotal: number;
  monthlyFeeDifference: number;
  affectedClaims: Array<{
    claimOrder: number;
    oldFee: number;
    newFee: number;
    feeChange: number;
  }>;
} {
  const oldPricing = calculateAccountPricing(
    tier,
    totalClaimsBeforeCancellation
  );

  const newPricing = calculateAccountPricing(
    tier,
    totalClaimsBeforeCancellation - 1
  );

  // For DIY, if we cancelled claim 1, claim 2 becomes the new claim 1 (more expensive)
  // For Lawyer, all claims are the same price, so no individual claim changes
  const affectedClaims: Array<{
    claimOrder: number;
    oldFee: number;
    newFee: number;
    feeChange: number;
  }> = [];

  if (tier === "DIY_PREP" && claimOrderCancelled === 1) {
    // Claim 2 becomes claim 1 (14.99 -> 24.99)
    if (totalClaimsBeforeCancellation > 1) {
      affectedClaims.push({
        claimOrder: 2,
        oldFee: SERVICE_TIERS.DIY_PREP.pricing.monthlyFeeAdditional,
        newFee: SERVICE_TIERS.DIY_PREP.pricing.monthlyFeeFirstClaim,
        feeChange:
          SERVICE_TIERS.DIY_PREP.pricing.monthlyFeeFirstClaim -
          SERVICE_TIERS.DIY_PREP.pricing.monthlyFeeAdditional,
      });
    }
  }

  return {
    oldMonthlyTotal: oldPricing.totalMonthlyFee,
    newMonthlyTotal: newPricing.totalMonthlyFee,
    monthlyFeeDifference:
      oldPricing.totalMonthlyFee - newPricing.totalMonthlyFee,
    affectedClaims,
  };
}

/**
 * Format pricing for display
 */
export function formatPricingDisplay(pricing: AccountPricing): string {
  const lines: string[] = [];

  lines.push(`Total Claims: ${pricing.totalClaims}`);
  lines.push(`\nSetup Fees:`);
  lines.push(
    `  $${pricing.setupFeePerClaim.toFixed(2)} × ${pricing.totalClaims} = $${pricing.totalSetupFees.toFixed(2)}`
  );
  lines.push(`  (Includes first month of service)`);

  lines.push(`\nMonthly Fees (starting month 2):`);
  pricing.monthlyFeeBreakdown.forEach((claim) => {
    lines.push(
      `  Claim ${claim.claimOrder}: $${claim.monthlyFee.toFixed(2)}/mo`
    );
  });
  lines.push(`  Total: $${pricing.totalMonthlyFee.toFixed(2)}/mo`);

  lines.push(`\nFirst Month Total: $${pricing.firstMonthTotal.toFixed(2)}`);
  lines.push(
    `Recurring Monthly: $${pricing.recurringMonthlyTotal.toFixed(2)}/mo`
  );

  return lines.join("\n");
}

/**
 * Generate pricing table for multiple claim scenarios
 */
export function generatePricingTable(
  tier: ServiceTier,
  maxClaims: number = 10
): Array<{
  claims: number;
  setupFee: number;
  monthlyFee: number;
  firstMonthTotal: number;
  recurringMonthly: number;
}> {
  const table: Array<{
    claims: number;
    setupFee: number;
    monthlyFee: number;
    firstMonthTotal: number;
    recurringMonthly: number;
  }> = [];

  for (let i = 1; i <= maxClaims; i++) {
    const pricing = calculateAccountPricing(tier, i);
    table.push({
      claims: i,
      setupFee: pricing.setupFeePerClaim,
      monthlyFee: pricing.totalMonthlyFee,
      firstMonthTotal: pricing.firstMonthTotal,
      recurringMonthly: pricing.recurringMonthlyTotal,
    });
  }

  return table;
}

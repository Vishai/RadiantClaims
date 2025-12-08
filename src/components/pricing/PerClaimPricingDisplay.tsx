/**
 * Per-Claim Pricing Display Component
 *
 * Shows pricing breakdown for DIY and Lawyer tracks with multiple claims
 */

import React from "react";
import { calculateAccountPricing, ServiceTier } from "@/lib/pricing-calculator";

interface PerClaimPricingDisplayProps {
  tier: ServiceTier;
  numberOfClaims: number;
  showBreakdown?: boolean;
}

export function PerClaimPricingDisplay({
  tier,
  numberOfClaims = 1,
  showBreakdown = true,
}: PerClaimPricingDisplayProps) {
  const pricing = calculateAccountPricing(tier, numberOfClaims);
  const isDIY = tier === "DIY_PREP";
  const isLegal = tier === "LEGAL_REP";

  return (
    <div className="space-y-4">
      {/* Setup Fees */}
      <div className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Setup Fee</h3>
            <p className="text-sm text-gray-600">
              {numberOfClaims} {numberOfClaims === 1 ? "claim" : "claims"} × $
              {pricing.setupFeePerClaim.toFixed(2)}
              {isLegal && (
                <span className="ml-2 text-green-600">(refundable)</span>
              )}
            </p>
            {isDIY && (
              <p className="mt-1 text-xs text-gray-500">
                Includes first month of service
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              ${pricing.totalSetupFees.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">First month total</p>
          </div>
        </div>
      </div>

      {/* Monthly Fees Breakdown */}
      {showBreakdown && (
        <div className="border-b pb-3">
          <h3 className="mb-2 text-lg font-semibold">
            Monthly Fees (starting month 2)
          </h3>
          <div className="space-y-2">
            {pricing.monthlyFeeBreakdown.map((claim, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  Claim {claim.claimOrder}
                  {isDIY && claim.claimOrder === 1 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (first claim)
                    </span>
                  )}
                  {isDIY && claim.claimOrder > 1 && (
                    <span className="ml-2 text-xs text-green-600">
                      (discounted)
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  ${claim.monthlyFee.toFixed(2)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Monthly */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recurring Monthly Total</h3>
            <p className="text-sm text-gray-600">Starting month 2</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">
              ${pricing.totalMonthlyFee.toFixed(2)}
              <span className="text-lg">/mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Notes */}
      <div className="space-y-1 text-xs text-gray-500">
        {isDIY && (
          <>
            <p>• First claim: $24.99/mo, additional claims: $14.99/mo each</p>
            <p>• Setup fee includes first month of service</p>
            <p>• Cancel anytime, pricing adjusts automatically</p>
          </>
        )}
        {isLegal && (
          <>
            <p>• All claims: $24.99/mo each (no discount for additional)</p>
            <p>• Setup fee refunded when DOJ receives your claim</p>
            <p>• Attorney fees: 2% of award (you pay from award)</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Pricing Table Component - Shows pricing for multiple claim scenarios
 */
interface PricingTableProps {
  tier: ServiceTier;
  maxClaims?: number;
}

export function PricingTable({ tier, maxClaims = 5 }: PricingTableProps) {
  const rows = [];
  for (let i = 1; i <= maxClaims; i++) {
    rows.push(calculateAccountPricing(tier, i));
  }

  const isDIY = tier === "DIY_PREP";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Claims
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Setup Fee
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              First Month
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Monthly (Month 2+)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((pricing) => (
            <tr key={pricing.totalClaims} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                {pricing.totalClaims}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                ${pricing.setupFeePerClaim.toFixed(2)} ea
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                ${pricing.firstMonthTotal.toFixed(2)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-blue-600">
                ${pricing.recurringMonthlyTotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 px-4 text-xs text-gray-500">
        {isDIY ? (
          <p>* DIY: First claim $24.99/mo, additional claims $14.99/mo each</p>
        ) : (
          <p>* Legal: All claims $24.99/mo each (no discount)</p>
        )}
      </div>
    </div>
  );
}

/**
 * Pricing Calculator Widget - Interactive claim counter
 */
export function PricingCalculator({ tier }: { tier: ServiceTier }) {
  const [claimCount, setClaimCount] = React.useState(1);
  const pricing = calculateAccountPricing(tier, claimCount);
  const isDIY = tier === "DIY_PREP";

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-center text-xl font-bold">
        {isDIY ? "DIY Path" : "Legal Path"} Pricing Calculator
      </h3>

      {/* Claim Counter */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Number of Claims
        </label>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setClaimCount(Math.max(1, claimCount - 1))}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
            disabled={claimCount <= 1}
          >
            −
          </button>
          <span className="w-16 text-center text-3xl font-bold">
            {claimCount}
          </span>
          <button
            onClick={() => setClaimCount(claimCount + 1)}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>

      {/* Pricing Display */}
      <PerClaimPricingDisplay
        tier={tier}
        numberOfClaims={claimCount}
        showBreakdown={claimCount > 1}
      />

      {/* Call to Action */}
      <button className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
        Get Started
      </button>
    </div>
  );
}

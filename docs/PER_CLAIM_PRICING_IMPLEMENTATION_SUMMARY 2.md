# Per-Claim Pricing Implementation Summary

## Overview

Successfully implemented per-claim pricing structure for RadiantClaims, replacing the previous account-based pricing model.

## Pricing Structure

### DIY Path
- **Setup Fee**: $149.99 per claim (includes first month)
- **Monthly Fees** (starting month 2):
  - First claim: $24.99/mo
  - Additional claims: $14.99/mo each

**Example**: User with 3 claims
- Month 1: 3 × $149.99 = **$449.97** (setup, includes service)
- Month 2+: $24.99 + $14.99 + $14.99 = **$54.97/mo**

### Lawyer Track
- **Setup Fee**: $89.99 per claim (**refundable** when DOJ receives claim)
- **Monthly Fee**: $24.99/mo per claim
- **No discount** for additional claims

**Example**: User with 3 claims
- Month 1: 3 × $89.99 = **$269.97** (refundable)
- Month 2+: 3 × $24.99 = **$74.97/mo**

## Files Created

### 1. Database Schema
**File**: `prisma/schema.prisma`

Added new `ClaimSubscription` model:
- Tracks individual claim subscriptions
- Links to `Claimant` and `ServiceSubscription`
- Stores claim order (determines pricing tier)
- Manages setup fee payment and refunds
- Handles per-claim Stripe subscription IDs

### 2. Pricing Calculator Utility
**File**: `src/lib/pricing-calculator.ts`

Core functions:
- `calculateClaimPricing()` - Pricing for a single claim
- `calculateAccountPricing()` - Total pricing for multiple claims
- `recalculateClaimOrders()` - Reorders claims after cancellation
- `calculateCancellationFeeAdjustment()` - Fee changes when claim cancelled
- `formatPricingDisplay()` - User-friendly pricing display
- `generatePricingTable()` - Table data for N claims

### 3. Updated Service Tiers Configuration
**File**: `src/lib/constants/service-tiers.ts`

Updated pricing structure:
- Replaced single `monthlyFee` with `monthlyFeeFirstClaim` and `monthlyFeeAdditional` for DIY
- Added `setupFeeRefundable` and `monthlyFeePerClaim` for Legal
- Updated Stripe product IDs to include 5 new products

### 4. Updated Stripe Configuration
**File**: `src/lib/stripe.ts`

New Stripe products:
- `DIY_SETUP_FEE` - $149.99 per claim
- `DIY_MONTHLY_FIRST_CLAIM` - $24.99/mo
- `DIY_MONTHLY_ADDITIONAL` - $14.99/mo
- `LEGAL_SETUP_FEE` - $89.99 per claim (refundable)
- `LEGAL_MONTHLY_PER_CLAIM` - $24.99/mo

### 5. Stripe Setup Script
**File**: `scripts/setup-stripe-products-per-claim.ts`

Automated script to create all 5 Stripe products and prices:
```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

Outputs price IDs for `.env` configuration.

### 6. React Components
**File**: `src/components/pricing/PerClaimPricingDisplay.tsx`

Three components:
1. **PerClaimPricingDisplay** - Detailed pricing breakdown
2. **PricingTable** - Comparison table for 1-N claims
3. **PricingCalculator** - Interactive claim counter widget

### 7. Migration Guide
**File**: `docs/PER_CLAIM_PRICING_MIGRATION.md`

Complete guide covering:
- Database migration steps
- Stripe product setup
- Environment variable configuration
- Existing subscription migration strategy
- Testing checklist
- Rollback plan

### 8. Environment Variables
**File**: `.env.example`

Updated with new Stripe price IDs:
```env
STRIPE_PRICE_ID_DIY_SETUP=
STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=
STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=
STRIPE_PRICE_ID_LEGAL_SETUP=
STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=
```

## Key Features

### ✅ Implemented

1. **Database schema** for per-claim subscriptions
2. **Pricing calculation utilities** with claim ordering logic
3. **Stripe product configuration** for all pricing tiers
4. **Automated Stripe setup script**
5. **React components** for pricing display
6. **Migration documentation**
7. **Environment configuration**

### ⏳ Still Needed (Next Steps)

1. **API Endpoints**:
   - Update `/api/subscriptions/create` for per-claim subscriptions
   - Implement `/api/subscriptions/cancel` with recalculation
   - Update `/api/webhooks/stripe` for per-claim events

2. **Claim Management**:
   - Auto-create `ClaimSubscription` when claim created
   - Recalculate fees when claim cancelled
   - Handle claim order updates

3. **Refund Logic** (Lawyer Track):
   - Monitor `ClaimLifecycle.receivedByDOJAt`
   - Auto-trigger refund via Stripe
   - Update `ClaimSubscription.setupFeeRefunded`

4. **UI Updates**:
   - Service tiers page with new pricing
   - Subscription portal showing all claims
   - Checkout flow for per-claim setup fees

5. **Migration Script**:
   - Convert existing subscriptions to per-claim model
   - Preserve customer pricing if needed

6. **Testing**:
   - Integration tests for pricing calculation
   - Stripe webhook tests
   - Claim cancellation flow tests

## Database Migration

Run this to create the new `ClaimSubscription` table:

```bash
npx prisma migrate dev --name add_claim_subscriptions
```

## Stripe Setup

Create all products in Stripe (test mode):

```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

Copy the output price IDs to your `.env` file.

## Usage Examples

### Calculate pricing for 3 claims (DIY)

```typescript
import { calculateAccountPricing } from '@/lib/pricing-calculator';

const pricing = calculateAccountPricing('DIY_PREP', 3);

console.log(pricing);
// {
//   totalClaims: 3,
//   setupFeePerClaim: 149.99,
//   totalSetupFees: 449.97,
//   monthlyFeeBreakdown: [
//     { claimOrder: 1, setupFee: 149.99, monthlyFee: 24.99 },
//     { claimOrder: 2, setupFee: 149.99, monthlyFee: 14.99 },
//     { claimOrder: 3, setupFee: 149.99, monthlyFee: 14.99 }
//   ],
//   totalMonthlyFee: 54.97,
//   firstMonthTotal: 449.97,
//   recurringMonthlyTotal: 54.97
// }
```

### Display pricing in UI

```tsx
import { PerClaimPricingDisplay } from '@/components/pricing/PerClaimPricingDisplay';

function MyPage() {
  return (
    <PerClaimPricingDisplay
      tier="DIY_PREP"
      numberOfClaims={3}
      showBreakdown={true}
    />
  );
}
```

### Handle claim cancellation

```typescript
import { recalculateClaimOrders } from '@/lib/pricing-calculator';

// User has 3 claims, cancels claim 2
const activeClaims = await prisma.claimSubscription.findMany({
  where: {
    serviceSubscriptionId: 'sub_xxx',
    status: 'ACTIVE'
  },
  include: { claimant: true }
});

const newOrders = recalculateClaimOrders(
  activeClaims.map(c => ({
    id: c.id,
    currentOrder: c.claimOrder,
    createdAt: c.claimant.createdAt
  }))
);

// Update claim orders and fees
for (const { id, newOrder } of newOrders) {
  const newFee = newOrder === 1 ? 24.99 : 14.99;
  await prisma.claimSubscription.update({
    where: { id },
    data: {
      claimOrder: newOrder,
      monthlyFeeAmount: newFee
    }
  });
}
```

## Important Notes

### Claim Ordering Logic

- Claims are ordered by **creation date** (oldest = claim 1)
- When a claim is cancelled, **all remaining claims are reordered**
- For DIY: If claim 1 is cancelled, claim 2 becomes claim 1 (fee **increases** from $14.99 to $24.99)
- For Lawyer: All claims same price, order doesn't affect pricing

### Billing Consolidation

- One Stripe customer per user account
- **Multiple subscriptions** (one per claim)
- Monthly invoice shows **line items for each claim**
- User sees **one total** monthly charge

### Refund Policy (Lawyer Track)

- Setup fee ($89.99) is **refundable**
- Refunded when `ClaimLifecycle.receivedByDOJAt` is set
- Refund via Stripe API, not manual
- Track in `ClaimSubscription.setupFeeRefunded`

## Testing the Implementation

1. **Pricing Calculation**:
   ```bash
   # Run in Node REPL
   node
   > const { calculateAccountPricing } = require('./src/lib/pricing-calculator.ts');
   > calculateAccountPricing('DIY_PREP', 3);
   ```

2. **Stripe Products**:
   ```bash
   npx tsx scripts/setup-stripe-products-per-claim.ts
   # Verify in Stripe Dashboard
   ```

3. **Database Schema**:
   ```bash
   npx prisma migrate dev
   npx prisma studio
   # Check ClaimSubscription table exists
   ```

## Next Session Tasks

Priority order for completing the implementation:

1. ✅ **High Priority**: Update subscription creation API
2. ✅ **High Priority**: Implement claim cancellation with recalculation
3. ✅ **High Priority**: Update Stripe webhook handler
4. ⚠️ **Medium Priority**: Build subscription portal UI
5. ⚠️ **Medium Priority**: Update service tiers page
6. ⚠️ **Medium Priority**: Implement setup fee refund (lawyer track)
7. ⚡ **Low Priority**: Bundle pricing options
8. ⚡ **Low Priority**: Promo code integration
9. ⚡ **Low Priority**: Family plan discounts

## Questions to Address

1. **Bundle Pricing**: Do we want to add bundles now (3 claims for $49.99)?
2. **Existing Customers**: How to handle transition for current subscribers?
3. **Free Trials**: Should trials apply per claim or per account?
4. **Promo Codes**: Per claim discount or account-wide?
5. **Setup Fee Timing**: Allow payment plans for setup fees?

## Documentation Links

- [Migration Guide](./PER_CLAIM_PRICING_MIGRATION.md)
- [Pricing Calculator API](../src/lib/pricing-calculator.ts)
- [React Components](../src/components/pricing/PerClaimPricingDisplay.tsx)
- [Stripe Setup Script](../scripts/setup-stripe-products-per-claim.ts)

---

**Status**: ✅ Core infrastructure complete, ready for API and UI implementation.

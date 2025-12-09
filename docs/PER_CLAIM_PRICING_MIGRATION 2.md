# Per-Claim Pricing Migration Guide

## Overview

This document outlines the migration from account-based pricing to per-claim pricing for RadiantClaims.

## New Pricing Structure

### DIY Path (per claim)
- **Setup Fee**: $149.99 per claim (includes first month of service)
- **Monthly Fee (starting month 2)**:
  - First claim: $24.99/mo
  - Each additional claim: $14.99/mo
- **Example**: 3 claims
  - First month: 3 × $149.99 = $449.97
  - Recurring (month 2+): $24.99 + $14.99 + $14.99 = $54.97/mo

### Lawyer Track (per claim)
- **Setup Fee**: $89.99 per claim (refundable upon DOJ claim receipt)
- **Monthly Fee**: $24.99/mo per claim
  - **Important**: No discount for additional claims on lawyer track
- **Example**: 3 claims
  - First month: 3 × $89.99 = $269.97 (refundable)
  - Recurring: 3 × $24.99 = $74.97/mo

## Database Changes

### New Model: `ClaimSubscription`

Each claim now has its own subscription record that tracks:
- Setup fee payment status
- Monthly fee amount (based on claim order)
- Claim order (1 = first claim, 2+ = additional)
- Stripe subscription ID (per claim)
- Refund status (for lawyer track)

```prisma
model ClaimSubscription {
  id                    String              @id @default(cuid())
  claimantId            String              @unique
  serviceSubscriptionId String
  claimOrder            Int                 // Determines pricing tier
  setupFeePaid          Boolean             @default(false)
  setupFeeAmount        Float               // DIY: 149.99, Lawyer: 89.99
  monthlyFeeAmount      Float               // Based on claimOrder
  setupFeeRefunded      Boolean             @default(false)
  lawyerTrackNoDiscount Boolean             @default(false)
  status                SubscriptionStatus  @default(ACTIVE)
  // ... other fields
}
```

## Implementation Steps

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_claim_subscriptions
```

This creates the `ClaimSubscription` table and adds relations.

### 2. Create Stripe Products

```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

This creates 5 products in Stripe:
1. DIY Setup Fee ($149.99)
2. DIY First Claim Monthly ($24.99)
3. DIY Additional Claim Monthly ($14.99)
4. Legal Setup Fee ($89.99, refundable)
5. Legal Monthly per Claim ($24.99)

### 3. Update Environment Variables

Add the new Stripe price IDs to your `.env` file:

```env
# DIY Path
STRIPE_PRICE_ID_DIY_SETUP=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=price_xxx

# Lawyer Path
STRIPE_PRICE_ID_LEGAL_SETUP=price_xxx
STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=price_xxx
```

### 4. Migrate Existing Subscriptions (if any)

**Note**: This is a breaking change for existing customers. You'll need to:

1. Identify all existing subscriptions
2. For each user with claims:
   - Create `ClaimSubscription` records for each claim
   - Assign `claimOrder` based on creation date (oldest = 1)
   - Calculate correct `monthlyFeeAmount` based on order
   - Migrate Stripe subscriptions to new pricing

**Migration script needed** (not yet implemented):
```bash
npx tsx scripts/migrate-to-per-claim-pricing.ts
```

### 5. Update API Endpoints

The following endpoints need updates to handle per-claim pricing:

- `/api/subscriptions/create` - Create subscription for new claim
- `/api/subscriptions/cancel` - Handle claim cancellation and recalculation
- `/api/subscriptions/webhook` - Process Stripe events per claim
- `/api/claims/create` - Trigger claim subscription creation

## Key Functions

### Pricing Calculation

Use the new `pricing-calculator.ts` utilities:

```typescript
import { calculateAccountPricing, calculateClaimPricing } from '@/lib/pricing-calculator';

// Calculate for a single claim
const claimPricing = calculateClaimPricing('DIY_PREP', 2); // 2nd claim
// Returns: { claimOrder: 2, setupFee: 149.99, monthlyFee: 14.99 }

// Calculate total for account with N claims
const accountPricing = calculateAccountPricing('DIY_PREP', 3);
// Returns detailed breakdown including total monthly fee
```

### Claim Cancellation

When a claim is cancelled:

1. **Recalculate claim orders** for remaining claims (oldest becomes claim 1)
2. **Update monthly fees** based on new orders
3. **Adjust Stripe subscriptions** to reflect new pricing
4. **For DIY**: If claim 1 is cancelled, claim 2 becomes claim 1 (fee increases from $14.99 to $24.99)
5. **For Lawyer**: All claims same price, just reduce total count

```typescript
import { recalculateClaimOrders } from '@/lib/pricing-calculator';

const activeClaims = [
  { id: 'claim1', currentOrder: 1, createdAt: new Date('2024-01-01') },
  { id: 'claim2', currentOrder: 2, createdAt: new Date('2024-02-01') },
  { id: 'claim3', currentOrder: 3, createdAt: new Date('2024-03-01') },
];

// User cancels claim2
const remainingClaims = activeClaims.filter(c => c.id !== 'claim2');
const newOrders = recalculateClaimOrders(remainingClaims);
// Returns: [{ id: 'claim1', newOrder: 1 }, { id: 'claim3', newOrder: 2 }]
```

## Pricing Display

### Service Tiers Page

Update to show per-claim pricing:

```typescript
import { SERVICE_TIERS } from '@/lib/constants/service-tiers';

// DIY Pricing
const diy = SERVICE_TIERS.DIY_PREP.pricing;
// Access: diy.setupFee, diy.monthlyFeeFirstClaim, diy.monthlyFeeAdditional

// Legal Pricing
const legal = SERVICE_TIERS.LEGAL_REP.pricing;
// Access: legal.setupFee, legal.setupFeeRefundable, legal.monthlyFeePerClaim
```

### Subscription Portal

Show breakdown of all claims:

```
Your Active Claims:

Claim 1 (Pancreatic Cancer - Jane Doe)
  Monthly Fee: $24.99/mo
  Setup Fee: $149.99 (paid)

Claim 2 (Thyroid Cancer - John Doe)
  Monthly Fee: $14.99/mo
  Setup Fee: $149.99 (paid)

Total Monthly: $39.98/mo
Next billing date: March 1, 2025
```

## Important Considerations

### 1. Promo Codes
- Promo codes should apply **per claim**, not per account
- Update promo code logic to work with `ClaimSubscription`

### 2. Refunds (Lawyer Track)
- Track DOJ claim receipt date in `ClaimLifecycle`
- Trigger setup fee refund when `receivedByDOJAt` is set
- Update `ClaimSubscription.setupFeeRefunded` and `setupFeeRefundedAt`

### 3. Billing Consolidation
- All claims under one account billed together monthly
- One Stripe customer, multiple subscriptions
- Stripe invoice shows line items for each claim

### 4. Free Trial / Pilot Accounts
- If offering trials, apply per claim (not per account)
- Track in `ClaimSubscription` metadata

## Testing Checklist

- [ ] Create new claim - charges correct setup fee
- [ ] Add 2nd claim - charges additional setup fee
- [ ] Monthly billing - correct total for multiple claims
- [ ] Cancel claim 1 (DIY) - claim 2 fee increases to $24.99
- [ ] Cancel claim 2 (DIY) - total decreases by $14.99
- [ ] Lawyer track - no discount for additional claims
- [ ] Setup fee refund (lawyer) - triggers on DOJ receipt
- [ ] Promo code - applies correctly per claim
- [ ] Subscription portal - shows all claims with pricing
- [ ] Stripe webhook - handles per-claim events

## Rollback Plan

If issues arise:

1. **Pause new claim creation**
2. **Revert database migration**: `npx prisma migrate reset`
3. **Restore old Stripe products** from backup
4. **Update .env** to use old price IDs
5. **Redeploy previous version**

## Support Documentation

Update these docs for customers:

1. **Pricing page** - Show per-claim pricing clearly
2. **FAQ** - "What if I have multiple claims?"
3. **Terms of Service** - Update pricing terms
4. **Email templates** - Billing notifications per claim

## Next Steps

After migration is complete:

- [ ] Monitor Stripe webhooks for errors
- [ ] Track customer feedback on new pricing
- [ ] Consider bundle pricing (3 claims for $49.99/mo, etc.)
- [ ] Implement family plan discounts
- [ ] Add pricing calculator to marketing site

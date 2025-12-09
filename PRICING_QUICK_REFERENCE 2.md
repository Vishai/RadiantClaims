# Per-Claim Pricing Quick Reference

## 🎯 Pricing at a Glance

### DIY Path
| Claims | Setup (Month 1) | Monthly (Month 2+) | Calculation |
|--------|----------------|-------------------|-------------|
| 1      | $149.99        | $24.99/mo         | Base rate |
| 2      | $299.98        | $39.98/mo         | $24.99 + $14.99 |
| 3      | $449.97        | $54.97/mo         | $24.99 + $14.99 + $14.99 |
| 4      | $599.96        | $69.96/mo         | $24.99 + 3($14.99) |
| 5      | $749.95        | $84.95/mo         | $24.99 + 4($14.99) |
| 10     | $1,499.90      | $159.90/mo        | $24.99 + 9($14.99) |

### Lawyer Track
| Claims | Setup (Month 1) | Monthly (Month 2+) | Calculation |
|--------|----------------|-------------------|-------------|
| 1      | $89.99*        | $24.99/mo         | Base rate |
| 2      | $179.98*       | $49.98/mo         | 2 × $24.99 |
| 3      | $269.97*       | $74.97/mo         | 3 × $24.99 |
| 4      | $359.96*       | $99.96/mo         | 4 × $24.99 |
| 5      | $449.95*       | $124.95/mo        | 5 × $24.99 |
| 10     | $899.90*       | $249.90/mo        | 10 × $24.99 |

*Refundable when DOJ receives claim

## 📋 Key Differences

| Feature | DIY Path | Lawyer Track |
|---------|----------|--------------|
| Setup Fee | $149.99 per claim | $89.99 per claim |
| Setup Fee Refundable | ❌ No | ✅ Yes (on DOJ receipt) |
| First Claim Monthly | $24.99/mo | $24.99/mo |
| Additional Claims | $14.99/mo each | $24.99/mo each (no discount) |
| Setup Includes | First month of service | First month of service |

## 🔧 Implementation Files

### Core Files
```
prisma/schema.prisma               - ClaimSubscription model
src/lib/pricing-calculator.ts      - Pricing logic
src/lib/constants/service-tiers.ts - Pricing configuration
src/lib/stripe.ts                  - Stripe products
```

### Scripts
```
scripts/setup-stripe-products-per-claim.ts - Create Stripe products
scripts/test-pricing-calculator.ts         - Test pricing calculations
```

### Components
```
src/components/pricing/PerClaimPricingDisplay.tsx - React UI components
```

### Documentation
```
docs/PER_CLAIM_PRICING_MIGRATION.md              - Full migration guide
docs/PER_CLAIM_PRICING_IMPLEMENTATION_SUMMARY.md - Implementation summary
```

## 🚀 Quick Start

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_claim_subscriptions
```

### 2. Create Stripe Products
```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

### 3. Update Environment Variables
Copy the price IDs from the script output to your `.env`:
```env
STRIPE_PRICE_ID_DIY_SETUP=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=price_xxx
STRIPE_PRICE_ID_LEGAL_SETUP=price_xxx
STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=price_xxx
```

### 4. Test Calculations
```bash
npx tsx scripts/test-pricing-calculator.ts
```

## 💻 Code Examples

### Calculate Pricing
```typescript
import { calculateAccountPricing } from '@/lib/pricing-calculator';

// DIY with 3 claims
const pricing = calculateAccountPricing('DIY_PREP', 3);
// Result: $449.97 setup, $54.97/mo recurring

// Legal with 3 claims
const legalPricing = calculateAccountPricing('LEGAL_REP', 3);
// Result: $269.97 setup (refundable), $74.97/mo recurring
```

### Display Pricing in UI
```tsx
import { PerClaimPricingDisplay } from '@/components/pricing/PerClaimPricingDisplay';

<PerClaimPricingDisplay tier="DIY_PREP" numberOfClaims={3} />
```

### Handle Claim Cancellation
```typescript
import { recalculateClaimOrders } from '@/lib/pricing-calculator';

// After user cancels a claim, reorder remaining claims
const newOrders = recalculateClaimOrders(remainingClaims);
// Update database with new claim orders and fees
```

## ⚠️ Important Notes

### Claim Ordering
- Claims ordered by creation date (oldest = claim 1)
- When claim cancelled, all remaining claims reordered
- **DIY**: If claim 1 cancelled, claim 2 becomes claim 1 (fee increases $14.99 → $24.99)
- **Lawyer**: All claims same price, order doesn't affect fee

### Billing
- One Stripe customer per user
- Multiple subscriptions (one per claim)
- Monthly invoice shows all claims as line items
- Setup fee includes first month (no separate monthly charge month 1)

### Refunds (Lawyer Track Only)
- Setup fee refunded when `ClaimLifecycle.receivedByDOJAt` is set
- Automatic via Stripe API
- Track in `ClaimSubscription.setupFeeRefunded`

## 📊 Pricing Calculator Widget

Interactive pricing calculator available:

```tsx
import { PricingCalculator } from '@/components/pricing/PerClaimPricingDisplay';

<PricingCalculator tier="DIY_PREP" />
```

Users can adjust claim count and see pricing update in real-time.

## 🔄 Next Steps

1. ✅ **Database schema** - Complete
2. ✅ **Pricing calculator** - Complete
3. ✅ **Stripe configuration** - Complete
4. ✅ **React components** - Complete
5. ⏳ **API endpoints** - Pending
6. ⏳ **Webhook handlers** - Pending
7. ⏳ **UI integration** - Pending
8. ⏳ **Migration script** - Pending

## 🆘 Support

For questions or issues:
- See full migration guide: `docs/PER_CLAIM_PRICING_MIGRATION.md`
- See implementation summary: `docs/PER_CLAIM_PRICING_IMPLEMENTATION_SUMMARY.md`
- Test calculations: `npx tsx scripts/test-pricing-calculator.ts`

---

**Last Updated**: December 4, 2025
**Status**: ✅ Core implementation complete, API integration pending

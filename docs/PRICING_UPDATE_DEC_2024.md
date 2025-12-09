# Pricing Update - December 2024

## Overview

The RadiantClaims pricing structure has been updated to simplify the payment model and provide customers with flexible payment options.

## New Pricing Structure

### DIY Path
- **One-time Payment**: $499.99 (full payment)
- **Installment Plan**: 2 payments of $249.99 (total $499.98)

### Legal Rep Path
- No changes: $0 upfront (backend B2B billing)

## What Changed

### Previous Pricing (Deprecated)
- DIY: $149.99 setup fee + $24.99/month recurring
- First claim: $24.99/month
- Additional claims: $14.99/month

### New Pricing (Current)
- DIY: $499.99 one-time OR 2 payments of $249.99
- **No recurring monthly fees**
- Simple, predictable pricing

## Implementation Details

### Database Changes

#### ServiceSubscription Model
New fields added to track installment payments:
```prisma
model ServiceSubscription {
  // ... existing fields ...

  // NEW: Installment Plan Support (2 payments of $249.99)
  isInstallmentPlan     Boolean @default(false) // True if user chose 2-payment plan
  installmentPaymentCount Int   @default(0) // Track number of payments made (max 2)
  installmentCompleted  Boolean @default(false) // True when all installments paid
}
```

### Environment Variables

Update your `.env` file with these new Stripe price IDs:

```bash
# DIY Path - NEW PRICING
STRIPE_PRICE_ID_DIY_PACKET=""              # One-time $499.99
STRIPE_PRICE_ID_PACKET_2_PAYMENTS=""       # Installment $249.99/month (max 2 payments)
```

### Files Modified

1. **`.env.example`**
   - Added new price ID variables
   - Marked old variables as deprecated

2. **`src/lib/constants/service-tiers.ts`**
   - Updated pricing constants
   - Added new Stripe product configurations

3. **`src/lib/stripe.ts`**
   - Added `DIY_PACKET_FULL` and `DIY_PACKET_INSTALLMENT` configs
   - Updated amounts to $499.99 and $249.99

4. **`src/app/api/subscriptions/create/route.ts`**
   - Added `paymentPlan` parameter (`"full"` or `"installment"`)
   - Create Stripe checkout with correct pricing based on plan
   - Set `mode: "subscription"` for installment plan to enable recurring billing

5. **`src/app/api/webhooks/stripe/route.ts`**
   - Updated `handleCheckoutCompleted` to track installment payments
   - Updated `handleInvoicePaymentSucceeded` to:
     - Track payment count
     - Mark as fully paid after 2nd payment
     - **Automatically cancel Stripe subscription after 2 payments**

6. **`prisma/schema.prisma`**
   - Added installment tracking fields

## How It Works

### Full Payment Option
1. User selects "Pay in Full" ($499.99)
2. Stripe Checkout created with `mode: "payment"` (one-time)
3. On payment success:
   - `setupFeePaid = true`
   - `setupFeePaidAt = current timestamp`
   - `status = "ACTIVE"`
4. User has immediate access to service

### Installment Plan Option
1. User selects "2 Payment Plan" ($249.99 × 2)
2. Stripe Checkout created with `mode: "subscription"` (recurring)
3. On first payment success:
   - `installmentPaymentCount = 1`
   - `status = "ACTIVE"`
   - User has access to service
4. Stripe automatically charges second payment after 1 month
5. On second payment success:
   - `installmentPaymentCount = 2`
   - `installmentCompleted = true`
   - `setupFeePaid = true`
   - Stripe subscription **automatically canceled** (prevents additional charges)

### Automatic Subscription Cancellation

**Critical Feature**: The system automatically cancels the Stripe subscription after the 2nd payment to ensure users are never charged more than twice.

This happens in the webhook handler:
```typescript
if (newPaymentCount >= 2) {
  // Mark as fully paid
  await prisma.serviceSubscription.update({ ... });

  // Cancel Stripe subscription to prevent further charges
  if (stripeSubscriptionId) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
    console.log(`✅ Stripe subscription canceled after 2 payments`);
  }
}
```

## API Usage

### Creating a Subscription with Payment Plan

```typescript
// Full payment
POST /api/subscriptions/create
{
  "tier": "DIY_PREP",
  "paymentPlan": "full",  // Optional, defaults to "full"
  "policyType": "TERMS_OF_SERVICE",
  "policyVersion": "1.0"
}

// Installment plan
POST /api/subscriptions/create
{
  "tier": "DIY_PREP",
  "paymentPlan": "installment",
  "policyType": "TERMS_OF_SERVICE",
  "policyVersion": "1.0"
}
```

### Response

```json
{
  "success": true,
  "subscription": { ... },
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

## Setting Up Stripe Products

### 1. Create Products in Stripe Dashboard

**Product 1: DIY Complete Packet (Full Payment)**
- Name: RadiantClaims DIY - Complete Packet
- Price: $499.99 USD
- Type: One-time
- Copy the Price ID and set `STRIPE_PRICE_ID_DIY_PACKET`

**Product 2: DIY 2-Payment Plan**
- Name: RadiantClaims DIY - 2 Payment Plan
- Price: $249.99 USD
- Type: Recurring (monthly)
- Billing Period: Monthly
- Copy the Price ID and set `STRIPE_PRICE_ID_PACKET_2_PAYMENTS`

### 2. Update Environment Variables

```bash
# In your .env file
STRIPE_PRICE_ID_DIY_PACKET="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ID_PACKET_2_PAYMENTS="price_xxxxxxxxxxxxx"
```

### 3. Restart Your Application

```bash
pnpm run dev
```

## Testing

### Test with Stripe Test Mode

1. Use Stripe test keys in development
2. Use test card: `4242 4242 4242 4242`
3. Test both payment options:
   - Full payment: Verify immediate access
   - Installment:
     - Verify access after first payment
     - Use Stripe CLI to trigger second invoice:
       ```bash
       stripe trigger invoice.payment_succeeded
       ```
     - Verify subscription is canceled after 2nd payment

### Verification Checklist

- [ ] Full payment option charges $499.99 once
- [ ] Installment option charges $249.99 first payment
- [ ] User gets access after first payment (both options)
- [ ] Second installment payment occurs after 1 month
- [ ] Subscription automatically cancels after 2nd payment
- [ ] User is never charged a 3rd time
- [ ] Payment records are created correctly
- [ ] Audit logs are created for all payments

## Migration Notes

### For Existing Users

Existing users on the old pricing structure:
- Continue with their current billing until they cancel
- New signups only see new pricing
- Consider grandfather clause communication

### Database Migration

```bash
# Migration was created and applied
pnpm prisma migrate dev

# Migration name: 20251209200542_add_installment_payment_tracking
```

## Safety Mechanisms

### Preventing Overcharges

1. **Database-level tracking**: `installmentPaymentCount` field tracks exactly how many payments have been made
2. **Automatic cancellation**: Stripe subscription is canceled immediately after 2nd payment
3. **Webhook validation**: Payment count is checked before processing each invoice
4. **Status flags**: `installmentCompleted` provides explicit completion state

### Monitoring Recommendations

Monitor these metrics:
- Installment plans created
- Subscriptions with `installmentPaymentCount > 2` (should be 0)
- Failed cancellation attempts
- Audit logs for installment payments

## Rollback Plan

If issues arise:

1. **Immediate**: Disable new signups using feature flag
2. **Short-term**: Manually cancel subscriptions that reached 2 payments
3. **Long-term**: Revert to old pricing structure:
   - Restore old Stripe price IDs
   - Roll back database migration
   - Deploy previous application version

## Support

For questions or issues:
1. Check Stripe Dashboard for payment status
2. Review database `ServiceSubscription` records
3. Check application logs for webhook processing
4. Review `Payment` records for payment history

## Changelog

### December 9, 2024
- Implemented new pricing structure ($499.99 flat or 2 × $249.99)
- Added installment payment tracking
- Added automatic subscription cancellation after 2 payments
- Updated API to support payment plan selection
- Created database migration for new fields
- Updated documentation

---

**Important**: This pricing change is effective immediately for all new signups. Test thoroughly before deploying to production.

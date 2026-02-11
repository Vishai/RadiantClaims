# Legal Representation Pricing Setup ($14.99/month)

## Overview

Legal Representation users are now charged **$14.99/month** as a platform fee. This replaces the previous free access model.

## Changes Made

### 1. **Added Stripe Configuration** ✅
- **File**: `src/lib/stripe.ts`
- **Added**: `LEGAL_REP_MONTHLY` configuration
  ```typescript
  LEGAL_REP_MONTHLY: {
    priceId: process.env.STRIPE_PRICE_ID_LEGAL_REP_MONTHLY || "",
    amount: 1499, // $14.99 in cents
    currency: "usd",
    interval: "month" as const,
    description: "RadiantClaims Legal Representation - Monthly Platform Fee",
  }
  ```

### 2. **Updated Subscription Creation** ✅
- **File**: `src/app/api/subscriptions/create/route.ts:210-289`
- **Change**: Legal Rep subscriptions now:
  - Start with `status: "PENDING"` (not ACTIVE)
  - Create Stripe checkout session for $14.99/month
  - Only activate after successful payment (via webhook)

**Before:**
```typescript
// No payment required - immediate access
const subscription = await db.serviceSubscription.create({
  tier: "LEGAL_REP",
  status: "ACTIVE",
  setupFeePaid: true,
});
```

**After:**
```typescript
// Payment required via Stripe
const subscription = await db.serviceSubscription.create({
  tier: "LEGAL_REP",
  status: "PENDING",
  setupFeePaid: false,
  monthlyFeeAmount: 14.99,
});
// Create Stripe checkout session...
```

### 3. **Updated Access Control** ✅
- **File**: `src/app/api/subscriptions/status/route.ts:48-62`
- **Change**: Legal Rep users must have `status: "ACTIVE"` (after payment) to access forms

**Before:**
```typescript
// Always had access
if (subscription.tier === "LEGAL_REP") {
  return { canAccessForms: true };
}
```

**After:**
```typescript
// Must pay first
if (subscription.tier === "LEGAL_REP") {
  const canAccessForms = subscription.status === "ACTIVE";
  return { canAccessForms, needsPayment: !canAccessForms };
}
```

### 4. **Webhook Handler** ✅
- **File**: `src/app/api/webhooks/stripe/route.ts`
- **No changes needed** - webhook already handles both DIY and Legal Rep correctly
- Sets `status: "ACTIVE"` and `setupFeePaid: true` after successful payment

## Environment Variable Setup

### Step 1: Get Your Stripe Price ID

1. Go to **Stripe Dashboard** → Products
2. Find your Legal Rep product (or create a new one):
   - Name: "RadiantClaims Legal Representation - Monthly Platform Fee"
   - Price: $14.99/month
   - Billing: Recurring monthly
3. **Copy the Price ID** (starts with `price_...`)

### Step 2: Update .env File

Add the Price ID to your `.env` file:

```bash
# Legal Rep Monthly Subscription ($14.99/month)
STRIPE_PRICE_ID_LEGAL_REP_MONTHLY=price_xxxxxxxxxxxxx
```

**Example:**
```bash
STRIPE_PRICE_ID_LEGAL_REP_MONTHLY=price_1SPWZzDDIyVTg3FvXXXXXXXX
```

### Step 3: Restart Your Dev Server

```bash
npm run dev
```

## Testing the Flow

### 1. Test Payment Flow

1. Navigate to `/service-tiers`
2. Click **"Select Legal Path"**
3. Accept the Legal Representation Agreement
4. **Should redirect to Stripe checkout** for $14.99/month
5. Complete test payment with card: `4242 4242 4242 4242`
6. Should redirect back to `/portal?payment=success`
7. Subscription should now be `ACTIVE` in database

### 2. Verify Database

```sql
SELECT
  u.email,
  ss.tier,
  ss.status,
  ss."monthlyFeeAmount",
  ss."setupFeePaid",
  ss."stripeCustomerId",
  ss."stripeSubscriptionId"
FROM "User" u
JOIN "ServiceSubscription" ss ON u.id = ss."userId"
WHERE ss.tier = 'LEGAL_REP'
ORDER BY ss."createdAt" DESC
LIMIT 5;
```

**Expected results:**
- `tier`: `LEGAL_REP`
- `status`: `ACTIVE` (after payment)
- `monthlyFeeAmount`: `14.99`
- `setupFeePaid`: `true` (set by webhook)
- `stripeCustomerId`: `cus_xxxxx`
- `stripeSubscriptionId`: `sub_xxxxx`

### 3. Test Access Control

1. Login as Legal Rep user
2. Navigate to `/portal`
3. Click **"Start Application"**
4. **Should access RECA form** (not redirected to service-tiers)

## Pricing Comparison

| Path | Setup Fee | Monthly Fee | Total First Month | Subsequent Months |
|------|-----------|-------------|-------------------|-------------------|
| **DIY Prep** | $149.99 | $24.99 | $174.98 | $24.99 |
| **Legal Rep** | $0 | $14.99 | $14.99 | $14.99 |

**Plus attorney fees:**
- Legal Rep users also pay 2% of award ($2,000 for $100,000 claim) to Heritage Law Offices

## Migration Notes

### Existing Legal Rep Users

If you have existing Legal Rep users who were grandfathered in with free access:

**Option 1: Grandfather them in perpetuity**
```sql
-- Mark as pilot account (free forever)
UPDATE "ServiceSubscription"
SET
  "isPilotAccount" = true,
  "status" = 'ACTIVE'
WHERE tier = 'LEGAL_REP'
  AND "createdAt" < '2025-12-02';
```

**Option 2: Require payment going forward**
```sql
-- Set to PENDING - they'll need to pay on next login
UPDATE "ServiceSubscription"
SET "status" = 'PENDING'
WHERE tier = 'LEGAL_REP'
  AND "createdAt" < '2025-12-02';
```

## Troubleshooting

### Issue: "Legal Rep checkout is temporarily unavailable"

**Cause**: `STRIPE_PRICE_ID_LEGAL_REP_MONTHLY` not set or incorrect

**Fix**:
1. Check `.env` file has the correct Price ID
2. Restart dev server
3. Verify Price ID exists in Stripe Dashboard

### Issue: User stuck in PENDING status

**Cause**: Webhook not firing or payment not completed

**Fix**:
1. Run sync script: `npx tsx scripts/sync-stripe-payments.ts`
2. Or manually update:
   ```sql
   UPDATE "ServiceSubscription"
   SET
     status = 'ACTIVE',
     "setupFeePaid" = true,
     "setupFeePaidAt" = NOW()
   WHERE id = 'subscription_id_here';
   ```

### Issue: Webhook not firing locally

**Cause**: Stripe CLI not forwarding webhooks

**Fix**:
```bash
# Start webhook listener
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Copy the webhook secret and add to .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Restart dev server
npm run dev
```

## Summary

✅ Legal Rep users now pay $14.99/month
✅ Payment required before accessing RECA forms
✅ Webhooks properly activate subscriptions
✅ Consistent flow with DIY path
✅ Easy to test locally with Stripe test mode

## Files Changed

1. ✅ `src/lib/stripe.ts` - Added LEGAL_REP_MONTHLY config
2. ✅ `src/app/api/subscriptions/create/route.ts` - Updated to create Stripe checkout
3. ✅ `src/app/api/subscriptions/status/route.ts` - Updated access control
4. ✅ `.env` - Added STRIPE_PRICE_ID_LEGAL_REP_MONTHLY variable
5. ✅ `docs/LEGAL_REP_PRICING_SETUP.md` - Created documentation (this file)

**Next Step:** Add your Stripe Price ID to the `.env` file and test the flow!

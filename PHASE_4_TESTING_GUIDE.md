# Phase 4: Payment Gate Testing Guide

## Overview
Phase 4 implements access control for RECA forms based on service tier selection and payment status.

## What Was Built

### 1. API Route: Subscription Status Check
**File**: `src/app/api/subscriptions/status/route.ts`
- Returns user's current subscription status
- Checks if user has selected a tier (DIY vs Legal)
- Validates payment status for DIY users
- Returns `canAccessForms` boolean flag

### 2. Payment Gate on /reca/start
**File**: `src/app/reca/start/page.tsx`
- Checks subscription status on page load
- Shows different CTAs based on user state:
  - Not authenticated → Show login/signup options
  - No tier selected → "Choose Your Service Tier" button
  - DIY user without payment → "Complete Payment" button
  - DIY user with active subscription → "Start RECA Form" button
  - Legal path user → "Start RECA Form" button + referral info

### 3. Middleware Protection
**File**: `src/middleware.ts`
- Added `/reca/form/:path*` to protected routes
- Requires authentication to access any RECA form page
- Redirects unauthenticated users to login with callback URL

### 4. Form Page Access Control
**File**: `src/app/reca/form/[sessionId]/page.tsx`
- Checks subscription status on component mount
- Redirects to `/service-tiers` if user lacks access
- Shows loading state while verifying subscription
- Only renders form if `canAccessForms === true`

## Testing Flow

### Prerequisites
1. **Database Migration** (if not done yet):
   ```bash
   npx prisma migrate dev --name add_service_tiers_and_payments
   ```

2. **Stripe CLI Setup** (REQUIRED):
   ```bash
   # Install Stripe CLI (if not already installed)
   brew install stripe/stripe-cli/stripe

   # Login to Stripe
   stripe login

   # Start webhook forwarding
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the webhook secret that starts with `whsec_` and add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```

### Test Scenario 1: New User - DIY Path

1. **Navigate to homepage**: http://localhost:3000
2. **Click "Get Started"** → Should route to `/eligibility`
3. **Complete eligibility check** → Click "Start Your Claim"
4. **Should route to**: `/service-tiers`
5. **Select "DIY Path"** → Click "Start with DIY Path"
6. **Stripe Checkout should open** for $149.99 setup fee
7. **Use Stripe test card**: `4242 4242 4242 4242` (any future expiry, any CVC)
8. **Complete payment**
9. **Webhook fires** → Creates ServiceSubscription with `setupFeePaid: true`
10. **User redirected to** `/portal` or success page
11. **Navigate to** `/reca/start`
12. **Should see**: "Start RECA Form" button (no payment gate)
13. **Click Start** → Should successfully load `/reca/form/[sessionId]?section=part_1`

### Test Scenario 2: New User - Legal Path

1. **Navigate to**: `/service-tiers`
2. **Select "Legal Representation Path"** → Click "Get Legal Representation"
3. **Should see**: Heritage Law referral form
4. **Submit form** → Creates ServiceSubscription with `tier: LEGAL_REP`
5. **Navigate to** `/reca/start`
6. **Should see**: "Start RECA Form" button + Legal representation notice
7. **Click Start** → Should successfully load RECA form

### Test Scenario 3: Existing User - No Tier Selected

1. **Login as existing user** (without ServiceSubscription)
2. **Navigate to** `/reca/start`
3. **Should see**: "Choose Your Path" message with button
4. **Click button** → Redirects to `/service-tiers`
5. **Attempting to directly access** `/reca/form/[sessionId]` → Should redirect to `/service-tiers?error=payment_required`

### Test Scenario 4: DIY User - Payment Incomplete

1. **Create user with DIY tier** but `setupFeePaid: false`
2. **Navigate to** `/reca/start`
3. **Should see**: "Payment Required" message
4. **Click "Complete Payment"** → Redirects to `/service-tiers`
5. **Attempting to access form** → Redirected to payment

### Test Scenario 5: DIY User - Subscription Canceled

1. **Existing DIY user** with `status: CANCELED`
2. **Navigate to** `/reca/start`
3. **Should see**: Payment gate (can't access)
4. **Navigate to** `/service-tiers` → Option to reactivate

## Expected Subscription States

### DIY Path Access Requirements
```typescript
canAccessForms =
  tier === "DIY_PREP" &&
  setupFeePaid === true &&
  status === "ACTIVE"
```

### Legal Path Access Requirements
```typescript
canAccessForms = tier === "LEGAL_REP"
// Status doesn't matter for legal path
```

## Database Verification Queries

Check subscription status:
```sql
SELECT
  u.email,
  ss.tier,
  ss.status,
  ss.setupFeePaid,
  ss.setupFeePaidAt,
  ss.nextBillingDate
FROM "User" u
LEFT JOIN "ServiceSubscription" ss ON u.id = ss."userId"
WHERE u.email = 'test@example.com';
```

Check payments:
```sql
SELECT
  p.paymentType,
  p.amount,
  p.status,
  p.paidAt,
  p.stripePaymentIntentId
FROM "Payment" p
JOIN "ServiceSubscription" ss ON p."subscriptionId" = ss.id
JOIN "User" u ON ss."userId" = u.id
WHERE u.email = 'test@example.com'
ORDER BY p.createdAt DESC;
```

## Troubleshooting

### Issue: Webhook secret not working
**Solution**: Make sure Stripe CLI is running and the webhook secret in `.env` matches the output from `stripe listen`

### Issue: Can't access form after payment
**Solution**:
1. Check database: Is `setupFeePaid` set to `true`?
2. Check webhook logs: Did the `checkout.session.completed` event fire?
3. Check console: Any errors in subscription status API call?

### Issue: Form loads without payment
**Solution**: Check the subscription status API - make sure it's correctly validating `setupFeePaid` and `status === ACTIVE`

### Issue: Middleware redirect loop
**Solution**: Ensure `/service-tiers` and `/login` are NOT in the middleware matcher array

## Next Steps (Phase 5)

After testing Phase 4 successfully:
1. Build customer subscription portal (`/portal/subscription`)
2. Add upgrade path (DIY → Legal)
3. Implement refund request UI
4. Add cancellation flow
5. Show billing history

## Files Modified in Phase 4

- ✅ `src/app/api/subscriptions/status/route.ts` (NEW)
- ✅ `src/app/reca/start/page.tsx` (UPDATED)
- ✅ `src/middleware.ts` (UPDATED)
- ✅ `src/app/reca/form/[sessionId]/page.tsx` (UPDATED)

All changes are backward compatible with existing users!

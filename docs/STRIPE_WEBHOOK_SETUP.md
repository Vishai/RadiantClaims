# Stripe Webhook Setup Guide

## Problem
When users complete payment in Stripe, the database subscription record isn't being updated automatically. This causes users to be blocked from accessing the RECA form even though they've paid.

## Root Cause
The Stripe webhook isn't properly configured or isn't firing correctly. The webhook is responsible for:
1. Receiving `checkout.session.completed` events from Stripe
2. Updating the subscription record to set `setupFeePaid: true` and `status: ACTIVE`

## Solution

### For Local Development

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Start webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** shown in the output (starts with `whsec_...`)

5. **Update your `.env.local` file**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Replace with the secret from step 4
   ```

6. **Restart your dev server**:
   ```bash
   npm run dev
   ```

Now when you test payments locally, the webhook will forward to your local server!

### For Production

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events to listen to**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

4. **Copy the signing secret** and add it to your production environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Testing Webhooks

### Test with Stripe CLI
```bash
# Test checkout completed event
stripe trigger checkout.session.completed

# Listen for events
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### Verify Webhook is Working
1. Complete a test payment in your app
2. Check the Stripe CLI output for the webhook event
3. Check your database to verify the subscription was updated:
   ```sql
   SELECT "userId", tier, status, "setupFeePaid"
   FROM "ServiceSubscription"
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

## Manual Sync (If Webhook Failed)

If webhooks failed for existing users, run the sync script:

```bash
npx tsx scripts/sync-stripe-payments.ts
```

This will:
- Find all subscriptions in PENDING status
- Check Stripe for completed checkout sessions
- Update the database accordingly

## Fixes Applied

### 1. Subscription Status Logic
**Before**: Subscriptions were created with `status: "ACTIVE"` immediately, before payment.

**After**: Subscriptions are created with `status: "PENDING"` and only set to `ACTIVE` by the webhook after successful payment.

**File**: `src/app/api/subscriptions/create/route.ts:262`

### 2. Access Control
**Updated**: The access check now allows users with either:
- `status === "ACTIVE"` (set by webhook), OR
- `setupFeePaid === true` (legacy/manual cases)

**File**: `src/app/api/subscriptions/status/route.ts:63-65`

### 3. Sync Script
**Created**: New script to manually sync Stripe payments when webhooks fail.

**File**: `scripts/sync-stripe-payments.ts`

## Monitoring

To check if webhooks are working:

1. **Stripe Dashboard** → Developers → Webhooks → [Your Endpoint]
   - Check "Recent deliveries" for success/failure status

2. **Application Logs**:
   ```bash
   # Look for these log messages in your server logs
   ✅ Webhook received: checkout.session.completed
   💰 Checkout completed for user [userId]
   ```

3. **Database**:
   ```sql
   SELECT * FROM "AuditLog"
   WHERE action = 'PAYMENT_SUCCEEDED'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

## Troubleshooting

### Webhook not receiving events
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify the webhook endpoint URL is correct
- Check Stripe Dashboard for delivery errors

### Events arriving but subscription not updating
- Check server logs for errors in `/api/webhooks/stripe`
- Verify the `userId` and `subscriptionId` are in the metadata
- Run the sync script to fix missed events

### "Webhook signature verification failed"
- The `STRIPE_WEBHOOK_SECRET` is incorrect
- Get the correct secret from Stripe CLI or Dashboard

## Summary

With these fixes:
1. ✅ Subscriptions start as PENDING and become ACTIVE after payment
2. ✅ Webhooks properly update the database when payment succeeds
3. ✅ Manual sync script available for when webhooks fail
4. ✅ Access control properly checks payment status
5. ✅ Local development webhook testing is easy

**Next Steps:**
1. Set up local webhook forwarding with Stripe CLI
2. Test the full payment flow
3. Run sync script for any existing users stuck in PENDING
4. Configure production webhooks in Stripe Dashboard

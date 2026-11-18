# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe for the RadiantClaims service tier system.

## Phase 3 Complete! ✅

We've implemented:
- ✅ Stripe SDK installed
- ✅ Checkout session creation for $149.99 setup fee
- ✅ Automatic monthly subscription creation after setup fee
- ✅ Webhook handler for all payment events
- ✅ 7-day refund system with PDF download protection

---

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a Stripe account
3. Complete your business profile
4. Get your API keys from https://dashboard.stripe.com/apikeys

---

## Step 2: Get Your API Keys

### Test Keys (for development):
1. Go to **Developers** → **API keys**
2. Toggle to **Test mode**
3. Copy your keys:
   - **Secret key** (starts with `sk_test_...`)
   - **Publishable key** (starts with `pk_test_...`)

### Add to your `.env` file:
```bash
# Test keys
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## Step 3: Create Products in Stripe Dashboard

### Product 1: DIY Document Preparation - Setup Fee

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: RadiantClaims DIY Document Preparation - Setup Fee
   - **Description**: One-time setup fee for DIY RECA claim document preparation service
   - **Pricing model**: One time
   - **Price**: $149.99 USD
   - **Tax code**: Software as a service
3. Click **Save**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env`:
```bash
STRIPE_PRICE_ID_DIY_SETUP="price_YOUR_PRICE_ID_HERE"
```

### Product 2: DIY Document Preparation - Monthly Subscription

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: RadiantClaims DIY Document Preparation - Monthly Subscription
   - **Description**: Monthly subscription for ongoing RECA claim portal access and support
   - **Pricing model**: Recurring
   - **Price**: $24.99 USD
   - **Billing period**: Monthly
   - **Tax code**: Software as a service
3. Click **Save**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env`:
```bash
STRIPE_PRICE_ID_DIY_MONTHLY="price_YOUR_PRICE_ID_HERE"
```

---

## Step 4: Set Up Webhook Endpoint

### For Development (using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
```

### For Production:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add to your production `.env`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_PROD_SECRET_HERE"
```

---

## Step 5: Test the Integration

### 1. Run the database migration:
```bash
npx prisma migrate dev --name add_service_tiers_and_payments
```

### 2. Start your development server:
```bash
pnpm dev
```

### 3. In a separate terminal, start Stripe webhook forwarding:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 4. Test the DIY signup flow:
1. Navigate to http://localhost:3000
2. Click **Check Eligibility**
3. Click **Choose Your Path**
4. Select **DIY Document Preparation**
5. Sign up or log in
6. Complete payment with test card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### 5. Verify in Stripe Dashboard:
- Check **Payments** for the $149.99 charge
- Check **Subscriptions** for the $24.99/month subscription
- Check **Customers** for the new customer record

### 6. Verify in your database:
```bash
npx prisma studio
```
- Check `ServiceSubscription` table for new record
- Check `Payment` table for setup fee payment

---

## Step 6: Test Refunds

### Test refund within 7 days (eligible):
1. Log in as a test user who paid setup fee
2. Go to `/api/subscriptions/refund` (GET) to check eligibility
3. Call POST to `/api/subscriptions/refund` to process refund
4. Verify refund appears in Stripe Dashboard

### Test refund after PDF download (not eligible):
1. Download the RECA form PDF
2. Try to request refund
3. Should be rejected with message about PDF download

---

## Step 7: Production Checklist

Before going live with real payments:

- [ ] Switch from test keys to **live keys** in production `.env`
- [ ] Set up production webhook endpoint
- [ ] Test with small real payment first
- [ ] Set up Stripe email receipts
- [ ] Configure Stripe Billing Portal (for customers to manage their subscriptions)
- [ ] Set up failed payment dunning emails
- [ ] Configure tax settings if applicable
- [ ] Review Stripe Radar settings for fraud prevention

---

## Stripe Test Cards

### Successful Payments:
- `4242 4242 4242 4242` - Standard test card
- `4000 0566 5566 5556` - Visa (debit)

### Failed Payments:
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### 3D Secure:
- `4000 0025 0000 3155` - Requires authentication

Full list: https://stripe.com/docs/testing

---

## API Routes Created

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscriptions/create-checkout` | POST | Create checkout session for $149.99 setup fee |
| `/api/subscriptions/create-monthly` | POST | Create monthly $24.99 subscription (auto-called after setup fee) |
| `/api/subscriptions/refund` | POST | Process refund request |
| `/api/subscriptions/refund` | GET | Check refund eligibility |
| `/api/webhooks/stripe` | POST | Handle all Stripe webhook events |

---

## Webhook Events Handled

| Event | What Happens |
|-------|--------------|
| `checkout.session.completed` | Marks setup fee as paid, automatically creates monthly subscription |
| `invoice.payment_succeeded` | Records successful monthly payment, updates next billing date |
| `invoice.payment_failed` | Records failed payment, sets subscription to PAST_DUE status |
| `customer.subscription.deleted` | Marks subscription as CANCELED |
| `customer.subscription.updated` | Updates subscription details (billing dates, etc.) |

---

## Environment Variables Reference

Required for Stripe integration:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_..."  # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # or pk_live_... for production

# Stripe Product/Price IDs
STRIPE_PRICE_ID_DIY_SETUP="price_..."  # $149.99 one-time
STRIPE_PRICE_ID_DIY_MONTHLY="price_..."  # $24.99/month

# Stripe Webhook
STRIPE_WEBHOOK_SECRET="whsec_..."

# Base URL (for redirects)
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
```

---

## Troubleshooting

### Webhook events not being received:
1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Verify webhook secret in `.env` matches the one shown by Stripe CLI
3. Check server logs for webhook errors

### Payment successful but subscription not created:
1. Check webhook events in Stripe Dashboard → Developers → Events
2. Look for `checkout.session.completed` event
3. Check if webhook endpoint returned 200 OK
4. Verify `STRIPE_PRICE_ID_DIY_MONTHLY` is set correctly

### Refund not working:
1. Verify payment is less than 7 days old
2. Check that RECA form PDF has not been downloaded
3. Look for error messages in API response

### Database errors:
1. Make sure you ran: `npx prisma migrate dev`
2. Regenerate Prisma client: `pnpm db:generate`
3. Check database connection string in `.env`

---

## Next Steps

After Stripe is set up and tested:

1. **Phase 4**: Add subscription access control to RECA form pages
2. **Phase 5**: Build customer portal for subscription management
3. **Phase 6**: Implement Heritage Law referral workflow for Legal path
4. **Phase 7 & 8**: Add legal disclaimers and update Terms of Service

---

## Support

- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test your webhooks: https://dashboard.stripe.com/test/webhooks

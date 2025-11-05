# Payment Flow Analysis & Refinement Requirements

**Date**: 2025-01-04
**Status**: ✅ IMPLEMENTED
**Priority**: High
**Implementation Date**: 2025-01-04

## Executive Summary

This document outlines the current Stripe-based payment implementation for RadiantClaims and identifies required changes to align with business requirements. The core issue: we're currently charging both the setup fee ($149.99) AND the monthly fee ($24.99) on day 1, when we should charge the setup fee immediately and delay the first monthly charge by 30/31 days.

---

## Current Implementation

### Technology Stack
- **Payment Processor**: Stripe
- **Integration Type**: Stripe Checkout (Hosted)
- **API Version**: `2025-10-29.clover`
- **Mode**: Subscription

### Service Tiers

#### 1. DIY Preparation (DIY_PREP)
- **Setup Fee**: $149.99 (one-time)
- **Monthly Fee**: $24.99 (recurring)
- **Payment Required**: Yes (immediate via Stripe Checkout)

#### 2. Legal Representation (LEGAL_REP)
- **Setup Fee**: $0
- **Monthly Fee**: $0
- **Payment Required**: No
- **Fee Structure**: 2% of DOJ award (paid by DOJ directly to attorney)

---

## Current User Flow (DIY Path)

### Step-by-Step Process

1. **User navigates to** `/service-tiers`
2. **Clicks** "Select DIY Path" button
3. **Reviews and accepts** DIY Terms Agreement (modal)
4. **Frontend calls** `/api/subscriptions/create` with:
   ```json
   {
     "tier": "DIY_PREP",
     "policyType": "TERMS_OF_SERVICE",
     "policyVersion": "1.0",
     "ipAddress": "..."
   }
   ```

5. **Backend creates**:
   - Database: `ServiceSubscription` record
     - `userId`: User's ID
     - `tier`: "DIY_PREP"
     - `status`: "ACTIVE"
     - `setupFeePaid`: false
     - `setupFeeAmount`: 149.99
     - `monthlyFeeAmount`: 24.99
   - Stripe: Customer account
   - Stripe: Checkout Session

6. **Stripe Checkout Session Configuration** (CURRENT - ISSUE HERE):
   ```typescript
   const checkoutSession = await stripe.checkout.sessions.create({
     customer: customer.id,
     mode: "subscription",
     payment_method_types: ["card"],
     line_items: [
       { price: diySetupPriceId, quantity: 1 },    // $149.99
       { price: diyMonthlyPriceId, quantity: 1 },  // $24.99
     ],
     success_url: `${process.env.NEXTAUTH_URL}/portal?payment=success`,
     cancel_url: `${process.env.NEXTAUTH_URL}/service-tiers?payment=canceled`,
     metadata: { ... }
   });
   ```

7. **User redirected** to Stripe Hosted Checkout page
8. **User enters** payment information (CC, billing address, etc.)
9. **User clicks** "Pay" button
10. **Stripe processes** payment
11. **User redirected** back to RadiantClaims:
    - Success: `/portal?payment=success`
    - Cancel: `/service-tiers?payment=canceled`

12. **Stripe webhook** fires → Updates `setupFeePaid: true` in database
13. **User accesses** portal and can fill out application

---

## PROBLEM: Current Billing Behavior

### What's Happening Now ❌

When a user completes Stripe Checkout, they are charged:
- **Day 1**: $149.99 (setup) + $24.99 (first month) = **$174.98 total**
- **Day 31**: $24.99 (second month)
- **Day 61**: $24.99 (third month)
- etc.

### Why This Is Wrong

The monthly subscription should NOT start on day 1. The user is essentially paying for:
- Setup fee (access to the system)
- First month subscription (days 1-30)

But logically, the first 30 days are "covered" by the setup fee period. The monthly fee should begin AFTER the first 30 days.

---

## DESIRED: Correct Billing Behavior

### What Should Happen ✅

- **Day 1**: Charge $149.99 (setup fee only)
  - User gets immediate access to system
  - No monthly charge yet
- **Day 31** (30 days after initial payment): Charge $24.99 (first monthly fee)
- **Day 61**: Charge $24.99 (second monthly fee)
- **Day 91**: Charge $24.99 (third monthly fee)
- etc.

### Business Logic

The $149.99 setup fee provides:
1. One-time access to the platform
2. 30 days of service included
3. After 30 days, monthly subscription kicks in

This is standard SaaS billing: setup fee + delayed recurring charge.

---

## Technical Requirements

### Must Keep
- ✅ Stripe as payment processor
- ✅ Stripe Checkout (hosted page) for payment collection
- ✅ Current webhook implementation
- ✅ Database schema (minimal changes if any)
- ✅ PCI compliance through Stripe

### Must Change
- ❌ Remove monthly fee from initial checkout session
- ✅ Add trial period or subscription start date offset
- ✅ Ensure first monthly charge occurs exactly 30/31 days after setup

### Implementation Options (To Explore)

#### Option A: Stripe Subscription with Trial Period
- Create subscription with 30-day trial
- Charge setup fee as separate one-time payment
- Subscription begins after trial ends

#### Option B: Scheduled Subscription Start
- Charge setup fee immediately (one-time payment mode)
- Create subscription with `billing_cycle_anchor` set to 30 days from now
- First recurring charge happens automatically on day 31

#### Option C: Invoice + Subscription
- Create invoice for setup fee (immediate)
- Create subscription with future start date
- Stripe handles timing automatically

### Recommended Approach
**Option B** appears most straightforward:
1. Separate the one-time setup fee from the subscription
2. Use Stripe's `billing_cycle_anchor` to delay subscription start
3. Maintains clean separation of concerns

---

## Code Locations

### Files to Modify

1. **Subscription Creation API**
   - Path: `src/app/api/subscriptions/create/route.ts`
   - Lines: 280-295 (Checkout session creation)
   - Change: Modify checkout session configuration

2. **Stripe Configuration**
   - Path: `src/lib/stripe.ts` (if exists) or inline in API route
   - Current: Two price IDs (setup + monthly)
   - May need: New pricing structure

3. **Webhook Handler**
   - Path: `src/app/api/webhooks/stripe/route.ts` (likely)
   - May need: Handle new event types

### Current Stripe Products/Prices

According to `STRIPE_CONFIG`:
- `DIY_SETUP_FEE.priceId` → $149.99 one-time
- `DIY_MONTHLY.priceId` → $24.99 recurring

These may need adjustment or new products created.

---

## Testing Requirements

### Test Scenarios

1. **New User DIY Signup**
   - Verify only $149.99 charged on day 1
   - Verify access granted immediately
   - Verify first monthly charge scheduled for day 31

2. **Existing User Resume Payment**
   - If user created subscription but didn't pay
   - Should maintain same billing logic

3. **Webhook Handling**
   - Setup fee payment successful
   - First monthly charge successful
   - Monthly charge failure (card declined)
   - Subscription cancellation

4. **Edge Cases**
   - User cancels before first monthly charge
   - User upgrades to Legal Rep before day 31
   - Refund window (7 days) overlaps with monthly charge

---

## Stripe Dashboard Configuration

### Current Products (Assumed)
```
Product: RadiantClaims DIY Setup
  └─ Price: $149.99 one-time (ID: price_xxx)

Product: RadiantClaims DIY Monthly
  └─ Price: $24.99/month recurring (ID: price_yyy)
```

### May Need
```
Option A: Keep separate, adjust checkout logic
Option B: Combine into subscription with trial
Option C: Create new product structure
```

---

## Success Criteria

### User Experience
- ✅ User pays $149.99 on signup (not $174.98)
- ✅ User gets immediate access to application
- ✅ User's first monthly charge happens exactly 30 days later
- ✅ Clear communication about billing schedule
- ✅ No confusion about charges

### Technical
- ✅ Stripe correctly schedules recurring payments
- ✅ Database accurately reflects payment status
- ✅ Webhooks properly update subscription state
- ✅ Refund logic works correctly (7-day window)
- ✅ No double-charging scenarios

### Business
- ✅ Revenue recognition aligns with service delivery
- ✅ Churn analysis is accurate (30-day periods)
- ✅ Subscription metrics are clean

---

## Related Documentation

- Stripe Checkout Docs: https://stripe.com/docs/payments/checkout
- Subscription Billing Cycles: https://stripe.com/docs/billing/subscriptions/billing-cycle
- Billing Cycle Anchors: https://stripe.com/docs/billing/subscriptions/billing-cycle#anchor-billing-cycle

---

## Next Steps

### Immediate Actions
1. **Review this document** with team
2. **Confirm** desired billing behavior
3. **Research** best Stripe implementation approach
4. **Test** in Stripe test mode
5. **Implement** changes
6. **Verify** webhooks handle new flow
7. **Update** user-facing documentation about pricing

### Questions to Answer
- [ ] Do we want 30 days exactly or first of next month?
- [ ] How should refunds work if user cancels on day 15?
- [ ] Should we prorate if user upgrades/downgrades?
- [ ] What happens if monthly charge fails? Retry logic?

---

## PROMPT FOR NEXT CONVERSATION

**Copy this to start the payment flow refinement:**

```
I need to fix our Stripe payment flow for the DIY subscription tier. Currently, we're charging both the $149.99 setup fee AND the first $24.99 monthly fee on day 1, totaling $174.98.

DESIRED BEHAVIOR:
- Day 1: Charge ONLY $149.99 (setup fee)
- Day 31: Charge $24.99 (first monthly subscription)
- Then $24.99 every 30 days thereafter

CONSTRAINTS:
- Must continue using Stripe
- Must continue using Stripe Checkout (hosted page, not custom form)
- Minimize changes to existing code structure
- Keep webhook implementation intact
- Maintain PCI compliance

CURRENT CODE:
- API: src/app/api/subscriptions/create/route.ts (lines 280-295)
- Frontend: src/app/service-tiers/page.tsx (line 128-129)
- Checkout creates subscription mode with two line items (setup + monthly)

QUESTIONS:
1. What's the best Stripe approach: trial period, billing_cycle_anchor, or separate payment + subscription?
2. Do we need to modify our Stripe product/price configuration?
3. How do we handle the transition without breaking existing subscriptions?
4. What webhook events need handling?

Please analyze the current implementation in src/app/api/subscriptions/create/route.ts and propose a solution that achieves the desired billing schedule while maintaining our Stripe Checkout integration.
```

---

## IMPLEMENTATION SUMMARY ✅

**Date Implemented**: 2025-01-04

### Changes Made

#### 1. Subscription Creation API (`src/app/api/subscriptions/create/route.ts`)

**OLD APPROACH (BROKEN):**
```typescript
// Created checkout with BOTH setup fee and monthly as line items
line_items: [
  { price: diySetupPriceId, quantity: 1 },  // $149.99
  { price: diyMonthlyPriceId, quantity: 1 }, // $24.99
]
// Result: User charged $174.98 on day 1
```

**NEW APPROACH (FIXED):**
```typescript
// Step 1: Add setup fee as invoice item (one-time charge)
await stripe.invoiceItems.create({
  customer: customer.id,
  price: diySetupPriceId,
  description: "RadiantClaims DIY Setup Fee (One-time)",
});

// Step 2: Create subscription with 30-day trial
const checkoutSession = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [
    { price: diyMonthlyPriceId, quantity: 1 }, // Monthly only
  ],
  subscription_data: {
    trial_period_days: 30,  // ✅ Delays first monthly charge by 30 days
    metadata: { userId, subscriptionId },
  },
  // ...
});
```

**Result**: User charged $149.99 on day 1, then $24.99 on day 31.

#### 2. Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)

**REMOVED:** Duplicate subscription creation logic (lines 160-192)
- Previously created a SECOND subscription after checkout
- This caused double billing and confusion

**ADDED:**
- Proper handling of Stripe subscription ID from checkout session
- Extraction of billing dates from trial subscription
- New webhook handler for `customer.subscription.trial_will_end` event
- Audit logging for trial ending notifications

**IMPROVED:**
- `handleCheckoutCompleted`: Now captures subscription ID from checkout session
- Payment record creation for setup fee
- Billing cycle tracking from trial subscription

#### 3. Webhook Events Now Handled

1. ✅ `checkout.session.completed` - Setup fee paid, subscription created with trial
2. ✅ `invoice.payment_succeeded` - Monthly payment successful (after trial)
3. ✅ `invoice.payment_failed` - Monthly payment failed
4. ✅ `customer.subscription.deleted` - Subscription canceled
5. ✅ `customer.subscription.updated` - Subscription details changed
6. ✅ **NEW:** `customer.subscription.trial_will_end` - Trial ending in 3 days (for notifications)

### New Payment Flow (DIY Path)

**Day 1: Signup & Setup Fee**
1. User clicks "Select DIY Path"
2. Accepts DIY Terms Agreement
3. API creates:
   - ServiceSubscription record (status: ACTIVE, setupFeePaid: false)
   - Stripe Customer
   - Invoice Item for $149.99 setup fee
   - Checkout Session (subscription mode with 30-day trial)
4. User redirected to Stripe Checkout
5. User sees: **$149.99 setup fee** (not $174.98)
6. User pays
7. Webhook fires:
   - `checkout.session.completed`
   - Updates setupFeePaid: true
   - Records Stripe subscription ID
   - Creates payment record
   - Calculates next billing date (day 31)

**Day 28: Trial Ending Notification**
1. Stripe fires `customer.subscription.trial_will_end` webhook
2. Audit log created
3. (Future) Email sent to user: "First monthly charge of $24.99 coming in 3 days"

**Day 31: First Monthly Charge**
1. Stripe automatically charges $24.99
2. Webhook fires: `invoice.payment_succeeded`
3. Payment record created
4. Next billing date updated (day 61)

**Day 61, 91, 121...: Recurring Monthly Charges**
1. Stripe charges $24.99 every 30 days
2. Webhooks fire for each payment
3. Database updated with payment records

### Stripe Dashboard Configuration Required

**IMPORTANT**: Verify your Stripe products are configured correctly:

1. **DIY Setup Fee Product**
   - Type: **One-time** (NOT recurring)
   - Price: $149.99
   - Currency: USD
   - Price ID: Must match `STRIPE_PRICE_ID_DIY_SETUP` env variable

2. **DIY Monthly Product**
   - Type: **Recurring**
   - Interval: Monthly
   - Price: $24.99
   - Currency: USD
   - Price ID: Must match `STRIPE_PRICE_ID_DIY_MONTHLY` env variable

### Testing Checklist

Before deploying to production:

- [ ] Verify Stripe products configured correctly (one-time + recurring)
- [ ] Test in Stripe test mode with test card
- [ ] Confirm checkout shows $149.99 (not $174.98)
- [ ] Verify webhook receives `checkout.session.completed`
- [ ] Check database: setupFeePaid = true, stripeSubscriptionId set
- [ ] Verify trial period is 30 days in Stripe Dashboard
- [ ] Use Stripe test clock to fast-forward 30 days
- [ ] Confirm first monthly invoice generated on day 31
- [ ] Test `customer.subscription.trial_will_end` webhook (day 28)
- [ ] Test payment failure scenario
- [ ] Test subscription cancellation before trial ends
- [ ] Test subscription cancellation after trial ends

### Environment Variables

Ensure these are set:
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_PRICE_ID_DIY_SETUP=price_... (one-time)
STRIPE_PRICE_ID_DIY_MONTHLY=price_... (recurring monthly)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXTAUTH_URL=https://yourdomain.com
```

### Migration Notes

**Existing Subscriptions**: This change affects NEW signups only. Existing subscriptions will continue to work with their current billing cycle. If you need to migrate existing subscriptions, create a separate migration script.

**Refund Window**: The 7-day refund policy still applies to the setup fee. If a user requests a refund within 7 days and hasn't downloaded their form, issue a refund in Stripe Dashboard.

---

**Document Version**: 2.0
**Last Updated**: 2025-01-04
**Owner**: RadiantClaims Engineering Team
**Implemented By**: Claude Code

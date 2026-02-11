# Pricing Implementation Test Plan

## Test Environment
- **URL**: http://localhost:3000
- **Stripe Mode**: Test Mode (using test keys)
- **Test Card**: 4242 4242 4242 4242 (any future expiry, any CVV)

## Test Cases

### Test Case 1: Full Payment Option ($499.99)

#### Steps:
1. Navigate to http://localhost:3000/service-tiers
2. Select "DIY Document Preparation"
3. Choose "Pay in Full" option ($499.99)
4. Complete checkout with test card
5. Verify redirect to portal with success message

#### Expected Results:
- ✅ Checkout shows $499.99 one-time charge
- ✅ Payment processes successfully
- ✅ User redirected to /portal?payment=success
- ✅ Database records:
  ```sql
  SELECT
    setupFeePaid,        -- should be TRUE
    setupFeeAmount,      -- should be 499.0
    isInstallmentPlan,   -- should be FALSE
    installmentPaymentCount,  -- should be 0
    status              -- should be ACTIVE
  FROM "ServiceSubscription"
  WHERE "userId" = '<test-user-id>';
  ```
- ✅ Payment record created with amount 499.99

---

### Test Case 2: 2-Payment Installment Plan

#### Part A: First Payment ($249.99)

**Steps:**
1. Create new user account or use different email
2. Navigate to http://localhost:3000/service-tiers
3. Select "DIY Document Preparation"
4. Choose "2 Payment Plan" option ($249.99 × 2)
5. Complete checkout with test card
6. Verify redirect to portal

**Expected Results:**
- ✅ Checkout shows $249.99 recurring monthly charge
- ✅ First payment processes successfully
- ✅ User gets immediate access to portal
- ✅ Database records:
  ```sql
  SELECT
    setupFeePaid,        -- should be FALSE (not fully paid yet)
    setupFeeAmount,      -- should be 499.0
    isInstallmentPlan,   -- should be TRUE
    installmentPaymentCount,  -- should be 1
    installmentCompleted,     -- should be FALSE
    stripeSubscriptionId,     -- should be populated
    status              -- should be ACTIVE
  FROM "ServiceSubscription"
  WHERE "userId" = '<test-user-id>';
  ```
- ✅ Payment record created with amount 249.99
- ✅ Stripe subscription created

#### Part B: Second Payment (After 1 Month - Simulated)

**Steps:**
1. Use Stripe CLI to trigger the second invoice payment:
   ```bash
   # Get the subscription ID from the database
   stripe subscriptions list --limit 1

   # Advance subscription to trigger 2nd invoice
   stripe subscriptions update <sub_id> --billing-cycle-anchor now

   # Or trigger webhook directly
   stripe trigger invoice.payment_succeeded
   ```

2. Check webhook processing in logs
3. Verify database updates
4. Verify Stripe subscription is canceled

**Expected Results:**
- ✅ Second invoice payment succeeds ($249.99)
- ✅ Webhook handler processes payment
- ✅ Database updated:
  ```sql
  SELECT
    setupFeePaid,        -- should be TRUE (fully paid now)
    setupFeeAmount,      -- should be 499.0
    isInstallmentPlan,   -- should be TRUE
    installmentPaymentCount,  -- should be 2
    installmentCompleted,     -- should be TRUE
    stripeSubscriptionId,     -- should be populated
    nextBillingDate,          -- should be NULL
    status              -- should be ACTIVE
  FROM "ServiceSubscription"
  WHERE "userId" = '<test-user-id>';
  ```
- ✅ Two payment records total (249.99 each)
- ✅ Total payments = $499.98
- ✅ **Stripe subscription automatically canceled**
- ✅ Console log shows: "✅ Stripe subscription canceled after 2 payments"

---

### Test Case 3: Prevent 3rd Payment (Critical Safety Test)

#### Steps:
1. Using the subscription from Test Case 2
2. Attempt to manually create a 3rd invoice (should fail):
   ```bash
   stripe invoices create --customer <cus_id> --subscription <sub_id>
   ```
3. Verify subscription status in Stripe Dashboard

#### Expected Results:
- ✅ Subscription status = "canceled" in Stripe
- ✅ Cannot create additional invoices
- ✅ User not charged a 3rd time
- ✅ Database shows `installmentPaymentCount = 2` (not 3)

---

## Database Verification Queries

### Check Subscription Status
```sql
SELECT
  id,
  "userId",
  tier,
  status,
  "setupFeePaid",
  "setupFeeAmount",
  "isInstallmentPlan",
  "installmentPaymentCount",
  "installmentCompleted",
  "stripeSubscriptionId",
  "setupFeePaidAt",
  "createdAt"
FROM "ServiceSubscription"
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Check Payment Records
```sql
SELECT
  id,
  "subscriptionId",
  "paymentType",
  amount,
  currency,
  status,
  "paidAt",
  metadata
FROM "Payment"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check for Overcharges (Should be 0)
```sql
SELECT
  id,
  "userId",
  "installmentPaymentCount",
  "installmentCompleted"
FROM "ServiceSubscription"
WHERE "isInstallmentPlan" = true
  AND "installmentPaymentCount" > 2;
-- Should return 0 rows
```

---

## Stripe Dashboard Verification

### Check Subscription
1. Go to Stripe Dashboard → Customers
2. Find test customer
3. View subscription
4. Verify:
   - ✅ Status = "canceled" (for installment after 2 payments)
   - ✅ Only 2 invoices created (for installment plan)
   - ✅ Total charged = $499.98 (for installment plan)
   - ✅ No upcoming invoices scheduled

---

## Webhook Testing

### Test Locally with Stripe CLI

1. **Start webhook listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Trigger test events**:
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed

   # Test invoice payment
   stripe trigger invoice.payment_succeeded

   # Test subscription cancellation
   stripe trigger customer.subscription.deleted
   ```

3. **Check logs** for webhook processing:
   - Look for "✅ Webhook received" messages
   - Look for "💰 Checkout completed" messages
   - Look for installment payment processing
   - Look for subscription cancellation confirmation

---

## Error Cases to Test

### 1. Invalid Payment Plan
```bash
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "DIY_PREP",
    "paymentPlan": "invalid"
  }'
# Should return 400 error: "Invalid payment plan"
```

### 2. Missing Stripe Price IDs
- Temporarily unset `STRIPE_PRICE_ID_DIY_PACKET` in .env
- Try to create subscription
- Should return 503 error: "DIY checkout is temporarily unavailable"

---

## Success Criteria

All tests must pass:
- [ ] Full payment ($499.99) works correctly
- [ ] Installment plan first payment ($249.99) works
- [ ] Installment plan second payment ($249.99) works
- [ ] Subscription auto-cancels after 2nd payment
- [ ] No 3rd payment can be charged
- [ ] User gets access after first payment (both options)
- [ ] Database records are accurate
- [ ] Payment records match expected amounts
- [ ] Audit logs are created
- [ ] Webhooks process correctly
- [ ] No TypeScript errors
- [ ] No runtime errors

---

## Manual Testing Checklist

### Pre-Testing
- [ ] Verify `.env` has real Stripe price IDs
- [ ] Dev server running without errors
- [ ] Database connection working
- [ ] Stripe CLI installed and authenticated

### During Testing
- [ ] Test both payment options
- [ ] Monitor server logs for errors
- [ ] Check Stripe Dashboard after each test
- [ ] Verify database after each payment
- [ ] Take screenshots of success states

### Post-Testing
- [ ] Document any issues found
- [ ] Verify no test charges in production Stripe
- [ ] Clean up test data from database
- [ ] Update documentation with any findings

---

## Quick Test Commands

```bash
# Check database for test subscriptions
psql $DATABASE_URL -c "SELECT * FROM \"ServiceSubscription\" ORDER BY \"createdAt\" DESC LIMIT 5;"

# Check payment records
psql $DATABASE_URL -c "SELECT * FROM \"Payment\" ORDER BY \"createdAt\" DESC LIMIT 10;"

# Check for overcharges (should be empty)
psql $DATABASE_URL -c "SELECT * FROM \"ServiceSubscription\" WHERE \"isInstallmentPlan\" = true AND \"installmentPaymentCount\" > 2;"

# View server logs
tail -f .next/server-logs.txt

# Listen to Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Rollback Procedure (If Tests Fail)

1. **Immediate**: Stop accepting new subscriptions
2. **Cancel test subscriptions** in Stripe Dashboard
3. **Roll back database migration**:
   ```bash
   # This will undo the last migration
   pnpm prisma migrate resolve --rolled-back 20251209200542_add_installment_payment_tracking
   ```
4. **Revert code changes**: Use git to restore previous version
5. **Investigate issues** before re-deploying

---

## Notes

- All tests should be done in Stripe Test Mode
- Use fresh email addresses for each test user
- Clear browser cookies between tests
- Monitor webhook logs in real-time
- Document any unexpected behavior

# RadiantClaims Test Scripts

This directory contains utility scripts for testing and managing the RadiantClaims application.

## Payment Flow Testing

### test-payment-flow.ts

Comprehensive test script for the DIY subscription payment flow.

#### What It Tests

1. **User Creation** - Creates a test user in the database
2. **Stripe Products** - Verifies DIY setup and monthly prices are configured correctly
3. **Subscription Creation** - Creates a ServiceSubscription record
4. **Stripe Customer** - Creates a Stripe customer
5. **Checkout Session** - Creates a Stripe Checkout session with trial period
6. **Payment Simulation** - Simulates payment method attachment
7. **Verification** - Checks database records and Stripe subscription status
8. **Audit Logs** - Verifies audit trail is created

#### Prerequisites

Before running the test, ensure:

1. **Environment Variables Set**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID_DIY_SETUP=price_...    # ONE-TIME price
   STRIPE_PRICE_ID_DIY_MONTHLY=price_...  # RECURRING monthly price
   DATABASE_URL=postgresql://...
   ```

2. **Database Running**:
   ```bash
   # Start your PostgreSQL database
   # Apply migrations if needed
   npx prisma migrate dev
   ```

3. **Stripe Products Configured**:
   - DIY Setup Fee: **ONE-TIME** price at $149.99
   - DIY Monthly: **RECURRING** monthly price at $24.99

#### Running the Test

```bash
# From project root
npx tsx scripts/test-payment-flow.ts
```

#### Expected Output

The script will display:

- ✓ User creation confirmation
- ✓ Stripe product verification (with warnings if misconfigured)
- ✓ Subscription and customer creation
- ✓ Checkout session details
- ✓ Payment simulation results
- ✓ Subscription verification (including trial end date)
- ✓ Audit log entries
- ℹ️ Next steps and testing recommendations

#### Sample Output

```
🚀 RadiantClaims Payment Flow Test Script

============================================================
Step 1: Creating Test User
============================================================

✓ Created test user: test-payment@example.com
  User ID: clxxx123...

============================================================
Step 2: Checking Stripe Products
============================================================

Checking setup fee price: price_1abc...
✓ Setup Fee Price found
  Type: one_time
  Amount: $149.99

Checking monthly fee price: price_2def...
✓ Monthly Fee Price found
  Type: recurring
  Amount: $24.99
  Interval: month

[... more output ...]

============================================================
Test Complete!
============================================================

✓ All steps completed successfully!
```

#### Cleanup

The script automatically cleans up any existing test data before running. To manually cleanup:

```bash
# Run the script again - it will cleanup before creating new test data
npx tsx scripts/test-payment-flow.ts
```

Or manually delete the test user from your database:

```sql
DELETE FROM "User" WHERE email = 'test-payment@example.com';
```

#### Common Issues

**Issue: "Stripe price IDs not configured"**
- **Solution**: Set `STRIPE_PRICE_ID_DIY_SETUP` and `STRIPE_PRICE_ID_DIY_MONTHLY` environment variables

**Issue: "Setup price should be 'one_time'"**
- **Solution**: In Stripe Dashboard, create a new ONE-TIME price (not recurring) for the setup fee

**Issue: "Monthly price should be 'recurring'"**
- **Solution**: Ensure the monthly price is set to recurring with interval = month

**Issue: Database connection error**
- **Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct

#### Manual Testing After Script

After the script runs successfully, you can:

1. **Test the UI Flow**:
   ```bash
   pnpm dev
   # Navigate to http://localhost:3000/service-tiers
   # Click "Select DIY Path"
   # Use test card: 4242 4242 4242 4242
   ```

2. **Test Webhooks**:
   ```bash
   # In a separate terminal
   stripe listen --forward-to localhost:3000/api/webhooks/stripe

   # Complete a checkout in the UI
   # Watch webhook events in the terminal
   ```

3. **Test Trial Period** (Advanced):
   - Use [Stripe Test Clocks](https://stripe.com/docs/billing/testing/test-clocks)
   - Fast-forward time to day 28, 30, 31
   - Verify webhooks fire at correct times

#### What the Test Verifies

✅ Database schema is correct
✅ Stripe products configured properly
✅ Checkout session created with trial
✅ One-time setup fee charged immediately
✅ Monthly fee delayed by 30 days
✅ Subscription status tracked correctly
✅ Audit logs created

#### Next Steps

After successful test:

1. Configure Stripe webhook endpoint in Stripe Dashboard
2. Set `STRIPE_WEBHOOK_SECRET` environment variable
3. Test with real credit card in Stripe test mode
4. Review all charges before going to production
5. Switch to production API keys when ready

## Other Scripts

(Add documentation for other scripts as they're created)

---

**Last Updated**: 2025-01-04
**Maintained By**: RadiantClaims Engineering Team

#!/bin/bash

# Test Script for Installment Payment Flow
# This script helps verify the 2-payment installment plan works correctly

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Installment Payment Flow Test Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "   Set it in your .env file or export it"
    exit 1
fi

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "⚠️  Stripe CLI not installed. Install it from:"
    echo "   https://stripe.com/docs/stripe-cli"
    echo ""
fi

echo "📋 Step 1: Check Current Installment Subscriptions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
SELECT
  id,
  \"userId\",
  \"setupFeePaid\",
  \"isInstallmentPlan\",
  \"installmentPaymentCount\",
  \"installmentCompleted\",
  \"stripeSubscriptionId\",
  status
FROM \"ServiceSubscription\"
WHERE \"isInstallmentPlan\" = true
ORDER BY \"createdAt\" DESC
LIMIT 5;
"
echo ""

echo "📋 Step 2: Check Payment Records"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
SELECT
  id,
  \"subscriptionId\",
  \"paymentType\",
  amount,
  status,
  \"paidAt\",
  metadata
FROM \"Payment\"
WHERE \"subscriptionId\" IN (
  SELECT id FROM \"ServiceSubscription\" WHERE \"isInstallmentPlan\" = true
)
ORDER BY \"createdAt\" DESC
LIMIT 10;
"
echo ""

echo "📋 Step 3: Check for Overcharges (Should be 0 rows)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
OVERCHARGE_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*)
FROM \"ServiceSubscription\"
WHERE \"isInstallmentPlan\" = true
  AND \"installmentPaymentCount\" > 2;
")

if [ "$OVERCHARGE_COUNT" -gt 0 ]; then
    echo "❌ CRITICAL: Found $OVERCHARGE_COUNT subscriptions with >2 payments!"
    psql "$DATABASE_URL" -c "
    SELECT *
    FROM \"ServiceSubscription\"
    WHERE \"isInstallmentPlan\" = true
      AND \"installmentPaymentCount\" > 2;
    "
else
    echo "✅ No overcharges detected"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Manual Testing Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "PHASE 1: Test First Payment"
echo "  1. Go to http://localhost:3000/service-tiers"
echo "  2. Choose DIY Path → 2 Payment Plan"
echo "  3. Use test card: 4242 4242 4242 4242"
echo "  4. Note the Stripe Subscription ID from logs"
echo ""
echo "PHASE 2: Simulate Second Payment (Choose ONE method)"
echo ""
echo "Method A: Fast Forward with Stripe CLI (Recommended)"
echo "  stripe subscriptions update <SUB_ID> --billing-cycle-anchor now"
echo ""
echo "Method B: Trigger Generic Webhook Event"
echo "  stripe trigger invoice.payment_succeeded"
echo ""
echo "Method C: Wait 1 month (for production-like testing)"
echo "  Note: This is not practical for immediate testing"
echo ""
echo "PHASE 3: Verify Cancellation"
echo "  1. Check Stripe Dashboard: subscription status should be 'canceled'"
echo "  2. Try to create 3rd invoice (should fail):"
echo "     stripe invoices create --customer <CUS_ID> --subscription <SUB_ID>"
echo "  3. Re-run this script to verify database state"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Expected Final State (after 2nd payment)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  setupFeePaid: TRUE"
echo "  installmentPaymentCount: 2"
echo "  installmentCompleted: TRUE"
echo "  Stripe subscription: canceled"
echo "  Total paid: \$499.98 (2 × \$249.99)"
echo "  No future invoices scheduled"
echo ""

if command -v stripe &> /dev/null; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Stripe CLI Commands"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "List recent subscriptions:"
    echo "  stripe subscriptions list --limit 5"
    echo ""
    echo "Get subscription details:"
    echo "  stripe subscriptions retrieve <SUB_ID>"
    echo ""
    echo "View customer invoices:"
    echo "  stripe invoices list --customer <CUS_ID> --limit 10"
    echo ""
    echo "Listen to webhooks (run in separate terminal):"
    echo "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Pre-flight checks complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Promo Codes & Pilot Accounts Guide

This document explains the promo code and pilot account system for RadiantClaims subscriptions.

## Overview

The system supports multiple subscription paths:

1. **Standard Path**: $149.99 setup fee + $24.99/month (starting 31 days after setup)
2. **Monthly-Only Path**: $0 setup fee + $24.99/month (starting immediately)
3. **Pilot Accounts**: Free usage for a specified period (typically 12 months)
4. **Discounted Path**: Standard path with percentage or fixed amount discounts

## Database Schema

### PromoCode Model

```typescript
enum PromoCodeType {
  PERCENT_OFF    // Percentage discount (e.g., 50% off)
  AMOUNT_OFF     // Fixed amount discount (e.g., $50 off)
  FREE_TRIAL     // Free trial period (days)
  PILOT_ACCOUNT  // Full pilot account (free usage)
  WAIVE_SETUP    // Waive setup fee only
}

model PromoCode {
  id                  String         // Unique ID
  code                String         // Human-readable code (e.g., "PILOT2025")
  type                PromoCodeType  // Type of promo code
  description         String?        // Description for admins

  // Discount values
  percentOff          Int?           // 0-100
  amountOff           Float?         // Dollar amount
  freeTrialDays       Int?           // Number of days

  // Usage limits
  maxUses             Int?           // Max redemptions (null = unlimited)
  currentUses         Int            // Current redemption count
  expiresAt           DateTime?      // Code expiration date
  isActive            Boolean        // Can be used?

  // Stripe integration
  stripeCouponId      String?        // Link to Stripe coupon

  // Metadata
  createdBy           String?        // Admin user ID
  notes               String?        // Internal notes

  // Relations
  subscriptions       ServiceSubscription[]
}
```

### ServiceSubscription Updates

New fields added to `ServiceSubscription`:

```typescript
promoCodeId          String?        // Link to applied promo code
promoCode            PromoCode?     // Relation to promo code
setupFeeWaived       Boolean        // If true, no setup fee required
discountPercent      Int?           // Discount percentage applied (0-100)
discountAmount       Float?         // Fixed discount amount applied
isPilotAccount       Boolean        // Special pilot/demo account
pilotExpiresAt       DateTime?      // Pilot account expiration date
stripeCouponId       String?        // Stripe coupon ID if applied
```

## API Endpoints

### 1. Create Monthly-Only Subscription (No Setup Fee)

**Endpoint**: `POST /api/subscriptions/create-monthly-only`

Creates a DIY subscription that starts with monthly billing immediately, skipping the setup fee.

**Request Body**:
```json
{
  "promoCode": "PILOT2025"  // Optional promo code
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "stripeSubscriptionId": "sub_stripe_456",
    "nextBillingDate": "2025-12-06T00:00:00Z",
    "setupFeeWaived": true,
    "isPilotAccount": true
  }
}
```

### 2. Create Checkout with Promo Code

**Endpoint**: `POST /api/subscriptions/create-checkout`

Creates a checkout session with optional promo code applied.

**Request Body**:
```json
{
  "intakeSessionId": "session_123",
  "promoCode": "SAVE50"  // Optional promo code
}
```

### 3. Admin - Manage Promo Codes

**Endpoint**: `GET /api/admin/promo-codes` (Admin only)

List all promo codes with usage statistics.

**Endpoint**: `POST /api/admin/promo-codes` (Admin only)

Create a new promo code.

**Request Body**:
```json
{
  "code": "SAVE50",
  "type": "PERCENT_OFF",
  "description": "50% off for early adopters",
  "percentOff": 50,
  "maxUses": 100,
  "expiresAt": "2025-12-31T00:00:00Z",
  "createStripeCoupon": true,
  "notes": "For Q4 2025 promotion"
}
```

**Endpoint**: `PATCH /api/admin/promo-codes` (Admin only)

Update an existing promo code.

**Request Body**:
```json
{
  "id": "promo_123",
  "isActive": false,
  "notes": "Disabled due to overuse"
}
```

## Command Line Scripts

### Create Pilot Account

Creates a pilot account promo code with 100% off for 12 months.

```bash
# Basic usage (generates random code)
npx tsx scripts/create-pilot-account.ts

# With specific code and usage limit
npx tsx scripts/create-pilot-account.ts PILOT2025 10

# With custom code for single use
npx tsx scripts/create-pilot-account.ts DEMO-ABC 1
```

**Output**:
```
🚀 Creating pilot account promo code...
   Code: PILOT2025
   Max Uses: 10

✅ Pilot account promo code created successfully!

📋 Details:
   ID: clx1234567890
   Code: PILOT2025
   Type: PILOT_ACCOUNT
   Max Uses: 10
   Expires: 11/6/2026
   Stripe Coupon: coupon_123abc

📝 Share this code with pilot users:
   PILOT2025
```

### Create Discount Code

Creates various types of discount codes.

```bash
# Percentage discount
npx tsx scripts/create-discount-code.ts SAVE50 --percent 50 --max-uses 100

# Fixed amount discount
npx tsx scripts/create-discount-code.ts SAVE20 --amount 20 --max-uses 50

# Waive setup fee only
npx tsx scripts/create-discount-code.ts NOSETUP --waive-setup --max-uses 20

# With custom expiration (30 days)
npx tsx scripts/create-discount-code.ts FLASH30 --percent 30 --max-uses 50 --expires-in 30
```

## Usage Examples

### Example 1: Create Pilot Accounts for Beta Testing

```bash
# Create 10 pilot account codes
npx tsx scripts/create-pilot-account.ts BETA-USER-01 1
npx tsx scripts/create-pilot-account.ts BETA-USER-02 1
# ... repeat for 10 users

# Or create one code for multiple users
npx tsx scripts/create-pilot-account.ts BETA-2025 10
```

### Example 2: Holiday Promotion

```bash
# Create 50% off Black Friday promotion
npx tsx scripts/create-discount-code.ts BLACKFRIDAY50 \
  --percent 50 \
  --max-uses 1000 \
  --expires-in 7 \
  --description "Black Friday 2025 - 50% off"
```

### Example 3: Partner Referrals

```bash
# Create $25 off codes for partner referrals
npx tsx scripts/create-discount-code.ts PARTNER-ABC \
  --amount 25 \
  --max-uses 50 \
  --description "Partner ABC referral discount"
```

### Example 4: Waive Setup Fee for Special Cases

```bash
# Create codes that only waive the $149.99 setup fee
npx tsx scripts/create-discount-code.ts WAIVE-SETUP-001 \
  --waive-setup \
  --max-uses 1 \
  --description "Setup fee waived for customer support case"
```

## Billing Flows

### Standard Flow (With Setup Fee)

1. User signs up and goes through checkout
2. **Day 0**: Pays $149.99 setup fee
3. Monthly subscription created but billing delayed 31 days
4. **Day 31**: First monthly charge of $24.99
5. **Day 62, 93, etc.**: Subsequent monthly charges

### Monthly-Only Flow (No Setup Fee)

1. User applies promo code (e.g., `WAIVE_SETUP`)
2. **Day 0**: $0 setup fee, monthly subscription starts immediately
3. **Day 0**: First monthly charge of $24.99
4. **Day 31, 62, etc.**: Subsequent monthly charges

### Pilot Account Flow

1. User applies pilot code (e.g., `PILOT2025`)
2. **Day 0**: $0 setup fee, monthly subscription with 100% off coupon
3. **Months 1-12**: $0 charges (100% off applied)
4. **Month 13**: Coupon expires, regular $24.99 monthly charges begin
5. Pilot status automatically removed when expired

### Discounted Flow

1. User applies discount code (e.g., `SAVE50`)
2. **Day 0**: Pays $74.99 setup fee (50% off $149.99)
3. Monthly subscription created, billing delayed 31 days
4. **Day 31**: First monthly charge of $24.99 (or discounted if coupon applies)

## Webhook Handling

The Stripe webhook handler has been updated to:

1. **Skip auto-subscription creation** for pilot/waived accounts (they already have subscriptions)
2. **Apply coupon codes** automatically when creating subscriptions
3. **Track pilot account expiration** and convert to regular billing after expiry
4. **Log all promo code usage** in audit logs

## Security & Access Control

- **Admin API**: Requires `ADMIN` role to create/update promo codes
- **Promo Code Validation**: Checks for:
  - Code exists and is active
  - Not expired (`expiresAt` check)
  - Usage limit not exceeded (`currentUses < maxUses`)
  - Correct type for the operation (e.g., `WAIVE_SETUP` for monthly-only)
- **Audit Logging**: All promo code creation and redemption is logged

## Monitoring & Analytics

Track promo code performance using:

```sql
-- Get promo code usage stats
SELECT
  code,
  type,
  currentUses,
  maxUses,
  COUNT(subscriptions.id) as redemptions
FROM "PromoCode"
LEFT JOIN "ServiceSubscription" subscriptions
  ON subscriptions."promoCodeId" = "PromoCode".id
GROUP BY "PromoCode".id
ORDER BY currentUses DESC;

-- Get active pilot accounts
SELECT
  user.email,
  subscription.id,
  subscription.pilotExpiresAt,
  promoCode.code
FROM "ServiceSubscription" subscription
JOIN "User" user ON user.id = subscription.userId
LEFT JOIN "PromoCode" promoCode ON promoCode.id = subscription.promoCodeId
WHERE subscription.isPilotAccount = true
AND subscription.pilotExpiresAt > NOW()
ORDER BY subscription.pilotExpiresAt ASC;
```

## Best Practices

1. **Pilot Accounts**:
   - Use unique codes per user for tracking
   - Set reasonable expiration dates (6-12 months)
   - Limit to small numbers (1-20 users) for true pilots

2. **Discount Codes**:
   - Use clear, memorable codes (e.g., `SAVE50`, not random strings)
   - Set expiration dates for time-sensitive promotions
   - Set max uses to prevent abuse

3. **Setup Fee Waivers**:
   - Use sparingly for special cases
   - Document reason in `notes` field
   - Consider using discount instead of full waiver

4. **Stripe Integration**:
   - Always create Stripe coupons for percentage/amount discounts
   - Test codes in Stripe dashboard before deploying
   - Monitor Stripe webhook logs for issues

## Troubleshooting

### Promo Code Not Applied

1. Check if code is active: `isActive = true`
2. Check expiration: `expiresAt > NOW()`
3. Check usage limit: `currentUses < maxUses`
4. Check Stripe coupon exists if required

### Pilot Account Still Charging

1. Verify Stripe coupon is 100% off
2. Check `pilotExpiresAt` date hasn't passed
3. Verify subscription has coupon attached in Stripe dashboard

### Double Billing on Monthly-Only Path

1. Ensure `setupFeeWaived = true` in database
2. Webhook should skip auto-subscription creation for waived accounts
3. Check webhook logs for errors

## Future Enhancements

Potential improvements:

- [ ] Admin UI for managing promo codes (currently CLI only)
- [ ] Automatic promo code generation for affiliates
- [ ] Usage analytics dashboard
- [ ] Email notifications when pilot accounts expire
- [ ] Stackable promo codes (apply multiple discounts)
- [ ] Time-based pricing (early bird discounts)
- [ ] Referral reward system

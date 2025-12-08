# Per-Claim Subscription APIs

## Overview

These APIs handle per-claim subscriptions for the new pricing model where each claim has its own setup fee and monthly subscription.

## Endpoints

### 1. Create Claim Subscription

**Endpoint**: `POST /api/claims/subscribe`

**Description**: Creates a subscription for a specific claim, calculates pricing based on claim order, and charges the setup fee.

**Authentication**: Required (user session)

**Request Body**:
```json
{
  "claimantId": "string"  // ID of the claimant/claim
}
```

**Response (Success 200)**:
```json
{
  "success": true,
  "claimSubscription": {
    "id": "string",
    "claimOrder": 2,
    "setupFeeAmount": 149.99,
    "monthlyFeeAmount": 14.99,
    "status": "PENDING"
  },
  "pricing": {
    "claimOrder": 2,
    "setupFee": 149.99,
    "monthlyFee": 14.99,
    "setupFeeRefundable": false
  },
  "payment": {
    "clientSecret": "pi_xxx_secret_xxx",
    "amount": 14999,
    "status": "requires_payment_method"
  },
  "message": "Claim 2 subscription created. Setup fee: $149.99, Monthly: $14.99/mo"
}
```

**Error Responses**:
- `401`: Unauthorized - User not logged in
- `400`: Bad request - Missing claimantId or invalid data
- `403`: Forbidden - User doesn't own this claim
- `404`: Claimant not found
- `500`: Server error

**Example**:
```javascript
const response = await fetch('/api/claims/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    claimantId: 'clm_abc123'
  })
});

const data = await response.json();
// Use data.payment.clientSecret with Stripe Elements to collect payment
```

---

### 2. Get Claim Pricing Preview

**Endpoint**: `GET /api/claims/subscribe?claimantId={id}`

**Description**: Preview pricing for a claim before creating the subscription.

**Authentication**: Required (user session)

**Query Parameters**:
- `claimantId` (required): ID of the claimant

**Response (Success 200)**:
```json
{
  "claimOrder": 2,
  "currentActiveClaimsCount": 1,
  "pricing": {
    "setupFee": 149.99,
    "monthlyFee": 14.99,
    "setupFeeRefundable": false
  },
  "tier": "DIY_PREP"
}
```

**Example**:
```javascript
const response = await fetch('/api/claims/subscribe?claimantId=clm_abc123');
const pricing = await response.json();

console.log(`Setup: $${pricing.pricing.setupFee}`);
console.log(`Monthly: $${pricing.pricing.monthlyFee}/mo`);
```

---

### 3. Cancel Claim Subscription

**Endpoint**: `POST /api/claims/[claimId]/cancel-subscription`

**Description**: Cancels a claim subscription, recalculates pricing for remaining claims, and updates Stripe subscriptions.

**Authentication**: Required (user session)

**Path Parameters**:
- `claimId`: ID of the claim to cancel

**Request Body**: None

**Response (Success 200)**:
```json
{
  "success": true,
  "message": "Claim subscription cancelled successfully",
  "cancelled": {
    "claimId": "clm_abc123",
    "claimOrder": 2,
    "monthlyFee": 14.99
  },
  "recalculated": [
    {
      "claimId": "clm_xyz789",
      "newClaimOrder": 2,
      "newMonthlyFee": 14.99
    }
  ],
  "totals": {
    "oldMonthlyTotal": 54.97,
    "newMonthlyTotal": 39.98,
    "monthlySavings": 14.99
  }
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden - User doesn't own this claim
- `404`: Claim not found
- `400`: Claim has no active subscription
- `500`: Server error

**Example**:
```javascript
const response = await fetch('/api/claims/clm_abc123/cancel-subscription', {
  method: 'POST'
});

const result = await response.json();
console.log(`Saved $${result.totals.monthlySavings}/mo`);
```

---

### 4. Preview Claim Cancellation

**Endpoint**: `GET /api/claims/[claimId]/cancel-subscription`

**Description**: Preview the impact of cancelling a claim before actually cancelling it.

**Authentication**: Required (user session)

**Path Parameters**:
- `claimId`: ID of the claim to preview cancellation for

**Response (Success 200)**:
```json
{
  "currentClaim": {
    "claimId": "clm_abc123",
    "claimName": "John Doe",
    "claimOrder": 1,
    "monthlyFee": 24.99
  },
  "impact": {
    "currentMonthlyTotal": 54.97,
    "newMonthlyTotal": 39.98,
    "monthlySavings": 14.99,
    "affectedClaims": [
      {
        "claimId": "clm_xyz789",
        "claimName": "Jane Doe",
        "currentOrder": 2,
        "newOrder": 1,
        "currentMonthlyFee": 14.99,
        "newMonthlyFee": 24.99,
        "feeChange": 10.00
      }
    ]
  },
  "remainingClaimsCount": 2,
  "canCancel": true,
  "warnings": [
    "Cancelling this claim will increase monthly fee for Jane Doe from $14.99 to $24.99"
  ]
}
```

**Example**:
```javascript
const response = await fetch('/api/claims/clm_abc123/cancel-subscription');
const preview = await response.json();

if (preview.warnings.length > 0) {
  console.log('Warnings:', preview.warnings);
}

console.log(`New monthly total: $${preview.impact.newMonthlyTotal}`);
```

---

## Webhook Events

The following Stripe webhook events are handled for per-claim subscriptions:

### 1. `payment_intent.succeeded`

Triggered when a claim setup fee payment completes.

**Metadata Required**:
- `claimSubscriptionId`: ID of the claim subscription
- `setupFee`: Must be "true"
- `claimantId`: ID of the claimant
- `serviceSubscriptionId`: ID of the service subscription
- `tier`: "DIY_PREP" or "LEGAL_REP"

**Actions**:
- Marks setup fee as paid
- Activates claim subscription
- Creates payment record
- Creates audit log

### 2. `invoice.payment_succeeded`

Triggered when a monthly claim subscription payment succeeds.

**Subscription Metadata Required**:
- `claimSubscriptionId`: ID of the claim subscription

**Actions**:
- Creates monthly payment record
- Updates last billing date

### 3. `customer.subscription.deleted`

Triggered when a claim subscription is cancelled.

**Subscription Metadata Required**:
- `claimSubscriptionId`: ID of the claim subscription

**Actions**:
- Marks claim subscription as cancelled

### 4. `customer.subscription.updated`

Triggered when a claim subscription is updated (e.g., price change after reordering).

**Subscription Metadata Required**:
- `claimSubscriptionId`: ID of the claim subscription

**Actions**:
- Updates stripe price ID if changed

---

## Helper Functions

### From `claim-subscription-manager.ts`:

```typescript
// Get active claim count for a subscription
const count = await getActiveClaimCount(serviceSubscriptionId);

// Get all active claim subscriptions
const claims = await getActiveClaimSubscriptions(serviceSubscriptionId);

// Create a new claim subscription
const claimSub = await createClaimSubscription({
  claimantId,
  serviceSubscriptionId,
  tier: 'DIY_PREP',
  stripeCustomerId
});

// Charge setup fee
const paymentIntent = await chargeClaimSetupFee(
  claimSubscriptionId,
  stripeCustomerId
);

// Mark setup fee as paid
await markSetupFeePaid(claimSubscriptionId);

// Cancel claim subscription with recalculation
const result = await cancelClaimSubscription(claimSubscriptionId);

// Refund setup fee (lawyer track only)
await refundClaimSetupFee(claimSubscriptionId);

// Get total monthly fee for all claims
const total = await getTotalMonthlyFee(serviceSubscriptionId);
```

---

## Frontend Integration Example

### Creating a Claim Subscription

```typescript
async function subscribeToClaimService(claimantId: string) {
  // 1. Get pricing preview
  const pricingRes = await fetch(`/api/claims/subscribe?claimantId=${claimantId}`);
  const pricing = await pricingRes.json();

  // Show pricing to user
  console.log(`This will be claim ${pricing.claimOrder}`);
  console.log(`Setup fee: $${pricing.pricing.setupFee}`);
  console.log(`Monthly: $${pricing.pricing.monthlyFee}/mo`);

  // 2. Create subscription
  const createRes = await fetch('/api/claims/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimantId })
  });

  const subscription = await createRes.json();

  // 3. Collect payment with Stripe Elements
  const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
  const elements = stripe.elements();
  const paymentElement = elements.create('payment', {
    clientSecret: subscription.payment.clientSecret
  });

  // Mount and handle payment...
}
```

### Cancelling a Claim

```typescript
async function cancelClaim(claimId: string) {
  // 1. Preview cancellation
  const previewRes = await fetch(`/api/claims/${claimId}/cancel-subscription`);
  const preview = await previewRes.json();

  // Show warnings if any
  if (preview.warnings.length > 0) {
    const confirmed = confirm(preview.warnings.join('\n'));
    if (!confirmed) return;
  }

  // 2. Cancel
  const cancelRes = await fetch(`/api/claims/${claimId}/cancel-subscription`, {
    method: 'POST'
  });

  const result = await cancelRes.json();

  console.log(`Saved $${result.totals.monthlySavings}/mo`);
  console.log(`New total: $${result.totals.newMonthlyTotal}/mo`);
}
```

---

## Testing

### Test Creating a Claim Subscription

```bash
# Get pricing preview
curl -X GET "http://localhost:3000/api/claims/subscribe?claimantId=clm_123" \
  -H "Cookie: next-auth.session-token=..."

# Create subscription
curl -X POST "http://localhost:3000/api/claims/subscribe" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"claimantId": "clm_123"}'
```

### Test Cancelling a Claim

```bash
# Preview cancellation
curl -X GET "http://localhost:3000/api/claims/clm_123/cancel-subscription" \
  -H "Cookie: next-auth.session-token=..."

# Cancel
curl -X POST "http://localhost:3000/api/claims/clm_123/cancel-subscription" \
  -H "Cookie: next-auth.session-token=..."
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

Common error codes:
- `NO_SERVICE_SUBSCRIPTION`: User doesn't have a service subscription
- `STRIPE_ERROR`: Stripe API error
- `USER_NOT_FOUND`: User account not found
- `CLAIM_NOT_FOUND`: Claimant not found
- `UNAUTHORIZED`: Authentication required

---

## Migration Notes

### Backward Compatibility

The new per-claim APIs work alongside the existing account-level subscription APIs. The webhook handler checks for claim-specific metadata and falls back to account-level handling if not found.

### Existing Subscriptions

Existing account-level subscriptions continue to work. New claims filed under existing subscriptions should use the new per-claim APIs.

---

## See Also

- [Per-Claim Pricing Migration Guide](./PER_CLAIM_PRICING_MIGRATION.md)
- [Pricing Calculator Documentation](../src/lib/pricing-calculator.ts)
- [Claim Subscription Manager](../src/lib/claim-subscription-manager.ts)

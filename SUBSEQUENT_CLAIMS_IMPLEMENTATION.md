# Subsequent Claims Implementation - Complete Guide

**Date**: January 16, 2026
**Status**: ✅ READY FOR INTEGRATION

---

## 🎯 Overview

This implementation ensures that customers are charged for **every subsequent claim** they file after their first one. The workflow mirrors the first-claim experience with eligibility checking, payment, and form access.

## 📋 Problem Solved

**Before**: Users could create unlimited claims without additional payment after paying the initial $499.99 service fee.

**After**: Each claim after the first requires:
1. Eligibility verification
2. Payment of claim subscription ($149.99 setup + $24.99/mo or $14.99/mo)
3. Successful payment before RECA form access

---

## 🏗️ Architecture

### Workflow for Subsequent Claims

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Start New Claim" in portal                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ELIGIBILITY CHECK                                         │
│    - Answer basic RECA eligibility questions                │
│    - Can bypass with warning (not recommended)              │
│    - Validates: relationship, exposure, disease             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CREATE PLACEHOLDER CLAIMANT                              │
│    - Creates minimal Claimant record                        │
│    - Stores eligibility data                                │
│    - Sets status: PAYMENT_PENDING                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PAYMENT (ClaimSubscription)                              │
│    - Shows claim order (2nd, 3rd, etc.)                     │
│    - Displays pricing:                                      │
│      • Setup fee: $149.99                                   │
│      • Monthly: $24.99/mo (1st) or $14.99/mo (2nd+)        │
│    - Collects payment via Stripe                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CREATE WORKFLOW SESSION                                  │
│    - Passes paid claimantId to workflow API                 │
│    - Workflow API verifies payment before proceeding        │
│    - Creates IntakeSession                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. REDIRECT TO RECA FORM                                    │
│    - User starts filling out claim form                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Created/Modified

### New API Endpoints

#### 1. `/api/claims/check-eligibility` (POST)
**File**: `src/app/api/claims/check-eligibility/route.ts`

**Purpose**: Validates eligibility for subsequent claims before charging

**Request**:
```json
{
  "eligibilityData": {
    "relationship": "SELF" | "SPOUSE" | "CHILD" | etc,
    "exposure": boolean,
    "disease": boolean,
    "claimType": "DOWNWINDER"
  },
  "bypassCheck": boolean
}
```

**Response**:
```json
{
  "eligible": true,
  "eligibilityData": {...},
  "existingClaimCount": 1,
  "nextClaimOrder": 2,
  "message": "This claim appears to meet RECA eligibility requirements."
}
```

#### 2. `/api/claims/create-placeholder` (POST)
**File**: `src/app/api/claims/create-placeholder/route.ts`

**Purpose**: Creates a minimal claimant record before payment

**Request**:
```json
{
  "claimType": "DOWNWINDER",
  "eligibilityData": {...}
}
```

**Response**:
```json
{
  "success": true,
  "claimantId": "clm_xxx",
  "claimOrder": 2,
  "message": "Placeholder claim created. Proceed with payment for Claim 2."
}
```

### Modified API Endpoints

#### 3. `/api/reca/workflow/create` (UPDATED)
**File**: `src/app/api/reca/workflow/create/route.ts`

**Changes**:
- ✅ Detects if user has existing claims
- ✅ For 2nd+ claims, requires `claimantId` parameter
- ✅ Verifies claim has paid ClaimSubscription
- ✅ Returns 402 error if payment missing
- ✅ Only creates workflow if subscription is valid

**New Errors**:
```json
{
  "error": "SUBSEQUENT_CLAIM_REQUIRES_SUBSCRIPTION",
  "message": "This is your 2nd or additional claim. Please complete payment for this claim before starting the form.",
  "existingClaimCount": 1,
  "nextClaimOrder": 2
}
```

```json
{
  "error": "CLAIM_SUBSCRIPTION_NOT_PAID",
  "message": "Payment is required for this claim before you can start the form.",
  "claimantId": "clm_xxx"
}
```

### New React Components

#### 4. `NewClaimFlow` Component
**File**: `src/components/claims/NewClaimFlow.tsx`

**Purpose**: Orchestrates the entire subsequent claim workflow

**Features**:
- ✅ Multi-step flow (eligibility → payment → complete)
- ✅ Eligibility questionnaire with bypass option
- ✅ Integrates `ClaimSubscriptionFlow` for payment
- ✅ Auto-redirects to RECA form after payment
- ✅ Clear messaging about claim order and pricing

**Props**:
```typescript
{
  existingClaimCount: number;
  onCancel?: () => void;
}
```

#### 5. `NewClaimDialog` Component
**File**: `src/components/claims/NewClaimDialog.tsx`

**Purpose**: Dialog wrapper for `NewClaimFlow`

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingClaimCount: number;
}
```

---

## 🔌 Integration Guide

### Step 1: Add "Start New Claim" Button to Portal

Find your portal/dashboard page (e.g., `src/app/portal/page.tsx`) and add:

```tsx
"use client";

import { useState, useEffect } from "react";
import { NewClaimDialog } from "@/components/claims/NewClaimDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PortalPage() {
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
  const [claimCount, setClaimCount] = useState(0);

  // Fetch user's claim count
  useEffect(() => {
    async function fetchClaims() {
      const response = await fetch("/api/claimants");
      const data = await response.json();
      setClaimCount(data.claimants?.length || 0);
    }
    fetchClaims();
  }, []);

  return (
    <div>
      {/* Your existing portal content */}

      {/* Add "Start New Claim" button */}
      <div className="mt-6">
        <Button
          onClick={() => setShowNewClaimDialog(true)}
          className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Start New Claim
        </Button>
      </div>

      {/* New Claim Dialog */}
      <NewClaimDialog
        open={showNewClaimDialog}
        onOpenChange={setShowNewClaimDialog}
        existingClaimCount={claimCount}
      />
    </div>
  );
}
```

### Step 2: Create API Endpoint to Get User's Claims (if needed)

If you don't already have an endpoint to get user's claimants, create:

**`src/app/api/claimants/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claimants = await db.claimant.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      claimType: true,
      createdAt: true,
      claimSubscription: {
        select: {
          claimOrder: true,
          status: true,
          setupFeePaid: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ claimants });
}
```

---

## 💰 Pricing Structure

### DIY Track (`DIY_PREP`)

| Claim Order | Setup Fee | Monthly Fee | Notes |
|-------------|-----------|-------------|-------|
| 1st claim | Covered by $499.99 service fee | N/A | No additional charge |
| 2nd claim | $149.99 | $14.99/mo | Multi-claim discount |
| 3rd+ claims | $149.99 | $14.99/mo | Multi-claim discount |

**First claim monthly**: $24.99/mo (from initial subscription)
**Additional claims monthly**: $14.99/mo each

### Legal Track (`LEGAL_REP`)

| Claim Order | Setup Fee | Monthly Fee | Notes |
|-------------|-----------|-------------|-------|
| 1st claim | Covered by $499.99 service fee | N/A | No additional charge |
| 2nd+ claims | $149.99 | $24.99/mo | No multi-claim discount |

All claims on legal track: $24.99/mo each

---

## ✅ Validation & Security

### Payment Verification

The workflow creation endpoint now validates:

1. **User Authentication**: Must be signed in
2. **Service Subscription**: Must have paid initial $499.99 (or installments)
3. **Claim Count Check**: Determines if this is 1st or subsequent claim
4. **Claim Subscription**:
   - For 2nd+ claims, requires valid `claimantId`
   - Verifies ClaimSubscription exists for that claimant
   - Confirms `setupFeePaid = true`
5. **Ownership**: Verifies claimant belongs to authenticated user

### Error Handling

| Error Code | HTTP Status | Meaning |
|------------|-------------|---------|
| `SUBSEQUENT_CLAIM_REQUIRES_SUBSCRIPTION` | 402 | User tried to start 2nd+ claim without payment |
| `CLAIM_SUBSCRIPTION_NOT_PAID` | 402 | Claimant exists but payment not completed |
| `Invalid claimant ID` | 400 | Claimant doesn't exist or doesn't belong to user |

---

## 🧪 Testing Checklist

### Test First Claim (Should work as before)
- [ ] User with $499.99 paid can start first claim without additional payment
- [ ] Workflow creates successfully without `claimantId` parameter
- [ ] User can access RECA form immediately

### Test Subsequent Claim (New Flow)
- [ ] User with 1 existing claim sees "Start New Claim" button
- [ ] Clicking button opens eligibility dialog
- [ ] Can complete eligibility check and proceed
- [ ] Can bypass eligibility check with warning
- [ ] Payment screen shows correct pricing (2nd claim: $149.99 + $14.99/mo)
- [ ] After payment, automatically redirects to RECA form
- [ ] Trying to create workflow without payment returns 402 error

### Test Edge Cases
- [ ] User with no service subscription cannot create any claims
- [ ] User with partial payment (installments) can create first claim
- [ ] User cannot access RECA form for unpaid claim
- [ ] Multiple clicks don't create duplicate placeholder claimants
- [ ] Canceling during eligibility doesn't charge user
- [ ] Canceling during payment doesn't create claim subscription

---

## 📊 Database Changes

### ClaimSubscription (Existing Model)

Already exists from per-claim pricing system. Now properly integrated with workflow creation.

**Key Fields**:
- `claimantId` - Links to Claimant
- `serviceSubscriptionId` - Links to user's main subscription
- `claimOrder` - 1, 2, 3, etc.
- `setupFeePaid` - MUST be true to start RECA form
- `setupFeeAmount` - $149.99
- `monthlyFeeAmount` - $24.99 or $14.99
- `status` - PENDING | ACTIVE | CANCELED

### Claimant Model

**New Usage**:
- Used to create placeholder before payment
- First claim: Created during first workflow
- 2nd+ claims: Created during subscription flow

**Updated Fields** (for subsequent claims):
- `firstName` - Set to "Claim {N}" as placeholder
- `conversionStage` - Set to `PAYMENT_PENDING`
- `eligibilityData` - Stores responses from eligibility check

---

## 🔄 User Experience Flow

### First-Time User (Claim 1)
1. Signs up → Pays $499.99
2. Clicks "Start Claim"
3. Goes straight to RECA form
4. Completes and submits

### Returning User (Claim 2+)
1. Logs in to portal
2. Sees existing claim(s)
3. Clicks "Start New Claim"
4. **NEW: Answers eligibility questions** (or bypasses)
5. **NEW: Reviews pricing** ($149.99 + $14.99/mo)
6. **NEW: Completes payment**
7. Redirects to RECA form
8. Completes and submits

---

## 🚀 Deployment Checklist

### Before Deploying

- [ ] Test all API endpoints locally
- [ ] Verify Stripe products exist for claim subscriptions
- [ ] Test complete flow end-to-end
- [ ] Check error messages are user-friendly
- [ ] Verify database indexes are in place

### After Deploying

- [ ] Monitor for 402 errors (indicates payment requirement working)
- [ ] Check Stripe dashboard for claim subscription charges
- [ ] Verify users can complete 2nd+ claims successfully
- [ ] Monitor conversion rates (eligibility → payment)

---

## 📝 Future Enhancements

### Potential Improvements
1. **Eligibility Bypass Tracking**: Log when users bypass checks
2. **Partial Refunds**: Allow setup fee refunds if claim deemed ineligible
3. **Bulk Claim Discounts**: Offer discount for filing 3+ claims at once
4. **Pre-filled Forms**: Auto-populate known data from first claim
5. **Family Plan**: Special pricing for multiple family members

---

## 🐛 Troubleshooting

### Issue: User sees 402 error when trying to create workflow
**Cause**: ClaimSubscription not found or not paid
**Solution**: Direct user to portal to view claim subscriptions and complete payment

### Issue: Payment succeeds but form doesn't open
**Cause**: Workflow creation failed after payment
**Solution**: Check logs for workflow creation error, user can access from portal

### Issue: User bypassed eligibility but claim is actually ineligible
**Cause**: User clicked bypass button
**Solution**: This is expected behavior - they were warned. Refund handled case-by-case.

---

## 📞 Support

For questions about this implementation:
- Check API error responses (they're detailed)
- Review Stripe dashboard for payment issues
- Check database for ClaimSubscription records
- Monitor application logs for workflow creation errors

---

**Implementation Complete**: January 16, 2026
**Ready for**: QA Testing & Production Deployment

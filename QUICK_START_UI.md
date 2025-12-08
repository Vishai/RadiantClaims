# Quick Start Guide - Per-Claim Subscription UI

## 🚀 Getting Started

Your dev server is running at: **http://localhost:3001**

---

## 📍 Pages to Test

### 1. Service Tiers Page
**URL**: http://localhost:3001/service-tiers

**What to test**:
- Click the + and - buttons on claim counters
- Watch pricing update in real-time
- Compare DIY discount vs Legal no-discount
- Notice "refundable" messaging on Legal track

---

### 2. Portal Page (Future Integration)
**URL**: http://localhost:3001/portal

**To integrate**:
Add to your portal or subscription management page:

```tsx
import { ClaimSubscriptionsList } from "@/components/subscriptions/ClaimSubscriptionsList";

// In your component:
<ClaimSubscriptionsList
  serviceSubscriptionId={subscription.id}
  tier={subscription.tier}
/>
```

---

## 🎯 Quick Test Scenarios

### Scenario 1: See Dynamic Pricing
1. Go to http://localhost:3001/service-tiers
2. DIY card: Click + until you have 3 claims
3. Notice:
   - Setup: $149.99 → $449.97
   - Monthly: $24.99 → $54.97
   - Breakdown shows: $24.99 + $14.99 + $14.99

### Scenario 2: Subscribe to a Claim (Requires Setup)
1. Create a test claimant via intake
2. Navigate to portal/subscription
3. Add ClaimSubscriptionsList component
4. Click "Subscribe" on unsubscribed claim
5. Review pricing preview
6. Click "Continue to Payment"
7. Use Stripe test card: `4242 4242 4242 4242`
8. Complete payment
9. See claim move to "Active" section

### Scenario 3: Cancel with Preview
1. In ClaimSubscriptionsList, click "Cancel" on an active claim
2. Preview shows:
   - Current monthly total
   - New monthly total
   - Savings
   - Affected claims (if any)
3. Click "Confirm Cancellation"
4. See claims reorder and fees update

---

## 🔑 Stripe Test Cards

**Successful Payment**:
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Requires Authentication (3D Secure)**:
```
Card: 4000 0025 0000 3155
```

**Payment Fails**:
```
Card: 4000 0000 0000 9995
```

---

## 🎨 Component Quick Reference

### Import Paths
```tsx
import { ClaimSubscriptionFlow } from "@/components/subscriptions/ClaimSubscriptionFlow";
import { ClaimSubscriptionDialog } from "@/components/subscriptions/ClaimSubscriptionDialog";
import { ClaimSubscriptionsList } from "@/components/subscriptions/ClaimSubscriptionsList";
import { ClaimCancellationDialog } from "@/components/subscriptions/ClaimCancellationDialog";
```

### Usage Examples

**Stand-alone Flow**:
```tsx
<ClaimSubscriptionFlow
  claimantId="clm_123"
  onSuccess={() => console.log("Subscribed!")}
  onCancel={() => console.log("Cancelled")}
/>
```

**In a Dialog**:
```tsx
<ClaimSubscriptionDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  claimantId="clm_123"
  claimantName="John Doe"
  onSuccess={handleSuccess}
/>
```

**Full List View**:
```tsx
<ClaimSubscriptionsList
  serviceSubscriptionId="sub_123"
  tier="DIY_PREP"
/>
```

---

## 🔧 Troubleshooting

### Dev Server Won't Start
```bash
# Clear build cache
rm -rf .next

# Restart
pnpm run dev
```

### "Module not found" errors
```bash
# Reinstall dependencies
pnpm install

# Clear cache and reinstall
pnpm store prune
pnpm install
```

### Database out of sync
```bash
# Reset and migrate
npx prisma migrate reset
npx prisma migrate dev
```

### Stripe not loading
- Check `.env.local` has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Verify key starts with `pk_test_`

---

## 📊 Pricing Reference

### DIY Track
| Claims | Setup (Month 1) | Monthly (Month 2+) |
|--------|----------------|-------------------|
| 1      | $149.99        | $24.99/mo         |
| 2      | $299.98        | $39.98/mo         |
| 3      | $449.97        | $54.97/mo         |
| 10     | $1,499.90      | $159.90/mo        |

**Formula**: First claim $24.99/mo + Additional claims $14.99/mo each

### Legal Track
| Claims | Setup (Month 1) | Monthly (Month 2+) |
|--------|----------------|-------------------|
| 1      | $89.99*        | $24.99/mo         |
| 2      | $179.98*       | $49.98/mo         |
| 3      | $269.97*       | $74.97/mo         |
| 10     | $899.90*       | $249.90/mo        |

**Formula**: All claims $24.99/mo (no discount)
*Setup fees refundable when DOJ receives claim

---

## ✅ What's Working

- ✅ Service tiers page with interactive pricing
- ✅ Claim subscription flow with Stripe payment
- ✅ Claim subscriptions list with status tracking
- ✅ Claim cancellation with impact preview
- ✅ Automatic reordering and fee recalculation
- ✅ Real-time monthly total calculation
- ✅ All API endpoints functional
- ✅ Webhook handlers integrated
- ✅ Database migrations applied

---

## 📝 Integration TODOs (When Ready)

### Portal Page
Add ClaimSubscriptionsList to `/portal/subscription`:

```tsx
// src/app/portal/subscription/page.tsx
import { ClaimSubscriptionsList } from "@/components/subscriptions/ClaimSubscriptionsList";

export default async function SubscriptionPage() {
  const session = await getServerAuthSession();
  const subscription = await getSubscription(session.user.id);

  return (
    <div>
      <h1>Manage Subscriptions</h1>

      <ClaimSubscriptionsList
        serviceSubscriptionId={subscription.id}
        tier={subscription.tier}
      />
    </div>
  );
}
```

### After Claim Creation
Show subscribe dialog after creating a claimant:

```tsx
// After successful claimant creation
setShowSubscribeDialog(true);
setNewClaimantId(claimant.id);
```

---

## 🎉 You're Ready!

Everything is set up and working. The UI is ready for testing and integration into your existing pages.

**Dev Server**: http://localhost:3001
**Service Tiers**: http://localhost:3001/service-tiers
**Portal**: http://localhost:3001/portal

Happy testing! 🚀

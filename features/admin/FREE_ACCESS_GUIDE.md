# Free Access Guide: Giving Friends & Beta Testers Free Lifetime Access

This guide explains how to give people 100% free lifetime access to RadiantClaims.

## Two Approaches

### Approach 1: Lifetime Promo Code (Still Collects Payment Details)

**What it does:**
- Creates a promo code (e.g., `IKNOWBRANDON`)
- User goes through normal signup flow
- **User provides payment details** during checkout
- Stripe applies 100% off FOREVER coupon
- User is **never charged** (but payment method is on file)

**When to use:**
- You want payment details on file (for future flexibility)
- You might charge them eventually
- You want to track via Stripe dashboard
- User goes through "normal" onboarding flow

**Script:**
```bash
npx tsx scripts/create-lifetime-free-code.ts IKNOWBRANDON 5
```

**User experience:**
1. Receives code `IKNOWBRANDON`
2. Signs up normally
3. Enters code during checkout
4. **Provides credit card** (required by Stripe)
5. Sees $0.00 charge (100% off applied)
6. Gets full access

---

### Approach 2: No-Payment Account (Bypasses Payment Entirely)

**What it does:**
- Creates account directly in database
- **No Stripe integration** at all
- User **never sees** payment page
- You create account and share credentials
- Truly payment-free (no card on file)

**When to use:**
- Close friends/family (full trust)
- Advisors or mentors helping you
- Never want to charge them
- Don't need payment details on file
- Want simplest possible onboarding

**Script:**
```bash
npx tsx scripts/create-no-payment-account.ts friend@example.com "John Doe"
```

**User experience:**
1. Receives email with temp password
2. Logs in immediately
3. **Never sees payment page**
4. Gets full access instantly
5. Changes password (optional)

---

## Comparison Table

| Feature | Lifetime Promo Code | No-Payment Account |
|---------|---------------------|-------------------|
| **Payment Details Required** | ✅ Yes (but $0 charged) | ❌ No |
| **Stripe Integration** | ✅ Full | ❌ None |
| **User Self-Signup** | ✅ Yes (with code) | ❌ No (you create account) |
| **Payment Method on File** | ✅ Yes | ❌ No |
| **Future Charging Possible** | ✅ Easy (remove coupon) | ❌ Hard (need to collect payment) |
| **Stripe Dashboard Tracking** | ✅ Yes | ❌ No |
| **Revoke Access** | Moderate (cancel in Stripe) | Easy (update DB status) |
| **Best For** | Beta testers, semi-trusted users | Close friends, family, advisors |

---

## Recommendations

### For "IKNOWBRANDON" Type Codes → Use Approach 1 (Lifetime Promo Code)

**Why:**
- You might want payment details later
- Keeps users in Stripe for tracking
- If you change your mind, easy to start charging
- More "professional" onboarding

**How:**
```bash
# Create code with 5 redemptions
npx tsx scripts/create-lifetime-free-code.ts IKNOWBRANDON 5

# Share with friends
# They use code: IKNOWBRANDON during signup
```

---

### For Your Mom/Dad/Best Friend → Use Approach 2 (No-Payment Account)

**Why:**
- Zero friction (no payment page at all)
- Shows trust (you create account for them)
- They'll never pay anyway
- Simpler for non-tech-savvy users

**How:**
```bash
# Create account directly
npx tsx scripts/create-no-payment-account.ts mom@example.com "Mom"

# Email her the temp password
# She logs in, changes password, done!
```

---

## Example Workflows

### Scenario 1: Beta Testing (10 users you sort-of know)

```bash
# Create one reusable code
npx tsx scripts/create-lifetime-free-code.ts BETA-2025 10

# Email to beta testers:
# "Use code BETA-2025 at checkout for free lifetime access"
```

**Result:** They sign up, enter card (required), see $0 charge, get access

---

### Scenario 2: Your Lawyer Friend (VIP, full trust)

```bash
# Create account directly
npx tsx scripts/create-no-payment-account.ts lawyer@firm.com "Attorney Friend"

# Email credentials securely
```

**Result:** They log in immediately, never see payment page

---

### Scenario 3: Mix of Both

```bash
# Lifetime code for acquaintances
npx tsx scripts/create-lifetime-free-code.ts FRIENDS-2025 20

# No-payment accounts for close friends
npx tsx scripts/create-no-payment-account.ts bestie@example.com "Best Friend"
npx tsx scripts/create-no-payment-account.ts sister@example.com "Sister"
```

**Result:** Different onboarding for different trust levels

---

## Answering Your Original Question

> "If I give someone the promo code IKNOWBRANDON for 100% free lifetime access, will it require payment details?"

### Using Approach 1 (Lifetime Promo Code):
**YES** - User provides payment details (card required by Stripe)
- But they're **never charged** (100% off forever)
- Good if you want payment method on file

### Using Approach 2 (No-Payment Account):
**NO** - User never sees payment page
- Completely bypasses Stripe
- Good for close friends/family

### My Recommendation for "IKNOWBRANDON":
**Use Approach 1** (Lifetime Promo Code)

**Why:**
- Keeps payment method on file (future flexibility)
- Still feels "professional" (normal checkout flow)
- Easy to revoke or change terms via Stripe
- User can self-signup (you just give them the code)

**Create it:**
```bash
npx tsx scripts/create-lifetime-free-code.ts IKNOWBRANDON 10
```

**If you want NO payment details:**
Don't use promo codes at all - just create accounts directly:
```bash
npx tsx scripts/create-no-payment-account.ts friend@example.com "Brandon's Friend"
```

---

## Security & Access Control

Both approaches create accounts with:
- ✅ Full platform access
- ✅ DIY tier features
- ✅ No payment required (different mechanisms)
- ✅ Audit logging

**Key difference:**
- **Approach 1**: User in Stripe → Easy to monetize later
- **Approach 2**: No Stripe → Truly free (harder to start charging)

---

## Monitoring & Management

### Lifetime Promo Codes (Approach 1):
- View in `/admin/promo-codes`
- Track redemptions
- See in Stripe Dashboard
- Deactivate code to stop new signups

### No-Payment Accounts (Approach 2):
- View in database (`isPilotAccount = true, stripeCustomerId = null`)
- Query with:
  ```sql
  SELECT * FROM "ServiceSubscription"
  WHERE "isPilotAccount" = true
  AND "stripeCustomerId" IS NULL;
  ```
- Revoke by updating `status` to `INACTIVE`

---

## FAQ

**Q: Can I transition a no-payment account to paid later?**
A: Yes, but it's harder. You'll need to:
1. Create Stripe customer manually
2. Collect payment method
3. Create Stripe subscription
4. Link to existing subscription record

**Q: Can I transition a lifetime promo code to paid later?**
A: Very easy! Just remove the coupon in Stripe. They'll be charged next billing cycle.

**Q: Which is better for beta testing?**
A: **Lifetime Promo Code** (Approach 1) - keeps payment on file, professional UX

**Q: Which is better for my mom?**
A: **No-Payment Account** (Approach 2) - zero friction, no scary payment page

**Q: Can I use both?**
A: Absolutely! Use each for different situations.

---

## Quick Reference

| Goal | Script to Run |
|------|---------------|
| Promo code (5 uses) | `npx tsx scripts/create-lifetime-free-code.ts IKNOWBRANDON 5` |
| Single account (no payment) | `npx tsx scripts/create-no-payment-account.ts user@example.com "Name"` |
| Time-limited free (365 days) | `npx tsx scripts/create-no-payment-account.ts user@example.com "Name" --expires-in=365` |
| View all free accounts | Check `/admin/promo-codes` or query `ServiceSubscription` table |

---

**Bottom Line:**

- **Want payment on file? → Use lifetime promo codes**
- **Never want payment? → Create no-payment accounts**
- **Not sure? → Use lifetime promo codes** (more flexible)

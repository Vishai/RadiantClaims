# Beta Lockdown Guide: Invite-Only Access

This guide shows you how to lock down your production site and only allow trusted friends/family to access it using invite codes like `IKNOWBRANDON`.

---

## Goal

**Lock the site** during beta testing so:
- ❌ General public can't register or use the site
- ✅ Friends/family with codes like `IKNOWBRANDON` can access
- ✅ They get 100% free service forever
- ✅ You track who's using the site
- ✅ You can prove the system works before public launch

---

## Two-Step Setup

### Step 1: Lock Registration in Production

**On Vercel/Railway/Your Host:**

1. Go to your environment variables
2. Set: `REGISTRATION_ENABLED=false`
3. Redeploy

**Result:**
- Public can't register anymore ❌
- They'll see: "Registration temporarily disabled" message
- Site is now invite-only ✅

---

### Step 2: Enable IKNOWBRANDON as Access Code

Since `IKNOWBRANDON` already exists in your production database, you just need to enable **access override**.

**Option A: Via Admin UI (Easiest)**

1. Log into production as admin: `https://your-site.com/admin/promo-codes`
2. Find `IKNOWBRANDON` in the list
3. Click edit
4. Check **"Access Override Enabled"** ✅
5. Set **"Access Seats Total"**: `10` (or however many people you want)
6. Save

**Option B: Via Database Script**

```bash
# Get your production database URL from Vercel/Railway
# Set it temporarily in your terminal

export DATABASE_URL="your-production-database-url"

# Run the script
npx tsx scripts/enable-access-and-free-service.ts IKNOWBRANDON 10
```

---

## How It Works

### Before Lockdown
```
Anyone can register → Anyone can use the site
```

### After Lockdown
```
Registration closed → Only users with access codes can register
                   → IKNOWBRANDON users get full free access
```

---

## User Experience

### Someone WITHOUT a Code

1. Goes to registration page
2. Tries to sign up
3. Sees: "Registration is temporarily disabled. Use your invite code or check back soon."
4. **Can't proceed** ❌

### Someone WITH IKNOWBRANDON

1. Goes to registration page
2. Sees: "Have an access code?" section
3. Enters: `IKNOWBRANDON`
4. Clicks "Validate Code" → ✅ Code accepted
5. **Can now register** ✅
6. During checkout, sees **$0.00** (100% off forever)
7. Enters payment details (required by Stripe, but never charged)
8. **Gets full access** ✅

---

## Managing Access Codes

### View Who Used IKNOWBRANDON

**Admin Dashboard:**
```
/admin/promo-codes → Find IKNOWBRANDON → See usage: "5 / 10 used"
```

### Add More Seats

If 10 seats isn't enough:

1. Edit IKNOWBRANDON in admin UI
2. Change "Access Seats Total" to `20` (or whatever)
3. Save

### Create Additional Codes

**For different groups:**

```bash
# Family code (5 seats)
npx tsx scripts/create-lifetime-free-code.ts FAMILY-2025 5
npx tsx scripts/enable-access-and-free-service.ts FAMILY-2025 5

# Beta testers (20 seats)
npx tsx scripts/create-lifetime-free-code.ts BETA-TEST 20
npx tsx scripts/enable-access-and-free-service.ts BETA-TEST 20
```

Each code tracks separately, so you can see which group is using the site.

---

## Monitoring Beta Users

### See All Active Access Codes

**Admin UI:** `/admin/promo-codes`

You'll see:
- `IKNOWBRANDON` - 5/10 used - Active ✅
- `FAMILY-2025` - 2/5 used - Active ✅
- `BETA-TEST` - 15/20 used - Active ✅

### See Who Registered

**Database Query:**
```sql
SELECT
  u.email,
  u.name,
  u."createdAt",
  pg."accessSeatsUsed"
FROM "User" u
JOIN "PromoCodeAccessGrant" pg ON pg.email = u.email
WHERE pg."promoCodeId" = (
  SELECT id FROM "PromoCode" WHERE code = 'IKNOWBRANDON'
)
ORDER BY u."createdAt" DESC;
```

This shows everyone who used IKNOWBRANDON to register.

---

## What Users See

### Registration Page (Locked)

```
Registration Temporarily Disabled
We're not currently accepting new registrations.

[Have an invite code?]
   ┌─────────────────────┐
   │ IKNOWBRANDON        │  [Validate Code]
   └─────────────────────┘
```

### After Entering Code

```
✅ Access code validated!

Continue with registration...

Email: _______________
Password: _______________
[Create Account]
```

### At Checkout

```
DIY Path - $149.99 Setup + $24.99/month

Promo Code: IKNOWBRANDON ✅

Subtotal: $149.99
Discount (100% off): -$149.99
──────────────────────────────
Total: $0.00 (100% off forever)

[Enter Payment Details]  ← Still required, but never charged
```

---

## Unlocking the Site Later

When you're ready for public launch:

**In Production:**
1. Set `REGISTRATION_ENABLED=true`
2. Redeploy

**Result:**
- ✅ Public can register again
- ✅ IKNOWBRANDON still works (gives free access)
- ✅ Regular users pay normal price

You can keep IKNOWBRANDON active as a "VIP friend code" forever, or deactivate it once beta is done.

---

## Troubleshooting

### "I set REGISTRATION_ENABLED=false but people can still register"

- Did you redeploy after changing the environment variable?
- Check the variable is set in production (not just local .env)

### "IKNOWBRANDON doesn't bypass the registration lock"

- Check `accessOverrideEnabled = true` in database
- Check `accessSeatsTotal` is set and not exceeded
- Check code is `isActive = true`

### "Code works but users still see a charge"

- Check `percentOff = 100` in database
- Check `duration = FOREVER` (not ONCE or REPEATING)
- Check Stripe coupon was created (should be 100% off forever)

### "How do I revoke someone's access?"

**Option 1: Deactivate their subscription**
```sql
UPDATE "ServiceSubscription"
SET status = 'INACTIVE'
WHERE "userId" = 'user-id-here';
```

**Option 2: Delete their account**
Via admin UI or database (cascade deletes subscription)

---

## Security Notes

**Access Codes Are NOT Passwords:**
- They bypass registration lock
- They apply discounts
- But anyone with the code can use it (until seats run out)
- Don't share publicly!

**Best Practices:**
- Share codes via DM/email (not public posts)
- Use different codes for different groups (track separately)
- Set reasonable seat limits (prevent abuse)
- Monitor usage regularly (/admin/promo-codes)
- Deactivate codes if they leak

---

## Quick Reference

### Lock the Site (Invite-Only)
```bash
# Production environment
REGISTRATION_ENABLED=false
```

### Enable IKNOWBRANDON
```bash
# Via script
npx tsx scripts/enable-access-and-free-service.ts IKNOWBRANDON 10

# Or via admin UI
/admin/promo-codes → Edit IKNOWBRANDON → Check "Access Override" → Save
```

### Check Usage
```
/admin/promo-codes → See "5 / 10 used"
```

### Unlock for Public
```bash
# Production environment
REGISTRATION_ENABLED=true
```

---

## Example: Sister Using the Code

Your sister's experience:

1. **Goes to site** → Sees registration form
2. **Tries to register** → "Registration temporarily disabled"
3. **You text her:** "Use code IKNOWBRANDON"
4. **She enters code** → "Access code validated! ✅"
5. **Creates account** → Email, password, etc.
6. **Gets to checkout** → Sees $0.00 (100% off)
7. **Enters card** → Required but never charged
8. **Full access!** → Can use entire platform for free

---

**Bottom Line:**

Set `REGISTRATION_ENABLED=false` + enable access override on `IKNOWBRANDON` = **Invite-only beta with free access for friends/family** ✅

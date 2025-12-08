# 🛡️ Safe Migration Guide - Per-Claim Pricing

## Quick Start (5 Steps)

### 1️⃣ Backup Your Database (2 minutes)

```bash
npx tsx scripts/backup-database.ts
```

✅ **What happens**: Creates a complete backup of all your data in `backups/backup-YYYY-MM-DD-HH-mm-ss/`

✅ **Safe**: Read-only operation, doesn't modify anything

---

### 2️⃣ Run Migration (1 minute)

```bash
npx prisma migrate dev --name add_claim_subscriptions
```

✅ **What happens**: Adds new `ClaimSubscription` table to database

✅ **Safe**: Only adds new table, doesn't touch existing data

---

### 3️⃣ Restore Data (2 minutes)

```bash
npx tsx scripts/restore-database.ts
```

✅ **What happens**: Re-seeds all your backed-up data back into the database

✅ **Safe**: Uses upsert, won't duplicate data

---

### 4️⃣ Create Stripe Products (2 minutes)

```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

✅ **What happens**: Creates 5 new products in Stripe (test mode)

✅ **Safe**: Creates new products, doesn't affect existing ones

**Copy the output price IDs to your `.env` file**

---

### 5️⃣ Verify Everything Works (2 minutes)

```bash
# Test pricing calculations
npx tsx scripts/test-pricing-calculator.ts

# Check database
npx prisma studio
```

✅ **What happens**: Verifies all calculations work and data is intact

✅ **Safe**: Read-only verification

---

## 🔍 What You're Migrating

### Before (Account-Based Pricing)
```
User Account → One Subscription → One Monthly Fee
```

### After (Per-Claim Pricing)
```
User Account → One Subscription → Multiple Claims
                                   ↓
                                   Each claim has:
                                   - Setup fee
                                   - Monthly fee
```

---

## 📊 New Database Structure

**New Table**: `ClaimSubscription`

Each claim now gets its own subscription record:
- Tracks setup fee payment
- Tracks monthly fee amount (based on claim order)
- Tracks claim order (1st, 2nd, 3rd claim)
- Links to Stripe subscription
- Handles refunds (lawyer track)

**Existing tables**: Not modified, all data preserved

---

## ✅ Safety Features

### 1. **Backup Script**
- Complete backup before any changes
- Backs up all tables to JSON files
- Creates metadata for verification
- Backups auto-ignored by Git

### 2. **Restore Script**
- Uses `upsert` (won't create duplicates)
- Respects foreign key order
- Handles missing files gracefully
- Can restore from any backup

### 3. **Migration**
- Only adds new table
- Doesn't delete or modify existing data
- Can be rolled back

### 4. **Verification**
- Test scripts to verify calculations
- Prisma Studio to inspect data
- Metadata comparison

---

## 🆘 If Something Goes Wrong

### Quick Rollback

```bash
# 1. Reset database to before migration
npx prisma migrate reset

# 2. Restore your backup
npx tsx scripts/restore-database.ts backups/backup-YYYY-MM-DD-HH-mm-ss

# 3. Restart app
npm run dev
```

**Result**: Back to exactly where you started

---

## 📋 Complete Checklist

Follow the detailed checklist: [`docs/MIGRATION_CHECKLIST.md`](docs/MIGRATION_CHECKLIST.md)

---

## 🎯 What Changes After Migration

### Immediate (After Migration)
- ✅ Database has new `ClaimSubscription` table
- ✅ All existing data still works
- ✅ Pricing calculator functions available
- ✅ React components ready to use

### Still Needed (API/UI Work)
- ⏳ API endpoints for creating claim subscriptions
- ⏳ API endpoints for handling cancellations
- ⏳ UI updates to show per-claim pricing
- ⏳ Stripe webhook updates

**Your existing app continues to work as-is after migration!**

---

## 🧪 Test Environment Recommended

If possible, test on a copy of your database first:

```bash
# 1. Create test database
createdb radiantclaims_test

# 2. Update .env temporarily
DATABASE_URL="postgresql://user:pass@localhost:5432/radiantclaims_test"

# 3. Run migration on test DB
npx prisma db push

# 4. Verify everything works

# 5. Switch back to production DB
DATABASE_URL="postgresql://user:pass@localhost:5432/radiantclaims"
```

---

## 📞 Need Help?

**Before Migration:**
- Review: `docs/MIGRATION_CHECKLIST.md`
- Review: `docs/PER_CLAIM_PRICING_MIGRATION.md`

**During Migration:**
- Watch console output for errors
- Save error messages
- Don't panic - you have backups!

**After Migration:**
- Check `backups/backup-*/metadata.json` for record counts
- Use `npx prisma studio` to inspect data
- Run test scripts to verify

---

## 📁 Files Created for You

### Scripts
- ✅ `scripts/backup-database.ts` - Backup your data
- ✅ `scripts/restore-database.ts` - Restore your data
- ✅ `scripts/setup-stripe-products-per-claim.ts` - Create Stripe products
- ✅ `scripts/test-pricing-calculator.ts` - Test calculations

### Documentation
- ✅ `docs/MIGRATION_CHECKLIST.md` - Step-by-step guide
- ✅ `docs/PER_CLAIM_PRICING_MIGRATION.md` - Full technical details
- ✅ `docs/PER_CLAIM_PRICING_IMPLEMENTATION_SUMMARY.md` - What was built
- ✅ `PRICING_QUICK_REFERENCE.md` - Quick reference card

### Code
- ✅ `prisma/schema.prisma` - Updated with ClaimSubscription model
- ✅ `src/lib/pricing-calculator.ts` - Pricing calculation utilities
- ✅ `src/lib/constants/service-tiers.ts` - Updated pricing config
- ✅ `src/components/pricing/PerClaimPricingDisplay.tsx` - React components

---

## 🎉 Ready to Start?

```bash
# Step 1: Backup
npx tsx scripts/backup-database.ts

# Step 2: Migrate
npx prisma migrate dev --name add_claim_subscriptions

# Step 3: Restore
npx tsx scripts/restore-database.ts

# Step 4: Stripe
npx tsx scripts/setup-stripe-products-per-claim.ts

# Step 5: Verify
npx tsx scripts/test-pricing-calculator.ts
```

**Total time**: ~10 minutes

**Your data is safe!** 🛡️

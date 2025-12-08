# Per-Claim Pricing Migration Checklist

## ⚠️ Pre-Migration Checklist

Before starting the migration, ensure you have:

- [ ] Database connection is working
- [ ] Recent code pushed to Git (in case of rollback)
- [ ] All team members notified of maintenance window
- [ ] Stripe API keys in `.env`
- [ ] Development environment tested

## 📦 Step 1: Backup Database

Create a complete backup of your database:

```bash
npx tsx scripts/backup-database.ts
```

**Expected Output:**
```
✓ Created backup directory: backups/backup-2024-12-04-15-30-45
✓ Saved XX records to users.json
✓ Saved XX records to claimants.json
✓ Saved XX records to serviceSubscriptions.json
...
✓ Backup complete!
```

**Verify backup:**
```bash
ls -la backups/backup-*
# Should see: users.json, claimants.json, etc., and metadata.json
```

### What Gets Backed Up?

✅ All user accounts and authentication data
✅ All claimants and claims
✅ All subscriptions and payments
✅ All intake sessions and responses
✅ All documents and files
✅ All promo codes and usage
✅ All law firm assignments
✅ All claim lifecycle data

**Location**: `backups/backup-YYYY-MM-DD-HH-mm-ss/`

**Note**: Backups are automatically ignored by Git (won't be committed)

---

## 🗃️ Step 2: Run Database Migration

Run the Prisma migration to add the new `ClaimSubscription` table:

```bash
npx prisma migrate dev --name add_claim_subscriptions
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ The migration has been created successfully
✔ Applied migration: 20241204_add_claim_subscriptions
```

**What This Does:**
- Creates new `ClaimSubscription` table
- Adds relations to `Claimant` and `ServiceSubscription`
- Does NOT delete or modify existing data

**Verify migration:**
```bash
npx prisma studio
# Check that ClaimSubscription table exists
```

---

## 🔄 Step 3: Restore Data

Restore your backed-up data (uses latest backup automatically):

```bash
npx tsx scripts/restore-database.ts
```

**Or restore from specific backup:**
```bash
npx tsx scripts/restore-database.ts backups/backup-2024-12-04-15-30-45
```

**Expected Output:**
```
Using latest backup: backups/backup-2024-12-04-15-30-45
✓ Restored XX records to users
✓ Restored XX records to claimants
✓ Restored XX records to serviceSubscriptions
...
✓ Restore complete!
```

---

## ✅ Step 4: Verify Data Integrity

Check that all data was restored correctly:

### 4.1 Check Record Counts

```bash
npx prisma studio
```

Compare counts in Prisma Studio with the `metadata.json` from your backup:

```bash
cat backups/backup-*/metadata.json | grep -A 50 tables
```

### 4.2 Test Database Queries

```bash
# Open Prisma console
npx tsx
```

```typescript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check users
await prisma.user.count();

// Check claimants
await prisma.claimant.count();

// Check subscriptions
await prisma.serviceSubscription.count();

// Verify relations work
await prisma.user.findFirst({
  include: {
    claimants: true,
    serviceSubscription: true
  }
});

await prisma.$disconnect();
```

### 4.3 Check for Missing Data

Look for any NULL foreign keys that shouldn't be NULL:

```bash
npx tsx
```

```typescript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check for orphaned claimants (no user)
const orphanedClaimants = await prisma.claimant.findMany({
  where: { userId: null },
  include: { intakeSession: true }
});

console.log(`Orphaned claimants: ${orphanedClaimants.length}`);

await prisma.$disconnect();
```

---

## 🎨 Step 5: Create Stripe Products

Create the new per-claim pricing products in Stripe:

```bash
npx tsx scripts/setup-stripe-products-per-claim.ts
```

**Expected Output:**
```
Creating DIY Setup Fee Product
✓ Product created: prod_xxx
✓ Price created: price_xxx
  Amount: $149.99

Creating DIY First Claim Monthly Product
✓ Product created: prod_xxx
✓ Price created: price_xxx
  Amount: $24.99/month

... (3 more products)

Add these to your .env file:
STRIPE_PRICE_ID_DIY_SETUP=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=price_xxx
STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=price_xxx
STRIPE_PRICE_ID_LEGAL_SETUP=price_xxx
STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=price_xxx
```

---

## ⚙️ Step 6: Update Environment Variables

Add the Stripe price IDs to your `.env` file:

```bash
# Copy from script output above
echo "STRIPE_PRICE_ID_DIY_SETUP=price_xxx" >> .env
echo "STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=price_xxx" >> .env
echo "STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=price_xxx" >> .env
echo "STRIPE_PRICE_ID_LEGAL_SETUP=price_xxx" >> .env
echo "STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=price_xxx" >> .env
```

**Verify:**
```bash
grep STRIPE_PRICE_ID .env
```

---

## 🧪 Step 7: Test Pricing Calculator

Verify pricing calculations work correctly:

```bash
npx tsx scripts/test-pricing-calculator.ts
```

**Expected Output:**
```
✓ All pricing calculations correct!
✓ DIY discount applies only to additional claims
✓ Legal track has no discount for additional claims
✓ Setup fees correctly reflect refundable status

Ready to implement in production! 🚀
```

---

## 🚀 Step 8: Restart Application

Restart your development server:

```bash
npm run dev
# or
yarn dev
```

**Verify:**
- Application starts without errors
- Can access database
- Stripe configuration loads

---

## 🔍 Step 9: Manual Testing

### Test 1: View Pricing
- [ ] Navigate to service tiers page
- [ ] Verify pricing displays correctly
- [ ] Check both DIY and Lawyer paths

### Test 2: Check Existing Data
- [ ] Login with existing user account
- [ ] View existing claims
- [ ] Check subscription status
- [ ] Verify all data is intact

### Test 3: Database Access
- [ ] Run `npx prisma studio`
- [ ] Browse all tables
- [ ] Check ClaimSubscription table exists (should be empty for now)

---

## 📊 Step 10: Create ClaimSubscriptions (Optional)

If you have existing claims and want to migrate them to the new pricing model:

**This step is OPTIONAL and should only be done if you want to migrate existing customers to the new pricing structure.**

```typescript
// Migration script to create ClaimSubscription records for existing claims
// (You'll need to write this based on your business rules)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Example: Create ClaimSubscription for each existing Claimant
const claimants = await prisma.claimant.findMany({
  include: { user: { include: { serviceSubscription: true } } }
});

for (const claimant of claimants) {
  if (!claimant.user?.serviceSubscription) continue;

  // Determine claim order (you'll need logic here)
  const claimOrder = 1; // Or calculate based on creation date

  await prisma.claimSubscription.create({
    data: {
      claimantId: claimant.id,
      serviceSubscriptionId: claimant.user.serviceSubscription.id,
      claimOrder,
      setupFeePaid: true, // Assuming existing claims already paid
      setupFeeAmount: 149.99, // Or 89.99 for legal
      monthlyFeeAmount: claimOrder === 1 ? 24.99 : 14.99,
      status: 'ACTIVE'
    }
  });
}

await prisma.$disconnect();
```

---

## ✅ Final Verification Checklist

- [ ] Database backup created successfully
- [ ] Migration ran without errors
- [ ] Data restored successfully
- [ ] Record counts match backup metadata
- [ ] Stripe products created (5 total)
- [ ] Environment variables updated
- [ ] Pricing calculator tests pass
- [ ] Application starts without errors
- [ ] Can login and view existing data
- [ ] ClaimSubscription table exists
- [ ] (Optional) Existing claims migrated to ClaimSubscription

---

## 🔄 Rollback Plan (If Something Goes Wrong)

If you encounter issues and need to rollback:

### Option 1: Revert Migration

```bash
# Reset database to state before migration
npx prisma migrate reset

# Restore from backup
npx tsx scripts/restore-database.ts backups/backup-YYYY-MM-DD-HH-mm-ss
```

### Option 2: Manual Rollback

```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back 20241204_add_claim_subscriptions

# Drop the new table
npx prisma db execute --stdin <<EOF
DROP TABLE IF EXISTS "ClaimSubscription" CASCADE;
EOF

# Restore data
npx tsx scripts/restore-database.ts
```

### Option 3: Git Revert

```bash
# Revert all code changes
git reset --hard HEAD~1

# Reinstall dependencies
npm install

# Reset database
npx prisma migrate reset

# Restore backup
npx tsx scripts/restore-database.ts
```

---

## 📞 Support

If you encounter any issues:

1. **Check the backup**: Verify `backups/backup-*/metadata.json`
2. **Check migration status**: `npx prisma migrate status`
3. **Check database**: `npx prisma studio`
4. **Review logs**: Check console output from scripts
5. **Ask for help**: Include error messages and backup metadata

---

## 📝 Migration Log Template

Document your migration for record-keeping:

```
Migration Date: _______________
Performed By: _______________
Backup Location: backups/backup-_______________

Pre-Migration Counts:
- Users: _____
- Claimants: _____
- Subscriptions: _____
- Payments: _____

Post-Migration Counts:
- Users: _____
- Claimants: _____
- Subscriptions: _____
- Payments: _____
- ClaimSubscriptions: _____

Stripe Products Created:
- DIY Setup: price_____________
- DIY First Monthly: price_____________
- DIY Additional Monthly: price_____________
- Legal Setup: price_____________
- Legal Monthly: price_____________

Issues Encountered: _______________
Resolution: _______________

Status: ✅ Success / ❌ Rolled Back
```

---

**Good luck with your migration!** 🚀

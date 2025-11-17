# Migration Fix Summary

**Date:** November 15, 2025
**Branch:** tutorial-system
**Status:** ✅ Resolved

---

## Issue Encountered

Migration `20251106000000_add_access_override` was failing because it tried to ALTER the `PromoCode` table before it was created. The migration ordering was incorrect:

**Problem:**
- `20251106000000_add_access_override` (tries to ALTER PromoCode)
- `20251106024717_add_promo_codes_and_pilot_accounts` (creates PromoCode)

The timestamp ordering caused the ALTER to run before CREATE, resulting in:
```
ERROR: relation "PromoCode" does not exist
```

---

## Solution Applied

### Step 1: Fixed Migration Order
Renamed the migration to ensure correct execution order:
```bash
mv prisma/migrations/20251106000000_add_access_override \
   prisma/migrations/20251106030500_add_access_override
```

**New correct order:**
1. `20251106024717_add_promo_codes_and_pilot_accounts` (creates PromoCode)
2. `20251106030151_add_promo_code_duration_and_path_restrictions`
3. `20251106030500_add_access_override` (now runs AFTER PromoCode exists)

### Step 2: Reset Database
Applied all migrations in correct order:
```bash
npx prisma migrate reset --force
```

### Step 3: Seeded Database
Populated with demo data:
```bash
npm run db:seed
```

---

## Verification

### Migration Status
✅ All 17 migrations applied successfully:
```
Database schema is up to date!
```

### Tables Created
Tutorial System tables:
- `Tutorial`
- `TutorialAnalytics`
- `TutorialPreference`
- `TutorialProgress`

Notification System tables:
- `AttorneyNotificationLog`
- `LawFirmNotificationSchedule`
- `LawFirmNotificationSetting`
- `LifecycleNotificationPreference`
- `Notification`

### Seeded Data
- ✅ 4 users (Customer, Admin, Attorney, Reviewer)
- ✅ 1 claimant
- ✅ 2 attorney activity logs
- ✅ 2 notification logs
- ✅ Notification schedule configured
- ✅ Follow-up and document assistance records

### Code Quality
- ✅ Lint: No ESLint warnings or errors
- ✅ All test credentials working

---

## Final Migration Order

All migrations now execute in this sequence:

1. `20251031040750_tier_design`
2. `20251031124936_add_resource_purpose_and_what_to_bring`
3. `20251103050547_add_category`
4. `20251104164034_add_subscription_trial_ending_audit_action`
5. `20251105164514_ocr_fix`
6. `20251105202246_add_registration_waitlist`
7. `20251105203747_add_service_tier_to_waitlist`
8. `20251106024717_add_promo_codes_and_pilot_accounts` ← Creates PromoCode
9. `20251106030151_add_promo_code_duration_and_path_restrictions`
10. `20251106030500_add_access_override` ← Alters PromoCode ✅ Fixed
11. `20251107220627_add_ai_review_qa_system`
12. `20251108020326_add_promo_code_usage_table`
13. `20251108170642_lawyer_dashboard`
14. `20251109000000_packet_generation`
15. `20251111000000_add_promo_code_tier_coupons`
16. `20251113090000_notification_system`
17. `20251115000000_tutorial_system`

---

## Test Credentials

```
Customer:  customer@test.com / customer123
Admin:     admin@radiantclaims.com / admin123
Attorney:  attorney@heritagelaw.com / attorney123
Reviewer:  reviewer@radiantclaims.com / reviewer123
```

**Note:** All notification emails route to `brandon@radiantclaims.com` for testing.

---

## Next Steps

The tutorial-system branch is now ready for:

1. **Testing** - Verify tutorial UI components work correctly
2. **Integration** - Test API endpoints for tutorial management
3. **Merge** - When ready, merge tutorial-system → main
4. **Deploy** - Apply migrations in production with `pnpm prisma migrate deploy`

---

## Lessons Learned

**Migration Naming Convention:**
- Always use timestamps that reflect the true dependency order
- If a migration depends on another, ensure its timestamp is AFTER the dependency
- When renaming migrations during development, verify all dependencies

**Best Practice:**
- Run `npx prisma migrate status` before and after changes
- Use `npx prisma migrate reset` in development to verify all migrations work from scratch
- Test migration order by resetting the database periodically

---

**Resolution Time:** ~10 minutes
**Impact:** Development database only (no production impact)
**Status:** ✅ Complete and verified

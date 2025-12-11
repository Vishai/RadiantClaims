# 🧪 Test Packets Quick Reference

## ✅ All 5 Test Packets Successfully Created!

All test users, claimants, intake sessions, and documents have been loaded into your database.

---

## 🔐 Login Credentials

**All passwords:** `TestPassword123!`

| Test User | Email | Location | Progress | Documents |
|-----------|-------|----------|----------|-----------|
| Mary Johnson | test.downwinder.utah@radiantclaims.test | St. George, UT | 75% (Stage 4/5) | 4 files |
| Robert Martinez | test.survivor.nevada@radiantclaims.test | Las Vegas, NV | 60% (Stage 3/5) | 4 files |
| Patricia Wilson | test.complex.idaho@radiantclaims.test | Idaho Falls, ID | 95% (Stage 5/5) | 5 files |
| James Chen | test.earlystage.arizona@radiantclaims.test | Flagstaff, AZ | 15% (Stage 1/5) | 1 file |
| Emily Rodriguez | test.grandchild.newmexico@radiantclaims.test | Albuquerque, NM | 40% (Stage 2/5) | 5 files |

---

## 🎯 Quick Test Scenarios

### Test Simple Flow
**Use:** Mary Johnson (test.downwinder.utah@radiantclaims.test)
- Perfect "happy path" case
- Self-filing for thyroid cancer
- 4 documents uploaded
- Ready for review stage

### Test Family Claims
**Use:** Robert Martinez (test.survivor.nevada@radiantclaims.test)
- Filing for deceased father
- Death certificate + birth certificate chain
- Tests survivor workflows

### Test Complex Cases
**Use:** Patricia Wilson (test.complex.idaho@radiantclaims.test)
- Multiple cancers (thyroid + kidney)
- PDF already generated (tests download tracking)
- 95% complete - almost ready to submit
- Best for testing completion flows

### Test Onboarding
**Use:** James Chen (test.earlystage.arizona@radiantclaims.test)
- Just started (15% complete)
- Minimal documents
- Tests early-stage nudges and guidance

### Test Multi-Generation
**Use:** Emily Rodriguez (test.grandchild.newmexico@radiantclaims.test)
- Granddaughter filing for grandmother
- Complex family tree validation
- Chain of birth certificates

---

## 📦 What's Included in Each Packet

### Database Records Created:
- ✅ User account (authenticated, email verified)
- ✅ Claimant profile (demographics, address)
- ✅ Intake session (workflow stage, form data)
- ✅ Uploaded documents (with OCR metadata)
- ✅ Service subscription (DIY path, $499.99 paid)

### Simulated Document Types:
- Driver's License / Passport / SSN Card (Identity)
- Pathology Reports (Medical proof)
- Death Certificates (Deceased claimants)
- Birth Certificates (Family relationships)
- School Records, LDS Records, Tax Returns (Residence proof)
- Employment badges (Nevada Test Site)

**Note:** No actual PDF files exist - only database records with realistic extracted metadata

---

## 🚀 Quick Start Testing

### 1. Login to Test Account
```
URL: http://localhost:3000/login
Email: test.downwinder.utah@radiantclaims.test
Password: TestPassword123!
```

### 2. View in Admin Dashboard
```
URL: http://localhost:3000/admin/claims
```

### 3. Check Claimant Data via API
```bash
# Get all test claimants
curl http://localhost:3000/api/claimants | jq '.[] | select(.email | contains("radiantclaims.test"))'
```

---

## 🧹 Cleanup Test Data

### Option 1: Delete All Test Accounts
```sql
DELETE FROM "User" WHERE email LIKE '%@radiantclaims.test';
```

### Option 2: Delete Specific User
```sql
DELETE FROM "User" WHERE email = 'test.downwinder.utah@radiantclaims.test';
```

**Note:** Cascade deletes will automatically remove all related data (claimants, sessions, documents, subscriptions)

---

## 🔄 Regenerate Test Packets

```bash
# First, clean up existing test data
psql "$DATABASE_URL" -c "DELETE FROM \"User\" WHERE email LIKE '%@radiantclaims.test';"

# Then regenerate
npx tsx scripts/seed-test-packets.ts
```

---

## 📚 Full Documentation

See `scripts/TEST-PACKETS-README.md` for:
- Detailed packet descriptions
- Testing workflows by scenario
- Document metadata structure
- API testing examples
- Extending test packets

---

## 🎪 Test Coverage

### Geographic Coverage
- ✅ Utah (St. George - downwinder epicenter)
- ✅ Nevada (Las Vegas - test site proximity)
- ✅ Idaho (Idaho Falls - INL area)
- ✅ Arizona (Flagstaff - expanded coverage)
- ✅ New Mexico (Los Alamos - Manhattan Project)

### Cancer Types
- ✅ Thyroid Cancer
- ✅ Lung Cancer
- ✅ Kidney Cancer
- ✅ Pancreatic Cancer

### Claim Relationships
- ✅ Self (Mary, Patricia, James)
- ✅ Child for Parent (Robert)
- ✅ Grandchild for Grandparent (Emily)

### Workflow Stages
- ✅ Stage 1 - Eligibility (James - 15%)
- ✅ Stage 2 - Form Filling (Emily - 40%)
- ✅ Stage 3 - Supporting Forms (Robert - 60%)
- ✅ Stage 4 - Documents (Mary - 75%)
- ✅ Stage 5 - Review (Patricia - 95%)

---

**Happy Testing! 🚀**

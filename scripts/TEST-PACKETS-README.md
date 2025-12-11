# Test User Packets

This document describes the 5 comprehensive test user packets created by `seed-test-packets.ts`.

## Quick Start

```bash
# Generate all test packets
npx tsx scripts/seed-test-packets.ts

# The script will create 5 test users with complete claim data
```

---

## Test Packet Overview

| # | Name | Scenario | Location | Stage | Documents |
|---|------|----------|----------|-------|-----------|
| 1 | Mary Johnson | Simple Downwinder - Self | St. George, UT | 4/5 (75%) | 4 files |
| 2 | Robert Martinez | Deceased Father - Survivor | Las Vegas, NV | 3/5 (60%) | 4 files |
| 3 | Patricia Wilson | Complex - Multiple Cancers | Idaho Falls, ID | 5/5 (95%) | 5 files |
| 4 | James Chen | Early Stage - Just Started | Flagstaff, AZ | 1/5 (15%) | 1 file |
| 5 | Emily Rodriguez | Deceased Grandparent | Albuquerque, NM | 2/5 (40%) | 5 files |

---

## Detailed Packet Descriptions

### 📦 Test Packet 1: Simple Downwinder (Utah)

**Persona:** Mary Johnson
**Email:** `test.downwinder.utah@radiantclaims.test`
**Password:** `TestPassword123!`

**Scenario:**
- Self-filing for thyroid cancer
- Born 1948, lived in St. George, UT during atomic testing (1951-1962)
- Diagnosed with thyroid cancer in 2010
- **Perfect "happy path" test case** - straightforward eligibility

**Claim Details:**
- **Claim Type:** DOWNWINDER
- **Cancer:** Thyroid Cancer (Papillary)
- **Diagnosis Date:** June 15, 2010
- **Exposure Location:** St. George, Washington County, UT
- **Exposure Period:** 1951-1962 (entire testing period)

**Documents Uploaded:**
1. ✓ Driver's License (Identity verification)
2. ✓ Thyroid Biopsy Report 2010 (Medical proof)
3. ✓ Elementary School Records 1956 (Residence proof)
4. ✓ Utility Bill 1960 (Additional residence proof)

**Workflow Status:**
- Stage: 4/5 - Documents uploaded, ready for review
- Completion: 75%
- Form PDF: Not yet generated

**Use This For Testing:**
- Document upload/verification flow
- OCR extraction display
- Progress tracking
- Basic eligibility validation

---

### 📦 Test Packet 2: Deceased Relative Filing (Nevada)

**Persona:** Robert Martinez (filing for deceased father Carlos)
**Email:** `test.survivor.nevada@radiantclaims.test`
**Password:** `TestPassword123!`

**Scenario:**
- Filing on behalf of deceased father who died from lung cancer
- Father lived in Las Vegas, NV during testing era
- Requires additional survivor documentation (birth cert, death cert)
- Tests **complex family relationship workflows**

**Claim Details:**
- **Claim Type:** DOWNWINDER
- **Relationship:** Son filing for deceased father
- **Deceased:** Carlos Martinez (DOB: 5/10/1945, DOD: 3/20/2018)
- **Cancer:** Lung Cancer (Non-small cell)
- **Diagnosis Date:** January 15, 2017
- **Exposure Location:** Las Vegas, Clark County, NV
- **Exposure Period:** 1951-1962

**Documents Uploaded:**
1. ✓ Death Certificate (Carlos Martinez)
2. ✓ Birth Certificate (Robert Martinez - proves relationship)
3. ✓ Lung Cancer Diagnosis 2017
4. ✓ Nevada Test Site Employment Badge 1955

**Workflow Status:**
- Stage: 3/5 - Supporting forms stage
- Completion: 60%
- Form PDF: Not generated

**Use This For Testing:**
- Deceased claimant workflows
- Family relationship verification
- Death certificate processing
- Survivor hierarchy logic

---

### 📦 Test Packet 3: Complex Multi-Cancer Case (Idaho)

**Persona:** Patricia Wilson
**Email:** `test.complex.idaho@radiantclaims.test`
**Password:** `TestPassword123!`

**Scenario:**
- **Multiple eligible cancers** (thyroid AND kidney)
- Lived in multiple Idaho locations during exposure period
- Nearly complete - at final review stage
- PDF already generated (tests refund policy enforcement)
- **Best for testing edge cases and completion flows**

**Claim Details:**
- **Claim Type:** DOWNWINDER
- **Cancer 1:** Thyroid Cancer (Follicular) - diagnosed 4/10/2005
- **Cancer 2:** Kidney Cancer (Renal cell) - diagnosed 9/22/2019
- **Exposure Locations:**
  - Idaho Falls, Bonneville County, ID (1952-1962)
  - Arco, Butte County, ID (1958-1960)
- **Maiden Name:** Thompson (requires name change documentation)

**Documents Uploaded:**
1. ✓ US Passport (Identity)
2. ✓ Thyroid Pathology Report 2005
3. ✓ Kidney Biopsy Report 2019
4. ✓ LDS Church Membership Records 1952-1962 (Excellent residence proof)
5. ✓ High School Transcript (Additional residence proof)

**Workflow Status:**
- Stage: 5/5 - Review stage (READY FOR SUBMISSION)
- Completion: 95%
- Form PDF: **Generated 2 days ago** (tests download tracking)

**Use This For Testing:**
- Multiple cancer scenarios
- PDF generation completion
- Final review workflows
- Refund policy edge cases (PDF downloaded = no refund)
- LDS records integration

---

### 📦 Test Packet 4: Early Stage User (Arizona)

**Persona:** James Chen
**Email:** `test.earlystage.arizona@radiantclaims.test`
**Password:** `TestPassword123!`

**Scenario:**
- **Just started** - only completed eligibility check
- Minimal documentation uploaded
- **Perfect for testing onboarding flows and early abandonment**

**Claim Details:**
- **Claim Type:** DOWNWINDER
- **Cancer:** Pancreatic Cancer
- **Exposure Location:** Flagstaff, Coconino County, AZ
- **Exposure Period:** 1955-1962 (born during exposure)

**Documents Uploaded:**
1. ✓ Social Security Card (only document so far)

**Workflow Status:**
- Stage: 1/5 - Eligibility assessment complete
- Completion: 15%
- Form PDF: Not generated

**Use This For Testing:**
- New user onboarding
- Document upload prompts
- Progress nudges/emails
- Abandonment recovery
- Initial guidance systems

---

### 📦 Test Packet 5: Grandparent Filing (New Mexico)

**Persona:** Emily Rodriguez (filing for deceased grandmother Maria)
**Email:** `test.grandchild.newmexico@radiantclaims.test`
**Password:** `TestPassword123!`

**Scenario:**
- **Second-generation filing** (grandchild for grandparent)
- Requires **chain of custody documentation** (2 birth certificates)
- Tests complex family tree validation
- Los Alamos location (Manhattan Project connection)

**Claim Details:**
- **Claim Type:** DOWNWINDER
- **Relationship:** Granddaughter filing for deceased grandmother
- **Deceased:** Maria Lopez (DOB: 3/22/1940, DOD: 11/5/2015)
- **Cancer:** Kidney Cancer (Renal cell, Stage III)
- **Diagnosis Date:** August 15, 2012
- **Exposure Location:** Los Alamos, Los Alamos County, NM
- **Exposure Period:** 1951-1962

**Documents Uploaded:**
1. ✓ Death Certificate (Maria Lopez)
2. ✓ Birth Certificate (Emily Rodriguez - proves she's Carmen's daughter)
3. ✓ Birth Certificate (Carmen Lopez - proves she's Maria's daughter)
4. ✓ Kidney Cancer Diagnosis 2012
5. ✓ IRS 1040 Tax Return 1960 (Historical residence proof)

**Workflow Status:**
- Stage: 2/5 - Form filling in progress
- Completion: 40%
- Form PDF: Not generated

**Use This For Testing:**
- Multi-generation claims
- Family tree validation
- Historical document processing (1960s tax returns)
- Los Alamos special case handling
- Complex beneficiary hierarchies

---

## Testing Workflows by Packet

### Document Upload & Verification
- **Use Packet 1 (Mary)** - Clean, straightforward uploads
- **Use Packet 5 (Emily)** - Complex document relationships

### Family Relationship Logic
- **Use Packet 2 (Robert)** - Parent-child relationship
- **Use Packet 5 (Emily)** - Grandparent-grandchild chain

### Progress Tracking
- **Use Packet 4 (James)** - Early stage (15%)
- **Use Packet 2 (Robert)** - Mid-stage (60%)
- **Use Packet 3 (Patricia)** - Near complete (95%)

### PDF Generation & Downloads
- **Use Packet 3 (Patricia)** - PDF already generated
- **Use Packets 1, 2, 4, 5** - PDF not yet generated

### Refund Policy Testing
- **Use Packet 3 (Patricia)** - PDF generated (refund NOT allowed)
- **Use Packets 1, 2, 4, 5** - No PDF (refund OK within 7 days)

### Geographic Coverage
- UT (Packet 1) - St. George downwinder epicenter
- NV (Packet 2) - Nevada Test Site proximity
- ID (Packet 3) - Idaho National Laboratory area
- AZ (Packet 4) - Arizona expanded coverage
- NM (Packet 5) - Los Alamos Manhattan Project

### Cancer Types
- Thyroid (Packets 1, 3)
- Lung (Packet 2)
- Kidney (Packets 3, 5)
- Pancreatic (Packet 4)

---

## Database Cleanup

To remove test packets and start fresh:

```sql
-- WARNING: This deletes all test data
DELETE FROM "User" WHERE email LIKE '%@radiantclaims.test';

-- Or use a safer targeted delete
DELETE FROM "User" WHERE email IN (
  'test.downwinder.utah@radiantclaims.test',
  'test.survivor.nevada@radiantclaims.test',
  'test.complex.idaho@radiantclaims.test',
  'test.earlystage.arizona@radiantclaims.test',
  'test.grandchild.newmexico@radiantclaims.test'
);
```

**Note:** Cascade deletes will automatically remove associated claimants, intake sessions, documents, and subscriptions.

---

## Simulated Document Structure

All documents have realistic OCR metadata including:

- **Identity Docs:** Name, DOB, address, issue/expiration dates
- **Medical Records:** Patient name, diagnosis, ICD-10 codes, physician, facility
- **Residence Proof:** Addresses, service dates, account holders
- **Family Docs:** Names, relationships, dates, locations

**No actual PDF files are created** - only database records with extracted metadata. This allows testing the entire workflow without storing large files.

---

## Using Test Packets in Development

### Login to Test Accounts
```bash
# All test passwords are: TestPassword123!

# Login URLs
http://localhost:3000/login
```

### API Testing
```bash
# Get claimant data
curl http://localhost:3000/api/claimants/[claimant-id]

# Get intake session
curl http://localhost:3000/api/intake/sessions/[session-id]

# Get documents
curl http://localhost:3000/api/documents?sessionId=[session-id]
```

### Admin Views
Test packets are visible in:
- `/admin/claims` - All claims dashboard
- `/admin/users` - User management
- `/admin/ai-review` - Document validation queue

---

## Notes

1. **Email Verification:** All test accounts are pre-verified (no email confirmation needed)
2. **Stripe Integration:** Uses test Stripe customer/subscription IDs (prefix: `cus_test_`, `sub_test_`)
3. **File Storage:** Document metadata exists but no actual files in R2/S3 (fileKey points to test paths)
4. **OCR Data:** All OCR text and confidence scores are simulated but realistic
5. **Timestamps:** Documents have random upload dates within last 30 days

---

## Extending Test Packets

To add new test scenarios, edit `seed-test-packets.ts` and add entries to the `testPackets` array:

```typescript
{
  user: {
    email: 'test.newscenario@radiantclaims.test',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'CUSTOMER',
  },
  claimant: { /* claimant data */ },
  intakeSession: { /* workflow stage data */ },
  documents: [ /* document metadata */ ],
}
```

Then re-run the seed script to generate the new packet.

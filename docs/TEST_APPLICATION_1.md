# Test Application #1: Document Requirements System

**Date**: December 9, 2024
**Purpose**: Test document requirements analysis and aggregation
**Scenario**: Child filing for deceased mother (complex case)
**Tester**: Beta Testing Team

---

## Test Scenario Details

### Family Structure
- **Claimant (Deceased)**: Mary Jane Smith
  - DOB: 01/15/1945
  - DOD: 03/20/2020
  - Cause of Death: Lung Cancer
  - Residence: St. George, Utah (downwinder area)

- **Filer**: John Robert Smith (Son)
  - DOB: 06/10/1968
  - Relationship: Child of claimant

- **Siblings**:
  1. Sarah Elizabeth Johnson (Sister)
     - DOB: 04/22/1966
     - Status: Living
     - Had name change: YES (marriage)
     - Previous name: Sarah Elizabeth Smith

  2. Michael David Smith (Brother)
     - DOB: 08/15/1970
     - Status: Deceased
     - DOD: 12/05/2015

  3. Jennifer Marie Williams (Sister)
     - DOB: 11/30/1972
     - Status: Living
     - Had name change: YES (marriage)
     - Previous name: Jennifer Marie Smith

### Expected Document Requirements

Based on this scenario, the system should identify these required documents:

#### Claimant Vital Records (4 documents)
1. ✅ Mary Jane Smith's birth certificate
2. ✅ Mary Jane Smith's death certificate
3. ✅ Mary Jane Smith's medical records (cancer diagnosis)
4. ✅ Mary Jane Smith's marriage certificate

#### Filer Identity (2 documents)
5. ✅ John Robert Smith's birth certificate (to prove parent-child relationship)
6. ✅ John Robert Smith's government-issued ID

#### Sibling Records (4 documents)
7. ✅ Michael David Smith's death certificate (deceased sibling)
8. ✅ Sarah Elizabeth Johnson's marriage certificate (name change)
9. ✅ Jennifer Marie Williams's marriage certificate (name change)
10. ✅ Proof that Sarah and Jennifer are siblings (covered by birth certificates)

#### Exposure Proof (1 document)
11. ✅ Proof of Mary's presence in St. George, Utah during exposure period

#### Medical Proof (1 document)
12. ✅ Medical records proving lung cancer diagnosis

**Total Expected Required Documents**: 12

---

## Test Steps

### Step 1: Navigate to Application Start
1. Open browser to `http://localhost:3000`
2. Navigate to RECA application start page
3. Click "Start New Application"

**Expected**: Redirected to Part 1 (Filer Information)

---

### Step 2: Complete Part 1 - Filer Information
**Form Data**:
- Filing for self: NO
- First Name: John
- Middle Name: Robert
- Last Name: Smith
- SSN: 123-45-6789
- DOB: 06/10/1968
- Address: 123 Main Street, Salt Lake City, UT 84101
- Phone: (801) 555-1234
- Email: john.smith@example.com

**Expected**: No document requirements shown yet (filer ID will be required later)

**Click**: Continue to Part 2

---

### Step 3: Complete Part 2 - Claimant Information
**Form Data**:
- First Name: Mary
- Middle Name: Jane
- Last Name: Smith
- SSN: 987-65-4321
- DOB: 01/15/1945
- DOD: 03/20/2020 (IMPORTANT: Mark as deceased)
- Address: 456 Oak Street, St. George, UT 84770

**Document Requirements Indicator Should Show**:
- ⚠️ Claimant's birth certificate required
- ⚠️ Claimant's death certificate required
- ℹ️ Medical records recommended (if death certificate shows cancer)

**Test**: Check that inline document requirements component appears
**Test**: Verify correct number of requirements shown

**Click**: Continue to Part 3

---

### Step 4: Complete Part 3 - Relationship
**Form Data**:
- Relationship to claimant: Child

**Document Requirements Should Update**:
- ⚠️ Your birth certificate required (to prove relationship)
- ⚠️ Your government-issued ID required

**Click**: Continue to Part 4

---

### Step 5: Skip Part 4 - Grandparents (N/A)
**Click**: Continue to Part 5

---

### Step 6: Complete Part 5 - Spouse Information
**Form Data**:
- Claimant ever married: YES
- Current marital status: Widowed (spouse deceased)
- Spouse information:
  - Name: Thomas William Smith
  - Marriage date: 06/15/1964
  - Marriage ended: Death
  - Date ended: 11/20/2018

**Document Requirements Should Update**:
- ⚠️ Marriage certificate required (Mary to Thomas)
- ⚠️ Death certificate for Thomas Smith (if marked as deceased)

**Click**: Continue to Part 6

---

### Step 7: Complete Part 6 - Siblings
**Form Data**:
- Number of siblings: 3

**Sibling 1**: Sarah Elizabeth Johnson
- Name: Sarah Elizabeth Johnson
- DOB: 04/22/1966
- Is deceased: NO
- Had name change: YES
- Previous name: Sarah Elizabeth Smith
- Reason: Marriage
- Name change date: 07/15/1989

**Sibling 2**: Michael David Smith
- Name: Michael David Smith
- DOB: 08/15/1970
- Is deceased: YES
- DOD: 12/05/2015
- Has death certificate: YES

**Sibling 3**: Jennifer Marie Williams
- Name: Jennifer Marie Williams
- DOB: 11/30/1972
- Is deceased: NO
- Had name change: YES
- Previous name: Jennifer Marie Smith
- Reason: Marriage
- Name change date: 08/20/1995

**Document Requirements Should Update** (This is critical!):
- ⚠️ Death certificate for Michael David Smith
- ⚠️ Marriage certificate for Sarah Elizabeth Johnson (name change)
- ⚠️ Marriage certificate for Jennifer Marie Williams (name change)

**Test**: Verify inline document requirements shows all 3 sibling documents
**Test**: Check that document count is accurate

**Click**: Continue to Part 7

---

### Step 8: Skip Parts 7-10 (Employment, Mining, Exposure Details)
**Note**: For this test, we'll skip these sections to focus on document requirements

**Click**: Continue through Parts 7-10

---

### Step 9: Complete Part 11 - Disease Information
**Form Data**:
- Disease type: Lung Cancer
- Diagnosis date: 01/15/2019
- Diagnosing physician: Dr. Robert Johnson
- Hospital: Dixie Regional Medical Center
- Has medical records: YES

**Document Requirements Should Update**:
- ⚠️ Medical records proving lung cancer diagnosis

**Click**: Continue to Documents Section

---

### Step 10: Review Document Dashboard
**Expected URL**: `/reca/documents/[sessionId]`

#### Test Document Requirements Tab

**Expected to see**:
1. Overall progress card showing:
   - Required documents: 12 (or similar based on form data)
   - Uploaded: 0
   - Missing: 12
   - Upload progress: 0%

2. Requirements organized by category:
   - **Claimant Vital Records** (4 items)
     - Mary's birth certificate [REQUIRED]
     - Mary's death certificate [REQUIRED]
     - Mary's marriage certificate [REQUIRED]
     - Mary's medical records [RECOMMENDED]

   - **Filer Identity** (2 items)
     - John's birth certificate [REQUIRED]
     - John's government ID [REQUIRED]

   - **Sibling Vital Records** (3 items)
     - Michael's death certificate [REQUIRED]
     - Sarah's marriage certificate [REQUIRED]
     - Jennifer's marriage certificate [REQUIRED]

   - **Medical Proof** (1 item)
     - Medical records for lung cancer [REQUIRED]

   - **Exposure Proof** (1 item)
     - Proof of presence in St. George [REQUIRED]

3. Each requirement should show:
   - ✅ Title and description
   - ✅ Priority badge (REQUIRED/RECOMMENDED)
   - ✅ Upload button
   - ✅ Context/reason why needed
   - ✅ Tips for obtaining

**Tests**:
- [ ] Count matches expected (12 required documents)
- [ ] All categories present
- [ ] Sibling name change documents shown correctly
- [ ] Deceased sibling death certificate shown
- [ ] Medical records recommended (cancer cause)
- [ ] No duplicate requirements

---

### Step 11: Test Document Upload Flow

#### Upload Test 1: Claimant Birth Certificate
1. Click "Upload Document" on "Mary's Birth Certificate"
2. System should switch to "Uploads" tab
3. Upload a test PDF file (any PDF for testing)
4. Categorize as: BIRTH_CERTIFICATE
5. Return to Requirements tab

**Expected**:
- ✅ Requirement shows as uploaded (green checkmark)
- ✅ Upload count increases to 1
- ✅ Progress bar updates to 8% (1/12)

#### Upload Test 2: Multiple Documents
Upload the following in sequence:
1. Mary's death certificate → DEATH_CERTIFICATE
2. John's birth certificate → BIRTH_CERTIFICATE
3. John's ID → IDENTITY
4. Michael's death certificate → DEATH_CERTIFICATE
5. Sarah's marriage certificate → MARRIAGE_CERTIFICATE

**After each upload, verify**:
- ✅ Corresponding requirement shows as uploaded
- ✅ Upload count increases
- ✅ Progress percentage increases
- ✅ Document appears in Uploads tab

---

### Step 12: Test Document Aggregation

#### Test Cross-Category Recognition
1. Upload a BIRTH_CERTIFICATE
2. Check that BOTH:
   - Mary's birth certificate requirement shows uploaded
   - John's birth certificate requirement shows uploaded

**This tests that FileCategory mapping works correctly**

**Expected**: Multiple requirements with same FileCategory should all show as uploaded (this is a known issue we fixed)

---

### Step 13: Test Warnings and Alerts

#### Test Scenario: Missing Death Certificate
1. In Part 6, edit sibling Michael
2. Change "Has death certificate" to "WILL_OBTAIN"
3. Save and navigate to Documents

**Expected**:
- ⚠️ Warning banner appears: "Death certificate for Michael David Smith marked as 'will obtain' - must be submitted before final approval"

#### Test Scenario: No Death Certificate Available
1. Change to "NO" (unavailable)
2. Navigate to Documents

**Expected**:
- ⚠️ Warning banner: "Death certificate for Michael David Smith unavailable - claim may require additional documentation or affidavits"

---

### Step 14: Test Continue Flow

#### Test: Missing Required Documents
- With missing documents, click "Continue" button

**Expected**:
- Button text: "Continue Anyway"
- Shows count: "X required documents remaining"
- Clicking allows progression with warning

#### Test: All Required Documents Uploaded
- Upload all 12 required documents
- Check Continue button

**Expected**:
- Button text: "Continue to Review"
- Button style: Primary (green/highlighted)
- No warning shown

---

### Step 15: Test Document Management Features

From the Uploads tab, test:

1. **View Document**:
   - Click on a document
   - Should open preview/detail view

2. **Recategorize Document**:
   - Change category of a document
   - Verify requirement list updates

3. **Delete Document**:
   - Delete a document
   - Verify requirement shows as not uploaded
   - Verify progress decreases

4. **Search/Filter**:
   - Test search by filename
   - Test filter by category
   - Test filter by validation status

---

## Test Results Checklist

### Core Functionality
- [ ] Document requirements generated based on form data
- [ ] All expected requirements present
- [ ] No unexpected/duplicate requirements
- [ ] Inline indicators shown during form completion
- [ ] Document dashboard accessible after forms

### Document Detection
- [ ] Birth certificates detected correctly
- [ ] Death certificates detected correctly
- [ ] Marriage certificates detected correctly
- [ ] Medical records detected correctly
- [ ] Identity documents detected correctly

### Sibling Handling
- [ ] Deceased sibling triggers death certificate requirement
- [ ] Name change due to marriage triggers marriage certificate
- [ ] Multiple siblings with name changes handled correctly
- [ ] Sibling requirements show correct names and context

### FileCategory Mapping
- [ ] Uploaded BIRTH_CERTIFICATE matches birth cert requirements
- [ ] Uploaded DEATH_CERTIFICATE matches death cert requirements
- [ ] Uploaded MARRIAGE_CERTIFICATE matches marriage cert requirements
- [ ] Uploaded MEDICAL_RECORDS matches medical requirements
- [ ] Uploaded IDENTITY matches ID requirements

### Progress Tracking
- [ ] Upload count accurate
- [ ] Progress percentage correct
- [ ] Validation progress shown
- [ ] Stats grid displays correctly

### Warnings
- [ ] "Will obtain" warning shown
- [ ] "Unavailable" warning shown
- [ ] Cancer cause triggers medical records recommendation
- [ ] Warnings clear and actionable

### Navigation
- [ ] Back to forms works
- [ ] Continue to review works
- [ ] Tab switching works
- [ ] Upload flow intuitive

### UI/UX
- [ ] Categories displayed clearly
- [ ] Priority badges visible
- [ ] Tips helpful and relevant
- [ ] Mobile responsive (if testing mobile)
- [ ] Loading states appropriate

---

## Known Issues to Watch For

1. **FileCategory Mapping Issue** (Should be fixed):
   - Old behavior: Documents didn't show as uploaded
   - Expected: Documents correctly show as uploaded via FileCategory matching

2. **Multiple Birth Certificates**:
   - Scenario: Mary's birth cert and John's birth cert
   - Watch for: Does uploading one mark both as uploaded?
   - Expected: Yes, since they share FileCategory (this may need refinement)

3. **Marriage Certificate Overload**:
   - Scenario: 3 marriage certificates needed (Sarah, Jennifer, Mary)
   - Watch for: Does uploading one mark all as uploaded?
   - Expected: Yes (this is a limitation we may need to address)

---

## Bug Report Template

If issues found, document as follows:

### Bug #X: [Short Description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots**: (if applicable)

**Browser/Device**:

**Notes**:

---

## Success Criteria

This test is considered successful if:

1. ✅ All 12 expected document requirements are detected
2. ✅ Document upload flow works without errors
3. ✅ Uploaded documents correctly show as "uploaded" in requirements
4. ✅ Progress tracking is accurate
5. ✅ Sibling name change and death certificate logic works
6. ✅ No duplicate or spurious requirements
7. ✅ Warnings appear for "will obtain" and "unavailable" cases
8. ✅ Navigation and UI are intuitive
9. ✅ No console errors or crashes
10. ✅ FileCategory mapping successfully matches uploaded files to requirements

---

## Next Steps After Test

Based on results:
- Document all bugs found
- Prioritize fixes (critical vs. nice-to-have)
- Refine document mapping if needed
- Adjust UI/UX based on usability findings
- Proceed to Test Application #2 (different scenario)

---

## Notes Section

_Use this space to document observations, unexpected behavior, or ideas for improvement_

---

**Test Completed**: ___/___/_____
**Tester Signature**: _________________
**Result**: ☐ Pass ☐ Fail ☐ Pass with Issues

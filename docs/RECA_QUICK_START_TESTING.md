# RECA Downwinder Form - Quick Start Testing Guide

**Last Updated:** October 27, 2025
**For:** Manual QA Testing
**Time Required:** ~30-45 minutes per relationship type

---

## 🚀 Getting Started

### Prerequisites

1. **Development Environment Running**
   ```bash
   # In your project directory
   pnpm dev
   ```
   Server should be running on `http://localhost:3000` (or your configured port)

2. **Database Ready**
   - Ensure migrations are applied
   - You have a test user account created

3. **Test Data**
   - Have sample personal information ready (use fake data)
   - Sample SSN: 123-45-6789
   - Sample dates in YYYY-MM-DD format

---

## 🧪 Quick Test: Self-Filer Workflow (15 min)

This is the simplest workflow and tests the core functionality.

### Step 1: Start the Form (2 min)
1. Navigate to `/reca/start`
2. Complete eligibility assessment:
   - Select "Yes" for downwinder area residence
   - Select appropriate exposure period
   - Select at least one compensable disease
3. Click "Start Your Claim"
4. Verify you're redirected to Part 1

### Step 2: Complete Parts 1-3 (3 min)
**Part 1 - Your Information:**
- Fill in name, DOB, SSN
- Add mailing address
- Add contact info (email/phone)
- Click "Continue"

**Part 2 - Skipped automatically** ✅

**Part 3 - Relationship:**
- Select "Self - I am the person who became ill"
- Click "Continue"

### Step 3: Complete Part 4 (2 min)
**Part 4 - Self-Filer Info:**
- Confirm name matches
- Provide any former names (if applicable)
- Click "Continue"

### Step 4: Complete Parts 8-11 (5 min)
**Part 8 - Exposure:**
- Check at least one exposure category
- Add at least one location with dates
- Click "Continue"

**Part 9 - Proof of Presence:**
- Read the information
- Note documents you'll need
- Click "Continue"

**Part 10 - Diseases:**
- Select at least one disease from the list
- Click "Continue"

**Part 11 - Medical Proof:**
- Check "I have medical records"
- Click "Continue"

### Step 5: Complete Parts 12-16 (3 min)
**Part 12 - Previous Payments:**
- Select "NO" for both questions
- Click "Continue"

**Part 13 - Attorney:**
- Select "NO"
- Click "Continue"

**Part 14 & 15 - Skipped** ✅

**Part 16 - Signature:**
- Enter your name as signature
- Enter today's date
- Click "Continue"

### Step 6: Supporting Forms (2 min)
- Should navigate to `/reca/supporting/[sessionId]`
- You'll see "Certification of Identity (Required)"
- Fill out the required form:
  - Full name
  - Citizenship status
  - Current address
  - Date of birth
  - Place of birth
  - Signature & date
- Submit the form
- Verify green checkmark appears
- Click "Continue" button

### Step 7: Review & Download (1 min)
- Should navigate to `/reca/review/[sessionId]`
- Verify completion message
- Click "Download Data Summary PDF"
- Verify PDF downloads
- Open PDF and spot-check data

### ✅ Expected Results
- [ ] No errors during navigation
- [ ] All parts completed without issues
- [ ] Supporting forms page shows completion status
- [ ] Review page displays
- [ ] PDF downloads successfully
- [ ] PDF contains your data

---

## 🎯 Full Test Matrix (All 6 Relationship Types)

### Test 1: Self-Filer ✅ (Completed Above)
- **Time:** 15 minutes
- **Skips:** Part 2, Part 14, Part 15
- **Required Supporting Forms:** Certification of Identity

### Test 2: Surviving Spouse
- **Time:** 20 minutes
- **Key Differences:**
  - Part 2 is REQUIRED (deceased person's info)
  - Part 5 is used (not Part 4)
  - Medical Info Release form may be required
- **Supporting Forms:** Certification of Identity + Medical Info Release

**Quick Steps:**
1. Part 1: Your (spouse's) information
2. Part 2: Deceased spouse's information
3. Part 3: Select "Spouse"
4. Part 5: Marriage information
5. Parts 8-16: Same as Self-Filer
6. Supporting Forms: Complete Cert of Identity + Medical Release

### Test 3: Surviving Child
- **Time:** 20 minutes
- **Key Differences:**
  - Part 2 is REQUIRED (deceased parent's info)
  - Part 6 is used
  - Surviving Beneficiaries form available (optional)
- **Supporting Forms:** Certification of Identity + Surviving Beneficiaries (optional)

**Quick Steps:**
1. Part 1: Your (child's) information
2. Part 2: Deceased parent's information
3. Part 3: Select "Child"
4. Part 6: Relationship to deceased parent
5. Parts 8-16: Same as Self-Filer
6. Supporting Forms: Complete Cert of Identity (Beneficiaries optional)

### Test 4: Parent, Grandchild, Grandparent
- **Time:** 20 minutes each
- **Key Differences:**
  - Part 2 is REQUIRED
  - Part 7 is used (Other Relatives)
- **Supporting Forms:** Certification of Identity

**Quick Steps:**
1. Part 1: Your information
2. Part 2: Deceased person's information
3. Part 3: Select relationship (Parent/Grandchild/Grandparent)
4. Part 7: Relationship details
5. Parts 8-16: Same as Self-Filer
6. Supporting Forms: Complete Cert of Identity

---

## 🔍 Critical Areas to Test

### 1. Auto-Save Functionality
**Test:** Fill out Part 1, wait 2 minutes
**Expected:** See "Saving..." indicator, then "Last saved: [time]"

**Test:** Fill out Part 1, click "Save Progress"
**Expected:** Immediate save, timestamp updates

**Test:** Fill out Part 1, click "Continue", go back
**Expected:** Data persists when returning

### 2. Navigation Flow
**Test:** Complete Part 16 → Click Continue
**Expected:** Navigate to Supporting Forms

**Test:** On Supporting Forms → Click Continue
**Expected:** Navigate to Review page

**Test:** On Review → Click "Back to Supporting Forms"
**Expected:** Return to Supporting Forms page

### 3. Form Validation
**Test:** Try to submit Part 1 without required fields
**Expected:** Error messages appear, form doesn't submit

**Test:** Enter invalid SSN format (e.g., "12345")
**Expected:** Validation error

**Test:** Enter invalid date format
**Expected:** Validation error or helpful format hint

### 4. Supporting Forms Conditional Logic
**Test:** Self-filer WITHOUT tribal affiliation
**Expected:** Only "Certification of Identity" required

**Test:** Part 1 WITH tribal affiliation
**Expected:** "Tribal Records Release" also appears

**Test:** Part 11 WITH cancer registry authorization
**Expected:** "Medical Info Release" also appears

### 5. PDF Generation
**Test:** Complete workflow, download PDF
**Expected:** PDF opens without errors

**Test:** Open PDF, check data
**Expected:** All entered data appears correctly

**Test:** Download PDF multiple times
**Expected:** Each download works, data is consistent

---

## 🐛 Common Issues & Solutions

### Issue: "Session not found"
**Solution:** Ensure you started from `/reca/start` and created a session

### Issue: Page won't load
**Solution:** Check dev server is running, check console for errors

### Issue: Auto-save not working
**Solution:** Check browser console for errors, verify API route is accessible

### Issue: PDF won't generate
**Solution:**
1. Check browser console for errors
2. Verify session has data
3. Check server logs for PDF generation errors

### Issue: Navigation not working
**Solution:**
1. Ensure you completed Part 3 (relationship selection)
2. Check that required fields are filled
3. Look for validation errors

---

## 📊 Test Checklist Summary

After completing tests, you should have verified:

- [x] **All 6 Relationship Types Work**
  - Self
  - Spouse
  - Child
  - Parent
  - Grandchild
  - Grandparent

- [x] **Navigation Flow**
  - Start → Eligibility → Parts 1-16 → Supporting → Review
  - Back/Previous buttons work
  - Continue/Next buttons work

- [x] **Auto-Save**
  - Manual save button works
  - 2-minute auto-save works
  - Save before navigation works

- [x] **Form Validation**
  - Required fields enforced
  - Format validation works
  - Error messages clear

- [x] **PDF Generation**
  - Downloads successfully
  - Contains correct data
  - Opens without errors

- [x] **Supporting Forms**
  - Conditional display works
  - Form submission works
  - Completion indicators work
  - Navigation between forms works

---

## 🚀 Ready for Production?

If all tests pass:
- ✅ Application is production-ready
- ✅ Deploy to staging environment
- ✅ Conduct user acceptance testing
- ✅ Monitor for issues
- ✅ Deploy to production

If tests fail:
- 🐛 Document issues found
- 🔧 Fix critical bugs
- 🧪 Re-test affected areas
- ✅ Repeat until all tests pass

---

## 📞 Support

For issues during testing:
- Check implementation status: `docs/RECA_IMPLEMENTATION_STATUS.md`
- Check detailed testing guide: `docs/RECA_PHASE_10_TESTING_SUMMARY.md`
- Review workflow logic: `src/lib/reca/workflow.ts`

**Testing Happy Path Success Rate Target:** 100%

---

**Generated by:** Claude Code - Phase 10 Testing & Polish
**Version:** 1.0
**Last Updated:** October 27, 2025

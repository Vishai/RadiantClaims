# Quick Testing Checklist - Steps 1-3

**Print this page and check off items as you test**

---

## 🚀 10-Minute Smoke Test

### Setup
- [ ] Dev server running at http://localhost:3000
- [ ] Browser console open (F12)
- [ ] TEST_APPLICATION_1.md open for reference

### Application Access
- [ ] Navigate to http://localhost:3000/reca/intake
- [ ] Page loads without errors
- [ ] No console errors visible

### Fill Minimum Test Data

**Part 1 - Your Info**:
- [ ] First Name: Test
- [ ] Last Name: User
- [ ] Email: test@example.com
- [ ] Filing for self: NO
- [ ] Click Continue

**Part 2 - Claimant**:
- [ ] First Name: Jane
- [ ] Last Name: Doe
- [ ] DOB: 01/01/1950
- [ ] **DOD: 01/01/2020** ← Check deceased
- [ ] SSN: 123-45-6789
- [ ] Click Continue

**Part 3 - Relationship**:
- [ ] Select: Child
- [ ] Click Continue

**Part 4-5**:
- [ ] Skip (click Continue through these)

**Part 6 - Siblings**:
- [ ] Click "Add Sibling"
- [ ] Name: John Doe
- [ ] DOB: 01/01/1955
- [ ] Is deceased: YES
- [ ] DOD: 01/01/2018
- [ ] Click Save

**Navigate to Documents**:
- [ ] Find navigation to documents page
- [ ] Documents page loads

### Document Requirements Check

**Expected Requirements** (~5-6 total):
- [ ] ✓ Jane Doe's birth certificate
- [ ] ✓ Jane Doe's death certificate
- [ ] ✓ Your birth certificate
- [ ] ✓ Your government ID
- [ ] ✓ John Doe's death certificate

**Verify UI Elements**:
- [ ] Progress card shows correct count
- [ ] Requirements organized by category
- [ ] Each requirement shows priority badge
- [ ] Upload buttons visible
- [ ] No duplicate requirements

### Upload Test (CRITICAL!)

**Create Test PDF**:
```bash
echo "Test Document" > ~/Desktop/test.pdf
```

**Upload Flow**:
- [ ] Click "Upload Document" on birth certificate
- [ ] Switches to Uploads tab
- [ ] Drag/drop or select ~/Desktop/test.pdf
- [ ] Categorize as: BIRTH_CERTIFICATE
- [ ] Upload completes without errors

**Verify Mapping** (🚨 MOST IMPORTANT):
- [ ] Return to Requirements tab
- [ ] Birth certificate requirement shows ✓ or "uploaded"
- [ ] **If NOT showing as uploaded → FileCategory mapping is BROKEN**

**Progress Tracking**:
- [ ] Upload count shows "1 of X"
- [ ] Progress bar increases
- [ ] Percentage shown correctly
- [ ] Stats grid updated

---

## ✅ Pass Criteria

**PASS** if all checked:
- [ ] Can complete test application
- [ ] All 5-6 expected requirements shown
- [ ] Upload works without errors
- [ ] **Uploaded file shows as "uploaded" in requirements**
- [ ] Progress tracking accurate
- [ ] No console errors

**Result**: ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

---

## 🐛 Issues Found

Quick notes on any issues:

1. _______________________________________________
   Severity: ☐ Critical ☐ High ☐ Medium ☐ Low

2. _______________________________________________
   Severity: ☐ Critical ☐ High ☐ Medium ☐ Low

3. _______________________________________________
   Severity: ☐ Critical ☐ High ☐ Medium ☐ Low

---

## 📊 Decision

- [ ] ✅ All tests pass → Proceed to Step 4
- [ ] 🛑 Critical issues found → Fix before Step 4
- [ ] ⚠️ Minor issues found → Document and proceed

**Tester**: ________________
**Date**: ________________
**Time**: ________________

---

## 🔗 Quick Links

- Full Test Plan: `docs/TEST_APPLICATION_1.md`
- Bug Tracker: `docs/BUGS_FOUND.md`
- Quick Start: `docs/TESTING_QUICK_START.md`
- Roadmap: `docs/BETA_LAUNCH_ROADMAP.md`

---

## 🆘 If Something Breaks

**Dev server frozen?**
```bash
lsof -ti:3000 | xargs kill -9
pnpm run dev
```

**Need to check console errors?**
- Press F12 → Console tab
- Look for red error messages
- Copy full error text for bug report

**Upload not working?**
- Check network tab (F12 → Network)
- Look for failed requests (red)
- Check request payload and response

**Database issue?**
```bash
pnpm prisma studio
# Check IntakeSession and UploadedFile tables
```

---

**Good luck with testing! 🎉**

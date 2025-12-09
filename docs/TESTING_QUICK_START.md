# Testing Quick Start Guide

**Purpose**: Quick reference for testing the document requirements system
**Status**: Ready for beta testing
**Last Updated**: December 9, 2024

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- [ ] Dev server running (`pnpm run dev`)
- [ ] Database accessible
- [ ] Browser open to `http://localhost:3000`

### Fastest Path to Test Documents Feature

1. **Navigate**: Go to `/reca/intake` (RECA application start)

2. **Fill Minimum Required Data**:
   - Part 1: Your name, email
   - Part 2: Claimant name, **DOB**, **DOD** (mark deceased!)
   - Part 3: Relationship = "Child"
   - Part 6: Add 1 sibling, mark as deceased

3. **Check Documents Page**: Navigate to `/reca/documents/[sessionId]`

4. **Verify**:
   - Requirements tab shows: birth certs, death certs, ID
   - Can upload documents
   - Progress bar updates
   - Documents show as "uploaded" after upload

---

## 📋 Test Scenarios

### Scenario 1: Basic Child Claim (10 min)
- **File**: `TEST_APPLICATION_1.md`
- **Complexity**: High
- **Focus**: Siblings with name changes, deceased sibling
- **Expected Requirements**: 12 documents

### Scenario 2: Spouse Claim (Coming)
- **File**: `TEST_APPLICATION_2.md`
- **Complexity**: Medium
- **Focus**: Marriage certificates, previous spouses
- **Expected Requirements**: 8 documents

### Scenario 3: Self-Filing (Coming)
- **File**: `TEST_APPLICATION_3.md`
- **Complexity**: Low
- **Focus**: Living claimant, minimal docs
- **Expected Requirements**: 4 documents

---

## 🔍 What to Look For

### Critical Tests
1. **Document Detection**:
   - Are all expected documents listed?
   - Are unexpected documents listed?
   - Do sibling name changes trigger marriage certs?
   - Does deceased claimant trigger death cert?

2. **FileCategory Mapping** (This is the key fix!):
   - Upload a BIRTH_CERTIFICATE
   - Check: Does birth cert requirement show "uploaded"?
   - **Before fix**: Would stay "not uploaded"
   - **After fix**: Should show "uploaded" with green check

3. **Progress Tracking**:
   - Does upload count increase?
   - Does progress bar update?
   - Are percentages accurate?

4. **Sibling Logic**:
   - Deceased sibling → death cert required?
   - Name change (marriage) → marriage cert required?
   - Multiple siblings handled correctly?

### Nice-to-Have Tests
- Warnings for "will obtain" documents
- Inline indicators during form filling
- Tab switching in document dashboard
- Mobile responsiveness
- Search/filter in uploads tab

---

## 🐛 Common Issues to Watch

### Issue #1: Documents Don't Show as Uploaded
**Symptom**: Upload document, requirement still shows red X
**Cause**: FileCategory mapping not working
**Status**: Should be fixed (Step 2 of roadmap)

### Issue #2: Too Many Requirements
**Symptom**: 20+ requirements shown when expecting 12
**Cause**: Duplicate detection logic
**Fix**: Review `analyzeDocumentRequirements()` function

### Issue #3: Missing Sibling Documents
**Symptom**: Added 3 siblings but only 1 marriage cert shown
**Cause**: Loop not processing all siblings
**Fix**: Check `part_6.siblings.forEach()` logic

### Issue #4: Wrong Category Names
**Symptom**: Category shows "OTHER" instead of specific name
**Cause**: `getCategoryDisplayName()` mapping incomplete
**Fix**: Add missing category names

---

## ✅ Quick Validation Checklist

Run through this in 10 minutes:

- [ ] Start application at `/reca/intake`
- [ ] Fill claimant as deceased
- [ ] Add relationship as "Child"
- [ ] Add 1 sibling, mark deceased
- [ ] Navigate to documents page
- [ ] **Count requirements** (should be ~6-8)
- [ ] Upload 1 BIRTH_CERTIFICATE
- [ ] **Verify it shows as uploaded**
- [ ] Upload 1 DEATH_CERTIFICATE
- [ ] **Verify progress bar increases**
- [ ] Check no console errors
- [ ] ✅ If all pass → Document system working!

---

## 📊 Expected Results by Scenario

### Child Filing for Deceased Parent
- Claimant birth cert
- Claimant death cert
- Filer birth cert (relationship proof)
- Filer ID
- Medical records (recommended)
- Exposure proof
- **Per Sibling**:
  - Death cert (if deceased)
  - Marriage cert (if name change)

### Spouse Filing
- Marriage certificate
- Claimant birth cert
- Claimant death cert (if deceased)
- Spouse ID
- Medical records
- Exposure proof
- **Per Previous Marriage**:
  - Marriage cert
  - Divorce decree or death cert

### Self-Filing (Living Claimant)
- Claimant birth cert
- Claimant ID
- Medical records
- Exposure proof

---

## 🔗 Useful URLs

**Local Development**:
- Application Start: `http://localhost:3000/reca/intake`
- Admin Dashboard: `http://localhost:3000/admin`
- Document Dashboard: `http://localhost:3000/reca/documents/[sessionId]`

**Database** (if using Railway):
```bash
DATABASE_URL="postgresql://postgres:..." pnpm prisma studio
```

---

## 📝 How to Report Bugs

Use this format:

```
**Bug**: [Short description]
**Severity**: Critical/High/Medium/Low
**Steps**:
1. Do X
2. Do Y
3. See error

**Expected**: Should show Z
**Actual**: Shows Y instead

**Screenshot**: [attach if helpful]
**Console Errors**: [paste any errors]
```

Post bugs to: [GitHub Issues / Slack Channel / etc.]

---

## 🎯 Success Criteria

Before marking beta-ready:

1. ✅ Zero critical bugs
2. ✅ Document requirements generated correctly
3. ✅ FileCategory mapping working
4. ✅ Upload flow smooth and intuitive
5. ✅ Progress tracking accurate
6. ✅ No console errors during normal flow
7. ✅ Mobile usable (not perfect, but functional)
8. ✅ All test scenarios pass
9. ✅ Documentation complete
10. ✅ Support team trained on known issues

---

## 📚 Additional Resources

- **Full Test Plan**: `docs/TEST_APPLICATION_1.md`
- **System Overview**: `docs/DOCUMENT_REQUIREMENTS_SYSTEM.md`
- **Dashboard Docs**: `docs/RECA_DOCUMENT_DASHBOARD.md`
- **Beta Assessment**: `docs/BETA_READINESS_ASSESSMENT.md`
- **Launch Roadmap**: `docs/BETA_LAUNCH_ROADMAP.md`

---

## 🚨 Emergency Rollback

If critical issue found during beta:

```bash
# Disable document requirements feature
# Option 1: Feature flag (if implemented)
DATABASE_URL="..." pnpm prisma studio
# Set feature flag to false

# Option 2: Code change
# Comment out DocumentRequirementsInline in Part2Form, Part6Form
# Comment out document dashboard route

# Option 3: Full rollback
git revert [commit-hash]
git push
railway up  # or your deployment command
```

---

**Happy Testing! 🎉**

Remember: Beta users are your friends. Their feedback is invaluable. Thank them!

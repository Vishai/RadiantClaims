# Testing Guide: Multi-Claim Autofill System

## Overview

This guide provides step-by-step instructions for testing the complete multi-claim autofill system. The system allows users to file RECA claims for multiple family members without re-entering the same information repeatedly.

---

## What to Test

### 1. Within-Claim Autofill
Fields automatically pre-fill based on previously entered data in the same claim.

### 2. Family Member Caching
Family member information is saved to browser localStorage for reuse across multiple claims.

### 3. Cross-Claim Autofill
Previously entered family members appear as quick-select options when starting new claims.

### 4. Visual Feedback
Clear indicators show which fields were auto-filled and from which source.

---

## Test Scenario 1: Self-Filer Autofill

**Purpose**: Verify that self-filers don't have to enter their information twice.

### Steps:

1. **Start New Claim**
   ```
   Navigate to: /reca/form/new
   ```

2. **Fill Part 1 (Filer Information)**
   - Select "Yes, I am filing for myself"
   - Enter your personal information:
     - First Name: John
     - Middle Name: Michael
     - Last Name: Doe
     - SSN: 123-45-6789
     - Date of Birth: 01/15/1970
     - Address, city, state, zip
     - Phone, email

3. **Navigate to Part 2**
   - Click "Next" or "Continue"

4. **Verify Autofill**
   ✅ **Expected Results**:
   - Autofill banner appears at top: "Smart Form Pre-fill Active"
   - Banner shows: "We've pre-filled 6 fields based on information you previously entered from Your Information"
   - All name fields, SSN, and DOB are pre-populated with Part 1 data
   - Fields are editable (user can still modify)

5. **Verify Family Member Cache**
   - Open browser console (F12)
   - Run: `localStorage.getItem('radiantclaims_family_cache')`
   - ✅ Should show JSON with your information saved as "self"

---

## Test Scenario 2: Filing for Multiple Family Members (Core Feature)

**Purpose**: Verify the complete multi-claim workflow - filing for both parents.

### Part A: First Claim (Mother)

1. **Start New Claim**
   ```
   Navigate to: /reca/form/new
   ```

2. **Fill Part 1 (Your Information as Filer)**
   - Select "No, I am filing for someone else"
   - Enter your information:
     - First Name: Alice
     - Last Name: Smith
     - SSN: 111-22-3333
     - DOB: 05/10/1975
     - Contact info

3. **Fill Part 3 (Relationship)**
   - Select: "Child"

4. **Fill Part 2 (Deceased Parent - Mother)**
   - ✅ **Expected**: No family member selector appears (first claim)
   - Enter mother's information:
     - First Name: Mary
     - Last Name: Doe
     - SSN: 444-55-6666
     - DOB: 03/15/1945
     - DOD: 06/20/2020

5. **Fill Part 5 (Surviving Spouse - Father)**
   - Enter father's information:
     - Spouse Name: John Doe
     - Marriage Start: 05/10/1965
     - Marriage End: 06/20/2020

6. **Complete Claim #1**
   - Fill remaining required sections
   - Submit or save the claim

7. **Verify Cache After Completion**
   ```javascript
   // In browser console:
   const cache = localStorage.getItem('radiantclaims_family_cache');
   console.log(JSON.parse(cache));
   ```

   ✅ **Expected Cache Contents**:
   ```json
   {
     "userId": "user_xxx",
     "members": [
       {
         "id": "filer_xxx",
         "relationship": "self",
         "firstName": "Alice",
         "lastName": "Smith",
         ...
       },
       {
         "id": "claimant_xxx",
         "relationship": "parent",
         "firstName": "Mary",
         "lastName": "Doe",
         "dod": "06/20/2020",
         ...
       },
       {
         "id": "spouse_xxx",
         "relationship": "spouse",
         "firstName": "John",
         "lastName": "Doe",
         ...
       }
     ],
     "lastUpdated": "2024-xx-xx..."
   }
   ```

### Part B: Second Claim (Father)

1. **Start Another New Claim**
   ```
   Navigate to: /reca/form/new
   ```

2. **Fill Part 1 (Filer Information)**
   - ✅ **Expected**: Form auto-fills with Alice's information from Claim #1
   - Autofill banner appears showing "Family Member Cache" as source
   - Just verify and continue

3. **Fill Part 3 (Relationship)**
   - Select: "Child"

4. **Navigate to Part 2 (Claimant - Father)**

   🌟 **CRITICAL TEST POINT** 🌟

   ✅ **Expected: Family Member Selector Appears**:

   ```
   ╔══════════════════════════════════════════════════════╗
   ║ ✨ Quick Fill from Previous Claims                  ║
   ║                                                      ║
   ║ We found 2 family members you've previously         ║
   ║ entered. Select one to auto-fill this claim.        ║
   ╠══════════════════════════════════════════════════════╣
   ║ [ Mary Doe ]                                         ║
   ║   Born: Mar 15, 1945                                ║
   ║   Died: Jun 20, 2020                                ║
   ║   Last used [date] • Used in 1 claim                ║
   ╠══════════════════════════════════════════════════════╣
   ║ [ John Doe ]                                         ║
   ║   Born: [from cache]                                ║
   ║   Died: [if available]                              ║
   ║   Last used [date] • Used in 1 claim                ║
   ╠══════════════════════════════════════════════════════╣
   ║  [Show All (3)]         [Enter New Person]          ║
   ╚══════════════════════════════════════════════════════╝
   ```

5. **Select Father from Cache**
   - Click on "John Doe" card
   - ✅ **Expected**: All fields instantly populate with John's data
   - Autofill banner appears: "We've pre-filled 6 fields... from Family Member Cache"

6. **Fill Part 5 (Surviving Spouse - Mother)**
   - ✅ **Expected**: Mary Doe appears in family member suggestions
   - Click to auto-fill her information
   - Verify all fields populate correctly

7. **Complete Claim #2**
   - Fill remaining sections
   - Submit or save

8. **Verify Updated Cache**
   ```javascript
   const cache = JSON.parse(localStorage.getItem('radiantclaims_family_cache'));
   const johnDoe = cache.members.find(m => m.firstName === 'John' && m.lastName === 'Doe');
   console.log(johnDoe);
   ```

   ✅ **Expected**:
   - `claimIds` array should now contain both claim IDs
   - `lastUsedAt` timestamp should be updated

### Success Metrics

✅ **Time Saved**: Claim #2 should take ~80% less time to fill out
✅ **Accuracy**: No data entry errors from retyping
✅ **User Experience**: Clear visual feedback throughout

---

## Test Scenario 3: Part 6 Autofill (Surviving Child)

**Purpose**: Verify that Part 6 pre-fills deceased status from Part 2.

### Steps:

1. **Complete Part 2 with DOD**
   - Enter deceased parent information with Date of Death

2. **Navigate to Part 6**
   - ✅ **Expected**: "Claimant Deceased" field auto-fills to "YES"
   - Autofill banner shows this came from "Claimant Information"

3. **Verify Manual Override**
   - Change the value to "NO"
   - ✅ **Expected**: Change persists, autofill doesn't force the value

---

## Test Scenario 4: Edge Cases

### Test 4A: No Cached Members

1. Clear localStorage: `localStorage.clear()`
2. Start new claim
3. Navigate to Part 2
4. ✅ **Expected**: No family member selector appears, just normal form

### Test 4B: Selector "Skip" Functionality

1. With cached members, navigate to Part 2
2. Family selector appears
3. Click "Enter New Person"
4. ✅ **Expected**: Selector disappears, empty form appears

### Test 4C: Same Name, Different DOB

1. Complete claim for "John Doe" born 1945
2. Start new claim for different "John Doe" born 1950
3. ✅ **Expected**: Both John Does appear in selector with different DOBs
4. ✅ **Expected**: Stored as separate cache entries

### Test 4D: Multiple Browsers/Devices

1. Complete claim on Browser A
2. Open same account on Browser B
3. ✅ **Expected**: Family members do NOT appear (localStorage is browser-specific)
4. ℹ️ **Note**: This is expected behavior. Future enhancement will sync via server.

---

## Test Scenario 5: Performance Testing

### Test 5A: Large Family Cache

1. Manually add 50 family members to cache
2. Navigate to Part 2
3. ✅ **Expected**: Selector shows first few, "Show All (50)" button appears
4. ✅ **Expected**: No lag or performance issues

### Test 5B: Cache Size Limits

1. Check localStorage size:
   ```javascript
   const cache = localStorage.getItem('radiantclaims_family_cache');
   console.log('Cache size:', cache.length, 'characters');
   console.log('Size in KB:', (cache.length / 1024).toFixed(2));
   ```
2. ✅ **Expected**: Well under 5MB limit (typical cache < 10KB)

---

## Debugging Tools

### Check Cache Contents

```javascript
// View all cached family members
const cache = JSON.parse(localStorage.getItem('radiantclaims_family_cache') || '{}');
console.table(cache.members);
```

### Check Autofill Rules

```javascript
// In Part2Form or any form component
const autofill = useAutofill({ targetPart: 'part_2', currentFormData });
console.log('Autofilled fields:', autofill.autofilledFields);
console.log('Autofill defaults:', autofill.defaults);
```

### Clear Cache

```javascript
// Clear all family member cache
localStorage.removeItem('radiantclaims_family_cache');
console.log('Cache cleared');
```

### View Specific Member

```javascript
const cache = JSON.parse(localStorage.getItem('radiantclaims_family_cache') || '{}');
const member = cache.members.find(m => m.firstName === 'John' && m.lastName === 'Doe');
console.log(member);
```

---

## Common Issues & Solutions

### Issue 1: Selector Not Appearing

**Symptoms**: Family member selector doesn't show even with cached members.

**Checks**:
1. Verify Part 3 relationship is set: `currentFormData.part_3?.relationship`
2. Check if `initialData` is empty (selector only shows when no initial data)
3. Verify cached members exist for that relationship type

**Debug**:
```javascript
const { data: session } = useSession();
const members = getFamilyMemberCache(session?.user?.id || '');
const suggestions = suggestFamilyMembers(session?.user?.id || '', 'Child');
console.log('All members:', members);
console.log('Suggestions for Child:', suggestions);
```

### Issue 2: Autofill Not Working

**Symptoms**: Fields remain empty even though data should auto-fill.

**Checks**:
1. Is `currentFormData` being passed to the form component?
2. Verify source field has a value in `currentFormData`
3. Check if condition is satisfied (e.g., `filingForSelf === true`)

**Debug**:
```javascript
const autofill = useAutofill({ targetPart: 'part_2', currentFormData });
console.log('Current form data:', currentFormData);
console.log('Autofill defaults:', autofill.defaults);
console.log('Condition met?', currentFormData.part_1?.filingForSelf === true);
```

### Issue 3: Cache Not Saving

**Symptoms**: Family members not appearing in localStorage.

**Checks**:
1. Is user logged in? (requires `session.user.id`)
2. Is `useFamilyMemberCache` hook being called in FormWizard?
3. Check browser console for JavaScript errors

**Debug**:
```javascript
// Check if hook is running
console.log('Session:', session);
console.log('Form data:', formData);
// Try manual save
import { saveFamilyMember } from '@/lib/reca/family-member-cache';
saveFamilyMember(session.user.id, testMember);
```

---

## Success Criteria

### ✅ All Tests Pass If:

1. **Self-Filer Autofill**: Part 1 data auto-fills Part 2 for self-filers
2. **Family Cache Saves**: localStorage contains family members after completing claims
3. **Selector Appears**: Family member selector shows when appropriate
4. **Selection Works**: Clicking cached member auto-fills all fields
5. **Visual Feedback**: Autofill banners appear and show correct sources
6. **Multiple Claims**: Second claim for sibling's parent uses first claim's cached data
7. **Performance**: No lag with 50+ cached members
8. **Edge Cases**: Skip, manual entry, and empty cache scenarios work correctly

---

## Reporting Issues

When reporting bugs, please include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser console output** (F12 → Console tab)
5. **localStorage cache contents** (see debugging tools above)
6. **Screenshots** of:
   - Family member selector (if relevant)
   - Autofill banner
   - Form fields showing issue

---

## Next Steps After Testing

Once testing is complete:

1. **Document any bugs** in GitHub issues
2. **Gather user feedback** on UX/UI
3. **Consider enhancements**:
   - Server-side storage for cross-device sync
   - Smart deduplication of similar names
   - Import from previously submitted claims
   - Family account linking

---

## Quick Test Checklist

Use this checklist for rapid testing:

- [ ] Self-filer autofill works (Part 1 → Part 2)
- [ ] Part 6 autofill works (Part 2 DOD → Part 6 deceased status)
- [ ] Family members save to localStorage after form completion
- [ ] Family member selector appears when starting second claim
- [ ] Clicking cached member auto-fills all fields
- [ ] Autofill banner shows correct field count and sources
- [ ] "Skip" button works and shows empty form
- [ ] Cache persists across page refreshes
- [ ] Multiple claims for same family scenario works end-to-end
- [ ] No console errors during any workflow

---

## Support

For questions about testing or to report issues:
- See: `/docs/MULTI_CLAIM_INTEGRATION_GUIDE.md` for implementation details
- See: `/docs/IMPLEMENTATION_SUMMARY.md` for system overview
- Check browser console for error messages
- Use debugging tools above to inspect cache state

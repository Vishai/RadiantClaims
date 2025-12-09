# Family Member Multi-Claim System

## Overview

The Family Member Multi-Claim System allows users to file RECA claims for multiple family members without re-entering the same information repeatedly. This is especially important for common scenarios like siblings filing claims for both deceased parents.

---

## Problem Statement

### Without This System:
```
User filing claims for both deceased parents:

Claim 1 (Mother):
├─ Enter your info (filer)
├─ Enter mother's info (claimant)
├─ Enter father's info (spouse)
└─ Enter sibling info (other children)

Claim 2 (Father):
├─ RE-ENTER your info (filer) ❌
├─ RE-ENTER father's info (claimant) ❌
├─ RE-ENTER mother's info (spouse) ❌
└─ RE-ENTER sibling info (other children) ❌

Result: ~80% duplicate data entry
```

### With This System:
```
Claim 1 (Mother):
├─ Enter your info (filer) → Saved to cache ✓
├─ Enter mother's info (claimant) → Saved to cache ✓
├─ Enter father's info (spouse) → Saved to cache ✓
└─ Enter sibling info → Saved to cache ✓

Claim 2 (Father):
├─ Click "Use [Your Name]" → Auto-filled ✓
├─ Click "Use [Father's Name]" → Auto-filled ✓
├─ Click "Use [Mother's Name]" → Auto-filled ✓
└─ Click "Add siblings from previous claim" → Auto-filled ✓

Result: ~5% manual entry (just verification)
```

---

## Architecture

### Components

| File | Purpose |
|------|---------|
| `/src/lib/reca/family-member-cache.ts` | localStorage-based family member storage |
| `/src/components/reca/FamilyMemberSelector.tsx` | UI for selecting cached family members |
| `/src/lib/reca/autofill-engine.ts` | Extended autofill rules |

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│ User Completes Claim #1 (Mother)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Auto-Save to Family Member Cache:                   │
│ ├─ Filer (self)                                     │
│ ├─ Claimant (mother)                                │
│ ├─ Spouse (father)                                  │
│ └─ Siblings (all children)                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ User Starts Claim #2 (Father)                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ System Detects Cached Family Members                │
│ Shows: "Quick Fill from Previous Claims"            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ User Clicks "Use [Father's Name]"                   │
│ → All fields auto-populated                         │
│ → User just needs to verify                         │
└─────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Intelligent Suggestions

The system suggests relevant family members based on the claim type:

| Filing As | Suggested From Cache |
|-----------|---------------------|
| Child | Deceased parents |
| Spouse | Deceased spouse |
| Parent | Deceased children |
| Grandchild | Grandparents (via parent records) |

### 2. Cross-Claim Data Reuse

```typescript
// Claim #1: Filing for Mother
{
  relationship: 'Child',
  claimant: {
    firstName: 'Mary',
    lastName: 'Doe',
    dob: '01/15/1945',
    dod: '06/20/2020',
  },
  spouse: {  // Father info captured here
    name: 'John Doe',
    marriageStart: '05/10/1965',
  }
}

// Claim #2: Filing for Father
// System remembers "John Doe" from Claim #1's spouse field
// User can click "Use John Doe" to auto-fill claimant
```

### 3. Persistent Storage

- Uses `localStorage` for client-side persistence
- Survives page refreshes and browser sessions
- User-specific (keyed by userId)
- Can be cleared on logout for privacy

### 4. Automatic Cache Management

```typescript
// Automatically saves when:
saveFamilyMember(userId, {
  relationship: 'parent',
  firstName: 'John',
  lastName: 'Doe',
  dob: '01/15/1945',
  dod: '06/20/2020',
  claimIds: ['claim_123'],
});

// Automatically updates when reused:
markFamilyMemberUsed(userId, memberId);
// → Updates lastUsedAt timestamp
// → Adds to claimIds array
```

---

## Usage Examples

### Example 1: Selecting a Cached Parent

```typescript
import { FamilyMemberSelector } from '@/components/reca/FamilyMemberSelector';

<FamilyMemberSelector
  relationship="Child"  // Filing as child
  onSelect={(claimantData, memberId) => {
    // Auto-fills form with selected parent's data
    form.reset(claimantData);
  }}
  onSkip={() => {
    // User wants to enter new person
    setShowFamilySelector(false);
  }}
/>
```

**What the user sees:**
```
╔════════════════════════════════════════════════════╗
║ ✨ Quick Fill from Previous Claims                ║
║                                                    ║
║ We found 2 family members you've previously       ║
║ entered. Select one to auto-fill this claim.      ║
╠════════════════════════════════════════════════════╣
║ [ Mary Doe ]                                       ║
║   Born: Jan 15, 1945                              ║
║   Died: Jun 20, 2020                              ║
║   Last used May 3 • Used in 1 claim               ║
╠════════════════════════════════════════════════════╣
║ [ John Doe ]                                       ║
║   Born: Mar 22, 1943                              ║
║   Died: Aug 15, 2022                              ║
║   Last used Apr 28 • Used in 1 claim              ║
╠════════════════════════════════════════════════════╣
║  [Show All (4)]         [Enter New Person]        ║
╚════════════════════════════════════════════════════╝
```

### Example 2: Inline Quick Select

```typescript
import { InlineFamilyMemberSelector } from '@/components/reca/FamilyMemberSelector';

<InlineFamilyMemberSelector
  relationship="Child"
  onSelect={(claimantData) => {
    // Merge with form
    form.reset({ ...form.getValues(), ...claimantData });
  }}
  label="Quick fill from previous claims"
/>
```

**What the user sees (compact version):**
```
╔══════════════════════════════════════════════╗
║ Quick fill from previous claims:             ║
║ ┌────────────────────────────────────────┐  ║
║ │ 👥 Mary Doe            [Deceased]      │  ║
║ └────────────────────────────────────────┘  ║
║ ┌────────────────────────────────────────┐  ║
║ │ 👥 John Doe            [Deceased]      │  ║
║ └────────────────────────────────────────┘  ║
║ +2 more available                            ║
╚══════════════════════════════════════════════╝
```

---

## Common Scenarios

### Scenario 1: Sibling Filing for Both Parents

**Workflow:**
1. User starts Claim #1 for deceased mother
2. Enters:
   - Own info (filer)
   - Mother's info (claimant)
   - Father's info (spouse section)
   - Other siblings
3. Completes and submits Claim #1
4. User starts Claim #2 for deceased father
5. System shows: "Quick Fill from Previous Claims"
6. User selects:
   - Self from cache → Filer info auto-fills
   - Father from cache → Claimant info auto-fills
   - Mother from cache → Spouse info auto-fills
   - Siblings from cache → All siblings auto-fill
7. User just verifies and submits Claim #2

**Time saved:** ~15-20 minutes per additional claim

### Scenario 2: Multiple Children Filing for Same Parent

**Workflow:**
1. First sibling (Alice) files claim for mother
2. System saves mother's info to Alice's cache
3. Second sibling (Bob) starts filing claim for same mother
4. Bob has to enter mother's info manually (different user account)

**Future enhancement:** Family claim sharing (link accounts to share cache)

### Scenario 3: Spouse Filing for Both Children

**Workflow:**
1. Parent files claim for deceased child #1
2. System saves child's info
3. Parent starts claim for deceased child #2
4. System suggests previously entered child
5. Parent enters new child's info
6. Both children now in cache for future reference

---

## Hooks & API Reference

### `useFamilyMemberCache(options)`

React hook for auto-saving family members to cache.

**Options**:
```typescript
{
  claimId?: string;                    // Current claim ID
  formData?: Partial<RECAFormData>;    // Current form data
  autoSave?: boolean;                  // Auto-save on changes (default: true)
}
```

**Returns**:
```typescript
{
  saveClaimant: (claimant: Partial<Part2ClaimantInfo>) => void;
  saveFiler: (filer: Partial<Part1FilerInfo>) => void;
  saveSpouse: (spouseName: string, marriageStart?, marriageEnd?) => void;
  saveSibling: (sibling: {...}) => void;
}
```

**Usage**:
```typescript
import { useFamilyMemberCache } from '@/lib/reca/useFamilyMemberCache';

export function YourFormComponent({ formData, claimId }) {
  // Auto-saves family members as form data changes
  const { saveClaimant, saveFiler } = useFamilyMemberCache({
    claimId,
    formData,
    autoSave: true,
  });

  // Manual save when needed
  const handleSubmit = (data) => {
    saveClaimant(data);
    // ... submit logic
  };

  return <form>...</form>;
}
```

### `useSaveOnClaimComplete()`

Hook to save all family members when a claim is completed.

**Returns**:
```typescript
{
  saveAllFamilyMembers: (options: {
    claimId: string;
    formData: Partial<RECAFormData>;
  }) => void;
}
```

**Usage**:
```typescript
import { useSaveOnClaimComplete } from '@/lib/reca/useFamilyMemberCache';

export function ClaimReviewPage({ formData, claimId }) {
  const { saveAllFamilyMembers } = useSaveOnClaimComplete();

  const handleFinalSubmit = async () => {
    // Submit claim...
    await submitClaim(formData);

    // Save all family members to cache for future claims
    saveAllFamilyMembers({
      claimId,
      formData,
    });

    // Redirect to success page
  };

  return <div>...</div>;
}
```

### `getFamilyMemberCache(userId: string)`

Returns all cached family members for a user.

```typescript
const members = getFamilyMemberCache(session.user.id);
// Returns: FamilyMember[]
```

### `saveFamilyMember(userId, member)`

Saves or updates a family member in the cache.

```typescript
saveFamilyMember(session.user.id, {
  id: 'unique_id',
  relationship: 'parent',
  firstName: 'John',
  lastName: 'Doe',
  dob: '01/15/1945',
  dod: '06/20/2020',
  claimIds: ['claim_123'],
});
```

### `suggestFamilyMembers(userId, relationship)`

Gets relevant suggestions based on filing relationship.

```typescript
// Filing as "Child" → suggests parents
const parents = suggestFamilyMembers(session.user.id, 'Child');

// Filing as "Spouse" → suggests spouses
const spouses = suggestFamilyMembers(session.user.id, 'Spouse');
```

### `familyMemberToClaimant(member)`

Converts cached family member to Part2 claimant format.

```typescript
const member = getMostRecentFamilyMember(userId, 'parent');
const claimantData = familyMemberToClaimant(member);

form.reset(claimantData);
// → firstName, lastName, ssn, dob, dod all populated
```

---

## Integration Guide

### Step 1: Add Family Member Selector to Forms

```typescript
'use client';

import { useState } from 'react';
import { FamilyMemberSelector } from '@/components/reca/FamilyMemberSelector';

export function Part2Form({ initialData, onSubmit, currentFormData }: Props) {
  const [showSelector, setShowSelector] = useState(true);
  const [useCache, setUseCache] = useState(false);

  // Show selector first if cache has members
  if (showSelector && !useCache) {
    return (
      <FamilyMemberSelector
        relationship={currentFormData?.part_3?.relationship}
        onSelect={(claimantData, memberId) => {
          // Pre-fill form with cached data
          form.reset(claimantData);
          setUseCache(true);
          setShowSelector(false);
        }}
        onSkip={() => {
          // User wants to enter manually
          setShowSelector(false);
        }}
      />
    );
  }

  // Normal form rendering
  return <form>...</form>;
}
```

### Step 2: Save Family Members When Claim Completes

```typescript
import { saveFamilyMember, claimantToFamilyMember } from '@/lib/reca/family-member-cache';

// When user completes a claim
const handleClaimComplete = async (formData: RECAFormData) => {
  if (!session?.user?.id) return;

  // Save claimant to cache
  if (formData.part_2) {
    const familyMember = claimantToFamilyMember(
      formData.part_2,
      formData.part_3?.relationship === 'Child' ? 'parent' :
      formData.part_3?.relationship === 'Spouse' ? 'spouse' :
      'parent', // default
      claimId
    );

    saveFamilyMember(session.user.id, familyMember);
  }

  // Save spouse info if present (Part 5)
  if (formData.part_5?.claimantPreviousSpouses) {
    formData.part_5.claimantPreviousSpouses.forEach((spouse) => {
      saveFamilyMember(session.user.id, {
        id: `spouse_${Date.now()}`,
        relationship: 'spouse',
        firstName: spouse.spouseName.split(' ')[0],
        lastName: spouse.spouseName.split(' ').slice(1).join(' '),
        claimIds: [claimId],
      });
    });
  }
};
```

---

## Privacy & Security

### Data Storage
- Stored in browser `localStorage` only
- Never sent to server automatically
- User-specific (keyed by userId)
- Can be cleared at any time

### Data Clearing
```typescript
import { clearFamilyMemberCache } from '@/lib/reca/family-member-cache';

// On logout
signOut().then(() => {
  clearFamilyMemberCache();
});

// Manual clear option in settings
<Button onClick={() => {
  clearFamilyMemberCache();
  toast.success('Family member cache cleared');
}}>
  Clear Cached Family Members
</Button>
```

### Best Practices
1. **Don't auto-save sensitive info** like full SSNs (store last 4 only if needed)
2. **Clear on logout** for shared devices
3. **Allow user control** - provide clear cache option
4. **Show what's cached** - transparency about stored data

---

## Future Enhancements

### 1. Server-Side Storage
- Store family members in database
- Sync across devices
- Enable family claim sharing

### 2. Family Account Linking
- Siblings can link accounts
- Share family member cache
- Collaborative claim filing

### 3. Smart Deduplication
- Detect duplicate entries (same name + DOB)
- Auto-merge similar records
- Suggest corrections

### 4. Import from Previous Claims
- Pull data from submitted claims
- Pre-populate from claim history
- Cross-reference with DOJ records

---

## Testing Checklist

### Manual Testing

- [ ] File claim for deceased parent
- [ ] Verify parent saved to cache
- [ ] Start new claim
- [ ] Verify family member selector appears
- [ ] Select cached parent
- [ ] Verify all fields auto-filled correctly
- [ ] Submit second claim
- [ ] Verify cache updated (lastUsedAt, claimIds)

### Edge Cases

- [ ] No cached members → selector doesn't show
- [ ] Same name, different DOB → creates separate entries
- [ ] Editing cached data → doesn't modify cache
- [ ] Logout → option to clear cache
- [ ] Multiple browsers → cache is browser-specific

---

## Questions?

See `/src/components/reca/FamilyMemberSelector.tsx` for complete implementation example.

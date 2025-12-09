# Multi-Claim Autofill Integration Guide

## Overview

This guide shows you how to integrate the complete multi-claim autofill system into your RECA application. This system allows users to file multiple claims for different family members without re-entering the same information repeatedly.

**Key Features**:
- ✅ **Autofill within a single claim** - Part 1 data auto-fills Part 2 for self-filers
- ✅ **Family member caching** - Save family member data to localStorage
- ✅ **Cross-claim reuse** - Select from previously entered family members
- ✅ **Visual feedback** - Clear indicators showing autofilled data

---

## Complete Integration Steps

### Step 1: Add Autofill to Form Components

Every form component should use the `useAutofill` hook to pre-fill fields from previously completed parts.

**Example: Part2Form.tsx**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAutofill } from '@/lib/reca/useAutofill';
import { AutofillInfoBanner } from '@/components/reca/AutofillBadge';
import { FamilyMemberSelector } from '@/components/reca/FamilyMemberSelector';
import type { Part2ClaimantInfo, RECAFormData } from '@/lib/reca/types';

interface Part2FormProps {
  initialData?: Partial<Part2ClaimantInfo>;
  onSubmit: (data: Part2ClaimantInfo) => void;
  currentFormData?: Partial<RECAFormData>;
}

export function Part2Form({ initialData, onSubmit, currentFormData = {} }: Part2FormProps) {
  const [showFamilySelector, setShowFamilySelector] = useState(!initialData);
  const [selectedFromCache, setSelectedFromCache] = useState(false);

  // 1. Get autofill defaults from other form parts
  const autofill = useAutofill({
    targetPart: 'part_2',
    currentFormData,
  });

  // 2. Merge autofill defaults with initial data
  const defaultValues = autofill.mergeDefaults({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    ssn: initialData?.ssn || "",
    dob: initialData?.dob || "",
    dod: initialData?.dod || "",
  });

  const form = useForm({
    defaultValues,
  });

  // 3. Handle family member selection from cache
  const handleFamilyMemberSelect = (claimantData: Partial<Part2ClaimantInfo>) => {
    form.reset({
      ...defaultValues,
      ...claimantData,
    });
    setSelectedFromCache(true);
    setShowFamilySelector(false);
  };

  const handleSkipFamilySelector = () => {
    setShowFamilySelector(false);
  };

  // 4. Get autofill sources for banner
  const autofilledSources = [...new Set(
    autofill.autofilledFields
      .map(field => autofill.getSource(field)?.label)
      .filter(Boolean)
  )] as string[];

  const allSources = selectedFromCache
    ? ['Family Member Cache', ...autofilledSources]
    : autofilledSources;

  // 5. Show family member selector first (if applicable)
  if (showFamilySelector && !initialData && currentFormData.part_3?.relationship) {
    return (
      <div className="space-y-6">
        <FamilyMemberSelector
          relationship={currentFormData.part_3.relationship}
          onSelect={handleFamilyMemberSelect}
          onSkip={handleSkipFamilySelector}
        />
      </div>
    );
  }

  // 6. Render form with autofill banner
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Show autofill banner if fields were pre-filled */}
      {(autofill.autofilledFields.length > 0 || selectedFromCache) && (
        <AutofillInfoBanner
          autofilledCount={
            selectedFromCache
              ? autofill.autofilledFields.length + 1
              : autofill.autofilledFields.length
          }
          sources={allSources}
        />
      )}

      {/* Your form fields here */}
      {/* ... */}
    </form>
  );
}
```

---

### Step 2: Add Auto-Save to Form Flow

Use `useFamilyMemberCache` to automatically save family members as users complete forms.

**Example: Intake Page Component**

```typescript
'use client';

import { useState } from 'react';
import { useFamilyMemberCache } from '@/lib/reca/useFamilyMemberCache';
import type { RECAFormData } from '@/lib/reca/types';

export function IntakeFlow({ sessionId }: { sessionId: string }) {
  const [formData, setFormData] = useState<Partial<RECAFormData>>({});

  // Auto-save family members as form data changes
  useFamilyMemberCache({
    claimId: sessionId,
    formData,
    autoSave: true, // Automatically saves on formData changes
  });

  const handlePart1Submit = (data: Part1FilerInfo) => {
    setFormData((prev) => ({
      ...prev,
      part_1: data,
    }));
    // Navigate to next part...
  };

  const handlePart2Submit = (data: Part2ClaimantInfo) => {
    setFormData((prev) => ({
      ...prev,
      part_2: data,
    }));
    // Navigate to next part...
  };

  return (
    <div>
      {/* Forms will auto-save family members to cache */}
      <Part1Form
        initialData={formData.part_1}
        onSubmit={handlePart1Submit}
        currentFormData={formData}
      />
      {/* ... */}
    </div>
  );
}
```

---

### Step 3: Save All Data on Claim Completion

When a user completes a claim, save all family members to the cache for future use.

**Example: Final Review/Submit Page**

```typescript
'use client';

import { useSaveOnClaimComplete } from '@/lib/reca/useFamilyMemberCache';
import { useRouter } from 'next/navigation';

export function FinalReviewPage({
  sessionId,
  formData,
}: {
  sessionId: string;
  formData: Partial<RECAFormData>;
}) {
  const router = useRouter();
  const { saveAllFamilyMembers } = useSaveOnClaimComplete();

  const handleFinalSubmit = async () => {
    try {
      // 1. Submit claim to backend
      const response = await fetch(`/api/reca/packet/${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate packet');
      }

      // 2. Save all family members to cache for future claims
      saveAllFamilyMembers({
        claimId: sessionId,
        formData,
      });

      // 3. Redirect to success page
      router.push(`/intake/complete?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Submission failed:', error);
      // Handle error...
    }
  };

  return (
    <div>
      <h1>Final Review</h1>
      {/* Show form data summary */}
      <button onClick={handleFinalSubmit}>
        Submit Claim
      </button>
    </div>
  );
}
```

---

## User Experience Flow

### Scenario: Filing for Both Parents

**Claim #1: Filing for Mother**

1. User fills Part 1 (their info as filer)
   - ✅ Auto-saved to cache as "self"

2. User fills Part 2 (mother's info)
   - ✅ No suggestions yet (first claim)
   - ✅ Auto-saved to cache as "parent"

3. User fills Part 5 (spouse info - father)
   - ✅ Auto-saved to cache as "spouse"

4. User completes and submits Claim #1
   - ✅ All family members saved to cache

**Claim #2: Filing for Father**

1. User starts new claim, fills Part 1
   - ✅ Auto-fills from previous claim (same filer)

2. User reaches Part 2 (claimant info)
   - ✨ **Family Member Selector appears!**
   - Shows: Father (from Claim #1's spouse field)
   - Shows: Mother (from Claim #1's claimant field)

3. User clicks "Use [Father's Name]"
   - ✅ All fields auto-fill
   - ✅ User just verifies and continues

4. User fills Part 5 (spouse info - mother)
   - ✅ Shows mother from cache
   - ✅ One click to auto-fill

**Result**: ~80% less data entry on Claim #2!

---

## Form-Specific Integration

### Part 1: Filer Information
```typescript
// Auto-save happens automatically via useFamilyMemberCache
// No special integration needed
```

### Part 2: Claimant Information
```typescript
// 1. Show FamilyMemberSelector first
// 2. Use useAutofill for self-filer scenario
// 3. Auto-save claimant to cache
```

### Part 3: Relationship Selection
```typescript
// No autofill, just selection
```

### Part 5: Surviving Spouse
```typescript
import { InlineFamilyMemberSelector } from '@/components/reca/FamilyMemberSelector';

export function Part5Form({ currentFormData }) {
  const autofill = useAutofill({
    targetPart: 'part_5',
    currentFormData,
  });

  return (
    <form>
      {/* Show inline selector for spouse fields */}
      <InlineFamilyMemberSelector
        relationship="Spouse"
        onSelect={(claimantData) => {
          form.setValue('spouseName', `${claimantData.firstName} ${claimantData.lastName}`);
          // ...
        }}
        label="Quick fill from previous claims"
      />

      {/* Form fields */}
    </form>
  );
}
```

### Part 6: Surviving Child
```typescript
// Auto-fill sibling information from cache
// Show "Add siblings from previous claim" button
```

---

## Testing Checklist

### Single Claim Autofill
- [ ] Fill Part 1 with `filingForSelf = true`
- [ ] Navigate to Part 2
- [ ] Verify name/SSN/DOB fields are pre-filled
- [ ] Verify autofill banner appears
- [ ] Edit pre-filled values and submit

### Multi-Claim Scenario
- [ ] Complete Claim #1 for deceased parent
- [ ] Verify family members saved to cache (check localStorage)
- [ ] Start Claim #2 for other parent
- [ ] Verify FamilyMemberSelector appears on Part 2
- [ ] Select cached parent
- [ ] Verify all fields auto-fill correctly
- [ ] Complete and submit Claim #2
- [ ] Verify cache updated with new claim ID

### Edge Cases
- [ ] No cached members → selector doesn't show
- [ ] Same name, different DOB → creates separate entries
- [ ] Editing cached data → doesn't modify cache
- [ ] Logout → cache persists (user-specific)
- [ ] Multiple browsers → cache is browser-specific

---

## Troubleshooting

### Family Member Selector Not Showing

**Check**:
1. Is `currentFormData.part_3?.relationship` set?
2. Are there cached family members? (check localStorage: `radiantclaims_family_cache`)
3. Is `initialData` empty? (selector only shows when no initial data)

**Debug**:
```typescript
console.log('Relationship:', currentFormData.part_3?.relationship);
const members = getFamilyMemberCache(session?.user?.id || '');
console.log('Cached members:', members);
```

### Autofill Not Working

**Check**:
1. Is `currentFormData` being passed to the component?
2. Does the source field have a value?
3. Are you using `mergeDefaults()` correctly?

**Debug**:
```typescript
const autofill = useAutofill({ targetPart: 'part_2', currentFormData });
console.log('Autofill defaults:', autofill.defaults);
console.log('Autofilled fields:', autofill.autofilledFields);
```

### Family Members Not Saving

**Check**:
1. Is user logged in? (requires `session.user.id`)
2. Is `useFamilyMemberCache` being called?
3. Is `autoSave` set to `true`?

**Debug**:
```typescript
// Check localStorage
const cache = localStorage.getItem('radiantclaims_family_cache');
console.log('Family cache:', JSON.parse(cache || '{}'));
```

---

## Performance Considerations

### localStorage Limits
- **Limit**: ~5-10MB per domain
- **Our usage**: ~1KB per family member
- **Max capacity**: ~5,000-10,000 family members (far more than needed)

### Optimization Tips
1. **Periodic cleanup**: Remove old entries (>1 year unused)
2. **Deduplication**: Automatic via name + DOB matching
3. **Lazy loading**: Only load cache when needed

---

## Privacy & Security

### Data Storage
- **Where**: Browser localStorage only
- **Encryption**: None (not sensitive PII in cache)
- **Access**: User-specific, keyed by userId
- **Persistence**: Survives page refresh, not logout

### Best Practices
1. **Don't cache full SSNs** - Last 4 digits only if needed
2. **Clear on logout** - Optional, for shared devices
3. **User control** - Provide "Clear Cache" option in settings
4. **Transparency** - Show what's cached in UI

---

## Future Enhancements

### 1. Server-Side Storage
- Store family members in database
- Sync across devices
- Enable family account linking

### 2. Smart Deduplication
- Detect duplicate entries (fuzzy matching)
- Auto-merge similar records
- Suggest corrections

### 3. Import from Previous Claims
- Pull data from submitted claims
- Pre-populate from claim history
- Cross-reference with DOJ records

---

## Questions?

See complete implementation examples:
- `/src/components/reca/parts/Part2Form.tsx` - Full integration
- `/src/lib/reca/useFamilyMemberCache.ts` - Auto-save hooks
- `/docs/FAMILY_MEMBER_MULTI_CLAIM.md` - System architecture

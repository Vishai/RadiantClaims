# RECA Form Autofill System

## Overview

The RECA Form Autofill System eliminates duplicate data entry by intelligently pre-filling form fields based on information previously entered in other parts of the application.

## Key Features

- ✅ **Zero Duplicate Entry**: Users enter information once, and it's automatically populated across all relevant forms
- ✅ **Smart Conditional Logic**: Autofill rules only apply when appropriate (e.g., self-filer logic)
- ✅ **User Control**: All autofilled values can be reviewed and edited
- ✅ **Visual Feedback**: Clear indicators show which fields have been pre-filled and from where
- ✅ **Type-Safe**: Full TypeScript support with type inference

---

## Architecture

### Core Files

| File | Purpose |
|------|---------|
| `/src/lib/reca/autofill-engine.ts` | Core autofill logic and mapping rules |
| `/src/lib/reca/useAutofill.ts` | React hook for accessing autofill in components |
| `/src/components/reca/AutofillBadge.tsx` | UI components for visual feedback |

---

## Autofill Scenarios

### Scenario 1: Self-Filer Autofill
**When**: User indicates they are filing for themselves (Part 1: `filingForSelf = true`)
**What happens**: All Part 1 (filer) information → Part 2 (claimant) information

**Fields autofilled**:
- First Name
- Middle Name
- Last Name
- Former Names
- Social Security Number
- Date of Birth

**Example**:
```typescript
// User fills Part 1
part_1: {
  firstName: "John",
  lastName: "Doe",
  ssn: "123-45-6789",
  dob: "01/15/1970",
  filingForSelf: true
}

// Part 2 automatically pre-fills:
part_2: {
  firstName: "John",      // ← Auto-filled
  lastName: "Doe",        // ← Auto-filled
  ssn: "123-45-6789",     // ← Auto-filled
  dob: "01/15/1970",      // ← Auto-filled
  dod: ""                 // User still needs to enter death date
}
```

### Scenario 2: Supporting Forms Autofill
**When**: User completes main form parts
**What happens**: Claimant information → Supporting forms

**Forms affected**:
- Medical Information Release
- Certification of Identity
- Tribal Records Release

**Fields autofilled**:
- Name fields
- Date of birth
- SSN
- Current address

### Scenario 3: Legal Guardian Autofill
**When**: User needs to complete Part 15 (Legal Guardian)
**What happens**: Part 1 (filer) information → Part 15 (guardian) information

**Use case**: When the filer is also the legal guardian

**Fields autofilled**:
- Guardian name
- Guardian address
- Guardian contact information

---

## Usage in Components

### Basic Implementation

```typescript
import { useAutofill } from '@/lib/reca/useAutofill';
import { AutofillInfoBanner } from '@/components/reca/AutofillBadge';

export function YourForm({ initialData, onSubmit, currentFormData }: Props) {
  // 1. Get autofill hook
  const autofill = useAutofill({
    targetPart: 'part_2',  // The form part you're building
    currentFormData,        // Current form state
  });

  // 2. Merge autofill defaults with initial data
  const defaultValues = autofill.mergeDefaults({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    // ... other fields
  });

  // 3. Use merged defaults in your form
  const form = useForm({
    defaultValues,
  });

  // 4. Get autofill metadata for UI
  const autofilledSources = [...new Set(
    autofill.autofilledFields
      .map(field => autofill.getSource(field)?.label)
      .filter(Boolean)
  )];

  return (
    <form>
      {/* 5. Show autofill banner */}
      {autofill.autofilledFields.length > 0 && (
        <AutofillInfoBanner
          autofilledCount={autofill.autofilledFields.length}
          sources={autofilledSources}
        />
      )}

      {/* Your form fields */}
    </form>
  );
}
```

### Hook API Reference

#### `useAutofill(options)`

**Options**:
```typescript
{
  targetPart: keyof RECAFormData,        // Which form part you're building
  currentFormData: Partial<RECAFormData>, // Current form state
  currentSupportingForms?: Partial<RECASupportingForms>
}
```

**Returns**:
```typescript
{
  defaults: Record<string, any>;          // All autofilled values
  getValue: (fieldName: string) => any;   // Get specific field value
  hasValue: (fieldName: string) => boolean; // Check if field has autofill
  getSource: (fieldName: string) => {...}; // Get source metadata
  mergeDefaults: <T>(existingValues: T) => T; // Merge with existing
  autofilledFields: string[];             // List of autofilled field names
}
```

---

## Adding New Autofill Rules

### 1. Define the Rule

Edit `/src/lib/reca/autofill-engine.ts` and add to `AUTOFILL_RULES`:

```typescript
{
  targetPart: 'part_X',           // Target form part
  targetField: 'fieldName',       // Target field name
  sourcePart: 'part_Y',           // Source form part
  sourceField: 'fieldName',       // Source field name
  condition: (formData) => {      // Optional: when to apply
    return formData.part_Y?.someField === 'value';
  },
  transform: (value) => {         // Optional: transform value
    return value.toUpperCase();
  },
},
```

### 2. Example: New Attorney Autofill

```typescript
// Autofill attorney email from filer email
{
  targetPart: 'part_13',
  targetField: 'attorneyEmail',
  sourcePart: 'part_1',
  sourceField: 'email',
  condition: (formData) => formData.part_13?.hasAttorney === 'YES',
},
```

---

## UI Components

### `<AutofillInfoBanner />`

Displays a prominent banner when fields have been auto-filled.

**Props**:
```typescript
{
  autofilledCount: number;   // Number of fields pre-filled
  sources: string[];         // List of source form names
  onDismiss?: () => void;    // Optional dismiss callback
}
```

**Appearance**:
```
╔════════════════════════════════════════════════════════╗
║ ✨ Smart Form Pre-fill Active                         ║
║                                                        ║
║ We've pre-filled 6 fields based on information you    ║
║ previously entered from Your Information.             ║
║                                                        ║
║ ℹ️  You can review and edit any pre-filled values     ║
╚════════════════════════════════════════════════════════╝
```

### `<AutofillBadge />`

Small badge indicator for individual fields.

**Props**:
```typescript
{
  sourceLabel: string;      // "Your Information", "Claimant Information", etc.
  fieldName?: string;       // Optional field name
  variant?: 'inline' | 'tooltip';  // Display style
}
```

### `<AutofillFieldLabel />`

Enhanced form label with autofill badge.

```typescript
<AutofillFieldLabel
  label="First Name"
  isAutofilled={autofill.hasValue('firstName')}
  sourceLabel={autofill.getSource('firstName')?.label}
  required={true}
/>
```

---

## Testing

### Manual Testing Checklist

1. **Self-Filer Flow**:
   - ✅ Fill Part 1 with `filingForSelf = true`
   - ✅ Navigate to Part 2
   - ✅ Verify all name/SSN/DOB fields pre-filled
   - ✅ Verify autofill banner appears
   - ✅ Verify can edit pre-filled values

2. **Survivor Flow**:
   - ✅ Fill Part 1 with `filingForSelf = false`
   - ✅ Fill Part 2 (claimant info)
   - ✅ Navigate to Supporting Forms
   - ✅ Verify Medical Info Release pre-filled
   - ✅ Verify Certification of Identity pre-filled

3. **Legal Guardian Flow**:
   - ✅ Fill Part 1
   - ✅ Navigate to Part 15
   - ✅ Verify guardian fields pre-filled from filer

### Automated Testing

```typescript
import { getAutofillDefaults } from '@/lib/reca/autofill-engine';

describe('Autofill Engine', () => {
  it('should autofill Part 2 for self-filers', () => {
    const formData = {
      part_1: {
        firstName: 'John',
        lastName: 'Doe',
        ssn: '123-45-6789',
        dob: '01/15/1970',
        filingForSelf: true,
      },
    };

    const defaults = getAutofillDefaults('part_2', formData);

    expect(defaults.firstName).toBe('John');
    expect(defaults.lastName).toBe('Doe');
    expect(defaults.ssn).toBe('123-45-6789');
    expect(defaults.dob).toBe('01/15/1970');
  });
});
```

---

## Benefits

### For Users
- ⏱️ **Saves Time**: No need to re-enter the same information multiple times
- ✅ **Reduces Errors**: Consistent data across all form sections
- 🎯 **Better UX**: Clear feedback about what's been pre-filled
- 🔄 **Maintains Control**: Can always edit autofilled values

### For Development
- 🛡️ **Type-Safe**: Full TypeScript support prevents bugs
- 🔧 **Easy to Extend**: Simple rule-based system
- 📝 **Self-Documenting**: Clear mapping between source and target
- ♻️ **Reusable**: Hook can be used in any form component

---

## Future Enhancements

1. **Address Validation**: Pre-fill city/state based on ZIP code
2. **Name Normalization**: Consistent capitalization across forms
3. **Smart Defaults**: Learn from user patterns
4. **Multi-Language Support**: Autofill with localized data
5. **Audit Trail**: Track which fields were autofilled for compliance

---

## Troubleshooting

### Autofill not working

**Check**:
1. Is `currentFormData` being passed to the component?
2. Does the source field have a value?
3. Is the condition (if any) satisfied?
4. Are you using `mergeDefaults()` correctly?

**Debug**:
```typescript
const autofill = useAutofill({ ... });
console.log('Autofill defaults:', autofill.defaults);
console.log('Autofilled fields:', autofill.autofilledFields);
console.log('Has firstName?', autofill.hasValue('firstName'));
console.log('Source:', autofill.getSource('firstName'));
```

### Values getting overwritten

**Solution**: Use `mergeDefaults()` which gives precedence to existing values:

```typescript
// ✅ Correct: Existing values override autofill
const defaultValues = autofill.mergeDefaults({
  firstName: initialData?.firstName || "",
});

// ❌ Wrong: Autofill overrides existing values
const defaultValues = {
  firstName: initialData?.firstName || "",
  ...autofill.defaults,  // This overwrites!
};
```

---

## Migration Guide

### Updating Existing Forms

1. Add `currentFormData` prop:
```typescript
interface YourFormProps {
  // ... existing props
  currentFormData?: Partial<RECAFormData>; // Add this
}
```

2. Import autofill hook:
```typescript
import { useAutofill } from '@/lib/reca/useAutofill';
import { AutofillInfoBanner } from '@/components/reca/AutofillBadge';
```

3. Use autofill in component:
```typescript
const autofill = useAutofill({
  targetPart: 'your_part',
  currentFormData,
});

const defaultValues = autofill.mergeDefaults({
  // your existing default values
});
```

4. Add UI feedback:
```typescript
{autofill.autofilledFields.length > 0 && (
  <AutofillInfoBanner ... />
)}
```

---

## Questions?

See `/src/components/reca/parts/Part2Form.tsx` for a complete working example.

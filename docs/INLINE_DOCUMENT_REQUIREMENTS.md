# Inline Document Requirements Integration

## Overview

The Inline Document Requirements feature provides **real-time feedback** to users as they complete form sections. Instead of waiting until the end of the application to discover what documents they need, users see context-aware document requirements immediately based on their current answers.

This dramatically improves the user experience by:
- ✅ **Proactive Awareness** - Users know what to gather before they finish the form
- ✅ **Contextual Guidance** - Document requirements update dynamically as they answer questions
- ✅ **Reduced Friction** - No surprises at the end about missing documents
- ✅ **Better Preparation** - Users can gather documents while completing the application

---

## How It Works

### Real-Time Analysis

As users complete each form section, the system:

1. **Analyzes current form data** to determine what documents are required
2. **Filters requirements** to show only those relevant to the current section
3. **Displays inline cards** showing exactly what will be needed and why
4. **Updates dynamically** as users change their answers

### Example Flow

**User completes Part 6 (Surviving Child form)**:

1. User enters information about siblings
2. User marks a sibling as deceased
3. **Immediately sees**: "You'll need to upload a death certificate for [sibling name]"
4. User adds another sibling who had a name change due to marriage
5. **Immediately sees**: "You'll need to upload marriage certificate showing name change from [maiden name]"

This real-time feedback helps users understand the full scope of document requirements **before** they reach the upload section.

---

## Component Usage

### `DocumentRequirementsInline`

The main component for embedding document requirements within forms.

```typescript
import { DocumentRequirementsInline } from '@/components/reca/DocumentRequirementsInline';

<DocumentRequirementsInline
  formData={currentFormData}
  relatedFormSection="part_6"
  variant="card"
  title="Documents You'll Need for This Section"
  description="Based on your answers below, you'll need to upload these documents later"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `formData` | `Partial<RECAFormData>` | **required** | Current form data to analyze |
| `relatedFormSection` | `string` | optional | Filter to show only requirements from this section |
| `variant` | `'card' \| 'compact' \| 'minimal'` | `'card'` | Display style |
| `title` | `string` | `'Documents You'll Need'` | Card title |
| `description` | `string` | - | Card description |
| `uploadedFiles` | `Record<string, boolean>` | `{}` | Map of uploaded files to show status |
| `showUploadedStatus` | `boolean` | `false` | Whether to show upload status badges |

---

## Variants

### 1. Card Variant (Full)

**Best for**: Form sections where users need detailed context

```typescript
<DocumentRequirementsInline
  formData={formData}
  relatedFormSection="part_6"
  variant="card"
/>
```

**Features**:
- Collapsible card with full details
- Shows "Why needed" context for each document
- Document count badge
- Expand/collapse functionality
- Priority badges (REQUIRED, RECOMMENDED, OPTIONAL)

### 2. Compact Variant

**Best for**: Sidebars or summary areas

```typescript
<DocumentRequirementsInline
  formData={formData}
  relatedFormSection="part_6"
  variant="compact"
/>
```

**Features**:
- Simple bordered box
- List of document titles
- Status icons (uploaded vs missing)
- Less vertical space

### 3. Minimal Variant

**Best for**: Quick notifications or inline hints

```typescript
<DocumentRequirementsInline
  formData={formData}
  relatedFormSection="part_6"
  variant="minimal"
/>
```

**Features**:
- Single line with document count
- File icon
- Minimal space usage

---

## Integration Examples

### Part2Form (Claimant Information)

```typescript
import { DocumentRequirementsInline } from "@/components/reca/DocumentRequirementsInline";

export function Part2Form({ currentFormData, ... }: Part2FormProps) {
  return (
    <form>
      {/* Autofill Banner */}
      {/* ... */}

      {/* Document Requirements Inline */}
      <DocumentRequirementsInline
        formData={currentFormData}
        relatedFormSection="part_2"
        variant="card"
        title="Documents You'll Need for the Claimant"
        description="Based on the deceased individual's information, you'll need to upload these documents"
      />

      {/* Form Fields */}
      {/* ... */}
    </form>
  );
}
```

**What users see**:
- Claimant's birth certificate (REQUIRED)
- Claimant's death certificate (REQUIRED) - if DOD is entered
- Medical records (RECOMMENDED) - if death certificate shows cancer

### Part6Form (Surviving Child)

```typescript
import { DocumentRequirementsInline } from "@/components/reca/DocumentRequirementsInline";

export default function Part6Form({ currentFormData, ... }: Part6FormProps) {
  return (
    <div>
      {/* Autofill Banner */}
      {/* ... */}

      {/* Document Requirements Inline */}
      <DocumentRequirementsInline
        formData={currentFormData}
        relatedFormSection="part_6"
        variant="card"
        title="Documents You'll Need for This Section"
        description="Based on your answers below, you'll need to upload these documents later in the process"
      />

      {/* Form Fields */}
      {/* ... */}
    </div>
  );
}
```

**What users see** (example scenario):
- Your birth certificate (REQUIRED) - to prove relationship to claimant
- Death certificate for Bob Smith (REQUIRED) - deceased sibling
- Marriage certificate for Carol Johnson (REQUIRED) - sister who changed name through marriage

---

## Smart Context Detection

### Sibling Name Changes

When a user enters sibling information:

```typescript
{
  name: "Carol Johnson",
  hadNameChange: "YES",
  nameChangeHistory: [{
    previousName: "Carol Doe",
    reasonForChange: "MARRIAGE"
  }]
}
```

The system **automatically shows**:
> **Marriage Certificate for Carol Johnson** (REQUIRED)
>
> *Marriage certificate showing name change from Carol Doe to Carol Johnson*
>
> **Why needed:** Required to trace name back to mother's maiden name or establish family relationship

### Death Certificates

When a user marks a sibling as deceased:

```typescript
{
  name: "Bob Smith",
  isDeceased: "YES"
}
```

The system **immediately shows**:
> **Death Certificate for Bob Smith** (REQUIRED)
>
> *Death certificate for sibling: Bob Smith*
>
> **Why needed:** Required for each deceased sibling listed in the claim

---

## Badge Component

For showing document counts in form headers or navigation:

```typescript
import { DocumentRequirementsBadge } from "@/components/reca/DocumentRequirementsInline";

<CardTitle className="flex items-center gap-2">
  Part 6: Surviving Child Information
  <DocumentRequirementsBadge
    formData={currentFormData}
    relatedFormSection="part_6"
  />
</CardTitle>
```

**Displays**: `📄 3 docs needed`

---

## Dynamic Updates

The component **automatically re-analyzes** when form data changes:

```typescript
const analysis = useMemo(
  () => analyzeDocumentRequirements(formData, uploadedFiles),
  [formData, uploadedFiles]
);
```

This means:
- Add a sibling → Document count increases
- Mark sibling as deceased → Death certificate requirement appears
- Remove a sibling → Requirements update automatically

---

## Integration with Upload System

The component prepares users for the document upload phase:

1. **During form completion**: Users see what they'll need
2. **At upload phase**: Same requirements are shown with upload buttons
3. **Final review**: Completion percentage and missing documents displayed

This creates a **consistent experience** from awareness → preparation → upload → review.

---

## Future Enhancements

### 1. Document Availability Tracking

Allow users to mark documents as "I have this" or "I need to obtain this":

```typescript
<DocumentRequirementsInline
  formData={formData}
  relatedFormSection="part_6"
  allowAvailabilityMarking={true}
  onMarkAvailability={(docId, status) => {
    // Track which documents user has ready
  }}
/>
```

### 2. Estimated Time Warnings

Show warnings for documents that take time to obtain:

> **Death Certificate for Bob Smith** (REQUIRED)
>
> ⏱️ **Processing Time**: 2-4 weeks from vital records office
>
> **Tip**: Start requesting this now to avoid delays

### 3. Document Checklist Export

Allow users to export a checklist of required documents:

```typescript
<DocumentRequirementsInline
  formData={formData}
  relatedFormSection="part_6"
  showExportButton={true}
/>
```

Generates a PDF or printable checklist for gathering documents offline.

---

## Technical Details

### Files Created

1. **`/src/components/reca/DocumentRequirementsInline.tsx`**
   - Main inline component
   - Three display variants
   - Badge component
   - Real-time requirement analysis

2. **`/src/components/ui/collapsible.tsx`**
   - Radix UI collapsible wrapper
   - Used for expandable document cards

### Dependencies

- `@radix-ui/react-collapsible` - Collapsible UI primitive
- `/lib/reca/document-requirements.ts` - Core analysis engine
- `/lib/reca/types.ts` - Form data types

### Integration Points

- **Part2Form** (`/src/components/reca/parts/Part2Form.tsx:144-151`)
- **Part6Form** (`/src/components/reca/parts/Part6Form.tsx:286-293`)
- Can be added to Part5, Part7, and other relationship-specific forms

---

## Testing

### Manual Testing

1. **Start a new claim** as a child of a deceased person
2. **Navigate to Part 2** - should see claimant document requirements
3. **Enter claimant info** with date of death - should see death certificate requirement
4. **Navigate to Part 6** - should see relationship proof requirements
5. **Add siblings**:
   - Mark one as deceased → Death certificate requirement appears
   - Add name change → Marriage certificate requirement appears
6. **Verify collapsible** - Click to expand/collapse document details

### Test Scenarios

**Scenario 1: Basic Claimant Documents**
- Complete Part 2 with DOB and DOD
- Should see: Birth certificate (REQUIRED), Death certificate (REQUIRED)

**Scenario 2: Sibling Death Certificates**
- Add 3 siblings in Part 6
- Mark 2 as deceased
- Should see 2 death certificate requirements

**Scenario 3: Name Change Tracking**
- Add sister with name change due to marriage
- Should see marriage certificate requirement
- Reason should mention "trace back to mother's maiden name"

**Scenario 4: Dynamic Updates**
- Add sibling → requirement appears
- Remove sibling → requirement disappears
- Change deceased status → requirement updates

---

## Questions?

See:
- `/docs/DOCUMENT_REQUIREMENTS_SYSTEM.md` - Full system documentation
- `/src/lib/reca/document-requirements.ts` - Core analysis logic
- `/src/components/reca/DocumentRequirementsInline.tsx` - Component implementation

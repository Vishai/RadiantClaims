# Document Requirements System

## Overview

The Document Requirements System dynamically determines what documents users need to upload based on their application data. It provides intelligent, context-aware document checklists that adapt as users complete the form.

**Key Features**:
- ✅ **Dynamic Analysis** - Scans form data to determine required documents
- ✅ **Context-Aware** - Provides specific reasons why each document is needed
- ✅ **Progress Tracking** - Shows upload status and completion percentage
- ✅ **Helpful Guidance** - Includes tips for obtaining difficult documents
- ✅ **Priority System** - Marks documents as REQUIRED, RECOMMENDED, or OPTIONAL
- ✅ **Category Organization** - Groups related documents together

---

## How It Works

### 1. Form Data Analysis

The system analyzes completed form sections to determine document requirements:

```typescript
import { analyzeDocumentRequirements } from '@/lib/reca/document-requirements';

const analysis = analyzeDocumentRequirements(formData, uploadedFiles);

// Returns:
{
  requirements: DocumentRequirement[],  // All required docs
  requiredCount: number,                 // Number of REQUIRED docs
  uploadedCount: number,                 // Number uploaded
  missingRequired: DocumentRequirement[], // What's still needed
  warnings: string[],                    // Important notices
  completionPercentage: number           // 0-100
}
```

### 2. Document Categories

Documents are organized into logical categories:

| Category | Description | Examples |
|----------|-------------|----------|
| `CLAIMANT_VITAL_RECORDS` | Birth/death certificates | Claimant's birth cert, death cert |
| `CLAIMANT_MEDICAL` | Medical records | Pathology reports, treatment records |
| `FILER_IDENTITY` | Your ID documents | Driver's license, passport |
| `RELATIONSHIP_PROOF` | Proves relationship | Your birth cert showing parent |
| `SIBLING_VITAL_RECORDS` | Sibling documents | Death certs, marriage certs |
| `SPOUSE_MARRIAGE` | Marriage records | Marriage certs, divorce decrees |
| `EXPOSURE_PROOF` | Proof of presence | School records, tax records |
| `OTHER` | Miscellaneous | Other supporting docs |

### 3. Priority Levels

Each document has a priority:

- **REQUIRED** 🔴 - Must be uploaded for claim approval
- **RECOMMENDED** 🟡 - Strengthens claim significantly
- **OPTIONAL** 🔵 - Additional supporting evidence

---

## Usage Examples

### Example 1: Basic Integration

```typescript
import { DocumentRequirementsChecklist } from '@/components/reca/DocumentRequirementsChecklist';

export function DocumentsPage({ formData, sessionId }) {
  const handleUpload = (requirementId: string) => {
    // Open upload modal for specific document
    router.push(`/upload?requirement=${requirementId}`);
  };

  return (
    <DocumentRequirementsChecklist
      formData={formData}
      uploadedFiles={uploadedFilesMap}
      onUpload={handleUpload}
      showCategories={true}
    />
  );
}
```

### Example 2: Sidebar Summary

```typescript
import { DocumentRequirementsSummary } from '@/components/reca/DocumentRequirementsChecklist';

export function Sidebar({ formData }) {
  return (
    <div className="space-y-4">
      <DocumentRequirementsSummary
        formData={formData}
        uploadedFiles={uploadedFilesMap}
      />
      {/* Other sidebar content */}
    </div>
  );
}
```

---

## Document Detection Logic

### Scenario 1: Filing as Child for Deceased Mother

**Form Data**:
```typescript
{
  part_1: { filingForSelf: false, firstName: "Alice" },
  part_2: { firstName: "Mary", lastName: "Doe", dod: "2020-06-20" },
  part_3: { relationship: "Child" },
  part_6: {
    claimantEverMarried: "YES",
    claimantSpouses: [
      { spouseName: "John Doe", marriageStart: "1965-05-10", marriageEnd: "2020-06-20" }
    ],
    siblings: [
      { name: "Bob Smith", isDeceased: "NO", currentAddress: "...", phoneNumber: "..." },
      { name: "Carol Johnson", isDeceased: "YES", hadNameChange: "YES", nameChangeHistory: [...] }
    ]
  }
}
```

**Detected Requirements**:
1. ✅ **Mary's Birth Certificate** (REQUIRED)
   - *Why*: Verify identity of person who became ill

2. ✅ **Mary's Death Certificate** (REQUIRED)
   - *Why*: Required for deceased claimant claims
   - *Note*: Check cause of death for cancer

3. ✅ **Alice's Birth Certificate** (REQUIRED)
   - *Why*: Prove you are child of Mary Doe
   - *Must show*: Mary Doe as mother

4. ✅ **Mary & John's Marriage Certificate** (REQUIRED)
   - *Why*: Verify marital history

5. ✅ **Carol's Death Certificate** (REQUIRED)
   - *Why*: Required for deceased sibling

6. ✅ **Carol's Marriage Certificate** (REQUIRED)
   - *Why*: Name change from maiden name - need to trace back to Mary Doe

7. ✅ **Alice's Government ID** (REQUIRED)
   - *Why*: Verify identity of person filing claim

8. 🟡 **Mary's Medical Records** (RECOMMENDED)
   - *Why*: Death certificate indicates cancer - medical records strengthen claim

**Total**: 7 required, 1 recommended

---

## Context-Aware Intelligence

### Example: Sibling Name Changes

The system detects when siblings (especially sisters) changed their names through marriage and automatically requires marriage certificates to trace the lineage back to the mother's maiden name.

```typescript
// If sibling had name change due to marriage:
{
  name: "Carol Johnson",           // Current name
  hadNameChange: "YES",
  originalLastName: "Doe",          // Maiden name (mother's name)
  nameChangeHistory: [
    {
      previousName: "Carol Doe",
      dateOfChange: "1985-06-15",
      reasonForChange: "MARRIAGE"
    }
  ]
}

// System automatically requires:
// - Marriage certificate showing Carol Doe → Carol Johnson
// - This proves Carol is child of Mary Doe
```

### Example: Death Certificate Analysis

When a death certificate shows cancer as cause of death, the system automatically recommends medical records:

```typescript
// System detects:
// - Death certificate uploaded
// - Cause of death field contains "cancer" or related terms

// Automatically adds:
{
  id: 'claimant_medical_records',
  priority: 'RECOMMENDED',  // Upgraded from OPTIONAL
  title: 'Medical Records Confirming Disease',
  reason: 'Death certificate indicates cancer - medical records strengthen claim',
  tips: [
    'Hospital discharge summaries',
    'Pathology reports',
    'Oncology treatment records',
    'Autopsy reports (if available)'
  ]
}
```

---

## Real-World Application Scenarios

### Scenario A: Three Siblings Filing for Both Parents

**Family**:
- Mother (Mary Doe) - deceased 2020
- Father (John Doe) - deceased 2022
- Children: Alice, Bob (deceased), Carol

**Claim #1: Filing for Mother**

**Required Documents**:
1. Mary's birth certificate
2. Mary's death certificate
3. Alice's birth certificate (shows Mary as mother)
4. Bob's death certificate (deceased sibling)
5. John & Mary's marriage certificate
6. Alice's ID

**Claim #2: Filing for Father**

**Required Documents**:
1. John's birth certificate
2. John's death certificate
3. Alice's birth certificate (shows John as father) ✓ *Already uploaded*
4. Bob's death certificate ✓ *Already uploaded*
5. John & Mary's marriage certificate ✓ *Already uploaded*
6. Alice's ID ✓ *Already uploaded*

**Smart Detection**: System recognizes 4 of 6 documents already uploaded from Claim #1!

---

## Integration Points

### 1. Form Wizard

Add document requirements indicator to each form section:

```typescript
// In Part6Form.tsx
import { analyzeDocumentRequirements } from '@/lib/reca/document-requirements';

const analysis = analyzeDocumentRequirements(currentFormData);
const siblingDocs = analysis.requirements.filter(r =>
  r.relatedFormSection === 'part_6'
);

// Show inline notice:
{siblingDocs.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 p-3">
    <p className="text-sm text-blue-900">
      Based on your answers, you'll need to upload {siblingDocs.length} document(s) related to siblings.
    </p>
  </div>
)}
```

### 2. Progress Sidebar

```typescript
<DocumentRequirementsSummary
  formData={formData}
  uploadedFiles={uploadedFilesMap}
/>
```

Shows:
- `3/7 documents uploaded`
- `43% complete`
- `4 required documents missing`

### 3. Final Review Page

```typescript
<DocumentRequirementsChecklist
  formData={formData}
  uploadedFiles={uploadedFilesMap}
  onUpload={handleUpload}
  showCategories={true}
/>
```

Full checklist with categories, tips, and upload buttons.

---

## API Reference

### `analyzeDocumentRequirements(formData, uploadedFiles)`

**Parameters**:
- `formData: Partial<RECAFormData>` - Current form data
- `uploadedFiles?: Record<string, boolean>` - Map of uploaded file keys

**Returns**: `DocumentRequirementsAnalysis`

```typescript
{
  requirements: DocumentRequirement[];
  requiredCount: number;
  uploadedCount: number;
  missingRequired: DocumentRequirement[];
  warnings: string[];
  completionPercentage: number;
}
```

### `DocumentRequirement` Interface

```typescript
interface DocumentRequirement {
  id: string;                    // Unique identifier
  category: DocumentCategory;     // Grouping category
  priority: DocumentPriority;     // REQUIRED | RECOMMENDED | OPTIONAL
  title: string;                  // Display name
  description: string;            // What this document is
  reason: string;                 // Why it's needed
  uploadKey?: string;             // Key in uploaded files
  isUploaded: boolean;            // Upload status
  conditionalReason?: string;     // Extra context
  relatedFormSection?: string;    // Which form triggered this
  tips?: string[];                // How to obtain
}
```

---

## Future Enhancements

### 1. OCR Analysis

Automatically analyze uploaded documents:
- Extract cause of death from death certificates
- Verify names match across documents
- Flag inconsistencies

### 2. Smart Document Matching

Cross-reference documents:
- "This birth certificate matches the name in Part 2"
- "Death certificate date matches DOD in application"
- "Warning: Names don't match - possible error"

### 3. External Data Integration

Pull data from external sources:
- Vital records databases
- Medical record systems
- LDS Church records

### 4. AI-Powered Assistance

- "Based on similar claims, you should also consider uploading..."
- "This type of cancer typically requires..."
- "Common substitutes for missing birth certificates..."

---

## Testing

### Test Case 1: Basic Requirements

```typescript
const formData = {
  part_1: { filingForSelf: false },
  part_2: { firstName: "John", lastName: "Doe", dod: "2020-01-15" },
  part_3: { relationship: "Child" }
};

const analysis = analyzeDocumentRequirements(formData);

// Should require:
// - Claimant birth cert
// - Claimant death cert
// - Filer birth cert (to prove relationship)
// - Filer ID

expect(analysis.requiredCount).toBe(4);
expect(analysis.requirements.find(r => r.id === 'claimant_birth_cert')).toBeDefined();
```

### Test Case 2: Sibling Requirements

```typescript
const formData = {
  // ... basic data
  part_6: {
    siblings: [
      { name: "Jane Doe", isDeceased: "YES", hasDeathCertificate: "YES" },
      { name: "Bob Smith", isDeceased: "NO", hadNameChange: "NO" }
    ]
  }
};

const analysis = analyzeDocumentRequirements(formData);

// Should require:
// - Jane's death certificate
// - No additional docs for Bob (living, no name change)

const janeDocs = analysis.requirements.filter(r => r.title.includes("Jane"));
expect(janeDocs.length).toBeGreaterThan(0);
```

---

## Questions?

See:
- `/src/lib/reca/document-requirements.ts` - Core analysis logic
- `/src/components/reca/DocumentRequirementsChecklist.tsx` - UI components
- `/docs/MULTI_CLAIM_INTEGRATION_GUIDE.md` - Related autofill system

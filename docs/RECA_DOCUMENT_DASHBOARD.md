# RECA Document Dashboard

## Overview

The RECA Document Dashboard is the **central hub** for managing all documents required for a RECA claim. It integrates three critical systems:

1. **Document Requirements Engine** - Dynamically determines what documents are needed based on form data
2. **Document Upload System** - Existing robust upload and management infrastructure
3. **Document Validation** - AI-powered validation and review workflow

This creates a **seamless experience** where documents uploaded anywhere in the system aggregate into a single, comprehensive view.

---

## Architecture

### Data Flow

```
Form Completion → Document Requirements Analysis → Upload → Validation → Review
     ↓                       ↓                        ↓          ↓          ↓
  Part 2-7          Analyze requirements        Upload zone   AI check   Manual review
                    based on answers             anywhere
```

### Key Integration Points

1. **`/reca/documents/[sessionId]`** - Main document dashboard page
2. **`RECADocumentDashboard` component** - Central orchestration component
3. **`DocumentRequirementsChecklist`** - Shows what's needed
4. **`DocumentDashboard`** - Existing document management (upload, view, edit, delete)
5. **`DocumentUploadZone`** - Upload interface

---

## Features

### 1. Unified Document View

**Single Source of Truth**: All documents, regardless of where they were uploaded, appear in one place.

- Documents uploaded during form completion
- Documents uploaded in dedicated upload section
- Documents uploaded from email links or external sources

### 2. Real-Time Requirements Analysis

The dashboard **dynamically analyzes** form data to determine required documents:

```typescript
const analysis = analyzeDocumentRequirements(formData, uploadedFiles);
```

This provides:
- Required document count
- Missing document list
- Upload completion percentage
- Context-aware requirements based on user's specific situation

### 3. Progress Tracking

**Two-Level Progress System**:

1. **Document Upload Progress**
   - Shows: `7 of 10 required documents uploaded`
   - Percentage: `70% complete`

2. **Validation Progress**
   - Shows: `5 of 7 uploaded documents validated`
   - Percentage: `71% complete`

### 4. Two-Tab Interface

**Requirements Tab**:
- Shows all required documents with context
- Organized by category
- Upload buttons for each requirement
- Priority badges (REQUIRED, RECOMMENDED, OPTIONAL)

**Uploads Tab**:
- Upload zone for adding new documents
- Grid/list view of all uploaded documents
- Document validation status
- Edit, recategorize, delete options

### 5. Smart Upload Flow

When a user clicks "Upload Document" from the Requirements tab:
1. System switches to Uploads tab
2. Upload zone is pre-configured for that specific document type
3. User uploads document
4. System automatically associates it with the requirement
5. Requirements list updates to show the document as uploaded

---

## User Journey

### Scenario: Filing as Child for Deceased Mother

**Step 1: User Completes Forms**
- Part 2: Enters mother's information (including DOD)
- Part 6: Lists 3 siblings, marks 1 as deceased, 1 had name change

**Step 2: Navigate to Document Dashboard**
- User clicks "Continue" after forms
- Arrives at `/reca/documents/[sessionId]`

**Step 3: View Requirements**
- Dashboard shows 7 required documents:
  1. Mother's birth certificate
  2. Mother's death certificate
  3. Your birth certificate (to prove relationship)
  4. Mother's marriage certificate
  5. Deceased sibling's death certificate
  6. Sister's marriage certificate (for name change)
  7. Your government ID

**Step 4: Upload Documents**
- Click "Upload Document" for each requirement
- Upload interface opens pre-configured
- Documents automatically categorized
- Progress bar updates in real-time

**Step 5: Review Status**
- Green checkmarks for uploaded documents
- Red alerts for missing documents
- Validation status for each document
- Overall completion percentage

**Step 6: Continue**
- When all required documents uploaded, "Continue to Review" button activates
- Or user can "Continue Anyway" if documents pending

---

## API Integration

### Server Component (`/app/reca/documents/[sessionId]/page.tsx`)

Fetches data server-side:

```typescript
async function getWorkflowData(sessionId: string) {
  // Fetch RECA workflow session
  const workflow = await prisma.rECAWorkflowSession.findUnique({
    where: { id: sessionId },
    select: {
      formData: true,
      supportingForms: true,
      intakeSessionId: true,
    },
  });

  // Fetch all uploaded files
  const uploadedFiles = await prisma.uploadedFile.findMany({
    where: {
      intakeSessionId: workflow.intakeSessionId,
    },
  });

  return { workflow, uploadedFiles };
}
```

### Client Component (`RECADocumentDashboard`)

Receives data and provides interactive UI:

```typescript
export function RECADocumentDashboard({
  sessionId,
  intakeSessionId,
  formData,
  uploadedFiles,
  completionPercentage,
}: RECADocumentDashboardProps) {
  // Analyze requirements
  const analysis = useMemo(() => {
    const uploadedMap = /* ... */;
    return analyzeDocumentRequirements(formData, uploadedMap);
  }, [formData, uploadedFiles]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalRequired: analysis.requiredCount,
    uploaded: uploadedFiles.length,
    uploadedRequired: analysis.uploadedCount,
    missingRequired: analysis.missingRequired.length,
  }), [analysis, uploadedFiles]);

  // Render UI...
}
```

---

## Document Aggregation

### Cross-Section Upload Recognition

Documents uploaded in **any part of the application** are recognized in the dashboard:

**Upload Locations**:
1. **During Form Completion** - Inline upload buttons in Part2, Part6, etc.
2. **Document Dashboard** - Dedicated upload zone
3. **Review Page** - Add missing documents before submission
4. **Email Links** - Direct upload via magic links sent to users

**Aggregation Logic**:
```typescript
// All uploads tied to intakeSessionId
const uploadedFiles = await prisma.uploadedFile.findMany({
  where: {
    intakeSessionId: workflow.intakeSessionId,
  },
});

// Matched against requirements by category
const uploadedMap: Record<string, boolean> = {};
uploadedFiles.forEach(file => {
  if (file.category) {
    uploadedMap[file.category] = true;
  }
});
```

---

## Progress Card Statistics

### Document Upload Progress

```typescript
const uploadPercentage = Math.round(
  (uploadedRequired / totalRequired) * 100
);
```

**Visual**: Progress bar showing 7/10 = 70%

### Validation Progress

```typescript
const validated = uploadedFiles.filter(f =>
  f.validation?.status === 'VERIFIED' ||
  f.customerStatus === 'APPROVED'
).length;

const validationPercentage = Math.round(
  (validated / uploaded) * 100
);
```

**Visual**: Progress bar showing 5/7 = 71%

### Quick Stats Grid

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Required   │  Uploaded   │   Missing   │  Validated  │
│     10      │      7      │      3      │      5      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## Document Management Features

### From Existing Infrastructure

The dashboard leverages the existing `DocumentDashboard` component, which provides:

1. **Grid/List View** - Toggle between views
2. **Search & Filter** - Find documents quickly
3. **Category Management** - Recategorize documents
4. **Validation Status** - See AI validation results
5. **Document Actions**:
   - View/preview documents
   - Download documents
   - Delete documents
   - Add notes/annotations
   - Confirm documents
   - Report issues

### Integration Example

```typescript
<DocumentDashboard
  sessionId={intakeSessionId}
  onRefresh={() => router.refresh()}
/>
```

This seamlessly embeds the full document management system within the RECA dashboard.

---

## Warnings and Alerts

The dashboard surfaces important warnings from the document analysis:

```typescript
{analysis.warnings.length > 0 && (
  <div className="space-y-2">
    {analysis.warnings.map((warning, index) => (
      <div className="alert alert-warning">
        {warning}
      </div>
    ))}
  </div>
)}
```

**Example Warnings**:
- "Death certificate for John Doe marked as 'will obtain' - must be submitted before final approval"
- "Death certificate for Jane Smith unavailable - claim may require additional documentation or affidavits"

---

## Navigation Flow

### Entry Points

Users reach the document dashboard from:

1. **Form Wizard** - After completing all form sections
2. **Direct Link** - `/reca/documents/[sessionId]`
3. **Progress Bar** - Click "Documents" stage

### Exit Points

Users can navigate to:

1. **Continue to Review** - If all required documents uploaded
2. **Continue Anyway** - If documents still missing (with warning)
3. **Back to Forms** - Return to form completion

```typescript
const handleContinue = () => {
  router.push(`/reca/review/${sessionId}`);
};

const handleBack = () => {
  router.push(`/reca/form/${sessionId}`);
};
```

---

## Responsive Design

### Mobile Experience

- Tabs stack vertically
- Stats grid becomes 2x2 on small screens
- Document cards collapse to list view
- Upload zone simplifies to drag-and-drop

### Desktop Experience

- Full grid layout for stats
- Side-by-side requirements and uploads
- Detailed document preview
- Inline document editing

---

## Future Enhancements

### 1. Bulk Upload

Allow users to upload multiple documents at once with automatic categorization:

```typescript
<BulkUploadZone
  onUploadComplete={(files) => {
    // AI categorizes each file
    // Maps to requirements automatically
  }}
/>
```

### 2. Document Procurement Assistance

For documents that take time to obtain:

```typescript
<DocumentProcurementHelper
  requirement={requirement}
  onRequestAssistance={() => {
    // Generate pre-filled forms
    // Provide contact information for vital records offices
    // Track request status
  }}
/>
```

### 3. Real-Time Validation

Show validation results as documents are uploaded:

```typescript
<DocumentCard
  file={file}
  validationStatus="processing"
  onValidationComplete={(result) => {
    // Show green checkmark or red X
    // Display confidence score
    // Suggest corrections if needed
  }}
/>
```

### 4. Email Reminders

Automatically email users about missing documents:

```typescript
await sendDocumentReminderEmail({
  to: user.email,
  missingDocuments: analysis.missingRequired,
  uploadLink: `/reca/documents/${sessionId}`,
});
```

### 5. Document Sharing

Allow users to request documents from family members:

```typescript
<RequestDocumentDialog
  requirement={requirement}
  onSendRequest={(email) => {
    // Send magic link to family member
    // They upload directly to user's claim
  }}
/>
```

---

## Testing

### Manual Testing

1. **Complete Form with Complex Scenario**:
   - File as child for deceased parent
   - Add multiple siblings (some deceased, some with name changes)
   - Add marital history for claimant

2. **Navigate to Document Dashboard**:
   - Verify all required documents listed
   - Check document count matches expected
   - Verify warnings appear for "will obtain" documents

3. **Upload Documents**:
   - Click upload from Requirements tab
   - Verify upload zone activates
   - Upload document
   - Verify requirement updates to show "uploaded"

4. **Switch Between Tabs**:
   - Verify uploaded documents appear in Uploads tab
   - Verify they can be viewed, edited, deleted
   - Verify stats update in real-time

5. **Test Navigation**:
   - With missing documents: "Continue Anyway" appears
   - With all documents: "Continue to Review" activates
   - Back button returns to forms

### Test Scenarios

**Scenario 1: No Documents Uploaded**
- Requirements tab shows all needed documents
- Uploads tab shows empty state with upload zone
- Continue button shows "3 required documents remaining"

**Scenario 2: Partial Upload**
- Requirements tab shows mix of uploaded/missing
- Uploads tab shows uploaded documents
- Progress bar shows partial completion

**Scenario 3: All Documents Uploaded**
- Requirements tab shows all green checkmarks
- Uploads tab shows all documents
- "Continue to Review" button enabled

---

## File Structure

```
/src
  /app/reca/documents/[sessionId]
    page.tsx              # Server component fetching data
  /components/reca
    RECADocumentDashboard.tsx  # Main dashboard component
    DocumentRequirementsChecklist.tsx
    DocumentRequirementsInline.tsx
  /components/documents
    DocumentDashboard.tsx       # Existing document management
    DocumentUploadZone.tsx      # Upload interface
    DocumentCard.tsx            # Document display
  /lib/reca
    document-requirements.ts    # Analysis engine
```

---

## Questions?

See:
- `/docs/DOCUMENT_REQUIREMENTS_SYSTEM.md` - Core requirements engine
- `/docs/INLINE_DOCUMENT_REQUIREMENTS.md` - Inline integration in forms
- `/src/components/reca/RECADocumentDashboard.tsx` - Implementation
- `/src/components/documents/DocumentDashboard.tsx` - Existing infrastructure

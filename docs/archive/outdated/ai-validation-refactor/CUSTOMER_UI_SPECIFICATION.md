# Customer-Facing UI Redesign Specification

## Design Philosophy

The customer UI should be **simple, clear, and confidence-building**. Users should always know:
1. What they need to upload
2. What they've already uploaded
3. What's still missing
4. Whether their documents are accepted or need attention

**Hide complexity. Show clarity.**

---

## Page 1: Document Upload Dashboard

### Route
`/portal/documents`

### Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                         │
│                                                              │
│  📄 Document Management                                      │
│  Upload and organize your claim documents                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📤 Upload Documents                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📎 Drag & drop files here or click to browse         │ │
│  │                                                        │ │
│  │  Accepts: PDF, JPG, PNG                               │ │
│  │  Max size: 10MB per file                              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📊 Your Progress                                75% Complete │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  ✅ Identity Documents                              Complete │
│      Birth certificate uploaded and verified                │
│                                                              │
│  ✅ Medical Records                                 Complete │
│      Pathology report uploaded and verified                 │
│                                                              │
│  ⚠️  Proof of Residence                      Need 1 more doc │
│      You've uploaded 1 document, need at least 2            │
│      [Upload More]                                          │
│                                                              │
│  ❌ Additional Documents                           Not started│
│      Optional: Employment records, school records, etc.     │
│      [Upload Documents]                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📁 Your Documents (3)                           [Sort by ▼] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Thumbnail]  Birth Certificate                       │   │
│  │              Identity Document                       │   │
│  │              Uploaded Jan 4, 2025 • ✅ Verified      │   │
│  │              [View] [Download] [Delete]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Thumbnail]  Pathology Report                        │   │
│  │              Medical Records                         │   │
│  │              Uploaded Jan 4, 2025 • ✅ Verified      │   │
│  │              [View] [Download] [Delete]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Thumbnail]  Utility Bill - June 1955                │   │
│  │              Proof of Residence                      │   │
│  │              Uploaded Jan 4, 2025 • ⚠️ Review Needed │   │
│  │              Issue: Need one more residence document │   │
│  │              [View Details] [Download] [Delete]      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Thumbnail]  Document uploading... 45%               │   │
│  │              ⏳ Processing                            │   │
│  │              [Cancel]                                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Upload Zone Component

**Visual States:**
- **Default**: Dashed border, upload icon, instructions
- **Drag over**: Highlighted border, "Drop files to upload" message
- **Uploading**: Progress bar with percentage
- **Error**: Red border, error message with retry button

**Behavior:**
- Accept PDF, JPG, PNG files
- Max file size: 10MB
- Multiple file upload supported
- Show upload progress for each file
- After upload completes, show "Processing..." status

**User Feedback:**
- Success: "3 documents uploaded successfully"
- Error: "Failed to upload document.pdf (file too large)" with retry option

#### 2. Progress Tracker Component

**Purpose:** Give user clear view of what's complete vs what's missing

**Status Icons:**
- ✅ **Complete** (green) - All requirements met
- ⚠️ **Needs Attention** (yellow) - Incomplete or issues found
- ❌ **Not Started** (gray) - No documents uploaded yet
- ⏳ **Processing** (blue) - AI validation in progress

**Required Sections by Claim Type:**

**Downwinder Claims:**
```typescript
[
  {
    category: 'Identity Documents',
    required: true,
    minDocuments: 1,
    description: 'Birth certificate or death certificate',
    status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW',
  },
  {
    category: 'Proof of Residence',
    required: true,
    minDocuments: 2,
    description: 'Documents showing you lived in affected area (1951-1958 or 1962)',
    status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW',
  },
  {
    category: 'Medical Records',
    required: true,
    minDocuments: 1,
    description: 'Documentation of covered disease diagnosis',
    status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW',
  },
  {
    category: 'Additional Documents',
    required: false,
    minDocuments: 0,
    description: 'Optional supporting documents',
    status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW',
  },
]
```

**Onsite Participant Claims:**
```typescript
[
  {
    category: 'Identity Documents',
    required: true,
    minDocuments: 1,
    description: 'Birth certificate or death certificate',
  },
  {
    category: 'Employment Records',
    required: true,
    minDocuments: 1,
    description: 'Proof of employment at Nevada Test Site or Pacific Proving Grounds',
  },
  {
    category: 'Medical Records',
    required: true,
    minDocuments: 1,
    description: 'Documentation of covered disease diagnosis',
  },
]
```

**Uranium Worker Claims:**
```typescript
[
  {
    category: 'Identity Documents',
    required: true,
    minDocuments: 1,
    description: 'Birth certificate or death certificate',
  },
  {
    category: 'Employment Records',
    required: true,
    minDocuments: 1,
    description: 'Proof of employment at uranium mine, mill, or transport facility',
  },
  {
    category: 'Medical Records',
    required: true,
    minDocuments: 1,
    description: 'Documentation of covered disease diagnosis',
  },
]
```

#### 3. Document List Component

**Card Layout for Each Document:**

```
┌─────────────────────────────────────────────────────┐
│ [Thumbnail]  Document Title                         │
│              Category • Date • Status Badge         │
│              [Additional context if needed]         │
│              [Action Buttons]                       │
└─────────────────────────────────────────────────────┘
```

**Status Badges:**
- ✅ **Verified** (green background) - AI validation passed
- ⚠️ **Review Needed** (yellow background) - AI found issues
- ⏳ **Processing** (blue background) - AI validation in progress
- ❌ **Issue Found** (red background) - Document not acceptable

**Action Buttons:**
- **View** - Opens document detail page
- **Download** - Downloads original file
- **Delete** - Removes document (with confirmation)

**Additional Context Examples:**
- "Issue: Need one more residence document"
- "Suggested category: Medical Records (82% confidence)"
- "Name on document: John Smith"
- "Date range: 1955-1956"

---

## Page 2: Document Detail View

### Route
`/portal/documents/[documentId]`

### Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Documents                                         │
│                                                              │
│  Birth Certificate                                           │
│  Identity Document • Uploaded Jan 4, 2025                    │
│  [Download] [Delete] [Change Category]                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────┬────────────────────────────────────┐
│                         │                                    │
│                         │  ✅ Verified                       │
│     PDF Preview         │                                    │
│                         │  This document meets requirements  │
│     [Document           │  for identity proof.               │
│      displays           │                                    │
│      here in            │  Key Information Extracted:        │
│      iframe]            │  ┌──────────────────────────────┐ │
│                         │  │ Full Name:                   │ │
│                         │  │ John Michael Smith           │ │
│                         │  │                              │ │
│                         │  │ Date of Birth:               │ │
│                         │  │ March 15, 1948               │ │
│                         │  │                              │ │
│                         │  │ Place of Birth:              │ │
│                         │  │ Las Vegas, Clark County, NV  │ │
│                         │  │                              │ │
│                         │  │ Issuing Authority:           │ │
│                         │  │ State of Nevada              │ │
│                         │  └──────────────────────────────┘ │
│                         │                                    │
│     [Page controls]     │  Is this information correct?      │
│     [Zoom controls]     │  [✓ Yes, looks good]               │
│                         │  [✗ No, something's wrong]         │
│                         │                                    │
│                         │  Notes (optional)                  │
│                         │  ┌──────────────────────────────┐ │
│                         │  │ Add any notes about this     │ │
│                         │  │ document...                  │ │
│                         │  └──────────────────────────────┘ │
│                         │  [Save Note]                       │
└─────────────────────────┴────────────────────────────────────┘
```

### Component Specifications

#### 1. Document Header

**Elements:**
- Back button to documents list
- Document title (user-provided or auto-generated from category)
- Category badge
- Upload date
- Action buttons: Download, Delete, Change Category

#### 2. PDF Preview Panel

**Features:**
- Full-page iframe for PDF viewing
- Zoom controls (+, -, fit to width, fit to page)
- Page navigation (if multi-page)
- For images: Show image with zoom capability
- Fallback for unsupported types: "Preview not available - [Download to view]"

#### 3. Validation Status Panel

**Status Display:**

**✅ Verified Status:**
```
✅ Verified

This document meets requirements for [category].

Key Information Extracted:
[Extracted data display]

Is this information correct?
[✓ Yes, looks good] [✗ No, something's wrong]
```

**⚠️ Review Needed Status:**
```
⚠️ Review Needed

We found some issues with this document:
• Issue description here
• Another issue here

What you can do:
• [Upload a clearer copy]
• [Upload different document]
• [Contact support]
```

**⏳ Processing Status:**
```
⏳ Processing

Our AI is reviewing this document...
This usually takes 30-60 seconds.

[Progress spinner]
```

**❌ Issue Found Status:**
```
❌ Issue Found

This document doesn't meet requirements:
• Critical issue description

You need to:
• [Upload a different document]
• [Contact support for help]
```

#### 4. Extracted Information Display

**Layout:**
```
Key Information Extracted:
┌──────────────────────────────┐
│ [Label]:                     │
│ [Extracted Value]            │
│                              │
│ [Label]:                     │
│ [Extracted Value]            │
└──────────────────────────────┘
```

**Examples by Category:**

**Identity Documents:**
- Full Name
- Date of Birth
- Place of Birth
- Issuing Authority

**Medical Records:**
- Diagnosis
- Diagnosis Date
- Treating Physician
- Medical Facility

**Proof of Residence:**
- Address
- County
- Date Range

**Employment Records:**
- Employer
- Job Title
- Employment Dates

#### 5. User Verification Prompt

**Purpose:** Let user confirm or flag extracted information

**Buttons:**
- ✓ **Yes, looks good** - Confirms extraction is correct
- ✗ **No, something's wrong** - Opens form to report issue

**Issue Report Form (if "No" clicked):**
```
What's incorrect?
[ ] Name is wrong
[ ] Date is wrong
[ ] Address is wrong
[ ] Other

Please describe the issue:
┌──────────────────────────────┐
│ [Text area]                  │
└──────────────────────────────┘

[Submit Issue] [Cancel]
```

#### 6. Notes Section

**Purpose:** Let users add context about the document

**Features:**
- Optional text area
- Character limit: 500 chars
- Saved per document
- Visible to staff reviewers

**Use Cases:**
- "This is my mother's birth certificate - filing on her behalf"
- "Name changed after marriage in 1960"
- "Only utility bill I could find from that era"

---

## Visual Design Specifications

### Color Palette

**Status Colors:**
```css
--status-verified: #10b981;    /* Green */
--status-warning: #f59e0b;     /* Yellow */
--status-processing: #3b82f6;  /* Blue */
--status-error: #ef4444;       /* Red */
--status-neutral: #6b7280;     /* Gray */
```

**Background Colors:**
```css
--bg-verified: #d1fae5;        /* Light green */
--bg-warning: #fef3c7;         /* Light yellow */
--bg-processing: #dbeafe;      /* Light blue */
--bg-error: #fee2e2;           /* Light red */
```

### Typography

**Headings:**
- Page title: 2.25rem (36px), bold
- Section title: 1.5rem (24px), semibold
- Card title: 1.125rem (18px), semibold

**Body:**
- Regular text: 1rem (16px)
- Small text: 0.875rem (14px)
- Tiny text: 0.75rem (12px)

### Spacing

- Card padding: 1.5rem (24px)
- Section spacing: 2rem (32px)
- Element spacing: 1rem (16px)

### Status Badge Design

```css
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.status-verified {
  background-color: var(--bg-verified);
  color: var(--status-verified);
}

/* ... similar for other statuses */
```

---

## Responsive Behavior

### Desktop (≥1024px)
- Two-column layout for document detail (preview left, info right)
- Document list shows 3 columns of cards

### Tablet (768px - 1023px)
- Two-column layout maintained but narrower
- Document list shows 2 columns

### Mobile (<768px)
- Single column layout
- Preview stacks above info panel
- Document list shows 1 column
- Upload zone full width

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

1. **Color Contrast**
   - Status colors must have 4.5:1 contrast ratio
   - Text on colored backgrounds must be readable

2. **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Upload zone accessible via keyboard (trigger file picker with Enter/Space)
   - Focus indicators visible and clear

3. **Screen Reader Support**
   - Status badges have aria-labels
   - Upload progress announced
   - Validation results announced
   - Document actions have descriptive labels

4. **Alternative Text**
   - Document thumbnails have alt text
   - Status icons have aria-labels
   - PDF preview has fallback text

---

## User Interactions & Feedback

### Upload Flow

1. User drops file or clicks to browse
2. File picker opens
3. User selects file(s)
4. Upload progress shown for each file (0-100%)
5. Success message: "3 documents uploaded successfully"
6. Documents appear with "⏳ Processing" status
7. Background: AI agents validate documents
8. Status updates in real-time (via polling or websocket)
9. Final status shown: ✅ Verified or ⚠️ Review Needed

### Category Change Flow

1. User clicks "Change Category" on document
2. Modal opens with dropdown of categories
3. User selects new category
4. Confirmation: "Update category to [new category]?"
5. On confirm: Status changes to "⏳ Processing"
6. AI agents re-run validation for new category
7. New status shown

### Delete Flow

1. User clicks "Delete"
2. Confirmation modal: "Are you sure? This cannot be undone."
3. On confirm: Document removed from list
4. Success message: "Document deleted"
5. Progress tracker updates if required doc removed

---

## State Management

### Component State

```typescript
interface DocumentsPageState {
  documents: Document[];
  uploading: UploadingFile[];
  progressData: ProgressData;
  loading: boolean;
  error: string | null;
}

interface Document {
  id: string;
  fileName: string;
  category: DocumentCategory;
  uploadedAt: Date;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'PROCESSING' | 'ERROR';
  thumbnailUrl: string;
  fileUrl: string;
  extractedData: Record<string, any>;
  issues: Issue[];
  userConfirmed: boolean;
  notes: string | null;
}

interface UploadingFile {
  id: string;
  fileName: string;
  progress: number; // 0-100
  error: string | null;
}

interface ProgressData {
  overallPercent: number;
  sections: ProgressSection[];
}

interface ProgressSection {
  category: string;
  required: boolean;
  minDocuments: number;
  currentDocuments: number;
  status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW';
  description: string;
}
```

---

## API Integration Points

### GET /api/documents
**Purpose:** Fetch all documents for user's claim
**Response:**
```typescript
{
  documents: Document[];
  progressData: ProgressData;
}
```

### POST /api/documents/upload
**Purpose:** Upload new document
**Request:**
```typescript
{
  file: File;
  category?: DocumentCategory; // Optional initial categorization
}
```
**Response:**
```typescript
{
  documentId: string;
  status: 'PROCESSING';
}
```

### GET /api/documents/[id]
**Purpose:** Get document details and validation results
**Response:**
```typescript
{
  document: Document;
  validationResult: {
    status: string;
    extractedData: Record<string, any>;
    issues: Issue[];
    confidence: number;
  };
}
```

### PATCH /api/documents/[id]
**Purpose:** Update document (category, notes, user confirmation)
**Request:**
```typescript
{
  category?: DocumentCategory;
  notes?: string;
  userConfirmed?: boolean;
}
```

### DELETE /api/documents/[id]
**Purpose:** Delete document

### GET /api/documents/[id]/status (polling endpoint)
**Purpose:** Get current processing status
**Response:**
```typescript
{
  status: 'PROCESSING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'ERROR';
  progress: number; // 0-100
}
```

---

## Error Handling

### Upload Errors
- **File too large**: "This file is too large (15MB). Maximum size is 10MB."
- **Invalid file type**: "This file type is not supported. Please upload PDF, JPG, or PNG."
- **Network error**: "Upload failed. Please check your internet connection and try again."

### Processing Errors
- **AI validation failed**: "We're having trouble analyzing this document. Please try uploading again or contact support."
- **OCR failed**: "We couldn't read the text in this document. Please upload a clearer image."

### General Errors
- **Session expired**: "Your session has expired. Please log in again."
- **Server error**: "Something went wrong on our end. Please try again or contact support."

---

## Performance Considerations

### Image Optimization
- Thumbnails generated server-side and cached
- Lazy load document thumbnails as user scrolls
- PDF preview loads on demand (not preloaded)

### Real-Time Updates
- Poll for status updates every 5 seconds while documents processing
- Stop polling when all documents reach final state
- Use websockets if available for instant updates

### Caching Strategy
- Cache document list in memory
- Invalidate cache on upload/delete
- Cache validation results (5 min TTL)

---

## Implementation Checklist

- [ ] Create DocumentUploadZone component
- [ ] Create ProgressTracker component
- [ ] Create DocumentList component
- [ ] Create DocumentCard component
- [ ] Create DocumentDetailView component
- [ ] Create ExtractedDataDisplay component
- [ ] Create StatusBadge component
- [ ] Implement file upload with progress
- [ ] Implement real-time status polling
- [ ] Implement category change modal
- [ ] Implement delete confirmation
- [ ] Implement notes functionality
- [ ] Implement user verification (Yes/No)
- [ ] Add error handling and user feedback
- [ ] Add loading states
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Test with real documents
- [ ] User acceptance testing

# Next Session: Frontend UI Components

## 📋 Quick Start for Next Session

**Context:** The AI validation system backend is complete and production-ready. Authentication and upload integration are working. Now we need to build the frontend UI components to display validation results to users.

**Branch:** `service-tiers`
**Status:** Backend complete, ready for UI development

---

## 🎯 Session Goal

Create visual components to display AI validation results in the frontend, including status badges, progress indicators, and readiness scores.

---

## 📖 Essential Reading (5 minutes)

Before starting, review these files:

1. **`SESSION_2_COMPLETE.md`** - What was built in session 2
2. **`UPLOAD_INTEGRATION.md`** - Upload flow and client helpers
3. **`AUTH_IMPLEMENTATION.md`** - Security implementation
4. **`API_ENDPOINTS.md`** - API reference

**Quick Context:**
```bash
# Read session summary
cat docs/ai-validation-refactor/SESSION_2_COMPLETE.md

# Check current state
git status
git log --oneline -5
```

---

## 🔍 What's Already Done

### ✅ Backend (100% Complete)

**Orchestration Service:**
- All 7 AI agents implemented and tested
- Complete 3-phase validation pipeline
- Progress tracking utilities

**API Endpoints (with Authentication):**
- `POST /api/validation/document` - Validate single document
- `POST /api/validation/session` - Validate session (with full pipeline option)
- `GET /api/validation/status/[sessionId]` - Check validation progress

**Upload Integration:**
- Documents automatically validated on upload
- Validation runs in background (non-blocking)
- Client helpers: `getDocumentValidation()`, `waitForValidation()`
- GET endpoint: `/api/intake/upload/:id` (returns file with validation)

**Testing:**
- ✅ All tests passing
- ✅ TypeScript compilation passing
- ✅ 2 commits pushed to `service-tiers`

---

## 🎯 What Needs to Be Done

### Priority 3: UI Components (This Session)

Create visual components to display validation status to users.

**Estimated Time:** 4-6 hours

---

## 📝 Component Specifications

### 3.1 DocumentStatusBadge Component

**Purpose:** Show validation status for each uploaded document

**Location:** `src/components/validation/DocumentStatusBadge.tsx`

**Props:**
```typescript
interface DocumentStatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
  category?: string;
  confidence?: number;
  showCategory?: boolean;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual Design:**
```
PENDING:      [  ⏳ Pending  ]              (gray)
PROCESSING:   [  🔄 Validating...  ]       (blue, animated)
VERIFIED:     [  ✓ Verified (IDENTITY)  ]  (green)
NEEDS_REVIEW: [  ⚠ Needs Review  ]         (yellow)
REJECTED:     [  ✗ Failed  ]               (red)
```

**Usage Example:**
```typescript
import { DocumentStatusBadge } from '@/components/validation/DocumentStatusBadge';

<DocumentStatusBadge
  status="VERIFIED"
  category="IDENTITY"
  confidence={0.95}
  showCategory={true}
  showConfidence={true}
/>
```

**Where to Use:**
- Document list/grid in upload interface
- Document details modal
- Review screens
- Admin dashboard

**Estimated Time:** 1 hour

---

### 3.2 ValidationProgress Component

**Purpose:** Show progress when validating multiple documents

**Location:** `src/components/validation/ValidationProgress.tsx`

**Props:**
```typescript
interface ValidationProgressProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onComplete?: () => void;
  showDetails?: boolean;
}
```

**Visual Design:**
```
Validating Documents...
[████████░░░░░░░░] 8/12 (67%)

✓ Completed: 7
⏳ Processing: 1
⚠ Failed: 1
⏸ Pending: 3
```

**Implementation:**
```typescript
import { useState, useEffect } from 'react';
import { getValidationStatus } from '@/lib/validation-client';

export function ValidationProgress({
  sessionId,
  autoRefresh = true,
  refreshInterval = 2000,
  onComplete
}: ValidationProgressProps) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/validation/status/${sessionId}`);
      const data = await response.json();

      setStatus(data.status);

      if (data.status.progress.overallStatus === 'completed') {
        clearInterval(interval);
        onComplete?.();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [sessionId, autoRefresh, refreshInterval, onComplete]);

  // Render progress bar and stats
}
```

**Where to Use:**
- After "Validate All" button click
- During submission process
- In admin review screens

**Estimated Time:** 1-2 hours

---

### 3.3 ReadinessScore Component

**Purpose:** Show claim completeness and readiness for submission

**Location:** `src/components/validation/ReadinessScore.tsx`

**Props:**
```typescript
interface ReadinessScoreProps {
  sessionId: string;
  showDetails?: boolean;
  onValidate?: () => void;
}
```

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Claim Readiness                    │
│                                     │
│     ╭─────────╮                     │
│     │   85    │                     │
│     │   /100  │                     │
│     ╰─────────╯                     │
│                                     │
│  ✅ Your claim is ready for         │
│     submission!                     │
│                                     │
│  📋 Checklist:                      │
│  ✓ Identity documents verified      │
│  ✓ Residence proof verified         │
│  ✓ Medical records verified         │
│  ⚠ Employment verification needed   │
│                                     │
│  [View Details] [Validate Again]    │
└─────────────────────────────────────┘
```

**Score Colors:**
- 80-100: Green (Ready)
- 60-79: Yellow (Almost ready)
- 0-59: Red (More documents needed)

**Implementation:**
```typescript
export function ReadinessScore({ sessionId, showDetails }: ReadinessScoreProps) {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReadiness() {
      const response = await fetch(`/api/validation/status/${sessionId}`);
      const data = await response.json();

      if (data.status.completenessCheck.completed) {
        setReadiness({
          score: data.status.completenessCheck.readinessScore,
        });
      }

      setLoading(false);
    }

    loadReadiness();
  }, [sessionId]);

  // Render circular score + status + checklist
}
```

**Where to Use:**
- Claim review screen
- Before submission
- Dashboard summary

**Estimated Time:** 2-3 hours

---

### 3.4 "Validate All" Button

**Purpose:** Allow users to manually trigger validation of all documents

**Location:** Integrate into existing upload/session page

**Implementation:**
```typescript
function DocumentsPage({ sessionId }: { sessionId: string }) {
  const [validating, setValidating] = useState(false);

  async function handleValidateAll() {
    setValidating(true);

    try {
      const response = await fetch('/api/validation/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeSessionId: sessionId,
          runFullPipeline: false,
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Validated ${result.validated} documents`);
        refetch();
      }
    } finally {
      setValidating(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleValidateAll}
        disabled={validating}
        className="btn-primary"
      >
        {validating ? '⏳ Validating...' : 'Validate All Documents'}
      </button>

      {validating && <ValidationProgress sessionId={sessionId} />}

      <DocumentList sessionId={sessionId} />
    </div>
  );
}
```

**Where to Add:**
- Document list page (above document grid)
- Session review page
- Admin dashboard

**Estimated Time:** 1 hour

---

## 🛠️ Implementation Strategy

### Step 1: Create Base Components (2 hours)

1. Create `DocumentStatusBadge.tsx`
   - Basic badge with colors
   - Icon mapping for each status
   - Optional category/confidence display

2. Create `ValidationProgress.tsx`
   - Progress bar component
   - Document count display
   - Auto-refresh polling

### Step 2: Create Advanced Components (2 hours)

3. Create `ReadinessScore.tsx`
   - Circular score display
   - Status message
   - Checklist (if showDetails)

4. Add "Validate All" button
   - Find existing upload/session page
   - Integrate button + progress

### Step 3: Integration & Testing (2 hours)

5. Find upload components
   - Locate existing upload UI
   - Add `DocumentStatusBadge` to document list

6. Test all components
   - Upload document → see badge
   - Click "Validate All" → see progress
   - Check readiness → see score

---

## 📂 Suggested File Structure

```
src/components/validation/
├── DocumentStatusBadge.tsx     (NEW - status badge)
├── ValidationProgress.tsx       (NEW - progress bar)
├── ReadinessScore.tsx          (NEW - score display)
└── index.ts                    (NEW - exports)

src/lib/
└── validation-client.ts        (NEW - optional client helpers)
```

---

## 🎨 Design System

### Colors (Based on Status)

```typescript
const STATUS_COLORS = {
  PENDING: 'gray',
  PROCESSING: 'blue',
  VERIFIED: 'green',
  NEEDS_REVIEW: 'yellow',
  REJECTED: 'red',
};
```

### Icons

```typescript
const STATUS_ICONS = {
  PENDING: '⏳',
  PROCESSING: '🔄',
  VERIFIED: '✓',
  NEEDS_REVIEW: '⚠',
  REJECTED: '✗',
};
```

### Styling

Use existing component library (check `src/components/` for patterns):
- Likely using Tailwind CSS
- May have existing badge/progress components
- Follow existing design patterns

---

## 🔗 Integration Points

### 1. Upload Component

**Find:** `grep -r "uploadFile\|UploadFile" src/components src/app`
**Add:** `DocumentStatusBadge` next to each uploaded file

### 2. Document List

**Find:** `grep -r "uploadedFiles\|UploadedFile" src/components src/app`
**Add:** Status column with `DocumentStatusBadge`

### 3. Session/Review Page

**Find:** `grep -r "intakeSession\|session.*upload" src/app`
**Add:**
- "Validate All" button
- `ValidationProgress` during validation
- `ReadinessScore` at bottom

---

## 📋 Component Checklist

**DocumentStatusBadge:**
- [ ] Create component file
- [ ] Add status color mapping
- [ ] Add icon mapping
- [ ] Add category display
- [ ] Add confidence display
- [ ] Add size variants
- [ ] Test with all status types

**ValidationProgress:**
- [ ] Create component file
- [ ] Add progress bar
- [ ] Add document counts
- [ ] Add auto-refresh polling
- [ ] Add completion callback
- [ ] Test with different states

**ReadinessScore:**
- [ ] Create component file
- [ ] Add circular score display
- [ ] Add status message
- [ ] Add checklist view
- [ ] Add loading state
- [ ] Test with different scores

**Integration:**
- [ ] Add to upload UI
- [ ] Add to document list
- [ ] Add to session review
- [ ] Add "Validate All" button
- [ ] Test full flow

---

## 🧪 Testing Guide

### Manual Testing

1. **Upload + Validate:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Watch logs
# Terminal 3: Upload document via UI
```

2. **Verify Components:**
- Upload document → See badge appear
- Watch badge change: PENDING → PROCESSING → VERIFIED
- Click "Validate All" → See progress bar
- View readiness → See score

3. **Test Edge Cases:**
- Failed validation → Red badge
- Needs review → Yellow badge
- Multiple documents → Progress updates
- No documents → Empty state

---

## 💡 Example Prompt to Start Next Session

```
I'm continuing work on the RadiantClaims AI validation system.
The backend is complete (authentication + upload integration).

Please read:
- docs/ai-validation-refactor/SESSION_2_COMPLETE.md
- docs/ai-validation-refactor/NEXT_SESSION_PROMPT_V2.md

I want to build the frontend UI components:
1. DocumentStatusBadge - Show validation status
2. ValidationProgress - Show progress bar
3. ReadinessScore - Show completeness score
4. "Validate All" button

Current branch: service-tiers
```

---

## 📚 Reference Documentation

**API Endpoints:**
- Document validation: `POST /api/validation/document`
- Session validation: `POST /api/validation/session`
- Status check: `GET /api/validation/status/:sessionId`
- File retrieval: `GET /api/intake/upload/:id`

**Client Helpers:**
- `uploadFile()` - Upload file
- `getDocumentValidation()` - Get validation status
- `waitForValidation()` - Poll for results

**Data Types:**
```typescript
// Validation status
type ValidationStatus = 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';

// Document category
type Category = 'IDENTITY' | 'MEDICAL' | 'RESIDENCE' | 'EMPLOYMENT' | 'OTHER';

// Validation result
interface ValidationResult {
  status: ValidationStatus;
  category?: Category;
  confidence?: number;
  issues?: string[];
  extractedData?: Record<string, any>;
}
```

---

## 🚀 Quick Start Commands

```bash
# Ensure you're on the right branch
git checkout service-tiers
git pull origin service-tiers

# Verify backend is working
npx tsx scripts/test-orchestration.ts

# Start dev server
npm run dev

# In another terminal, create component directory
mkdir -p src/components/validation

# Create first component
touch src/components/validation/DocumentStatusBadge.tsx
```

---

## 🎯 Success Criteria

By the end of this session, you should have:

1. ✅ `DocumentStatusBadge` component created and working
2. ✅ `ValidationProgress` component created and working
3. ✅ `ReadinessScore` component created and working
4. ✅ "Validate All" button integrated
5. ✅ Components integrated into upload UI
6. ✅ Manual testing completed
7. ✅ All components committed and pushed

**Bonus:**
- [ ] Storybook stories for components
- [ ] Unit tests for components
- [ ] Responsive design
- [ ] Accessibility (a11y) compliance

---

## 🎨 UI/UX Considerations

### User Flow

1. **Upload Document:**
   - User uploads file
   - Badge shows "⏳ Pending"
   - Badge changes to "🔄 Validating..."
   - Badge shows final status: "✓ Verified (IDENTITY)"

2. **Validate All:**
   - User clicks "Validate All Documents"
   - Progress bar appears
   - Shows "8/12 (67%)" with live updates
   - Completes with toast notification

3. **Check Readiness:**
   - User scrolls to readiness widget
   - Sees circular score (e.g., 85/100)
   - Sees status message
   - Can expand to see checklist

### Error States

- **Validation fails:** Show red badge with retry button
- **API error:** Show error toast + fallback UI
- **No documents:** Show empty state with upload prompt
- **Timeout:** Show warning + manual retry option

---

## 📊 Component Hierarchy

```
Page (Upload/Session Review)
├── Header
├── "Validate All" Button
├── ValidationProgress (if validating)
├── Document List
│   └── DocumentCard
│       ├── Thumbnail
│       ├── Filename
│       └── DocumentStatusBadge
├── ReadinessScore
│   ├── Score Circle
│   ├── Status Message
│   └── Checklist (optional)
└── Actions
    └── Submit Button (enabled based on readiness)
```

---

**Good luck with the UI implementation! The backend is solid and ready.** 🚀

**Remember:**
- Use existing design patterns from the codebase
- Test each component individually
- Integrate incrementally
- Document as you go

---

**Session Prep Complete**
**Ready for:** UI Component Development
**Estimated Time:** 4-6 hours

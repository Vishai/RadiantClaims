# Next Session: Backend Data Integration

## 📋 Quick Start for Next Session

**Context:** The AI validation system is complete with backend APIs, authentication, upload integration, and frontend UI components. Now we need to connect the frontend to the backend by ensuring API endpoints return validation data.

**Branch:** `service-tiers`
**Status:** UI components complete, ready for data integration

---

## 🎯 Session Goal

Integrate validation data into existing API endpoints so the UI components can display real validation status.

**Estimated Time:** 1-2 hours

---

## 📖 Essential Reading (5 minutes)

Before starting, review these files:

1. **`SESSION_3_COMPLETE.md`** - What was built in session 3
2. **`UI_COMPONENTS.md`** - Component usage and data requirements
3. **`UPLOAD_INTEGRATION.md`** - How validation is triggered
4. **`API_ENDPOINTS.md`** - Validation API reference

**Quick Context:**
```bash
# Read session summary
cat docs/ai-validation-refactor/SESSION_3_COMPLETE.md

# Check current state
git status
git log --oneline -5
```

---

## 🔍 What's Already Done

### ✅ Backend (100% Complete - Sessions 1-2)

**Validation System:**
- ✅ All 7 AI agents implemented and tested
- ✅ Complete 3-phase validation pipeline
- ✅ 3 REST API endpoints with authentication
- ✅ Automatic validation on upload
- ✅ Background processing (non-blocking)

**API Endpoints:**
- ✅ `POST /api/validation/document` - Validate single document
- ✅ `POST /api/validation/session` - Validate session
- ✅ `GET /api/validation/status/:sessionId` - Check validation progress

**Database:**
- ✅ DocumentValidation table properly used
- ✅ Validation results stored correctly

### ✅ Frontend (100% Complete - Session 3)

**UI Components:**
- ✅ DocumentStatusBadge - Status display for individual documents
- ✅ ValidationProgress - Real-time progress tracking
- ✅ ReadinessScore - Completeness score display
- ✅ "Validate All" button in DocumentDashboard

**Integration:**
- ✅ DocumentCard displays validation badges
- ✅ DocumentListItem displays validation badges
- ✅ DocumentDashboard triggers validation

### ⏳ Missing: Data Connection

The UI components are ready, but they're not receiving validation data from the backend. We need to:

1. Update `/api/documents` to include validation data
2. Update `/api/intake/upload/:id` to return validation data
3. Test the full flow: upload → validate → display

---

## 🎯 What Needs to Be Done

### Task 1: Update `/api/documents` Endpoint (45 min)

**Goal:** Include validation data when fetching documents

**File:** `src/app/api/documents/route.ts`

**Current Response:**
```typescript
{
  files: [
    {
      id: "...",
      originalFilename: "...",
      category: "...",
      status: "...",
      // ... other fields
      aiIntelligence: { ... }
    }
  ]
}
```

**Needed Response:**
```typescript
{
  files: [
    {
      id: "...",
      originalFilename: "...",
      category: "...",
      status: "...",
      // ... other fields
      aiIntelligence: { ... },
      validation: {              // ← Add this
        status: "VERIFIED",
        category: "IDENTITY",
        confidence: 0.95
      }
    }
  ]
}
```

**Steps:**
1. Find the Prisma query in `/api/documents/route.ts`
2. Add `include: { validation: true }` to the query
3. Map the validation data to the response format
4. Handle cases where validation doesn't exist (return null)

**Example Implementation:**
```typescript
// In /api/documents/route.ts
const files = await prisma.uploadedFile.findMany({
  where: { intakeSessionId: sessionId },
  include: {
    validation: true,  // ← Add this
  },
});

// Map to response
const mappedFiles = files.map(file => ({
  ...file,
  validation: file.validation ? {
    status: file.validation.status,
    category: file.validation.category,
    confidence: file.validation.confidence,
  } : null,
}));
```

---

### Task 2: Update `/api/intake/upload/:id` Endpoint (30 min)

**Goal:** Return validation data after upload confirmation

**File:** `src/app/api/intake/upload/[id]/route.ts`

**Current GET Response:**
```typescript
{
  file: {
    id: "...",
    originalFilename: "...",
    status: "...",
    // ... other fields
  }
}
```

**Needed Response:**
```typescript
{
  file: {
    id: "...",
    originalFilename: "...",
    status: "...",
    // ... other fields
    validation: {              // ← Add this
      status: "PROCESSING",
      category: null,
      confidence: null
    }
  }
}
```

**Steps:**
1. Find the GET handler in `/api/intake/upload/[id]/route.ts`
2. Add `include: { validation: true }` to the Prisma query
3. Map the validation data to the response
4. After PATCH (upload confirmation), validation is triggered automatically

**Note:** The validation will be `PENDING` or `PROCESSING` immediately after upload since it runs in the background.

---

### Task 3: Test the Full Flow (15 min)

**Goal:** Verify validation data flows from backend to UI

**Test Steps:**

1. **Upload a document:**
   ```bash
   # Start dev server
   npm run dev

   # Navigate to document upload page
   # Upload a test document (e.g., driver's license)
   ```

2. **Check validation badge:**
   - After upload, badge should show "⏳ Pending" or "🔄 Validating..."
   - Badge should update automatically when validation completes

3. **Click "Validate All":**
   - Progress bar should appear
   - Shows "8/12 (67%)" with live updates
   - Completes with success message

4. **Check readiness score:**
   - Navigate to claim review page
   - Should display score circle (e.g., "85/100")
   - Shows checklist of required documents

**Expected Flow:**
```
Upload document
    ↓
Badge shows "PENDING"
    ↓
Validation runs (background)
    ↓
Badge updates to "PROCESSING"
    ↓
Validation completes
    ↓
Badge shows "VERIFIED" (green) with confidence %
```

---

## 🔧 Implementation Guide

### Step 1: Locate the Documents Endpoint

```bash
# Find the documents API
find src/app/api -name "route.ts" -path "*/documents/*"

# Look for the GET handler
grep -n "GET.*documents" src/app/api/documents/route.ts
```

### Step 2: Check Current Prisma Query

Look for:
```typescript
const files = await prisma.uploadedFile.findMany({
  where: { ... },
  include: {
    // Current includes
  },
});
```

### Step 3: Add Validation Include

```typescript
include: {
  validation: {
    select: {
      status: true,
      category: true,
      confidence: true,
    },
  },
  // ... other includes
},
```

### Step 4: Map Response

```typescript
const mappedFiles = files.map(file => ({
  ...file,
  validation: file.validation || null,
}));
```

### Step 5: Test with curl

```bash
# Test documents endpoint
curl http://localhost:3000/api/documents?sessionId=YOUR_SESSION_ID

# Should return validation data:
# {
#   "files": [
#     {
#       "id": "...",
#       "validation": {
#         "status": "VERIFIED",
#         "category": "IDENTITY",
#         "confidence": 0.95
#       }
#     }
#   ]
# }
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User uploads document                                           │
│ POST /api/intake/upload                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Confirm upload                                                  │
│ PATCH /api/intake/upload/:id                                    │
│ - validateDocument() triggered (background)                     │
│ - Returns file with validation: { status: "PENDING" }          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Frontend displays DocumentStatusBadge                           │
│ Badge shows: "⏳ Pending"                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ AI validation runs (background, async)                          │
│ - ClassifierAgent → categorize                                  │
│ - IdentityVerificationAgent → verify                            │
│ - Results saved to DocumentValidation table                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Validate All Documents"                            │
│ POST /api/validation/session                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ValidationProgress polls GET /api/validation/status/:sessionId  │
│ Shows: "8/12 (67%)" with live updates                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Frontend fetches updated documents                              │
│ GET /api/documents?sessionId=...                                │
│ - Includes validation data                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DocumentStatusBadge updates                                     │
│ Badge shows: "✓ Verified (95%)" (green)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] `/api/documents` returns validation data
- [ ] `/api/intake/upload/:id` GET returns validation
- [ ] Validation data is null for documents without validation
- [ ] All validation fields present (status, category, confidence)

### Frontend Testing
- [ ] DocumentStatusBadge displays correct status
- [ ] Badge updates when validation completes
- [ ] "Validate All" button triggers validation
- [ ] ValidationProgress shows live updates
- [ ] ReadinessScore displays correct score

### Integration Testing
- [ ] Upload → see "Pending" badge
- [ ] Validation runs → badge shows "Processing"
- [ ] Validation completes → badge shows "Verified"
- [ ] Click "Validate All" → progress bar appears
- [ ] Progress updates in real-time
- [ ] Readiness score calculates correctly

### Edge Cases
- [ ] Document without validation (should show null)
- [ ] Failed validation (should show "Failed" badge)
- [ ] Network error during validation
- [ ] Multiple validations running simultaneously

---

## 💡 Example Prompt to Start Next Session

```
I'm continuing work on the RadiantClaims AI validation system.
The backend and frontend UI are complete (Sessions 1-3).

Please read:
- docs/ai-validation-refactor/SESSION_3_COMPLETE.md
- docs/ai-validation-refactor/NEXT_SESSION_PROMPT_V3.md

I need to integrate validation data into API endpoints:
1. Update /api/documents to include validation data
2. Update /api/intake/upload/:id to return validation
3. Test the full upload → validate → display flow

Current branch: service-tiers
```

---

## 🔍 Key Files to Modify

### API Routes
```
src/app/api/
├── documents/
│   └── route.ts                     🔄 Add validation to response
└── intake/upload/
    └── [id]/
        └── route.ts                 🔄 Add validation to GET response
```

### Reference Files (Read-Only)
```
src/lib/ai-agents/
└── orchestration-service.ts         📖 How validation works

src/components/validation/
├── DocumentStatusBadge.tsx          📖 UI component
├── ValidationProgress.tsx           📖 UI component
└── ReadinessScore.tsx               📖 UI component

docs/ai-validation-refactor/
├── API_ENDPOINTS.md                 📖 API reference
└── UI_COMPONENTS.md                 📖 Component usage
```

---

## 📚 Quick Reference

### Validation Status Types

```typescript
type ValidationStatus =
  | "PENDING"        // Not yet processed
  | "PROCESSING"     // AI agents running
  | "VERIFIED"       // All checks passed
  | "NEEDS_REVIEW"   // Issues found
  | "STAFF_APPROVED" // Staff reviewed
  | "REJECTED"       // Failed validation
  | "ERROR"          // Processing error
```

### Document Category Types

```typescript
type DocumentCategory =
  | "IDENTITY"
  | "PROOF_OF_RESIDENCE"
  | "PATHOLOGY_REPORT"
  | "MEDICAL_RECORDS"
  | "DISCHARGE_SUMMARY"
  | "TUMOR_REGISTRY"
  | "TREATMENT_RECORDS"
  | "UTILITY_BILL"
  | "MORTGAGE_STATEMENT"
  | "TAX_RETURN"
  | "SCHOOL_RECORDS"
  | "EMPLOYMENT_RECORDS"
  | "OTHER"
```

### Response Format

```typescript
interface ValidationData {
  status: ValidationStatus;
  category?: DocumentCategory | null;
  confidence?: number | null;  // 0-1 scale
}

interface DocumentWithValidation {
  id: string;
  originalFilename: string;
  // ... other fields
  validation?: ValidationData | null;
}
```

---

## 🚀 Success Criteria

By the end of this session, you should have:

1. ✅ `/api/documents` endpoint returning validation data
2. ✅ `/api/intake/upload/:id` GET returning validation data
3. ✅ DocumentStatusBadge displaying real validation status
4. ✅ "Validate All" button working end-to-end
5. ✅ ValidationProgress showing live updates
6. ✅ ReadinessScore displaying actual scores
7. ✅ Full flow tested: upload → validate → display

**Bonus:**
- [ ] Add caching for validation status
- [ ] Add WebSocket for real-time updates
- [ ] Add analytics tracking for validation

---

## 🎨 UI Preview

After integration, users will see:

**1. Document List:**
```
┌──────────────────────────────────────┐
│ 📄 drivers-license.pdf               │
│ Identity · 2.1 MB · Nov 4, 2024      │
│ [✓ Verified · IDENTITY · 95%]       │
│ [View] [Download] [Delete]           │
└──────────────────────────────────────┘
```

**2. Validate All:**
```
┌──────────────────────────────────────┐
│ [✨ Validate All Documents]          │
│                                      │
│ [Spinner] Validating Documents...   │
│ [Progress Bar ████████░░░░] 8/12 67%│
│                                      │
│ ✓ Verified: 7                        │
│ 🔄 Processing: 1                     │
│ ⏳ Pending: 4                        │
└──────────────────────────────────────┘
```

**3. Readiness Score:**
```
┌──────────────────────────────────────┐
│ Claim Readiness                      │
│                                      │
│        ╭─────────╮                   │
│        │   85    │                   │
│        │  /100   │                   │
│        ╰─────────╯                   │
│                                      │
│ ✓ Your claim is ready for submission│
│                                      │
│ ✓ Identity documents verified        │
│ ✓ Residence proof verified           │
│ ✓ Medical records verified           │
│ ⚠ Employment verification needed     │
│                                      │
│ [Revalidate]                         │
└──────────────────────────────────────┘
```

---

## 💬 Common Issues & Solutions

### Issue 1: Validation data is null
**Cause:** Document hasn't been validated yet
**Solution:** Normal - badge should show "PENDING"

### Issue 2: Validation stuck in PROCESSING
**Cause:** Background job may have failed
**Solution:** Check server logs, retry validation

### Issue 3: TypeScript errors on validation field
**Cause:** Interface doesn't include validation
**Solution:** Add `validation?: { ... } | null` to interface

### Issue 4: Badge doesn't update
**Cause:** Frontend not refetching after validation
**Solution:** Call `refetch()` or `loadDocuments()` after validation

---

**Session Prep Complete**
**Ready for:** Backend Data Integration
**Estimated Time:** 1-2 hours
**Branch:** `service-tiers`

---

## 🎯 Alternative: ReadinessScore API Integration

If you prefer to focus on the ReadinessScore first (instead of document list), you can:

1. Skip updating `/api/documents` and `/api/intake/upload/:id`
2. Focus on testing the ReadinessScore component
3. Trigger full pipeline validation: `runFullPipeline: true`
4. Verify completeness check runs correctly

This is a good approach if you want to see the completeness orchestrator in action first.

---

**Good luck with the integration! The backend is solid and ready.** 🚀

# AI Assessment Tab Implementation

**Date:** January 2025
**Status:** ✅ Complete

## Overview

Implemented a comprehensive AI Assessment Tab in the document intelligence modal that prominently displays when the AI's category detection differs from the user's selection, providing accept/reject controls for AI recategorization suggestions.

## Problem Statement

Previously, when users uploaded documents with incorrect category labels (e.g., labeling a pathology report as "School Records"), the AI would auto-correct the category silently without prominent user notification. This led to:
- Confusion about why categories were changing
- Lack of transparency in AI decision-making
- No opportunity for users to accept or reject AI suggestions

## Solution

Created a dedicated "AI Assessment" tab in the document intelligence modal that:
1. **Prominently alerts** when there's a category mismatch between user selection and AI detection
2. **Provides accept/reject controls** for AI recategorization suggestions
3. **Shows detailed AI reasoning** including confidence scores and alternative categories
4. **Displays heuristic pattern detection** when rule-based signals are found
5. **Adds a warning badge** to document cards when category mismatch exists

## Implementation Details

### 1. AI Assessment Tab Component

**File:** `src/components/documents/intelligence/AIAssessmentTab.tsx`

**Key Features:**
- **Category Mismatch Alert**: Prominent destructive alert when user label ≠ AI detection
- **Accept/Reject Buttons**:
  - "Accept AI Suggestion" - Updates category to AI-detected value with `categoryLocked: true` and `source: 'ai_accepted'`
  - "Keep My Label" - Confirms user's original selection with `categoryLocked: true` and `source: 'user_confirmed'`
- **AI Classification Analysis Card**: Shows AI's suggested category, confidence level (with color-coded progress bar), reasoning, and alternative categories
- **Heuristic Pattern Detection Card**: Displays rule-based classification signals found in the document
- **Category Decision Summary**: Shows user selection, final category, auto-correction status, and lock status

**API Integration:**
```typescript
const handleAcceptAICategory = async () => {
  const response = await fetch(`/api/documents/${documentId}/category`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: categoryMismatch.aiDetected,
      categoryLocked: true,
      source: 'ai_accepted',
    }),
  });

  if (response.ok) {
    router.refresh();
    window.location.reload();
  }
};
```

### 2. Category Update API Endpoint

**File:** `src/app/api/documents/[id]/category/route.ts`

**Functionality:**
- PATCH endpoint for updating document category
- Authentication check via `getServerAuthSession()`
- Authorization check (user must own file or be admin/attorney)
- Updates both `category` field and `metadata.categoryInsights`
- Tracks category source (`ai_accepted`, `user_confirmed`, `user_manual`)
- Records `categoryUpdatedAt` timestamp and `categoryUpdatedBy` user ID

**Request Body:**
```typescript
{
  category: string;           // New category value
  categoryLocked: boolean;    // Whether to lock the category
  source: string;            // 'ai_accepted' | 'user_confirmed' | 'user_manual'
}
```

**Response:**
```typescript
{
  success: boolean;
  file: UploadedFile;  // Updated file object
}
```

### 3. Modal Integration

**File:** `src/components/documents/AIIntelligenceModal.tsx`

**Changes:**
- Added import for `AIAssessmentTab` component
- Updated `TabsList` from `grid-cols-6` to `grid-cols-7`
- Added "AI Assessment" tab trigger with Brain icon
- Added responsive text (hidden on small screens)
- Added `TabsContent` for ai-assessment tab
- Passed `documentId` prop to AIAssessmentTab

**Tab Order:**
1. Overview
2. **AI Assessment** (NEW)
3. Entities
4. Quality
5. Compliance
6. Risks
7. Provenance

### 4. Category Mismatch Warning Badge

**File:** `src/components/documents/DocumentCard.tsx`

**Changes:**
- Added `AlertTriangle` import from lucide-react
- Added category mismatch badge when `qualification?.categoryMismatch` exists
- Badge features:
  - Red color scheme (`border-red-300 bg-red-50 text-red-700`)
  - `animate-pulse` animation to draw attention
  - AlertTriangle icon
  - "Mismatch" label

**Badge Display Logic:**
```typescript
{qualification?.categoryMismatch && (
  <Badge
    variant="outline"
    className="border-red-300 bg-red-50 text-red-700 animate-pulse"
  >
    <AlertTriangle className="mr-1 h-3 w-3" />
    Mismatch
  </Badge>
)}
```

### 5. Intelligence Response Type Updates

**File:** `src/app/api/documents/[id]/intelligence/route.ts`

**Updated Interface:**
```typescript
export interface IntelligenceResponse {
  // ... existing fields
  categoryInsights?: {
    userSelectedCategory?: string;
    aiCategorization?: {
      suggestedCategory: string;
      confidence: number;
      reasoning?: string;
      alternatives?: Array<{ category: string; confidence: number }>;
    };
    heuristicReason?: string;
    heuristicSignals?: string[];
    finalCategory?: string;
    autoCorrected?: boolean;
    autoCorrectionSource?: string;
    categoryLocked?: boolean;
  };
}
```

**Response Building:**
- Added `categoryInsights: metadata.categoryInsights` to response object
- Ensures frontend has access to all category decision metadata

## User Flow

### When Category Mismatch Exists:

1. **Document Card View:**
   - Red pulsing "Mismatch" badge appears on document card
   - User clicks "AI Intelligence" button to see details

2. **AI Intelligence Modal:**
   - Modal opens with 7 tabs
   - User clicks "AI Assessment" tab (2nd tab)

3. **AI Assessment Tab:**
   - **Prominent Alert** shows at top:
     ```
     ⚠️ Category Mismatch Detected

     You labeled as: [School Records] → AI detected: [Medical Records] (95% confidence)

     [Explanation text from AI]

     [✓ Accept AI Suggestion]  [✗ Keep My Label]
     ```

   - **AI Classification Analysis Card:**
     - Shows suggested category
     - Confidence bar (green if >80%, yellow if >60%, red if <60%)
     - AI reasoning text
     - Alternative categories with confidence scores

   - **Category Decision Summary:**
     - User Selection: School Records
     - Final Category: Medical Records (if auto-corrected)
     - Auto-Corrected: Yes/No
     - Category Locked: Yes/No

4. **User Action:**
   - **If user clicks "Accept AI Suggestion":**
     - PATCH request to `/api/documents/${id}/category`
     - Category updated to AI-detected value
     - `categoryLocked: true`, `source: 'ai_accepted'`
     - Page reloads, mismatch badge disappears

   - **If user clicks "Keep My Label":**
     - PATCH request to `/api/documents/${id}/category`
     - Category confirmed as user's original selection
     - `categoryLocked: true`, `source: 'user_confirmed'`
     - Page reloads, mismatch badge disappears

### When No Mismatch:

- "Category Confirmed" green alert shows if category is locked
- "Auto-Corrected by AI" blue alert shows if AI corrected it
- AI Classification Analysis card still displays for transparency
- No accept/reject buttons (not needed)

## Data Flow

```
User uploads document with category selection
        ↓
Document processing pipeline runs
        ↓
AI categorization analyzes document
        ↓
Category mismatch detected (user ≠ AI)
        ↓
metadata.categoryInsights populated:
  - userSelectedCategory
  - aiCategorization (suggested, confidence, reasoning)
  - heuristicReason
  - finalCategory
        ↓
metadata.compliance.documentQualification.categoryMismatch populated:
  - userSelected
  - aiDetected
  - aiConfidence
  - shouldUseAiCategory
  - explanation
        ↓
Frontend fetches /api/documents/[id]/intelligence
        ↓
IntelligenceResponse includes categoryInsights
        ↓
DocumentCard shows pulsing "Mismatch" badge
        ↓
User opens AI Intelligence modal
        ↓
AIAssessmentTab renders with accept/reject controls
        ↓
User clicks Accept or Reject
        ↓
PATCH /api/documents/[id]/category
        ↓
Database updated with new category + metadata
        ↓
Page reloads, mismatch resolved
```

## Testing

### Manual Testing Steps:

1. **Login** with test user (user1@radiantclaims.dev / Password123!)

2. **Upload Document** with incorrect category:
   - Upload a pathology report (medical document)
   - Select "School Records" as category
   - Submit upload

3. **Verify Mismatch Badge:**
   - Check document card has red pulsing "Mismatch" badge
   - Badge should have AlertTriangle icon

4. **Open AI Intelligence Modal:**
   - Click "AI Intelligence" button (Sparkles icon)
   - Modal opens with 7 tabs

5. **Navigate to AI Assessment Tab:**
   - Click "AI Assessment" tab (2nd tab, Brain icon)
   - Should see category mismatch alert

6. **Test Accept AI Suggestion:**
   - Click "Accept AI Suggestion" button
   - Should see "Accepting..." loading state
   - Page should reload
   - Document category should change to AI-detected value
   - Mismatch badge should disappear

7. **Test Keep My Label:**
   - Upload another mismatched document
   - Click "Keep My Label" button
   - Should see "Confirming..." loading state
   - Page should reload
   - Document category should remain user's selection
   - Mismatch badge should disappear
   - Category should be locked

### Edge Cases Tested:

- ✅ No category mismatch (shows "Category Confirmed" or auto-correct info)
- ✅ Category locked prevents further changes
- ✅ Authorization check (users can't modify other users' documents)
- ✅ Missing categoryInsights data (gracefully handles undefined)
- ✅ Responsive design (tab labels abbreviate on mobile)

## Files Modified

1. **`src/components/documents/intelligence/AIAssessmentTab.tsx`** - NEW
   - Complete AI assessment tab component with accept/reject functionality

2. **`src/app/api/documents/[id]/category/route.ts`** - NEW
   - PATCH endpoint for updating document category

3. **`src/components/documents/AIIntelligenceModal.tsx`** - MODIFIED
   - Added 7th tab for AI Assessment
   - Updated grid layout
   - Added responsive tab labels

4. **`src/components/documents/DocumentCard.tsx`** - MODIFIED
   - Added category mismatch warning badge
   - Added AlertTriangle icon import

5. **`src/app/api/documents/[id]/intelligence/route.ts`** - MODIFIED
   - Updated IntelligenceResponse interface to include categoryInsights
   - Added categoryInsights to response object

## TypeScript Types

### IntelligenceResponse (Extended)
```typescript
categoryInsights?: {
  userSelectedCategory?: string;
  aiCategorization?: {
    suggestedCategory: string;
    confidence: number;
    reasoning?: string;
    alternatives?: Array<{ category: string; confidence: number }>;
  };
  heuristicReason?: string;
  heuristicSignals?: string[];
  finalCategory?: string;
  autoCorrected?: boolean;
  autoCorrectionSource?: string;
  categoryLocked?: boolean;
};
```

### AIAssessmentTabProps
```typescript
interface AIAssessmentTabProps {
  data: IntelligenceResponse;
  documentId: string;
}
```

### CategoryMismatch (from DocumentQualification)
```typescript
categoryMismatch?: {
  userSelected: string;
  aiDetected: string;
  aiConfidence: number;
  shouldUseAiCategory: boolean;
  explanation: string;
};
```

## Security Considerations

1. **Authentication Required:**
   - All category update requests require valid session
   - `getServerAuthSession()` validates user

2. **Authorization Checks:**
   - Users can only modify their own documents
   - Admins and attorneys can modify any documents
   - Check: `file.intakeSession?.claim?.userId === session.user.id`

3. **CSRF Protection:**
   - Next.js API routes automatically protected via same-origin policy

4. **Input Validation:**
   - Category field required
   - Source field tracked for audit trail

## Performance Considerations

1. **SWR Caching:**
   - Intelligence data cached client-side
   - `revalidateOnFocus: false` prevents unnecessary refetches

2. **Optimistic UI:**
   - Shows loading states ("Accepting...", "Confirming...")
   - User feedback during async operations

3. **Lazy Loading:**
   - Modal content only loaded when opened
   - Tab content conditionally rendered

## Future Enhancements

1. **Batch Category Updates:**
   - Allow accepting/rejecting multiple mismatches at once
   - Useful for bulk uploads

2. **Category Learning:**
   - Track user accept/reject patterns
   - Improve AI categorization over time

3. **Confidence Threshold Settings:**
   - Allow users to set minimum confidence for auto-correction
   - Configurable per organization

4. **Notification System:**
   - Email notifications when category mismatches detected
   - Dashboard for pending category reviews

5. **Analytics Dashboard:**
   - Track mismatch rate by document type
   - Monitor AI accuracy over time
   - User acceptance rate of AI suggestions

## Success Metrics

- ✅ Category mismatch prominently visible (pulsing red badge)
- ✅ Accept/reject controls accessible and functional
- ✅ AI reasoning clearly displayed with confidence scores
- ✅ User action tracked in database (source field)
- ✅ Category locking prevents accidental changes
- ✅ Responsive design works on mobile and desktop

## Conclusion

The AI Assessment Tab implementation successfully addresses the user's concern about transparent AI category validation. Users now have:

1. **Clear visibility** into AI's category assessment
2. **Control** over accepting or rejecting AI suggestions
3. **Transparency** into AI's reasoning and confidence
4. **Visual indicators** (warning badges) when attention needed
5. **Audit trail** of category changes with source tracking

This creates a collaborative human-AI workflow where the AI assists but the user remains in control.

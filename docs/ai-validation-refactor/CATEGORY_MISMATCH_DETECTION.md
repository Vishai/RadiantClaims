# Category Mismatch Detection

**Date:** November 4, 2024
**Branch:** `service-tiers`
**Status:** ✅ Complete

---

## 🎯 Problem Statement

Users can manually select a document category (e.g., "Tax Return"), but the AI might detect it as something else (e.g., "Pathology Report"). Without mismatch detection:

- User mistakes go unnoticed
- Documents are incorrectly categorized
- Claims might be rejected due to missing required documents

**Example from real screenshot:**
- User selected: **Tax Return**
- Actual document: **PATHOLOGY REPORT** (literally in the document header)
- Result: Document incorrectly counted as residence proof instead of medical proof

---

## ✅ Solution: Category Mismatch Detection

The validation system now compares the user-selected category with the AI-detected category and flags mismatches based on confidence level.

### Three Scenarios

#### Scenario 1: High Confidence Mismatch (≥75%)
**Action:** Flag for review with `NEEDS_REVIEW` status
**Badge:** ⚠️ Yellow "Needs Review"
**User sees:** Warning message to review the category

**Example:**
```
User selected: Tax Return
AI detected: Pathology Report (92% confidence)
→ Status: NEEDS_REVIEW
→ Warning: "AI detected this as 'Pathology Report' with 92% confidence,
            but you selected 'Tax Return'. Please review the category."
```

#### Scenario 2: Low Confidence Mismatch (<75%)
**Action:** Just inform, keep `VERIFIED` status
**Badge:** ✓ Green "Verified"
**User sees:** Info message about AI suggestion

**Example:**
```
User selected: Medical Records
AI detected: Treatment Records (65% confidence)
→ Status: VERIFIED
→ Info: "AI suggested 'Treatment Records' (65% confidence),
        but you selected 'Medical Records'. Your selection has been kept."
```

#### Scenario 3: Category Locked
**Action:** Just inform, respect user's lock, keep `VERIFIED` status
**Badge:** ✓ Green "Verified" with 🔒 lock icon
**User sees:** Info message that category is locked

**Example:**
```
User selected: Tax Return (LOCKED)
AI detected: Utility Bill (88% confidence)
→ Status: VERIFIED
→ Info: "Category locked as 'Tax Return'. AI detected this as 'Utility Bill'
        with 88% confidence, but respecting your selection."
```

---

## 📝 Implementation

### Change 1: Extended AgentExecutionContext

**File:** `src/lib/ai-agents/base-agent.ts`

Added two new fields to the context:

```typescript
export interface AgentExecutionContext {
  uploadedFileId?: string;
  intakeSessionId?: string;
  documentUrl: string;
  documentText?: string;
  userSelectedCategory?: string;  // ← NEW: User's manual selection
  categoryLocked?: boolean;       // ← NEW: Whether user locked it
  metadata?: Record<string, unknown>;
}
```

**Location:** `src/lib/ai-agents/base-agent.ts:12-20`

---

### Change 2: Pass User Category to Validation

**File:** `src/lib/ai-agents/orchestration-service.ts`

Updated context building to include user selection:

```typescript
// Build agent execution context
const context: AgentExecutionContext = {
  uploadedFileId,
  intakeSessionId: file.intakeSessionId,
  documentUrl: file.fileKey,
  documentText: file.ocrText || undefined,
  userSelectedCategory: file.category || undefined,  // ← NEW
  categoryLocked: file.categoryLocked || false,      // ← NEW
  metadata: {},
};
```

**Location:** `src/lib/ai-agents/orchestration-service.ts:106-114`

---

### Change 3: Mismatch Detection Logic

**File:** `src/lib/ai-agents/orchestration-service.ts`

Added detection logic after classification:

```typescript
// Step 1: Classify the document
const classifierAgent = new ClassifierAgent();
const classificationResult = await classifierAgent.execute(context);
const aiCategory = classificationResult.data.category;

// Step 1.5: Check for category mismatch
let finalStatus: 'VERIFIED' | 'NEEDS_REVIEW' = 'VERIFIED';
const warnings: Array<{
  code: string;
  message: string;
  severity: 'WARNING' | 'INFO';
}> = [];

if (context.userSelectedCategory && context.userSelectedCategory !== aiCategory) {
  const userCategoryFormatted = formatCategoryName(context.userSelectedCategory);
  const aiCategoryFormatted = formatCategoryName(aiCategory);
  const confidence = classificationResult.confidence;

  if (context.categoryLocked) {
    // User has locked the category - just warn, don't change status
    warnings.push({
      code: 'CATEGORY_MISMATCH_LOCKED',
      message: `Category locked as "${userCategoryFormatted}". AI detected this as "${aiCategoryFormatted}" with ${Math.round(confidence * 100)}% confidence, but respecting your selection.`,
      severity: 'INFO',
    });
    console.log(`⚠️  Category mismatch (locked): User="${context.userSelectedCategory}", AI="${aiCategory}"`);
  } else if (confidence >= 0.75) {
    // High confidence mismatch - flag for review
    warnings.push({
      code: 'CATEGORY_MISMATCH_HIGH_CONFIDENCE',
      message: `AI detected this as "${aiCategoryFormatted}" with ${Math.round(confidence * 100)}% confidence, but you selected "${userCategoryFormatted}". Please review the category.`,
      severity: 'WARNING',
    });
    finalStatus = 'NEEDS_REVIEW';
    console.log(`⚠️  Category mismatch (high confidence): User="${context.userSelectedCategory}", AI="${aiCategory}" (${Math.round(confidence * 100)}%)`);
  } else {
    // Low confidence mismatch - just inform
    warnings.push({
      code: 'CATEGORY_MISMATCH_LOW_CONFIDENCE',
      message: `AI suggested "${aiCategoryFormatted}" (${Math.round(confidence * 100)}% confidence), but you selected "${userCategoryFormatted}". Your selection has been kept.`,
      severity: 'INFO',
    });
    console.log(`ℹ️  Category mismatch (low confidence): User="${context.userSelectedCategory}", AI="${aiCategory}" (${Math.round(confidence * 100)}%)`);
  }
}

// Use AI category for validation agent routing
const category = aiCategory;
```

**Location:** `src/lib/ai-agents/orchestration-service.ts:116-163`

**Key Decision:** We route to validation agents based on the **AI category**, not the user category. This ensures proper validation even if the user is wrong.

---

### Change 4: Store Warnings in Database

**File:** `src/lib/ai-agents/orchestration-service.ts`

Updated database storage to include warnings:

```typescript
// Mark document validation as complete with appropriate status
await db.documentValidation.update({
  where: { uploadedFileId },
  data: {
    status: finalStatus,              // ← VERIFIED or NEEDS_REVIEW
    warnings: warnings.length > 0 ? warnings : [],  // ← Store warnings
    processingCompletedAt: new Date(),
  },
});
```

**Location:** `src/lib/ai-agents/orchestration-service.ts:207-215`

---

### Change 5: Helper Function

**File:** `src/lib/ai-agents/orchestration-service.ts`

Added category name formatter:

```typescript
/**
 * Helper to format category names for display
 */
function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

**Examples:**
- `PATHOLOGY_REPORT` → `Pathology Report`
- `TAX_RETURN` → `Tax Return`
- `IDENTITY` → `Identity`

**Location:** `src/lib/ai-agents/orchestration-service.ts:26-34`

---

## 🔄 Flow Diagram

```
User uploads document
     ↓
User selects category: "Tax Return"
     ↓
Validation triggered
     ↓
ClassifierAgent analyzes document
     ↓
AI detects: "Pathology Report" (92% confidence)
     ↓
┌────────────────────────────────┐
│ Compare user vs AI category    │
└────────────────────────────────┘
     ↓
  Mismatch found!
     ↓
┌────────────────────────────────┐
│ Check if category is locked    │
└────────────────────────────────┘
     ↓         ↓
   LOCKED   NOT LOCKED
     ↓         ↓
     │    ┌──────────────────┐
     │    │ Check confidence │
     │    └──────────────────┘
     │         ↓         ↓
     │       ≥75%      <75%
     │         ↓         ↓
     │    NEEDS_REVIEW  VERIFIED
     │         ↓         ↓
     └─────┬───┴─────────┘
           ↓
   Store warning in database
           ↓
   Display badge with status
           ↓
   User sees warning message ⚠️
```

---

## 📊 Status Determination Logic

### Decision Tree

```
Is there a user-selected category?
  NO  → Status: VERIFIED (no mismatch possible)
  YES → Continue ↓

Does user category match AI category?
  YES → Status: VERIFIED (perfect match)
  NO  → Continue ↓

Is category locked?
  YES → Status: VERIFIED, Severity: INFO (respect user)
  NO  → Continue ↓

Is AI confidence ≥ 75%?
  YES → Status: NEEDS_REVIEW, Severity: WARNING (likely error)
  NO  → Status: VERIFIED, Severity: INFO (uncertain, keep user choice)
```

---

## 🎨 UI Display

### Badge Colors

| Status | Badge | Color | Icon |
|--------|-------|-------|------|
| VERIFIED | ✓ Verified | Green | CheckCircle |
| NEEDS_REVIEW | ⚠ Needs Review | Yellow | AlertCircle |
| VERIFIED (Locked) | ✓ Verified 🔒 | Green | CheckCircle + Lock |

### Warning Messages

**High Confidence Mismatch:**
```
⚠️ AI detected this as "Pathology Report" with 92% confidence,
   but you selected "Tax Return". Please review the category.
```

**Low Confidence Mismatch:**
```
ℹ️ AI suggested "Treatment Records" (65% confidence),
   but you selected "Medical Records". Your selection has been kept.
```

**Locked Mismatch:**
```
🔒 Category locked as "Tax Return". AI detected this as "Utility Bill"
   with 88% confidence, but respecting your selection.
```

---

## 🧪 Testing Scenarios

### Test Case 1: High Confidence Mismatch

**Setup:**
1. Upload a pathology report PDF
2. Manually select category: "Tax Return"
3. Trigger validation

**Expected:**
- AI classifies as: "Pathology Report" (confidence: 92%)
- Status: `NEEDS_REVIEW`
- Badge: ⚠️ Yellow "Needs Review"
- Warning stored in database
- Console log: `⚠️  Category mismatch (high confidence): User="TAX_RETURN", AI="PATHOLOGY_REPORT" (92%)`

---

### Test Case 2: Low Confidence Mismatch

**Setup:**
1. Upload an ambiguous medical document
2. Manually select category: "Medical Records"
3. Trigger validation

**Expected:**
- AI classifies as: "Treatment Records" (confidence: 68%)
- Status: `VERIFIED`
- Badge: ✓ Green "Verified"
- Info message stored in database
- Console log: `ℹ️  Category mismatch (low confidence): User="MEDICAL_RECORDS", AI="TREATMENT_RECORDS" (68%)`

---

### Test Case 3: Locked Category

**Setup:**
1. Upload a utility bill PDF
2. Manually select category: "Tax Return"
3. **Lock the category** (toggle lock icon)
4. Trigger validation

**Expected:**
- AI classifies as: "Utility Bill" (confidence: 95%)
- Status: `VERIFIED`
- Badge: ✓ Green "Verified" with 🔒 icon
- Info message stored in database
- Console log: `⚠️  Category mismatch (locked): User="TAX_RETURN", AI="UTILITY_BILL"`

---

### Test Case 4: Perfect Match

**Setup:**
1. Upload a driver's license image
2. Manually select category: "Identity"
3. Trigger validation

**Expected:**
- AI classifies as: "Identity" (confidence: 98%)
- Status: `VERIFIED`
- Badge: ✓ Green "Verified"
- No warnings
- No mismatch logs

---

### Test Case 5: No User Selection

**Setup:**
1. Upload a document without selecting a category
2. Trigger validation (automatic)

**Expected:**
- AI classifies as: "Pathology Report" (confidence: 92%)
- Status: `VERIFIED`
- Badge: ✓ Green "Verified"
- No warnings (no mismatch possible)
- Category auto-set to AI detection

---

## 🔍 Monitoring

### Console Logs

**Success indicators:**
```bash
# High confidence mismatch
⚠️  Category mismatch (high confidence): User="TAX_RETURN", AI="PATHOLOGY_REPORT" (92%)

# Low confidence mismatch
ℹ️  Category mismatch (low confidence): User="MEDICAL_RECORDS", AI="TREATMENT_RECORDS" (68%)

# Locked category
⚠️  Category mismatch (locked): User="TAX_RETURN", AI="UTILITY_BILL"
```

### Database Queries

**Check documents with mismatches:**
```sql
SELECT
  uf.id,
  uf.category AS user_category,
  dv.classifierResult->>'data'->>'category' AS ai_category,
  dv.status,
  dv.warnings
FROM "UploadedFile" uf
JOIN "DocumentValidation" dv ON dv.uploadedFileId = uf.id
WHERE jsonb_array_length(dv.warnings) > 0;
```

**Count by mismatch type:**
```sql
SELECT
  jsonb_array_elements(warnings)->>'code' AS warning_code,
  COUNT(*) as count
FROM "DocumentValidation"
WHERE jsonb_array_length(warnings) > 0
GROUP BY warning_code;
```

---

## 📈 Metrics to Track

1. **Mismatch Rate:** % of documents where user category ≠ AI category
2. **High Confidence Mismatch Rate:** % flagged as NEEDS_REVIEW
3. **Locked Category Rate:** % of mismatches where user locked the category
4. **User Correction Rate:** % of users who change category after NEEDS_REVIEW

**Target Metrics:**
- Overall Mismatch Rate: < 10%
- High Confidence Mismatch Rate: < 5%
- User Correction Rate (after NEEDS_REVIEW): > 80%

---

## 🎯 Benefits

### For Users
1. **Catches mistakes:** Alerts when they select the wrong category
2. **Builds confidence:** Shows AI validation agrees with their selection
3. **Flexibility:** Can override AI if needed (lock feature)

### For Staff
1. **Reduces errors:** Fewer incorrectly categorized documents
2. **Faster review:** High-confidence mismatches are pre-flagged
3. **Better data:** Tracks category confusion patterns

### For Claims
1. **Accuracy:** Documents categorized correctly
2. **Completeness:** Required documents not missed due to miscategorization
3. **Compliance:** Proper document validation for submissions

---

## 🔮 Future Enhancements

1. **Auto-correct low confidence:** Automatically use AI category when confidence is very high (>95%)
2. **Learning from corrections:** Track when users override AI to improve model
3. **Category suggestions:** Show AI's top 3 category suggestions in UI
4. **Batch recategorization:** Allow staff to review all mismatches at once
5. **Analytics dashboard:** Visualize mismatch patterns across users

---

## 🐛 Troubleshooting

### Issue: All documents showing NEEDS_REVIEW

**Cause:** AI classifier might be overly confident or user is systematically choosing wrong categories

**Solution:**
- Check AI confidence threshold (currently 75%)
- Review user's category selections
- Check if categories in dropdown match Prisma enum

### Issue: Warnings not displaying in UI

**Cause:** Frontend not reading warnings field from API

**Solution:**
- Check if `/api/documents` returns warnings
- Verify DocumentStatusBadge component shows warning tooltip
- Check browser console for errors

### Issue: Category mismatch not detected

**Cause:** User category or AI category might be undefined

**Solution:**
- Add console logs to verify both categories are set
- Check if file.category is populated
- Verify ClassifierAgent returns valid category

---

## 📝 Summary

**What was added:**
- ✅ Category mismatch detection logic
- ✅ Three-tier warning system (locked, high confidence, low confidence)
- ✅ Status changes based on mismatch severity
- ✅ Warning storage in database
- ✅ Formatted user-friendly messages

**Files modified:**
- `src/lib/ai-agents/base-agent.ts` (context interface)
- `src/lib/ai-agents/orchestration-service.ts` (detection logic)

**Testing status:**
- ✅ TypeScript compilation passing
- ⏳ Manual testing pending

**Next steps:**
- Test with real documents
- Verify UI displays warnings
- Monitor mismatch rates

---

**Status:** ✅ Complete and ready for testing
**Impact:** High - Significantly improves document categorization accuracy

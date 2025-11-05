# AI Validation System - Testing Guide

**Last Updated:** November 4, 2024
**Branch:** `service-tiers`
**Status:** Ready for Testing

---

## 🎯 Quick Start

This guide will help you test the complete AI validation system from upload to display.

---

## 🛠️ Prerequisites

### 1. Environment Setup

Make sure you have the required environment variables:

```bash
# Check .env file
cat .env | grep -E "(DATABASE_URL|OPENAI_API_KEY|ANTHROPIC_API_KEY)"
```

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - For AI validation

### 2. Database Setup

```bash
# Apply migrations
npx prisma migrate dev

# Check tables exist
npx prisma studio
# Look for: UploadedFile, DocumentValidation tables
```

### 3. Start Dev Server

```bash
npm run dev
# Server should start on http://localhost:3000
```

---

## 📋 Test Plan

### Test 1: Upload Document with Automatic Validation ✅

**Goal:** Verify that documents are automatically validated after upload

**Steps:**
1. Navigate to document upload page
2. Upload a test document (e.g., driver's license PDF)
3. Confirm upload
4. Check that validation badge appears

**Expected Results:**
- Document uploads successfully
- Badge shows "⏳ Pending" or "🔄 Validating..."
- After ~5-30 seconds, badge updates to "✓ Verified" (green)

**What to Check:**
- Badge displays correct status
- Badge shows category (e.g., "IDENTITY")
- Badge shows confidence percentage (e.g., "95%")

**Screenshot Location:** Document list with validation badge

---

### Test 2: "Validate All Documents" Flow ✅

**Goal:** Verify batch validation works correctly

**Steps:**
1. Upload 3-5 documents of different types
2. Click "Validate All Documents" button (purple button with ✨ icon)
3. Watch the progress bar

**Expected Results:**
- Progress bar appears immediately
- Shows document counts: "8/12 (67%)"
- Updates every 2 seconds
- Completes with success message
- Document badges update automatically

**What to Check:**
- Progress bar shows accurate counts
- Verified count increases
- Processing count decreases
- Pending count decreases
- Final state: All documents verified or needs review

**Screenshot Location:** Progress bar during validation

---

### Test 3: Document List with Validation Badges ✅

**Goal:** Verify that document list displays validation status

**Steps:**
1. Navigate to document list page
2. Look at each document card
3. Check validation badge display

**Expected Results:**
- Each document shows validation badge
- Verified documents: Green badge with ✓ icon
- Processing documents: Blue badge with spinner
- Pending documents: Gray badge with clock
- Failed documents: Red badge with X icon

**What to Check:**
- Badge color matches status
- Icon is correct
- Category displayed (optional)
- Confidence percentage displayed for verified docs

**Screenshot Location:** Document list with multiple badges

---

### Test 4: Readiness Score Display ✅

**Goal:** Verify claim readiness score calculation

**Steps:**
1. Navigate to claim review page
2. Look for "Claim Readiness" section
3. Check the readiness score circle

**Expected Results:**
- Score displayed (0-100)
- Color-coded: Green (≥80), Yellow (60-79), Red (<60)
- Status message: "Ready for submission" or "More documents needed"
- Document checklist shows required documents
- Critical blockers highlighted in red
- Warnings highlighted in yellow

**What to Check:**
- Score is accurate based on validated documents
- Checklist includes all required document types
- Missing documents are flagged
- Recommendations are actionable

**Screenshot Location:** Claim review page with readiness score

---

### Test 5: API Endpoint Testing 🔧

**Goal:** Verify API endpoints return correct validation data

#### Test 5.1: GET /api/documents

```bash
# Replace SESSION_ID with your session ID
curl "http://localhost:3000/api/documents?sessionId=SESSION_ID" | jq
```

**Expected Response:**
```json
{
  "files": [
    {
      "id": "cm2abcd1234",
      "originalFilename": "drivers-license.pdf",
      "status": "READY",
      "validation": {
        "status": "VERIFIED",
        "category": "IDENTITY",
        "confidence": 0.95
      }
    }
  ]
}
```

**What to Check:**
- `validation` field exists for each file
- `status` is one of: PENDING, PROCESSING, VERIFIED, NEEDS_REVIEW, REJECTED
- `category` matches document type
- `confidence` is between 0 and 1

---

#### Test 5.2: GET /api/validation/status/:sessionId

```bash
# Replace SESSION_ID with your session ID
curl "http://localhost:3000/api/validation/status/SESSION_ID" | jq
```

**Expected Response:**
```json
{
  "sessionId": "cm2session123",
  "totalDocuments": 12,
  "validated": 8,
  "pending": 2,
  "processing": 2,
  "verified": 7,
  "needsReview": 1,
  "rejected": 0,
  "completionPercentage": 67,
  "isComplete": false,
  "completenessCheck": {
    "completed": true,
    "readinessScore": 85,
    "isReady": true,
    "status": "READY",
    "criticalBlockers": [],
    "warnings": [],
    "recommendations": ["Consider adding employment verification"],
    "documentChecklist": [...]
  }
}
```

**What to Check:**
- `completionPercentage` is correct
- `validated` = `verified` + `needsReview` + `rejected`
- `isComplete` is true when all documents validated
- `completenessCheck` exists if full pipeline was run

---

#### Test 5.3: POST /api/validation/session

```bash
# Trigger validation for all documents in session
curl -X POST "http://localhost:3000/api/validation/session" \
  -H "Content-Type: application/json" \
  -d '{
    "intakeSessionId": "SESSION_ID",
    "runFullPipeline": false
  }' | jq
```

**Expected Response:**
```json
{
  "sessionId": "cm2session123",
  "status": "SUCCESS",
  "validated": 12,
  "verified": 10,
  "needsReview": 2,
  "rejected": 0
}
```

**What to Check:**
- `status` is "SUCCESS"
- `validated` matches total document count
- Counts add up correctly

---

### Test 6: Edge Cases 🚨

#### Test 6.1: Document Without Validation

**Goal:** Verify null handling for documents without validation

**Steps:**
1. Find or create a document that hasn't been validated
2. Check API response
3. Check UI display

**Expected Results:**
- API returns `validation: null`
- UI shows "Pending" badge or no badge
- No errors in console

---

#### Test 6.2: Failed Validation

**Goal:** Verify error handling for failed validation

**Steps:**
1. Upload a document that will fail validation (e.g., non-document image)
2. Run validation
3. Check status

**Expected Results:**
- Badge shows "❌ Failed" or "⚠ Error"
- Red color
- Error message displayed (optional)

---

#### Test 6.3: Multiple Simultaneous Validations

**Goal:** Verify concurrent validation handling

**Steps:**
1. Upload 10+ documents
2. Click "Validate All" twice quickly
3. Watch progress

**Expected Results:**
- Second click is handled gracefully (debounced or ignored)
- No duplicate validations
- Progress bar shows accurate state

---

## 🐛 Troubleshooting

### Issue 1: Validation Stuck in "PROCESSING"

**Symptoms:**
- Badge shows "🔄 Validating..." indefinitely
- No progress after several minutes

**Solutions:**
1. Check server logs: `tail -f logs/server.log`
2. Check database: `npx prisma studio` → DocumentValidation table
3. Check background job status
4. Manually update status: SQL query to set status to VERIFIED or REJECTED

**Database Query:**
```sql
-- Check validation status
SELECT id, status, processingStartedAt, processingCompletedAt
FROM "DocumentValidation"
WHERE uploadedFileId = 'FILE_ID';

-- Manually fix stuck validation
UPDATE "DocumentValidation"
SET status = 'VERIFIED', processingCompletedAt = NOW()
WHERE uploadedFileId = 'FILE_ID';
```

---

### Issue 2: Validation Badge Not Displaying

**Symptoms:**
- Document list doesn't show validation badges
- Console errors about missing validation prop

**Solutions:**
1. Check API response: Does `/api/documents` include `validation` field?
2. Check browser console: Any errors?
3. Check component props: Is `validation` being passed to `DocumentStatusBadge`?
4. Refresh page: Sometimes React state needs refresh

**Debug Steps:**
```javascript
// In browser console
fetch('/api/documents?sessionId=YOUR_SESSION_ID')
  .then(r => r.json())
  .then(d => console.log(d.files[0].validation))
// Should show: { status, category, confidence }
```

---

### Issue 3: Progress Bar Not Updating

**Symptoms:**
- Progress bar stuck at 0% or doesn't update
- No live updates

**Solutions:**
1. Check polling: Is `ValidationProgress` component polling?
2. Check API endpoint: Does `/api/validation/status/:sessionId` return data?
3. Check network tab: Are requests being made every 2 seconds?
4. Check React state: Is `autoRefresh` prop set to true?

**Debug Steps:**
```javascript
// In browser console, manually poll
setInterval(() => {
  fetch('/api/validation/status/YOUR_SESSION_ID')
    .then(r => r.json())
    .then(d => console.log(`${d.validated}/${d.totalDocuments} (${d.completionPercentage}%)`))
}, 2000)
```

---

### Issue 4: Category Not Displaying

**Symptoms:**
- Validation badge shows status but no category
- Category is null in API response

**Solutions:**
1. Check `classifierResult` in database: Does it exist?
2. Check parsing logic: Is `classifierResult` being parsed correctly?
3. Check AI agent: Did ClassifierAgent run successfully?

**Database Query:**
```sql
SELECT
  id,
  status,
  classifierResult,
  overallConfidence
FROM "DocumentValidation"
WHERE uploadedFileId = 'FILE_ID';
```

---

### Issue 5: TypeScript Errors

**Symptoms:**
- Build fails with type errors
- IDE shows type errors

**Solutions:**
1. Regenerate Prisma client: `npx prisma generate`
2. Restart TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Check types: Ensure `ValidationStatus` is imported from `@prisma/client`

---

## 📊 Test Results Checklist

Use this checklist to track your testing progress:

### API Endpoints
- [ ] GET /api/documents returns validation data
- [ ] GET /api/documents handles null validation
- [ ] GET /api/validation/status/:sessionId returns correct counts
- [ ] POST /api/validation/session triggers validation
- [ ] GET /api/intake/upload/:id returns validation

### UI Components
- [ ] DocumentStatusBadge displays all status types
- [ ] DocumentStatusBadge shows category
- [ ] DocumentStatusBadge shows confidence percentage
- [ ] ValidationProgress shows live updates
- [ ] ValidationProgress shows accurate counts
- [ ] ReadinessScore displays correct score
- [ ] ReadinessScore shows document checklist

### Integration
- [ ] Upload → Validate → Display flow works
- [ ] "Validate All" button triggers validation
- [ ] Progress bar updates in real-time
- [ ] Badges update when validation completes
- [ ] Multiple documents validated correctly

### Edge Cases
- [ ] Documents without validation handled (null)
- [ ] Failed validations displayed correctly
- [ ] Network errors handled gracefully
- [ ] Concurrent validations handled correctly

---

## 🎯 Success Criteria

The system is working correctly if:

1. ✅ Documents are automatically validated after upload
2. ✅ Validation badges display correct status
3. ✅ "Validate All" button triggers batch validation
4. ✅ Progress bar updates in real-time
5. ✅ Readiness score calculates correctly
6. ✅ All API endpoints return validation data
7. ✅ Edge cases handled gracefully (null, errors)

---

## 📸 Screenshots to Take

1. Document list with validation badges (all statuses)
2. Progress bar during validation (in progress)
3. Progress bar completion (success message)
4. Readiness score (high score, green)
5. Readiness score (low score, red)
6. Document detail with validation info

---

## 📝 Testing Notes Template

Use this template to record your testing results:

```markdown
### Test Session: [Date]

**Environment:**
- Branch: service-tiers
- Node version: [version]
- Database: PostgreSQL

**Test Results:**

#### Upload Flow
- Status: ✅ / ❌
- Notes: [observations]

#### Validate All Flow
- Status: ✅ / ❌
- Notes: [observations]

#### Validation Badges
- Status: ✅ / ❌
- Notes: [observations]

#### Readiness Score
- Status: ✅ / ❌
- Notes: [observations]

#### API Endpoints
- Status: ✅ / ❌
- Notes: [observations]

**Issues Found:**
1. [Issue description]
2. [Issue description]

**Screenshots:**
- [Screenshot 1]: [Description]
- [Screenshot 2]: [Description]
```

---

## 🚀 Next Steps After Testing

Once testing is complete and all tests pass:

1. **Update documentation** with any findings
2. **Create PR** for the changes
3. **Request code review** from team
4. **Deploy to staging** environment
5. **Run tests on staging**
6. **Deploy to production** if all tests pass

---

**Happy Testing! 🎉**

# AI Validation API Endpoints

This document describes the API endpoints for the AI validation orchestration service.

## Endpoints

### 1. POST `/api/validation/document`

Validates a single uploaded document using the AI validation pipeline.

**Request Body:**
```json
{
  "uploadedFileId": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "uploadedFileId": "cm123...",
  "category": "IDENTITY",
  "message": "Document validation completed successfully"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message",
  "uploadedFileId": "cm123..."
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/validation/document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadedFileId: 'cm123abc...'
  })
});

const result = await response.json();
```

---

### 2. POST `/api/validation/session`

Validates all documents in an intake session. Can optionally run the full validation pipeline.

**Request Body:**
```json
{
  "intakeSessionId": "string",
  "runFullPipeline": boolean  // optional, default: false
}
```

**Success Response - Documents Only (200):**
```json
{
  "success": true,
  "intakeSessionId": "cm123...",
  "mode": "documents_only",
  "totalDocuments": 4,
  "validated": 4,
  "failed": 0,
  "results": [
    {
      "uploadedFileId": "cm123...",
      "status": "SUCCESS",
      "category": "IDENTITY"
    }
  ],
  "message": "Session documents validated successfully"
}
```

**Success Response - Full Pipeline (200):**
```json
{
  "success": true,
  "intakeSessionId": "cm123...",
  "mode": "full_pipeline",
  "documentsValidated": 4,
  "documentsFailed": 0,
  "dataExtracted": true,
  "readinessScore": 75,
  "isReadyForSubmission": false,
  "message": "Full validation pipeline completed successfully"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Example Usage:**
```typescript
// Validate documents only
const response = await fetch('/api/validation/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intakeSessionId: 'cm123abc...',
    runFullPipeline: false
  })
});

// Run full pipeline (documents + data extraction + completeness)
const fullResponse = await fetch('/api/validation/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intakeSessionId: 'cm123abc...',
    runFullPipeline: true
  })
});
```

---

### 3. GET `/api/validation/status/[sessionId]`

Retrieves the current validation status for an intake session.

**URL Parameters:**
- `sessionId`: The intake session ID

**Success Response (200):**
```json
{
  "success": true,
  "sessionId": "cm123...",
  "status": {
    "documents": {
      "total": 4,
      "completed": 3,
      "processing": 1,
      "failed": 0,
      "pending": 0
    },
    "dataExtraction": {
      "completed": false
    },
    "completenessCheck": {
      "completed": false,
      "readinessScore": null
    },
    "progress": {
      "documentsPercent": 75,
      "overallStatus": "in_progress"
    }
  }
}
```

**Overall Status Values:**
- `not_started`: No documents have been processed
- `in_progress`: Some documents are being processed
- `partial`: Some documents completed, some failed
- `completed`: All documents validated + data extracted + completeness checked
- `failed`: All documents failed validation

**Error Response (404/500):**
```json
{
  "success": false,
  "error": "Session not found"
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/validation/status/cm123abc...', {
  method: 'GET'
});

const status = await response.json();

// Use for progress tracking
if (status.status.progress.overallStatus === 'in_progress') {
  console.log(`Progress: ${status.status.progress.documentsPercent}%`);
}
```

---

## Usage Patterns

### Pattern 1: Validate Single Document on Upload

```typescript
// After user uploads a document
async function handleDocumentUpload(uploadedFileId: string) {
  const response = await fetch('/api/validation/document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadedFileId })
  });

  const result = await response.json();

  if (result.success) {
    console.log('Document validated:', result.category);
  } else {
    console.error('Validation failed:', result.error);
  }
}
```

### Pattern 2: Validate All Session Documents

```typescript
// Validate all documents when user clicks "Validate All"
async function validateAllDocuments(sessionId: string) {
  const response = await fetch('/api/validation/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeSessionId: sessionId,
      runFullPipeline: false
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Validated: ${result.validated}/${result.totalDocuments}`);
  }
}
```

### Pattern 3: Poll for Progress

```typescript
// Poll status every 2 seconds while validating
async function pollValidationStatus(sessionId: string) {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/validation/status/${sessionId}`);
    const status = await response.json();

    const { documentsPercent, overallStatus } = status.status.progress;

    console.log(`Progress: ${documentsPercent}%`);

    if (overallStatus === 'completed' || overallStatus === 'failed') {
      clearInterval(interval);
      console.log('Validation complete!');
    }
  }, 2000);
}
```

### Pattern 4: Run Full Pipeline Before Submission

```typescript
// Run complete validation before allowing claim submission
async function validateBeforeSubmission(sessionId: string) {
  // Show loading indicator
  setLoading(true);

  // Run full pipeline
  const response = await fetch('/api/validation/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeSessionId: sessionId,
      runFullPipeline: true
    })
  });

  const result = await response.json();

  setLoading(false);

  if (result.success && result.isReadyForSubmission) {
    // Allow submission
    enableSubmitButton();
  } else {
    // Show readiness score and blockers
    showReadinessReport({
      score: result.readinessScore,
      message: `Your claim is ${result.readinessScore}% complete`
    });
  }
}
```

---

## Integration with Upload Flow

### Recommended Workflow

1. **User uploads document** → Call `POST /api/validation/document`
2. **Show validation status** → Display category and any issues
3. **User uploads more documents** → Repeat step 1 for each
4. **User clicks "Validate All"** → Call `POST /api/validation/session` (documents only)
5. **Show progress** → Poll `GET /api/validation/status/[sessionId]`
6. **User ready to submit** → Call `POST /api/validation/session` (full pipeline)
7. **Show readiness score** → Display completeness percentage and blockers
8. **Enable/disable submit** → Based on `isReadyForSubmission`

---

## Error Handling

All endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;  // Only for validation errors
}
```

**Common Error Scenarios:**

1. **Invalid Request (400)**
   - Missing required fields
   - Invalid field values
   - Schema validation errors

2. **Not Found (404)**
   - Session doesn't exist
   - Document doesn't exist

3. **Server Error (500)**
   - Database errors
   - AI agent failures
   - Unexpected errors

**Example Error Handling:**

```typescript
async function safeValidation(sessionId: string) {
  try {
    const response = await fetch('/api/validation/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeSessionId: sessionId })
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 404) {
        console.error('Session not found');
      } else if (response.status === 400) {
        console.error('Invalid request:', error.details);
      } else {
        console.error('Server error:', error.error);
      }

      return;
    }

    const result = await response.json();
    // Process success

  } catch (error) {
    console.error('Network error:', error);
  }
}
```

---

## Testing

### Manual Testing with cURL

```bash
# Test document validation
curl -X POST http://localhost:3000/api/validation/document \
  -H "Content-Type: application/json" \
  -d '{"uploadedFileId": "cm123abc..."}'

# Test session validation
curl -X POST http://localhost:3000/api/validation/session \
  -H "Content-Type: application/json" \
  -d '{"intakeSessionId": "cm123abc...", "runFullPipeline": false}'

# Test status check
curl http://localhost:3000/api/validation/status/cm123abc...
```

### Automated Testing

Run the test suite:

```bash
# Start dev server
npm run dev

# In another terminal, run API tests
npx tsx scripts/test-api-endpoints.ts
```

---

## Performance Notes

- **Document validation**: ~3-5 seconds per document
- **Session validation (4 docs)**: ~3-5 seconds (parallel processing)
- **Full pipeline (4 docs)**: ~10-20 seconds (includes data extraction and completeness)

For large sessions (10+ documents), consider:
1. Processing in background with job queue
2. Using WebSockets/SSE for real-time progress
3. Implementing pagination for status results

---

## Security Considerations

**TODO**: Add authentication/authorization to these endpoints

Current implementation does not check:
- User authentication
- User authorization to access session
- Rate limiting

Before production deployment, add:

```typescript
// Example auth check
import { getServerAuthSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify user owns this session
  // ... rest of endpoint logic
}
```

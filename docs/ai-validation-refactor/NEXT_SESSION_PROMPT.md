# Next Session: Frontend Integration & UI Development

## 📋 Quick Start for Next Session

**Context:** The AI validation system backend is complete. All 7 agents, orchestration service, and API endpoints are implemented and tested.

**Branch:** `service-tiers`
**Status:** Ready for frontend integration

---

## 🎯 Session Goal

Integrate the AI validation system into the frontend upload flow and create UI components to display validation results.

---

## 📖 Essential Reading (5 minutes)

Before starting, review these files:

1. **`SESSION_COMPLETE.md`** - What was built in previous session
2. **`API_ENDPOINTS.md`** - API reference and usage examples
3. **`IMPLEMENTATION_COMPLETE.md`** - System architecture overview

**Quick Context:**
```bash
# Location of key files
cat docs/ai-validation-refactor/SESSION_COMPLETE.md
cat docs/ai-validation-refactor/API_ENDPOINTS.md
```

---

## 🔍 What's Already Done

### ✅ Backend (100% Complete)

**Orchestration Service:**
- `src/lib/ai-agents/orchestration-service.ts`
- All 7 AI agents implemented
- Complete 3-phase validation pipeline
- Progress tracking utilities

**API Endpoints:**
- `POST /api/validation/document` - Validate single document
- `POST /api/validation/session` - Validate session (with full pipeline option)
- `GET /api/validation/status/[sessionId]` - Check validation progress

**Testing:**
- `scripts/test-orchestration.ts` - All tests passing ✅
- `scripts/test-api-endpoints.ts` - Ready to test APIs

**Database:**
- DocumentValidation table
- ClaimReadiness table
- AgentExecutionLog table
- All integrated and working

---

## 🎯 What Needs to Be Done

### Priority 1: Authentication (CRITICAL for Production)

**Problem:** API endpoints are currently unprotected
**Solution:** Add authentication middleware

**Files to Create/Modify:**
1. `src/middleware/api-auth.ts` - Auth middleware
2. Update all 3 validation endpoints with auth checks

**Example Implementation:**
```typescript
// src/middleware/api-auth.ts
import { getServerAuthSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return { user: session.user };
}

// Usage in endpoints:
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  // Proceed with validation...
}
```

**Estimated Time:** 30-60 minutes

---

### Priority 2: Upload Flow Integration

**Goal:** Automatically validate documents when users upload them

**Current Upload Flow:**
1. User selects file
2. File uploads to R2
3. Record created in UploadedFile table
4. ❌ No validation happens

**Enhanced Upload Flow:**
1. User selects file
2. File uploads to R2
3. Record created in UploadedFile table
4. ✅ **Call `POST /api/validation/document`**
5. ✅ **Show validation result to user**

**Files to Modify:**
- Upload component (find with: `grep -r "uploadedFile" src/app/ src/components/`)
- Upload API endpoint: `src/app/api/upload/route.ts`

**Implementation Approach:**

**Option A: Client-Side Trigger (Simpler)**
```typescript
// In upload component
async function handleUploadComplete(uploadedFileId: string) {
  // Show loading state
  setValidating(true);

  // Trigger validation
  const response = await fetch('/api/validation/document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadedFileId })
  });

  const result = await response.json();

  setValidating(false);

  if (result.success) {
    // Show success with category badge
    showNotification(`Document validated: ${result.category}`, 'success');
  } else {
    // Show error
    showNotification(`Validation failed: ${result.error}`, 'error');
  }
}
```

**Option B: Server-Side Trigger (More Robust)**
```typescript
// In src/app/api/upload/route.ts (or similar)
export async function POST(req: NextRequest) {
  // ... existing upload logic ...

  // After file is uploaded and record created:
  const uploadedFile = await db.uploadedFile.create({ ... });

  // Trigger validation in background
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/validation/document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadedFileId: uploadedFile.id })
  }).catch(err => console.error('Background validation failed:', err));

  return NextResponse.json({ ...uploadedFile });
}
```

**Estimated Time:** 1-2 hours

---

### Priority 3: UI Components

#### 3.1 Document Status Badge

**Purpose:** Show validation status for each uploaded document

**Component:** `src/components/validation/DocumentStatusBadge.tsx`

```typescript
interface DocumentStatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
  category?: string;
  confidence?: number;
}

export function DocumentStatusBadge({ status, category, confidence }: DocumentStatusBadgeProps) {
  const config = {
    PENDING: { color: 'gray', label: 'Pending' },
    PROCESSING: { color: 'blue', label: 'Validating...', icon: <Spinner /> },
    VERIFIED: { color: 'green', label: 'Verified', icon: <CheckCircle /> },
    NEEDS_REVIEW: { color: 'yellow', label: 'Needs Review', icon: <AlertTriangle /> },
    REJECTED: { color: 'red', label: 'Failed', icon: <XCircle /> },
  };

  const { color, label, icon } = config[status];

  return (
    <div className={`badge badge-${color}`}>
      {icon} {label}
      {category && <span className="ml-2 text-xs">({category})</span>}
      {confidence && <span className="ml-1 text-xs">{Math.round(confidence * 100)}%</span>}
    </div>
  );
}
```

**Where to Use:**
- Document list/grid in upload interface
- Document details modal
- Review screens

**Estimated Time:** 1 hour

---

#### 3.2 Validation Progress Bar

**Purpose:** Show progress when validating multiple documents

**Component:** `src/components/validation/ValidationProgress.tsx`

```typescript
interface ValidationProgressProps {
  sessionId: string;
  onComplete?: () => void;
}

export function ValidationProgress({ sessionId, onComplete }: ValidationProgressProps) {
  const [status, setStatus] = useState<ValidationStatus | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/validation/status/${sessionId}`);
      const data = await response.json();

      setStatus(data.status);

      if (data.status.progress.overallStatus === 'completed') {
        clearInterval(interval);
        onComplete?.();
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!status) return <Spinner />;

  const { documentsPercent } = status.progress;
  const { completed, total, processing, failed } = status.documents;

  return (
    <div className="validation-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${documentsPercent}%` }}
        />
      </div>

      <div className="progress-stats">
        <span>{completed}/{total} validated</span>
        {processing > 0 && <span>{processing} in progress</span>}
        {failed > 0 && <span className="text-red">{failed} failed</span>}
      </div>
    </div>
  );
}
```

**Where to Use:**
- After "Validate All" button click
- During submission process
- In admin review screens

**Estimated Time:** 1-2 hours

---

#### 3.3 Readiness Score Display

**Purpose:** Show claim completeness and readiness for submission

**Component:** `src/components/validation/ReadinessScore.tsx`

```typescript
interface ReadinessScoreProps {
  sessionId: string;
}

export function ReadinessScore({ sessionId }: ReadinessScoreProps) {
  const [readiness, setReadiness] = useState<CompletenessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReadiness() {
      const response = await fetch(`/api/validation/status/${sessionId}`);
      const data = await response.json();

      if (data.status.completenessCheck.completed) {
        // Load full readiness data
        setReadiness({
          score: data.status.completenessCheck.readinessScore,
        });
      }

      setLoading(false);
    }

    loadReadiness();
  }, [sessionId]);

  if (loading) return <Spinner />;
  if (!readiness) return <EmptyState />;

  const { score } = readiness;
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

  return (
    <div className="readiness-score">
      <div className={`score-circle score-${color}`}>
        <span className="score-number">{score}</span>
        <span className="score-label">/100</span>
      </div>

      <div className="readiness-status">
        {score >= 80 && <p>✅ Your claim is ready for submission!</p>}
        {score >= 60 && score < 80 && <p>⚠️ Almost ready! A few items need attention.</p>}
        {score < 60 && <p>❌ Additional documents required.</p>}
      </div>
    </div>
  );
}
```

**Where to Use:**
- Claim review screen
- Before submission
- Dashboard summary

**Estimated Time:** 2-3 hours

---

### Priority 4: "Validate All" Button

**Purpose:** Allow users to manually trigger validation of all documents

**Implementation:**

```typescript
// In session/document management page
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
      <button onClick={handleValidateAll} disabled={validating}>
        {validating ? 'Validating...' : 'Validate All Documents'}
      </button>

      {validating && <ValidationProgress sessionId={sessionId} />}

      <DocumentList sessionId={sessionId} />
    </div>
  );
}
```

**Estimated Time:** 1 hour

---

## 🎯 Session Goals (Prioritized)

**Minimum (2-3 hours):**
- [ ] Add authentication to endpoints
- [ ] Integrate validation into upload flow
- [ ] Create basic status badge component

**Recommended (4-6 hours):**
- [ ] Above + Progress bar component
- [ ] Above + "Validate All" button
- [ ] Above + Basic readiness display

**Complete (8-10 hours):**
- [ ] All of the above
- [ ] Full readiness score with details
- [ ] Submission flow integration
- [ ] Form pre-fill implementation

---

## 🚀 Quick Start Commands

```bash
# Start where we left off
git checkout service-tiers
git pull origin service-tiers

# Verify backend is working
npx tsx scripts/test-orchestration.ts

# Start dev server
npm run dev
```

---

## 📝 Example Prompt to Start Next Session

```
I'm continuing work on the RadiantClaims AI validation system.
The backend is complete (orchestration service + API endpoints).

Please read:
- docs/ai-validation-refactor/SESSION_COMPLETE.md
- docs/ai-validation-refactor/NEXT_SESSION_PROMPT.md

I want to start with [choose one]:
1. Adding authentication to the API endpoints
2. Integrating validation into the upload flow
3. Creating the UI components for status display

Current branch: service-tiers
```

---

**Good luck with the integration! The backend foundation is solid and ready.** 🚀

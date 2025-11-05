# AI Validation UI Components - Usage Guide

This document provides a comprehensive guide to using the AI validation UI components in the RadiantClaims application.

---

## 📦 Components Overview

### 1. DocumentStatusBadge
Displays the validation status of a single document with color-coded badges.

### 2. ValidationProgress
Shows real-time progress when validating multiple documents.

### 3. ReadinessScore
Displays the overall claim completeness and readiness for submission.

---

## 🎯 DocumentStatusBadge

### Import
```typescript
import { DocumentStatusBadge } from "@/components/validation";
```

### Props
```typescript
interface DocumentStatusBadgeProps {
  status: ValidationStatus;  // Required
  category?: string;         // Optional - document category
  confidence?: number;       // Optional - 0-1 confidence score
  showCategory?: boolean;    // Optional - default: false
  showConfidence?: boolean;  // Optional - default: false
  size?: "sm" | "md" | "lg"; // Optional - default: "md"
  className?: string;        // Optional - additional CSS classes
}
```

### Usage Examples

**Basic Badge:**
```typescript
<DocumentStatusBadge status="VERIFIED" />
```

**With Category:**
```typescript
<DocumentStatusBadge
  status="VERIFIED"
  category="IDENTITY"
  showCategory={true}
/>
```

**Full Featured:**
```typescript
<DocumentStatusBadge
  status="VERIFIED"
  category="IDENTITY"
  confidence={0.95}
  showCategory={true}
  showConfidence={true}
  size="md"
/>
```

### Status Types

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| `PENDING` | Gray | Clock | Not yet processed |
| `PROCESSING` | Blue | Spinner (animated) | AI agents running |
| `VERIFIED` | Green | Checkmark | All checks passed |
| `NEEDS_REVIEW` | Yellow | Alert | Issues found, needs staff review |
| `STAFF_APPROVED` | Emerald | Shield | Staff reviewed and approved |
| `REJECTED` | Red | X | Validation failed |
| `ERROR` | Orange | Warning | Processing error |

### Helper Functions

```typescript
import {
  getStatusColor,
  getStatusBgColor,
  isDocumentUsable,
  isProcessingComplete,
} from "@/components/validation";

// Get color class for a status
const color = getStatusColor("VERIFIED"); // "text-green-700"

// Get background color class
const bgColor = getStatusBgColor("VERIFIED"); // "bg-green-50"

// Check if document can be used
const canUse = isDocumentUsable("VERIFIED"); // true

// Check if processing is complete
const isDone = isProcessingComplete("PROCESSING"); // false
```

---

## 📊 ValidationProgress

### Import
```typescript
import { ValidationProgress } from "@/components/validation";
```

### Props
```typescript
interface ValidationProgressProps {
  sessionId: string;          // Required - intake session ID
  autoRefresh?: boolean;      // Optional - default: true
  refreshInterval?: number;   // Optional - default: 2000ms
  onComplete?: () => void;    // Optional - callback when done
  showDetails?: boolean;      // Optional - default: true
  className?: string;         // Optional - additional CSS classes
}
```

### Usage Examples

**Basic Progress:**
```typescript
<ValidationProgress sessionId={sessionId} />
```

**With Callbacks:**
```typescript
<ValidationProgress
  sessionId={sessionId}
  autoRefresh={true}
  refreshInterval={2000}
  onComplete={() => {
    console.log("Validation complete!");
    refetchDocuments();
  }}
  showDetails={true}
/>
```

**Conditional Display:**
```typescript
{isValidating && (
  <ValidationProgress
    sessionId={sessionId}
    onComplete={() => setIsValidating(false)}
  />
)}
```

### Visual States

**Loading:**
```
[Spinner] Loading validation status...
```

**In Progress:**
```
[Spinner] Validating Documents...        8/12 (67%)
[Progress Bar ████████░░░░░░░░]

✓ Verified: 7
⏳ Processing: 1
⚠ Needs Review: 1
○ Pending: 3
```

**Complete:**
```
[Checkmark] Validation Complete          12/12 (100%)
[Progress Bar ████████████████]

Readiness Score: 85/100
```

**Error:**
```
[Alert] Error: Failed to fetch validation status
[Retry Button]
```

---

## 🎖️ ReadinessScore

### Import
```typescript
import { ReadinessScore } from "@/components/validation";
```

### Props
```typescript
interface ReadinessScoreProps {
  sessionId: string;       // Required - intake session ID
  showDetails?: boolean;   // Optional - default: true
  onValidate?: () => void; // Optional - callback for validation trigger
  className?: string;      // Optional - additional CSS classes
}
```

### Usage Examples

**Basic Display:**
```typescript
<ReadinessScore sessionId={sessionId} />
```

**With Validation Trigger:**
```typescript
<ReadinessScore
  sessionId={sessionId}
  showDetails={true}
  onValidate={handleRunFullValidation}
/>
```

**In a Card Layout:**
```typescript
<div className="grid gap-4">
  <ReadinessScore
    sessionId={sessionId}
    showDetails={true}
  />
</div>
```

### Score Interpretation

| Score Range | Color | Status | Message |
|-------------|-------|--------|---------|
| 80-100 | Green | ✓ Ready | "Your claim is ready for submission!" |
| 60-79 | Yellow | ⚠ Almost | "Your claim is almost ready. A few items need attention." |
| 0-59 | Red | ✗ Not Ready | "More documents are needed before submission." |

### Display Sections

1. **Score Circle:**
   - Large circular display (e.g., "85/100")
   - Color-coded border and background

2. **Status Message:**
   - Icon + text based on score
   - Clear guidance on next steps

3. **Critical Blockers:** (if any)
   - Red alert box
   - List of critical issues
   - Must be resolved before submission

4. **Warnings:** (if any)
   - Yellow alert box
   - Non-critical issues
   - Recommended to fix

5. **Document Checklist:** (if showDetails)
   - ✓ Complete sections (green)
   - ⚠ Needs review sections (yellow)
   - ✗ Incomplete sections (gray)
   - Required document counts

6. **Recommendations:**
   - Actionable suggestions
   - Helps improve score

7. **Ready Status:** (if score ≥ 80)
   - Green banner
   - "This claim is ready for submission!"

### States

**Not Yet Validated:**
```
┌─────────────────────────┐
│ Claim Readiness         │
│                         │
│     [   ?   ]           │
│                         │
│ No readiness check      │
│ performed yet           │
│                         │
│ [Run Validation]        │
└─────────────────────────┘
```

**Loading:**
```
┌─────────────────────────┐
│ [Spinner] Loading...    │
└─────────────────────────┘
```

**Error:**
```
┌─────────────────────────┐
│ [Alert] Error: ...      │
│ [Retry Button]          │
└─────────────────────────┘
```

---

## 🔗 Integration Examples

### Example 1: Document List with Validation Badges

```typescript
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentStatusBadge } from "@/components/validation";

function DocumentList({ documents }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          {...doc}
          validation={doc.validation}
        />
      ))}
    </div>
  );
}
```

### Example 2: Validate All Button with Progress

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ValidationProgress } from "@/components/validation";

function DocumentDashboard({ sessionId }) {
  const [validating, setValidating] = useState(false);

  const handleValidateAll = async () => {
    setValidating(true);

    try {
      const response = await fetch("/api/validation/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeSessionId: sessionId,
          runFullPipeline: false,
        }),
      });

      if (response.ok) {
        // Progress component will auto-refresh
      }
    } catch (error) {
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleValidateAll} disabled={validating}>
        Validate All Documents
      </Button>

      {validating && (
        <ValidationProgress
          sessionId={sessionId}
          onComplete={() => setValidating(false)}
        />
      )}
    </div>
  );
}
```

### Example 3: Claim Review Page

```typescript
import { ValidationProgress } from "@/components/validation";
import { ReadinessScore } from "@/components/validation";

function ClaimReviewPage({ sessionId }) {
  const [runningValidation, setRunningValidation] = useState(false);

  const handleValidate = async () => {
    setRunningValidation(true);
    // Trigger full pipeline validation
    await fetch("/api/validation/session", {
      method: "POST",
      body: JSON.stringify({
        intakeSessionId: sessionId,
        runFullPipeline: true,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <h1>Claim Review</h1>

      {/* Validation Progress */}
      {runningValidation && (
        <ValidationProgress
          sessionId={sessionId}
          onComplete={() => setRunningValidation(false)}
        />
      )}

      {/* Readiness Score */}
      <ReadinessScore
        sessionId={sessionId}
        showDetails={true}
        onValidate={handleValidate}
      />

      {/* Document List */}
      <DocumentList sessionId={sessionId} />
    </div>
  );
}
```

---

## 🎨 Styling & Theming

### Colors

All components use Tailwind CSS with consistent color schemes:

**Validation Theme:** Purple
```css
border-purple-300
bg-purple-50
text-purple-700
```

**Status Colors:**
- Pending: Gray
- Processing: Blue
- Verified: Green
- Needs Review: Yellow
- Approved: Emerald
- Rejected: Red
- Error: Orange

### Customization

You can override styles using the `className` prop:

```typescript
<DocumentStatusBadge
  status="VERIFIED"
  className="shadow-lg border-2"
/>
```

---

## 🔄 Data Requirements

### For DocumentStatusBadge & Document Components

Documents should include a `validation` field:

```typescript
interface Document {
  id: string;
  originalFilename: string;
  // ... other fields
  validation?: {
    status: ValidationStatus;
    category?: string;
    confidence?: number;
  } | null;
}
```

### For ValidationProgress

Requires `/api/validation/status/:sessionId` endpoint returning:

```typescript
{
  status: {
    documents: {
      total: number;
      completed: number;
      pending: number;
      processing: number;
      verified: number;
      needsReview: number;
      rejected: number;
      error: number;
    };
    progress: {
      documentsPercent: number;
      overallStatus: "not_started" | "in_progress" | "completed";
    };
    completenessCheck?: {
      completed: boolean;
      readinessScore?: number;
    };
  }
}
```

### For ReadinessScore

Requires `/api/validation/status/:sessionId` with completeness check:

```typescript
{
  status: {
    completenessCheck: {
      completed: true;
      readinessScore: 85;
      isReadyForSubmission: true;
      completeness: {
        sections: [...];
        overallPercent: 85;
      };
      criticalBlockers: [...];
      warnings: [...];
      recommendations: [...];
    }
  }
}
```

---

## ⚡ Performance Considerations

### ValidationProgress Auto-Refresh

- Default refresh interval: 2000ms (2 seconds)
- Automatically stops when validation completes
- Use `autoRefresh={false}` for manual control

**Tip:** Adjust `refreshInterval` based on your needs:
```typescript
// Faster updates (1 second)
<ValidationProgress refreshInterval={1000} />

// Slower updates (5 seconds)
<ValidationProgress refreshInterval={5000} />
```

### Conditional Rendering

Only render components when needed:

```typescript
// Good: Only render when validating
{isValidating && <ValidationProgress sessionId={sessionId} />}

// Bad: Always renders
<ValidationProgress sessionId={sessionId} />
```

---

## 🐛 Error Handling

All components include built-in error states:

### DocumentStatusBadge
- Invalid status → Shows ERROR badge

### ValidationProgress
- Fetch error → Red alert with retry
- Network error → Error message + retry button

### ReadinessScore
- Loading error → Error card with retry
- No data → Empty state with "Run Validation" button

---

## 📱 Responsive Design

All components are responsive:

- **Mobile:** Stacked layout, smaller badges
- **Tablet:** Optimized spacing
- **Desktop:** Full layout with all details

---

## ♿ Accessibility

Components include:
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Screen reader friendly

---

## 🧪 Testing

### Unit Testing

```typescript
import { render, screen } from "@testing-library/react";
import { DocumentStatusBadge } from "@/components/validation";

test("renders verified status", () => {
  render(<DocumentStatusBadge status="VERIFIED" />);
  expect(screen.getByText("Verified")).toBeInTheDocument();
});
```

### Integration Testing

```typescript
test("validate all flow", async () => {
  const { user } = renderWithUser(<DocumentDashboard sessionId="123" />);

  await user.click(screen.getByText("Validate All Documents"));
  expect(screen.getByText("Validating Documents...")).toBeInTheDocument();
});
```

---

## 📚 Additional Resources

- **API Documentation:** `docs/ai-validation-refactor/API_ENDPOINTS.md`
- **Backend Implementation:** `docs/ai-validation-refactor/IMPLEMENTATION_COMPLETE.md`
- **Session Summary:** `docs/ai-validation-refactor/SESSION_3_COMPLETE.md`

---

**Last Updated:** November 4, 2024
**Version:** 1.0.0

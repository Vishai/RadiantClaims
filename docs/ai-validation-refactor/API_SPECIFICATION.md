# API Endpoints Specification

## Overview

This document specifies all API endpoints for the AI validation system, including customer-facing and admin endpoints.

---

## Customer-Facing Endpoints

### Documents Management

#### POST /api/documents/upload

**Purpose:** Upload new document file

**Authentication:** Required (user session)

**Request:**
```typescript
Content-Type: multipart/form-data

{
  file: File; // The uploaded file
  category?: DocumentCategory; // Optional user-provided category
  sessionId: string; // Intake session ID
}
```

**Response:**
```typescript
{
  success: true;
  document: {
    id: string;
    fileName: string;
    status: 'PROCESSING';
    uploadedAt: Date;
  };
}
```

**Error Responses:**
- 400: File too large, invalid file type
- 401: Not authenticated
- 403: Not authorized for this session
- 500: Upload failed

---

#### GET /api/documents

**Purpose:** List all documents for user's claim

**Authentication:** Required

**Query Parameters:**
```typescript
{
  sessionId: string; // Required
  status?: CustomerFileStatus; // Filter by status
  category?: DocumentCategory; // Filter by category
}
```

**Response:**
```typescript
{
  documents: Array<{
    id: string;
    fileName: string;
    category: DocumentCategory | null;
    status: CustomerFileStatus;
    uploadedAt: Date;
    thumbnailUrl: string;
    extractedSummary?: {
      name?: string;
      date?: string;
      address?: string;
      // ... other key fields
    };
    userNotes?: string;
    userConfirmed: boolean;
  }>;
  progressData: {
    overallPercent: number;
    sections: Array<{
      category: string;
      required: boolean;
      minDocuments: number;
      currentDocuments: number;
      status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW';
      description: string;
    }>;
  };
}
```

---

#### GET /api/documents/[id]

**Purpose:** Get detailed document information

**Authentication:** Required

**Response:**
```typescript
{
  document: {
    id: string;
    fileName: string;
    category: DocumentCategory | null;
    status: CustomerFileStatus;
    uploadedAt: Date;
    fileUrl: string; // Signed URL for viewing/downloading
    thumbnailUrl: string;
    mimeType: string;
    sizeBytes: number;
    userNotes: string | null;
    userConfirmed: boolean;
  };
  validation: {
    status: 'VERIFIED' | 'NEEDS_REVIEW' | 'PROCESSING' | 'ERROR';
    message: string; // User-friendly message
    extractedData: {
      [key: string]: string | null; // Key fields extracted
    };
    issues: Array<{
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      message: string;
      suggestion: string;
    }>;
  };
}
```

---

#### PATCH /api/documents/[id]

**Purpose:** Update document (category, notes, confirmation)

**Authentication:** Required

**Request:**
```typescript
{
  category?: DocumentCategory;
  userNotes?: string;
  userConfirmed?: boolean;
  reportIssue?: string; // User-reported issue with extraction
}
```

**Response:**
```typescript
{
  success: true;
  document: {
    id: string;
    // Updated fields
  };
  reprocessing: boolean; // True if category change triggered re-processing
}
```

---

#### DELETE /api/documents/[id]

**Purpose:** Delete a document

**Authentication:** Required

**Response:**
```typescript
{
  success: true;
  message: 'Document deleted successfully';
}
```

---

#### GET /api/documents/[id]/status

**Purpose:** Poll for processing status (used during AI validation)

**Authentication:** Required

**Response:**
```typescript
{
  status: 'PROCESSING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'ERROR';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}
```

**Polling Strategy:**
- Poll every 3 seconds while status is PROCESSING
- Stop polling when status changes to final state
- Maximum 2 minutes of polling (timeout)

---

### Claim Progress

#### GET /api/claims/progress

**Purpose:** Get claim readiness and progress

**Authentication:** Required

**Query Parameters:**
```typescript
{
  sessionId: string;
}
```

**Response:**
```typescript
{
  readiness: {
    score: number; // 0-100
    isReady: boolean;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'SUBMITTED';
  };
  completeness: {
    overallPercent: number;
    sections: Array<{
      category: string;
      required: boolean;
      minDocuments: number;
      currentDocuments: number;
      status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW';
      description: string;
      helpText: string;
    }>;
  };
  nextSteps: string[]; // What user should do next
}
```

---

## Admin Endpoints

### Claims Management

#### GET /api/admin/claims

**Purpose:** List all claims for staff review

**Authentication:** Required (Staff role)

**Query Parameters:**
```typescript
{
  status?: ClaimReviewStatus; // Filter by review status
  claimType?: ClaimType; // Filter by claim type
  readinessMin?: number; // Min readiness score (0-100)
  readinessMax?: number; // Max readiness score
  search?: string; // Search by claimant name or claim ID
  page?: number; // Pagination
  limit?: number; // Results per page
  sortBy?: 'createdAt' | 'updatedAt' | 'readinessScore';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
{
  claims: Array<{
    id: string;
    claimId: string; // Display ID like "RC-1234"
    claimant: {
      name: string;
      email: string;
    };
    claimType: ClaimType;
    status: ClaimReviewStatus;
    readinessScore: number;
    documentCount: number;
    criticalIssuesCount: number;
    warningsCount: number;
    submittedAt: Date;
    lastUpdated: Date;
    assignedTo?: {
      id: string;
      name: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  summary: {
    criticalCount: number;
    needsReviewCount: number;
    readyCount: number;
    approvedCount: number;
  };
}
```

---

#### GET /api/admin/claims/[id]

**Purpose:** Get full claim details with AI agent results

**Authentication:** Required (Staff role)

**Response:**
```typescript
{
  claim: {
    id: string;
    claimId: string;
    claimant: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    claimType: ClaimType;
    status: ClaimReviewStatus;
    submittedAt: Date;
    lastUpdated: Date;
    assignedTo?: {
      id: string;
      name: string;
    };
  };
  readiness: {
    score: number;
    isReady: boolean;
    completeness: {
      // Full completeness structure
    };
    criticalBlockers: Issue[];
    warnings: Issue[];
    crossDocumentValidation: {
      nameConsistent: boolean;
      datesConsistent: boolean;
      claimTypeConfidence: number;
      detectedClaimType: ClaimType;
    };
  };
  documents: Array<{
    id: string;
    fileName: string;
    category: DocumentCategory;
    status: CustomerFileStatus;
    uploadedAt: Date;
    thumbnailUrl: string;
    viewUrl: string;
    validation: {
      status: ValidationStatus;
      agentResults: {
        classifier?: AgentResult;
        identity?: AgentResult;
        medical?: AgentResult;
        residence?: AgentResult;
        employment?: AgentResult;
      };
      extractedData: any;
      criticalIssues: Issue[];
      warnings: Issue[];
    };
    userNotes?: string;
    userConfirmed: boolean;
    userReportedIssue?: string;
    staffOverride?: {
      decision: 'PASS' | 'FAIL';
      reasoning: string;
      overriddenBy: string;
      overriddenAt: Date;
    };
  }>;
  staffNotes: Array<{
    id: string;
    author: {
      id: string;
      name: string;
    };
    note: string;
    createdAt: Date;
  }>;
  auditLog: Array<{
    id: string;
    action: StaffActionType;
    performedBy: {
      id: string;
      name: string;
    };
    performedAt: Date;
    details: string;
  }>;
}
```

---

#### PATCH /api/admin/claims/[id]

**Purpose:** Update claim status or details

**Authentication:** Required (Staff role)

**Request:**
```typescript
{
  status?: ClaimReviewStatus;
  assignTo?: string; // User ID
  addNote?: string;
}
```

**Response:**
```typescript
{
  success: true;
  claim: {
    // Updated claim object
  };
}
```

---

#### POST /api/admin/claims/[id]/documents/[documentId]/override

**Purpose:** Staff override of AI decision

**Authentication:** Required (Senior Reviewer or Admin)

**Request:**
```typescript
{
  decision: 'PASS' | 'FAIL';
  reasoning: string; // Required - explain why overriding
  agentName?: string; // Which agent result to override
}
```

**Response:**
```typescript
{
  success: true;
  document: {
    // Updated document with staff override
  };
  auditLogEntry: {
    // Created audit log entry
  };
}
```

---

#### POST /api/admin/claims/[id]/approve

**Purpose:** Approve claim for DOJ submission

**Authentication:** Required (Senior Reviewer or Admin)

**Request:**
```typescript
{
  notes?: string;
  confirmReadiness: boolean; // Must be true
}
```

**Pre-conditions:**
- Readiness score ≥ 80
- No critical blockers
- All required documents validated

**Response:**
```typescript
{
  success: true;
  claim: {
    status: 'APPROVED';
    approvedBy: string;
    approvedAt: Date;
  };
  submissionPackage: {
    // Generated submission package info
  };
}
```

---

#### POST /api/admin/claims/[id]/reject

**Purpose:** Reject claim

**Authentication:** Required (Senior Reviewer or Admin)

**Request:**
```typescript
{
  reason: string; // Required
  notifyClaimant: boolean;
  allowResubmission: boolean;
}
```

**Response:**
```typescript
{
  success: true;
  claim: {
    status: 'REJECTED';
    rejectedBy: string;
    rejectedAt: Date;
    rejectionReason: string;
  };
}
```

---

#### POST /api/admin/claims/[id]/request-documents

**Purpose:** Request additional documents from claimant

**Authentication:** Required (Staff role)

**Request:**
```typescript
{
  requestedCategories: DocumentCategory[];
  message: string; // Message to claimant explaining what's needed
  dueDate?: Date;
}
```

**Response:**
```typescript
{
  success: true;
  claim: {
    status: 'NEEDS_INFO';
  };
  notification: {
    // Notification sent to claimant
  };
}
```

---

### Analytics

#### GET /api/admin/analytics

**Purpose:** Dashboard metrics and analytics

**Authentication:** Required (Admin role)

**Query Parameters:**
```typescript
{
  dateFrom?: Date;
  dateTo?: Date;
  claimType?: ClaimType;
}
```

**Response:**
```typescript
{
  overview: {
    totalClaims: number;
    claimsThisMonth: number;
    averageProcessingTime: number; // hours
    approvalRate: number; // percentage
  };
  byStatus: {
    [status: string]: number; // Count per status
  };
  aiPerformance: {
    overallAccuracy: number; // percentage
    byAgent: Array<{
      agentName: string;
      accuracy: number;
      averageConfidence: number;
      executionCount: number;
      failureRate: number;
      averageExecutionTime: number; // ms
    }>;
    costEstimate: {
      totalTokens: number;
      estimatedCost: number; // USD
    };
  };
  staffPerformance: {
    byStaff: Array<{
      staffId: string;
      staffName: string;
      claimsReviewed: number;
      averageReviewTime: number; // hours
      approvalRate: number;
      overrideRate: number; // How often they override AI
    }>;
  };
  dojOutcomes: {
    submitted: number;
    approved: number;
    denied: number;
    pending: number;
    approvalRate: number;
    averageTurnaround: number; // days
    commonDenialReasons: Array<{
      reason: string;
      count: number;
    }>;
  };
}
```

---

## Internal/Background Endpoints

These endpoints are not exposed publicly but are used by background jobs.

#### POST /api/internal/agents/execute

**Purpose:** Trigger AI agent execution

**Authentication:** Internal only (API key or service token)

**Request:**
```typescript
{
  agentName: string;
  input: {
    fileId?: string;
    sessionId?: string;
    // ... agent-specific input
  };
}
```

**Response:**
```typescript
{
  success: true;
  executionId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED';
}
```

---

#### POST /api/internal/agents/orchestrate

**Purpose:** Run all applicable agents for a document

**Authentication:** Internal only

**Request:**
```typescript
{
  fileId: string;
  sessionId: string;
}
```

**Process:**
1. Run Classifier Agent
2. Based on category, run specialized agents in parallel
3. Update document validation status
4. Trigger completeness assessment if all docs processed
5. Send notification to user when complete

**Response:**
```typescript
{
  success: true;
  orchestrationId: string;
  agentsQueued: string[];
}
```

---

## Webhooks

### Stripe Webhooks

#### POST /api/webhooks/stripe

**Purpose:** Handle Stripe payment events

**Events Handled:**
- `checkout.session.completed` - Subscription started
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

---

### Document Processing Webhooks (Future)

#### POST /api/webhooks/ocr-complete

**Purpose:** Callback when OCR processing completes

**Request:**
```typescript
{
  fileId: string;
  ocrText: string;
  confidence: number;
  pageCount: number;
}
```

---

## Rate Limiting

### Customer Endpoints

**Upload:**
- 10 uploads per minute per user
- 100 uploads per hour per user
- 500MB total per day per user

**General API:**
- 100 requests per minute per user
- 1000 requests per hour per user

### Admin Endpoints

**General:**
- 300 requests per minute per staff member
- No daily limit

### Error Response (Rate Limited)

```typescript
{
  error: 'Rate limit exceeded';
  retryAfter: number; // seconds
  limit: number;
  remaining: 0;
  resetAt: Date;
}
```

---

## Error Handling

### Standard Error Response

```typescript
{
  error: string; // Error message
  code: string; // Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
  details?: any; // Additional error details
  timestamp: Date;
  requestId: string; // For support/debugging
}
```

### Error Codes

**Authentication:**
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)

**Validation:**
- `VALIDATION_ERROR` (400)
- `INVALID_FILE_TYPE` (400)
- `FILE_TOO_LARGE` (400)

**Not Found:**
- `NOT_FOUND` (404)
- `DOCUMENT_NOT_FOUND` (404)
- `CLAIM_NOT_FOUND` (404)

**Processing:**
- `PROCESSING_ERROR` (500)
- `OCR_FAILED` (500)
- `AI_AGENT_ERROR` (500)

**Business Logic:**
- `CLAIM_NOT_READY` (400)
- `MISSING_REQUIRED_DOCUMENTS` (400)
- `ALREADY_SUBMITTED` (409)

---

## API Versioning

### Strategy

Current: Version 1 (no prefix)

Future: When breaking changes needed, use `/api/v2/...`

### Deprecation Policy

- Announce deprecation 3 months in advance
- Support old version for 6 months after new version release
- Provide migration guide

---

## Implementation Checklist

- [ ] Implement customer document endpoints
- [ ] Implement admin claim management endpoints
- [ ] Implement admin analytics endpoints
- [ ] Implement internal agent orchestration endpoints
- [ ] Add authentication middleware
- [ ] Add authorization checks (role-based)
- [ ] Implement rate limiting
- [ ] Add request validation (Zod schemas)
- [ ] Implement error handling middleware
- [ ] Add request logging
- [ ] Add API monitoring
- [ ] Write API documentation (OpenAPI/Swagger)
- [ ] Create API client library (optional)
- [ ] Load test endpoints
- [ ] Security audit
- [ ] Set up webhooks
- [ ] Configure CORS
- [ ] Add response caching where appropriate

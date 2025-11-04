# Internal Admin Dashboard Specification

## Purpose

The admin dashboard provides RadiantClaims staff with full visibility into AI agent validation results, enabling them to:
1. Review claims before DOJ submission
2. Identify and resolve document issues
3. Override AI decisions when necessary
4. Track claim processing status
5. Ensure DOJ compliance

**This interface is internal-only** and shows the full complexity hidden from customers.

---

## Page 1: Claims Review Queue

### Route
`/admin/claims`

### Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  RadiantClaims Admin Dashboard                               │
│  [Claims] [Analytics] [Settings]                    [Logout] │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📋 Claims Review Queue                                      │
│                                                              │
│  [All Claims ▼] [Status: All ▼] [Sort: Recent ▼] [Search...│
│                                                              │
│  Status Summary:                                             │
│  🔴 5 Critical Issues  🟡 12 Needs Review  🟢 23 Ready      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Claim ID  | Claimant       | Type       | Status | Actions │
│────────────────────────────────────────────────────────────  │
│  RC-1234   | John Smith     | Downwinder | 🔴 Critical       │
│            | Submitted: Jan 4           | Missing docs      │
│            |                            | [Review]          │
│────────────────────────────────────────────────────────────  │
│  RC-1235   | Mary Johnson   | Uranium    | 🟡 Needs Review  │
│            | Submitted: Jan 3           | AI flagged issues │
│            |                            | [Review]          │
│────────────────────────────────────────────────────────────  │
│  RC-1236   | Robert Davis   | Onsite     | 🟢 Ready         │
│            | Submitted: Jan 2           | All checks passed │
│            |                            | [Review] [Approve]│
└──────────────────────────────────────────────────────────────┘
```

### Features

**Filters:**
- Claim type (Downwinder, Onsite, Uranium)
- Status (Critical, Needs Review, Ready, Approved, Rejected)
- Date range
- Search by claimant name or claim ID

**Status Indicators:**
- 🔴 **Critical** - Missing required docs or validation failures
- 🟡 **Needs Review** - AI flagged issues, staff review needed
- 🟢 **Ready** - All validations passed, ready for approval
- ✅ **Approved** - Staff approved, ready for DOJ submission
- ❌ **Rejected** - Cannot proceed with current documents

**Quick Actions:**
- **Review** - Go to claim detail page
- **Approve** - Quick approve (only for "Ready" claims)
- **Assign** - Assign to staff member

---

## Page 2: Claim Detail Review

### Route
`/admin/claims/[claimId]`

### Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Queue                                             │
│                                                              │
│  Claim RC-1234: John Smith - Downwinder Claim               │
│  Submitted: Jan 4, 2025  |  Overall Status: 🔴 Critical     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📊 Claim Overview                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  65%           │
│  Readiness Score: 65/100 (Needs work)                       │
│                                                              │
│  🔴 Critical Issues (2)                                      │
│  • Missing required: Second proof of residence document      │
│  • Medical records: Disease not clearly covered by RECA      │
│                                                              │
│  ⚠️ Warnings (1)                                             │
│  • Name mismatch: "John Smith" vs "J. Michael Smith"        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📄 Document Analysis (3 documents)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Document 1: Birth Certificate                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ [Thumbnail]  Birth_Certificate.pdf               │   │ │
│  │ │              Uploaded: Jan 4, 2025               │   │ │
│  │ │              [View] [Download]                   │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                        │ │
│  │ 🤖 AI Agent Results:                                   │ │
│  │                                                        │ │
│  │ Classifier Agent: ✅ PASS (95% confidence)             │ │
│  │   Category: IDENTITY                                   │ │
│  │   Reasoning: "Document contains official state seal,  │ │
│  │   birth date, parents' names - clear birth cert"      │ │
│  │                                                        │ │
│  │ Identity Verification Agent: ✅ PASS                   │ │
│  │   ✓ Full name present: John Michael Smith             │ │
│  │   ✓ DOB: March 15, 1948                               │ │
│  │   ✓ Place of birth: Las Vegas, Clark County, NV      │ │
│  │   ✓ Official seal: Detected                           │ │
│  │   ✓ Issuing authority: Nevada Department of Health   │ │
│  │                                                        │ │
│  │ Staff Override: [None]                                 │ │
│  │ [Override Result] [Add Note]                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Document 2: Pathology Report                           │ │
│  │ [Thumbnail and agent results...]                       │ │
│  │                                                        │ │
│  │ Medical Compliance Agent: ⚠️ NEEDS REVIEW              │ │
│  │   🔴 Critical Issue: Disease coverage unclear          │ │
│  │   ⚠️ Diagnosis found: "Adenocarcinoma of lung"        │ │
│  │   ⚠️ RECA coverage: Lung cancer IS covered, but       │ │
│  │      type "adenocarcinoma" needs verification         │ │
│  │   ⚠️ Suggestion: Confirm with DOJ guidance that this  │ │
│  │      specific histology qualifies                     │ │
│  │                                                        │ │
│  │ Staff Decision:                                        │ │
│  │ [ ] Approve as-is                                      │ │
│  │ [ ] Request additional documentation                   │ │
│  │ [ ] Contact DOJ for clarification                      │ │
│  │ [Save Decision]                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Document 3: Utility Bill (June 1955)                   │ │
│  │ [Thumbnail and agent results...]                       │ │
│  │                                                        │ │
│  │ Residence Proof Agent: ✅ PASS                         │ │
│  │   ✓ Address: 123 Main St, Las Vegas, NV              │ │
│  │   ✓ County: Clark County (COVERED)                    │ │
│  │   ✓ Date: June 1955 (in exposure period 1951-1958)   │ │
│  │   ✓ Name: John Smith                                  │ │
│  │                                                        │ │
│  │ Completeness Agent: 🔴 FAIL                           │ │
│  │   🔴 Downwinders require minimum 2 residence docs     │ │
│  │   🔴 Only 1 residence document uploaded               │ │
│  │   → User needs to upload 1 more residence proof       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🎯 Completeness Orchestrator Results                        │
│                                                              │
│  Overall Readiness: 65/100 (Not ready for submission)       │
│                                                              │
│  Missing Required Documents:                                 │
│  🔴 Proof of Residence: Need 1 more document                │
│     Acceptable: utility bills, tax returns, school records  │
│                                                              │
│  Critical Blockers:                                          │
│  1. Insufficient residence proof (1/2 minimum)               │
│  2. Medical disease coverage needs verification              │
│                                                              │
│  Cross-Document Validation:                                  │
│  ⚠️ Name consistency issue:                                  │
│     • Birth certificate: "John Michael Smith"               │
│     • Utility bill: "John Smith"                            │
│     → Likely same person (middle name omitted), but verify  │
│                                                              │
│  Claim Type Detection:                                       │
│  ✓ Downwinder (92% confidence)                              │
│    Reasoning: Residence in Clark County, NV during          │
│    atmospheric testing period (1951-1962)                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  💬 Staff Notes & Actions                                    │
│                                                              │
│  [Text area for staff notes...]                             │
│                                                              │
│  Actions:                                                    │
│  [Request More Documents] [Approve Claim] [Reject Claim]     │
│  [Assign to Another Reviewer] [Contact Claimant]            │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Claim Overview Panel

**Purpose:** High-level summary of claim status

**Elements:**
- Claimant name and claim ID
- Claim type
- Submission date
- Overall readiness score (0-100)
- Progress bar visualization
- Count of critical issues
- Count of warnings

**Status Color Coding:**
- 0-50: Red (Critical issues)
- 51-79: Yellow (Needs review)
- 80-100: Green (Ready)

### 2. Document Analysis Cards

**Purpose:** Show full AI agent results for each document

**Card Structure:**
```
Document [N]: [Title]
├── Thumbnail & metadata
├── Classifier Agent Result
│   ├── Category determined
│   ├── Confidence score
│   └── Reasoning
├── Specialized Agent Result(s)
│   ├── Pass/Fail/Needs Review
│   ├── Extracted data
│   ├── Issues found
│   └── Evidence cited
└── Staff Override Section
    ├── Override dropdown
    ├── Note text area
    └── Save button
```

**Agent Result Display Format:**

**✅ PASS:**
```
[Agent Name]: ✅ PASS (XX% confidence)
  ✓ Check 1 passed: [details]
  ✓ Check 2 passed: [details]
  ✓ Check 3 passed: [details]
```

**⚠️ NEEDS REVIEW:**
```
[Agent Name]: ⚠️ NEEDS REVIEW (XX% confidence)
  ⚠️ Issue: [description]
  → Suggestion: [what to do]
  Evidence: [cited from document]
```

**🔴 FAIL:**
```
[Agent Name]: 🔴 FAIL
  🔴 Critical: [issue description]
  → Required action: [what must be done]
  DOJ Requirement: [reference]
```

### 3. Completeness Orchestrator Panel

**Purpose:** Overall claim assessment across all documents

**Sections:**

**A. Readiness Score**
- Numerical score (0-100)
- Visual gauge/progress bar
- Text interpretation ("Not ready", "Needs review", "Ready")

**B. Missing Requirements Checklist**
- Category-by-category breakdown
- What's present vs what's missing
- Priority levels (Critical, High, Medium, Low)

**C. Critical Blockers**
- Numbered list of issues preventing approval
- Clear description of each blocker
- Suggested resolution

**D. Cross-Document Validation**
- Name consistency check
- Date logic check (birth < exposure < diagnosis)
- Address consistency
- Any contradictions found

**E. Claim Type Detection**
- Detected type with confidence
- AI reasoning for detection
- Staff can override if wrong

### 4. Staff Action Panel

**Purpose:** Staff decision-making interface

**Available Actions:**

**Request More Documents:**
- Opens email/message template
- Pre-filled with specific document requests based on AI findings
- "Dear [Claimant], we need the following additional documents..."

**Approve Claim:**
- Only enabled if readiness ≥ 80 and no critical blockers
- Confirmation modal: "Are you sure this claim is ready for DOJ submission?"
- Logs staff member and approval timestamp

**Reject Claim:**
- Requires reason selection
- Free-text explanation
- Sends notification to claimant

**Assign to Another Reviewer:**
- Dropdown of staff members
- Optional note for next reviewer

**Contact Claimant:**
- Opens messaging interface
- Email/phone/in-app message options

### 5. Staff Override System

**Purpose:** Allow staff to override AI decisions when necessary

**Override Options:**
- **Accept AI decision** (default)
- **Override to PASS** - Staff determines document is acceptable despite AI concerns
- **Override to FAIL** - Staff determines document is not acceptable despite AI pass
- **Request manual verification** - Escalate to senior reviewer

**Override Requirements:**
- Must provide reasoning
- Logged in audit trail
- Cannot override certain critical checks (e.g., missing required docs)

---

## Agent Result Visualization

### Agent Status Icons

```typescript
const agentStatusConfig = {
  PASS: {
    icon: '✅',
    color: 'green',
    bgColor: '#d1fae5',
    label: 'PASS',
  },
  NEEDS_REVIEW: {
    icon: '⚠️',
    color: 'yellow',
    bgColor: '#fef3c7',
    label: 'NEEDS REVIEW',
  },
  FAIL: {
    icon: '🔴',
    color: 'red',
    bgColor: '#fee2e2',
    label: 'FAIL',
  },
  ERROR: {
    icon: '❌',
    color: 'red',
    bgColor: '#fee2e2',
    label: 'ERROR',
  },
  PROCESSING: {
    icon: '⏳',
    color: 'blue',
    bgColor: '#dbeafe',
    label: 'PROCESSING',
  },
};
```

### Evidence Display

**Purpose:** Show staff exactly what AI found in document

**Format:**
```
Evidence:
┌─────────────────────────────────────────────┐
│ Source: Page 1, lines 15-18                 │
│ Type: TEXT_EXTRACTED                        │
│ Confidence: 95%                             │
│                                             │
│ Content:                                    │
│ "Date of Birth: March 15, 1948             │
│  Place of Birth: Las Vegas, Clark County,  │
│  State of Nevada"                           │
└─────────────────────────────────────────────┘
```

### Confidence Score Display

**Visual Representation:**
```
Confidence: 95% ━━━━━━━━━━━━━━━━━━━

Confidence: 72% ━━━━━━━━━━━━━━░░░░░░

Confidence: 45% ━━━━━━━░░░░░░░░░░░░░
```

**Interpretation:**
- 90-100%: Very High (Green)
- 75-89%: High (Light Green)
- 60-74%: Moderate (Yellow)
- 40-59%: Low (Orange)
- 0-39%: Very Low (Red)

---

## Workflow States

### Claim States

```typescript
enum ClaimStatus {
  PENDING = 'PENDING',              // Just submitted, not reviewed
  IN_REVIEW = 'IN_REVIEW',          // Staff currently reviewing
  NEEDS_INFO = 'NEEDS_INFO',        // Requested more docs from claimant
  READY = 'READY',                  // All checks passed, ready to approve
  APPROVED = 'APPROVED',            // Staff approved, ready for DOJ
  SUBMITTED_TO_DOJ = 'SUBMITTED_TO_DOJ', // Sent to DOJ
  DOJ_APPROVED = 'DOJ_APPROVED',    // DOJ approved claim
  DOJ_DENIED = 'DOJ_DENIED',        // DOJ denied claim
  REJECTED = 'REJECTED',            // RadiantClaims rejected (won't submit)
}
```

### State Transitions

```
PENDING → IN_REVIEW (when staff opens)
IN_REVIEW → NEEDS_INFO (when requesting docs)
IN_REVIEW → READY (when all checks pass)
IN_REVIEW → REJECTED (when staff rejects)
NEEDS_INFO → IN_REVIEW (when claimant uploads)
READY → APPROVED (when staff approves)
APPROVED → SUBMITTED_TO_DOJ (when sent to DOJ)
SUBMITTED_TO_DOJ → DOJ_APPROVED or DOJ_DENIED
```

---

## Analytics & Reporting View

### Route
`/admin/analytics`

### Metrics to Track

**Processing Metrics:**
- Average time from submission to approval
- Number of claims in each status
- AI accuracy rate (% of AI decisions staff agree with)
- Most common document issues
- Claim approval rate

**AI Performance:**
- Per-agent accuracy
- False positive rate (AI says fail, staff says pass)
- False negative rate (AI says pass, staff says fail)
- Average confidence scores
- Processing time per document

**Staff Performance:**
- Claims reviewed per staff member
- Average review time
- Override frequency
- Approval rate

**DOJ Outcomes:**
- Submission rate
- DOJ approval rate
- Common denial reasons
- Turnaround time

---

## Permissions & Access Control

### Roles

**Reviewer (Staff):**
- View claims queue
- Review claim details
- Request more documents
- Cannot approve/reject claims

**Senior Reviewer:**
- All Reviewer permissions
- Approve/reject claims
- Override AI decisions
- Assign claims

**Admin:**
- All Senior Reviewer permissions
- Access analytics
- Manage staff accounts
- Configure AI agent thresholds

---

## Integration Points

### API Endpoints

**GET /api/admin/claims**
- List all claims with filters
- Returns paginated results

**GET /api/admin/claims/[id]**
- Get full claim details with all agent results

**PATCH /api/admin/claims/[id]**
- Update claim status
- Add staff notes
- Override AI decisions

**POST /api/admin/claims/[id]/approve**
- Approve claim for DOJ submission

**POST /api/admin/claims/[id]/reject**
- Reject claim with reason

**POST /api/admin/claims/[id]/request-documents**
- Request additional documents from claimant

**GET /api/admin/analytics**
- Get dashboard metrics

---

## Implementation Checklist

- [ ] Create claims queue list view
- [ ] Create claim detail review page
- [ ] Build document analysis card component
- [ ] Build agent result display component
- [ ] Build completeness orchestrator panel
- [ ] Build staff action panel
- [ ] Implement staff override system
- [ ] Create evidence display component
- [ ] Build confidence score visualizations
- [ ] Implement claim state workflow
- [ ] Add staff notes functionality
- [ ] Build request documents feature
- [ ] Build approve/reject workflow
- [ ] Add assignment system
- [ ] Create analytics dashboard
- [ ] Implement access control
- [ ] Add audit logging
- [ ] Build notification system
- [ ] Add real-time updates
- [ ] Create export functionality (for DOJ submission)
- [ ] Test with real claims

---

## Security Considerations

**Data Access:**
- All admin routes require authentication
- Role-based access control enforced
- Audit log of all claim views and actions

**PII Protection:**
- Redact SSN except last 4 digits
- Mask sensitive medical info in logs
- Encrypted storage for all documents

**Audit Trail:**
- Log all staff actions (view, approve, reject, override)
- Timestamp and user ID for all actions
- Immutable audit log (append-only)

# Database Schema Changes

## Overview

This document specifies the database schema changes needed to support the AI agent validation system.

---

## New Models

### 1. DocumentValidation Model

**Purpose:** Store AI agent validation results for each document

```prisma
model DocumentValidation {
  id                String   @id @default(cuid())

  // Relations
  uploadedFileId    String   @unique
  uploadedFile      UploadedFile @relation(fields: [uploadedFileId], references: [id], onDelete: Cascade)

  // Agent Results (stored as JSON)
  classifierResult  Json?    // From Classifier Agent
  identityResult    Json?    // From Identity Verification Agent
  medicalResult     Json?    // From Medical Compliance Agent
  residenceResult   Json?    // From Residence Proof Agent
  employmentResult  Json?    // From Employment Verification Agent
  extractedData     Json?    // From Data Extraction Agent

  // Overall Status
  status            ValidationStatus @default(PENDING)
  overallConfidence Float?           // 0-1

  // Issues and Suggestions
  criticalIssues    Json[]   // Array of critical blocking issues
  warnings          Json[]   // Array of warnings that need review
  suggestions       Json[]   // Array of actionable suggestions

  // Processing Metadata
  processingStartedAt DateTime?
  processingCompletedAt DateTime?
  processingTimeMs  Int?

  // Staff Review
  reviewedBy        String?  // Staff user ID who reviewed
  reviewedAt        DateTime?
  staffOverride     Json?    // Staff override decision if any
  staffNotes        String?  @db.Text

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([status])
  @@index([uploadedFileId])
}

enum ValidationStatus {
  PENDING           // Not yet processed
  PROCESSING        // AI agents currently running
  VERIFIED          // All agents passed
  NEEDS_REVIEW      // Issues found that need staff review
  STAFF_APPROVED    // Staff reviewed and approved
  REJECTED          // Validation failed or staff rejected
  ERROR             // Processing error occurred
}
```

### 2. ClaimReadiness Model

**Purpose:** Store completeness orchestrator results at the claim level

```prisma
model ClaimReadiness {
  id                String   @id @default(cuid())

  // Relations
  intakeSessionId   String   @unique
  intakeSession     IntakeSession @relation(fields: [intakeSessionId], references: [id], onDelete: Cascade)

  // Readiness Assessment
  readinessScore    Float    // 0-100
  isReadyForSubmission Boolean @default(false)

  // Completeness by Category
  completeness      Json     // Structured data about what's complete vs missing

  // Issues
  criticalBlockers  Json[]   // Issues preventing submission
  warnings          Json[]   // Issues that should be reviewed

  // Cross-Document Validation
  nameConsistent    Boolean  @default(true)
  datesConsistent   Boolean  @default(true)
  claimTypeConfidence Float? // 0-1
  detectedClaimType ClaimType?

  // Last Assessment
  lastAssessedAt    DateTime @default(now())
  assessmentVersion String   @default("1.0") // For tracking algorithm changes

  // Staff Review
  staffReviewStatus ClaimReviewStatus @default(PENDING)
  reviewedBy        String?  // Staff user ID
  reviewedAt        DateTime?
  staffDecision     Json?    // Staff decision and reasoning

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([readinessScore])
  @@index([isReadyForSubmission])
  @@index([staffReviewStatus])
}

enum ClaimReviewStatus {
  PENDING           // Not yet reviewed by staff
  IN_REVIEW         // Staff currently reviewing
  NEEDS_INFO        // Requested more documents from claimant
  READY             // All checks passed, ready to approve
  APPROVED          // Staff approved for DOJ submission
  REJECTED          // Staff rejected claim
  SUBMITTED_TO_DOJ  // Sent to DOJ
  DOJ_APPROVED      // DOJ approved the claim
  DOJ_DENIED        // DOJ denied the claim
}
```

### 3. AgentExecutionLog Model

**Purpose:** Audit trail of all AI agent executions

```prisma
model AgentExecutionLog {
  id                String   @id @default(cuid())

  // Agent Info
  agentName         String   // e.g., "ClassifierAgent", "IdentityVerificationAgent"
  agentVersion      String   // For tracking agent changes

  // Relations
  uploadedFileId    String?
  uploadedFile      UploadedFile? @relation(fields: [uploadedFileId], references: [id], onDelete: SetNull)

  intakeSessionId   String?
  intakeSession     IntakeSession? @relation(fields: [intakeSessionId], references: [id], onDelete: SetNull)

  // Execution Details
  status            AgentExecutionStatus
  input             Json     // Input parameters
  output            Json?    // Agent output
  error             String?  @db.Text // Error message if failed

  // Timing
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  executionTimeMs   Int?

  // AI Model Info
  modelUsed         String?  // e.g., "gpt-4o"
  tokensUsed        Int?
  estimatedCost     Float?   // USD

  @@index([agentName])
  @@index([status])
  @@index([uploadedFileId])
  @@index([intakeSessionId])
  @@index([startedAt])
}

enum AgentExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  TIMEOUT
}
```

### 4. StaffAction Model

**Purpose:** Audit trail of staff actions on claims

```prisma
model StaffAction {
  id                String   @id @default(cuid())

  // Staff Member
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Target
  intakeSessionId   String
  intakeSession     IntakeSession @relation(fields: [intakeSessionId], references: [id], onDelete: Cascade)

  // Action Details
  actionType        StaffActionType
  actionData        Json?    // Additional data about the action
  notes             String?  @db.Text

  // Timestamp
  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([intakeSessionId])
  @@index([actionType])
  @@index([createdAt])
}

enum StaffActionType {
  VIEWED_CLAIM
  STARTED_REVIEW
  REQUESTED_DOCUMENTS
  ADDED_NOTE
  OVERRODE_AI
  APPROVED_DOCUMENT
  REJECTED_DOCUMENT
  APPROVED_CLAIM
  REJECTED_CLAIM
  ASSIGNED_CLAIM
  CONTACTED_CLAIMANT
}
```

---

## Modified Models

### UploadedFile Model (Existing - Add Fields)

```prisma
model UploadedFile {
  id                String   @id @default(cuid())

  // Existing fields...
  originalFilename  String
  storageUrl        String
  mimeType          String
  sizeBytes         Int
  category          FileCategory?
  status            FileStatus @default(PENDING)

  // NEW: Simple status for customer-facing UI
  customerStatus    CustomerFileStatus @default(PROCESSING)

  // NEW: User-provided information
  userNotes         String?  @db.Text
  userConfirmed     Boolean  @default(false) // User confirmed extracted data is correct
  userReportedIssue String?  @db.Text        // User-reported issue with document

  // NEW: Extracted data summary for quick access
  extractedDataSummary Json? // Flattened key data (name, date, address, etc.)

  // Relations
  intakeSessionId   String
  intakeSession     IntakeSession @relation(fields: [intakeSessionId], references: [id], onDelete: Cascade)

  // NEW: Validation relation
  validation        DocumentValidation?

  // NEW: Agent logs
  agentLogs         AgentExecutionLog[]

  uploadedAt        DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([intakeSessionId])
  @@index([category])
  @@index([status])
  @@index([customerStatus]) // NEW
}

enum CustomerFileStatus {
  PROCESSING        // AI validation in progress
  VERIFIED          // All good, show green checkmark
  NEEDS_REVIEW      // Issues found, show warning
  ERROR             // Processing failed
}
```

### IntakeSession Model (Existing - Add Fields)

```prisma
model IntakeSession {
  id                String   @id @default(cuid())

  // Existing fields...
  claimantId        String
  claimant          Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  sessionData       Json?
  status            SessionStatus @default(IN_PROGRESS)

  // Existing relations
  uploadedFiles     UploadedFile[]

  // NEW: Validation relations
  claimReadiness    ClaimReadiness?
  agentLogs         AgentExecutionLog[]
  staffActions      StaffAction[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### User Model (Existing - Add Role)

```prisma
model User {
  id                String   @id @default(cuid())

  // Existing fields...
  email             String   @unique
  name              String?

  // NEW: Staff role
  role              UserRole @default(CUSTOMER)

  // NEW: Staff actions relation
  staffActions      StaffAction[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum UserRole {
  CUSTOMER          // Regular user filing a claim
  STAFF_REVIEWER    // Can review claims
  SENIOR_REVIEWER   // Can approve/reject claims
  ADMIN             // Full access
}
```

---

## Migration Strategy

### Phase 1: Add New Models (Non-Breaking)

```bash
# Create migration
pnpm prisma migrate dev --name add_validation_models

# This adds:
# - DocumentValidation
# - ClaimReadiness
# - AgentExecutionLog
# - StaffAction
```

### Phase 2: Add New Fields to Existing Models

```bash
# Create migration
pnpm prisma migrate dev --name add_validation_fields

# This modifies:
# - UploadedFile (adds customerStatus, userNotes, etc.)
# - IntakeSession (adds relations)
# - User (adds role)
```

### Phase 3: Backfill Existing Data

```typescript
// Script to backfill existing documents with default validation status
async function backfillValidationStatus() {
  const existingFiles = await db.uploadedFile.findMany({
    where: {
      validation: null,
    },
  });

  for (const file of existingFiles) {
    await db.documentValidation.create({
      data: {
        uploadedFileId: file.id,
        status: 'PENDING',
      },
    });
  }
}
```

---

## Indexes

### Performance Optimization

```prisma
// Indexes for common queries

// Staff dashboard - find claims needing review
@@index([staffReviewStatus, readinessScore])

// AI agent processing - find pending documents
@@index([status, uploadedFileId])

// Audit trail - find actions by staff member
@@index([userId, createdAt])

// Analytics - agent performance tracking
@@index([agentName, status, startedAt])

// Customer UI - find user's documents
@@index([intakeSessionId, customerStatus])
```

---

## JSON Field Structures

### DocumentValidation.classifierResult

```typescript
interface ClassifierResult {
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'ERROR';
  confidence: number;
  data: {
    category: DocumentCategory;
    confidence: number;
    alternativeCategories: Array<{
      category: DocumentCategory;
      confidence: number;
    }>;
    reasoning: string;
    keyIndicators: string[];
  };
  evidence: Evidence[];
  reasoning: string;
  issues: Issue[];
  processingTimeMs: number;
  timestamp: Date;
}
```

### DocumentValidation.identityResult

```typescript
interface IdentityResult {
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'ERROR';
  confidence: number;
  data: {
    isValid: boolean;
    fullName: string | null;
    dateOfBirth: string | null;
    placeOfBirth: {
      city?: string;
      county?: string;
      state?: string;
    } | null;
    issuingAuthority: string | null;
    hasOfficialSeal: boolean;
    documentDate: string | null;
    requiredElements: {
      name: 'PRESENT' | 'MISSING' | 'UNCLEAR';
      dob: 'PRESENT' | 'MISSING' | 'UNCLEAR';
      placeOfBirth: 'PRESENT' | 'MISSING' | 'UNCLEAR';
      officialSeal: 'PRESENT' | 'MISSING' | 'UNCLEAR';
      issuingAuthority: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    };
  };
  evidence: Evidence[];
  reasoning: string;
  issues: Issue[];
  processingTimeMs: number;
  timestamp: Date;
}
```

### DocumentValidation.criticalIssues

```typescript
interface Issue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string; // e.g., "MISSING_SIGNATURE", "UNCLEAR_TEXT"
  message: string;
  suggestion: string;
  affectsApproval: boolean;
  field?: string; // Which field is affected
  location?: string; // Where in document (page, line)
}
```

### ClaimReadiness.completeness

```typescript
interface Completeness {
  sections: Array<{
    category: string; // e.g., "Identity Documents"
    required: boolean;
    minDocuments: number;
    currentDocuments: number;
    status: 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_REVIEW';
    documents: Array<{
      fileId: string;
      fileName: string;
      status: ValidationStatus;
    }>;
  }>;
  overallPercent: number; // 0-100
}
```

### StaffAction.actionData

```typescript
// Example for OVERRODE_AI action
interface OverrideActionData {
  documentId: string;
  agentName: string;
  originalDecision: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  newDecision: 'PASS' | 'FAIL';
  reasoning: string;
}

// Example for REQUESTED_DOCUMENTS action
interface RequestDocumentsActionData {
  requestedCategories: DocumentCategory[];
  messageToClaimant: string;
  dueDate?: Date;
}

// Example for APPROVED_CLAIM action
interface ApproveClaimActionData {
  readinessScore: number;
  allChecks: Array<{
    check: string;
    passed: boolean;
  }>;
  submissionReady: boolean;
}
```

---

## Data Retention Policy

### Archive Strategy

**Active Claims (< 90 days):**
- Full data retention
- All agent logs kept
- Fast access required

**Completed Claims (90 days - 7 years):**
- Document files archived to cold storage
- Agent execution logs summarized
- Validation results kept
- Slower access acceptable

**Expired Claims (> 7 years):**
- Per legal requirements
- May need to retain for audit purposes
- Check with legal team

---

## Backup Strategy

**Daily Backups:**
- Full database backup
- Store in separate region
- Retain for 30 days

**Point-in-Time Recovery:**
- Enable for production
- 7-day recovery window

**Document Files:**
- Separate backup from database
- Encrypted at rest
- Versioned storage

---

## Implementation Checklist

- [ ] Create DocumentValidation model migration
- [ ] Create ClaimReadiness model migration
- [ ] Create AgentExecutionLog model migration
- [ ] Create StaffAction model migration
- [ ] Update UploadedFile model
- [ ] Update IntakeSession model
- [ ] Update User model with roles
- [ ] Add all necessary indexes
- [ ] Write backfill scripts for existing data
- [ ] Test migrations on staging
- [ ] Set up backup automation
- [ ] Configure data retention policies
- [ ] Document JSON field structures for frontend
- [ ] Create database access layer (Prisma queries)
- [ ] Add database monitoring
- [ ] Load test with expected data volumes

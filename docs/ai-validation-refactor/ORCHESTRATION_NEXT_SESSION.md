# Next Session: Build Orchestration Service

## 🎯 Current Status: All 7 Agents Complete! (100%)

We've successfully implemented all 7 AI agents. The system is ready for the orchestration layer.

### ✅ Completed Agents

1. **ClassifierAgent** - Categorizes documents (IDENTITY, MEDICAL_RECORDS, RESIDENCE_PROOF, etc.)
2. **IdentityVerificationAgent** - Validates birth certificates and IDs, extracts name/DOB/birthplace
3. **MedicalComplianceAgent** - Validates RECA-covered diseases, checks pathology reports
4. **ResidenceProofAgent** - Validates residence in RECA-covered counties (AZ, NV, UT) during 1951-1958
5. **EmploymentVerificationAgent** - Validates employment at DOE facilities, uranium mines, test sites
6. **DataExtractionAgent** - Consolidates all extracted data into unified structure for form pre-fill
7. **CompletenessOrchestratorAgent** - Analyzes entire claim, calculates readiness score (0-100)

All agents compile successfully with no TypeScript errors.

---

## 🚀 Next Task: Build Orchestration Service

### Goal
Create a service that:
1. Runs agents in the correct order
2. Handles errors gracefully
3. Supports parallel execution where possible
4. Provides progress updates
5. Stores results in the database

### Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Document-Level Agents (Run in Parallel)          │
│  - ClassifierAgent (for each uploaded file)                │
│  - IdentityVerificationAgent (for identity docs)           │
│  - MedicalComplianceAgent (for medical docs)               │
│  - ResidenceProofAgent (for residence docs)                │
│  - EmploymentVerificationAgent (for employment docs)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Data Extraction (Session-Level)                  │
│  - DataExtractionAgent (consolidates all document results) │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Completeness Check (Session-Level)               │
│  - CompletenessOrchestratorAgent (analyzes claim readiness)│
└─────────────────────────────────────────────────────────────┘
```

### Recommended File Location

Create: `src/lib/ai-agents/orchestration-service.ts`

### Key Functions to Implement

```typescript
/**
 * Validate a single uploaded document
 * Runs: Classifier + appropriate validation agent based on category
 */
async function validateDocument(uploadedFileId: string): Promise<void>

/**
 * Validate all documents in a session
 * Runs: All document agents in parallel
 */
async function validateSession(intakeSessionId: string): Promise<void>

/**
 * Run data extraction for a session
 * Runs: DataExtractionAgent (requires all document validations complete)
 */
async function extractSessionData(intakeSessionId: string): Promise<void>

/**
 * Run completeness check for a session
 * Runs: CompletenessOrchestratorAgent (requires data extraction complete)
 */
async function checkSessionCompleteness(intakeSessionId: string): Promise<CompletenessResult>

/**
 * Full validation pipeline (all phases)
 * Runs: All agents in correct order
 */
async function runFullValidation(intakeSessionId: string): Promise<{
  documentsValidated: number;
  dataExtracted: boolean;
  readinessScore: number;
  isReadyForSubmission: boolean;
}>
```

---

## 📋 Implementation Checklist

### Phase 1: Basic Orchestration (2-3 hours)

- [ ] Create `src/lib/ai-agents/orchestration-service.ts`
- [ ] Implement `validateDocument()` function
  - [ ] Run ClassifierAgent first
  - [ ] Based on category, run appropriate agent (Identity, Medical, Residence, or Employment)
  - [ ] Handle errors gracefully
  - [ ] Return validation status
- [ ] Implement `validateSession()` function
  - [ ] Get all uploaded files for session
  - [ ] Run `validateDocument()` for each file in parallel
  - [ ] Wait for all to complete
  - [ ] Return summary
- [ ] Add basic error handling and logging

### Phase 2: Data Extraction & Completeness (1-2 hours)

- [ ] Implement `extractSessionData()` function
  - [ ] Check if all documents validated
  - [ ] Run DataExtractionAgent
  - [ ] Store results in IntakeSession.recaFormData
- [ ] Implement `checkSessionCompleteness()` function
  - [ ] Check if data extraction complete
  - [ ] Run CompletenessOrchestratorAgent
  - [ ] Store results in ClaimReadiness table
  - [ ] Return readiness score and recommendations

### Phase 3: Full Pipeline (1 hour)

- [ ] Implement `runFullValidation()` function
  - [ ] Run validateSession() (Phase 1)
  - [ ] Run extractSessionData() (Phase 2)
  - [ ] Run checkSessionCompleteness() (Phase 3)
  - [ ] Return comprehensive results
- [ ] Add progress tracking (optional but recommended)
- [ ] Add retry logic for failed agents (optional)

### Phase 4: API Endpoints (1-2 hours)

- [ ] Create `src/app/api/validation/document/route.ts`
  - [ ] POST endpoint to validate single document
  - [ ] Returns validation result
- [ ] Create `src/app/api/validation/session/route.ts`
  - [ ] POST endpoint to validate entire session
  - [ ] Returns session validation summary
- [ ] Create `src/app/api/validation/status/[sessionId]/route.ts`
  - [ ] GET endpoint to check validation progress
  - [ ] Returns current status and results

---

## 🔑 Key Design Decisions

### 1. Sequential vs Parallel Execution

**Document-level agents (Phase 1):** Run in PARALLEL
- Each document is independent
- Much faster (6 docs × 3 sec each = 18 sec parallel vs 18 sec × 6 = 108 sec sequential)

**Session-level agents (Phases 2-3):** Run SEQUENTIALLY
- DataExtraction depends on all document validations
- Completeness depends on DataExtraction
- Must run in order

### 2. Error Handling Strategy

**Option A: Fail Fast**
- If any agent fails, stop entire pipeline
- Pros: Simple, clear errors
- Cons: One bad document blocks everything

**Option B: Continue on Error** (RECOMMENDED)
- Continue validating other documents if one fails
- Track failed documents separately
- Pros: Partial results are useful
- Cons: More complex error handling

**Recommendation:** Use Option B for document agents, Option A for session agents

### 3. Progress Tracking

**Simple approach:**
- Store status in DocumentValidation.status (PENDING, PROCESSING, COMPLETED, FAILED)
- Client polls API to check status

**Advanced approach:**
- Use WebSocket or Server-Sent Events for real-time updates
- Stream progress as agents complete

**Recommendation:** Start with simple polling, add real-time later if needed

---

## 📝 Code Templates

### Basic Orchestration Structure

```typescript
import {
  ClassifierAgent,
  IdentityVerificationAgent,
  MedicalComplianceAgent,
  ResidenceProofAgent,
  EmploymentVerificationAgent,
  DataExtractionAgent,
  CompletenessOrchestratorAgent,
} from './agents';
import { db } from '@/lib/db';
import type { AgentExecutionContext } from './base-agent';

/**
 * Validate a single document
 */
export async function validateDocument(uploadedFileId: string): Promise<void> {
  const file = await db.uploadedFile.findUnique({
    where: { id: uploadedFileId },
  });

  if (!file) {
    throw new Error(`UploadedFile ${uploadedFileId} not found`);
  }

  // Create DocumentValidation record if it doesn't exist
  await db.documentValidation.upsert({
    where: { uploadedFileId },
    create: {
      uploadedFileId,
      status: 'PROCESSING',
      processingStartedAt: new Date(),
    },
    update: {
      status: 'PROCESSING',
      processingStartedAt: new Date(),
    },
  });

  const context: AgentExecutionContext = {
    uploadedFileId,
    intakeSessionId: file.intakeSessionId,
    documentUrl: file.fileKey,
    documentText: file.ocrText || undefined,
    metadata: {},
  };

  try {
    // Step 1: Classify document
    const classifierAgent = new ClassifierAgent();
    const classificationResult = await classifierAgent.execute(context);

    // Step 2: Run appropriate validation agent based on category
    const category = classificationResult.data.category;

    if (category === 'IDENTITY') {
      const identityAgent = new IdentityVerificationAgent();
      await identityAgent.execute(context);
    } else if (['PATHOLOGY_REPORT', 'MEDICAL_RECORDS', 'DISCHARGE_SUMMARY', 'TUMOR_REGISTRY', 'TREATMENT_RECORDS'].includes(category)) {
      const medicalAgent = new MedicalComplianceAgent();
      await medicalAgent.execute(context);
    } else if (['PROOF_OF_RESIDENCE', 'UTILITY_BILL', 'MORTGAGE_STATEMENT', 'TAX_RETURN', 'SCHOOL_RECORDS'].includes(category)) {
      const residenceAgent = new ResidenceProofAgent();
      await residenceAgent.execute(context);
    } else if (category === 'EMPLOYMENT_RECORDS') {
      const employmentAgent = new EmploymentVerificationAgent();
      await employmentAgent.execute(context);
    }

    // Mark as completed
    await db.documentValidation.update({
      where: { uploadedFileId },
      data: {
        status: 'COMPLETED',
        processingCompletedAt: new Date(),
      },
    });
  } catch (error) {
    // Mark as failed
    await db.documentValidation.update({
      where: { uploadedFileId },
      data: {
        status: 'FAILED',
        processingCompletedAt: new Date(),
      },
    });
    throw error;
  }
}
```

### Session Validation Template

```typescript
/**
 * Validate all documents in a session
 */
export async function validateSession(intakeSessionId: string): Promise<{
  totalDocuments: number;
  validated: number;
  failed: number;
}> {
  const session = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    include: {
      uploadedFiles: true,
    },
  });

  if (!session) {
    throw new Error(`IntakeSession ${intakeSessionId} not found`);
  }

  // Run validation for all files in parallel
  const results = await Promise.allSettled(
    session.uploadedFiles.map((file) => validateDocument(file.id))
  );

  // Count results
  const validated = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    totalDocuments: session.uploadedFiles.length,
    validated,
    failed,
  };
}
```

---

## 🧪 Testing Strategy

### Manual Testing

1. **Single Document Validation**
   ```typescript
   await validateDocument('file_123');
   // Check DocumentValidation table for results
   ```

2. **Session Validation**
   ```typescript
   await validateSession('session_abc');
   // Check all DocumentValidation records updated
   ```

3. **Full Pipeline**
   ```typescript
   const result = await runFullValidation('session_abc');
   console.log(result.readinessScore); // Should be 0-100
   ```

### Integration Testing

Create test session with sample documents:
- 1 birth certificate (identity)
- 1 pathology report (medical)
- 1 utility bill (residence)
- 1 employment letter (employment)

Run full validation and verify:
- All documents validated
- Data extracted to recaFormData
- Readiness score calculated
- ClaimReadiness table populated

---

## 🎨 Future Enhancements (Not Required Now)

1. **Background Job Queue**
   - Use BullMQ or Inngest for long-running validations
   - Prevents API timeouts
   - Allows retry logic

2. **Real-time Progress Updates**
   - WebSocket or SSE for live progress
   - Show "Validating document 3 of 6..." in UI

3. **Caching**
   - Cache agent results to avoid re-running
   - Only re-run if document changes

4. **Batch Processing**
   - Process multiple sessions at once
   - Useful for bulk imports

5. **Cost Tracking**
   - Track OpenAI API costs per session
   - Show estimated cost before validation

---

## 📚 Reference Files

### Agent Files (All Complete)
- `src/lib/ai-agents/agents/classifier-agent.ts`
- `src/lib/ai-agents/agents/identity-verification-agent.ts`
- `src/lib/ai-agents/agents/medical-compliance-agent.ts`
- `src/lib/ai-agents/agents/residence-proof-agent.ts`
- `src/lib/ai-agents/agents/employment-verification-agent.ts`
- `src/lib/ai-agents/agents/data-extraction-agent.ts`
- `src/lib/ai-agents/agents/completeness-orchestrator-agent.ts`

### Supporting Files
- `src/lib/ai-agents/base-agent.ts` - Base class for agents
- `src/lib/ai-agents/types/agent-results.ts` - All result type definitions
- `src/lib/ai-agents/reca-reference-data.ts` - RECA constants (counties, facilities, periods)
- `prisma/schema.prisma` - Database models

### Database Tables Used
- `UploadedFile` - Stores uploaded documents
- `DocumentValidation` - Stores per-document validation results
- `IntakeSession` - Stores session data and recaFormData
- `ClaimReadiness` - Stores completeness analysis
- `AgentExecutionLog` - Stores agent execution logs

---

## 🚦 Success Criteria

The orchestration service is complete when:

1. ✅ Can validate a single document (Classifier + appropriate agent)
2. ✅ Can validate all documents in a session in parallel
3. ✅ Can run data extraction after document validation
4. ✅ Can run completeness check after data extraction
5. ✅ Full pipeline runs without errors on test data
6. ✅ Results stored correctly in all database tables
7. ✅ Error handling works (failed documents don't block session)
8. ✅ TypeScript compiles with no errors

---

## 💡 Quick Start for Next Session

```bash
# 1. Review this document
# 2. Create the orchestration service file
touch src/lib/ai-agents/orchestration-service.ts

# 3. Start with validateDocument() function
# 4. Test with a single document
# 5. Expand to validateSession()
# 6. Add data extraction and completeness
# 7. Create API endpoints
# 8. Test full pipeline
```

---

**Estimated Time:** 4-6 hours total for full orchestration + API endpoints

**Current Status:** All agents ready, database schema ready, just need the glue code!

**Next Steps:** Build orchestration service → Create API endpoints → Integrate with upload flow → UI updates

Good luck! The foundation is rock-solid! 🚀

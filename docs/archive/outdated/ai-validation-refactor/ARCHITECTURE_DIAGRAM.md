# AI Validation System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS DOCUMENT                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Upload Handler     │
                    │  (Existing System)   │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Document Stored    │
                    │    in Database       │
                    │  (UploadedFile)      │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  TRIGGER AI          │
                    │  VALIDATION          │
                    │  (Background Job)    │
                    └───────────┬──────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │    Agent Orchestration Service        │
            │  • Manages agent execution order      │
            │  • Handles parallel processing        │
            │  • Tracks progress                    │
            └───────────────────┬───────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐       ┌──────────────┐
│  Classifier  │      │   Identity   │       │   Medical    │
│    Agent     │─────▶│Verification  │       │  Compliance  │
│              │      │    Agent     │       │    Agent     │
└──────────────┘      └──────────────┘       └──────────────┘
        │
        │ Determines category
        │
    ┌───┴──────────────────────┬─────────────────┐
    │                          │                 │
    ▼                          ▼                 ▼
┌──────────┐          ┌──────────────┐   ┌──────────────┐
│Residence │          │ Employment   │   │ (Additional) │
│  Proof   │          │Verification  │   │   Agents     │
│  Agent   │          │    Agent     │   │              │
└──────────┘          └──────────────┘   └──────────────┘

        All document agents complete
                    │
                    ▼
        ┌──────────────────────┐
        │   Completeness       │
        │   Orchestrator       │
        │   (Claim-Level)      │
        └───────────┬──────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  Data Extraction     │
        │     Agent            │
        │ (Form Pre-fill)      │
        └───────────┬──────────┘
                    │
        ┌───────────▼──────────┐
        │   Results Stored     │
        │   in Database        │
        └───────────┬──────────┘
                    │
        ┌───────────┴───────────────────┐
        │                               │
        ▼                               ▼
┌──────────────┐              ┌──────────────┐
│  Customer UI │              │  Admin UI    │
│  • Simple    │              │  • Detailed  │
│  • Status    │              │  • Override  │
│  • Progress  │              │  • Audit     │
└──────────────┘              └──────────────┘
```

---

## Database Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        DATABASE MODELS                          │
└────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│  UploadedFile   │────────▶│DocumentValidation│
│  • id           │  1:1    │  • classifierResult
│  • fileKey      │         │  • identityResult
│  • category     │         │  • medicalResult
│  • status       │         │  • residenceResult
│  • customerStatus         │  • employmentResult
│  • extractedData│         │  • extractedData
└────────┬────────┘         └──────────────────┘
         │
         │ 1:many
         │
         ▼
┌─────────────────┐
│AgentExecutionLog│
│  • agentName    │
│  • status       │
│  • input/output │
│  • timing       │
│  • tokensUsed   │
└─────────────────┘

┌─────────────────┐         ┌──────────────────┐
│ IntakeSession   │────────▶│ ClaimReadiness   │
│  • id           │  1:1    │  • readinessScore
│  • claimType    │         │  • isReadyForSubmission
│  • status       │         │  • completeness
└────────┬────────┘         │  • criticalBlockers
         │                  └──────────────────┘
         │ 1:many
         ▼
┌─────────────────┐
│  StaffAction    │
│  • actionType   │
│  • actionData   │
│  • userId       │
│  • timestamp    │
└─────────────────┘
```

---

## Agent Execution Flow

### Phase 1: Document-Level Validation

```
Document Upload
       │
       ▼
┌──────────────────────────────────┐
│  1. ClassifierAgent              │  ✅ IMPLEMENTED
│  • Determines document type      │
│  • Output: category + confidence │
└──────────┬───────────────────────┘
           │
           ├─ If IDENTITY ────────────────────────┐
           │                                      │
           ▼                                      ▼
    ┌──────────────────────────────┐    ┌──────────────────┐
    │ 2a. IdentityVerificationAgent│    │ Other Validation │
    │ • Extract name, DOB          │    │ Agents           │
    │ • Check official seal        │    │                  │
    │ • Validate completeness      │    │                  │
    └──────────────────────────────┘    └──────────────────┘
              ✅ IMPLEMENTED

           ├─ If MEDICAL ──────────────────────────┐
           │                                       │
           ▼                                       ▼
    ┌──────────────────────────────┐    ┌──────────────────┐
    │ 2b. MedicalComplianceAgent   │    │ Other Validation │
    │ • Check RECA disease list    │    │ Agents           │
    │ • Extract diagnosis info     │    │                  │
    │ • Verify pathology report    │    │                  │
    └──────────────────────────────┘    └──────────────────┘
              ✅ IMPLEMENTED

           ├─ If RESIDENCE ─────────────────────────┐
           │                                        │
           ▼                                        ▼
    ┌──────────────────────────────┐    ┌──────────────────┐
    │ 2c. ResidenceProofAgent      │    │ Other Validation │
    │ • Extract address            │    │ Agents           │
    │ • Validate covered county    │    │                  │
    │ • Check residence dates      │    │                  │
    └──────────────────────────────┘    └──────────────────┘
              ⏳ TODO

           └─ If EMPLOYMENT ────────────────────────┐
                                                    │
                                                    ▼
                              ┌──────────────────────────────┐
                              │ 2d. EmploymentVerificationAgent
                              │ • Extract employer/facility  │
                              │ • Check covered facilities   │
                              │ • Validate employment dates  │
                              └──────────────────────────────┘
                                        ⏳ TODO
```

### Phase 2: Claim-Level Analysis

```
All Documents Validated
         │
         ▼
┌────────────────────────────────────┐
│ 3. CompletenessOrchestratorAgent  │  ⏳ TODO
│ • Aggregate all document results  │
│ • Check for missing documents     │
│ • Cross-document validation       │
│ • Calculate readiness score       │
│ • Identify critical blockers      │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ 4. DataExtractionAgent            │  ⏳ TODO
│ • Consolidate extracted data      │
│ • Resolve conflicts               │
│ • Map to RECA form fields         │
│ • Prepare form pre-fill           │
└────────────────────────────────────┘
```

---

## Code Architecture

### Directory Structure

```
src/lib/ai-agents/
│
├── types/
│   └── agent-results.ts           ✅ All result type definitions
│
├── agents/
│   ├── index.ts                   ✅ Agent exports
│   ├── classifier-agent.ts        ✅ Document categorization
│   ├── identity-verification-agent.ts  ✅ Identity validation
│   ├── medical-compliance-agent.ts     ✅ Medical validation
│   ├── residence-proof-agent.ts        ⏳ TODO
│   ├── employment-verification-agent.ts ⏳ TODO
│   ├── completeness-orchestrator-agent.ts ⏳ TODO
│   └── data-extraction-agent.ts        ⏳ TODO
│
├── services/
│   ├── orchestrator.ts            ⏳ TODO - Coordinate agents
│   └── job-queue.ts               ⏳ TODO - Background processing
│
├── base-agent.ts                  ✅ Abstract base class
└── reca-reference-data.ts         ✅ RECA constants & helpers
```

### Class Hierarchy

```
                BaseAgent<TResult>
                       │
                       │ extends
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
ClassifierAgent  IdentityAgent  MedicalAgent
       │               │               │
       │               │               │
    validate()     validate()     validate()
    storeResult()  storeResult()  storeResult()
```

---

## Data Flow Example

### Example: Birth Certificate Upload

```
1. User uploads "birth_certificate.pdf"
   └─▶ UploadedFile created (status: UPLOADING)

2. File uploaded to R2/S3
   └─▶ UploadedFile updated (status: PROCESSING)

3. OCR extraction (existing system)
   └─▶ UploadedFile.ocrText populated

4. TRIGGER AI VALIDATION
   └─▶ Background job queued

5. ClassifierAgent executes
   Input: { documentText: "...", documentUrl: "..." }
   Output: {
     status: "PASS",
     confidence: 0.95,
     data: { category: "IDENTITY", ... }
   }
   └─▶ DocumentValidation.classifierResult = output
   └─▶ UploadedFile.category = "IDENTITY"
   └─▶ AgentExecutionLog created

6. IdentityVerificationAgent executes
   Input: { documentText: "...", category: "IDENTITY" }
   Output: {
     status: "PASS",
     confidence: 0.92,
     data: {
       fullName: "John Doe",
       dateOfBirth: "1965-03-15",
       hasOfficialSeal: true,
       ...
     }
   }
   └─▶ DocumentValidation.identityResult = output
   └─▶ UploadedFile.extractedDataSummary = { name, dob, ... }
   └─▶ UploadedFile.customerStatus = "VERIFIED"
   └─▶ AgentExecutionLog created

7. User sees:
   Customer UI: "Birth Certificate ✓ Verified"
   Admin UI: Full AI analysis + override option
```

---

## Status Legend

- ✅ **IMPLEMENTED** - Code complete, ready to test
- ⏳ **TODO** - Not yet implemented
- 🧪 **TESTING** - Implemented but needs testing
- 🚀 **DEPLOYED** - Live in production

---

## Key Design Patterns

### 1. Template Method Pattern
`BaseAgent` defines the skeleton, subclasses fill in specifics.

### 2. Strategy Pattern
Different validation strategies per agent (classification, extraction, compliance).

### 3. Observer Pattern
Execution logs track every agent run for audit trail.

### 4. Builder Pattern
Results assembled piece by piece (evidence, issues, confidence).

---

## Scaling Considerations

### Current State (MVP)
- Sequential agent execution
- Single process
- Direct database writes
- No caching

### Future Optimizations
- **Parallel Execution**: Run document agents concurrently
- **Job Queue**: BullMQ for distributed processing
- **Caching**: Cache OpenAI responses for duplicate documents
- **Rate Limiting**: Respect OpenAI API limits
- **Retry Logic**: Automatic retry for failed agents
- **Monitoring**: Real-time dashboards for agent performance

---

**This architecture supports the full RECA validation workflow with extensibility for future improvements.**

# RadiantClaims - Project Status

**Last Updated:** November 8, 2025
**Branch:** admin-dashboard
**Status:** Beta-Ready (6-8 hours remaining work)

---

## 🎯 Executive Summary

RadiantClaims is a RECA claim preparation platform that helps downwinders, onsite participants, and uranium workers prepare DOJ-ready claim packets. The platform is **85-90% complete** and ready for beta testing after a few critical items.

### Current Milestone: **Beta Launch Prep**
- **Target:** Early beta with select users
- **Remaining Work:** 6-8 hours
- **Blockers:** PDF form completion, OCR reliability, email configuration

---

## ✅ What's Complete (85-90%)

### Core Platform (100%) ✅
- **Intake Flow**
  - Step 1: Claimant information collection
  - Step 2: Document upload system with R2 storage
  - Comprehensive document checklist (identity, residence, medical)
  - Save/resume functionality with magic links
  - Session reuse (no duplicate sessions)

- **Authentication & Portal**
  - NextAuth with credential provider
  - Customer portal dashboard
  - Password management
  - Role-based access (CUSTOMER, ADMIN, ATTORNEY, STAFF_REVIEWER)

- **Document Management**
  - Cloudflare R2 file storage
  - 3-step upload flow (presigned URLs)
  - File validation (PDF/JPG/PNG/HEIC, 50MB max)
  - Document categorization (13 types)
  - Grid/list view toggles

- **Email System**
  - Resend integration (complete, pending DNS config)
  - Templates: Welcome, Resume link, Upload confirmation, Packet ready
  - Unsubscribe system
  - **Blocker:** Need to add DNS records and production API key

### Document Intelligence Pipeline (95%) ✅
- **Phase 1: Basic Processing**
  - OCR with pdfjs-dist + Tesseract fallback
  - AI categorization (GPT-4o-mini, 12 categories)
  - Smart tags (8 intelligence tags per document)
  - Quality metrics (resolution, blur, contrast)
  - **Known Issue:** pdf-to-png compatibility needs fixing

- **Phase 2: Advanced Analysis**
  - Entity extraction (persons, dates, addresses, medical, employment)
  - RECA compliance checking (counties, diseases, dates)
  - Risk analysis (4 categories: compliance, eligibility, quality, consistency)
  - All metadata stored in JSONB field
  - Processing time: ~10-15 seconds per document
  - Cost: ~$0.02-0.03 per document

- **Intelligence UI**
  - ✅ AIIntelligenceModal component (7 tabs)
  - Tabs: Overview, AI Assessment, Entities, Quality, Compliance, Risks, Provenance
  - API: `/api/documents/[id]/intelligence`
  - Real-time data fetching with SWR

### AI Validation System (85%) ✅
- **All 7 Agents Implemented**
  1. ClassifierAgent - Document categorization
  2. IdentityVerificationAgent - Birth/death certificates
  3. MedicalComplianceAgent - 22 RECA-covered diseases
  4. ResidenceProofAgent - Covered counties validation
  5. EmploymentVerificationAgent - DOE facilities
  6. DataExtractionAgent - Form pre-fill data
  7. CompletenessOrchestratorAgent - Claim readiness

- **Orchestration Service**
  - File: `src/lib/ai-agents/orchestration-service.ts`
  - Parallel execution of document agents
  - Sequential claim-level agents
  - API endpoints: `/api/validation/session`, `/api/validation/document`
  - Database tracking with AgentExecutionLog

- **Integration**
  - Auto-triggers on document upload
  - Status updates in real-time
  - **Remaining:** Real-document testing and prompt tuning

### Resources System (100%) ✅
- **ResourceFinder Component**
  - Search by state/county/document type/resource type
  - 5 covered states (UT, NV, AZ, ID, NM)
  - 8 resource types (vital records, county clerk, hospitals, etc.)
  - API: `/api/resources/search`

- **Pages**
  - `/resources` - Main search page
  - `/resources/forms` - Form-specific resources

- **Components**
  - `ResourceFinder.tsx` - Search interface
  - `ResourceCard.tsx` - Resource display

### Admin Features (60%) 🟡
- **Dashboard**
  - Claims overview
  - Document review queue
  - Validation status tracking
  - Staff action logging

- **Missing**
  - Bulk operations
  - Analytics/reporting
  - User management UI

### Attorney Portal (40%) 🟡
- **Basic Features**
  - Login/authentication
  - Dashboard showing assigned claims
  - Document download

- **Missing**
  - Claim status updates
  - Communication with claimants
  - Bulk download

---

## ⏳ In Progress / Blockers

### 1. PDF Form Filling (35% Complete) 🔴 BLOCKER
**Status:** Foundation complete, only Parts 1-3 mapped

**What Works:**
- Service: `src/lib/reca/pdf-form-filler.ts`
- Calibration tools and test framework
- Parts 1-3: Filer info, Claimant info, Relationship

**What's Missing (8-10 hours):**
- ⚠️ **Part 8:** Exposure locations (CRITICAL - 1.5 hrs)
- ⚠️ **Part 10:** Disease checkboxes (CRITICAL - 1 hr)
- ⚠️ **Part 16:** Signature acknowledgment (HIGH - 20 min)
- Parts 4-7, 9, 11-15 (6-7 hrs total)
- Supporting forms (2 hrs)

**Integration:**
- Packet API exists: `/api/reca/packet/[sessionId]`
- Uses `generatePacketArchive` function
- **Can ship beta with just Parts 1-3, 8, 10, 16** (3 hrs)

### 2. OCR Reliability (1-2 hours) 🟡 IMPORTANT
**Issue:** pdf-to-png compatibility broken

**Impact:** Scanned PDFs may fail to process

**Fix Options:**
1. Replace pdf-to-png with alternative library
2. Use Google Vision API as fallback
3. Implement retry logic with exponential backoff

### 3. Email Configuration (30 min) 🟡 IMPORTANT
**Status:** Code complete, needs production setup

**Remaining:**
- Add DNS records (SPF, DKIM) for domain verification
- Add production `RESEND_API_KEY` to environment
- Update `DEFAULT_FROM` email address
- Test all email types in staging

### 4. Real-World Testing (2-3 hours) 🟡 IMPORTANT
**Status:** All agents work with test data, need real documents

**Tasks:**
- Test with actual RECA documents (birth certs, medical records, etc.)
- Tune AI agent prompts for accuracy
- Validate compliance checking with edge cases
- Test full claim submission flow

---

## 📋 Beta Launch Checklist (6-8 Hours)

### Critical Path (Must Have)
- [ ] Map PDF Parts 8, 10, 16 (3 hrs)
- [ ] Fix OCR fallback for scanned PDFs (1-2 hrs)
- [ ] Configure Resend email (DNS + API key) (30 min)
- [ ] Test with 5-10 real RECA documents (2-3 hrs)

### Nice to Have (Can Ship Without)
- [ ] Finish remaining PDF parts (6-7 hrs)
- [ ] Admin analytics dashboard (4-6 hrs)
- [ ] Attorney communication features (3-4 hrs)
- [ ] Document Resources seeding (2-3 hrs)

---

## 🏗️ Technical Architecture

### Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **Database:** PostgreSQL (Railway), Prisma ORM
- **Authentication:** NextAuth.js
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend
- **AI:** OpenAI GPT-4o, GPT-4o-mini, Tesseract.js

### Database Schema (Key Models)
```
User (roles: CUSTOMER, ADMIN, ATTORNEY, STAFF_REVIEWER)
  ↓
Claimant (linked to User)
  ↓
IntakeSession (save/resume with magic token)
  ├─ UploadedFile (R2 storage, metadata JSONB)
  │   ├─ DocumentValidation (AI agent results)
  │   └─ DocumentTag (smart tags)
  ├─ ClaimReadiness (completeness score)
  └─ PacketSubmission (final PDF)
```

### File Upload Flow
```
1. Client requests presigned URL → POST /api/intake/upload
2. Client uploads directly to R2 → PUT to presigned URL
3. Client confirms upload → PATCH /api/intake/upload/:id
4. Background job processes file:
   - OCR extraction
   - AI categorization
   - Entity extraction
   - Compliance check
   - Risk analysis
   - All 7 validation agents
5. File marked as READY
```

---

## 📊 Cost Estimates

### Per Document Processing
- OCR: Free (Tesseract.js)
- AI Categorization: ~$0.002 (GPT-4o-mini)
- Entity Extraction: ~$0.015 (GPT-4o)
- Validation Agents: ~$0.01-0.02 (GPT-4o)
- **Total:** ~$0.025-0.035 per document

### Monthly @ 100 Claims (avg 10 docs each)
- Document Processing: $25-35
- R2 Storage: ~$15-20
- Database (Railway): ~$10-20
- Email (Resend): ~$0-20
- **Total:** ~$50-95/month

---

## 📁 Key File Locations

### Core Services
```
src/lib/
├── db.ts                    # Prisma client
├── auth.ts                  # NextAuth config
├── r2.ts                    # Cloudflare R2 client
├── email.ts                 # Resend email service
├── document-checklist.ts    # RECA requirements
└── intake-upload.ts         # Client upload helpers
```

### Document Intelligence
```
src/lib/document-intelligence/
├── ocr.ts                        # pdfjs + Tesseract
├── ai-categorization.ts          # GPT-4o-mini
├── entity-extraction.ts          # GPT-4o structured output
├── reca-compliance.ts            # Compliance checker
├── risk-analysis.ts              # Risk analyzer
└── schemas/                      # Zod validation schemas
```

### AI Validation Agents
```
src/lib/ai-agents/
├── base-agent.ts                 # Abstract base class
├── orchestration-service.ts      # Agent coordinator
├── agents/
│   ├── classifier-agent.ts
│   ├── identity-verification-agent.ts
│   ├── medical-compliance-agent.ts
│   ├── residence-proof-agent.ts
│   ├── employment-verification-agent.ts
│   ├── data-extraction-agent.ts
│   └── completeness-orchestrator-agent.ts
└── types/
    └── agent-results.ts          # TypeScript interfaces
```

### PDF Form Filling
```
src/lib/reca/
├── pdf-form-filler.ts            # Main form filler
├── packet-generator.ts           # Archive generator
└── types.ts                      # Form data types
```

### UI Components
```
src/components/
├── documents/
│   ├── DocumentDashboard.tsx
│   ├── DocumentCard.tsx
│   ├── AIIntelligenceModal.tsx   # 7-tab modal
│   └── intelligence/             # Tab components
├── resources/
│   ├── ResourceFinder.tsx
│   └── ResourceCard.tsx
└── ui/                           # shadcn components
```

---

## 🚀 Quick Start Commands

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm typecheck             # TypeScript check
pnpm lint                  # ESLint

# Database
pnpm db:push               # Push schema changes
pnpm db:generate           # Generate Prisma client
pnpm db:studio             # Open Prisma Studio

# Testing
npx tsx scripts/test-pdf-form-filling.ts
npx tsx scripts/test-full-intelligence.ts [document-id]
npx tsx scripts/test-orchestration.ts [session-id]

# Deployment
pnpm build                 # Build for production
```

---

## 🎓 For New Developers

### Getting Started
1. Read this file (PROJECT_STATUS.md)
2. Check TODO.md for prioritized tasks
3. Review QUICK_REFERENCE.md for common operations
4. See DEPLOYMENT_QUICK_START.md for environment setup

### Common Tasks
- **Add a new API endpoint:** `src/app/api/`
- **Add a UI component:** `src/components/`
- **Modify database schema:** `prisma/schema.prisma` → `pnpm db:push`
- **Update email templates:** `src/emails/`

---

## 📝 Documentation Structure

### Active Docs (Read These)
- `PROJECT_STATUS.md` (this file) - Current state
- `TODO.md` - Prioritized remaining work
- `QUICK_REFERENCE.md` - Common operations
- `DEPLOYMENT_QUICK_START.md` - Setup guide
- `docs/PROJECT_PROGRESS_TRACKER.md` - PDF form filling progress

### Reference Docs (When Needed)
- `STRIPE_SETUP.md` - Payment integration
- `EMAIL_INTEGRATION.md` - Email system details
- `PROMO_CODES_AND_PILOT_ACCOUNTS.md` - Promo codes
- `TEST_CREDENTIALS.md` - Test accounts
- `docs/OPERATIONS_GUIDE.md` - Admin operations

### Archived (Historical)
- `docs/archive/completed/` - Finished features
- `docs/archive/outdated/` - Superseded docs

---

## 🔗 External Links

- **Production:** TBD
- **Staging:** TBD
- **Database:** Railway PostgreSQL
- **Storage:** Cloudflare R2
- **Email:** Resend dashboard

---

**Next Session:** Focus on critical path items (PDF Parts 8, 10, 16 → OCR fix → Email config → Testing)

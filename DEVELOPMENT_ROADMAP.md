# RadiantClaims Development Roadmap

**Last Updated:** 2025-10-26
**Status:** Active Development

---

## 🎯 Project Overview

RadiantClaims is a comprehensive RECA (Radiation Exposure Compensation Act) claim preparation service that helps claimants prepare DOJ-ready packets through a guided intake process.

### Core Value Proposition
- **100% free for claimants** - We prepare documents at no cost
- **Attorney integration** - DOJ-ready packets delivered to law firms
- **Automated document collection** - Smart checklists, OCR, and validation
- **Customer portal** - Track claim status and manage documents

---

## ✅ Completed Features

### Phase 1: Foundation & Core Infrastructure
- [x] **Database Schema** (Prisma + PostgreSQL)
  - User authentication (NextAuth)
  - Claimant records with intake sessions
  - Document upload tracking with OCR placeholders
  - Consent records for legal compliance
  - Packet submission tracking
  - Referral system

- [x] **Step 1: Claimant Intake** (`/intake`)
  - Full intake form with validation
  - Address & contact information collection
  - Optional referral code support
  - Auto-account creation with temporary password
  - Credential display (5-second view before redirect)
  - Fixed referral code foreign key bug

- [x] **Step 2: Document Upload System** (`/intake/step2`)
  - R2 presigned upload infrastructure
  - 3-step upload flow (request URL → upload → confirm)
  - File validation (50MB max, PDF/JPG/PNG/HEIC)
  - Progress tracking per upload
  - Client helper library (`src/lib/intake-upload.ts`)

- [x] **Comprehensive Document Checklist** (`src/lib/document-checklist.ts`)
  - **Identity**: Government ID (required)
  - **Proof of Residence**: 2+ documents from 1951-1962 period (REQUIRED)
    - 10+ accepted document types (utility bills, school records, employment, etc.)
    - Timeframe validation for RECA eligibility
    - Conditional tips based on claim type
  - **Medical Documentation**: Pathology report + supporting records (required)
  - **Additional Documents**: Employment, tax returns, other supporting evidence
  - Progress calculation and status tracking
  - Min/max requirements per category

- [x] **Checklist UI Component** (`src/components/document-checklist.tsx`)
  - Collapsible sections with progress bars
  - Expandable tips & examples per document type
  - Timeframe notes (1951-1962 RECA period)
  - Upload counts and status indicators
  - Required vs. optional flagging
  - Overall progress percentage

- [x] **Save/Resume System**
  - Magic link tokens (7-day expiration)
  - Auto-save on document upload
  - Resume from any device without login
  - Session reuse (no duplicate sessions per claimant)

- [x] **Customer Portal** (`/portal`)
  - Dashboard showing all claims for logged-in user
  - Status badges (Draft, In Progress, Ready for Review, etc.)
  - Progress indicators (current step, files uploaded)
  - Resume claim functionality
  - "Start Another Claim" support
  - View details button (placeholder)

- [x] **Password Management**
  - Password change flow (`/portal/change-password`)
  - Strong password validation (8+ chars, uppercase, lowercase, number)
  - Current password verification
  - Success messaging with auto-redirect

- [x] **User Account System**
  - Auto-create customer accounts during intake
  - Temporary password generation (12-char random)
  - User ↔ Claimant linking
  - Role-based access (CUSTOMER, ADMIN enums)
  - Duplicate user detection

### API Routes Completed
- `POST /api/claimants` - Create claimant + auto-create account
- `GET /api/portal/claims` - Fetch all claims for logged-in user
- `POST /api/intake/session` - Create or return existing intake session
- `GET /api/intake/session?token=xxx` - Resume session by token
- `PATCH /api/intake/session/:id` - Update session progress
- `POST /api/intake/response` - Save screening question responses
- `POST /api/intake/upload` - Request presigned upload URL
- `PATCH /api/intake/upload/:id` - Confirm upload completion
- `DELETE /api/intake/upload/:id` - Delete uploaded file
- `POST /api/portal/change-password` - Change user password

---

## 🚧 In Progress / Immediate Next Steps

### Priority 1: Step 2 Completion

#### 1. ✅ Email Integration (Resend) - COMPLETE
**Location:** `src/lib/email.ts`, `src/emails/`
**Status:** Production ready (pending API key configuration)
**Completed:** 2025-10-26

**Completed Tasks:**
- [x] Install Resend SDK and React Email
- [x] Create email templates:
  - [x] Welcome email with login credentials
  - [x] Resume link email (save for later)
  - [x] Document upload confirmation
  - [x] Packet ready notification
- [x] Implement `sendWelcomeEmail()` in `src/lib/create-customer-account.ts`
- [x] Add email sending to account creation flow
- [x] Create unsubscribe system with database tracking
- [x] Add unsubscribe link to all emails
- [x] Create API endpoint for resume link email
- [x] Build unsubscribe success page
- [x] Write comprehensive documentation

**Email Templates Created:**
```
1. Welcome Email (src/emails/welcome.tsx)
   - Subject: "Welcome to RadiantClaims - Your Account is Ready"
   - Body: Credentials, login link, resume link, password reminder

2. Resume Link Email (src/emails/resume-link.tsx)
   - Subject: "Resume Your RECA Claim - RadiantClaims"
   - Body: Magic link, progress summary, helpful tips

3. Upload Confirmation (src/emails/upload-confirmation.tsx)
   - Subject: "Document Received - [Document Type]"
   - Body: Confirmation, progress update, next steps

4. Packet Ready (src/emails/packet-ready.tsx)
   - Subject: "Your RECA Claim Packet is Ready for Review"
   - Body: Packet summary, timeline, download links
```

**API Endpoints:**
- `POST /api/email/send-resume-link` - Send magic link to user email
- `POST /api/email/unsubscribe` - Unsubscribe from email notifications
- `GET /api/email/unsubscribe` - Unsubscribe via email link

**Documentation:**
- `EMAIL_INTEGRATION.md` - Complete integration guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

**Before Production:**
- [ ] Add production `RESEND_API_KEY` to `.env`
- [ ] Verify domain in Resend dashboard
- [ ] Add DNS records (SPF, DKIM)
- [ ] Test all email types in production
- [ ] Update `DEFAULT_FROM` email address

**Time Spent:** ~2-3 hours

---

#### 2. Claim Detail Page
**Location:** `src/app/portal/claim/[id]/page.tsx` (new)
**Route:** `/portal/claim/:claimantId`

**Tasks:**
- [ ] Create claim detail page component
- [ ] Show full claimant information
- [ ] Display intake session status and timeline
- [ ] List all uploaded documents with previews
- [ ] Document viewer/downloader
- [ ] Progress timeline visualization
- [ ] Edit capability for draft claims
- [ ] Delete/withdraw claim option
- [ ] Print summary button

**Features:**
- Full claim overview (name, DOB, address, etc.)
- Status timeline (started → uploading → review → submitted)
- Document gallery with thumbnails
- Download individual files or full packet
- Resume intake button if not complete
- Contact support button

**API Endpoints:**
- `GET /api/portal/claim/:id` - Fetch single claim with all details
- `GET /api/portal/claim/:id/documents` - Get all documents for claim
- `GET /api/portal/claim/:id/download` - Download full packet (future)

**Estimated Time:** 3-4 hours

---

### Priority 2: Admin Features

#### 3. Admin Dashboard
**Location:** `src/app/admin/` (new)
**Route:** `/admin`

**Tasks:**
- [ ] Create admin layout with navigation
- [ ] Dashboard overview (stats, recent claims, alerts)
- [ ] Claims management table
  - [ ] Search & filter (by status, date, claimant name)
  - [ ] Bulk actions (approve, reject, export)
  - [ ] Status updates
  - [ ] Notes/comments system
- [ ] Document review interface
  - [ ] View all uploaded documents
  - [ ] Approve/reject documents
  - [ ] Request additional documents
  - [ ] Quality check flags
- [ ] User management
  - [ ] View all customers
  - [ ] Reset passwords
  - [ ] Disable accounts
- [ ] Referral tracking & payouts
  - [ ] View all referrals
  - [ ] Track conversions
  - [ ] Generate payout reports
  - [ ] W-9 management
- [ ] Analytics & reporting
  - [ ] Claim volume by date/state
  - [ ] Document upload rates
  - [ ] Conversion funnel
  - [ ] Attorney delivery stats

**Access Control:**
- Require `role === ADMIN` for all admin routes
- Middleware to protect admin pages
- Audit log for admin actions

**API Endpoints:**
- `GET /api/admin/claims` - List all claims with filters
- `PATCH /api/admin/claims/:id` - Update claim status
- `POST /api/admin/claims/:id/notes` - Add admin notes
- `GET /api/admin/analytics` - Dashboard statistics
- `GET /api/admin/referrals` - Referral tracking data

**Estimated Time:** 8-12 hours

---

#### 4. PDF Packet Assembly System
**Location:** `src/lib/pdf/` (new)

**Tasks:**
- [ ] Install PDF library: `pnpm add pdf-lib`
- [ ] Create packet assembly service
  - [ ] Generate Table of Contents
  - [ ] Merge all uploaded documents
  - [ ] Add cover page with claimant info
  - [ ] Include signed consent forms
  - [ ] Embed metadata (creation date, RadiantClaims watermark)
  - [ ] Generate bookmarks/navigation
- [ ] Create cover letter template
- [ ] Add attorney delivery information
- [ ] Implement packet versioning (track changes)
- [ ] Background job for packet generation
- [ ] Packet preview before finalization
- [ ] Store generated packet in R2
- [ ] Download endpoint for customers & admins

**Packet Structure:**
```
1. Cover Page
   - RadiantClaims branding
   - Claimant name & info
   - Packet ID & generation date
   - Attorney firm info

2. Table of Contents
   - Organized by document category
   - Page numbers
   - Document descriptions

3. Signed Authorization/Consent Forms
   - HIPAA authorization
   - Attorney sharing consent
   - E-signature with timestamp

4. Identity Documents
   - Government ID (front & back)

5. Proof of Residence (1951-1962)
   - Organized chronologically
   - 2+ documents required

6. Medical Documentation
   - Pathology report
   - Treatment records
   - Supporting medical evidence

7. Additional Supporting Documents
   - Employment records
   - Tax returns
   - Other evidence

8. Claimant Explanation/Statement (if needed)
   - Cover letter for any discrepancies
```

**API Endpoints:**
- `POST /api/packet/generate/:sessionId` - Generate packet
- `GET /api/packet/:id/preview` - Preview packet before finalization
- `GET /api/packet/:id/download` - Download final packet
- `POST /api/packet/:id/deliver` - Send to attorney

**Background Jobs:**
- Use **Inngest** or **Trigger.dev** for async packet generation
- Queue system for large packets
- Email notification when packet is ready

**Estimated Time:** 6-8 hours

---

## 🔮 Future Features (Phase 3+)

### OCR & Document Processing
- [ ] Google Vision API integration
- [ ] Auto-extract text from uploaded documents
- [ ] Extract dates, names, addresses from documents
- [ ] Auto-categorize documents based on content
- [ ] Quality validation (blurry detection, missing info)
- [ ] Thumbnail generation for document previews
- [ ] PII detection and redaction

**Location:** `src/lib/ocr/` (new)
**API Endpoint:** `POST /api/documents/:id/process` - Trigger OCR processing
**Estimated Cost:** ~$0.015-0.03 per packet (Google Vision free tier: 1000 pages/month)

---

### Step 3: E-Signature & Consent
**Location:** `src/app/intake/consent/` (new)
**Route:** `/intake/consent?token=xxx`

**Tasks:**
- [ ] Create consent form page
- [ ] Display HIPAA authorization text
- [ ] Display attorney sharing consent
- [ ] Implement canvas-based e-signature component
- [ ] Capture signature + timestamp + IP
- [ ] Store consent records in database
- [ ] Generate signed PDF consent form
- [ ] Include in final packet

**Library:** `react-signature-canvas` or build custom
**Estimated Time:** 3-4 hours

---

### Medical Records Retrieval
**Automation for Step 2**

**Tasks:**
- [ ] Templated medical records request forms
- [ ] Provider contact form
- [ ] Email/fax provider requests on behalf of claimant
- [ ] Track request status
- [ ] Integration with EHR systems (future - requires BAA)

**API Endpoints:**
- `POST /api/records/request` - Submit records request to provider
- `GET /api/records/status/:requestId` - Check request status

**Estimated Time:** 4-6 hours

---

### Condition-Specific Pathways
**Smart checklist based on claim type**

**Tasks:**
- [ ] Add screening questions in Step 1
  - Claim type (cancer type)
  - Exposure location
  - Year ranges of residence
  - Underground vs. atmospheric period
- [ ] Dynamic checklist based on responses
- [ ] Show only relevant document categories
- [ ] Condition-specific tips and examples
- [ ] Eligibility pre-check

**Update:** `src/lib/document-checklist.ts` with conditional logic
**Estimated Time:** 2-3 hours

---

### Multilingual Support
- [ ] i18n setup (next-intl)
- [ ] Spanish translation (primary)
- [ ] Translated email templates
- [ ] Language selector in portal
- [ ] Translated document tips

**Languages:** English, Spanish (phase 1)
**Estimated Time:** 6-8 hours

---

### Attorney Portal
**Separate portal for law firms**

**Features:**
- [ ] Attorney login & dashboard
- [ ] View assigned claims
- [ ] Download packets
- [ ] Update claim status (submitted to DOJ, approved, etc.)
- [ ] Communication with claimants
- [ ] Bulk download for multiple claims

**Route:** `/attorney/*`
**Estimated Time:** 8-12 hours

---

### Referral Program Enhancement
- [ ] Public referral signup page
- [ ] Referral dashboard for partners
- [ ] Track conversions in real-time
- [ ] Automated payout calculations
- [ ] Payout request workflow
- [ ] W-9 collection and management
- [ ] 1099 generation at year-end

**Route:** `/referral-program` (enhance existing)
**Estimated Time:** 6-8 hours

---

### Advanced Analytics
- [ ] Claim funnel visualization
- [ ] Drop-off analysis by step
- [ ] Document upload patterns
- [ ] State-by-state claim volume
- [ ] Attorney performance metrics
- [ ] Referral source ROI

**Dashboard:** `/admin/analytics`
**Library:** Recharts or Chart.js
**Estimated Time:** 4-6 hours

---

## 🏗️ Technical Debt & Improvements

### Performance Optimizations
- [ ] Implement rate limiting on API routes
- [ ] Add Redis caching for session data
- [ ] Optimize database queries (add missing indexes)
- [ ] Implement pagination for large lists
- [ ] Lazy load document checklist sections
- [ ] Image optimization with Next.js Image component

### Security Enhancements
- [ ] Add CSRF protection
- [ ] Implement API request signing
- [ ] Add file upload virus scanning (ClamAV)
- [ ] Audit log for sensitive operations
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout handling

### Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (intake → upload → submit)
- [ ] Load testing for file uploads
- [ ] Security testing (OWASP top 10)

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component documentation (Storybook)
- [ ] Deployment guide
- [ ] Environment setup guide
- [ ] Contributing guidelines

---

## 📊 Current Architecture

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Database:** PostgreSQL (Railway), Prisma ORM
- **Auth:** NextAuth.js with credentials provider
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend (to be integrated)
- **Forms:** React Hook Form + Zod validation

### Database Schema (Key Models)
```prisma
User (CUSTOMER | ADMIN)
  ↓
Claimant (linked to User)
  ↓
IntakeSession (save/resume with magic token)
  ↓
UploadedFile (with OCR placeholders)
IntakeResponse (screening Q&A)
ConsentRecord (e-signatures)
PacketSubmission (final PDF)
```

### File Upload Flow
```
1. Client requests presigned URL → POST /api/intake/upload
2. Client uploads directly to R2 → PUT to presigned URL
3. Client confirms upload → PATCH /api/intake/upload/:id
4. Background job processes file (OCR, validation) [TODO]
5. File marked as READY
```

### Deployment
- **Hosting:** Vercel (recommended for Next.js)
- **Database:** Railway PostgreSQL
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Domain:** TBD

---

## 💰 Cost Estimates (Production Scale)

### Monthly Costs @ 500 Claims/Month

| Service | Free Tier | Cost @ 500 Claims | Notes |
|---------|-----------|-------------------|-------|
| **Cloudflare R2** | 10GB + 1M ops | ~$15-20 | Storage + bandwidth |
| **Railway PostgreSQL** | 500MB | ~$10 | Scales with usage |
| **Resend Email** | 3k emails | ~$0-20 | 50k emails for $20 |
| **Google Vision OCR** | 1k pages | ~$15 | $1.50/1k pages after free |
| **Vercel Hosting** | Hobby tier | ~$0-20 | Pro if needed |
| **Domain & SSL** | N/A | ~$15/year | CloudFlare free SSL |

**Total Estimated:** ~$50-85/month @ 500 claims/month
**Per-Claim Cost:** ~$0.10-0.17

### Revenue Model
- **Claimant:** $0 (100% free)
- **Attorney:** Statutory fee (2% of claim, paid by DOJ)
- **Optional Premium Service:** $250 for full document retrieval + assembly
- **Referral Bonuses:** $50-100 per approved claim

---

## 🚀 Quick Start for Future Sessions

### To Continue Development:

1. **Read this file** to understand current state
2. **Check completed features** (✅ section)
3. **Pick a task** from "In Progress" or "Future Features"
4. **Refer to API endpoints** and file locations
5. **Update this document** when features are complete

### Common Commands
```bash
# Start dev server
pnpm dev

# Database operations
pnpm db:push          # Push schema changes
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio

# Code quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript check
```

### Environment Variables Needed
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_ENDPOINT=""
R2_BUCKET=""
RESEND_API_KEY=""      # TODO: Add this
```

---

## 📝 Notes & Decisions

### Design Decisions
- **Magic links over accounts:** Reduce friction for Step 2, create account automatically
- **Conservative document requirements:** Ask for 2+ residence proofs (vs DOJ minimum 1)
- **Timeframe emphasis:** Heavy focus on 1951-1962 period throughout UI
- **Free tier first:** Build free DIY flow completely before premium features

### Known Issues
- Referral code foreign key constraint requires validation before insert ✅ Fixed
- IntakeSession unique constraint on claimantId (one session per claimant) ✅ Fixed with session reuse
- Need email integration before production launch
- OCR processing is placeholder (no actual processing yet)

### Future Considerations
- **HIPAA Compliance:** If retrieving medical records directly, need BAA
- **Scalability:** Current architecture supports ~10k claims/month
- **Internationalization:** Spanish support is high priority
- **Mobile App:** Consider React Native app for easier document capture

---

## 🎓 Onboarding for New Developers

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── intake/            # Step 1 & Step 2 intake flows
│   ├── portal/            # Customer portal
│   ├── admin/             # Admin dashboard [TODO]
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/Radix UI components
│   └── document-checklist.tsx
├── lib/                   # Utility functions & business logic
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── r2.ts             # File upload helpers
│   ├── document-checklist.ts  # Checklist configuration
│   └── intake-upload.ts  # Client-side upload helpers
└── prisma/
    └── schema.prisma      # Database schema
```

### Key Files to Understand
1. `prisma/schema.prisma` - All database models
2. `src/lib/document-checklist.ts` - Checklist requirements
3. `src/lib/intake-upload.ts` - Upload client helpers
4. `src/app/intake/step2/page.tsx` - Main upload UI
5. `src/components/document-checklist.tsx` - Checklist component

---

**End of Roadmap**
*Update this file as features are completed or priorities change.*

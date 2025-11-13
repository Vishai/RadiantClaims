# RadiantClaims - TODO

**Last Updated:** November 8, 2025
**Target:** Beta launch in 6-8 hours of focused work

---

## 🔴 CRITICAL PATH TO BETA (6-8 hours)

### 1. PDF Form Completion (3 hours) ⚠️ BLOCKER
**File:** `src/lib/reca/pdf-form-filler.ts`

#### MVP Parts (3 hrs total)
- [ ] **Part 8: Exposure Locations** (1.5 hrs)
  - 3 exposure option checkboxes
  - Idaho/New Mexico/Utah simple location tables
  - Arizona counties (6 rows)
  - Nevada counties (6 rows)
  - See: `docs/PROJECT_PROGRESS_TRACKER.md` lines 428-510

- [ ] **Part 10: Compensable Diseases** (1 hr)
  - 20 disease checkboxes in 2-column layout
  - See: `docs/PROJECT_PROGRESS_TRACKER.md` lines 536-585

- [ ] **Part 16: Signature Acknowledgment** (20 min)
  - Single date field
  - See: `docs/PROJECT_PROGRESS_TRACKER.md` lines 763-783

**Commands:**
```bash
# Find coordinates with calibration grid
open docs/test-output/calibration-grid.pdf

# Edit form filler
code src/lib/reca/pdf-form-filler.ts

# Test changes
npx tsx scripts/test-pdf-form-filling.ts
open docs/test-output/filled-reca-form-test.pdf
```

---

### 2. OCR Reliability Fix (1-2 hours) 🟡 IMPORTANT
**Issue:** pdf-to-png compatibility broken, scanned PDFs may fail

**File:** `src/lib/document-intelligence/ocr.ts`

**Options:**
- [ ] Option A: Replace pdf-to-png with `pdf2pic` or `pdfjs-getPage`
- [ ] Option B: Add Google Vision API fallback for failures
- [ ] Option C: Implement retry logic with exponential backoff

**Test:**
```bash
# Test with scanned PDF
npx tsx scripts/test-full-intelligence.ts [document-id] --save
```

---

### 3. Email Configuration (30 min) 🟡 IMPORTANT
**Status:** Code complete, needs production setup

- [ ] Add Resend API key to production `.env`
  ```
  RESEND_API_KEY=re_xxxxxxxxxxxxx
  ```

- [ ] Add DNS records for domain verification
  - SPF record: `v=spf1 include:_spf.resend.com ~all`
  - DKIM record: (provided by Resend dashboard)

- [ ] Update default sender email
  - File: `src/lib/email.ts`
  - Change `DEFAULT_FROM` to production email

- [ ] Test all email types in staging
  ```bash
  # Test welcome email
  curl -X POST http://localhost:3000/api/email/send-welcome \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test User","password":"temp123"}'
  ```

**Reference:** `EMAIL_INTEGRATION.md`

---

### 4. Real-World Document Testing (2-3 hours) 🟡 IMPORTANT
**Goal:** Validate AI agents work with actual RECA documents

- [ ] Collect 5-10 sample documents
  - Birth certificate
  - Death certificate
  - Medical records
  - Pathology report
  - Utility bills (1950s-1960s)
  - School records

- [ ] Upload and test each document
  - Verify OCR extraction
  - Check AI categorization accuracy
  - Validate entity extraction
  - Review compliance checking
  - Inspect risk analysis

- [ ] Tune prompts if needed
  - File: `src/lib/ai-agents/agents/*.ts`
  - Adjust system prompts for better accuracy
  - Update confidence thresholds

- [ ] Document issues and fixes
  - Add notes to `docs/TESTING_RESULTS.md`

**Commands:**
```bash
# Test intelligence pipeline
npx tsx scripts/test-full-intelligence.ts [document-id] --save

# Test validation agents
npx tsx scripts/test-orchestration.ts [session-id]

# Check agent execution logs
npx tsx -e "
import { db } from './src/lib/db';
const logs = await db.agentExecutionLog.findMany({
  orderBy: { startedAt: 'desc' },
  take: 10
});
console.log(logs);
"
```

---

## 🟢 NICE TO HAVE (Post-Beta)

### PDF Form Completion (6-7 hours)
- [ ] Part 4: Self-filers (20 min)
- [ ] Part 5: Surviving spouse (45 min)
- [ ] Part 6: Surviving child (1 hr)
- [ ] Part 7: Other relatives (30 min)
- [ ] Part 9: Proof of presence (30 min)
- [ ] Part 11: Proof of disease (45 min)
- [ ] Part 12: Previous payments (30 min)
- [ ] Part 13: Attorney representation (45 min)
- [ ] Part 14: Attorney acknowledgment (20 min)
- [ ] Part 15: Legal guardian (30 min)
- [ ] Supporting forms (2 hrs)

**See:** `docs/PROJECT_PROGRESS_TRACKER.md` for detailed specs

---

### Admin Dashboard Enhancements (4-6 hours)
- [ ] Bulk operations (approve/reject multiple claims)
- [ ] Analytics dashboard
  - Claims by status
  - Document processing metrics
  - AI validation success rates
  - Processing time trends
- [ ] User management UI
  - Search/filter users
  - Reset passwords
  - Disable accounts
- [ ] Referral tracking and payouts

**Files:**
- `src/app/admin/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/users/page.tsx`

---

### Attorney Portal (3-4 hours)
- [ ] Claim status updates
  - Mark as "Submitted to DOJ"
  - Mark as "Approved"
  - Mark as "Denied"
  - Add notes/comments
- [ ] Communication with claimants
  - Internal messaging system
  - Document request workflow
- [ ] Bulk download for multiple claims
- [ ] Attorney dashboard analytics

**Files:**
- `src/app/attorney/claims/[id]/page.tsx`
- `src/app/api/attorney/claims/[id]/update/route.ts`

---

### Document Resources Seeding (2-3 hours)
**Status:** Component built, needs data seeding

- [ ] Create seed script
  - File: `scripts/seed-resources.ts`

- [ ] Add vital records offices
  - Utah (state + counties)
  - Nevada (state + counties)
  - Arizona (state + counties)
  - Idaho (state + counties)
  - New Mexico (state + counties)

- [ ] Add hospitals/medical centers
  - St. George Regional Hospital
  - Major hospitals in covered counties

- [ ] Add county offices
  - County clerks
  - County recorders
  - School districts

- [ ] Add cancer registries
  - State cancer registries for all 5 states

**Commands:**
```bash
# Run seed script
npx tsx scripts/seed-resources.ts

# Verify seeded data
npx tsx -e "
import { db } from './src/lib/db';
const count = await db.documentResource.count();
console.log('Resources seeded:', count);
"
```

---

### Claim Detail Page (2-3 hours)
**Location:** `src/app/portal/claim/[id]/page.tsx` (new)

- [ ] Create claim detail page
- [ ] Show full claimant information
- [ ] Display intake session timeline
- [ ] List all uploaded documents with previews
- [ ] Progress visualization
- [ ] Resume intake button (if not complete)
- [ ] Download packet button (if ready)

**API:**
- `GET /api/portal/claim/:id`
- `GET /api/portal/claim/:id/documents`

---

## 🔧 Technical Debt

### High Priority
- [ ] Add rate limiting on API routes
- [ ] Implement proper error boundaries
- [ ] Add monitoring/logging (Sentry?)
- [ ] Database indexes for performance
- [ ] Pagination for large document lists

### Medium Priority
- [ ] Unit tests for utility functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Security audit (OWASP top 10)
- [ ] CSRF protection

### Low Priority
- [ ] Storybook for component documentation
- [ ] OpenAPI/Swagger for API docs
- [ ] TypeScript strict mode
- [ ] Lighthouse performance audit

---

## 📅 Sprint Planning

### Sprint 1: Beta Launch (THIS WEEK - 6-8 hrs)
**Goal:** Get to beta with select users

Day 1 (3 hrs):
- Map PDF Parts 8, 10, 16
- Test form filling

Day 2 (2 hrs):
- Fix OCR fallback
- Configure email

Day 3 (2-3 hrs):
- Real-world document testing
- Bug fixes

**Outcome:** Beta-ready platform

---

### Sprint 2: Full Form Support (NEXT WEEK - 6-7 hrs)
**Goal:** Complete PDF form mapping

- Finish all PDF parts (4-7, 9, 11-15)
- Add supporting forms
- Integration testing

**Outcome:** 100% form coverage

---

### Sprint 3: Admin & Attorney Features (WEEK 3 - 8-10 hrs)
**Goal:** Full platform for all user types

- Admin dashboard enhancements
- Attorney portal completion
- Analytics and reporting

**Outcome:** Production-ready for all roles

---

### Sprint 4: Polish & Launch (WEEK 4 - Variable)
**Goal:** Public launch

- Performance optimization
- Security audit
- Documentation updates
- Marketing site
- Beta → production migration

**Outcome:** Public launch 🚀

---

## 🎯 Success Metrics

### Beta Launch
- [ ] 5-10 beta users can complete full claim flow
- [ ] 95%+ document upload success rate
- [ ] <5 second page load times
- [ ] Zero critical bugs in first week

### Production Launch
- [ ] 100+ claims submitted successfully
- [ ] <$0.10 cost per document processed
- [ ] 90%+ user satisfaction score
- [ ] <1 hour average claim completion time

---

## 📞 Quick Reference

### Common Commands
```bash
# Development
pnpm dev                              # Start dev server
pnpm typecheck                        # Check types
pnpm lint                             # Lint code

# Database
pnpm db:push                          # Update schema
pnpm db:studio                        # View data

# Testing
npx tsx scripts/test-pdf-form-filling.ts
npx tsx scripts/test-full-intelligence.ts [doc-id]
npx tsx scripts/test-orchestration.ts [session-id]
```

### Important Files
- `PROJECT_STATUS.md` - Current state (read this first!)
- `TODO.md` - This file (what to do next)
- `QUICK_REFERENCE.md` - Common operations
- `docs/PROJECT_PROGRESS_TRACKER.md` - PDF form details

---

**Focus for next session:** PDF Parts 8, 10, 16 (3 hours) → OCR fix (1-2 hours) → Email config (30 min)

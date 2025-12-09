# Testing & Validation Plan

## Overview

This document outlines the comprehensive testing strategy for the AI validation system, covering unit tests, integration tests, AI accuracy validation, performance testing, and user acceptance testing.

---

## Testing Pyramid

```
              ┌─────────────┐
              │   Manual    │  5%
              │  E2E Tests  │
            ┌─┴─────────────┴─┐
            │  Integration    │  20%
            │     Tests       │
          ┌─┴─────────────────┴─┐
          │    Unit Tests       │  75%
          └─────────────────────┘
```

---

## 1. Unit Testing

### AI Agents

**Test each agent independently with known inputs/outputs**

#### Classifier Agent Tests

```typescript
describe('ClassifierAgent', () => {
  it('should classify birth certificate correctly', async () => {
    const input = {
      fileId: 'test-123',
      ocrText: 'Certificate of Live Birth...',
      fileName: 'birth_cert.pdf',
    };

    const result = await classifierAgent.validate(input);

    expect(result.status).toBe('PASS');
    expect(result.data.category).toBe('IDENTITY');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should classify pathology report correctly', async () => {
    // Test with pathology report text
  });

  it('should handle unclear document', async () => {
    const input = {
      fileId: 'test-456',
      ocrText: 'unclear text...',
      fileName: 'unknown.pdf',
    };

    const result = await classifierAgent.validate(input);

    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.confidence).toBeLessThan(0.85);
  });

  it('should handle error gracefully', async () => {
    // Test error handling
  });
});
```

#### Identity Verification Agent Tests

```typescript
describe('IdentityVerificationAgent', () => {
  it('should extract all required fields from valid birth certificate', async () => {
    const input = {
      fileId: 'test-123',
      ocrText: sampleBirthCertificateText,
      documentType: 'BIRTH_CERT',
    };

    const result = await identityAgent.validate(input);

    expect(result.status).toBe('PASS');
    expect(result.data.fullName).toBe('John Michael Smith');
    expect(result.data.dateOfBirth).toBe('1948-03-15');
    expect(result.data.hasOfficialSeal).toBe(true);
  });

  it('should detect missing official seal', async () => {
    // Test with certificate missing seal
  });

  it('should flag unclear date of birth', async () => {
    // Test with unclear DOB
  });
});
```

**Test Coverage Goal: >90% for all agent code**

### API Endpoints

**Test each endpoint with valid/invalid inputs**

```typescript
describe('POST /api/documents/upload', () => {
  it('should upload document successfully', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('file', 'test/fixtures/birth_cert.pdf')
      .field('sessionId', 'test-session-123')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.document.id).toBeDefined();
  });

  it('should reject file larger than 10MB', async () => {
    // Test file size limit
  });

  it('should reject invalid file type', async () => {
    // Test with .exe file
  });

  it('should require authentication', async () => {
    // Test without auth token
  });
});
```

### Database Operations

**Test Prisma queries and mutations**

```typescript
describe('DocumentValidation Model', () => {
  it('should create validation record', async () => {
    const validation = await db.documentValidation.create({
      data: {
        uploadedFileId: 'file-123',
        status: 'PENDING',
      },
    });

    expect(validation.id).toBeDefined();
    expect(validation.status).toBe('PENDING');
  });

  it('should update validation with agent results', async () => {
    // Test update operation
  });

  it('should cascade delete when file deleted', async () => {
    // Test cascade behavior
  });
});
```

**Test Coverage Goal: >85% for database layer**

---

## 2. Integration Testing

### Agent Orchestration

**Test the full agent workflow end-to-end**

```typescript
describe('Agent Orchestration', () => {
  it('should run all agents in correct order for birth certificate', async () => {
    // Upload document
    const doc = await uploadDocument('birth_cert.pdf');

    // Wait for orchestration to complete
    await waitForProcessing(doc.id);

    // Check all agents ran
    const validation = await getValidation(doc.id);

    expect(validation.classifierResult).toBeDefined();
    expect(validation.identityResult).toBeDefined();
    expect(validation.classifierResult.data.category).toBe('IDENTITY');
    expect(validation.identityResult.status).toBe('PASS');
  });

  it('should run completeness check after all documents uploaded', async () => {
    // Upload all required documents
    await uploadDocument('birth_cert.pdf');
    await uploadDocument('medical_records.pdf');
    await uploadDocument('utility_bill.pdf');

    // Wait for processing
    await waitForAllProcessing();

    // Check completeness calculated
    const readiness = await getClaimReadiness(sessionId);

    expect(readiness.readinessScore).toBeGreaterThan(0);
    expect(readiness.completeness).toBeDefined();
  });
});
```

### API to Database Flow

**Test that API correctly writes to database**

```typescript
describe('Upload to Validation Flow', () => {
  it('should create document and trigger validation', async () => {
    const response = await uploadViaAPI('test.pdf');
    const docId = response.body.document.id;

    // Check document created
    const doc = await db.uploadedFile.findUnique({ where: { id: docId } });
    expect(doc).toBeDefined();

    // Check validation record created
    const validation = await db.documentValidation.findUnique({
      where: { uploadedFileId: docId },
    });
    expect(validation).toBeDefined();
    expect(validation.status).toBe('PROCESSING');
  });
});
```

**Test Coverage Goal: >75% integration coverage**

---

## 3. AI Accuracy Validation

### Test Dataset

**Collect real RECA documents:**
- 50 Birth certificates
- 50 Death certificates
- 50 Medical records (various types)
- 50 Proof of residence documents
- 50 Employment records
- 50 "Other" documents

**Total: 300 documents across all categories**

### Accuracy Metrics

**For each agent, measure:**

**Precision:**
```
Precision = True Positives / (True Positives + False Positives)
```

**Recall:**
```
Recall = True Positives / (True Positives + False Negatives)
```

**F1 Score:**
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

**Accuracy:**
```
Accuracy = (True Positives + True Negatives) / Total
```

### Validation Process

**1. Ground Truth Creation:**
- Human experts manually review and label all 300 documents
- Create "ground truth" dataset with correct answers

**2. AI Validation:**
- Run all documents through each agent
- Record AI decisions

**3. Comparison:**
- Compare AI results vs ground truth
- Calculate accuracy metrics
- Identify failure patterns

**4. Analysis:**
- Which document types have low accuracy?
- What causes failures? (Poor scan quality, unusual format, etc.)
- Can prompts be improved?

### Accuracy Targets

**Minimum Acceptable:**
- Classifier Agent: ≥90% accuracy
- Identity Agent: ≥90% accuracy
- Medical Agent: ≥85% accuracy (harder due to medical terminology)
- Residence Agent: ≥90% accuracy
- Employment Agent: ≥85% accuracy
- Completeness Agent: ≥95% accuracy (straightforward logic)

**Goal:**
- All agents: ≥95% accuracy

### Confidence Calibration

**Test that confidence scores are meaningful:**

```
High Confidence (>90%) → Should be correct >95% of the time
Medium Confidence (70-90%) → Should be correct >80% of the time
Low Confidence (<70%) → Expect lower accuracy, needs review
```

If confidence scores don't correlate with actual accuracy, recalibrate.

---

## 4. Performance Testing

### Response Time Targets

**API Endpoints:**
- Document upload: <2 seconds
- Document list: <500ms
- Document detail: <1 second
- Status polling: <200ms

**AI Processing:**
- Single agent execution: <30 seconds
- Full document validation (all agents): <5 minutes
- Completeness assessment: <10 seconds

### Load Testing

**Scenarios:**

**Scenario 1: Concurrent Uploads**
- 100 users uploading documents simultaneously
- Measure: Response time, error rate, queue depth

**Scenario 2: Heavy Processing**
- 500 documents queued for processing
- Measure: Throughput (docs/minute), memory usage, processing time

**Scenario 3: Peak Admin Usage**
- 20 staff members reviewing claims simultaneously
- Measure: Response time, database query performance

**Tools:**
- k6 or Artillery for load testing
- Monitor with DataDog or New Relic

**Pass Criteria:**
- p95 response time within targets
- Error rate <0.1%
- System remains stable under load

---

## 5. User Acceptance Testing (UAT)

### Beta Testing Program

**Participants:**
- 10-15 real users filing RECA claims
- 3-5 staff members

**Duration:** 2 weeks

**Test Scenarios:**

**Customer Flow:**
1. Create account / log in
2. Start intake wizard
3. Upload identity document
4. Upload medical records
5. Upload proof of residence
6. Review document statuses
7. Verify extracted information
8. Add notes to documents
9. Complete claim

**Staff Flow:**
1. Log in to admin dashboard
2. Review claims queue
3. Open claim detail
4. Review AI agent results
5. Override AI decision (if needed)
6. Request additional documents
7. Approve claim
8. Track claim to submission

**Feedback Collection:**
- Daily check-ins with participants
- Weekly survey (SUS score - System Usability Scale)
- Exit interview after 2 weeks

**Success Criteria:**
- SUS score >70 (acceptable usability)
- Users can complete flow without support
- Staff can review claim in <20 minutes

---

## 6. Security Testing

### Authentication & Authorization

**Tests:**
- [ ] Users can only access their own documents
- [ ] Staff can only access admin routes
- [ ] API endpoints require valid session
- [ ] Role-based access control works (Reviewer vs Admin)
- [ ] JWT tokens expire correctly
- [ ] Refresh token rotation works

### Input Validation

**Tests:**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload exploits blocked (zip bombs, etc.)
- [ ] Rate limiting prevents abuse
- [ ] CSRF protection works

### Data Protection

**Tests:**
- [ ] PII encrypted at rest
- [ ] File URLs are signed and expire
- [ ] Sensitive data not logged
- [ ] Database backups encrypted
- [ ] API responses don't leak sensitive info

**Tool:** OWASP ZAP or Burp Suite for automated security scanning

---

## 7. Accessibility Testing

### WCAG 2.1 Level AA Compliance

**Tests:**
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Screen reader can navigate all content
- [ ] Form labels associated correctly
- [ ] Error messages announced to screen reader
- [ ] Images have alt text
- [ ] Document upload accessible via keyboard

**Tools:**
- axe DevTools (browser extension)
- WAVE (Web Accessibility Evaluation Tool)
- Manual testing with NVDA/JAWS screen reader

---

## 8. Regression Testing

### Automated E2E Tests

**Critical user flows to automate:**

```typescript
describe('E2E: Document Upload Flow', () => {
  it('should complete full document upload and validation', async () => {
    await page.goto('/login');
    await login(testUser);

    await page.goto('/portal/documents');
    await uploadDocument('birth_cert.pdf');

    // Wait for processing
    await page.waitForSelector('[data-testid="status-verified"]', {
      timeout: 120000, // 2 minutes
    });

    // Verify status
    const status = await page.textContent('[data-testid="document-status"]');
    expect(status).toContain('Verified');
  });
});
```

**Tools:** Playwright or Cypress

**Run frequency:** On every pull request

---

## 9. Database Testing

### Migration Testing

**Tests:**
- [ ] All migrations run successfully on fresh database
- [ ] Migrations are reversible (rollback works)
- [ ] Existing data preserved after migration
- [ ] Indexes created correctly
- [ ] Foreign key constraints enforced

### Data Integrity

**Tests:**
- [ ] Cascade deletes work correctly
- [ ] Unique constraints enforced
- [ ] Enum values validated
- [ ] JSON fields properly structured
- [ ] Timestamps auto-update

---

## 10. Monitoring & Alerting

### Metrics to Monitor

**System Health:**
- API response times (p50, p95, p99)
- Error rate (per endpoint)
- Database query performance
- Background job queue depth

**AI Performance:**
- Agent execution time
- Agent success/failure rate
- Confidence score distribution
- OpenAI API usage and costs

**Business Metrics:**
- Documents uploaded per day
- Claims processed per day
- Average time to claim approval
- Staff override rate

### Alerts

**Critical (PagerDuty):**
- API error rate >1%
- Database connection failures
- Background jobs failing repeatedly

**Warning (Slack):**
- API response time >3 seconds
- Agent accuracy drops below 90%
- OpenAI API costs spike

---

## Test Data Management

### Fixtures

**Create reusable test data:**

```typescript
// test/fixtures/documents.ts
export const sampleBirthCertificate = {
  ocrText: `
    CERTIFICATE OF LIVE BIRTH
    Name: John Michael Smith
    Date of Birth: March 15, 1948
    Place of Birth: Las Vegas, Clark County, Nevada
    Issued by: Nevada Department of Health
  `,
  fileName: 'birth_cert.pdf',
  mimeType: 'application/pdf',
};

export const samplePathologyReport = {
  // ...
};
```

**Seed test database:**

```typescript
// test/seed.ts
async function seedTestData() {
  await db.user.create({ data: testUser });
  await db.intakeSession.create({ data: testSession });
  await db.uploadedFile.createMany({ data: testDocuments });
}
```

---

## Testing Schedule

### During Development

**Daily:**
- Run unit tests on changed code
- Manual testing of new features

**Weekly:**
- Full test suite (unit + integration)
- Code coverage check
- Update failing tests

### Pre-Release

**Week 5:**
- Run full AI accuracy validation (300 documents)
- Performance/load testing
- Security audit
- Accessibility audit

**Week 6:**
- Beta UAT
- E2E regression tests
- Final bug bash (whole team tests for 2 hours)

### Post-Release

**Ongoing:**
- Automated E2E tests run nightly
- AI accuracy spot-checks monthly
- Security scans quarterly
- Load testing before major events

---

## Bug Tracking

### Severity Levels

**Critical (P0):**
- System down
- Data loss
- Security vulnerability

**High (P1):**
- Core feature broken
- AI accuracy <85%
- Performance severely degraded

**Medium (P2):**
- Minor feature broken
- UI bug affecting usability
- Performance slightly degraded

**Low (P3):**
- Cosmetic issue
- Edge case bug
- Nice-to-have improvement

### Bug Workflow

1. **Report** - Create GitHub issue with reproduction steps
2. **Triage** - Assign severity and priority
3. **Fix** - Developer fixes and writes regression test
4. **Review** - Code review + QA verification
5. **Close** - Merged to main, deployed to production

---

## Test Environment Setup

### Local Development

```bash
# Setup test database
createdb radiantclaims_test

# Run migrations
DATABASE_URL="postgresql://localhost/radiantclaims_test" pnpm prisma migrate deploy

# Seed test data
pnpm test:seed

# Run tests
pnpm test
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: pnpm install
      - run: pnpm prisma migrate deploy
      - run: pnpm test
      - run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Acceptance Criteria Summary

### MVP (Minimum Viable Product)

- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing (>75% coverage)
- [ ] AI accuracy ≥90% per agent
- [ ] Performance targets met (p95)
- [ ] No critical or high-priority bugs
- [ ] Security audit passed
- [ ] Accessibility: No critical violations

### Production Ready

- [ ] All unit tests passing (>95% coverage)
- [ ] E2E tests passing
- [ ] AI accuracy ≥95% per agent
- [ ] Performance under load tested
- [ ] No bugs above P2
- [ ] Security: OWASP top 10 mitigated
- [ ] Accessibility: WCAG AA compliant
- [ ] UAT completed with >4/5 satisfaction

---

## Documentation for QA Team

**Test Plan:** (this document)

**Test Cases:** Detailed step-by-step test cases in separate spreadsheet

**Bug Template:**
```markdown
## Bug Report

**Title:** Brief description

**Severity:** P0/P1/P2/P3

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected:** What should happen

**Actual:** What actually happens

**Screenshots:** (if applicable)

**Environment:** Browser, OS, etc.
```

---

## Ready to Test! ✅

All testing documentation is now complete. When implementation begins, use this plan to ensure comprehensive quality assurance throughout the development process.

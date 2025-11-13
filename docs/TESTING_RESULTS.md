# Testing Results – 2025-11-09

Status update for the two workstreams highlighted on the beta-readiness plan:
Phase 4 payment gate scenarios and real-document AI validation. All commands
were executed from `/Users/brandonarmstrong/Documents/Github/RadiantClaims`
using Node.js v20.10.0.

## Environment + Prerequisites

- `.env` currently points Prisma at `postgresql://…@localhost:5432`, but no
  Postgres instance is running, so any database-backed script exits early.
- Stripe, Resend, OpenAI, AWS Textract, and Google Vision credentials are not
  configured in the active shell session, so the payment/AI test suites cannot
  hit their upstream services even if the database were online.
- Use `node --import tsx <script>` rather than `npx tsx` inside this sandbox.
  The default `npx` invocation fails with an `EPERM … tsx-*/pipe` error.

## Phase 4 Payment Gate Scenarios

| Scenario | Command / Entry Point | Result | Blocker |
| --- | --- | --- | --- |
| Automated DIY payment flow (covers Scenarios 1, 3, 4) | `node --import tsx scripts/test-payment-flow.ts` | ❌ PrismaClientInitializationError | Local Postgres not reachable at `localhost:5432`, so the script cannot create the test user or subscription before it ever talks to Stripe. |
| Legal path referral (Scenario 2) | Requires `/service-tiers` UI + live database | ⚠️ Not run | Same DB outage; also needs seeded Heritage referral data. |
| DIY cancellation/reactivation (Scenario 5) | Same script + Dashboard UI | ⚠️ Not run | Depends on the subscription created in Scenario 1. |

**What to do once Postgres + Stripe are ready**

1. Start Postgres and confirm `psql radiantclaims` works.
2. `pnpm prisma migrate dev` to apply the latest schema.
3. Export the following secrets before re-running `scripts/test-payment-flow.ts`:
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_DIY_SETUP`, `STRIPE_PRICE_ID_DIY_MONTHLY`,
   and `STRIPE_WEBHOOK_SECRET`. The script exercises checkout completion,
   webhook handling, and `/api/subscriptions/status`.
4. Follow the manual steps in `PHASE_4_TESTING_GUIDE.md:68-132` to confirm the
   UI states on `/reca/start` line up with the database fixtures created by
   the script.

## Real-Document AI Validation Matrix

| Document Type | Command / Entry Point | Result | Blocker |
| --- | --- | --- | --- |
| Birth / death certificate | `node --import tsx scripts/test-full-intelligence.ts cmhfak8mc0001xncrg434n7lc` | ❌ PrismaClientInitializationError | Same Postgres outage; the script cannot fetch the uploaded document or its OCR text. |
| Medical + pathology | Same command with the relevant document IDs | ⚠️ Not run | Requires seeded documents plus `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, and `GOOGLE_CLOUD_CREDENTIALS`. |
| Residence proof set | Same | ⚠️ Not run | Needs OCR text + AI credentials. |

**Next steps once data & keys are available**

1. Seed 5‑10 representative documents into `UploadedFile` (see TODO.md:90-115).
2. Export `OPENAI_API_KEY` (and the optional OCR tier keys) so
   `extractEntities`, `checkRECACompliance`, and `analyzeRisks` can run.
3. Re-run `scripts/test-full-intelligence.ts <document-id> --save` for each
   sample to persist the structured metadata. Capture precision/recall issues
   in this file.

## PDF Form Filler Regression (Parts 8, 10, 16)

- Command: `node --import tsx scripts/test-pdf-form-filling.ts`
- Result: ✅ `docs/test-output/filled-reca-form-test.pdf`
- Verification: Parts 8 exposure checkboxes and table rows, Part 10 disease
  checkboxes, and Part 16 signature date render at the expected coordinates
  for the sample data baked into the script.
- Manual follow-up: open the generated PDF and run through the checklist in
  `scripts/test-pdf-form-filling.ts` (logged at the end of the script) to
  confirm there are no alignment regressions.

## Summary / Open Items

1. Start PostgreSQL locally and rerun the automated payment flow script so we
   can capture PASS/FAIL for Scenarios 1‑5.
2. Configure Stripe + OpenAI credentials in `.env.local` (or shell exports)
   before reattempting the payment and AI suites.
3. Populate `UploadedFile` with real documents so the validation matrix can
   produce meaningful precision/recall numbers.
4. Once the above are available, append the actual outcomes (screenshots or
   logs) to this file so the beta-readiness checklist has concrete evidence.


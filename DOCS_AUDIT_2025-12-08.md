# Documentation Audit & Archive Plan

**Date:** 2025-12-08  
**Goal:** Archive completed/deprecated docs, keep a slim set of active references, and consolidate duplicates.

---

## Archive Candidates (completed or superseded)
Move these to `docs/archive/completed/` (shipped) or `docs/archive/outdated/` (superseded/duplicate).

- `PER_CLAIM_IMPLEMENTATION_COMPLETE.md`, `UI_INTEGRATION_COMPLETE.md`, `RESOURCES_SYSTEM_COMPLETE.md`
- `WEB_SEARCH_IMPROVEMENTS_SUMMARY.md`, `WEB_SEARCH_INTEGRATION.md`, `CHATBOT_WEB_SEARCH_FIX.md`, `CHATBOT_EXPANSION.md`
- `PER_CLAIM_PRICING_IMPLEMENTATION_SUMMARY.md`, `PER_CLAIM_PRICING_MIGRATION.md`, `QUICK_START_UI.md`, `PRICING_QUICK_REFERENCE.md`, `SAFE_MIGRATION_GUIDE.md`, `MIGRATION_FIX_SUMMARY.md`, `MIGRATION_CHECKLIST.md`, `PHASE_4_TESTING_GUIDE.md`
- `PACKET_PULSE_SYSTEM.md`, `docs/PAYOUT_PULSE_SYSTEM.md`, `docs/PAYOUT_PULSE_SYSTEM 2.md`
- `PAYMENT_FLOW_IMPLEMENTATION.md`, `PAYMENT_FLOW_ANALYSIS.md`, `MAIL_IN_ADJUSTMENT_IMPLEMENTATION.md`
- `NOTIFICATION_INTEGRATION_STATUS.md`, `EMAIL_NOTIFICATION_SUMMARY.md`, `EMAIL_FLOW_DIAGRAM.md`
- `DOJ_METRICS_REFACTOR.md`, `DOJ_METRICS_DASHBOARD_IMPLEMENTATION.md`, `DOJ_METRICS_RATIO_INSIGHT.md`, `DOJ_URGENCY_BANNER_IMPLEMENTATION.md`, `DOJ_CLAIM_TRACKING_SYSTEM.md`, `DOJ_DATA_SCRAPING_SYSTEM.md`
- `DEDUPLICATION_FIX.md`, `ENHANCED_DEDUPLICATION.md`, `DATABASE_SEARCH_FIX.md`, `DATABASE_SEARCH_FIX 2.md`
- `ATTORNEY_WAITLIST.md`, `WAITLIST_QUICKSTART.md`, `ATTORNEY_FEE_VERBIAGE_UPDATE.md`
- `LANDING_PAGE_URGENCY_IMPLEMENTATION.md`, `REVERSE_ORDER_STRATEGY.md`, `AUTO_IMPORT_SYSTEM.md`
- `SESSION_SUMMARY.md`, `RESOURCE_EMAIL_FOLLOWUP.md`, `RESOURCE_FEEDBACK_FLOW.md`
- Duplicate drafts: `CANCER_REGISTRY_SEED 2.md`, `DATABASE_SEARCH_FIX 2.md`, `docs/DEPLOYMENT 2.md`, `docs/data-synchronization-proposal 2.md`, `docs/PDF_FILLING_IMPLEMENTATION 2.md`, `docs/PAYOUT_PULSE_SYSTEM 2.md`, `docs/RECA_IMPLEMENTATION_STATUS 2.md`, `docs/legacy/parsed_form_data/* 2.md`
- Meta docs now redundant: `DOCS_REORGANIZATION_SUMMARY.md`, `AGGRESSIVE_CLEANUP_PLAN.md`

---

## Keep & Summarize (active references)
Create short (2–3 sentence) summaries for these and keep them in the catalog.

- `README.md` – entry point; ensure it links to index/status.
- `PROJECT_STATUS.md` – single source of truth for completion percentages and blockers.
- `DOCS_INDEX.md` – navigation guide; update links after moves.
- `TODO.md` – trim to current QA-only work.
- `QUICK_REFERENCE.md` – common commands; align with latest scripts.
- Setup: `DEPLOYMENT_QUICK_START.md`, `RAILWAY_SETUP.md`, `STRIPE_SETUP.md`, `TEST_CREDENTIALS.md`, `EMAIL_INTEGRATION.md`, `SOC2_COMPLIANCE_CHECKLIST.md`.
- Operations: `docs/OPERATIONS_GUIDE.md`, `docs/DATABASE_BACKUP_GUIDE.md`, `docs/STORAGE_MIGRATION_R2.md`.
- PDF system: `docs/PROJECT_PROGRESS_TRACKER.md`, `docs/PDF_FORM_FILLING_GUIDE.md`, `docs/PDF_CALIBRATION_STATUS.md`, `docs/COORDINATE_ADJUSTMENT_GUIDE.md`.
- AI validation: `docs/ai-validation-refactor/README.md`, `.../IMPLEMENTATION_STATUS.md`, `.../TESTING_GUIDE.md`, `.../API_SPECIFICATION.md` (archive other session prompts).
- Eligibility: `docs/ELIGIBILITY_QUESTIONNAIRE_QUICK_START.md`, `docs/ENHANCED_ELIGIBILITY_QUESTIONNAIRE.md`, `docs/IMPLEMENTATION_SUMMARY_ELIGIBILITY_QUESTIONNAIRE.md`, `docs/QUICK_REFERENCE_ELIGIBILITY.md`.
- Resources/contacts: `RESOURCE_HUB_AND_TRACKING_PLAN.md`, `CONTACT_SYSTEM_QUICK_START.md`, `CONTACT_SYSTEM_SETUP.md`, `CONTACT_SYSTEM_SUMMARY.md`, `contact-gathering/README.md` (merge contact-agent docs here).

---

## Consolidation Plan
- **Payment & pricing**: Fold `PAYMENT_FLOW_IMPLEMENTATION.md` + `PAYMENT_FLOW_ANALYSIS.md` + per-claim pricing docs into one `docs/payments/INDEX.md` (flow + configuration + testing). Archive the originals.
- **Contact/Resource agent**: Create `docs/contact-agent/INDEX.md` summarizing setup, quick start, and strategy. Archive `contact-agent/CONTACT_AGENT_BLUEPRINT.md`, `.../EXECUTIVE_SUMMARY.md`, and older web-search docs after merging essentials.
- **AI validation**: Keep only `README`, `IMPLEMENTATION_STATUS`, `TESTING_GUIDE`, `API_SPECIFICATION`, `ADMIN_DASHBOARD_SPECIFICATION`. Archive session prompts/handoffs (`SESSION_*`, `NEXT_SESSION_*`, `ORCHESTRATION_NEXT_SESSION.md`, etc.) as historical.
- **Payout Pulse**: Combine `PACKET_PULSE_SYSTEM.md` + `docs/PAYOUT_PULSE_SYSTEM*.md` into a single concise status/ops page; archive originals.
- **Eligibility questionnaire**: Merge comparison/implementation/quick start into one concise guide with a short FAQ; archive redundant versions.
- **Deployment**: Prefer `DEPLOYMENT_QUICK_START.md` + `RAILWAY_SETUP.md` as canonical; archive `docs/DEPLOYMENT.md` and `docs/DEPLOYMENT 2.md` after verifying unique content is merged.

---

## Proposed Target Structure
```
/README.md
/PROJECT_STATUS.md
/TODO.md
/DOCS_INDEX.md
/QUICK_REFERENCE.md
/Setup/
  DEPLOYMENT_QUICK_START.md
  RAILWAY_SETUP.md
  STRIPE_SETUP.md
  EMAIL_INTEGRATION.md
  TEST_CREDENTIALS.md
/Payments/
  INDEX.md  (flow, pricing, webhook notes, QA checklist)
/Contact-Agent/
  INDEX.md  (setup, quick start, resource search notes)
/AI-Validation/
  README.md
  IMPLEMENTATION_STATUS.md
  TESTING_GUIDE.md
  API_SPECIFICATION.md
/PDF/
  PROJECT_PROGRESS_TRACKER.md
  PDF_FORM_FILLING_GUIDE.md
  PDF_CALIBRATION_STATUS.md
  COORDINATE_ADJUSTMENT_GUIDE.md
/Eligibility/
  INDEX.md  (quick start + implementation summary + comparison)
/Operations/
  OPERATIONS_GUIDE.md
  DATABASE_BACKUP_GUIDE.md
  STORAGE_MIGRATION_R2.md
/docs/archive/
  completed/
  outdated/
```

---

## Next Actions
1) Approve archive list; I will move them into `docs/archive/{completed,outdated}`.  
2) Create consolidated indexes (Payments, Contact-Agent, Eligibility, Payout Pulse) and update `DOCS_INDEX.md` links.  
3) Refresh `TODO.md` to align with the current QA-only scope in `PROJECT_STATUS.md`.

# RadiantClaims Documentation Index

**Last Updated:** February 10, 2026
**Post-Cleanup Version:** 2.0

This is your guide to all documentation after major reorganization. Documentation has been reduced from 100+ files to ~50 essential files with clear organization.

---

## 🚀 START HERE (Core Documentation)

These files remain in the root directory as they are essential daily references:

1. **`README.md`** - Project overview and setup instructions
2. **`PROJECT_STATUS.md`** - Current state of the project (READ THIS FIRST!)
3. **`TODO.md`** - Prioritized work remaining
4. **`PRODUCT_ONE_PAGER.md`** - Business/product overview
5. **`DOCS_INDEX.md`** - This file - documentation guide

---

## 📁 New Folder Structure

### `/setup/` - Setup & Configuration
- **`DEPLOYMENT_QUICK_START.md`** - Environment setup
- **`RAILWAY_SETUP.md`** - Railway configuration
- **`RAILWAY_QUICKSTART.md`** - Quick Railway setup
- **`STRIPE_SETUP.md`** - Payment integration setup
- **`DATABASE_SAFETY_GUIDE.md`** - DB safety (critical)
- **`SAFE_MIGRATION_GUIDE.md`** - Migration safety
- **`SETUP.md`** - Initial setup guide
- **`SOC2_COMPLIANCE_CHECKLIST.md`** - Security compliance

### `/development/` - Developer Resources
- **`QUICK_START.md`** - Developer onboarding
- **`QUICK_START_UI.md`** - UI development guide
- **`QUICK_REFERENCE.md`** - Common operations
- **`TEST_CREDENTIALS.md`** - Test account credentials
- **`TEST-PACKETS-QUICK-REFERENCE.md`** - Testing guide
- **`WAITLIST_QUICKSTART.md`** - Waitlist setup
- **`PHASE_4_TESTING_GUIDE.md`** - Testing procedures

### `/features/email/` - Email System
- **`EMAIL_INTEGRATION.md`** - Email system (Resend)
- **`EMAIL_FLOW_DIAGRAM.md`** - Email flow visualization
- **`RESOURCE_EMAIL_FOLLOWUP.md`** - Resource email templates

### `/features/payment/` - Payment & Pricing
- **`PAYMENT_FLOW_IMPLEMENTATION.md`** - Payment flow details
- **`PAYMENT_FLOW_ANALYSIS.md`** - Payment architecture
- **`PRICING_QUICK_REFERENCE.md`** - Pricing information
- **`PROMO_CODES_AND_PILOT_ACCOUNTS.md`** - Promo code system
- **`SUBSEQUENT_CLAIMS_IMPLEMENTATION.md`** - Multiple claims handling
- **`PAYOUT_PULSE_SYSTEM.md`** - Payout tracking
- **`LEGAL_REP_PRICING_SETUP.md`** - Legal rep pricing
- **`API_PER_CLAIM_SUBSCRIPTIONS.md`** - Subscription APIs
- Various pricing implementation docs

### `/features/attorney/` - Attorney Features
- **`ATTORNEY_WAITLIST.md`** - Attorney onboarding
- **`ATTORNEY_FEE_VERBIAGE_UPDATE.md`** - Fee language updates

### `/features/admin/` - Admin Features
- **`ADMIN_ACCESS.md`** - Admin account management
- **`REGISTRATION_CONTROL.md`** - Registration flow control
- **`FREE_ACCESS_GUIDE.md`** - Free access setup

### `/features/ai/` - AI & Automation
- **`DOJ_DATA_SCRAPING_SYSTEM.md`** - DOJ data extraction
- **`DOJ_CLAIM_TRACKING_SYSTEM.md`** - Claim tracking
- **`DOJ_METRICS_DASHBOARD_IMPLEMENTATION.md`** - Metrics dashboard
- **`DOJ_METRICS_RATIO_INSIGHT.md`** - Metrics insights
- **`DOJ_METRICS_REFACTOR.md`** - Metrics refactoring
- **`AUTO_IMPORT_SYSTEM.md`** - Auto-import features
- **`MAIL_IN_ADJUSTMENT_IMPLEMENTATION.md`** - Mail-in adjustments
- **`WEB_SEARCH_INTEGRATION.md`** - Web search features

### `/features/resources/` - Resource Management
- **`LEAD_TRACKING_SYSTEM.md`** - Lead tracking
- **`RESOURCE_FEEDBACK_FLOW.md`** - Feedback system
- **`RESOURCE_HUB_AND_TRACKING_PLAN.md`** - Resource hub
- **`IMPORT_HOSPITALS.md`** - Hospital data import
- **`CANCER_REGISTRY_SEED.md`** - Cancer registry setup

### `/docs/` - Technical Documentation
Still contains:
- **`PROJECT_PROGRESS_TRACKER.md`** - PDF form filling progress
- **`PDF_FORM_FILLING_ANALYSIS.md`** - PDF analysis
- Various technical guides (OCR, operations, etc.)
- Reference PDFs (RECA forms, etc.)
- **`ai-validation-refactor/`** - AI validation documentation
- **`parsed_form_data/`** - Form parsing specs

### `/docs/archive/` - Archived Documentation

#### `/docs/archive/completed/` - Completed Features
Contains 30+ documents for features that are 100% complete and shipped:
- Resource system implementations
- UI integrations
- Email notifications
- Eligibility questionnaires
- Contact systems
- Various completed features

#### `/docs/archive/obsolete/` - Outdated Documentation
Contains outdated proposals and superseded documentation

---

## 📊 Cleanup Summary

### Before Cleanup:
- **100+ markdown files** scattered throughout the project
- **43 duplicate files** with " 2", " 3", etc. suffixes
- Unclear organization and many obsolete documents

### After Cleanup:
- **~50 essential files** in clear folder structure
- **0 duplicates** - all removed
- **30+ completed features** archived for reference
- **Clear organization** by feature area
- **Logical folder structure** for easy navigation

### Space Saved:
- Removed 43 duplicate files
- Deleted 11 obsolete fix documents
- Archived 30+ completed features
- **Total reduction: ~60% fewer files in working directories**

---

## 🎯 Quick Navigation by Task

### "I want to..."

#### ...understand the current state
→ `PROJECT_STATUS.md` (root)

#### ...know what to work on next
→ `TODO.md` (root)

#### ...set up my development environment
→ `/setup/` folder → `DEPLOYMENT_QUICK_START.md`

#### ...work on a specific feature
→ `/features/[feature-name]/` folder

#### ...find developer tools
→ `/development/` folder

#### ...reference completed work
→ `/docs/archive/completed/`

#### ...understand the business
→ `PRODUCT_ONE_PAGER.md` (root)

---

## 📝 Documentation Standards

### Active Documentation
- Keep in appropriate feature folders
- Update when features change
- Link from TODO.md when actively working

### Archiving Policy
- Move to `/docs/archive/completed/` when feature is 100% done
- Move to `/docs/archive/obsolete/` when no longer relevant
- Never delete without reviewing content first

### File Naming
- Use SCREAMING_SNAKE_CASE for important docs
- Use clear, descriptive names
- Avoid numbered versions - use git for version control

---

## 🔄 Maintenance

This structure should be maintained by:
1. Moving completed features to archive immediately
2. Deleting one-time fixes after they're applied
3. Keeping feature folders organized
4. Updating this index when structure changes

---

**Last Full Reorganization:** February 10, 2026
**Files Cleaned:** 60+ files removed or archived
**New Structure:** Feature-based organization
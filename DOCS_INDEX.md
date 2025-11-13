# RadiantClaims Documentation Index

**Last Updated:** November 8, 2025

This is your guide to all documentation. Start here when looking for information.

---

## 🚀 START HERE (New Developers)

1. **`PROJECT_STATUS.md`** - Current state of the project (READ THIS FIRST!)
2. **`TODO.md`** - Prioritized work remaining
3. **`QUICK_REFERENCE.md`** - Common commands and operations
4. **`DEPLOYMENT_QUICK_START.md`** - Getting started with development

---

## 📚 Core Documentation (Active)

### Project Planning
- **`PROJECT_STATUS.md`** - ⭐ Master status document (single source of truth)
- **`TODO.md`** - Prioritized tasks for beta launch
- **`docs/PROJECT_PROGRESS_TRACKER.md`** - PDF form filling progress tracker

### Setup & Configuration
- **`DEPLOYMENT_QUICK_START.md`** - Environment setup
- **`STRIPE_SETUP.md`** - Payment integration setup
- **`RAILWAY_SETUP.md`** - Database deployment
- **`TEST_CREDENTIALS.md`** - Test account credentials

### Feature Documentation
- **`EMAIL_INTEGRATION.md`** - Email system (Resend)
- **`PROMO_CODES_AND_PILOT_ACCOUNTS.md`** - Promo code system
- **`ADMIN_ACCESS.md`** - Admin account management
- **`ATTORNEY_WAITLIST.md`** - Attorney onboarding
- **`REGISTRATION_CONTROL.md`** - Registration flow control

### Operations
- **`docs/OPERATIONS_GUIDE.md`** - Day-to-day operations
- **`docs/DATABASE_BACKUP_GUIDE.md`** - Database management
- **`SOC2_COMPLIANCE_CHECKLIST.md`** - Security compliance

---

## 🔧 Technical Reference (When Needed)

### PDF Form Filling
- **`docs/PROJECT_PROGRESS_TRACKER.md`** - ⭐ Current progress and detailed specs
- **`docs/PDF_FORM_FILLING_GUIDE.md`** - Implementation guide
- **`docs/PDF_CALIBRATION_STATUS.md`** - Coordinate calibration status
- **`docs/COORDINATE_ADJUSTMENT_GUIDE.md`** - Coordinate adjustment tips

### AI & Document Intelligence
- **`docs/ai-validation-refactor/IMPLEMENTATION_STATUS.md`** - AI validation agents status
- **`docs/ai-validation-refactor/TESTING_GUIDE.md`** - Testing AI features
- **`docs/OCR_SETUP_GUIDE.md`** - OCR configuration

### Payment & Subscriptions
- **`PAYMENT_FLOW_IMPLEMENTATION.md`** - Payment flow details
- **`PAYMENT_FLOW_ANALYSIS.md`** - Payment architecture
- **`docs/PAYOUT_PULSE_SYSTEM.md`** - Payout tracking system

### Storage & Data
- **`docs/STORAGE_MIGRATION_R2.md`** - R2 storage setup
- **`docs/parsed_form_data/`** - Form data parsing (reference)

---

## 📦 Archived Documentation

### Completed Features
**Location:** `docs/archive/completed/`

These features are done and shipped:
- Phase 2 Document Intelligence
- Intelligence Modal UI
- Resources System
- AI Validation Agents
- Email Integration

**When to read:** Understanding how features were built, troubleshooting

### Outdated/Superseded
**Location:** `docs/archive/outdated/`

These docs are no longer accurate:
- Old development roadmaps
- Superseded implementation plans
- Old session summaries

**Don't reference these in active work!**

---

## 🗂️ Directory Structure

```
/
├── PROJECT_STATUS.md          ⭐ START HERE - Current state
├── TODO.md                    ⭐ What to do next
├── QUICK_REFERENCE.md         Common commands
├── DOCS_INDEX.md              This file
│
├── Setup/Config
│   ├── DEPLOYMENT_QUICK_START.md
│   ├── STRIPE_SETUP.md
│   ├── RAILWAY_SETUP.md
│   ├── TEST_CREDENTIALS.md
│   └── EMAIL_INTEGRATION.md
│
├── Features
│   ├── PROMO_CODES_AND_PILOT_ACCOUNTS.md
│   ├── ADMIN_ACCESS.md
│   ├── ATTORNEY_WAITLIST.md
│   ├── REGISTRATION_CONTROL.md
│   └── PAYMENT_FLOW_IMPLEMENTATION.md
│
└── docs/
    ├── PROJECT_PROGRESS_TRACKER.md  ⭐ PDF form status
    ├── OPERATIONS_GUIDE.md
    ├── DATABASE_BACKUP_GUIDE.md
    ├── OCR_SETUP_GUIDE.md
    │
    ├── ai-validation-refactor/
    │   ├── IMPLEMENTATION_STATUS.md
    │   └── TESTING_GUIDE.md
    │
    ├── parsed_form_data/          (reference)
    │
    └── archive/
        ├── completed/             ✅ Shipped features
        └── outdated/              ❌ Don't use
```

---

## 🎯 Quick Navigation by Task

### "I want to..."

#### ...understand the current state
→ `PROJECT_STATUS.md`

#### ...know what to work on next
→ `TODO.md`

#### ...set up my development environment
→ `DEPLOYMENT_QUICK_START.md` → `RAILWAY_SETUP.md` → `STRIPE_SETUP.md`

#### ...understand PDF form filling
→ `docs/PROJECT_PROGRESS_TRACKER.md`

#### ...test the AI validation system
→ `docs/ai-validation-refactor/TESTING_GUIDE.md`

#### ...configure email
→ `EMAIL_INTEGRATION.md`

#### ...create test accounts
→ `TEST_CREDENTIALS.md` → `ADMIN_ACCESS.md`

#### ...understand payment flow
→ `PAYMENT_FLOW_IMPLEMENTATION.md`

#### ...manage the database
→ `docs/DATABASE_BACKUP_GUIDE.md`

#### ...run daily operations
→ `docs/OPERATIONS_GUIDE.md`

#### ...understand how a feature was built
→ `docs/archive/completed/` (historical reference)

---

## 🚫 Documentation Anti-Patterns

### ❌ DON'T:
- Read archived docs as current truth
- Reference outdated roadmaps
- Update completed feature docs
- Create new docs without updating this index
- Keep duplicate information in multiple places

### ✅ DO:
- Start with `PROJECT_STATUS.md` for current state
- Update `TODO.md` when priorities change
- Archive docs when features ship
- Keep this index up-to-date
- Link to single source of truth

---

## 📝 Documentation Standards

### File Naming
- Use SCREAMING_SNAKE_CASE for important docs (e.g., `PROJECT_STATUS.md`)
- Use kebab-case for code-related docs (e.g., `api-specification.md`)
- Always use `.md` extension

### Headers
Every doc should have:
```markdown
# Title

**Last Updated:** YYYY-MM-DD
**Status:** Active/Archived/Reference

[Brief description]

---

[Content]
```

### When to Archive
- Feature is 100% complete and shipped
- Doc is superseded by newer version
- Information is no longer accurate
- Planning doc for completed work

### When to Update
- Project state changes significantly
- New features ship
- Priorities shift
- Blockers are resolved

---

## 🔄 Maintenance Schedule

### After Each Feature Ships
- [ ] Update `PROJECT_STATUS.md`
- [ ] Update `TODO.md`
- [ ] Archive feature planning docs
- [ ] Update this index if needed

### Weekly
- [ ] Review and clean up stale docs
- [ ] Update progress percentages
- [ ] Archive completed sprint docs

### Monthly
- [ ] Full documentation audit
- [ ] Remove duplicate content
- [ ] Reorganize if needed

---

## 📞 Quick Contact

- **For Documentation Issues:** Create GitHub issue with `docs` label
- **For Feature Questions:** Check `PROJECT_STATUS.md` first
- **For Setup Help:** See `DEPLOYMENT_QUICK_START.md`

---

**Last Full Audit:** November 8, 2025
**Next Audit Due:** December 8, 2025

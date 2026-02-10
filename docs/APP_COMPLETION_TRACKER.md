# RECA Application Completion Tracker

## Session Handoff Document

**Last Updated:** February 2025
**Purpose:** Comprehensive tracking of what's been done, what's remaining, and how to continue buttoning up the RECA application.
**Companion:** Obsidian audit at `03 - Efforts/On/Radiant Claims/Comprehensive Audit 2.10.md`

---

## Quick Context

The RECA (Radiation Exposure Compensation Act) application is a 16-part claims form built with **Next.js 14 App Router**, **React Hook Form + Zod**, **TailwindCSS**, and **Radix UI** components. The core philosophy is **"Guide, Don't Gate"** — users should be able to progress through the entire form regardless of missing data, with comprehensive review/help at the end.

Key reference: `/docs/MASTER_FORM_STRATEGY.md`

---

## What's Been Completed

### 1. Part 5 (Surviving Spouse) — Full Build ✅
**File:** `/src/components/reca/parts/Part5Form.tsx` (~893 lines)
- Was a 75-line stub auto-submitting hardcoded data
- Now: Full form with marriage details, prior marriages, filer's other spouses
- Uses `useFieldArray` for `claimantPreviousSpouses` and `filerOtherSpouses`
- Document tracking via `useEffect` that watches form values
- Non-blocking `__currentFormSubmit` pattern (always resolves `true`)
- All Zod fields optional

### 2. Part 7 (Parent/Grandchild/Grandparent) — Full Build ✅
**File:** `/src/components/reca/parts/Part7Form.tsx` (~883 lines)
- Was a 79-line stub auto-submitting hardcoded data
- Now: Full form with `RELATIONSHIP_CONFIG` for conditional UI
- `useFieldArray` for `intermediaryRelatives` (chain of relationship proof)
- Eligibility checks for priority relatives (surviving spouse, children take priority)
- Document tracking for relationship chain birth/death certificates
- Non-blocking `__currentFormSubmit` pattern
- Expanded `Part7OtherRelatives` type in `/src/lib/reca/types.ts`

### 3. Document Checklist Integration ✅
**File:** `/src/app/portal/documents/page.tsx`
- Added `cachedClaimType` and `cachedFormData` state
- Cached in `loadUserSession` from `recaFormData` on `intakeSession`
- Part 5 document requirements (divorce decrees, previous marriage certs)
- Part 7 document requirements (relationship chain birth certs, intermediary death certs)
- `handleUploadComplete` and `handleRefresh` pass cached formData

### 4. Review Page — Completion Awareness ✅
**File:** `/src/app/reca/review/[sessionId]/page.tsx` (~1203 lines)
- Complete rewrite from always-showing-confetti to completion-aware
- `SECTION_DEFINITIONS` array with conditional logic per section (Parts 2, 4, 5, 6, 7, 14, 15 conditionally applicable based on relationship type)
- `analyzeFormCompletion()` recursively inspects `workflowState.formData`
- Two header states: Complete (confetti + green) vs In Progress (amber + progress bar)
- Section Status card: green/amber/red/grey groupings with "Edit" nav buttons
- `navigateToSection()` routes to `/reca/form/${sessionId}?section=${sectionId}`
- "Continue Editing Application" button when form is incomplete
- Warning on PDF download when incomplete

### 5. Non-Blocking Submit on Parts 4-12 ✅
All these parts now have the `__currentFormSubmit` pattern that always resolves `true`:
- **Part 4** — Already had it (was template)
- **Part 5** — Added during full build
- **Part 7** — Added during full build
- **Part 8** — Added `handlePartialSubmit` + `__currentFormSubmit` useEffect
- **Part 9** — Already had it (always resolves true)
- **Part 10** — Added `handlePartialSubmit` + `__currentFormSubmit` useEffect
- **Part 11** — Added with `uploadedDocuments` handling
- **Part 12** — Added `handlePartialSubmit` + `__currentFormSubmit` useEffect

---

## What Still Needs Work

### PRIORITY 1: Critical — Non-Blocking Submit Pattern

#### A. Parts 1 & 3: Fix Blocking `__currentFormSubmit` ⚡
**Files:**
- `/src/components/reca/parts/Part1Form.tsx` (line ~203)
- `/src/components/reca/parts/Part3Form.tsx` (line ~155)

**Problem:** Both have `__currentFormSubmit` but resolve `false` on validation failure, which **blocks navigation** in FormWizard. This violates "Guide, Don't Gate."

**Current (blocking):**
```typescript
(window as any).__currentFormSubmit = async () => {
  return new Promise((resolve) => {
    form.handleSubmit(
      async (data) => { await handleSubmit(data); resolve(true); },
      () => { resolve(false); } // ← BLOCKS NAVIGATION
    )();
  });
};
```

**Fix needed (non-blocking):**
```typescript
(window as any).__currentFormSubmit = async () => {
  return new Promise<boolean>((resolve) => {
    form.handleSubmit(
      async (data) => { await handlePartialSubmit(data); resolve(true); },
      async () => {
        const formData = form.getValues();
        await handlePartialSubmit(formData); // Save partial data
        resolve(true); // ALWAYS allow progression
      }
    )();
  });
};
```

Also need to add `handlePartialSubmit` useCallback to both. Follow the pattern from Part 8/10/12.

**Part 1 additional note:** Has multiple `.min(1, "Required")` Zod validators (name, firstName, lastName, dob, mailingAddress, city, state). These should be made `.optional()` so the form can save partial data. The field labels can retain visual "required" indicators.

#### B. Part 2: Add `__currentFormSubmit` Entirely ⚡
**File:** `/src/components/reca/parts/Part2Form.tsx` (~327 lines)

**Problem:** Has NO `__currentFormSubmit` at all. Also has blocking Zod validators (`.min(1, "Required")` on name, firstName, lastName, dob, date of death).

**Fix needed:**
1. Make Zod schema fields `.optional()` (keep UI indicators)
2. Add `handlePartialSubmit` useCallback
3. Add `__currentFormSubmit` useEffect (always resolves true)

#### C. Parts 13, 14, 15, 16: Add `__currentFormSubmit` ⚡
**Files:**
- `/src/components/reca/parts/Part13Form.tsx` (~627 lines) — Attorney info
- `/src/components/reca/parts/Part14Form.tsx` (~357 lines) — Attorney fee disclosure
- `/src/components/reca/parts/Part15Form.tsx` (~378 lines) — Guardian info
- `/src/components/reca/parts/Part16Form.tsx` (~532 lines) — Certification/signature

**Problem:** All four use auto-submit-on-valid via `form.watch()` but have NO `__currentFormSubmit`. When a user navigates away with partial data, it's lost.

**Fix needed for each:**
1. Add `useCallback` import (if not present)
2. Add `handlePartialSubmit` useCallback
3. Add `__currentFormSubmit` useEffect (always resolves true, saves partial data)
4. Relax Zod schemas where appropriate:
   - Part 13: Attorney fields only required if `hasAttorney="YES"` (this conditional is fine, but should still save partial)
   - Part 14: Fee type, attorney signature, date are currently required — make optional
   - Part 15: Guardian fields currently all required — make optional
   - Part 16: Signature/date/authorization — **special case**, see note below

**Part 16 special note:** This is the certification page. The authorization checkbox and signature are legitimately required for DOJ submission. Strategy: Make them optional for *progression* (user can skip) but flag as REQUIRED in the review page completion analysis. The review page already tracks this.

### PRIORITY 2: Important — UX Enhancements

#### D. ApplicationRecap Component — Connect to Real Data
**File:** `/src/components/reca/review/ApplicationRecap.tsx` (~422 lines)

**Current state:** Beautiful UI component with complete sections, incomplete sections, document needs, help resources, accordion details — BUT uses **hardcoded mock data** in `analyzeCompletion()`.

**Status:** Not currently rendered anywhere. The review page has its own inline completion analysis. Two options:
1. **Option A (Recommended):** Connect ApplicationRecap to real `workflowState.formData` analysis, then render it inside the review page (replacing or augmenting the current inline cards)
2. **Option B:** Keep current review page inline approach, delete ApplicationRecap

The review page's `analyzeFormCompletion()` function already does real analysis — the logic just needs to be wired into ApplicationRecap's `analyzeCompletion()` method.

#### E. Upfront Expectation Setting
**Where:** Application start page — likely `/src/app/reca/form/[sessionId]/page.tsx` or a new intro step

**What:** Before users dive into Part 1, show a welcome screen:
- What to expect (16 sections, ~30 min)
- "Fill what you can, skip what you can't"
- "We'll track what's needed and help you get it"
- "Your progress is saved automatically"
- "At the end, you'll get a personalized checklist"

See `MASTER_FORM_STRATEGY.md` "Application Start" section for full spec.

#### F. Field Importance Visual Indicators
**Where:** All form parts

**What:** Subtle visual markers on form fields:
- 🔴 Required for DOJ submission
- 🟡 Recommended for faster processing
- ⚪ Optional information

**Implementation approach:** Create a `FieldLabel` wrapper component that accepts an `importance` prop and renders the appropriate indicator. Update form parts to use it instead of raw `<Label>`. This is cosmetic and non-blocking — can be done incrementally.

#### G. Document Help Resources
**Where:** Review page and/or document checklist page

**What:** For each missing document, provide:
- What it is and why it's needed
- Where to obtain it (links to vital records offices, etc.)
- Typical processing time
- Alternative documents if applicable

**Current state:** The document page already shows what's needed based on form data. This enhancement adds the "help" layer.

### PRIORITY 3: Nice-to-Have

#### H. Progress Tracking UI in FormWizard
**File:** `/src/components/reca/wizard/FormWizard.tsx`

**What:** Add a progress bar or step indicator showing overall completion as users work through sections. The review page already calculates this — expose it in the wizard UI.

#### I. Analytics Tracking
**What:** Track key metrics:
- Section completion rates
- Average time per section
- Drop-off points
- Help resource usage
- Return visit patterns

#### J. Admin Monitoring Tools
**What:** Dashboard for administrators to see:
- Application completion rates
- Common missing items
- Average time to completion
- Support ticket correlation

---

## Code Patterns Reference

### The Non-Blocking Submit Pattern
This is the standard pattern all form parts should follow. Reference implementation: Part 8.

```typescript
import { useEffect, useCallback } from "react";

// 1. Create non-blocking submit handler
const handlePartialSubmit = useCallback(
  async (data: any) => {
    onSubmit(data as PartXType);
  },
  [onSubmit]
);

// 2. Expose to FormWizard via window
useEffect(() => {
  (window as any).__currentFormSubmit = async () => {
    return new Promise<boolean>((resolve) => {
      form.handleSubmit(
        async (data) => {
          await handlePartialSubmit(data);
          resolve(true); // Valid data saved
        },
        async () => {
          const formData = form.getValues();
          await handlePartialSubmit(formData); // Partial data saved
          resolve(true); // ALWAYS allow progression
        }
      )();
    });
  };
  return () => {
    delete (window as any).__currentFormSubmit;
  };
}, [form, handlePartialSubmit]);
```

### Auto-Submit on Valid (Complementary Pattern)
Many parts also auto-submit when the form becomes valid:

```typescript
useEffect(() => {
  const subscription = form.watch((value) => {
    const result = schema.safeParse(value);
    if (result.success) {
      onSubmit(result.data);
    }
  });
  return () => subscription.unsubscribe();
}, [form, onSubmit]);
```

This is fine to keep — it provides instant saves. The `__currentFormSubmit` catches the case where data is partial.

### Document Tracking Pattern
Forms that identify document needs use:

```typescript
useEffect(() => {
  const subscription = form.watch((values) => {
    const docs: string[] = [];
    if (values.someField) docs.push("Document Type");
    form.setValue("documentsIdentified", docs, { shouldDirty: false });
  });
  return () => subscription.unsubscribe();
}, [form]);
```

---

## Key File Map

### Form Parts
| File | Status | Non-Blocking? | Notes |
|------|--------|:---:|-------|
| `Part1Form.tsx` | ⚠️ Needs fix | ❌ Blocks on fail | Fix `resolve(false)` → `resolve(true)` + relax schema |
| `Part2Form.tsx` | ⚠️ Needs fix | ❌ No hook at all | Add `__currentFormSubmit` + relax schema |
| `Part3Form.tsx` | ⚠️ Needs fix | ❌ Blocks on fail | Fix `resolve(false)` → `resolve(true)` |
| `Part4Form.tsx` | ✅ Done | ✅ | Template pattern |
| `Part5Form.tsx` | ✅ Done | ✅ | Full build from stub |
| `Part6Form.tsx` | ✅ Done | ✅ | Auto-submit + non-blocking |
| `Part7Form.tsx` | ✅ Done | ✅ | Full build from stub |
| `Part8Form.tsx` | ✅ Done | ✅ | Added this session |
| `Part9Form.tsx` | ✅ Done | ✅ | Already had it |
| `Part10Form.tsx` | ✅ Done | ✅ | Added this session |
| `Part11Form.tsx` | ✅ Done | ✅ | Added this session (with uploadedDocs) |
| `Part12Form.tsx` | ✅ Done | ✅ | Added this session |
| `Part13Form.tsx` | ⚠️ Needs fix | ❌ No hook | Add `__currentFormSubmit` |
| `Part14Form.tsx` | ⚠️ Needs fix | ❌ No hook | Add `__currentFormSubmit` + relax schema |
| `Part15Form.tsx` | ⚠️ Needs fix | ❌ No hook | Add `__currentFormSubmit` + relax schema |
| `Part16Form.tsx` | ⚠️ Needs fix | ❌ No hook | Add `__currentFormSubmit` + relax schema (special: cert page) |

### Infrastructure
| File | Purpose | Status |
|------|---------|--------|
| `/src/app/reca/review/[sessionId]/page.tsx` | Review page | ✅ Completion-aware |
| `/src/app/reca/form/[sessionId]/page.tsx` | Form wizard route | ✅ Accepts `?section=` |
| `/src/components/reca/wizard/FormWizard.tsx` | Form navigation | ✅ Checks `__currentFormSubmit` |
| `/src/components/reca/review/ApplicationRecap.tsx` | Recap UI | ⚠️ Has mock data |
| `/src/app/portal/documents/page.tsx` | Document management | ✅ Part 5/7 aware |
| `/src/lib/reca/types.ts` | TypeScript types | ✅ Expanded Part7 types |
| `/src/lib/reca/document-tracking.ts` | Document requirement logic | ✅ Existing |
| `/src/lib/reca/review-tracking.ts` | Review state management | ✅ Existing |

---

## Recommended Session Plan

### Session 1: Fix remaining non-blocking submit (Priority 1A-C)
1. Fix Part 1: Change `resolve(false)` → save partial + `resolve(true)`, relax Zod schema
2. Fix Part 2: Add `__currentFormSubmit` entirely, relax Zod schema
3. Fix Part 3: Change `resolve(false)` → save partial + `resolve(true)`
4. Add `__currentFormSubmit` to Parts 13, 14, 15, 16
5. Relax Zod schemas on Parts 14, 15, 16 where appropriate
6. Run TypeScript check across all modified files

### Session 2: UX Polish (Priority 2D-G)
1. Connect ApplicationRecap to real data OR decide to keep inline approach
2. Add upfront expectation setting (welcome screen)
3. Create `FieldLabel` component with importance indicators
4. Add document help resources to review/document pages

### Session 3: Finishing Touches (Priority 3)
1. Progress tracking in FormWizard
2. Analytics tracking setup
3. Comprehensive testing pass
4. Admin monitoring considerations

---

## Continuation Prompt

Use this prompt to continue work in a new session:

---

**PROMPT START:**

I'm working on the RECA claims application (Next.js 14 App Router + React Hook Form + Zod + TailwindCSS + Radix UI). Please read `/docs/APP_COMPLETION_TRACKER.md` for full context on what's been done and what remains.

**Core philosophy: "Guide, Don't Gate"** — All form sections must allow progression regardless of validation state. Data saves should happen whether the form is valid or not.

**Immediate task:** Fix the remaining 7 form parts that don't have proper non-blocking submit:

1. **Part1Form.tsx** — Has `__currentFormSubmit` but resolves `false` on validation failure (line ~210). Fix it to save partial data via `form.getValues()` and always resolve `true`. Also relax the Zod schema — change `.min(1, "Required")` to `.optional()` on all fields.

2. **Part2Form.tsx** — Has NO `__currentFormSubmit` at all. Add the full pattern (see tracker doc for code). Also relax its Zod schema.

3. **Part3Form.tsx** — Same issue as Part 1 — resolves `false` on failure (line ~163). Fix to always resolve `true` with partial save.

4. **Parts 13, 14, 15, 16** — All use auto-submit-on-valid via `form.watch()` but have no `__currentFormSubmit`. Add the non-blocking pattern to each. Relax Zod schemas where appropriate (Part 16 is the certification page — make fields optional for navigation but flag as required in review).

**Reference pattern** (from Part 8/10/12): Add `useCallback` import, create `handlePartialSubmit`, add `__currentFormSubmit` useEffect that always resolves `true`. See the "Non-Blocking Submit Pattern" section in APP_COMPLETION_TRACKER.md.

After fixing all 7 parts, run `npx tsc --noEmit` to verify no TypeScript errors.

**Then if time allows:** Move to Priority 2 items in the tracker — ApplicationRecap real data, upfront expectation setting, field importance indicators.

**PROMPT END**

---

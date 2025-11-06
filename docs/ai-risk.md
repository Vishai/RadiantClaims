# RECA Risk Assessment Sub-Feature Enhancement Proposal

## Overview

The **Risk Assessment tab** currently provides useful diagnostic insights but lacks sufficient user interactivity for managing document-related risks. Many issues flagged by the AI cannot be directly resolved by the claimant, creating friction and incomplete workflows.

This proposal introduces a comprehensive framework for **risk lifecycle management**, **document contribution status**, and **decision-based resolution**—ensuring that each document and its associated risks progress through a clear, auditable, and actionable flow.

---

## Goals

- Allow users to meaningfully address, acknowledge, or escalate risks.
- Enable reviewers to approve waivers or exclude documents when necessary.
- Improve clarity of document contribution to claim eligibility.
- Automate re-evaluation and progress tracking.

---

## 1. Document Contribution Status

Each document receives a clear **Contribution Status** badge:

| Status | Meaning |
|--------|----------|
| **Counts** | Fully contributes to the claim. |
| **Provisional** | Contributes conditionally until blocking risks are resolved or waived. |
| **Excluded** | Removed from claim evaluation (replaced or invalidated). |

Display this status prominently under the “Counts Toward Claim” section.

---

## 2. Risk Lifecycle & Dispositions

Each risk moves through distinct stages that capture both state and action history:

| Status | Description |
|--------|--------------|
| **OPEN** | Newly detected or unresolved. |
| **PENDING_REVIEW** | Awaiting staff or attorney input (e.g., waiver or verification). |
| **RESOLVED** | Fully addressed through evidence or correction. |
| **WAIVED** | Manually approved as acceptable risk. |
| **BLOCKING_EXCLUDED** | Risk resulted in document exclusion. |

Users or reviewers can take one of the following **actions (dispositions)** per risk:

- **Resolve:** Upload or correct required data.
- **Link Evidence:** Satisfy this risk by referencing another document.
- **Request Waiver:** Ask a reviewer to accept the risk with justification.
- **Exclude Document:** Remove the document from claim consideration.
- **Acknowledge:** Mark an advisory risk as reviewed and accepted.

---

## 3. Fixability Matrix

Each risk rule defines *who can take action*:

| Fixable By | Description |
|-------------|-------------|
| **Claimant** | Can upload or correct files (e.g., missing DOB). |
| **Reviewer** | Must approve authenticity or waiver decisions. |
| **System** | Automatically corrected by AI (metadata or consistency fixes). |

This ensures only relevant options appear in the user interface.

---

## 4. Blocking vs. Advisory Risks

Each risk is classified as either:

- **Blocking (High Severity):** Must be resolved, waived, or excluded before the document counts.
- **Advisory (Medium/Low):** Can be acknowledged without blocking claim submission.

The dashboard summary should clearly display:

- Total blocking risks per document with their current dispositions.
- Advisory risks awaiting acknowledgement vs. those already reviewed.
- Documents currently marked `Provisional` or `Excluded`.
- Risks waiting on reviewer action and their aging (SLA timer).

---

## 5. Workflow State Transitions

| Trigger | From | To | Notes |
|---------|------|----|-------|
| New risk detected | `OPEN` | `OPEN` | Default state until action taken. |
| Claimant completes fix | `OPEN` | `PENDING_REVIEW` | Reviewer validates upload; system auto-validates when possible. |
| Reviewer approves change | `PENDING_REVIEW` | `RESOLVED` | Document automatically re-qualifies if no other blocking risks. |
| Reviewer grants waiver | `OPEN`/`PENDING_REVIEW` | `WAIVED` | Provides reason + expiration (optional). |
| Reviewer rejects fix | `PENDING_REVIEW` | `OPEN` | Adds comment; claimant receives notification. |
| Document excluded | any | `BLOCKING_EXCLUDED` | Document flagged; status flips to `Excluded`. |
| System auto-fix succeeds | `OPEN` | `RESOLVED` | Logged for audit; auto message to claimant. |

Every transition should stamp actor, timestamp, and optional comment. A history timeline per risk gives reviewers context without switching systems.

---

## 6. Claimant & Reviewer Experience

**Claimant Dashboard**
- Surfaces blocking risks at the top with clear next actions.
- Inline uploader accepts replacement documents or supporting evidence.
- Supports linking an existing document as evidence via searchable modal.
- Shows real-time status updates after submission (e.g., `Waiting for reviewer approval`).

**Reviewer Console**
- Queue view sorted by `PENDING_REVIEW` risks and aging SLA.
- Quick actions for approving, rejecting, or waiving with required justification.
- Allows bulk decisions when multiple documents share the same issue (e.g., missing signature).
- Displays linked evidence and prior dispositions to speed up judgment calls.

---

## 7. Notifications & Tasks

- Claimant receives alerts for new blocking risks, reviewer feedback, or waiver outcomes.
- Reviewers get digests or instant notifications for `Request Waiver` items.
- Optional escalation path if items remain `PENDING_REVIEW` beyond SLA (e.g., 3 business days).
- Notifications should deeplink into the specific document and risk context.

---

## 8. Automation & Re-Evaluation

- After any disposition, trigger an automated AI re-evaluation of the document bundle.
- If the system auto-resolves the risk, mark it `RESOLVED` and notify the claimant.
- When a risk reappears after being resolved or waived, create a new version while referencing the prior history for traceability.
- Batch re-evaluations can run nightly to ensure older documents benefit from model updates.

---

## 9. Data Model Enhancements

Add the following fields to the risk entity (API + persistence):

- `disposition` (enum: OPEN, PENDING_REVIEW, RESOLVED, WAIVED, BLOCKING_EXCLUDED).
- `disposition_actor_id` and `actor_role`.
- `disposition_timestamp`.
- `fixability` (enum: CLAIMANT, REVIEWER, SYSTEM).
- `blocking_level` (enum: BLOCKING, ADVISORY).
- `linked_document_ids` (array of references).
- `waiver_expiration` (optional date).
- `history` (append-only log of transitions).

Extend the document model with:

- `contribution_status` (Counts, Provisional, Excluded).
- `blocking_risk_count` (derived, cached for UI).
- `last_re_evaluation_at`.

Audit logs should capture all changes for legal defensibility.

---

## 10. Analytics & Reporting

- Track average time from `OPEN` to `RESOLVED` and by risk type.
- Measure volume of waivers by reviewer to surface training needs.
- Highlight documents frequently moving between `Provisional` and `Counts`.
- Feed a weekly risk trend report to operations leadership.

---

## 11. Implementation Phasing

1. **Foundational Data & API**
   - Add new enum values, history log, and document contribution field.
   - Create migration scripts and update GraphQL/REST interfaces.
2. **UI Enhancements**
   - Claimant dashboard: contribution badges, blocking/advisory grouping, inline actions.
   - Reviewer console: queue, filters, disposition modal.
3. **Automation & Notifications**
   - Wire re-evaluation triggers, email/push templates, and SLA checks.
4. **Analytics**
   - Dashboards, exports, and alerting.

Adopt feature flags per module to mitigate rollout risk.

---

## 12. Open Questions

- Should waivers expire automatically or rely on manual review?
- Do we require dual approval for certain waiver types (e.g., attorney + QA)?
- What is the minimum viable notification channel (email vs. SMS vs. in-app)?
- How do we prioritize risks when multiple documents compete for reviewer attention?

Clarifying these ahead of implementation will keep the roadmap on track and ensure both claimant and reviewer needs are covered.

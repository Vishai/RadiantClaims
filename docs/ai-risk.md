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
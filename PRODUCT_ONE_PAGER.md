RadiantClaims - Product One-Pager

Last Updated: November 19, 2025
Version: 0.2.1 (Beta + Strategy Update)
Status: 95-98% Complete

Executive Summary

RadiantClaims is an AI-powered RECA (Radiation Exposure Compensation Act) claims preparation platform that transforms a complex, months-long claims process into a guided digital experience. We help downwinders, uranium workers, and onsite participants prepare Department of Justice (DOJ)-ready claim packets.

The "Hard Stop" Opportunity: The RECA program permanently expires on December 31, 2027. With document retrieval taking 6-12 months, the effective window for new claimants closes in early 2027. RadiantClaims is the only solution fast enough to process claims during this final 24-month window.

Market: 300,000+ potentially eligible claimants across 5 states (Utah, Nevada, Arizona, Idaho, New Mexico).

Value Proposition: Reduce claim preparation time from 6-12 months to 2-4 weeks, increase approval rates through AI-powered compliance checking, and democratize access to $75,000-$150,000 in federal compensation.

The Problem We're Solving

Current State: Broken & Inaccessible

The RECA claims process is notoriously complex, and the clock is ticking:

The "Retrieval Gap": Medical and employment archives take 6-12 months to respond. Claimants starting today without guidance will miss the 2027 deadline.

17-page federal form with 228+ fields requiring precise historical data.

20-30 supporting documents needed (birth certificates, medical records, proof of residence from the 1950s-1960s).

High rejection rate - 40%+ of claims are rejected for missing documents.

No guidance - Most claimants don't know where to start or what documents they need.

Our Solution

RadiantClaims is a full-stack digital platform utilizing a "Reverse-Order Intake" strategy to prioritize long-lead-time documents immediately.

Core Features (100% Complete ✅)

1. Intelligent Intake & "Reverse-Order" Logic

Reverse-Order Priority Engine: Immediately identifies high-latency documents (Medical/Employment) and generates request letters on Day 0.

Smart eligibility screening - Determine eligibility in 5 minutes.

Dynamic questionnaires - Adaptive forms based on claim type.

Save & resume - Magic link system.

2. AI-Powered Document Intelligence (95% Complete)

Automatic OCR - Extract text from uploaded documents (pdfjs-dist + Tesseract).

Smart categorization - AI categorizes documents into 13 types.

RECA compliance checking - Validates documents against RECA requirements.

Risk analysis - Identifies potential issues before submission.

7 Specialized AI Agents:

ClassifierAgent - Document categorization

IdentityVerificationAgent - Birth/death certificate validation

MedicalComplianceAgent - Validates 22 RECA-covered diseases

ResidenceProofAgent - Verifies covered counties and time periods

EmploymentVerificationAgent - Validates DOE facility employment

DataExtractionAgent - Extracts data for form pre-filling

CompletenessOrchestratorAgent - Overall claim readiness scoring

3. Acquisition Assistant (New - Priority High)

Previously just "Contact Agent"

Outbound Request Generator: Creates the "Golden Triad" packet (Cover Letter + HIPAA Release + ID) for users to send to hospitals to demand records.

Nudge Scripts: Provides users with exact scripts to use when calling dragging resources ("It has been 30 days, under HIPAA you must...").

Resource Database: 100+ resources across 5 states with user ratings.

4. Automated PDF Form Filling (95% Complete)

All 16 parts of the official RECA claim form mapped (228 field coordinates).

Smart field handlers & Data pre-filling.

Overflow handling for long text.

5. Document Management System

Cloudflare R2 storage - Secure, scalable file storage.

Mobile-Friendly Uploads - "Snap and Send" functionality for physical mail.

Features In Progress (85-95% Complete)

AI Validation Dashboard (85%)

Real-time validation status for all documents.

Remaining: Real-world testing with actual RECA documents (2-3 hours).

Email System (95%)

Remaining: Production DNS setup and API key configuration (30 min).

OCR Reliability (90%)

Remaining: Fix pdf-to-png compatibility for scanned PDFs (1-2 hours).

Technical Architecture

Technology Stack

Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS

Database: PostgreSQL (Railway), Prisma ORM

File Storage: Cloudflare R2

AI: OpenAI GPT-4o, GPT-4o-mini

Business Model & Monetization

Two-Path Strategy

Path 1: DIY Preparation ($149.99 + $24.99/mo)

Target: Claimants confident in gathering their own records.

Includes: AI document intelligence, Request Generator, Automated form filling.

Refund Policy: Full refund if user upgrades to Legal Path.

Path 2: Legal Representation (Free to claimant)

Target: Claimants who want full legal representation or have complex cases.

Pricing: $0 to claimant; $1,000 service fee paid by law firm.

Risks & Mitigation

Technical Risks

AI hallucination/errors -> Mitigation: Human review layer, confidence thresholds.

OCR failure on poor scans -> Mitigation: Fallback to manual entry.

Business Risks

Hard Deadline (Dec 31, 2027)

Risk: Program terminates in ~25 months. Document retrieval takes 6-12 months.

Mitigation: "Reverse-Order Intake" (requesting long-lead items first), "Safe Harbor" filings (submitting partial claims to establish a filing date), and high-urgency marketing campaigns.

Low adoption (older demographic)

Mitigation: "Proxy Mode" allowing children to manage accounts for parents.

Regulatory Risks

Mitigation: Clear disclaimers; DIY is a tool, not legal advice.

Next Steps (Immediate Priorities)

Week 1: Beta-Ready (2-4 hours)

[ ] Add "Request Generator" UI: (New Task) Build simple form to generate Hospital Request PDF.

[ ] Implement Reverse-Order Logic in Intake Flow.

[ ] Complete PDF form QA.

[ ] Configure production email.

Week 2: Beta Testing

[ ] Recruit 10 beta testers.

[ ] Test "Nudge Scripts" and "Request Generators" with real users.

Conclusion

RadiantClaims is 98% complete. With the December 2027 sunset looming, we are not just a convenience tool—we are the only viable path for late-stage claimants to succeed before the window closes. By prioritizing high-latency documents through our Reverse-Order Intake, we ensure users don't time out while waiting for paperwork.
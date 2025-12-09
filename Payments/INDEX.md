# Payments & Pricing

**Last Updated:** 2025-12-08  
**Status:** Active (shipping, references consolidated)

Current state: per-claim subscriptions are shipped; Stripe integration is live in code and needs only key/DNS configuration. Historical design docs are archived for reference.

- `STRIPE_SETUP.md` — primary setup guide for Stripe keys, products, and environment variables.
- `docs/STRIPE_WEBHOOK_SETUP.md` — webhook endpoints, secrets, and retry guidance.
- Mail-in adjustments & flow details — see archived specs for rationale: `docs/archive/outdated/payments/PAYMENT_FLOW_IMPLEMENTATION.md`, `.../PAYMENT_FLOW_ANALYSIS.md`, `.../MAIL_IN_ADJUSTMENT_IMPLEMENTATION.md`.
- Pricing migration/per-claim history — reference archived docs in `docs/archive/outdated/` (per-claim implementation, migration, UI quick start, pricing quick reference).

QA/Go-live checklist
- Validate webhook secret loaded in env and Stripe dashboard points to `/api/stripe/webhook`.
- Exercise subscription happy path with test keys; verify invoice + customer objects.
- Confirm mail-in adjustment logic aligns with current pricing configuration (see archived spec if questions arise).

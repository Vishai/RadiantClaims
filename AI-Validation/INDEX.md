# AI Validation System

**Last Updated:** 2025-12-08  
**Status:** Active (shipping; QA remaining)

Core references for the AI validation pipeline (agents, orchestration, testing). Planning/session prompts are archived.

- `docs/ai-validation-refactor/README.md` — end-to-end overview.
- `docs/ai-validation-refactor/IMPLEMENTATION_STATUS.md` — current completion state and blockers.
- `docs/ai-validation-refactor/TESTING_GUIDE.md` — how to validate agents and orchestration.
- `docs/ai-validation-refactor/API_SPECIFICATION.md` — request/response contracts.
- `docs/ai-validation-refactor/ADMIN_DASHBOARD_SPECIFICATION.md` — admin UI scope for validation ops.
- Archived planning/prompts/history: `docs/archive/outdated/ai-validation-refactor/`.

QA focus areas (from `PROJECT_STATUS.md`)
- Real-document testing for OCR/agent accuracy; tune prompts if needed.
- Ensure pdf-to-png compatibility and OCR fallbacks work on scanned PDFs.
- Review AgentExecutionLog for failures and confidence thresholds.

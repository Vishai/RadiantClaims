# RadiantClaims - TODO

**Last Updated:** 2025-12-08  
**Status:** Beta-ready — QA only (2-4 hours)

Focused checklist to reach beta. Source of truth for status is `PROJECT_STATUS.md`.

## 🔴 QA BLOCKERS

1) PDF Form QA (1-2 hrs)  
- Run calibration for Parts 8, 10, 16 and confirm coordinates match `docs/PROJECT_PROGRESS_TRACKER.md`.  
- Regenerate sample packet and spot-check supporting forms.

2) OCR Reliability (0.5-1 hr)  
- Fix pdf-to-png compatibility in `src/lib/document-intelligence/ocr.ts` (fallback/retry).  
- Validate on scanned PDF sample; log failures.

3) Email Configuration (30 min)  
- Add production `RESEND_API_KEY`, configure SPF/DKIM, set `DEFAULT_FROM` in `src/lib/email.ts`.  
- Smoke-test welcome/upload/packet-ready templates.

4) Real-Document Validation (1 hr)  
- Test 5-10 real docs through AI pipeline; tune prompts/thresholds as needed.  
- Log findings in `docs/TESTING_RESULTS.md`.

## ✅ NICE TO HAVE (POST-BETA)

- Admin dashboard polish (bulk ops, analytics).  
- Attorney portal enhancements (status updates, comms, bulk download).

Update this file when items close; archive resolved tasks immediately.

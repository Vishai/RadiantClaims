# Bug Log (QA)

## 2026-02-13

### 1) Intake: Temporary password displayed in plaintext
- **Where:** `/intake` after clicking **Continue to Upload** (account creation success card)
- **Observed:** UI shows **Temporary Password** directly on the page.
- **Impact:** Credential leakage risk (screenshots/screen recordings/shoulder surfing/logging).
- **Expected:** Do not reveal passwords. Use magic link or forced reset flow.
- **Resolution:** Removed temp password handling; new accounts get a reset-link flow and no credentials are returned to the UI.
- **Status:** Resolved

### 2) Intake: DOB input displays wrong value after entry
- **Where:** `/intake` → DOB field
- **Observed:** Entered `1990-12-05` but field displayed `1205-12-09`.
- **Impact:** Data integrity risk; DOB is identity-critical.
- **Expected:** Display and persist the same date the user entered.
- **Resolution:** Normalized DOB to ISO `YYYY-MM-DD` on save/parse and standardized display formatting.
- **Status:** Resolved

## 2026-02-13

### 3) Portal: Start RECA Form redirects to /service-tiers
- **Where:** Portal → Start Application → RECA Downwinder Claim Form intro → **Start RECA Form**
- **Observed:** Navigates to `/reca/start?sessionId=...` briefly shows "Loading form..." then redirects to `/service-tiers`.
- **Impact:** Blocks completing application in portal; breaks intended authenticated flow.
- **Expected:** Load first RECA form section in portal for that sessionId.
- **Resolution:** Portal-owned sessions now pass `sessionId` into the subscription status check; server access checks honor portal ownership, so existing portal claims bypass the service-tiers redirect.
- **Status:** Resolved

### 4) Portal: Review Application returns Unauthorized
- **Where:** /portal -> Kevin Yazzie draft -> Review Application
- **Observed:** Error screen "Unauthorized".
- **Impact:** Blocks resuming/reviewing application.
- **Expected:** Review page should load for the claim/session.
- **Root Cause:** Auth check in `/api/reca/workflow/[sessionId]` only matched ownership via `claimant.userId`. If the claimant was created before auth (no userId) or linked via email/subscription instead, the check failed.
- **Resolution:** Expanded ownership detection to check 3 paths: (1) claimant.userId match, (2) serviceSubscription.userId match, (3) claimant.email match. Removed payment-gating from review page access (payment only gates PDF download).
- **Status:** Resolved (2026-02-14)

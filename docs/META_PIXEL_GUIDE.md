# Meta Pixel & Funnel Guide — RadiantClaims

Everything you need to instrument, verify, read, and optimize the RadiantClaims funnel in Meta Ads Manager.

---

## Table of contents

1. [Quick reference — what's wired](#1-quick-reference--whats-wired)
2. [Pixel setup (one-time)](#2-pixel-setup-one-time)
3. [Verifying events fire](#3-verifying-events-fire)
4. [The RadiantClaims funnel](#4-the-radiantclaims-funnel)
5. [Reading the funnel — what to look for](#5-reading-the-funnel--what-to-look-for)
6. [Campaign optimization — which event, when](#6-campaign-optimization--which-event-when)
7. [Custom audiences for retargeting](#7-custom-audiences-for-retargeting)
8. [Custom conversions](#8-custom-conversions)
9. [Three ready-to-run campaigns](#9-three-ready-to-run-campaigns)
10. [Debugging common problems](#10-debugging-common-problems)
11. [Gaps and future work](#11-gaps-and-future-work)
12. [Adding new events in code](#12-adding-new-events-in-code)

---

## 1. Quick reference — what's wired

| # | Event | Type | Where it fires | Parameters |
|---|---|---|---|---|
| 1 | `PageView` | Standard | Every page load (automatic) | — |
| 2 | `EligibilityCheck` | Custom | `/eligibility-check` on first session mount | `action: "started"` |
| 3 | `Lead` | Standard | `/eligibility-check/result` when verdict renders | `status: "likely" \| "unlikely" \| "ineligible"` |
| 4 | `CompleteRegistration` | Standard | `/register` after successful account creation | — |
| 5 | `InitiateCheckout` | Standard | `/service-tiers` when user picks DIY or Legal path | `content_name`, `value` |
| 6 | `FormSectionComplete` | Custom | Form wizard after each section is saved | `section`, `completion_percent` |
| 7 | `Purchase` | Standard | `/portal?payment=success` (Stripe redirect) | `value: 249.99`, `content_name: "DIY_PREP"` |
| 8 | `ClaimFiled` | Custom | `DOJSubmissionCard` when user marks claim submitted | `method: "e-file"` |
| 9 | `CtaClick` | Custom | Any `<TrackedLink>` usage | `cta_name`, `location` |

All event definitions live in `src/lib/analytics/meta-pixel.ts`.

---

## 2. Pixel setup (one-time)

### 2.1. Get your Pixel ID

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2).
2. Create a Dataset (what Meta now calls "Pixels") if you don't have one. Pick **Website** as the source.
3. Copy the 15-16 digit Pixel ID.

### 2.2. Add the env var

In your `.env.local` (and on your deployed environment):

```bash
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

The `NEXT_PUBLIC_` prefix is required — the pixel runs client-side.

### 2.3. How the pixel loads

The base pixel script is injected once in `src/app/layout.tsx`. It only activates if `NEXT_PUBLIC_META_PIXEL_ID` is set, so local dev without the env var is silent by design.

If you want to test pixel firing locally, add the variable to `.env.local` and restart the dev server. A test pixel ID works fine for verifying events fire — Meta just won't ingest them for ad optimization.

### 2.4. Deploy

After setting the env var in your production environment (Vercel, Netlify, etc.), deploy the site. Within ~15 minutes, Meta Events Manager will start receiving events and show them in the **Test Events** and **Overview** tabs.

---

## 3. Verifying events fire

Two ways. Use the extension for speed, DevTools when you need detail.

### 3.1. Meta Pixel Helper (recommended for 90% of checks)

1. Install [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) from the Chrome Web Store.
2. Open your site in Chrome.
3. Click the Pixel Helper icon in the toolbar.
4. The popup shows: pixel ID detected, event names fired on the current page, and any warnings (malformed parameters, duplicate events, etc.).

### 3.2. Chrome DevTools Network tab

Use this when Pixel Helper says something vague and you need to see the actual request payload.

1. `Cmd+Option+I` (Mac) / `F12` (Windows) → **Network** tab.
2. Filter: `facebook.com/tr`
3. Reload. You should see at least one request (`PageView`).
4. Perform the action (click a button, submit a form).
5. Watch for a new row. Click it → **Payload** / **Query String Parameters**.
6. Look for:
   - `id` — your pixel ID
   - `ev` — the event name (e.g. `Lead`, `InitiateCheckout`, `CustomEvent` for custom events)
   - `cd[...]` — custom parameters like `cd[status]=likely` or `cd[cta_name]=see-full-comparison`

### 3.3. Full funnel walk-through

Before pushing paid traffic, walk the whole funnel once with Pixel Helper open and confirm you see all nine events listed above. A normal walk takes ~5 minutes:

```
1. Visit /                             → PageView
2. Click "Check My Eligibility"        → PageView (/eligibility-check)
                                       → EligibilityCheck (custom, first session only)
3. Complete the check                  → PageView (/eligibility-check/result)
                                       → Lead (with status)
4. Create account on /register         → PageView, CompleteRegistration
5. Select DIY on /service-tiers        → InitiateCheckout (value: 249.99)
6. Pay via Stripe (test mode)          → Purchase (redirect to /portal?payment=success)
7. Start the form wizard               → PageView
8. Finish Part 1, click Next           → FormSectionComplete (section: part_1)
9. Repeat through several parts        → FormSectionComplete x N
10. Download packet, mark as filed     → ClaimFiled (method: e-file)
```

If any step silently fails to produce the expected event, that's your bug.

---

## 4. The RadiantClaims funnel

Here's the complete user journey mapped to pixel events:

```
                                              Typical Drop-Off
                                              (industry benchmarks)
┌──────────────────────────────────────┐
│  PageView — landed on homepage        │    100%
└───────────────────┬──────────────────┘
                    ↓ ~30-60% click "Check Eligibility"
┌──────────────────────────────────────┐
│  EligibilityCheck — started quiz     │    20-45%
└───────────────────┬──────────────────┘
                    ↓ ~50-80% complete
┌──────────────────────────────────────┐
│  Lead — eligibility verdict shown    │    15-35%
│     (status: likely/unlikely/etc.)   │
└───────────────────┬──────────────────┘
                    ↓ ~30-50% of "likely" register
┌──────────────────────────────────────┐
│  CompleteRegistration                 │    5-15%
└───────────────────┬──────────────────┘
                    ↓ ~40-70% pick a tier
┌──────────────────────────────────────┐
│  InitiateCheckout                     │    2-8%
│     (DIY or Legal Rep)                │
└───────────────────┬──────────────────┘
                    ↓ ~60-85% complete payment (DIY)
┌──────────────────────────────────────┐
│  Purchase ($249.50)                   │    1.5-5%
└───────────────────┬──────────────────┘
                    ↓ users enter the form wizard
┌──────────────────────────────────────┐
│  FormSectionComplete × 16             │    measures
│     (per-part visibility)             │    within-form drop-off
└───────────────────┬──────────────────┘
                    ↓ ~60-80% complete the form
                    ↓ gather docs, install extension
                    ↓ file on justice.gov
┌──────────────────────────────────────┐
│  ClaimFiled (method: e-file)          │    ultimate
│     — TRUE conversion                 │    success metric
└──────────────────────────────────────┘
```

**The key insight:** `Purchase` is *not* your real conversion. `ClaimFiled` is. A user who pays $249.50 but never actually files is a refund waiting to happen. When you optimize Meta campaigns against `Purchase`, you're telling Meta's algorithm "send me people who will pay." When you optimize against `ClaimFiled`, you're saying "send me people who will follow through." The second group has much higher lifetime value and fewer refund requests.

---

## 5. Reading the funnel — what to look for

### 5.1. Step-by-step drop-off

In Meta Events Manager, open **Overview** → look at the volume for each event over the last 7 days. Compute:

```
Drop-off at step N = 1 - (events_N / events_N-1)
```

**Red flags:**

- **PageView → EligibilityCheck drop >90%.** Your homepage isn't converting visitors into the quiz. Usually means the CTA isn't prominent enough, the hero message isn't landing, or page load is too slow.
- **EligibilityCheck → Lead drop >60%.** Quiz abandonment. Probably a specific question is confusing or the quiz feels too long. See section 5.2 for how to debug.
- **Lead → CompleteRegistration drop >80%** *among "likely" status.* Your eligibility-pass page isn't converting. The "Register to continue" CTA might be weak, or the registration form has too much friction.
- **CompleteRegistration → InitiateCheckout drop >60%.** Users register but don't pick a tier. Pricing shock, or the two-path explanation isn't doing its job.
- **InitiateCheckout → Purchase drop >30%.** Stripe checkout abandonment. Investigate card decline rates, Stripe logs, the service-tiers → Stripe handoff.
- **Purchase → any FormSectionComplete drop >20%.** People pay and then never start the form. Something is broken in the post-payment handoff (bad redirect, portal error, etc.).
- **Any single `FormSectionComplete` for a specific part with a huge drop.** That part is where users give up. See the note on form section drop-off below.

### 5.2. Per-section form drop-off

This is the most actionable data source for product work. Because `FormSectionComplete` fires with `section` as a parameter, you can break it down in Meta Events Manager:

1. Events Manager → your dataset → **Overview** tab
2. Scroll to **Custom Events** → click `FormSectionComplete`
3. Click **Breakdown** and pick `section` as the parameter

You'll get a bar chart showing how many users completed each of the 16 sections. A steep drop between Part 8 and Part 9, for instance, means Part 9 (Proof of Presence) is eating users. Fix that section, re-measure, iterate.

### 5.3. Status breakdown on Lead events

`Lead` events fire with `status: "likely" | "unlikely" | "ineligible"`. Break down Lead volume by status to see:

- **Total quiz completions** (all three statuses combined)
- **% of completions that are eligible** (`likely`) — helps judge traffic quality
- **Unlikely / ineligible skew** — if too many users are hitting "ineligible," your targeting is off (ads reaching people outside the RECA-eligible states or demographics)

### 5.4. Time-of-day and day-of-week patterns

In Events Manager → Overview → **Time** breakdown. RECA-eligible audiences (mostly 55-80) typically show strong daytime and weekday patterns. If you see a huge spike at 2am, that's probably bots — flag it and investigate.

---

## 6. Campaign optimization — which event, when

Meta's algorithm needs **roughly 50 conversions per 7-day window** on a given event before it can optimize against it effectively. Below that threshold, the system is guessing and your CPA will be wildly inconsistent.

Use this progression as you scale:

### Stage 1: Cold start (week 1–2)

- **Optimize for:** `Lead` (eligibility check complete)
- **Why:** Highest-volume down-funnel event. Correlated with downstream conversion. You'll hit 50/week fastest here.
- **Budget:** Low ($20-50/day) — you're buying data, not outcomes.
- **Expected CPL:** $8-25 depending on your ad creative.

### Stage 2: Mid-funnel (week 2–4)

- **Optimize for:** `InitiateCheckout`
- **Why:** By now you should be seeing InitiateCheckout volume crossing 50/week if Lead CPL is healthy. This is "intent to pay" — much more qualified than Lead.
- **Budget:** Scale up 2-3× what was working in Stage 1.
- **Expected CPA:** $40-100.

### Stage 3: Bottom-funnel (week 4+)

- **Optimize for:** `Purchase` initially, then `ClaimFiled` once it has volume.
- **Why:** Purchase is the strongest paid signal Meta has. Once you have 50+/week, optimizing directly against Purchase consistently outperforms mid-funnel optimization.
- **ClaimFiled upgrade:** When `ClaimFiled` crosses 50/week (probably week 6–8), switch there. It's your truest success metric and you'll eliminate the "paid but never filed" segment from your paid traffic.
- **Budget:** Whatever your unit economics support. Target CPA should be ≤ 40% of your gross margin per customer.

### Rules of thumb

- **Don't switch optimization events until the new target has 7 consecutive days with 50+ conversions.** Switching early makes the algorithm restart its learning phase and your CPA will spike.
- **Never optimize against `PageView`.** It's too far up-funnel and tells Meta nothing about purchase intent.
- **Don't optimize against `EligibilityCheck` (started).** It's too noisy and uncorrelated with downstream behavior.

---

## 7. Custom audiences for retargeting

Retargeting audiences pay for themselves fast. Build these in Meta Events Manager → **Audiences** → Create Audience → **Custom Audience** → **Website**.

### Audience 1: "Quiz starters, didn't finish"

- **Include:** People who fired `EligibilityCheck` in the last 30 days
- **Exclude:** People who fired `Lead` in the last 30 days
- **Use:** Retarget with an ad that says "Quiz only takes 2 minutes — finish checking your eligibility" and a deep link back to `/eligibility-check`.

### Audience 2: "Eligible but didn't register"

- **Include:** People who fired `Lead` with `status = likely` in the last 30 days
- **Exclude:** People who fired `CompleteRegistration` in the last 30 days
- **Use:** Highest-intent retargeting. Ad copy should reinforce "You qualify — here's how to claim your $100k." Deep link to `/register` or service tiers.

### Audience 3: "Paid but didn't complete a section in 7 days"

- **Include:** People who fired `Purchase` in the last 30 days
- **Exclude:** People who fired `FormSectionComplete` in the last 7 days
- **Use:** Stalled paying customers. Email is better than paid ads here, but a gentle "Pick up where you left off" ad with a deep link to their portal works too.

### Audience 4: "Paid but never filed"

- **Include:** People who fired `Purchase` in the last 90 days
- **Exclude:** People who fired `ClaimFiled` in the last 90 days
- **Use:** This is your customer success problem, not an ad problem. Export the list and have your team reach out directly — these are the people most likely to refund. Not a paid-ad audience.

### Audience 5: "Bounced homepage" (lookalike seed)

- **Include:** People who fired `PageView` on `/` in the last 180 days
- **Exclude:** People who fired `EligibilityCheck` in the last 180 days
- **Use:** Too noisy for direct retargeting, but it's a useful *negative* exclusion ("don't show homepage ads to people who already bounced"). Don't use as a lookalike seed — it's low-quality.

### Best seed for lookalikes

Use `ClaimFiled` as your lookalike seed once you have ≥500 events. That's a clean, high-intent list of people who actually completed the journey. Meta will find more people who look like them — that's your best cold-acquisition channel.

If you don't have 500 `ClaimFiled` yet, fall back to `Purchase` as a seed. Below 100 events, lookalikes don't work well — stick with interest and geo targeting instead.

---

## 8. Custom conversions

Custom Conversions let you define a "conversion" as any combination of URL + event + parameter match. They're useful when you want to:

- Count `Lead` events as conversions *only if* `status = "likely"` (filter out ineligible traffic)
- Count `FormSectionComplete` as a conversion only when `completion_percent >= 50` (halfway mark)
- Track homepage CTA clicks by `location` for A/B testing

### Setup

Events Manager → **Custom Conversions** → **Create Custom Conversion**.

### Recommended custom conversions for RadiantClaims

1. **"Likely Eligible Lead"**
   - Event: `Lead`
   - Parameter filter: `status equals likely`
   - Use as your primary top-of-funnel KPI. Filters out "unlikely" and "ineligible" verdicts so you're only counting qualified leads.

2. **"Halfway Form Completion"**
   - Event: `FormSectionComplete`
   - Parameter filter: `completion_percent >= 50`
   - Fires when a user crosses the 50% mark in the form wizard. Strong signal of commitment.

3. **"Comparison Link Click"**
   - Event: `CtaClick`
   - Parameter filter: `cta_name equals see-full-comparison`
   - Measures engagement with the homepage-to-service-tiers link. Useful for A/B testing that section.

---

## 9. Three ready-to-run campaigns

These are starter campaigns you can duplicate in Ads Manager. Tune targeting, creative, and budget to your situation.

### Campaign A: Cold acquisition (week 1–2)

- **Objective:** Leads
- **Optimization event:** `Lead`
- **Targeting:**
  - Location: UT, NM, AZ, NV, ID (RECA-eligible states)
  - Age: 55–75
  - Interests: cancer awareness, veteran affairs, elder care, government benefits
  - Detailed exclusions: exclude anyone already in "Paid" or "Registered" audiences
- **Placements:** Facebook Feed + Instagram Feed (skip Stories/Reels for this audience)
- **Creative:** A mix of (a) "Do you qualify for $100k?" hero + short video, (b) testimonial-style static with copy about the DOJ backlog, (c) plain-text "2 minute eligibility check" offer
- **Daily budget:** $30–50

### Campaign B: Retargeting — quiz abandoners

- **Objective:** Leads
- **Optimization event:** `Lead`
- **Audience:** Custom Audience "Quiz starters, didn't finish" (see section 7)
- **Creative:** Direct, urgent — "You started the eligibility check. It only takes 2 more minutes to finish." Link directly back to the check.
- **Daily budget:** $10–15 (small audience, small spend)
- **Frequency cap:** 3 impressions / 7 days — don't hammer them

### Campaign C: Retargeting — eligible but didn't register

- **Objective:** Conversions
- **Optimization event:** `CompleteRegistration`
- **Audience:** Custom Audience "Eligible but didn't register"
- **Creative:** Reassuring + urgent. "Your eligibility was confirmed. Here's your next step." Mention the $100k and that registration takes a minute.
- **Daily budget:** $15–25
- **Frequency cap:** 5 impressions / 7 days
- **Expected ROAS:** highest of any campaign — this is warm, qualified traffic.

---

## 10. Debugging common problems

### Problem: Pixel Helper shows "no pixel detected"

- `NEXT_PUBLIC_META_PIXEL_ID` isn't set, or the deployment doesn't have it
- Content blocker / ad blocker is stripping the pixel script — test in incognito with all extensions off
- Pixel script has an error — check browser console for `fbq is not defined`

### Problem: Events fire locally but not in production

- Env var set on local `.env.local` but not on the hosting platform (Vercel: Project → Settings → Environment Variables)
- After setting the env var, you may need to **redeploy** — Next.js inlines `NEXT_PUBLIC_` vars at build time

### Problem: `Lead` fires twice on a single eligibility result

- React Strict Mode double-renders in dev — only a dev-mode issue, production is fine
- If it's also happening in production, check for a duplicate `trackEligibilityComplete` call or a useEffect without proper dependencies

### Problem: `Purchase` doesn't fire after Stripe redirect

- Check the URL parameter — we listen for `?payment=success` on `/portal`. If Stripe is redirecting to a different parameter, update `src/app/portal/page.tsx`
- Check that the Stripe success URL in your checkout config actually includes `?payment=success`

### Problem: Events show in Pixel Helper but not in Events Manager

- Meta has a 15–20 minute delay on the Overview tab
- Use **Test Events** in Events Manager — near real-time
- If Test Events works but Overview doesn't, there's nothing wrong — just wait

### Problem: Ads Manager says "insufficient data to optimize"

- You have fewer than ~50 events per 7-day window on the target event
- Drop back to a higher-funnel event (see section 6) until you're above threshold
- Or increase budget/targeting breadth so the volume comes up naturally

### Problem: CPA tanks after switching optimization events

- Algorithm restart is normal — expect 3–7 days of unstable performance after any optimization change
- Don't react within the first week; watch the 7-day rolling average
- If still bad after 7 days, revert to the previous optimization event

---

## 11. Gaps and future work

Known instrumentation gaps, ordered by priority:

1. **`EligibilityCheck` completion rate by page.** We only fire on mount. A separate `trackCustom("EligibilityStepComplete", { step: N })` call on each step of the check would show per-step drop-off.
2. **Click tracking on portal CTAs.** The portal tracker's "Continue" buttons, "Install Chrome Extension" callouts, and decision helper columns are not instrumented. Wrap them in `<TrackedLink>` when you want per-CTA analytics.
3. **Document upload events.** No event fires when a user successfully uploads a document. Would be useful for measuring how many uploads happen per paying customer.
4. **DOJ packet download.** No event on `handleDownloadPacket` success in the portal. A `trackCustom("PacketDownloaded")` call would complete the packet workflow.
5. **Conversions API (server-side).** Pixel is browser-only, which means iOS 14.5+ and strict-tracking-protection users are invisible. Meta's Conversions API sends events server-side as a backup, capturing users the pixel misses. Meaningful improvement (typically +15–30% event match rate) but non-trivial to set up. Worth doing once ad spend is >$1k/week.
6. **Event deduplication.** When Conversions API is set up alongside Pixel, you need `eventID` parameters on every event to deduplicate. Not a concern until you do #5.

---

## 12. Adding new events in code

### 12.1. Adding a new standard or custom event

Edit `src/lib/analytics/meta-pixel.ts` — follow the pattern of the existing functions:

```ts
/** Description of when this event fires */
export function trackMyNewEvent(param: string) {
  fbq("trackCustom", "MyNewEventName", {
    my_param: param,
  });
}
```

Then import and call it from the relevant component:

```ts
import { trackMyNewEvent } from "@/lib/analytics/meta-pixel";

// inside an onClick / useEffect / submit handler
trackMyNewEvent("some-value");
```

### 12.2. Adding a tracked CTA link

Use the existing `<TrackedLink>` wrapper instead of `<Link>`:

```tsx
import { TrackedLink } from "@/components/analytics/TrackedLink";

<TrackedLink
  href="/some-path"
  ctaName="my-cta-identifier"
  location="homepage-hero"
  className="text-blue-600 underline"
>
  Click me
</TrackedLink>
```

The click will fire a `CtaClick` custom event with your `ctaName` and `location` parameters, which you can filter on in Events Manager.

### 12.3. Adding a tracked button (not a link)

If it's a button (e.g., a form submit, not a navigation), call `trackCtaClick` directly inside the onClick handler:

```tsx
"use client";
import { trackCtaClick } from "@/lib/analytics/meta-pixel";

<button
  onClick={() => {
    trackCtaClick("download-packet", "portal-tracker");
    // ... rest of your handler
  }}
>
  Download packet
</button>
```

### 12.4. Always wrap tracking in try/catch

Never let an analytics failure break a user flow. Every tracking call should be wrapped:

```ts
try {
  trackSomeEvent(value);
} catch (e) {
  console.warn("[analytics] trackSomeEvent failed", e);
}
```

The existing helpers in `meta-pixel.ts` already no-op if `window.fbq` is undefined, but if you're calling tracking in a critical path, add the try/catch anyway as a safety net.

---

## Appendix: file locations

| Concern | File |
|---|---|
| Event definitions | `src/lib/analytics/meta-pixel.ts` |
| Pixel script injection | `src/app/layout.tsx` |
| Env var | `.env.local` → `NEXT_PUBLIC_META_PIXEL_ID` |
| Tracked link wrapper | `src/components/analytics/TrackedLink.tsx` |
| Eligibility start tracking | `src/app/eligibility-check/page.tsx` |
| Eligibility complete tracking | `src/app/eligibility-check/result/page.tsx` |
| Registration tracking | `src/app/register/page.tsx` |
| Tier selection tracking | `src/app/service-tiers/page.tsx` |
| Form section tracking | `src/components/reca/wizard/FormWizard.tsx` |
| Purchase tracking | `src/app/portal/page.tsx` |
| Claim filed tracking | `src/components/portal/DOJSubmissionCard.tsx` |
| This guide | `docs/META_PIXEL_GUIDE.md` |

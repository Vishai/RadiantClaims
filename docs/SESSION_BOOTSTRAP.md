# Session Bootstrap — Picking Up a New Claude Code Session

Read this file at the start of any new Claude Code session where you want to work on **campaigns, content, or acquisition**. It tells you what's live, what's in flight, and what to do next.

---

## The 2-minute read

**Where we are as of April 14, 2026:**

- ✅ Site infrastructure: homepage, portal, eligibility check, service tiers, legal pages, Footer — all live and verified
- ✅ Meta Pixel: fully active, pixel ID `1368350645332901`, events firing correctly to `facebook.com/tr`
- ✅ Full funnel events verified: PageView, EligibilityCheck, Lead, InitiateCheckout, Purchase, ClaimFiled, FormSectionComplete, CtaClick
- ✅ Legal foundation: `/privacy`, `/terms` (Utah governing law), `/contact`, site-wide Footer with "not a law firm" disclaimer
- ✅ Facebook Business Page live: @RadiantClaims with cover photo and profile picture
- ✅ Meta Business Account created under `Radiant Claims`, Pixel linked to Page in Business Manager
- 🟡 Meta Pixel core setup mode is active (declared "Personal hardship" sensitive data category — this restricts custom parameter flow but doesn't block standard events)
- 🟡 Zero ad spend yet. No campaigns running.
- 🟡 Zero organic posts yet. Facebook Page has 0 followers.
- 🟡 DOJ scraper exists (`src/lib/doj-scraper-*.ts`) but nothing schedules it daily yet
- 🟡 No `ClaimOutcome` data model yet — we want to start capturing when users receive their awards

**What the business is trying to do:**

Launch paid and organic acquisition for RECA claim preparation targeting downwinder families in UT/NM/AZ/NV/ID (and adjacent exposures), with a 2027 program deadline. Owner has never run a successful Facebook campaign before — learning posture is as important as execution.

---

## The canonical documents

Read in this order the first time. After that, open whichever is relevant to the task at hand.

### Read first (foundational context)

1. **`docs/CAMPAIGN_PLAYBOOK.md`** — the strategy doc. Organic ↔ paid, audience personas, budget tiers, paid stage progression, creative guidelines, compliance guardrails, emergency protocols.
2. **`docs/CONTENT_PILLARS.md`** — what to post, how often, templates, a weekly calendar.
3. **`docs/META_PIXEL_GUIDE.md`** — the tactical pixel/funnel/optimization reference. All events wired, how to verify, how to debug.

### Reference when needed

- `.claude/projects/-Users-brandonarmstrong-Developer-RadiantClaims/memory/MEMORY.md` — project memory with architectural decisions, gotchas, and historical notes
- `src/lib/analytics/meta-pixel.ts` — the Meta Pixel event definitions
- `src/components/portal/ClaimSummaryCard.tsx` — portal claim card (contains FilingJourneyTracker, PersonalizedPathBand, collapsibles)
- `src/lib/doj-scraper-webfetch.ts` and `src/lib/doj-scraper-puppeteer.ts` — DOJ scraping infrastructure
- `src/lib/doj-metrics-calculator.ts` — metrics aggregation from scraped data
- `vercel.json` — current cron job configuration
- `prisma/schema.prisma` — database schema (esp. `Claimant`, `IntakeSession`, `ClaimLifecycle`, `Payment` models)

---

## What's done vs. what's pending

### Done and live (verified via production traffic)

| Area | What's done | How to verify |
|---|---|---|
| Portal redesign | `FilingJourneyTracker`, `PersonalizedPathBand`, `ClaimSummaryCard` with collapsibles | Log in, visit `/portal`, check a claim with a set relationship |
| Service tiers | DIY + Legal Rep cards rebalanced, "Why not just file directly" comparison table, decision helper | Visit `/service-tiers` |
| Homepage | Hero, "Why RadiantClaims", Two Ways to Claim, decision helper, Footer | Visit `/` |
| Legal pages | `/privacy`, `/terms` (Utah governing law), `/contact`, Footer with disclaimer | Visit each page |
| Meta Pixel | Events firing correctly to Meta | Meta Pixel Helper or check Events Manager → Test Events |
| Facebook Business Page | @RadiantClaims live with cover + profile pic + Services + bio + legal info | Visit the page |
| Meta Business Account | `Radiant Claims` account linked to Pixel and Page | Visit business.facebook.com/settings |

### Pending — high priority

| Area | What's pending | Rough effort | Dependencies |
|---|---|---|---|
| Daily DOJ scrape cron | Add `/api/cron/doj-scrape` endpoint + entry in `vercel.json` | 15–20 min | None (scraper exists) |
| First ad campaign | Launch Campaign A from Meta Pixel Guide §9 — cold acquisition, Leads objective, $30–50/day | 1–2 hours | Ad budget decision, creative, ad account funding |
| First organic posts | Draft and schedule the first 2 weeks of Daily DOJ + Story + Education posts | 2 hours | Daily DOJ cron running (so the data exists to post about) |
| `ClaimOutcome` data model | New Prisma model for capturing when users receive DOJ awards | 45 min | Schema migration requires db access + fresh eyes |
| Claim outcome UI | Portal UI for users to self-report "I was awarded / denied / still waiting" | 1 hour | `ClaimOutcome` model exists |
| Aggregate outcome metric | Homepage badge: "Average time from filing to payout: X months" | 30 min | ≥20 outcome data points exist |
| Agent scaffolding | `.claude/agents/` subagent definitions for story mining, post drafting, campaign auditing, compliance checking | 2 hours | Decision on which agents are priority |

### Pending — lower priority (backlog)

- Backend `recaWorkflowStage`/`recaWorkflowSection` update bug (Bonnie Frederickson's claim is 96% complete but workflowStage=1, workflowSection=part_1 — stale)
- `NEXTAUTH_URL` in `.env.local` points at production (breaks local auth testing)
- Stripe test-mode consistency in `.env.local` (test publishable key + live secret key + `STRIPE_TEST_MODE=false` is an inconsistent state)
- `/service-tiers` is fully client-rendered (hurts SEO/ad quality score)
- Clerk.io integration cleanup (if any residuals)

---

## Quick-start: common session types

### "I want to launch my first ad campaign"

1. Read `CAMPAIGN_PLAYBOOK.md` §4 (budget tiers) and §5 (paid campaign progression)
2. Decide your budget tier ($500, $2k, or $5k/month)
3. Read `META_PIXEL_GUIDE.md` §9 (three ready-to-run campaigns)
4. Draft 3 ad creatives following `CAMPAIGN_PLAYBOOK.md` §6 (creative guidelines)
5. Set up Campaign A in Meta Ads Manager
6. Start with Lead optimization, not Purchase
7. Review after 7 days, then 14 days

### "I want to schedule the first week of organic posts"

1. Read `CONTENT_PILLARS.md` entirely
2. Confirm the Daily DOJ scrape cron is running (check `vercel.json` for the `/api/cron/doj-scrape` entry)
3. Draft 5 Daily DOJ status posts using the template, one per weekday
4. Draft 1 founder story post from `CONTENT_PILLARS.md` §Pillar 2
5. Draft 2 educational posts from the eligibility-explainer or document-checklist templates
6. Draft 1 community post (state call-out or question)
7. Schedule them in Meta Business Suite for the week ahead, spread across 7am/12pm/6pm slots
8. Set a calendar reminder to review engagement Friday afternoon

### "I want to run the daily DOJ scraper as a cron"

1. Check `vercel.json` → does `/api/cron/doj-scrape` exist? If yes, done.
2. If no: create `src/app/api/cron/doj-scrape/route.ts` that calls the existing scraper
3. Add entry to `vercel.json` crons array:
```json
{ "path": "/api/cron/doj-scrape", "schedule": "0 13 * * *" }
```
(13:00 UTC = 7am MT)
4. Verify the scraper has `CRON_SECRET` authentication (follow the pattern in `src/app/api/cron/re-engagement/route.ts`)
5. Deploy via `vercel --prod`
6. Manually trigger once to verify: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.radiantclaims.com/api/cron/doj-scrape`
7. Wait 24 hours, confirm the daily run happened
8. Add a Slack/email alert for cron failure (Vercel Cron has built-in failure notifications — check the dashboard)

### "I want to build the ClaimOutcome feature"

1. Read `CAMPAIGN_PLAYBOOK.md` §10 for the full design
2. Add the `ClaimOutcome` model to `prisma/schema.prisma` (template in §10)
3. Run `npx prisma migrate dev --name add-claim-outcome` locally
4. Test locally that the model works
5. Build the API route: `POST /api/claims/[id]/outcome` to create/update outcome
6. Add UI to `ClaimSummaryCard` for claims with `status === "SUBMITTED"` — a collapsible "I heard back from the DOJ" section
7. Fire a `trackCustom("ClaimOutcome", { outcome })` Meta Pixel event on submission
8. Deploy, verify via network request
9. Add aggregate query to surface on homepage once you have ≥20 data points

### "I want to scaffold the agent tooling"

1. Create `.claude/agents/` directory
2. Define subagents as markdown files (one per agent):
   - `story-miner.md` — searches news/RSS/Reddit for RECA stories
   - `post-writer.md` — turns research into Facebook post drafts
   - `campaign-auditor.md` — checks Meta Events Manager state, flags anomalies
   - `compliance-checker.md` — pre-flights content against compliance rules
3. Each file should contain:
   - Clear purpose statement
   - Input expectations (what prompt template triggers it)
   - Tool access (whether it needs WebFetch, WebSearch, Grep, etc.)
   - Output format (what to return and where)
   - Example invocation
4. Create scheduled tasks via `mcp__scheduled-tasks__create_scheduled_task`:
   - Daily 7am MT: `story-miner` runs
   - Weekly Monday 9am MT: `campaign-auditor` runs if ad campaigns are live
5. Test each agent once manually before trusting the schedule
6. Document the first-time manual trigger commands in this file

---

## Critical environment + config notes

### Vercel production env vars (already set)

- `NEXT_PUBLIC_META_PIXEL_ID=1368350645332901` ✓ (fixed — originally broken with trailing newline)
- `CRON_SECRET` — used by existing cron routes for auth
- `STRIPE_SECRET_KEY` — live mode
- `STRIPE_TEST_MODE=false`
- Other Stripe price IDs and publishable keys as configured

### Local `.env.local` gotchas

- `NEXTAUTH_URL="https://www.radiantclaims.com"` — points at production. If you try to run local auth, change this to `http://localhost:3000` temporarily.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a **test** key, but `STRIPE_SECRET_KEY` is **live**, and `STRIPE_TEST_MODE=false`. Inconsistent. Either flip `STRIPE_TEST_MODE` to true when testing locally, or swap the publishable key to live.

### Env var hygiene rule (learned the hard way)

**Never use `echo "value" | vercel env add ...`** — `echo` appends a trailing newline that gets stored as part of the value. Use `printf '%s' 'value' | vercel env add ...` instead. This bit us on April 14 — the pixel was silently broken for ~2 hours because of it.

---

## Deployment

- **Production:** `vercel --prod` from the repo root
- **Preview:** `vercel` (no `--prod`) deploys to a preview URL for testing
- **Local dev:** `npm run dev` or `pnpm dev` from the repo root
- **Cron testing:** manually trigger with `curl -H "Authorization: Bearer $CRON_SECRET" https://www.radiantclaims.com/api/cron/<name>`

---

## Who to ask (human-in-the-loop decisions)

These are decisions that need Brandon's judgment, not an agent's:

1. **Final ad creative approval** — never publish ads without Brandon reviewing the image + copy
2. **Budget increases** — never scale spend more than 20% every 3 days without explicit approval
3. **Testimonial publishing** — never publish a claimant quote without written permission
4. **Legal-adjacent content** — any copy discussing eligibility, success rates, or award amounts should be reviewed
5. **New partner relationships** — Heritage Law Offices is already set up; any other partner needs sign-off
6. **Response to negative press or community issues** — don't try to auto-reply

---

## The ongoing learning log

Maintain a running log of campaign experiments in `docs/learning-log.md` (create if it doesn't exist):

```markdown
## YYYY-MM-DD — [short title]
**Change:** [what was done]
**Hypothesis:** [why you expected it to work]
**Result after 7 days:** [what actually happened]
**Takeaway:** [what to do differently next time]
```

This is worth more than any playbook. Real-world data about what actually moves your specific audience is gold.

---

## When you're stuck

1. **Meta Ads is confusing:** read `CAMPAIGN_PLAYBOOK.md` §5 (paid progression) and the decision tree in §8
2. **You don't know what to post today:** open `CONTENT_PILLARS.md` and find an eligibility question you haven't covered
3. **A pixel event isn't firing:** read `META_PIXEL_GUIDE.md` §10 (debugging common problems)
4. **An ad got rejected:** read `CAMPAIGN_PLAYBOOK.md` §6 (creative compliance) and revise the rejected copy
5. **Performance dropped suddenly:** read `CAMPAIGN_PLAYBOOK.md` §13 (emergency protocols)

---

## Closing

This is a 6–18 month build. Compound daily. The daily DOJ post is the drumbeat. The learning log is the memory. The playbook is the north star. The pillars are the steering wheel. Go.

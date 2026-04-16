# RadiantClaims Campaign Playbook

The strategic doc for running organic + paid acquisition for RadiantClaims. Read this once, refer back to it weekly.

**Companion documents:**
- [`META_PIXEL_GUIDE.md`](./META_PIXEL_GUIDE.md) — the tactical pixel/funnel/optimization reference
- [`CONTENT_PILLARS.md`](./CONTENT_PILLARS.md) — what to post and when
- [`SESSION_BOOTSTRAP.md`](./SESSION_BOOTSTRAP.md) — how to pick up a new Claude Code session on campaign work

---

## Table of contents

1. [The RadiantClaims acquisition model](#1-the-radiantclaims-acquisition-model)
2. [Audience — three personas that matter](#2-audience--three-personas-that-matter)
3. [Organic ↔ paid: how they feed each other](#3-organic--paid-how-they-feed-each-other)
4. [Budget frameworks — $500, $2k, and $5k/month](#4-budget-frameworks--500-2k-and-5kmonth)
5. [Paid campaign progression — the four stages](#5-paid-campaign-progression--the-four-stages)
6. [Creative guidelines — what converts and what gets you banned](#6-creative-guidelines--what-converts-and-what-gets-you-banned)
7. [The weekly review rhythm](#7-the-weekly-review-rhythm)
8. [KPIs and the decision tree](#8-kpis-and-the-decision-tree)
9. [The daily DOJ status product](#9-the-daily-doj-status-product)
10. [The "path to payout" tracker](#10-the-path-to-payout-tracker)
11. [Compliance guardrails — the rules that will save your business](#11-compliance-guardrails--the-rules-that-will-save-your-business)
12. [Anti-patterns — mistakes first-time advertisers make](#12-anti-patterns--mistakes-first-time-advertisers-make)
13. [Emergency protocols](#13-emergency-protocols)
14. [Glossary](#14-glossary)

---

## 1. The RadiantClaims acquisition model

### What makes your audience different

You are not selling SaaS to 25-year-olds who spend 4 hours a day on Instagram. You are serving:

- **Elderly downwinders** (primarily 60–85), often with current or past cancer diagnoses
- **Adult children of deceased downwinders** (45–70), filing posthumously for a parent or grandparent
- **Surviving spouses** of downwinders, often dealing with grief and estate logistics

This audience:

- **Reads more, scrolls less.** They tolerate long copy. They distrust flashy design. They value credibility signals (real addresses, phone numbers, the word "attorney" used carefully).
- **Uses Facebook more than Instagram.** Facebook still dominates the 55+ demographic in the U.S. Put 80% of paid budget on Facebook feed, 20% on Instagram feed. Skip Stories/Reels until you're scaling.
- **Responds to warmth, not urgency.** High-pressure ad creative ("ONLY 48 HOURS LEFT!!!") makes this audience suspicious. Soft urgency ("the 2027 deadline is approaching — here's what you need to prepare") works.
- **Checks in on phone and tablet at specific times.** Peak engagement windows: 7–9am local, 12–2pm local, 7–10pm local. Schedule organic posts accordingly.
- **Trusts institutional cues.** The words "Department of Justice," "federal program," "United States," and "attorney" carry weight. Use them honestly and often.

### The three-layer model

Your acquisition engine has three layers, each feeding the next:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — EDUCATION                                            │
│  Content explaining RECA, downwinder history, eligibility       │
│  Channels: organic FB posts, blog, SEO, local community groups  │
│  KPI: reach, page follows, post engagement                      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓ warms up cold audience
┌──────────────────────┴──────────────────────────────────────────┐
│  LAYER 2 — LEAD CAPTURE                                         │
│  Eligibility check (the free 2-minute quiz)                     │
│  Channels: paid FB cold acquisition, organic CTAs, referrals    │
│  KPI: Lead events in Meta Pixel, with status=likely breakdown   │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓ qualifies intent
┌──────────────────────┴──────────────────────────────────────────┐
│  LAYER 3 — CONVERSION                                           │
│  Registration → service tier pick → Stripe checkout             │
│  Channels: on-site + retargeting of quiz completers             │
│  KPI: Purchase events; long-term: ClaimFiled events             │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Don't skip Layer 1 when you're under $1k/month in ad spend. Cold audiences don't buy on first impression. You need warm surfaces (the page, posts, reviews, a visible Footer, legal pages) to convert the warmed-up traffic your ads will produce.

---

## 2. Audience — three personas that matter

Build campaigns and content for these three people. Every piece of creative should serve at least one.

### Persona A — "Martha, the surviving spouse"

- **Age:** 65–78
- **State:** Utah, Nevada, Arizona, New Mexico, Idaho
- **Situation:** Lost her husband to leukemia, lung cancer, or thyroid cancer in the last 1–10 years. Knows vaguely that there's "some government program" but has never researched it. Has a pile of medical records in a box in the closet.
- **Fears:** Paperwork, legalese, being scammed by a shady company, losing family photos, forgetting a deadline.
- **What works:** Warm photography (desert dawn, not finger-wagging urgency). Direct acknowledgement of grief. Plain-English explanation. A phone number visible. Testimonials from real people.
- **Facebook targeting:**
  - Location: UT, NV, AZ, NM, ID + adjacent counties
  - Age: 60–80
  - Gender: female (skew — not exclusive)
  - Interests: Grief recovery, senior living, veterans affairs, government benefits, local community (depending on state)
  - Exclusions: Tech employees, crypto investors (pure noise for this persona)
- **Best-performing content type:** Testimonials, founder stories, DOJ program explainers

### Persona B — "Ray, the self-filer"

- **Age:** 62–76
- **State:** Same five-state core, plus Colorado, Oregon, Montana (adjacent exposures)
- **Situation:** Ray himself has a covered cancer — prostate, thyroid, or bladder. Lives in a small town in southern Utah or western Colorado. Retired or semi-retired. Handles his own bills and taxes, considers himself "self-sufficient." Has already Googled "RECA eligibility" a few times and given up because the DOJ guidance was overwhelming.
- **Fears:** Looking stupid, wasting time, missing paperwork requirements, getting denied after doing all the work.
- **What works:** Specifics. Facts. "Here's what the DOJ actually requires, plain English." Confidence-building copy ("you've got this — we'll walk you through it"). Clear pricing.
- **Facebook targeting:**
  - Location: Same core states, smaller radius around rural ZIPs in affected counties
  - Age: 58–76
  - Gender: male (skew — not exclusive)
  - Interests: Veterans affairs, self-filed taxes, DIY, "Silver surfer" tech adoption, local community/church
  - Employment: retired / semi-retired (Meta has targeting for this)
- **Best-performing content type:** How-to explainers, the Chrome extension feature, DOJ process breakdowns, 2027 deadline countdown, DIY vs Legal Rep comparison

### Persona C — "Karen, the adult child"

- **Age:** 45–65
- **State:** Anywhere in the U.S. — not just the core five. This persona left home decades ago.
- **Situation:** Her father/mother passed from a covered cancer. Mom is also still alive and confused about paperwork. Karen is handling the estate, has a professional job, is tech-literate, and is the family's "problem solver." She has energy to do the work but zero time. She'd rather pay $250 for a clean tool than fumble through DOJ forms for 40 hours.
- **Fears:** Messing up a claim her mom is counting on, running out of time, being blamed by siblings.
- **What works:** Efficiency messaging ("we handle the paperwork so you can focus on your family"), the guided-form + document-checklist angle, the Legal Rep option for genuinely complex cases, family-collaboration features ("invite siblings"), decisive CTAs.
- **Facebook targeting:**
  - Location: Nationwide, with higher bid caps on UT/NM/AZ/NV/ID
  - Age: 42–65
  - Gender: female (skew)
  - Interests: Elder care, family caregiving, estate planning, working parents, professional careers, LinkedIn users
  - Detailed behaviors: Small business owners, working-age adults with elderly parents
- **Best-performing content type:** Efficiency pitches, testimonials from other adult children, "I did this for my dad" stories, family collaboration feature spotlight

---

## 3. Organic ↔ paid: how they feed each other

Never run one without the other. Here's the handoff:

**Organic does:**
- Establishes credibility (a visible, active Page with real posts is table stakes — an ad pointing to an empty Page converts ~40% worse)
- Warms up the "RadiantClaims" brand so cold ad viewers recognize it on a second touch
- Surfaces testimonials and community engagement you can quote in ad creative
- Ranks for long-tail SEO (via your blog + links from your posts)
- Creates the audience pool for retargeting ("Page engagers last 90 days")

**Paid does:**
- Generates scale that organic cannot (at $0.50–2.00 per Lead, you're buying 15–60 Leads/day at $30–50/day — impossible organically for a new page)
- Lets you optimize against specific conversion events (Lead, InitiateCheckout, Purchase)
- Funnels cold audiences into your organic Page follows (30–50% of ad clickers follow the Page)
- Provides data for lookalike audiences

**The minimum viable rhythm:**
1. Post 3–4 times per week organically (content pillars in `CONTENT_PILLARS.md`)
2. Run at least one cold-acquisition campaign at ≥$20/day
3. Run at least one retargeting campaign at ≥$10/day pointed at Page engagers and site visitors

Dropping either organic or paid cuts your blended conversion rate by 30–50%. Do both, even at low budget.

---

## 4. Budget frameworks — $500, $2k, and $5k/month

Calibrate your expectations to what you can actually commit. These frameworks are battle-tested for service businesses targeting the 55+ demographic in the U.S.

### Budget tier 1 — $500/month (roughly $17/day)

**Objective:** Learn. Don't expect profitable ROAS in month 1.

**Allocation:**
- 70% ($350/mo = $11/day) → Cold acquisition campaign optimized for `Lead`
- 20% ($100/mo = $3/day) → Retargeting of Page engagers and website visitors
- 10% ($50/mo) → Boosted organic posts (the best one of the week)

**Expected outcomes:**
- 10–25 Leads per week (rough benchmark: $2–4 per Lead for this audience)
- 1–3 registrations per week
- 0–1 Purchases per week
- **You will not hit positive ROAS this month.** You're buying data. The goal is:
  - Identify which ad creative resonates
  - Identify which audience segment converts best
  - Build an audience pool for month 2 retargeting
- After 30 days, you'll have ~80 Leads, enough for Meta's algorithm to start optimizing against `Lead` effectively

**When to stay at this tier:** If month 1 produces 1–2 Purchases at a total CPA under $300. If CPA is higher, don't scale — iterate creative and audience first.

### Budget tier 2 — $2,000/month (roughly $65/day)

**Objective:** Establish a repeatable unit economics model.

**Allocation:**
- 55% ($1,100/mo ≈ $36/day) → Cold acquisition optimized for `Lead`, split across 2 audience personas
- 25% ($500/mo ≈ $16/day) → Retargeting cascade (3 audiences: quiz-abandoners, eligible-didn't-register, registered-didn't-purchase)
- 10% ($200/mo ≈ $7/day) → Lookalike-based cold acquisition (seed: your Lead custom audience once ≥100 Leads exist)
- 10% ($200/mo) → Boosted organic posts

**Expected outcomes:**
- 40–90 Leads per week
- 6–15 registrations per week
- 2–6 Purchases per week
- **Unit economics start to matter:** track `CPA` (cost per Purchase) against your $249 average revenue. At this tier, target blended CPA under $150 by end of month 2.
- **Switch optimization:** Once you have 50+ Purchase events in a 7-day window (probably week 4–6), switch campaign optimization from `Lead` to `Purchase`. Expect a 5–7 day turbulence period as the algorithm re-learns.

### Budget tier 3 — $5,000+/month (roughly $165+/day)

**Objective:** Scale profitably and stockpile learning data for further scale.

**Allocation:**
- 45% → Cold acquisition optimized for `Purchase` (only after you have ≥50 Purchase events/week)
- 25% → Cold acquisition optimized for `Lead` (separate campaigns, never combine optimization events in one ad set)
- 15% → Retargeting cascade
- 10% → Lookalike cold acquisition (seed: Purchase custom audience once ≥100 exists)
- 5% → Creative testing budget (always run 1 experimental ad set against unproven creative)

**Expected outcomes:**
- 120–250 Leads/week
- 15–40 Purchases/week
- Blended CPA target: under $120
- After 60 days: you should be able to cleanly attribute which audience-creative pairs drive ROAS > 2x

**Advanced moves available at this tier:**
- Start running `ClaimFiled` optimization (requires ≥50 ClaimFiled events/week — might take 90+ days from launch)
- Expand to adjacent states with historical exposure (Colorado, Montana, Oregon, Wyoming) using a new ad set
- Begin testing short-form video creative (founder story, claimant testimonial)

### Critical rule at every budget tier

**Never optimize against a conversion event with fewer than 50 events per 7-day window.** Below that threshold, Meta's algorithm can't learn effectively and CPA becomes chaotic. Stay on a higher-funnel event (Lead) until the next one crosses the threshold.

---

## 5. Paid campaign progression — the four stages

Your first 90 days of paid traffic should move through these stages in order. Don't skip stages.

### Stage 1 — Days 1–14: Cold start, Lead optimization

**What to run:**
- One campaign: "Cold Acquisition — Leads"
- One ad set targeting Persona A (Martha) in UT/NV/AZ/NM/ID, age 60–80
- 3 ad creatives: (1) testimonial-style static, (2) landscape photo + tagline (use your new Facebook cover assets), (3) plain-text "2 minute eligibility check" offer
- Daily budget: $30 (or your tier 1/2 allocation)
- Optimization: `Lead`

**What success looks like:**
- By day 7: 25+ Leads, CPL under $4
- By day 14: 60+ Leads, CPL under $3.50
- At least one creative clearly outperforming the others (click-through rate 2x higher)

**What failure looks like:**
- Day 7: <10 Leads or CPL > $8
- Day 14: no creative clearly winning
- If you see this, the problem is almost always audience or creative, not budget. Pause the campaign, rework creative, relaunch.

### Stage 2 — Days 15–30: Add retargeting and persona B

**What to add:**
- Second ad set in the same campaign targeting Persona B (Ray — self-filer, age 58–76, male skew)
- New campaign: "Retargeting — Quiz Abandoners"
  - Audience: people who fired `EligibilityCheck` but not `Lead` in last 30 days
  - Creative: direct, urgent — "You started the quiz. 2 more minutes to finish."
  - Daily budget: $10–15
  - Optimization: `Lead`
- New campaign: "Retargeting — Eligible Didn't Register"
  - Audience: `Lead` with `status=likely` in last 30 days, exclude `CompleteRegistration` in last 30 days
  - Creative: reassuring — "Your eligibility was confirmed. Here's your next step."
  - Daily budget: $10–15
  - Optimization: `CompleteRegistration`

**What success looks like:**
- Retargeting CPA under 2x your cold CPL (this audience is warmer, should convert cheaper)
- Registration count visibly climbing week-over-week

### Stage 3 — Days 30–60: Establish optimization for InitiateCheckout

**What to change:**
- If `Lead` CPL is under $5 and you have 50+ Leads/week, leave the cold campaign running as-is
- Launch a new cold campaign optimized for `InitiateCheckout` once InitiateCheckout crosses 50 events/week
- Add Persona C (Karen — adult child) as a third ad set, nationwide targeting with elevated bids on core five states

**When to pause a campaign:**
- 14 consecutive days with CPA more than 2.5x your target
- Zero Purchases for 21 consecutive days on a cold acquisition campaign
- Policy strike or ad rejection that requires escalation

### Stage 4 — Days 60+: Scale cautiously

**When to scale budget:**
- CPA has been stable for 14 consecutive days
- Your Lead → InitiateCheckout → Purchase conversion rates are within ±20% day-over-day
- You are no longer the bottleneck (you can handle more support inbound)

**How to scale:**
- Increase daily budget by **20% maximum every 3 days**. Larger jumps trigger re-learning and break stable CPA.
- Duplicate winning ad sets into new geos before increasing spend on an existing ad set
- Launch a lookalike campaign seeded on your Purchase custom audience once ≥100 purchases exist

**When NOT to scale:**
- Meta's Ads Manager will show an "opportunity to scale" green bubble. Ignore it more than half the time. Meta's recommendations are calibrated for Meta's revenue, not yours.

---

## 6. Creative guidelines — what converts and what gets you banned

### What works for this audience

**Imagery:**
- Warm color palette (terracotta, sage, cream — matches your brand)
- Real photography, not stock
- Landscape (desert, southwest) or human close-ups (aged hands, family photos, maps)
- Avoid: corporate stock imagery, abstract 3D, anything that looks like a fintech ad
- Your new Facebook cover photo (desert dawn) is a strong creative base for ad variations

**Copy:**
- 20–50 word ad body copy performs best in testing for this audience (longer than you'd expect)
- Lead with a question or a specific fact, not a slogan
- Examples that work:
  - *"If your family lived in Utah, Nevada, Arizona, New Mexico, or Idaho during the 1950s and '60s, the federal government may owe you up to $100,000 in tax-free compensation. We help you prepare the claim."*
  - *"The 2027 RECA deadline is approaching. If your parent or grandparent lived through above-ground nuclear testing, you may be eligible to file on their behalf. Start with a free 2-minute eligibility check."*
  - *"We help downwinder families prepare their RECA claims with care. Plain-English guidance, pre-filled forms, and a Chrome extension that auto-fills the DOJ portal. Built by someone who lost a parent to cancer."*
- Avoid:
  - All caps
  - Exclamation marks more than once per paragraph
  - "Act now!" urgency
  - Any medical claims ("cancer caused by radiation" — even though it's true, Meta's medical review may flag it)
  - Any language that sounds like guaranteed returns or promises

**CTAs:**
- "Check my eligibility" (best performing for cold)
- "See if my family qualifies"
- "Start my free check"
- Avoid: "Buy now," "Enroll," "Subscribe" (wrong conversion framing for this product)

### What will get your ad rejected or your account restricted

Meta's automated review is aggressive about health-adjacent services. Your business sits in a gray zone — document prep for compensation related to cancer. You will have ads rejected. Here's how to minimize it:

**Avoid these phrases in ad copy:**
- "Cancer" (use "serious illness" or name the specific covered disease)
- "Radiation poisoning" (use "radiation exposure")
- "Sick from nuclear testing" (use "affected by nuclear testing")
- "Compensation you deserve" (feels entitled — use "compensation you may be eligible for")
- "Guaranteed," "risk-free," "100% success rate"
- Any dollar amount as a guaranteed payout (fine to say "up to $100,000" but not "get $100,000")

**Avoid these creative elements:**
- Images of medical facilities, IV bags, or patients in gowns
- Before/after imagery (triggers health-products rules)
- Personal attributes in ad targeting ("if you have cancer, click here" — Meta prohibits this framing)

**Always include in the ad or landing page:**
- Clear disclaimer that you're not a law firm (your Footer handles this automatically)
- Link to your Privacy Policy and Terms (now live at `/privacy` and `/terms`)

### A/B testing protocol

- Run 3 ad creatives per ad set for the first 7 days
- At day 7, kill the bottom performer (lowest click-through rate, lowest Lead rate)
- Replace with a new creative that has been changed on exactly one dimension (new image, OR new headline, OR new body copy — not all three)
- Repeat weekly
- **Never test on both copy and image at the same time.** You won't be able to attribute the difference.

---

## 7. The weekly review rhythm

Set aside a 45-minute block every Monday for this. Don't skip it.

### Monday morning review (45 min)

1. **Open Meta Events Manager** → check daily event volumes for the last 7 days
2. **Open Meta Ads Manager** → check CPA for each active campaign
3. **Compare this week vs last week:**
   - Leads up or down?
   - CPA up or down?
   - New-registration count up or down?
   - Purchase count up or down?
4. **Check for anomalies:**
   - Any ad with CTR below 0.5%? (pause it)
   - Any campaign with CPA more than 2x target? (pause and iterate)
   - Any ad rejected? (address in compliance rules)
5. **Decide 1–3 concrete changes for this week** (new creative, new audience, budget adjustment)
6. **Write the changes into a running log** — date, change, hypothesis, expected impact
7. **Plan the week's organic posts** (content pillars from `CONTENT_PILLARS.md`)

### Thursday midweek pulse (15 min)

- Quick glance at daily event volumes — any campaign underperforming by >30% of Monday's CPA?
- If yes, adjust. If no, keep going.

### Monthly deep review (90 min, first Monday of each month)

- Trailing 30 days rolling metrics
- Audience performance breakdown (which persona is cheaper, which converts better)
- Creative performance breakdown (which 5 creatives to keep running, which to replace)
- Budget reallocation decisions
- Lookalike audience refresh (rebuild lookalikes seeded on the latest 30 days of converters)

---

## 8. KPIs and the decision tree

### The metrics that matter (in order of priority)

1. **Cost per Lead (CPL)** — total ad spend ÷ Lead count. Target: <$4 in core states, <$6 nationwide.
2. **Lead → Registration rate** — Registrations ÷ Leads. Target: ≥25%. Below 15% means your post-eligibility UX is broken.
3. **Registration → Purchase rate** — Purchases ÷ Registrations. Target: ≥15%. Below 8% means service-tiers or Stripe checkout is broken.
4. **Cost per Purchase (CPA)** — total ad spend ÷ Purchase count. Target: <$200 at tier 1, <$150 at tier 2, <$120 at tier 3.
5. **Return on ad spend (ROAS)** — revenue ÷ ad spend. Target: ≥1.5x by month 2, ≥2x by month 3. Below 1x means you're losing money on every customer.
6. **ClaimFiled conversion rate** — ClaimFiled events ÷ Purchases. Target: ≥60%. Below 40% means paying customers aren't finishing the flow (post-payment UX problem).

### The decision tree

```
Is CPL under target?
├── YES → Are Purchases tracking?
│         ├── YES → Is ROAS ≥ 1.5x?
│         │        ├── YES → SCALE (20% every 3 days)
│         │        └── NO → Cut 30% of weakest creative, keep going
│         └── NO → Check Registration → Purchase rate
│                 ├── ≥ 15% → Normal lag; wait another week
│                 └── < 15% → Fix service-tiers UX or Stripe flow
└── NO → Is it creative or audience?
          ├── Creative (bottom 50% CTR) → Replace 2 ads
          └── Audience (spend depleting without leads) → Narrow targeting
```

### When to kill a campaign entirely

- 14 consecutive days with CPL > 2x target AND no improvement
- Ad account policy strike or restriction
- Total spend exceeds 2x the CPA budget without a single Purchase
- You realize you're out of creative ideas and need to stop, reflect, and research competitors

---

## 9. The daily DOJ status product

This is both a content pillar AND a product feature. You already have the scraper infrastructure (`src/lib/doj-scraper-*.ts`, `src/lib/doj-metrics-calculator.ts`) — what's missing is:

1. A **daily scheduled run** (cron) that scrapes fresh DOJ data every morning
2. A **public surface** showing today's numbers (already exists via `DOJMetricsDashboard` in the portal)
3. A **social content** pipeline that turns the daily data into a post

### Why this is a content pillar, not just an operational feature

Your audience — elderly downwinders and adult children filing posthumously — **want to know what's happening with the DOJ queue**. They're worried about running out of time before 2027. They're worried about being stuck in a backlog. A daily "here's today's queue" post is:

- **Evergreen content** — you can post it 365 days a year without running out of material
- **Habit-forming** — people come back daily to check the counter, building organic traffic and page follows
- **Authority-building** — it positions RadiantClaims as THE source for RECA program status
- **SEO-valuable** — "RECA queue status today" has zero competition in search right now
- **Ad creative fuel** — every weekly stat post can be boosted for $10 and drive top-of-funnel awareness cheaply

### How to build it (implementation plan)

**Phase 1 — Wire the daily cron (10 min, do this first):**

1. Create `src/app/api/cron/doj-scrape/route.ts` that calls the existing scraper
2. Add to `vercel.json` crons:
```json
{
  "path": "/api/cron/doj-scrape",
  "schedule": "0 13 * * *"
}
```
(13:00 UTC = 7am MT = morning US)
3. Deploy. The scraper runs daily, populates the database, `DOJMetricsDashboard` auto-refreshes.

**Phase 2 — The daily content pipeline (build after the cron works for 3 days):**

Use a scheduled agent task:

1. Run at 7:30am MT, right after the scraper finishes
2. Fetch today's DOJ metrics from `/api/doj/metrics`
3. Compare to yesterday and last week's averages
4. Generate a 3-sentence post + a small graphic summarizing today's numbers
5. Deposit the draft in a known location (e.g., `docs/drafts/daily/YYYY-MM-DD.md`)
6. You review and publish manually (first 30 days, for calibration)
7. After 30 days of good drafts, evaluate whether to auto-publish or keep human-in-the-loop

**Phase 3 — Aggregated comparison with your own data (advanced):**

Once you have ≥20 RadiantClaims users with filed claims, add a comparison to the daily post:

- "DOJ is processing 9.6 claims/day. RadiantClaims users file an average of 4.2 claims/week — and our packet-completeness rate is 98%, vs the DOJ's estimated 62% first-submission success rate across all filers."
- This is the bridge from "public data" to "you should use us."

**Example draft output:**

> **RECA Queue Status — Monday, April 14, 2026**
>
> The DOJ received 170 new RECA applications yesterday (↑12% vs last Monday).
> Processing rate: 9.6 claims/day (unchanged).
> Current estimated wait: **~23 months** from submission to decision.
> Queue size: **8,410 people** ahead of anyone filing today.
>
> Today, a family filing a claim will likely wait until **March 2028** for a decision — 3 months past the RECA program's scheduled sunset.
>
> RadiantClaims users complete their packet in an average of 6 days.
>
> *Source: U.S. Department of Justice, RECA Program. Data scraped daily at 7am MT.*

### Metrics to track for the daily DOJ product

- Organic post engagement (likes, shares, comments per post)
- Page follows driven by the post series
- Click-throughs from the post to the homepage
- Week-over-week page follower growth (target: +50/week once daily posts are live)

---

## 10. The "path to payout" tracker

### The gap

Right now, you don't have any data on **how long it takes users to actually receive their RECA award.** You know:
- When a user registered
- When they paid you
- When they marked the claim as filed to DOJ (if they hit the button in `DOJSubmissionCard`)
- **But nothing about when the DOJ paid them out.**

This is the single most valuable marketing asset you don't currently capture. Once you have 20+ data points, "Average time from filing to payout: X months" becomes your best social-proof lever in ads.

### What to build (for the next session, not tonight)

**Database — add to the schema** (new model or field on `ClaimLifecycle`):

```prisma
model ClaimOutcome {
  id              String   @id @default(cuid())
  claimantId      String   @unique
  claimant        Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  // User-reported (primary source)
  awardReceivedAt DateTime?
  awardAmount     Float?
  paidMethod      String?   // "check", "direct_deposit", "wire", "other"
  selfReportedAt  DateTime? // when user clicked "I got paid"

  // Admin-verified (if you later confirm via uploaded DOJ letter)
  verifiedAt      DateTime?
  verifiedBy      String?
  verificationDocumentId String? // link to uploaded DOJ award letter

  // Outcome details
  outcome         String    // "awarded", "denied", "withdrawn", "pending"
  denialReason    String?   @db.Text
  appealed        Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([awardReceivedAt])
  @@index([outcome])
}
```

**UI — add to the portal:**

1. Add a new section to `ClaimSummaryCard` (collapsed by default, appears only for `status === "SUBMITTED"`):
   - Title: "I heard back from the DOJ"
   - Three options:
     - "I was awarded" → opens a modal to enter amount + date + payment method
     - "I was denied" → opens a modal for denial reason and appeal status
     - "Still waiting" → just records a check-in timestamp
2. When the user reports an outcome, fire a `trackCustom("ClaimOutcome", { outcome, amount_range })` Meta Pixel event
3. Add a "Thank you for sharing" confirmation + (with consent) a testimonial invite

**Aggregate metric page (eventually):**

Build `/about/our-numbers` or surface this on the homepage once you have ≥20 outcomes:

- Median days from `ClaimFiled` to `awardReceivedAt`
- Award rate (awarded / total outcomes)
- Average award amount (if meaningful and compliant to share)
- Survivor-vs-self breakdown
- Compare to DOJ's published stats for credibility

### Compliance note

Do **not** publish aggregate numbers in advertising until you have a statistically meaningful sample (≥50 outcomes) AND you've had the copy reviewed by an attorney. "78% of our users got paid" is a verifiable fact at 100 users; at 5 users it's a misrepresentation that will get your ad account restricted.

---

## 11. Compliance guardrails — the rules that will save your business

Read this section twice. Violations of any of these will, in order of likelihood, get: (1) your ad account restricted, (2) your Facebook Page suspended, (3) regulatory inquiries from state attorneys general or the FTC, (4) your business shut down.

### Hard rules — never violate these

1. **You are not a law firm.** Never imply attorney-client relationship. Never use "attorney" to describe yourself. Your Footer now carries this disclaimer site-wide.
2. **No guaranteed outcomes.** Never say "we'll get you paid," "guaranteed compensation," or "100% success." Say "may be eligible" or "helps you prepare."
3. **No medical claims.** Never say "cancer caused by radiation" in marketing. Say "covered diseases under RECA" or "illnesses associated with exposure."
4. **No investment/financial advice.** This is separate from RECA but bears mentioning: if you ever spin up the financial advisor referral we discussed, keep it off the Radiant Claims Facebook page entirely. Put it behind a separate entity.
5. **No targeting by health status.** Meta prohibits ads that target people based on medical conditions. You can target by geography and age, never by "has cancer."
6. **No deceptive urgency.** "Act in the next 24 hours!" when there's nothing special about the next 24 hours is ad fraud.
7. **No fake testimonials.** You need written permission from any claimant quoted or photographed in marketing.

### Soft rules — best practices

1. Keep the word "free" out of paid ad headlines — triggers Meta's scam filter. Use "no cost" or "included."
2. Avoid URL shorteners in ad copy — increases spam risk.
3. Don't link directly to checkout from an ad — always go through `/eligibility-check` or homepage. Direct-to-checkout violates Meta's landing-page policies for services.
4. Disclose the Stripe handoff in your payment flow (your Terms of Service section 4 covers this).

### The quarterly legal review

Every 90 days, hand this list to your attorney for a 30-minute review:

1. Current Privacy Policy (has it changed?)
2. Current Terms of Service (has it changed?)
3. Sample ad copy (3–5 live ads)
4. Any claims made about average outcomes or success rates
5. Any new marketing channels or referral relationships

Budget $400–600/quarter for this. It's the cheapest insurance you'll ever buy.

---

## 12. Anti-patterns — mistakes first-time advertisers make

Things to not do, ordered by how much damage each one causes:

1. **Scaling a winning campaign too fast.** You 3x your daily budget on a campaign that was working at $30/day. Now it's at $90/day and CPL doubled. Meta's algorithm had to re-enter learning phase. **Rule: increase 20% every 3 days, maximum.**
2. **Optimizing for the wrong event too early.** You have 12 Purchases in the last 30 days and set optimization to "Purchase." Meta can't learn. CPA triples. **Rule: never optimize for an event below 50/week.**
3. **Changing multiple things at once.** You rewrote the ad copy, swapped the image, and widened the audience — all on the same day. Now you don't know which change caused the drop. **Rule: one variable at a time.**
4. **Ignoring retargeting.** You only run cold acquisition and complain that people "never come back." They need 2–5 touchpoints. Retargeting is mandatory, not optional.
5. **Trusting Meta's recommendations uncritically.** Meta's Ads Manager will recommend you spend more, combine ad sets, accept their automatic creative optimization, etc. Some of these are good. Most are calibrated for Meta's revenue. **Rule: every recommendation is a hypothesis to test, not a command.**
6. **Not reading the ad policy emails.** Meta emails you when a campaign is flagged or an ad is rejected. Most people archive these unread. The rejected ad disappears silently, and you lose the Lead volume it was generating. **Rule: check your ad email inbox every morning.**
7. **Letting a winner run unchanged for months.** The best ad creative lasts 4–8 weeks before audience fatigue sets in. CTR drops, CPL rises, and people blame Meta. **Rule: rotate creative monthly.**
8. **Chasing vanity metrics.** Impressions, reach, and CPM are not conversion metrics. The only thing that matters is cost per Lead → cost per Purchase → cost per ClaimFiled. Everything else is noise.
9. **Running ads on autopilot while on vacation.** Things break. Ad accounts get restricted. You need to check in at least every 48 hours. If you can't, pause the campaigns.
10. **Not saving your learnings.** You make 50 creative iterations and don't write down what worked. Three months later you can't remember which headline drove the ROAS spike. **Rule: maintain a learning log. A shared Google Doc is fine.**

---

## 13. Emergency protocols

Things will go wrong. Here's what to do.

### Ad account restricted

**Symptom:** You get an email from Meta saying "We've restricted your ad account."
**Cause:** Usually either a policy violation (check the email for specifics) or a billing issue.
**Response:**
1. Read the email carefully. It will cite the exact policy.
2. If billing: update your payment method in Business Settings → Billing.
3. If policy: follow the appeal link in the email within 24 hours. Don't wait.
4. While restricted: do not try to create a new ad account to bypass. Meta detects and permanently bans.
5. If you can't resolve in 48 hours: post in Meta's business community forum, and file a dispute at facebook.com/business/help.

### Facebook Page suspended

**Symptom:** The Page appears unavailable or you can't post.
**Cause:** Usually a report from a user, a trademark issue, or a policy violation.
**Response:**
1. Log into Business Suite → check notifications for a reason
2. Appeal immediately via the "Request Review" link
3. Suspensions are usually resolved in 3–14 days; no need to panic on day 1
4. While suspended: no ads can run (they depend on the Page). Pause all campaigns.

### Pixel stops firing

**Symptom:** Events stop appearing in Meta Events Manager's Overview tab.
**Response:**
1. Open a private browser window → visit `radiantclaims.com` → check Meta Pixel Helper
2. If Pixel Helper shows "no pixel detected": the `NEXT_PUBLIC_META_PIXEL_ID` env var is missing or the script tag isn't rendering. Check Vercel env vars, then redeploy.
3. If Pixel Helper shows the pixel but no events fire on navigation: check the browser console for JavaScript errors (this is how we caught the newline-in-env-var bug today).
4. If the pixel works locally but not in production: re-pull the Vercel env var and inspect the raw bytes for extra characters (`vercel env pull /tmp/check.txt --environment=production` then `od -c /tmp/check.txt | grep META`).

### A negative news article about RECA or downwinders goes viral

**Symptom:** Suddenly everyone on your ads is asking questions you don't have answers to.
**Response:**
1. Don't try to address it in live ad creative. Pause the affected campaigns for 24–48 hours.
2. Post a measured organic response on the Facebook Page. Fact-based, empathetic.
3. Update your FAQ or `/resources` page with the new information.
4. Resume ads only after you've had time to assess whether your creative strategy still fits the new context.

### You lose access to your Meta Business account

**Symptom:** You can't log in, password reset fails, or Meta says the account doesn't exist.
**Response:**
1. Do not panic. This is usually a 2FA issue or a security block.
2. Go to facebook.com/help/contact/260749603972907 and submit an account recovery request
3. Provide: your government ID, a photo of yourself holding the ID, and any recent ad receipt
4. Recovery usually takes 3–7 business days
5. **This is exactly why we recommended Path B** (separate Business Account for RadiantClaims). If your personal Facebook account is locked, your business assets are still recoverable via the Business Account portal.

---

## 14. Glossary

- **CPL** — Cost per Lead. Ad spend divided by Lead events.
- **CPA** — Cost per Acquisition. Ad spend divided by Purchase events (or whatever your target conversion is).
- **ROAS** — Return on Ad Spend. Revenue from ads divided by ad spend. 2x = for every $1 spent, $2 back.
- **CPM** — Cost per Mille (thousand impressions). How much it costs to show your ad to 1,000 people.
- **CTR** — Click-through rate. Clicks divided by impressions.
- **Cold audience** — People who have never interacted with your brand before.
- **Warm audience** — People who have engaged with your Page, visited your site, or fired a pixel event.
- **Retargeting** — Ads shown specifically to a warm audience.
- **Custom Audience** — A user list defined by pixel events, customer lists, or Page engagement.
- **Lookalike Audience** — Meta-generated list of users who "look like" a seed Custom Audience.
- **Ad set** — One targeting + optimization + budget configuration under a campaign.
- **Learning phase** — Meta's algorithm period (usually 5–7 days or 50 events) where it's still figuring out who to show the ad to. CPA is unstable during this period.
- **Exclude list** — Audiences you specifically don't want to show ads to (e.g., existing customers, people who already registered).

---

## Closing: the one paragraph that matters

If you remember nothing else from this playbook:

> **Start small ($500/month), run cold acquisition optimized for `Lead`, pair it with retargeting, rotate creative weekly, review metrics Mondays, and don't scale until you have a stable, sub-target CPL for 14 consecutive days. Your first goal is not profit — it's learning. Buy data for 30 days, then decide whether to scale. If CPL is terrible at $500/month, it will be worse at $5,000/month. Fix creative and audience before budget. Always, always, always rotate creative before you blame Meta.**

Good luck. Check in on `CONTENT_PILLARS.md` for what to actually post, and `SESSION_BOOTSTRAP.md` for how to pick up this work in a new Claude Code session.

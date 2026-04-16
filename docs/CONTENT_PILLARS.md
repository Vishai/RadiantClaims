# RadiantClaims Content Pillars

What to post, how often, and templates you can reuse. This is the daily companion to `CAMPAIGN_PLAYBOOK.md`.

**Core rule:** Every post should serve **at least one** of the four pillars below. If you can't name which pillar a post belongs to, don't publish it.

---

## The four pillars

| # | Pillar | Purpose | Example topics | Ideal cadence |
|---|---|---|---|---|
| 1 | **Daily DOJ Status** | Build a habit; establish authority on program data | Today's queue, new applications, estimated wait time | Daily |
| 2 | **Stories** | Humanize the audience; build emotional connection | Founder story, claimant testimonials, community history, archival news | 2–3 per week |
| 3 | **Education** | Answer questions people are Googling; drive SEO | Eligibility explainers, document checklists, process walkthroughs, deadline countdowns | 2–3 per week |
| 4 | **Community** | Drive engagement and reply-style comments | Questions to followers, state-specific call-outs, holiday tie-ins (Memorial Day, Veterans Day), local resource spotlights | 1–2 per week |

Weekly target: **7–11 posts** (1 daily DOJ status + 5–8 from the other three pillars).

---

## Pillar 1 — Daily DOJ Status

### Why this is the most important post of the day

- It's evergreen (you can post it 365 days a year)
- It builds a daily-check-in habit with your audience
- It positions you as THE source for RECA program data
- It gives Meta's algorithm a consistent post to boost cheaply

### The template

Every daily post follows the same structure so your audience trains on the format:

```
📊 RECA Queue Status — [Day], [Date]

Yesterday the DOJ received [N] new RECA applications.
Processed: [M] claims.
Net queue change: [↑/↓ diff]

Current estimated wait: ~[X] months from submission to decision.
Queue size: [Y] people ahead of anyone filing today.

[One-sentence context or insight]

Source: U.S. Department of Justice, RECA Program.
Scraped daily by RadiantClaims at 7am MT.

#RECA #Downwinders #NuclearJustice
```

### Examples by day of week

**Monday — Weekly reset post:**
> 📊 RECA Queue Status — Monday, April 14, 2026
>
> Last week: **847 new applications** (vs 785 the previous week). Processing stayed flat at 48 claims/week.
>
> Net: the queue grew by **799 people** last week. At current pace, a family filing today will wait **~23 months** for a decision.
>
> The RECA program sunsets December 2027. If you're thinking about filing, the clock is not on your side.
>
> Source: DOJ RECA Program. Data scraped daily at 7am MT.

**Wednesday — midweek insight:**
> 📊 RECA Queue Status — Wednesday, April 16, 2026
>
> 170 new applications yesterday. 10 processed.
>
> The gap between "received" and "processed" is the entire story of this program. The DOJ staffs for ~10 decisions/day. Applications come in at ~17x that rate.
>
> **What this means:** if you're waiting to file because you think you have time, the backlog itself is eating your time.
>
> Estimated wait today: ~23 months. A year ago: ~15 months.

**Friday — weekly summary:**
> 📊 RECA Queue Status — Friday, April 18, 2026
>
> **This week's numbers:**
> - New applications: 847 (↑ 7.9% vs last week)
> - Processed: 48 (↔ flat)
> - Queue size: 8,410 people ahead of today's filer
> - Estimated wait: ~23 months
>
> Have a good weekend. We'll be back Monday with fresh numbers.

### Rules for this pillar

- **Never skip a day.** Habit is the whole product.
- **Never editorialize negatively about the DOJ.** Stay factual. "The program is underfunded" ≠ "the DOJ is incompetent."
- **Always link back to your homepage** in a comment, not the post body (Facebook penalizes outbound links in post bodies).
- **Always cite the source** with the exact words "U.S. Department of Justice, RECA Program."
- **Use the same emoji (📊) every day** so followers recognize the post at a glance in their feed.

### Operational plan (to build — see CAMPAIGN_PLAYBOOK.md §9)

1. Daily cron scrapes DOJ data at 6:30am MT
2. Scheduled agent task at 6:45am MT generates a post draft from fresh numbers
3. Draft lands in `docs/drafts/daily/YYYY-MM-DD.md`
4. You review + publish manually (first 30 days)
5. After 30 days of stable drafts, decide whether to auto-publish

---

## Pillar 2 — Stories

These are the posts that make people cry in a good way. They build emotional connection and earn shares.

### Sub-types

**A. Founder story (post 1–2 times per quarter — don't overdo it)**
Your personal reason for building RadiantClaims.

Template:
> I started RadiantClaims after losing my mother to cancer in 2019.
>
> She was one of thousands of downwinders whose lives were shaped by decades of nuclear testing in the Southwest. My father has two eligible RECA claims of his own, and watching him try to navigate the DOJ paperwork was what convinced me there had to be a better way for families like ours.
>
> The RECA deadline is December 2027. If your family lived through the testing years — in Utah, Nevada, Arizona, New Mexico, Idaho, or elsewhere — we'd be honored to help you prepare.
>
> [Photo: your mother, or a warm family-focused image]
>
> 🔗 Check your eligibility in 2 minutes: [link in comments]

**B. Claimant testimonials (once you have them — aim for 1/week)**
First-person quotes from real users, with their permission.

Template:
> "My dad worked outside most summers in St. George in the 1950s. I always knew he'd gotten sick later in life but I never connected it to the testing until my daughter found out about RECA. RadiantClaims walked us through the paperwork in a week — I thought it would take months." — Nancy R., Toquerville, UT
>
> [Photo: the claimant, or a landscape from their region, with permission]

**Rules for testimonials:**
- Written permission in writing before publishing (a signed release form — your attorney can provide a template for $200)
- Never modify the quote beyond light editing for grammar
- Never pair a quote with someone else's photo
- Always name the city/state (more credible than just initials)
- Never use a testimonial in a paid ad without an additional ad-creative permission

**C. Archival / historical stories (1/week)**
Stories about downwinder history, specific testing events, legal fights, and the people who made RECA happen.

Examples:
- The 1957 "Plumbbob" test series and its Utah downwinder impact
- The original 1990 RECA legislation and the senators who pushed it
- The 2022 RECA extension and what it changed
- The Diné Bikéyah (Navajo Nation) uranium worker community
- Stewart Udall's role in RECA advocacy

Template:
> On this day in [year], [event happened]. [2–3 sentences of historical context].
>
> Today, families affected by this history can file for up to $100,000 in tax-free compensation under the RECA program. The deadline is December 2027.
>
> [Historical photo, if public domain]

**Rules:**
- Use public-domain or Creative Commons imagery only (Wikimedia Commons is your friend)
- Cite sources — a one-line "Source: [publication]" at the bottom is enough
- Don't invent facts. If you're not sure, don't post it.

**D. Community voices (1 per week — these come from followers)**
Reshare questions, stories, or comments that people post in community groups.

Rules:
- Get permission before re-sharing anything from a private group
- Always credit the original source
- Never reshare something critical of another RECA service provider (stay in your own lane)

### Story post creative — imagery guidance

- Real photos > stock photos, always
- Landscape over close-up (aged hands and vintage family photos work, but pace them)
- Warm golden-hour light preferred
- Your Facebook cover photo palette (terracotta, sage, cream) is the visual baseline

---

## Pillar 3 — Education

Every Google search that ends in `site:radiantclaims.com` starts with an educational post. This pillar drives long-term SEO and answers the questions real claimants have.

### Sub-types

**A. Eligibility explainers (1/week)**
Each post answers ONE eligibility question in plain English.

Topics (one per week for months of material):
- "Who counts as a downwinder?" (residency maps, date ranges, counties)
- "What if my loved one died before I could file?" (surviving family eligibility)
- "What diseases are covered?" (the 22+ compensable diagnoses)
- "What if our family moved in and out of the affected area?" (residency duration rules)
- "Does VA benefits affect my RECA eligibility?" (no — they're independent)
- "Does being on Medicare affect this?" (also no)
- "What if I'm a surviving grandchild?" (yes, you can file)
- "What about uranium workers specifically?" (different eligibility tracks)
- "Does living on tribal land change anything?" (slightly — there are specific provisions)

Template:
> **Q: [Question]**
>
> [2–4 sentence plain-English answer]
>
> **The rule:** [the actual DOJ criteria, verbatim or cited]
>
> **Real example:** [1–2 sentence scenario]
>
> If you're not sure whether this applies to your family, our free 2-minute eligibility check will walk you through it: [link in comments]
>
> #RECA #Downwinders #Eligibility

**B. Document checklists (1/week)**
Each post explains ONE document the DOJ requires and how to get it.

Topics:
- "How to request a certified death certificate in Utah"
- "What the DOJ wants in a proof-of-residence document"
- "How to request medical records from a hospital that closed"
- "How to get a marriage certificate from New Mexico"
- "What counts as 'physical presence' proof — and what doesn't"
- "Pathology reports: why the DOJ wants originals, not copies"

Template:
> **Document you'll need: [Document name]**
>
> **What the DOJ requires:** [plain-English explanation]
>
> **Where to get it:** [specific agency or process]
>
> **How long it takes:** [typical turnaround]
>
> **Cost:** [typical fee]
>
> **Pro tip:** [one non-obvious thing, e.g., "request 3 certified copies — one for your file, one for the DOJ, one backup"]
>
> We include pre-filled request letters for most of these documents in our guided prep flow. [link in comments]

**C. Process walkthroughs (1/week)**
Each post walks through ONE step of the process.

Topics:
- "Step 1: The 5 things you need before you start a RECA application"
- "Step 2: What to expect from the DOJ after you submit"
- "Step 3: Dealing with a DOJ request for more information"
- "Step 4: What a DOJ decision letter looks like"
- "Step 5: What happens after you're approved"
- "Step 6: How payouts actually work (check vs direct deposit)"

**D. Deadline and urgency (1 per month — use sparingly)**
Reminder that the 2027 deadline is coming, phrased without pressure tactics.

Template:
> **The RECA program sunsets December 2027.**
>
> That sounds far away. It's not. Here's the math:
>
> - Current DOJ wait time: ~23 months
> - If you file today, a decision lands ~March 2028 — **3 months past the program's scheduled end**
> - For claims to be paid, they need to be *submitted* well before December 2027, not just *decided* by then
>
> If you've been thinking about filing, starting the document prep now is probably the right call.
>
> Our 2-minute check will tell you whether it's even worth your time: [link in comments]

---

## Pillar 4 — Community

These posts drive comments and replies — the interaction signal that Facebook's algorithm rewards.

### Sub-types

**A. State-specific call-outs (1–2 per week)**
Call out a specific state or county, invite people to say where they're from.

Template:
> Grew up in **Washington County, Utah**? So did most of the original "downwinder" community.
>
> If your family lived there — or in Iron, Kane, or Piute counties — during the 1950s and '60s, RECA may cover more illnesses than you'd think.
>
> Comment below: which county is your family from?

**B. Questions for the community (1 per week)**
Simple, low-friction questions that invite comments.

Examples:
- "What's the one thing you wish someone had told you about the DOJ process?"
- "Did someone in your family ever talk about the tests? What do you remember them saying?"
- "If you've been through the RECA process, what did you find hardest?"
- "What question about RECA has been bugging you that you can't find an answer to?"

**C. Holiday tie-ins (on the day only)**
Natural, non-commercial tie-ins to relevant holidays.

- **Memorial Day** — honor downwinders who passed
- **Veterans Day** — overlap with atomic veterans and uranium workers
- **Mother's Day / Father's Day** — gentle acknowledgment of family claims
- **Independence Day** — tie to the federal program
- **Native American Heritage Month (November)** — Diné Bikéyah downwinder history

Template:
> On Memorial Day, we remember the downwinders we've lost.
>
> The families we serve are almost always filing for someone who didn't live to see RECA expand. We carry their stories with the paperwork.
>
> If your family lost someone to a RECA-covered illness, know that you can still file on their behalf. Our free eligibility check is here when you're ready.
>
> [Photo: a landscape, a flag, or a respectful family image]

**D. Local resource spotlights (1 per week)**
Highlight local organizations, legal aid clinics, or advocacy groups you respect.

Rules:
- Only recommend orgs you've actually vetted
- Never attack or compare yourself to another RECA service provider in these posts
- Link to their page or website in the comments
- Their benefit: free visibility. Your benefit: relationship, goodwill, potential cross-referrals.

---

## Weekly posting calendar (sample week)

| Day | Post type | Pillar | Example |
|---|---|---|---|
| Monday | Weekly DOJ status recap | 1 | "Last week's queue grew by 799 people…" |
| Monday | Education — eligibility | 3 | "Q: Who counts as a surviving grandchild?" |
| Tuesday | Daily DOJ status | 1 | "Yesterday 170 applications came in…" |
| Tuesday | Story — archival | 2 | "On this day in 1957, the Plumbbob tests…" |
| Wednesday | Daily DOJ status | 1 | "Yesterday 155 applications came in…" |
| Wednesday | Community — question | 4 | "What's the one thing you wish…" |
| Thursday | Daily DOJ status | 1 | "Yesterday 168 applications came in…" |
| Thursday | Education — document checklist | 3 | "How to request a Utah death certificate" |
| Friday | Daily DOJ status + weekly summary | 1 | "This week: 847 new applications…" |
| Friday | Story — testimonial | 2 | Claimant quote |
| Saturday | (light day) Community post | 4 | State call-out |
| Sunday | (light day) Story — archival | 2 | Historical context post |

**Total: ~11 posts/week** (5 daily DOJ + 6 other pillars)

---

## Creative production kit

### Image sources (all royalty-free or yours)

- **Your own photography:** southwest landscapes, desert skies, red rock, sage brush. If you don't have these, do a single photo trip and bank 50 shots.
- **Wikimedia Commons** — for historical/archival content (atomic tests, senators signing RECA, etc.). Always check the license — use only CC0 or CC-BY.
- **Unsplash** — for generic warm stock imagery (hands, families, letters). Use sparingly — users can tell it's stock.
- **AI-generated** (Replicate, etc.) — for post headers when you need a specific mood. Disclose in the caption if the image is notably AI-generated. Do not use AI-generated imagery for testimonials, claimant photos, or historical events.

### Text overlay tools

- **Canva** — free tier is enough for most social posts
- **Figma** — if you want more control
- **The text-forward brand card template** we generated today (`public/brand/facebook/cover-v1-text-forward.png`) can be a base for repurposing to Instagram 1:1, Story 9:16, etc.

### Posting tools

- **Meta Business Suite** — free, handles Facebook and Instagram scheduling in one place. Use this.
- Avoid third-party schedulers (Buffer, Later, Hootsuite) until you have a real team. They add cost and complexity you don't need yet.

---

## Cadence rules

1. **Never miss a daily DOJ post.** Habit is everything.
2. **Never post 3 times in one hour.** Spread posts across the day — 7am, 12pm, 6pm is a good default.
3. **Minimum gap between story posts: 18 hours.** Your audience will tune out if you spam grief.
4. **Maximum posts per day: 3.** More than that is noise.
5. **Minimum posts per week: 5.** Less than that and the algorithm deprioritizes your page.
6. **Schedule posts the weekend before.** Don't post ad-hoc — batch-schedule on Sundays.

---

## What NOT to post

1. Anything promising a specific payout amount ("get $100,000 now!")
2. Anything medical ("cancer is caused by radiation")
3. Personal attacks on the DOJ or other service providers
4. Anything partisan (no political endorsements, no policy rants)
5. Anything financial ("invest your award," "we have a financial advisor who…")
6. Unverified testimonials or fake reviews
7. Reshares of news articles from untrusted sources (stick to AP, Reuters, established regional papers)
8. Memes — even respectful ones. Your audience is older and memes read as unprofessional to them.
9. Comments on breaking news without letting the story stabilize for 24 hours first
10. Anything you wouldn't be comfortable reading in front of your mother

---

## Metrics that matter for organic content

- **Page follows** — target +50/week once daily DOJ posts are running consistently
- **Post reach** — how many people saw each post (target: 500+ for daily DOJ posts after 30 days)
- **Post engagement rate** — likes + comments + shares divided by reach (target: ≥3%)
- **Click-throughs to the homepage** — measure via UTM parameters on links posted in comments
- **Comments** — leading indicator of community health. Low comments means the algorithm isn't prioritizing you.

### What to do when a post underperforms

- **Low reach + high engagement:** algorithm is starving the post. Boost it with $5–10. This usually unsticks it.
- **High reach + low engagement:** the topic didn't land. Rewrite or retire the template.
- **Low reach + low engagement:** the post was confusing, off-brand, or shown to the wrong audience. Iterate.

---

## Closing rule

> **Post every day. Pillar-tag every post. Rotate creative weekly. Show up in comments. Don't chase virality — chase trust.**

This is a 6–18 month build. The daily DOJ status post is the drumbeat that makes it compound.

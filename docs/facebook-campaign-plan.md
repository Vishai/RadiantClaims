# RadiantClaims Facebook Campaign Plan

## Budget: $2,000 total until revenue | Target: Utah, Nevada, Arizona

---

## STEP 1: Set Up Facebook Business Page (Do This First)

### Create the Page
1. Go to facebook.com/pages/create
2. Choose "Business or Brand"
3. Page name: **RadiantClaims - RECA Claim Assistance**
4. Category: **Legal Service** (also add: Government Service, Consulting Agency)
5. Bio: "Helping downwinder families prepare their $100,000 RECA compensation claims. Document prep + filing assistance. Not a law firm."

### Page Setup Checklist
- [ ] Profile picture: RadiantClaims heart logo (the terracotta circle)
- [ ] Cover photo: Something warm + western landscape (Utah red rocks, Nevada desert, family photo vibe). Add text overlay: "Are You Owed $100,000? Check for Free."
- [ ] Add website URL: https://www.radiantclaims.com
- [ ] Add phone: Your support number
- [ ] Set CTA button: "Learn More" → https://www.radiantclaims.com/eligibility-check
- [ ] About section: Full explanation of RECA, what RadiantClaims does, the Heritage Law partnership
- [ ] Enable messaging (people WILL message you with questions)
- [ ] Create a Meta Business Suite account (business.facebook.com) — needed for ads

### Set Up Meta Pixel
1. In Meta Business Suite → Events Manager → Create Pixel
2. Name it "RadiantClaims Pixel"
3. Add it to your site — create `src/app/layout.tsx` script tag or use next/script
4. Set up these events to track:
   - **PageView** (automatic)
   - **Lead** (fire on eligibility check completion)
   - **InitiateCheckout** (fire on service tier selection)
   - **Purchase** (fire on Stripe payment completion)

This pixel is CRITICAL — it lets Facebook find more people like the ones who convert.

---

## STEP 2: Organic Strategy (Free — Start Immediately)

### Your Audience
- **Primary**: People aged 55-80+ in affected counties of UT, NV, AZ
- **Secondary**: Their adult children (40-60) who help parents navigate government programs
- **Tertiary**: Community leaders, church members, tribal council contacts

### Facebook Groups to Join & Post In
Search for and join these types of groups (DO NOT spam — provide value first):

**Utah:**
- St. George community groups
- Washington County residents
- Cedar City / Iron County groups
- Southern Utah community pages
- LDS ward/stake community groups (many downwinders are LDS)
- "Utah Downwinders" if one exists

**Nevada:**
- Nye County community groups
- Lincoln County / Caliente area groups
- White Pine County groups
- Rural Nevada community pages

**Arizona:**
- Coconino County / Flagstaff area groups
- Navajo Nation community groups
- Yavapai County groups
- Northern Arizona community pages

**Cross-state:**
- RECA-specific groups (search "RECA compensation", "radiation exposure")
- Cancer survivor groups (approach VERY sensitively)
- Veterans groups (some overlap with onsite participants)

### How to Post in Groups (NOT sales posts)

**Week 1-2: Value-first posts (build credibility)**

Post #1 — Informational:
> "PSA for families in [county]: Did you know the RECA program was expanded in 2025? If you or a family member lived in [affected area] between 1951-1962 and was diagnosed with cancer, you may be eligible for $100,000 in federal compensation. Filing deadline is December 31, 2027. The DOJ has a free hotline at 1-800-729-7327. Happy to answer questions if anyone needs help understanding the requirements."

Post #2 — Urgency/data:
> "The DOJ is currently receiving about 160 new RECA applications per day but only processing about 15. That means the queue is growing fast — there are nearly 8,000 claims waiting right now. If you or someone you know might qualify, filing sooner means getting in line sooner. The program has a 100% approval rate for properly documented downwinder claims."

Post #3 — Personal/emotional:
> "My [family connection / reason for building this] is why I created RadiantClaims. So many families in [state] don't know they're owed compensation from the federal government for nuclear testing fallout. I built a tool that walks you through the RECA form step-by-step — like TurboTax but for your $100,000 claim. Free eligibility check at radiantclaims.com."

**Week 3+: Mix of value + soft promotion**

Rotate between:
1. **Educational** — "What documents do you need for a RECA claim? Here's the checklist..."
2. **Urgency** — Weekly queue update from your DOJ data ("This week: 8,200 claims in queue, up from 7,900 last week")
3. **Testimonial/story** — Once your beta tester can vouch, share their experience
4. **Direct CTA** — "We're in beta — 50% off for the first families who try it. Check eligibility free: [link]"

### Your Own Page Posts (2-3x per week)

These show up in followers' feeds and build your page authority:

1. **DOJ Queue Update (weekly)** — Use your real metrics data:
   "RECA Queue Update: [date]. [X] claims pending. [Y] new applications this week. Estimated wait: [Z] months. File sooner = get in line sooner."

2. **"Did You Know" posts** — One fact per post:
   - "Did you know? RECA awards are 100% tax-free under federal law."
   - "Did you know? You can file a RECA claim for a deceased family member."
   - "Did you know? The DOJ now accepts electronic filing — no need to mail certified copies."
   - "Did you know? The attorney fee for RECA is capped at 2% by federal law."

3. **Filing tips** — Position yourself as the expert:
   - "3 documents every downwinder claimant needs"
   - "The #1 mistake people make on their RECA form"
   - "What 'proof of presence' actually means (and where to find it)"

4. **Behind the scenes** — People connect with builders:
   - "Why I built RadiantClaims"
   - "Just shipped [feature] — here's why it matters for claimants"

---

## STEP 3: Paid Ad Strategy ($2,000 Budget)

### Budget Allocation
- **Phase 1 (Week 1-2): $400** — Test 4 ad variations, find what works
- **Phase 2 (Week 3-4): $600** — Scale the winning ads
- **Phase 3 (Month 2): $1,000** — Broader reach + retargeting

### Campaign Structure

**Campaign 1: "Eligibility Check" (Top of Funnel)**
- Objective: **Conversions** (optimize for Lead event = eligibility check completion)
- Budget: $15-20/day
- This is your main campaign — drive people to the free eligibility check

**Campaign 2: "Retargeting" (Bottom of Funnel)**
- Objective: **Conversions** (optimize for Purchase event)
- Budget: $5-10/day
- Only shows to people who completed eligibility check but didn't pay
- Start this in Week 3 after you have enough pixel data

### Targeting

**Ad Set 1: Geographic + Age**
- Locations: Utah (Washington, Iron, Kane, Garfield, San Juan, Wayne, Piute, Beaver, Sevier, Millard counties), Nevada (Nye, Lincoln, White Pine, Eureka, Lander, Clark), Arizona (Coconino, Yavapai, Navajo, Apache, Gila, Mohave)
- Age: 55-65+ (the claimants themselves)
- Gender: All
- Detailed targeting: Leave open — let Facebook's algorithm find people

**Ad Set 2: Adult Children**
- Same locations
- Age: 35-55
- Interests: "Eldercare", "Family caregiving", "Cancer awareness"
- This targets the adult children who help their parents navigate this stuff

**Ad Set 3: Broad (Week 3+)**
- Same locations
- Age: 30-65+
- No interest targeting — let the pixel data find the audience (Advantage+ audience)

### Ad Creative — 4 Variations to Test

**Ad 1: "The Question" (Direct)**
> 🔔 Were you or a family member in southern Utah, Nevada, or Arizona between 1951-1962?
>
> The federal government owes you $100,000.
>
> RECA (Radiation Exposure Compensation Act) provides tax-free compensation to families affected by nuclear testing. The approval rate is 100% for properly documented claims.
>
> But the filing deadline is December 31, 2027 — and the queue is already 8,000 people long.
>
> Check if you qualify in 2 minutes (free):
> 👉 radiantclaims.com/eligibility-check

**Ad 2: "The Race" (Urgency)**
> ⚠️ 160 new RECA claims are filed every day.
> Only 15 are processed.
>
> The queue is now 8,000+ families long. Every day you wait, more people get in line ahead of you.
>
> If you lived in an affected area and were diagnosed with cancer, you may be owed $100,000 from the federal government.
>
> Free 2-minute eligibility check:
> 👉 radiantclaims.com/eligibility-check
>
> No credit card. No commitment. Just answers.

**Ad 3: "The Helper" (For Adult Children)**
> Does your parent or grandparent live in [Utah/Nevada/Arizona]?
>
> If they lived there between 1951-1962 and have been diagnosed with cancer, they may be owed $100,000 in federal compensation through RECA.
>
> We built RadiantClaims to make filing easy — it's like TurboTax for compensation claims. Step-by-step guidance, document tracking, and e-filing assistance.
>
> Check their eligibility in 2 minutes:
> 👉 radiantclaims.com/eligibility-check
>
> Help your family get what they're owed.

**Ad 4: "The Deadline" (Scarcity)**
> RECA filing deadline: December 31, 2027.
>
> After that, the $100,000 compensation program may close permanently.
>
> If you lived in southern Utah, parts of Nevada, or northern Arizona during nuclear testing (1951-1962), and you've been diagnosed with cancer — you likely qualify.
>
> Don't let paperwork stop you from getting what you're owed.
>
> Free eligibility check (2 minutes):
> 👉 radiantclaims.com/eligibility-check

### Ad Format
- **Image ads** to start (cheaper, faster to test)
- Use a warm, personal image — NOT stock photos of lawyers/offices
- Best options: Desert landscape with family silhouette, vintage Utah/Nevada photo, simple text-on-background with the $100,000 number prominent
- Create in Canva (free) at 1080x1080px (square) for feed placement

### Landing Page
All ads should link to: **radiantclaims.com/eligibility-check**
NOT the homepage. You want them in the eligibility funnel immediately.

---

## STEP 4: Tracking & Optimization

### Key Metrics to Watch
- **Cost per Lead (CPL)**: How much to get someone through eligibility check. Target: $5-15
- **Cost per Acquisition (CPA)**: How much to get a paying customer. Target: $50-100 (at $250 price point, that's 2.5-5x return)
- **Click-through rate (CTR)**: Healthy is 1-3% for this type of ad
- **Conversion rate**: Eligibility check → payment. Healthy is 5-15%

### Week 1-2: Testing Phase
- Run all 4 ad variations with $5/day each
- After 3-4 days, you'll see which ad has the best CTR and CPL
- Kill the bottom 2, reallocate budget to top 2

### Week 3-4: Scaling Phase
- Increase budget on winning ads to $20-30/day
- Start retargeting campaign ($5-10/day)
- Retargeting ad copy: "You checked your RECA eligibility — ready to start your claim? 50% off during beta."

### Month 2: Optimization
- Create lookalike audience from people who completed eligibility check
- Test video ad (you talking to camera about why you built this — authenticity wins)
- Expand to remaining affected states (NM, ID) if UT/NV/AZ is working

---

## STEP 5: Community Outreach (Free, High-Impact)

### Local Institutions to Contact
These organizations serve your exact audience and may share your resource:

1. **County health departments** in affected areas — they often have RECA info pages
2. **Cancer support groups** — local chapters of American Cancer Society
3. **LDS church leadership** — southern Utah wards/stakes (many downwinders are LDS, and LDS church records are accepted proof of presence)
4. **Tribal health departments** — Navajo Nation, Goshute, Paiute tribes
5. **Rural libraries** — they help people with government forms
6. **Senior centers** — direct access to the target demographic
7. **Local newspapers** — pitch a story: "New tool helps downwinder families file $100K claims"
8. **State legislators' offices** — they often refer constituents to RECA resources

### Referral Program
Your app already has a $50 referral reward. Promote this:
> "Know someone who might qualify? Refer them to RadiantClaims. If their claim is approved, you receive $50."

This turns every satisfied customer into a recruiter — powerful in tight-knit rural communities where word of mouth is everything.

---

## QUICK-START CHECKLIST

### Today:
- [ ] Create Facebook Business Page
- [ ] Set up Meta Business Suite account
- [ ] Write your "About" section
- [ ] Make your first organic post (informational, no sales)

### This Week:
- [ ] Join 5-10 relevant Facebook groups in UT/NV/AZ
- [ ] Create 4 ad images in Canva
- [ ] Set up Meta Pixel on radiantclaims.com
- [ ] Post your first value-add comment in 2-3 groups
- [ ] Launch Campaign 1 with 4 ad variations at $5/day each

### Week 2:
- [ ] Kill bottom 2 ads, scale top 2
- [ ] Make 3 organic posts on your page
- [ ] Engage with every comment and message (response time matters for Facebook's algorithm)
- [ ] Contact 2-3 local organizations about RECA awareness

### Week 3:
- [ ] Start retargeting campaign
- [ ] Post first "DOJ Queue Update" with real data from your metrics
- [ ] Ask beta tester for a testimonial/quote you can use

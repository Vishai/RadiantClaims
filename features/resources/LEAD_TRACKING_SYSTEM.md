# Lead Tracking & Conversion System

## Overview

You're absolutely right - the `eligibilityData` JSON field is a goldmine! We've now built a comprehensive lead tracking system to capture, analyze, and follow up with "teacupped" sessions (users who completed eligibility but didn't convert).

## What is "Teacupping"?

**Teacupping** = When a potential claimant completes the eligibility screening, gets excited about their likely $100k payout, but then doesn't finish signing up or paying for services.

This is **high-intent lead data** - these people are:
- ✅ Likely eligible for $100k
- ✅ Motivated enough to complete screening
- ✅ Have valid contact info
- ❌ Haven't converted to paying customers... yet

---

## Database Schema Changes

### New Fields on Claimant Model

```prisma
model Claimant {
  // ... existing fields ...

  // Eligibility data (persists across sessions)
  eligibilityData         Json?  // Complete eligibility screening data

  // LEAD TRACKING & CONVERSION
  leadStatus              LeadStatus       @default(NEW)
  eligibilityStatus       String?          // "likely", "unlikely", "ineligible"
  lastContactedAt         DateTime?        // Last follow-up attempt
  followUpCount           Int              @default(0)
  conversionStage         ConversionStage  @default(ELIGIBILITY_COMPLETED)
  teacupReason            String?          // Why they didn't complete
}
```

### New Enums

#### LeadStatus
Tracks where the lead is in your follow-up sequence:

```typescript
enum LeadStatus {
  NEW          // Just completed eligibility
  CONTACTED    // We've reached out
  ENGAGED      // They responded to follow-up
  NURTURING    // In follow-up sequence
  CONVERTED    // Signed up and started claim
  CHURNED      // Decided not to proceed
  INELIGIBLE   // Not eligible for RECA
  COLD         // No response after multiple attempts
}
```

#### ConversionStage
Tracks exact position in the funnel:

```typescript
enum ConversionStage {
  ELIGIBILITY_COMPLETED  // Finished eligibility check
  ACCOUNT_CREATED        // Signed up but hasn't started form
  FORM_STARTED           // Started RECA form
  FORM_IN_PROGRESS       // Working through form sections
  PAYMENT_PENDING        // Needs to pay for service tier
  PAYMENT_COMPLETED      // Paid, has active subscription
  FORM_COMPLETED         // Finished entire form
  PDF_GENERATED          // PDF created
  PDF_DOWNLOADED         // Downloaded PDF
  SUBMITTED_TO_DOJ       // Claim submitted to DOJ
}
```

---

## Automatic Tracking

### When Lead is Created (Eligibility Screening)

**File**: `/src/app/api/eligibility-check/route.ts`

```typescript
const claimant = await db.claimant.create({
  data: {
    // ... contact info ...
    eligibilityData: {
      intent,
      relationship,
      deceasedFirstName,
      deceasedLastName,
      deceasedDOD,
      residenceState,
      arizonaCounty,
      nevadaCounty,
      cancerType,
      hasCancer,
      latencyMet,
    },
    leadStatus: "NEW",
    eligibilityStatus: "likely", // or "unlikely", "ineligible", etc.
    conversionStage: "ELIGIBILITY_COMPLETED",
  },
});
```

### When Lead Converts (Starts RECA Form)

**File**: `/src/app/api/reca/workflow/create/route.ts`

```typescript
// When user signs up and starts form
await db.claimant.update({
  where: { id: claimant.id },
  data: {
    userId: session.user.id,
    leadStatus: "CONVERTED",      // 🎉 They converted!
    conversionStage: "FORM_STARTED",
  },
});
```

---

## API Endpoints

### 1. Teacupped Leads API

**Endpoint**: `GET /api/admin/leads/teacupped`

Returns leads who completed eligibility but haven't converted.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string | `all`, `hot`, `warm`, `cold`, `needsFollowUp`, `likely` |
| `eligibility` | string | Filter by eligibility status |
| `daysOld` | number | How many days back to look (default: 30) |

#### Filter Types

**`hot`** - Completed in last 7 days, not contacted, likely eligible
```bash
GET /api/admin/leads/teacupped?filter=hot
```

**`warm`** - Completed 7-30 days ago, contacted but not engaged
```bash
GET /api/admin/leads/teacupped?filter=warm
```

**`cold`** - No response after multiple attempts
```bash
GET /api/admin/leads/teacupped?filter=cold
```

**`needsFollowUp`** - Haven't been contacted in 3+ days
```bash
GET /api/admin/leads/teacupped?filter=needsFollowUp
```

**`likely`** - Only "likely eligible" leads
```bash
GET /api/admin/leads/teacupped?filter=likely
```

#### Response Format

```json
{
  "success": true,
  "filter": "hot",
  "daysOld": 30,
  "stats": {
    "total": 45,
    "byEligibility": {
      "likely": 32,
      "needsReview": 8,
      "unlikely": 3,
      "ineligible": 2
    },
    "byLeadStatus": {
      "new": 25,
      "contacted": 12,
      "engaged": 5,
      "cold": 3
    },
    "needingFollowUp": 18
  },
  "leads": [
    {
      "id": "clm_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "createdAt": "2024-12-01T10:30:00Z",
      "leadStatus": "NEW",
      "eligibilityStatus": "likely",
      "conversionStage": "ELIGIBILITY_COMPLETED",
      "lastContactedAt": null,
      "followUpCount": 0,
      "enrichedData": {
        "intent": "deceased-relative",
        "relationship": "child",
        "deceasedName": "Mary Doe",
        "deceasedDOD": "2020-05-15",
        "residenceState": "Arizona",
        "county": "Maricopa",
        "cancerType": "Lung Cancer"
      }
    }
  ]
}
```

#### Update Lead Status

**Endpoint**: `POST /api/admin/leads/teacupped`

Mark a lead as contacted, add notes, etc.

```bash
POST /api/admin/leads/teacupped
Content-Type: application/json

{
  "claimantId": "clm_123",
  "leadStatus": "CONTACTED",
  "teacupReason": "Needs time to gather documents"
}
```

---

### 2. Conversion Funnel Analytics API

**Endpoint**: `GET /api/admin/leads/funnel`

Provides insights into where leads drop off in the conversion funnel.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | number | Time window (default: 30) |

#### Response Format

```json
{
  "success": true,
  "days": 30,
  "funnel": [
    {
      "stage": "Eligibility Completed",
      "count": 150,
      "percentage": 100,
      "dropOffToNext": 75,
      "conversionRate": 100
    },
    {
      "stage": "Account Created",
      "count": 75,
      "percentage": 50,
      "dropOffToNext": 30,
      "conversionRate": 50
    },
    {
      "stage": "Form Started",
      "count": 45,
      "percentage": 30,
      "dropOffToNext": 15,
      "conversionRate": 30
    },
    {
      "stage": "Payment Completed",
      "count": 30,
      "percentage": 20,
      "dropOffToNext": 5,
      "conversionRate": 20
    },
    {
      "stage": "Form Completed",
      "count": 25,
      "percentage": 16.67,
      "dropOffToNext": 3,
      "conversionRate": 16.67
    },
    {
      "stage": "PDF Downloaded",
      "count": 22,
      "percentage": 14.67,
      "dropOffToNext": 2,
      "conversionRate": 14.67
    },
    {
      "stage": "Submitted to DOJ",
      "count": 20,
      "percentage": 13.33,
      "dropOffToNext": 0,
      "conversionRate": 13.33
    }
  ],
  "insights": {
    "biggestDropOffs": [
      {
        "stage": "Eligibility Completed",
        "dropOffToNext": 75
      },
      {
        "stage": "Account Created",
        "dropOffToNext": 30
      },
      {
        "stage": "Form Started",
        "dropOffToNext": 15
      }
    ],
    "overallConversionRate": "13.33%",
    "eligibilityToPayment": "20.00%",
    "paymentToCompletion": "66.67%"
  },
  "leadStatusBreakdown": {
    "NEW": 75,
    "CONTACTED": 25,
    "ENGAGED": 15,
    "CONVERTED": 30,
    "COLD": 5
  }
}
```

---

## Use Cases

### 1. Daily Follow-Up Queue

Get all leads that need follow-up today:

```bash
GET /api/admin/leads/teacupped?filter=needsFollowUp
```

Use this to generate a daily task list for your team.

### 2. Hot Lead Outreach

Get high-intent leads from the last week:

```bash
GET /api/admin/leads/teacupped?filter=hot
```

These are your **highest priority** - they just completed eligibility and are likely eligible.

### 3. Re-Engagement Campaign

Get warm leads who haven't responded:

```bash
GET /api/admin/leads/teacupped?filter=warm
```

Send automated email sequences or SMS reminders.

### 4. Conversion Rate Analysis

Identify where people drop off:

```bash
GET /api/admin/leads/funnel?days=30
```

Use insights to optimize each stage of the funnel.

### 5. Eligibility-Based Segmentation

Target only "likely eligible" leads:

```bash
GET /api/admin/leads/teacupped?filter=likely
```

These have the highest conversion potential.

---

## Follow-Up Campaign Ideas

### Email Sequence for Hot Leads (Day 0-7)

**Day 0 (Immediately after eligibility):**
- ✉️ "You may be eligible for $100,000!"
- Include eligibility results
- Clear CTA to create account

**Day 2:**
- ✉️ "Questions about your RECA claim?"
- Address common objections
- Testimonials from successful claimants

**Day 5:**
- ✉️ "Limited time: Start your claim today"
- Urgency around RECA program deadlines
- Simplified signup process

**Day 7:**
- ✉️ "Last chance: Your $100k awaits"
- Final reminder
- Offer phone consultation

### SMS Campaign

**Day 1:**
```
Hi [Name], you completed our RECA eligibility check. You may qualify for $100k!
Click here to start your claim: [link]
```

**Day 3:**
```
[Name], have questions about your RECA claim? Reply "CALL" for a free consultation.
```

### Phone Outreach

For "likely" leads with high value (deceased + compensable cancer):
- Personal phone call from claims specialist
- Walk through process
- Answer questions about required documents
- Schedule follow-up appointment

---

## Teacup Reasons (Common Drop-Off Causes)

Track why leads don't convert:

```typescript
const teacupReasons = [
  "Needs time to gather documents",
  "Concerned about cost",
  "Waiting on medical records",
  "Needs family approval",
  "Unclear about eligibility",
  "Technical issues during signup",
  "Lost interest",
  "Found another service",
  "Other"
];
```

Use this data to:
1. **Address objections** in marketing
2. **Improve signup flow** (if technical issues)
3. **Create targeted content** (e.g., "Document Checklist" for those gathering docs)
4. **Adjust pricing** (if cost concerns are high)

---

## Database Queries for Custom Reports

### Leads by State

```sql
SELECT state, COUNT(*) as count,
       SUM(CASE WHEN leadStatus = 'CONVERTED' THEN 1 ELSE 0 END) as converted
FROM "Claimant"
WHERE "conversionStage" IN ('ELIGIBILITY_COMPLETED', 'ACCOUNT_CREATED')
GROUP BY state
ORDER BY count DESC;
```

### Conversion Rate by Cancer Type

```sql
SELECT "cancerType",
       COUNT(*) as total,
       SUM(CASE WHEN leadStatus = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
       (SUM(CASE WHEN leadStatus = 'CONVERTED' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as conversion_rate
FROM "Claimant"
WHERE "cancerType" IS NOT NULL
GROUP BY "cancerType"
ORDER BY conversion_rate DESC;
```

### Time to Conversion

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) as avg_days_to_convert
FROM "Claimant"
WHERE leadStatus = 'CONVERTED';
```

---

## Next Steps / Future Enhancements

### 1. **Automated Email Campaigns** (Recommended)
- Integrate with SendGrid/Mailgun
- Trigger emails based on `leadStatus` changes
- Track open rates and click-throughs

### 2. **SMS Automation** (High ROI)
- Integrate with Twilio
- Send SMS reminders for high-value leads
- 2-way SMS for questions

### 3. **Lead Scoring**
- Assign scores based on:
  - Eligibility status (likely = 100 points)
  - Cancer type (high-payout cancers = bonus points)
  - Deceased DOD (recent = more urgent)
  - County (high-exposure areas = bonus)
- Prioritize follow-up based on score

### 4. **Retargeting Ads**
- Export lead emails for Facebook/Google retargeting
- Show ads reminding them to complete signup
- "You're 80% done with your $100k claim!"

### 5. **Predictive Analytics**
- ML model to predict conversion likelihood
- Focus resources on highest-probability leads
- Identify patterns in successful conversions

### 6. **CRM Integration**
- Sync with HubSpot/Salesforce
- Assign leads to sales reps
- Track full customer journey

---

## Monitoring & Alerts

### Daily Metrics to Track

1. **New leads today** (eligibility completions)
2. **Conversion rate** (eligibility → payment)
3. **Drop-off rate at each stage**
4. **Response rate to follow-ups**
5. **Average time to conversion**
6. **Cold lead count** (need re-engagement)

### Alert Triggers

- 🚨 **Conversion rate drops below 15%** → Review funnel
- 🚨 **>50 hot leads not contacted** → Scale up outreach
- 🚨 **High drop-off at payment stage** → Pricing/UX issue?
- 🚨 **Lead not contacted in 7 days** → Add to urgent queue

---

## ROI Calculation

### Example Scenario

- **100 leads complete eligibility** (monthly)
- **20% conversion rate** = 20 customers
- **Average revenue per customer** = $500 (DIY tier)
- **Monthly revenue from converted leads** = $10,000

**If you improve conversion rate from 20% to 25%:**
- **+5 customers per month** = $2,500 additional revenue
- **Annually**: $30,000 additional revenue

**Follow-up campaign cost:**
- Email automation: ~$100/month
- SMS: ~$0.01 per message × 100 leads × 3 messages = $3
- **Total cost**: ~$103/month

**ROI**: $2,500 / $103 = **24x return on investment** 🚀

---

## Summary

The lead tracking system gives you:

✅ **Complete visibility** into every lead's journey
✅ **Eligibility data** persists across sessions (database-backed)
✅ **Automatic tracking** of conversion stages
✅ **API endpoints** for teacupped leads and funnel analytics
✅ **Follow-up infrastructure** to re-engage cold leads
✅ **Conversion insights** to optimize each funnel stage

**Bottom line**: You now have a data-driven system to maximize conversions and revenue from every single person who completes eligibility screening.

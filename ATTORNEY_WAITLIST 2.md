# Attorney Path Waitlist Feature

## Overview

The waitlist system now tracks **which service tier** users are interested in, allowing you to segment leads by:
- **Attorney Path** (LEGAL_REP) - Users wanting legal representation
- **DIY Path** (DIY_PREP) - Users wanting self-service document preparation

## Why This Matters

When registration is blocked, you're not just collecting emails—you're **qualifying leads** by their service preference. This allows:

✅ **Attorney/Firm Partners** to see only leads interested in legal representation
✅ **DIY Marketing** to target self-service users
✅ **Conversion tracking** by service tier
✅ **Revenue forecasting** based on lead pipeline by tier

## How It Works

### Data Collection

When users join the waitlist, the system captures:
- **Email** (required)
- **Name** (optional)
- **Phone** (optional  - NEW!)
- **Claim Type** (DOWNWINDER, etc.)
- **Service Tier Preference** (LEGAL_REP or DIY_PREP - NEW!)
- **Firm Preference** (if they want a specific firm)
- Source, UTM parameters, etc.

### Two Dashboards

#### 1. Admin Dashboard (`/admin/waitlist`)
**Who can access:** ADMIN users only
**What it shows:** ALL waitlist entries

**New Features:**
- 5 stat cards including **Attorney Path** and **DIY Path** counts
- **Service Tier filter** buttons (All / Attorney Path / DIY Path)
- Service tier badges in table (blue for Attorney, purple for DIY)
- Phone number column
- Enhanced CSV export with tier data

**Use cases:**
- See total lead pipeline
- Compare interest levels between tiers
- Track conversion rates by service type
- Export all leads for marketing campaigns

#### 2. Attorney Dashboard (`/attorney/waitlist`)
**Who can access:** ATTORNEY and FIRM_ADMIN users
**What it shows:** ONLY `LEGAL_REP` (attorney path) leads

**Features:**
- Automatically filtered to attorney-interested leads
- Shows phone numbers (for outreach)
- Highlights high-interest leads (multiple submissions)
- Click-to-email and click-to-call links
- Status management (Pending → Contacted → Converted)
- Export attorney leads to CSV

**Use cases:**
- Law firms see their potential client pipeline
- Track outreach efforts
- Measure conversion from lead to client
- Plan capacity for new client onboarding

## Accessing the Dashboards

### As Admin
1. Log in as ADMIN user
2. Go to `/portal`
3. Click green "Waitlist" button in navigation
4. See all leads with tier filtering options

**Direct URL:**
```
http://localhost:3000/admin/waitlist
```

### As Attorney
1. Log in as ATTORNEY or FIRM_ADMIN user
2. Navigate to `/attorney/waitlist`
3. See only attorney-path leads

**Direct URL:**
```
http://localhost:3000/attorney/waitlist
```

## Database Schema

The `RegistrationWaitlist` table now includes:

```prisma
model RegistrationWaitlist {
  // ... existing fields ...

  phone           String?      // NEW: Phone number for outreach
  interestedTier  ServiceTier? // NEW: DIY_PREP or LEGAL_REP
  firmPreference  String?      // NEW: Specific firm if requested

  // ...
}
```

## API Changes

### Submit to Waitlist
```bash
POST /api/waitlist
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1-555-1234",            # NEW: optional
  "interestedTier": "LEGAL_REP",     # NEW: DIY_PREP or LEGAL_REP
  "firmPreference": "heritage-law",  # NEW: optional
  "claimType": "DOWNWINDER",
  "source": "service_tiers"
}
```

### Admin API (with tier filtering)
```bash
# Get all leads
GET /api/admin/waitlist

# Filter by service tier
GET /api/admin/waitlist?tier=LEGAL_REP    # Attorney path only
GET /api/admin/waitlist?tier=DIY_PREP     # DIY path only

# Combine filters
GET /api/admin/waitlist?tier=LEGAL_REP&status=PENDING
```

**Response includes:**
```json
{
  "entries": [...],
  "counts": {
    "PENDING": 25,
    "CONTACTED": 10,
    "CONVERTED": 5
  },
  "tierCounts": {
    "LEGAL_REP": 20,  // NEW
    "DIY_PREP": 20    // NEW
  }
}
```

## Use Cases & Workflows

### For Law Firms (Attorney Path)

**1. Daily Lead Review**
- Check `/attorney/waitlist` each morning
- See new `PENDING` leads from previous day
- Call high-interest leads (multiple submissions) first

**2. Outreach Campaign**
- Export attorney leads to CSV
- Upload to CRM or email marketing tool
- Send "We're accepting new clients" campaign
- Track responses, update status to `CONTACTED`

**3. Conversion Tracking**
- When lead signs retainer agreement → mark as `CONVERTED`
- Link to actual user account when created
- Measure conversion rate from lead → client

### For Admin (All Leads)

**1. Pipeline Analysis**
- Compare `Attorney Path` vs `DIY Path` interest
- Forecast revenue by tier
- Plan resource allocation

**2. Marketing Attribution**
- See which sources drive attorney-interested leads
- Optimize ad spend for high-value (attorney) leads
- Track UTM parameters by tier

**3. Launch Coordination**
- Export both segments separately
- Different email campaigns for each tier
- Staggered launch (attorneys first, then DIY)

## Example Workflows

### Workflow 1: Attorney Firm Launch

```
Day 1: Registration blocked, waitlist collecting leads
Day 7: 50 leads collected (30 attorney path, 20 DIY)
Day 8: Export attorney leads, send to Heritage Law
Day 9: Heritage Law reviews, calls high-priority leads
Day 10: Enable registration for LEGAL_REP tier only
Day 11: Attorneys convert 15 leads → new clients
Day 14: Enable registration for all
```

### Workflow 2: Tiered Pricing Test

```
Scenario: Want to test pricing for attorney services
Action: Leave registration blocked
Track: Which tier gets more submissions
Analyze: If attorney path has 3x more interest, increase pricing
Result: Data-driven pricing before launch
```

### Workflow 3: Partner Firm Referrals

```
Lead submits: Interested in attorney path
Firm preference: "heritage-law"
Admin exports: Attorney leads by firm preference
Heritage Law: Gets qualified leads already interested in them
Result: Warm leads, higher conversion
```

## Metrics to Track

### Lead Quality Indicators
- **Submission count >  1** = High interest (call first)
- **Phone provided** = Serious (ready to talk)
- **Firm preference specified** = Qualified (knows what they want)
- **Attorney path + DOWNWINDER claim** = High-value lead

### Conversion Metrics
- Lead-to-account conversion rate (by tier)
- Time from waitlist to converted
- Retention rate by acquisition source
- Revenue per lead by tier

### Marketing Metrics
- Cost per lead (CPL) by tier
- Source performance by tier
- Attorney path vs DIY ratio
- Geographic distribution

## Integration Ideas

### CRM Integration
Export CSV → Import to:
- Salesforce (tag with tier)
- HubSpot (segment by service tier)
- Pipedrive (create deals by tier)

### Email Marketing
- Mailchimp: Separate lists for Attorney vs DIY
- Resend: Automated welcome series by tier
- SendGrid: Drip campaigns based on tier

### Analytics
- Google Analytics: Track conversions by tier
- Mixpanel: Funnel analysis by service tier
- Segment: Event tracking for tier preferences

## Best Practices

### For Attorney Firms
1. **Respond quickly** - Call within 24 hours of submission
2. **Prioritize high-interest** - Multiple submissions first
3. **Personal touch** - Use provided phone number
4. **Track outcomes** - Update status religiously
5. **Follow up** - Contact 3x before marking declined

### For Admins
1. **Daily monitoring** - Check dashboard every morning
2. **Quality over quantity** - Focus on attorney-path leads (higher value)
3. **Segment communications** - Different messages for each tier
4. **A/B test messaging** - Track which email gets best response
5. **Clean data** - Mark spam/invalid leads quickly

### For Marketing
1. **UTM everything** - Track every source by tier
2. **Tier-specific landing pages** - Optimize for each audience
3. **Retargeting** - Pixel attorney-interested visitors differently
4. **Pricing tests** - Use waitlist to gauge price sensitivity
5. **Partner attribution** - Track firm-specific referrals

## Technical Details

**Files Modified/Created:**
- `prisma/schema.prisma` - Added tier fields
- `src/app/api/waitlist/route.ts` - Capture tier data
- `src/app/api/admin/waitlist/route.ts` - Tier filtering
- `src/app/admin/waitlist/page.tsx` - Tier display & filters
- `src/app/attorney/waitlist/page.tsx` - NEW attorney dashboard

**Migration:**
```bash
pnpm prisma migrate dev --name add_service_tier_to_waitlist
```

**Database Indexes:**
```prisma
@@index([interestedTier])  // Fast tier filtering
```

---

## Quick Reference

| Dashboard | URL | Who Can Access | What It Shows |
|-----------|-----|----------------|---------------|
| Admin Waitlist | `/admin/waitlist` | ADMIN only | All leads, all tiers |
| Attorney Waitlist | `/attorney/waitlist` | ATTORNEY, FIRM_ADMIN | Attorney-path leads only |

| Service Tier | Badge Color | Meaning |
|--------------|-------------|---------|
| LEGAL_REP | Blue | Wants attorney representation |
| DIY_PREP | Purple | Wants DIY document prep |
| (null) | Gray dash | Didn't specify |

**Questions?** See `WAITLIST_QUICKSTART.md` for general waitlist info.

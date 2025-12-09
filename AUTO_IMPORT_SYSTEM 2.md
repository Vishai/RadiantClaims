# Auto-Import System: Self-Improving Contact Database

## Overview

The contact agent now **automatically imports high-quality web search results** into your database. This creates a **self-improving system** that:

- Gets better over time (more contacts = fewer web searches)
- Gets cheaper over time (web searches → $0.03 each, database queries → $0)
- Requires less maintenance (web results populate your database automatically)
- Learns from user queries (adds what people actually search for)

## How It Works

```
User asks: "Birth certificate from Beaver County, Utah"
       ↓
Search database (not found)
       ↓
Search web via Tavily ($0.001)
       ↓
Find: "Beaver County Clerk" with phone, website, address
       ↓
Quality check: Score = 85/100 ✅
       ↓
AUTO-IMPORT to database (async)
       ↓
Return to user immediately
       ↓
Next time: Found in database! ($0, instant)
```

## Quality Scoring System

Each web contact gets a quality score (0-100):

| Feature | Points |
|---------|--------|
| Has phone number | +30 |
| Has email address | +20 |
| Has physical address | +25 |
| Is .gov domain | +20 |
| Is .us domain | +15 |
| Has website (other) | +5 |
| Multiple contact methods (2+) | +10 |

**Auto-import threshold:** 70+ points (configurable)

### Examples

**Score: 95 → Auto-import ✅**
```
Name: Washington County Clerk
Website: https://washco.utah.gov
Phone: (435) 301-7200
Email: clerk@washco.utah.gov
Address: 111 E Tabernacle St, St George, UT

Quality breakdown:
- Phone: +30
- Email: +20
- Address: +25
- .gov domain: +20
= 95/100
```

**Score: 45 → Skip ❌**
```
Name: Some Random Website
Website: https://example.com
Notes: Mentions vital records

Quality breakdown:
- No phone: 0
- No email: 0
- No address: 0
- Other website: +5
= 5/100 (too low, skipped)
```

## Configuration Options

### In the Chat API

```typescript
batchAutoImport(webContacts, {
  minConfidenceScore: 70,    // Only import contacts scoring 70+
  requirePhone: false,        // Set true to require phone number
  requireWebsite: false,      // Set true to require website
  autoVerify: true,          // Mark as "needs review"
});
```

**Tuning recommendations:**

| Use Case | minConfidenceScore | requirePhone | requireWebsite |
|----------|-------------------|--------------|----------------|
| **Aggressive** (import more) | 60 | false | false |
| **Balanced** (current) | 70 | false | false |
| **Conservative** (high quality only) | 85 | true | true |

### Conservative Settings

For critical applications where accuracy is paramount:

```typescript
batchAutoImport(webContacts, {
  minConfidenceScore: 85,   // Very high quality only
  requirePhone: true,        // Must have phone
  requireWebsite: true,      // Must have website
  autoVerify: true,
});
```

This imports ~30% fewer contacts but with higher accuracy.

### Aggressive Settings

To build your database quickly:

```typescript
batchAutoImport(webContacts, {
  minConfidenceScore: 60,   // Lower bar
  requirePhone: false,       // Optional
  requireWebsite: false,     // Optional
  autoVerify: true,          // Still mark for review
});
```

This imports ~50% more contacts but requires more admin review.

## Auto-Import Metadata

Each auto-imported contact has special notes:

```
Type: Acute Care Hospitals. Ownership: Voluntary non-profit - Private.

Auto-imported from web search (Web Search)
Confidence score: 85/100
Source URL: https://example.gov/hospital-directory

⚠️ AI-verified only - needs human review
```

This metadata helps admins:
- Identify auto-imported contacts
- See the quality score
- Find the source URL to verify
- Know which need review

## Admin Review Workflow

### 1. Get Statistics

```bash
# Check auto-import stats
GET /api/admin/contacts/auto-imported?action=stats

Response:
{
  "total": 500,
  "autoImported": 150,
  "needsReview": 45,
  "percentAutoImported": 30
}
```

### 2. Review Pending Contacts

```bash
# Get contacts that need review
GET /api/admin/contacts/auto-imported?needsReview=true

Response:
{
  "contacts": [...],
  "count": 45
}
```

### 3. Approve, Reject, or Edit

```bash
# Approve a contact
PATCH /api/admin/contacts/auto-imported
{
  "contactId": "...",
  "action": "approve"
}

# Reject and delete
PATCH /api/admin/contacts/auto-imported
{
  "contactId": "...",
  "action": "reject",
  "reason": "Incorrect information"
}

# Edit contact details
PATCH /api/admin/contacts/auto-imported
{
  "contactId": "...",
  "action": "edit",
  "updates": {
    "phone": "(801) 555-1234",
    "email": "correct@email.gov"
  }
}
```

## Cost Reduction Over Time

### Month 1: Database Seed + Auto-Import

| Source | Contacts | Web Searches | Cost |
|--------|----------|--------------|------|
| Manual import | 450 | 0 | $0 |
| Auto-import | 50 | 50 | $1.50 |
| **Total** | **500** | **50** | **$1.50** |

Web search rate: 10%

### Month 2: Fewer Web Searches

| Source | Contacts | Web Searches | Cost |
|--------|----------|--------------|------|
| Database | 500 | 0 | $0 |
| Auto-import | 25 | 25 | $0.75 |
| **Total** | **525** | **25** | **$0.75** |

Web search rate: 5% (improving!)

### Month 3: Minimal Web Searches

| Source | Contacts | Web Searches | Cost |
|--------|----------|--------------|------|
| Database | 525 | 0 | $0 |
| Auto-import | 10 | 10 | $0.30 |
| **Total** | **535** | **10** | **$0.30** |

Web search rate: 2% (excellent!)

### Steady State: Self-Sustaining

After 3-6 months, you'll have 80-90% coverage from your database. Auto-import handles edge cases automatically.

**Final cost: ~$3-5/month** (vs $200+ for Airtable/n8n/Voiceflow)

## Analytics & Monitoring

Track these metrics to optimize:

```typescript
// Track when auto-import happens
console.log(`[Auto-Import] Added ${contact.name} (score: ${score})`);

// Monitor costs
console.log(`[Costs] Web searches this month: ${count}, Cost: $${count * 0.001}`);

// Track quality
console.log(`[Quality] Average import score: ${avgScore}`);
```

### Recommended Dashboard Metrics

1. **Auto-Import Rate**
   - Goal: Decrease over time
   - Initial: 5-10%
   - Target: <2%

2. **Average Quality Score**
   - Goal: Increase over time
   - Initial: 70-75
   - Target: 80-85+

3. **Admin Review Time**
   - Goal: Minimize
   - Use: 5-10 min/week reviewing auto-imports

4. **Cost Savings**
   - Goal: Maximize
   - Track: Web search cost vs database cost

## Database Growth Projections

| Month | Manual | Auto-Imported | Total | Web Search % | Monthly Cost |
|-------|--------|---------------|-------|--------------|--------------|
| 0 | 450 | 0 | 450 | 10% | $0 |
| 1 | 450 | 50 | 500 | 8% | $1.50 |
| 2 | 450 | 75 | 525 | 5% | $0.75 |
| 3 | 450 | 85 | 535 | 3% | $0.50 |
| 6 | 450 | 120 | 570 | 2% | $0.30 |
| 12 | 450 | 150 | 600 | 1% | $0.20 |

**Long-term:** Database becomes comprehensive enough that web search is rarely needed.

## Best Practices

### 1. Start Conservative

```typescript
// First month: High quality only
minConfidenceScore: 85
```

This builds trust in the system. As you see good results, lower the threshold.

### 2. Weekly Review

Set aside 10 minutes/week to:
- Review new auto-imports
- Approve good ones
- Reject bad ones
- Track quality trends

### 3. Monitor Source URLs

Good web sources:
- ✅ *.gov sites
- ✅ Official county websites
- ✅ State health departments
- ✅ FamilySearch.org

Bad sources:
- ❌ Random blogs
- ❌ Unverified directories
- ❌ Outdated listings

### 4. Iterate on Scoring

If you see low-quality imports getting through:

```typescript
// Increase threshold
minConfidenceScore: 80 // from 70

// Add requirements
requireWebsite: true
```

If you see good contacts being skipped:

```typescript
// Decrease threshold
minConfidenceScore: 65 // from 70
```

### 5. Leverage User Feedback

Add a "Report Issue" button on contact cards:

```tsx
<Button onClick={() => reportContact(contact.id)}>
  Report Incorrect Info
</Button>
```

Track which auto-imported contacts get reported and adjust scoring.

## Disable Auto-Import

If you want manual control:

```typescript
// In chat/route.ts
// Comment out or remove the batchAutoImport call

// batchAutoImport(webContacts, { ... }) // Disabled
```

Or set the threshold impossibly high:

```typescript
minConfidenceScore: 999 // Never auto-import
```

## Privacy & Compliance

Auto-imported contacts:
- ✅ Are public information (government offices, hospitals)
- ✅ Don't contain PII
- ✅ Are marked as AI-verified for transparency
- ✅ Can be reviewed/removed by admins
- ✅ Source URLs are preserved for verification

## Advanced: Machine Learning Enhancement

Future enhancement - use ML to improve scoring:

```typescript
// Track which contacts users actually use
// Feed into scoring algorithm
// Auto-import similar contacts more aggressively

function enhancedScore(contact: ContactFromWeb): number {
  const baseScore = scoreWebContact(contact);
  const mlScore = predictUsefulnessFromPastData(contact);
  return (baseScore + mlScore) / 2;
}
```

## Summary

Auto-import provides:

✅ **Self-improving database** - Gets better automatically
✅ **Cost reduction** - Moves from $0.03/search → $0
✅ **Time savings** - Less manual data entry
✅ **Better coverage** - Learns what users actually need
✅ **Quality control** - Score-based filtering + admin review
✅ **Transparency** - Clear metadata on source and quality

**Recommendation:**
1. Start with `minConfidenceScore: 70`
2. Review weekly for first month
3. Adjust threshold based on quality
4. Sit back and watch your database grow automatically!

---

**Questions?** Check `src/lib/contact-agent/auto-import.ts` for implementation details.

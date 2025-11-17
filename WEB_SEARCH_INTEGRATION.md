# Web Search Integration for Contact Agent

## Overview

The contact agent now has **intelligent web search fallback** that activates when the database doesn't have the requested contact. This dramatically increases coverage without maintaining thousands of contacts manually.

## How It Works

```
User asks for contact
       ↓
Search YOUR database first
       ↓
    Found? ─── YES ──→ Return verified contacts
       │
      NO
       ↓
Search the web (Tavily/Serper)
       ↓
AI extracts contact info
       ↓
Return web results with disclaimer
```

## Search Provider Options

### Option 1: Tavily API (Recommended) ⭐

**Best for:** AI agents, optimized for LLM consumption

**Pros:**
- Specifically built for AI/LLM applications
- Returns clean, structured data
- Includes AI-generated answers
- Can filter to .gov sites
- Fast and reliable

**Cost:** ~$1/1000 searches

**Setup:**
```bash
# Get API key at: https://tavily.com
TAVILY_API_KEY=tvly-...
```

### Option 2: Serper.dev

**Best for:** Google Search API access

**Pros:**
- Real Google search results
- Cheap and fast
- Good for broad queries

**Cost:** $50/month for 5,000 searches

**Setup:**
```bash
# Get API key at: https://serper.dev
SERPER_API_KEY=...
```

### Option 3: Built-in (No API needed)

You can also use OpenAI's web browsing capability (GPT-4 with browsing), but it's slower and more expensive.

## Tuning for Best Results

### 1. Search Query Optimization

The system builds intelligent search queries:

```typescript
// Example: User asks for birth certificate in Washington County, UT
Search query: "Washington County UT vital records office birth certificate contact phone address"

// Prioritizes:
- County + State specificity
- Institution type (vital records, hospital, etc.)
- Document type
- Contact information keywords
```

**Tune it** in `src/lib/contact-agent/web-search.ts`:

```typescript
// Add more specific terms
if (query.institutionType === "VITAL_RECORDS") {
  searchTerms.push("vital records office"); // More specific
  searchTerms.push("county clerk"); // Alternative
}

// Add state-specific variations
if (query.state === "UT") {
  searchTerms.push("LDS family history"); // Utah-specific
}
```

### 2. Domain Filtering

Prioritize trusted government sites:

```typescript
include_domains: [
  "*.gov",           // All government sites
  "*.us",            // US government sites
  "familysearch.org",// Genealogy resource
  "vitalrecordsoffice.net", // Vital records directory
  "cdc.gov",         // CDC vital records
]
```

**Tune it:** Add more trusted domains for your use case.

### 3. AI Extraction Tuning

The AI extracts contact info using patterns. **Improve accuracy:**

```typescript
// In extractContactFromResult():

// Better phone pattern (handles more formats)
const phonePattern = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;

// Better email pattern
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Better address pattern (include PO Boxes)
const addressPattern = /(P\.?O\.?\s*Box\s*\d+|\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln))/i;
```

### 4. Confidence Scoring

Add confidence scores to rank results:

```typescript
function scoreContact(contact: ContactFromWeb): number {
  let score = 0;

  // Has phone? +30 points
  if (contact.phone) score += 30;

  // Has email? +20 points
  if (contact.email) score += 20;

  // Has physical address? +25 points
  if (contact.address) score += 25;

  // Is .gov domain? +25 points
  if (contact.website?.includes('.gov')) score += 25;

  return score;
}

// Only return contacts with score > 50
```

### 5. Result Caching

Cache web search results to save costs:

```typescript
// Add to web-search.ts
import { redis } from "@/lib/redis"; // If using Upstash Redis

async function searchContactsWeb(query) {
  const cacheKey = `web-search:${JSON.stringify(query)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Perform search...
  const results = await fetch(/* ... */);

  // Cache for 7 days
  await redis.set(cacheKey, JSON.stringify(results), { ex: 604800 });

  return results;
}
```

### 6. System Prompt Tuning

Adjust how the AI presents web results in `src/app/api/contact-agent/chat/route.ts`:

```typescript
const systemPrompt = `...

When presenting web search results:
- ALWAYS mention these were found via web search
- Suggest user verify the information
- Recommend calling to confirm before sending documents
- If website has online request form, mention it
- Note if the contact is from an official .gov site

Be transparent about the source of information.`;
```

## Advanced Tuning Strategies

### Strategy 1: Two-Stage Search

1. **Broad search** for institution name
2. **Focused search** on institution's website for contact details

```typescript
async function twoStageSearch(query) {
  // Stage 1: Find the institution
  const institutions = await searchContactsWeb({
    ...query,
    searchTerms: [county, state, type],
  });

  // Stage 2: For each institution, search their site
  for (const inst of institutions) {
    if (inst.website) {
      const details = await searchContactsWeb({
        searchQuery: `site:${inst.website} "medical records" "contact" "phone"`,
      });
      // Merge details into institution
    }
  }
}
```

### Strategy 2: Parallel Search Multiple Providers

```typescript
async function parallelSearch(query) {
  const [tavilyResults, serperResults] = await Promise.all([
    searchContactsWeb(query), // Tavily
    searchContactsWithAI(query), // Serper
  ]);

  // Deduplicate and merge
  return mergeDeduplicate([...tavilyResults, ...serperResults]);
}
```

### Strategy 3: AI-Powered Post-Processing

Use GPT-4 to clean and validate results:

```typescript
const cleanedContacts = await parseSearchResultsWithAI(
  rawSearchResults,
  {
    state: query.state,
    county: query.county,
    documentType: query.documentType,
  }
);

// GPT-4 will:
// - Extract phone numbers accurately
// - Identify correct department
// - Validate addresses
// - Remove duplicates
// - Score by relevance
```

### Strategy 4: Hybrid Database + Web

Always show database results, but **supplement** with web:

```typescript
if (contacts.length === 0) {
  // No database results - use web
  contacts = await searchContactsWeb(query);
} else if (contacts.length < 3) {
  // Few database results - supplement
  const webContacts = await searchContactsWeb(query);
  contacts = [...contacts, ...webContacts.slice(0, 2)];
}
```

## Environment Variables

Add to `.env.local`:

```bash
# Option 1: Tavily (Recommended)
TAVILY_API_KEY=tvly-...

# Option 2: Serper
SERPER_API_KEY=...

# Option 3: Use OpenAI only (no extra key needed)
# Just uses OPENAI_API_KEY
```

## Cost Analysis

### Database-First Approach (Current)

| Scenario | Database Hit | Web Search | Cost |
|----------|--------------|------------|------|
| Common query | 95% | 5% | ~$5/mo |
| Rare query | 50% | 50% | ~$25/mo |
| No database | 0% | 100% | ~$50/mo |

**Recommendation:** Populate database with top 200-300 most common contacts to minimize web search costs.

### Cost Breakdown

| Provider | Cost per Search | Monthly (1000 searches) |
|----------|----------------|------------------------|
| Tavily | $0.001 | $1 |
| Serper | $0.01 | $10 |
| OpenAI Parsing | $0.02 | $20 |
| **Total** | **~$0.03** | **~$30** |

**Add database-first:** Cuts cost by 70-90% (~$3-10/month)

## Monitoring Web Search

Track web search performance:

```typescript
// Add to your analytics
trackEvent("contact_search", {
  source: searchSource, // "database" or "web"
  found: contacts.length > 0,
  query: JSON.stringify(searchParams),
  webSearchPerformed,
});

// Monitor metrics:
// 1. Web search rate (should be < 20%)
// 2. Web search success rate
// 3. User satisfaction with web results
// 4. Which queries trigger web search most
```

## Recommended Setup

### Phase 1: Database Only (Start Here)
- Import hospitals (294 contacts) ✅
- Import county vital records (~150 contacts)
- Import state cancer registries (5 contacts)
- **Total: ~450 contacts**
- **Web search rate: ~10%**
- **Cost: ~$5/month**

### Phase 2: Add Web Search Fallback
```bash
# Add Tavily
TAVILY_API_KEY=tvly-...
```
- Catches rare/obscure requests
- Cost: +$1-5/month

### Phase 3: Optimize
- Monitor which queries use web search
- Add those contacts to database
- Reduce web search rate to < 5%
- Cost: ~$3/month total

## Testing Web Search

```bash
# Start dev server
pnpm dev

# In the chat, try:
"Find me a small hospital in rural Nevada"
"I need vital records from Beaver County, Utah"
"Where can I get school records from a tiny school district?"

# These will likely trigger web search since they're uncommon
```

## Debugging

Enable detailed logging:

```typescript
// In web-search.ts
console.log('[Web Search] Query:', searchQuery);
console.log('[Web Search] Results:', results.length);
console.log('[Web Search] Extracted contacts:', contacts);
```

Check logs to see:
- What queries trigger web search
- Quality of extracted data
- Which providers work best

## Best Practices

1. **Database First, Always** - Web search is a fallback, not primary
2. **Cache Everything** - Web search results, parsed contacts, common queries
3. **Validate Results** - AI should note web sources need verification
4. **Monitor Costs** - Set budget alerts in Tavily/Serper dashboards
5. **Improve Database** - Add frequently web-searched contacts to DB
6. **User Feedback** - Let users report wrong/outdated web info

## Summary

Web search integration provides:

✅ **100% coverage** - Never say "I don't know"
✅ **Cost effective** - Only use when needed
✅ **Intelligent** - AI extracts and validates info
✅ **Transparent** - Users know source of data
✅ **Improves over time** - Add popular web results to database

**Recommendation:** Start with database-only, add Tavily when you have users asking for uncommon contacts.

---

**Questions?** See the code in `src/lib/contact-agent/web-search.ts` for implementation details.

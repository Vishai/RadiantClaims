# Tavily Search Improvement Summary

## Problem Identified

The chatbot's Tavily search results were not as good as Serper search results because:

1. **Regex-based extraction** (Tavily) vs **AI-powered parsing** (Serper)
2. **Fewer results** (5 vs 8)
3. **Domain filtering too restrictive** (only .gov, .us domains)
4. **"Advanced" search mode** which can be slower and sometimes less relevant

## Root Cause

The key difference was in `src/lib/contact-agent/web-search.ts`:

- **Tavily** (`searchContactsWeb()` - line 35): Used `extractContactFromResult()` with regex patterns to extract phone numbers, emails, addresses
- **Serper** (`searchContactsWithAI()` - line 151): Used `parseSearchResultsWithAI()` with GPT-4 to intelligently extract contact information

## Changes Made

### 1. ✅ Added AI Parsing to Tavily
**Before:**
```typescript
// Extract contacts from search results
const contacts: ContactFromWeb[] = [];

for (const result of data.results || []) {
  const contact = extractContactFromResult(result, query); // Regex-based
  if (contact) {
    contacts.push(contact);
  }
}
```

**After:**
```typescript
// Convert Tavily results to standard WebSearchResult format
const searchResults: WebSearchResult[] = (data.results || []).map(
  (r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content || r.snippet || "",
  })
);

// Use AI parsing (same as Serper) instead of regex extraction
return await parseSearchResultsWithAI(searchResults, query);
```

### 2. ✅ Increased Max Results
- Changed `max_results: 5` → `max_results: 8`
- Now matches Serper's result count

### 3. ✅ Removed Domain Filtering
**Before:**
```typescript
include_domains: [
  "*.gov",
  "*.us",
  "familysearch.org",
  "vitalrecordsoffice.net",
],
```

**After:**
```typescript
// Removed include_domains restriction - many hospitals/institutions use .com/.org
// Google's ranking is often better than manual filtering
```

### 4. ✅ Changed Search Depth
- Changed `search_depth: "advanced"` → `search_depth: "basic"`
- Faster and often better for direct contact queries

## Expected Improvements

### Better Contact Extraction
AI parsing will correctly handle:
- Phone numbers in various formats (international, extensions, etc.)
- Addresses with complex formatting
- Department-specific contacts (e.g., "Medical Records Department")
- Email addresses in text
- Operating status and years

### More Comprehensive Results
- 8 results instead of 5 = 60% more coverage
- No domain filtering = includes .com/.org hospitals/institutions
- Better ranking from search engine's natural algorithm

### Higher Quality Data
- AI understands context (e.g., "call records department at..." vs "records from 1985")
- Can infer missing fields (e.g., if city is in address, extract it)
- Validates data quality (e.g., skips fake/placeholder phone numbers)

## Cost Impact

### Before (Regex Parsing)
- Tavily API: $0.001/search
- **Total: $0.001 per search**

### After (AI Parsing)
- Tavily API: $0.001/search
- OpenAI GPT-4 parsing: ~$0.02/search
- **Total: ~$0.021 per search**

**Note:** Still significantly cheaper than manual data entry, and now matches Serper's quality!

## How Both Search Methods Now Work

### Tavily Flow (Improved)
```
User Query
  ↓
Tavily API (8 results, no domain filter, basic search)
  ↓
AI Parsing via parseSearchResultsWithAI()
  ↓
Structured Contact Data
```

### Serper Flow (Unchanged)
```
User Query
  ↓
Serper/Google API (8 results)
  ↓
AI Parsing via parseSearchResultsWithAI()
  ↓
Structured Contact Data
```

**Key Point:** Both now use the exact same AI parsing logic, so quality should be equivalent!

## When Tavily vs Serper is Used

Based on `src/app/api/contact-agent/chat/route.ts` (line 287):

```typescript
// Fallback to web search if no results found
if (contacts.length === 0 && process.env.TAVILY_API_KEY) {
  const webContacts = await searchContactsWeb({...}); // Uses Tavily
```

**Currently:** Only Tavily is used in the chatbot (when `TAVILY_API_KEY` is set)

**Serper is used in:** `/api/resources/search` route (line 174 in `route.ts`) for direct resource searches

## Testing the Improvements

### Test Queries to Try

1. **Hospital Search:**
   ```
   "Find St. Mark's Hospital in Salt Lake City, Utah contact information"
   ```

2. **County Vital Records:**
   ```
   "I need birth certificates from Washington County, Utah"
   ```

3. **Small Institution:**
   ```
   "Medical records from Mountain View Hospital in Idaho Falls"
   ```

### What to Look For

✅ **Better Extraction:**
- Phone numbers formatted correctly
- Full addresses with city/state/zip
- Correct department contacts

✅ **More Results:**
- 8 institutions instead of 5
- Includes .com/.org domains

✅ **Higher Accuracy:**
- Correct operating status (open/closed)
- Valid contact information
- Relevant institutions only

## Rollback Plan (If Needed)

If the changes cause issues, revert to the previous regex-based approach:

```bash
git diff src/lib/contact-agent/web-search.ts
git checkout src/lib/contact-agent/web-search.ts
```

Or keep the improvements but adjust:
- Set `max_results: 5` if too many irrelevant results
- Re-add `include_domains` if you want to prioritize .gov sites
- Change `search_depth: "advanced"` if you need deeper searches

## Next Steps

1. ✅ Test the chatbot with various queries
2. Monitor logs for AI parsing quality:
   ```
   [Web Search] Tavily returned 8 results, parsing with AI...
   ```
3. Compare Tavily results to previous Serper results
4. If quality is good, consider:
   - Using Tavily as primary (it's cheaper)
   - Removing Serper entirely (if Tavily is sufficient)
   - Or keeping both for redundancy

## Summary

The Tavily search now uses the **exact same AI parsing logic as Serper**, which was the main reason Serper had better results. Combined with:

- More results (8 vs 5)
- No domain restrictions
- Faster search depth

Tavily should now provide **equivalent or better quality** compared to the previous Serper implementation, while being more cost-effective!

---

**Questions?** See the updated code in `src/lib/contact-agent/web-search.ts` (lines 100-144)

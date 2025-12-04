# Contact Deduplication Fix

## Problem

When searching for "Utah Cancer Registry", the chatbot returned 4 separate listings that were all **the same institution** with:
- Same phone number (801-581-8407)
- Same/similar emails (ucr.info@hsc.utah.edu, rdibble@hsc.utah.edu)
- Different addresses (historical addresses from moved offices)

This created a confusing user experience with duplicate feedback cards.

## Root Cause

Web search providers (Serper, Tavily) return multiple results from different sources:
- Official university website
- NAACCR directory listing
- University directory
- Historical documents

The AI parsing treated each as a separate contact, even though they all referred to the same institution.

## Solution

Implemented intelligent deduplication that:
1. **Identifies duplicates** by phone number and email
2. **Consolidates information** from multiple sources
3. **Preserves useful data** like multiple addresses/emails
4. **Informs the user** when deduplication occurs

## Changes Made

### 1. Created Deduplication Function

**File:** `src/lib/contact-agent/web-search.ts`

Added `deduplicateContacts()` function (lines 404-496) that:

```typescript
export function deduplicateContacts(contacts: ContactFromWeb[]): ContactFromWeb[]
```

**How it works:**
- Creates a unique key from phone number (last 10 digits) or email
- Groups contacts with the same key
- Merges duplicate records by:
  - Keeping the first name
  - Consolidating multiple addresses into one field
  - Combining all unique emails
  - Preserving all unique websites
  - Merging notes

**Example:**
```
INPUT:
1. Utah Cancer Registry - 801-581-8407 - 250 East 200 South
2. Utah Cancer Registry - 801-581-8407 - 650 Komas Drive
3. Utah Cancer Registry - 801-581-8407 - 546 Chipeta Way

OUTPUT:
1. Utah Cancer Registry - 801-581-8407
   Address: Multiple locations: 250 East 200 South | 650 Komas Drive | 546 Chipeta Way
   Email: ucr.info@hsc.utah.edu, rdibble@hsc.utah.edu
```

### 2. Integrated into Search Functions

**File:** `src/lib/contact-agent/web-search.ts`

Both Tavily and Serper now automatically deduplicate:

```typescript
// Tavily (line 144-147)
const parsedContacts = await parseSearchResultsWithAI(searchResults, query);
return deduplicateContacts(parsedContacts);

// Serper (line 267-270)
const parsedContacts = await parseSearchResultsWithAI(searchResults, query);
return deduplicateContacts(parsedContacts);
```

### 3. Added Deduplication Tracking

**File:** `src/app/api/contact-agent/chat/route.ts`

The chatbot now tracks when deduplication occurs:

```typescript
let wasDeduplicated = false;
let originalResultCount = 0;

// After web search
originalResultCount = webContacts.length;

// After transformation
if (originalResultCount > contacts.length) {
  wasDeduplicated = true;
  console.log(`Deduplicated ${originalResultCount} results to ${contacts.length} unique contact(s)`);
}
```

### 4. Updated AI Instructions

**File:** `src/app/api/contact-agent/chat/route.ts`

Added guidance to the system prompt (lines 188-192):

```typescript
When you find contacts:
- If multiple search results were deduplicated into a single contact, let the user know
- If a contact has "Multiple locations" in the address field, explain that this institution has moved or has multiple offices
- Suggest the best method to contact them
- When presenting web search results, remind users to verify the information
```

### 5. Enhanced Function Response

**File:** `src/app/api/contact-agent/chat/route.ts`

The AI now receives deduplication information (lines 419-427):

```typescript
{
  contacts,
  count: contacts.length,
  wasDeduplicated,
  originalResultCount: wasDeduplicated ? originalResultCount : contacts.length,
  note: wasDeduplicated
    ? `Found ${originalResultCount} search results, which were consolidated into ${contacts.length} unique contact(s).`
    : "Results found via web search."
}
```

## Expected User Experience

### Before (Duplicates)

**User:** "I need to get in touch with Utah Cancer Registry"

**Bot:** "Here are the contact details for the Utah Cancer Registry:

1. Utah Cancer Registry at the University of Utah Health Sciences
   - Phone: 801-581-8407
   - Address: 250 East 200 South, Suite 1375

2. Utah Cancer Registry from NAACCR Document
   - Phone: 801-581-8407
   - Address: 650 Komas Drive, Suite 106B

3. Additional Contact from NAACCR Document
   - Phone: 801-581-8407
   - Address: 546 Chipeta Way, Suite 410

4. Contact from University of Utah Campus Directory
   - Phone: 801-581-8407
   - Address: 2000 Circle of Hope, RM LL376"

*Then shows 4 duplicate feedback cards*

### After (Deduplicated)

**User:** "I need to get in touch with Utah Cancer Registry"

**Bot:** "I found several listings for the Utah Cancer Registry, which I've consolidated into one comprehensive contact:

**Utah Cancer Registry**
- **Phone:** 801-581-8407
- **Email:** ucr.info@hsc.utah.edu, rdibble@hsc.utah.edu
- **Website:** https://ucr.utah.gov
- **Addresses:** This institution has multiple locations/has moved over time:
  - 250 East 200 South, Suite 1375, Salt Lake City, UT
  - 650 Komas Drive, Suite 106B, Salt Lake City, UT
  - 546 Chipeta Way, Suite 410, Salt Lake City, UT
  - 2000 Circle of Hope, RM LL376, Salt Lake City, UT

I recommend calling the main number (801-581-8407) to verify the current address before sending any documents."

*Then shows 1 feedback card*

## Deduplication Logic Details

### Matching Criteria

Contacts are considered duplicates if they share:
1. **Phone number** (normalized - last 10 digits)
   - `(801) 581-8407` = `801.581.8407` = `8015818407`
2. **OR Email** (normalized - lowercase, trimmed)
   - `UCR.Info@hsc.utah.edu` = `ucr.info@hsc.utah.edu`

### Consolidation Rules

When merging duplicates:

| Field | Consolidation Rule |
|-------|-------------------|
| **Name** | Keep first occurrence |
| **Phone** | Keep first occurrence |
| **Address** | If multiple → "Multiple locations: A \| B \| C" |
| **Email** | If multiple → "email1, email2, email3" |
| **Website** | Keep first occurrence |
| **City/State/County** | First non-null value |
| **Notes** | Combine all notes with line breaks |
| **Years** | First non-null value |

### Edge Cases Handled

1. **Different email domains but same phone:**
   ```
   ucr.info@hsc.utah.edu
   rdibble@hsc.utah.edu
   → Both preserved, comma-separated
   ```

2. **Historical addresses:**
   ```
   Multiple locations: 250 E 200 S | 650 Komas Dr | 546 Chipeta Way
   → User knows institution may have moved
   ```

3. **Single result:**
   ```
   No deduplication needed, returned as-is
   ```

4. **No matching phone/email:**
   ```
   Different institutions, kept separate
   ```

## Logging

Monitor deduplication in logs:

### Success
```
[Web Search] Tavily returned 8 results, parsing with AI...
[Deduplication] Reduced 4 results to 1 unique contacts
[Contact Agent] Serper found 1 results
[Contact Agent] Deduplicated 4 results to 1 unique contact(s)
```

### No deduplication needed
```
[Web Search] Serper returned 3 results, parsing with AI...
[Contact Agent] Serper found 3 results
```
(No deduplication message = all contacts were unique)

## Benefits

### ✅ Better User Experience
- No confusing duplicate listings
- Single, comprehensive contact record
- Clear indication when multiple sources were consolidated

### ✅ Cleaner Feedback System
- Only 1 feedback card per institution
- More accurate feedback tracking
- Better data quality

### ✅ Smarter Data Consolidation
- Preserves all useful information (multiple emails, addresses)
- Indicates when institution has moved
- Helps users understand data provenance

### ✅ Automatic Application
- Works for all web searches (Serper & Tavily)
- No user action required
- Transparent process

## Testing

Test with queries that typically return duplicates:

1. **Well-known institutions:**
   ```
   "Utah Cancer Registry"
   "St. Mark's Hospital Salt Lake City"
   "University of Utah Medical Records"
   ```

2. **Institutions that moved:**
   ```
   "Primary Children's Hospital contact"
   "LDS Hospital medical records"
   ```

3. **State/county offices:**
   ```
   "Utah vital records office"
   "Washington County clerk Utah"
   ```

### What to Look For

✅ Single contact returned instead of multiple duplicates
✅ "Multiple locations" in address field if institution moved
✅ Multiple emails comma-separated
✅ AI mentions deduplication in response
✅ Only 1 feedback card shown

## Configuration

No configuration needed! Deduplication runs automatically for all web searches.

To disable (not recommended):
```typescript
// In web-search.ts, remove these lines:
return deduplicateContacts(parsedContacts); // Remove this
return parsedContacts; // Use this instead
```

## Future Enhancements

Potential improvements:

1. **Smart Address Selection:**
   - Use geocoding to identify the "current" address
   - Mark historical addresses as "(Former location)"

2. **Source Quality Ranking:**
   - Prefer .gov websites over third-party directories
   - Weight official sources higher

3. **Duplicate Detection in Database:**
   - Apply same logic to database imports
   - Prevent duplicate records during auto-import

4. **Fuzzy Name Matching:**
   - "St. Mark's Hospital" = "Saint Mark's Hospital"
   - Handle abbreviations and variations

## Summary

The deduplication system ensures that:

1. ✅ Multiple web search results for the same institution are consolidated
2. ✅ Users see one comprehensive contact instead of confusing duplicates
3. ✅ All useful information (addresses, emails) is preserved
4. ✅ The AI clearly communicates when deduplication occurred
5. ✅ Feedback tracking is cleaner and more accurate

**Result:** Much better user experience when searching for well-known institutions like "Utah Cancer Registry"!

---

**Files Modified:**
- `src/lib/contact-agent/web-search.ts` (added deduplication function)
- `src/app/api/contact-agent/chat/route.ts` (integrated deduplication tracking & AI instructions)

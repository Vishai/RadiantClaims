# Enhanced Contact Deduplication - Multiple Locations & Phone Numbers

## Overview

The deduplication system has been enhanced to intelligently handle institutions with:
- **Multiple locations** serving different communities
- **Multiple phone numbers** for different offices
- **Associated location-specific contact information**

This ensures users receive complete, accurate information in a unified format.

## Key Principles

### 1. Multiple Locations Are Valid
- Different addresses do NOT mean incorrect data
- Same institution may serve multiple communities
- Each location is legitimate and should be presented to the user

### 2. Multiple Phone Numbers Are Expected
- Large institutions have different numbers for different offices
- Phone numbers should be associated with their specific locations when possible
- All contact numbers are preserved and presented

### 3. Unified Presentation
- Consolidate duplicate listings into ONE comprehensive result
- Present ALL locations and phone numbers in an organized format
- Help users identify which location is most relevant for their needs

## How It Works

### Deduplication Logic

**File:** `src/lib/contact-agent/web-search.ts` (lines 415-610)

#### Step 1: Identify Same Institution

Matches contacts by:
1. **Name similarity** (normalized, ignoring common words like "hospital", "medical", etc.)
2. **Phone number** (last 10 digits, any formatting)
3. **Email address** (case-insensitive)

Example matches:
```
"Utah Cancer Registry"
"Utah Cancer Registry at University of Utah Health Sciences"
"Cancer Registry - Utah"
→ All recognized as same institution
```

#### Step 2: Consolidate Information

For each duplicate found:
- **Collect ALL unique phone numbers** → `allPhones[]`
- **Collect ALL unique addresses** → `allAddresses[]`
- **Collect ALL unique cities** → `allCities[]` (for location context)
- **Combine emails** (comma-separated)
- **Merge notes** (preserve all information)

#### Step 3: Format for User

Creates enhanced notes with structured information:

**Multiple Locations Format:**
```
MULTIPLE LOCATIONS - This institution has 4 locations that may serve different communities:
• 250 East 200 South, Suite 1375, Salt Lake City
• 650 Komas Drive, Suite 106B, Salt Lake City
• 546 Chipeta Way, Suite 410, Salt Lake City
• 2000 Circle of Hope, RM LL376, Salt Lake City

[Original notes continue...]
```

**Multiple Phone Numbers Format:**
```
MULTIPLE CONTACT NUMBERS:
• 801-581-8407 (250 East 200 South, Suite 1375)
• 801-581-2234 (650 Komas Drive, Suite 106B)
• 801-585-5555 (546 Chipeta Way, Suite 410)

[Original notes continue...]
```

## AI Presentation Guidelines

**File:** `src/app/api/contact-agent/chat/route.ts` (lines 187-200)

The AI is instructed to:

### ✅ DO:
- Present ALL locations found
- Present ALL phone numbers found
- Explain that multiple locations serve different communities
- Associate phone numbers with specific addresses when available
- Help users identify the most relevant location based on their county/city
- Present information in a unified, easy-to-read format

### ❌ DON'T:
- Suggest that multiple addresses mean incorrect data
- Only show one location when multiple exist
- Hide phone numbers or consolidate them
- Assume the institution has "moved" (they may have expanded)

## Example User Experiences

### Example 1: Multiple Locations - Same Phone

**Search Results Received:**
```json
[
  {
    "name": "Utah Cancer Registry",
    "phone": "801-581-8407",
    "address": "250 East 200 South, Suite 1375",
    "city": "Salt Lake City"
  },
  {
    "name": "Utah Cancer Registry - University of Utah",
    "phone": "801-581-8407",
    "address": "650 Komas Drive, Suite 106B",
    "city": "Salt Lake City"
  },
  {
    "name": "Cancer Registry Utah",
    "phone": "801-581-8407",
    "address": "546 Chipeta Way, Suite 410",
    "city": "Salt Lake City"
  }
]
```

**After Deduplication:**
```json
{
  "name": "Utah Cancer Registry",
  "phone": "801-581-8407",
  "address": "250 East 200 South, Suite 1375",
  "city": "Salt Lake City",
  "email": "ucr.info@hsc.utah.edu",
  "notes": "MULTIPLE LOCATIONS - This institution has 3 locations that may serve different communities:\n• 250 East 200 South, Suite 1375, Salt Lake City\n• 650 Komas Drive, Suite 106B, Salt Lake City\n• 546 Chipeta Way, Suite 410, Salt Lake City\n\n[original notes]"
}
```

**AI Response to User:**
```
I found the Utah Cancer Registry! They have 3 locations in Salt Lake City that may serve different communities:

**Utah Cancer Registry**

📍 **Locations:**
1. 250 East 200 South, Suite 1375, Salt Lake City, UT
2. 650 Komas Drive, Suite 106B, Salt Lake City, UT
3. 546 Chipeta Way, Suite 410, Salt Lake City, UT

📞 **Phone:** 801-581-8407 (same number for all locations)
📧 **Email:** ucr.info@hsc.utah.edu
🌐 **Website:** https://ucr.utah.gov

I recommend calling 801-581-8407 to confirm which location is best for your needs and to verify they can provide the documents you're looking for.
```

### Example 2: Multiple Locations - Different Phones

**Search Results Received:**
```json
[
  {
    "name": "Intermountain Health - Central Campus",
    "phone": "801-442-2000",
    "address": "5121 S Cottonwood St",
    "city": "Murray"
  },
  {
    "name": "Intermountain Health - North Campus",
    "phone": "801-387-7000",
    "address": "389 S 900 E",
    "city": "Salt Lake City"
  },
  {
    "name": "Intermountain Health Medical Records",
    "phone": "801-442-3750",
    "address": "5121 S Cottonwood St",
    "city": "Murray"
  }
]
```

**After Deduplication:**
```json
{
  "name": "Intermountain Health - Central Campus",
  "phone": "801-442-2000",
  "address": "5121 S Cottonwood St",
  "city": "Murray",
  "notes": "MULTIPLE CONTACT NUMBERS:\n• 801-442-2000 (5121 S Cottonwood St)\n• 801-387-7000 (389 S 900 E)\n• 801-442-3750 (5121 S Cottonwood St)\n\nMULTIPLE LOCATIONS - This institution has 2 locations that may serve different communities:\n• 5121 S Cottonwood St, Murray\n• 389 S 900 E, Salt Lake City\n\n[original notes]"
}
```

**AI Response to User:**
```
I found Intermountain Health, which has multiple locations serving different communities:

**Intermountain Health**

📍 **Central Campus (Murray):**
- Address: 5121 S Cottonwood St, Murray, UT
- General: 801-442-2000
- Medical Records: 801-442-3750

📍 **North Campus (Salt Lake City):**
- Address: 389 S 900 E, Salt Lake City, UT
- Phone: 801-387-7000

Since you're looking for medical records, I recommend calling the Medical Records department at 801-442-3750 (Central Campus) to confirm which location has the records you need.
```

### Example 3: Single Location Preserved

**Search Results Received:**
```json
[
  {
    "name": "Washington County Vital Records",
    "phone": "435-634-5744",
    "address": "197 East Tabernacle St",
    "city": "St. George"
  }
]
```

**After Deduplication:**
```json
{
  "name": "Washington County Vital Records",
  "phone": "435-634-5744",
  "address": "197 East Tabernacle St",
  "city": "St. George",
  "notes": "[original notes]"
}
```

**AI Response to User:**
```
I found the Washington County Vital Records office:

**Washington County Vital Records**
📍 **Address:** 197 East Tabernacle St, St. George, UT
📞 **Phone:** 435-634-5744

You can contact them to request birth certificates, death certificates, or other vital records for Washington County.
```

## Technical Implementation

### Data Structure During Processing

```typescript
interface ContactWithTracking extends ContactFromWeb {
  allPhones?: string[];      // ["801-581-8407", "801-585-5555"]
  allAddresses?: string[];   // ["250 E 200 S", "650 Komas Dr"]
  allCities?: string[];      // ["Salt Lake City", "Murray"]
}
```

### Name Normalization

Removes common words to improve matching:
```typescript
"St. Mark's Hospital" → "st marks"
"Saint Mark's Medical Center" → "saint marks"
→ Recognized as same institution
```

### Phone Normalization

```typescript
"(801) 581-8407" → "8015818407"
"801.581.8407"   → "8015818407"
"801-581-8407"   → "8015818407"
→ All match
```

### Association Logic

When same number of phones and addresses:
```typescript
phones[0] → addresses[0]
phones[1] → addresses[1]
// Shows: "801-442-2000 (5121 S Cottonwood St)"
```

When different counts:
```typescript
// Shows all phones and addresses separately
```

## Logging

### Console Output

```
[Deduplication] Reduced 4 results to 1 unique contact(s)
  - Utah Cancer Registry: 3 locations consolidated
  - Utah Cancer Registry: 1 phone numbers consolidated

[Contact Agent] Deduplicated 4 results to 1 unique contact(s)
```

### What This Tells You

- **"Reduced 4 results to 1"** = Found 4 duplicate listings
- **"3 locations consolidated"** = Institution has 3 different addresses
- **"1 phone numbers"** = All locations share same phone number

## Benefits

### ✅ Complete Information
- Users see ALL locations, not just one
- No missing phone numbers or addresses
- Full picture of the institution's presence

### ✅ Community Context
- Explains that multiple locations serve different areas
- Helps users find the nearest/most relevant office
- Acknowledges geographical spread

### ✅ Accurate Associations
- Phone numbers linked to specific locations when possible
- Clear indication when all locations share a number
- Organized, scannable format

### ✅ No False "Moves"
- Doesn't assume institution relocated
- Recognizes expansion and multi-location operations
- Respects institutional structure

### ✅ User-Friendly Presentation
- Single, consolidated result (not duplicates)
- Structured notes that are easy to parse
- AI presents information clearly with formatting

## Configuration

No configuration needed - works automatically!

### To Adjust Behavior

**More aggressive deduplication** (match more variations):
```typescript
// In web-search.ts, line 452-454
const nameMatch = existingNameNorm.includes(normalizedName) || // More lenient
                 normalizedName.includes(existingNameNorm);
```

**Less aggressive deduplication** (match fewer variations):
```typescript
// In web-search.ts, line 452
const nameMatch = existingNameNorm === normalizedName; // Exact match only
```

**Disable location consolidation** (show as separate results):
```typescript
// In web-search.ts, line 415
export function deduplicateContacts(contacts: ContactFromWeb[]): ContactFromWeb[] {
  return contacts; // No deduplication
}
```

## Testing

### Test Cases

1. **Institution with moved offices:**
   ```
   "LDS Hospital medical records" (historical addresses)
   ```

2. **Institution with multiple campuses:**
   ```
   "Intermountain Healthcare"
   "University of Utah Health"
   ```

3. **Statewide registry:**
   ```
   "Utah Cancer Registry" (multiple office locations)
   ```

4. **County offices:**
   ```
   "Salt Lake County vital records" (may have multiple offices)
   ```

### Expected Results

✅ One consolidated contact per institution
✅ All locations listed in notes
✅ All phone numbers preserved
✅ Phone-to-location associations when available
✅ AI mentions "multiple locations serving different communities"

## Edge Cases Handled

### 1. Same Institution, Different Names
```
"St. Mark's Hospital"
"Saint Mark's Medical Center"
"St Mark's"
→ All consolidated
```

### 2. Same Phone, Different Addresses
```
Same contact number, different locations
→ All addresses preserved, single phone shown
```

### 3. Different Phones, Same Address
```
Different departments at same location
→ Shows multiple phone numbers for that address
```

### 4. No Duplicates
```
All contacts are unique institutions
→ No consolidation, all returned as-is
```

### 5. Partial Information
```
Some contacts missing phone or address
→ Preserves all non-null information
```

## Future Enhancements

### Potential Improvements:

1. **Geocoding Integration:**
   - Calculate distance from user's location
   - Recommend nearest office
   - Show on map

2. **Department Recognition:**
   - Identify "Medical Records Department" as specific contact
   - Separate main number from department numbers
   - Highlight most relevant contact

3. **Operating Hours:**
   - Parse hours from notes
   - Show which location is currently open
   - Time zone awareness

4. **Smart Location Selection:**
   - If user is in Washington County, highlight that location
   - County-based filtering of multi-location results
   - Proximity-based ranking

## Summary

The enhanced deduplication system:

✅ **Preserves all locations** - Multiple addresses are valid and useful
✅ **Tracks all phone numbers** - Different numbers for different offices
✅ **Associates contacts with locations** - Phone → Address mapping when possible
✅ **Presents unified results** - Single contact record, all information included
✅ **Guides the AI** - Clear instructions on how to present multiple locations
✅ **Respects institutional structure** - Doesn't assume moves or errors

**Result:** Users get complete, accurate information about institutions with multiple locations serving different communities, presented in a clear, organized format!

---

**Files Modified:**
- `src/lib/contact-agent/web-search.ts` (enhanced deduplication function)
- `src/app/api/contact-agent/chat/route.ts` (updated AI instructions for presenting multiple locations)

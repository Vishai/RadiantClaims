# PDF Form Calibration Status

## Summary

We are building a PDF form filling system for the RECA (Radiation Exposure Compensation Act) Downwinder Claim Form. Since the PDF is not fillable, we overlay text at precise coordinates using character-by-character spacing to align with the pre-printed boxes on the form.

## Current Progress

### ✅ Completed Calibration

**Page 0 (Page 1 in PDF viewer)** - Part 1: YOU, the person filling out this form
- ✓ First Name, Middle Name, Last Name (with 18pt character spacing)
- ✓ Former Names
- ✓ SSN (split into 3 segments: XXX-XX-XXXX)
- ✓ Date of Birth (split into 3 segments: MM/DD/YYYY)
- ✓ Mailing Address (2 lines with character spacing)
- ✓ City, State, Zip Code
- ✓ Phone Day & Evening (split into 3 segments each: XXX-XXX-XXXX)
- ✓ Email Address

**Page 1 (Page 2 in PDF viewer)** - Part 1 continued & Part 2
- ✓ Residence Address (2 lines)
- ✓ Tribal Affiliation
- ✓ Tribal Census Number
- ✓ Tribal Assistance checkboxes (Navajo, Other, No)
- ✓ Part 2: THE CLAIMANT
  - First Name, Middle Name, Last Name, Former Names
  - SSN (3 segments)
  - Date of Birth (3 segments)
  - Date of Death (3 segments)

**Page 2 (Page 3 in PDF viewer)** - Part 3: Relationship
- ✓ All 6 relationship checkboxes calibrated:
  - Self, Spouse, Child (left column)
  - Parent, Grandchild, Grandparent (right column)

### 🔧 Technical Improvements Made

1. **Segmented Fields**: SSN, DOB, DOD, and phone numbers are split into independent segments to work around pre-printed dashes and slashes
2. **Character Spacing**: Implemented precise 18pt spacing for character-by-character box alignment
3. **Helper Methods**:
   - `drawSSN()` - handles 3-part SSN formatting
   - `drawPhone()` - handles 3-part phone formatting
   - `drawDate()` - handles 3-part date formatting
   - `drawTextInBoxes()` - character-by-character rendering
4. **Calibration Tools**:
   - Fine-grid overlay script (10pt grid, labeled every 20pts)
   - Regeneration script for quick testing
   - Coordinate parser for converting measurements

## ❌ Missing Parts (CRITICAL GAPS)

The current `pdf-form-filler.ts` jumps from **Part 3** directly to **Part 8**, skipping major sections:

### Missing: Part 4
**Status**: Not defined in types or form filler
**Need**: Determine if Part 4 exists on the form

### Missing: Part 5 - SURVIVING SPOUSE
**Location**: Unknown page
**Fields Needed**:
- Spouse name fields
- Marriage information
- Documentation of relationship
- Checkboxes/dates for proof

### Missing: Part 6 - SURVIVING CHILD
**Location**: Unknown page
**Fields Needed**:
- Child name fields
- Birth information
- Parent information
- Documentation checkboxes

### Missing: Part 7 - OTHER RELATIVES
**Location**: Unknown page
**Fields Needed**:
- Relative type selection
- Relationship documentation
- Proof of dependency
- Contact information

### Missing: Part 8 - EXPOSURE (Partially Complete)
**Location**: Pages 5-6 (0-indexed)
**Current Status**:
- ✓ Checkboxes for exposure options (page 5)
- ✓ Location fields for Idaho, New Mexico, Utah (page 6)
- ✓ Arizona counties (6 entries)
- ✓ Nevada counties (6 entries)
**Missing**:
- Need to verify all location fields are present
- May need additional states/counties

### Missing: Part 9 - PROOF OF PRESENCE
**Location**: Unknown page
**Fields Needed**:
- Documentation type checkboxes
- Upload/attachment indicators
- Description fields
- Date ranges

### Missing: Part 10 - COMPENSABLE DISEASES (Partially Complete)
**Location**: Page 8 (0-indexed)
**Current Status**:
- ✓ 19 disease checkboxes defined
**Missing**:
- Need to verify all diseases are accounted for
- Documentation fields may be needed

### Missing: Part 11 - PROOF OF DISEASE
**Location**: Unknown page
**Fields Needed**:
- Medical record checkboxes
- Physician information
- Diagnosis dates
- Documentation type

### Missing: Part 12 - PREVIOUS PAYMENTS
**Location**: Unknown page
**Fields Needed**:
- Previous claim information
- Payment amounts
- Dates received
- Reference numbers

### Missing: Part 13 - ATTORNEY REPRESENTATION
**Location**: Unknown page
**Fields Needed**:
- Attorney name
- Firm information
- Bar number
- Contact details
- Fee agreement checkbox

### Missing: Part 14 - ATTORNEY ACKNOWLEDGMENT
**Location**: Unknown page
**Fields Needed**:
- Attorney signature area (notation only)
- Date field
- Certification checkboxes

### Missing: Part 15 - LEGAL GUARDIAN
**Location**: Unknown page
**Fields Needed**:
- Guardian name
- Relationship to claimant
- Court documentation
- Contact information

### Missing: Part 16 - SIGNATURE (Partially Complete)
**Location**: Page 12 (0-indexed)
**Current Status**:
- ✓ Signature date field
**Missing**:
- Signature area (notation only - can't auto-sign)
- Certification checkbox
- Under penalty of perjury statement

## Next Steps

### Immediate (Pages 0-2 Complete)
1. ✅ Page 0 fully calibrated
2. ✅ Page 1 fully calibrated
3. ✅ Page 2 fully calibrated
4. **Next**: Identify and map all remaining pages

### Phase 2: Map Missing Parts
1. Review complete RECA PDF to identify all pages
2. Create field coordinate entries for Parts 4-7, 9, 11-15
3. Add corresponding TypeScript type definitions if missing
4. Create test data for each section

### Phase 3: Calibration
1. Generate calibration grids for remaining pages
2. Add test data for each part
3. Adjust coordinates for precise alignment
4. Test with real-world data

### Phase 4: Validation
1. Complete end-to-end testing
2. Verify all required fields are fillable
3. Check edge cases (long names, special characters)
4. Document any limitations

## Files Modified

- `src/lib/reca/pdf-form-filler.ts` - Main form filler with coordinates
- `src/lib/reca/types.ts` - Form data type definitions
- `scripts/regenerate-test-pdf.ts` - Quick test regeneration
- `scripts/calibrate-pdf-coordinates-fine.ts` - Fine grid generator
- `scripts/parse-pdf-coordinates.ts` - Coordinate calculator
- `docs/COORDINATE_ADJUSTMENT_GUIDE.md` - Reference guide

## Key Measurements

- **Character Spacing**: 18pt (consistent across name/address fields)
- **Page Dimensions**: 612 x 792 points (US Letter)
- **Font**: Courier (monospace) at 12pt for most fields
- **Grid**: 10pt spacing for calibration
- **Coordinate System**: (0,0) at bottom-left, Y increases upward

## Test Data Coverage

Currently testing:
- ✓ Part 1: Personal information
- ✓ Part 2: Claimant (deceased) information
- ✓ Part 3: Relationship (spouse)
- ✓ Part 8: Exposure locations (Idaho, Arizona, Nevada)
- ✓ Part 10: Diseases (lung, thyroid, leukemia)
- ✓ Part 16: Signature date

Missing test data:
- Parts 4-7, 9, 11-15 (not yet implemented)

## Questions to Resolve

1. Does Part 4 exist on the form?
2. What pages contain Parts 5-7?
3. What pages contain Parts 9, 11-15?
4. Are there any multi-page parts beyond Part 8?
5. Are there optional sections that may not apply to all claimants?
6. Do any fields require special formatting beyond dates/SSN/phone?

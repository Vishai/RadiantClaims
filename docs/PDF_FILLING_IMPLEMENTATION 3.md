# PDF Form Filling Implementation Summary

## What We Built

A system to **fill out the official RECA Downwinder Claim Form PDF** by overlaying text at precise coordinates, since the official PDF doesn't have fillable form fields.

## Why This Approach?

❌ **Original approach**: Generated a custom summary PDF
❌ **Problem**: Government won't accept substitute PDFs
✅ **Solution**: Fill out the actual official form with user's data

## Key Components

### 1. PDF Form Filler (`src/lib/reca/pdf-form-filler.ts`)
- Loads the official RECA PDF
- Overlays text at specific coordinates
- Handles different field types:
  - Regular text fields
  - Character-boxed fields (SSN, names)
  - Date fields (auto-formats to MM/DD/YYYY)
  - Checkboxes (draws X marks)
- Returns filled PDF as bytes

### 2. Coordinate Calibration Tool (`scripts/calibrate-pdf-coordinates.ts`)
- Generates a grid overlay on the PDF
- Shows X/Y coordinates every 50 points
- Helps you find exact positions for form fields
- Output: `docs/test-output/calibration-grid.pdf`

### 3. Test Script (`scripts/test-pdf-form-filling.ts`)
- Tests form filling with sample data
- Generates: `docs/test-output/filled-reca-form-test.pdf`
- Allows you to verify coordinate accuracy

### 4. Coordinate Mapping
Pre-mapped coordinates for:
- ✅ Part 1: Filer information
- ✅ Part 2: Claimant information
- ✅ Part 3: Relationship selection
- ⏳ Parts 4-16: Still need mapping (see guide)

## How It Works

```typescript
// 1. Load official PDF
const pdfBytes = fs.readFileSync('RECA Downwinder Claim Form.pdf');
const pdfDoc = await PDFDocument.load(pdfBytes);

// 2. Get pages and embed fonts
const pages = pdfDoc.getPages();
const font = await pdfDoc.embedFont(StandardFonts.Courier);

// 3. Draw text at specific coordinates
pages[0].drawText('JOHN', {
  x: 50,    // Distance from left edge
  y: 575,   // Distance from bottom edge
  size: 10,
  font,
});

// 4. Save filled PDF
return await pdfDoc.save();
```

## Current Status

### ✅ Completed
1. PDF form filler service created
2. Coordinate mapping system implemented
3. Calibration tool working
4. Test framework in place
5. Documentation written
6. Parts 1-3 coordinates mapped

### ⏳ Next Steps
1. **Map coordinates for Parts 4-16**
   - Use calibration grid
   - Test each section
   - Update FIELD_COORDINATES in pdf-form-filler.ts

2. **Integrate with your existing workflow**
   - Replace current PDF generation
   - Update download endpoint
   - Test with real form data

3. **Add supporting forms** (pages 14-17)
   - Medical Information Release
   - Certification of Identity
   - Tribal Records Release
   - Surviving Beneficiaries Signatures

## Usage

### For Development (Mapping Coordinates)

```bash
# 1. Generate calibration grid
npx tsx scripts/calibrate-pdf-coordinates.ts

# 2. Open calibration-grid.pdf and find coordinates

# 3. Add coordinates to FIELD_COORDINATES in pdf-form-filler.ts

# 4. Test with sample data
npx tsx scripts/test-pdf-form-filling.ts

# 5. Verify filled-reca-form-test.pdf looks correct
```

### For Production (In Your App)

```typescript
import { fillOfficialRECAPDF } from '@/lib/reca/pdf-form-filler';
import path from 'path';

// In your API route or service
const filledPdfBytes = await fillOfficialRECAPDF({
  formData: session.formData,           // From your form wizard
  supportingForms: session.supportingForms,
  sessionId: session.id,
  officialPdfPath: path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf'),
});

// Return to user or save to S3/R2
return new Response(filledPdfBytes, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="reca-claim-form.pdf"',
  },
});
```

## Files Created

```
src/lib/reca/
  ├── pdf-form-filler.ts              # Main form filling service
  └── pdf-generator.ts                # Old summary generator (keep for reference)

scripts/
  ├── calibrate-pdf-coordinates.ts    # Calibration tool
  ├── test-pdf-form-filling.ts        # Test script
  └── inspect-pdf-fields.ts           # Existing field inspector

docs/
  ├── PDF_FILLING_IMPLEMENTATION.md   # This file
  ├── PDF_FORM_FILLING_GUIDE.md       # Detailed mapping guide
  └── test-output/
      ├── calibration-grid.pdf        # Grid overlay for finding coordinates
      └── filled-reca-form-test.pdf   # Test output
```

## Technical Details

### Coordinate System
- **Origin**: Bottom-left corner
- **Units**: Points (1/72 inch)
- **Page size**: 612 × 792 points (US Letter)
- **Y-axis**: 0 = bottom, 792 = top ⚠️ (inverted from most graphics programs)

### Font
Using **Courier** for monospace characters (important for boxed fields)

### Field Types

| Type | Description | Example |
|------|-------------|---------|
| Text | Regular text field | Email, address |
| Boxed | One character per box | Name, SSN |
| Date | MM/DD/YYYY format | Birth date |
| Checkbox | X mark | Relationship selection |

## Benefits

✅ Users get official form pre-filled with their data
✅ No manual transcription needed
✅ Reduces errors
✅ Government accepts the official form
✅ Users only need to sign and mail

## Coordinate Mapping Progress

| Part | Description | Status | Pages |
|------|-------------|--------|-------|
| Part 1 | Filer information | ✅ Done | 1-2 |
| Part 2 | Claimant info | ✅ Done | 2 |
| Part 3 | Relationship | ✅ Done | 3 |
| Part 4 | Self-filer docs | ⏳ TODO | 3 |
| Part 5 | Surviving spouse | ⏳ TODO | 3-4 |
| Part 6 | Surviving child | ⏳ TODO | 4-6 |
| Part 7 | Other relatives | ⏳ TODO | 6 |
| Part 8 | Exposure | ⏳ TODO | 6-7 |
| Part 9 | Proof of presence | ⏳ TODO | 8 |
| Part 10 | Diseases | ⏳ TODO | 9 |
| Part 11 | Proof of disease | ⏳ TODO | 9-10 |
| Part 12 | Previous payments | ⏳ TODO | 10 |
| Part 13 | Attorney rep | ⏳ TODO | 11 |
| Part 14 | Attorney ack | ⏳ TODO | 12 |
| Part 15 | Legal guardian | ⏳ TODO | 12 |
| Part 16 | Signature | ⏳ TODO | 13 |
| Support | Supporting forms | ⏳ TODO | 14-17 |

## Estimated Time to Complete

- **Coordinate mapping**: ~4-6 hours (all parts)
- **Testing & refinement**: ~2-3 hours
- **Integration**: ~1-2 hours
- **Total**: ~8-12 hours

## Tips for Success

1. **Work section by section** - Don't try to map everything at once
2. **Test frequently** - Run test script after mapping each part
3. **Use the calibration grid** - It makes finding coordinates much easier
4. **Start with simple fields** - Text fields before complex multi-line sections
5. **Double-check checkboxes** - Position matters for legibility

## Support & Resources

- **PDF-lib docs**: https://pdf-lib.js.org/docs/api/
- **Calibration tool**: `npx tsx scripts/calibrate-pdf-coordinates.ts`
- **Test script**: `npx tsx scripts/test-pdf-form-filling.ts`
- **Detailed guide**: `docs/PDF_FORM_FILLING_GUIDE.md`

## Questions?

Refer to `PDF_FORM_FILLING_GUIDE.md` for detailed instructions on:
- How to find coordinates
- Field type configurations
- Troubleshooting common issues
- Integration patterns

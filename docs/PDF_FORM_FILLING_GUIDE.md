# RECA PDF Form Filling Guide

## Overview

Since the official RECA Downwinder Claim Form PDF doesn't have fillable fields, we overlay text directly onto the PDF at specific coordinates. This guide explains how to map and calibrate coordinates for each form field.

## Architecture

### Files
- **`src/lib/reca/pdf-form-filler.ts`**: Main form filling service
- **`scripts/test-pdf-form-filling.ts`**: Test script with sample data
- **`scripts/calibrate-pdf-coordinates.ts`**: Generates calibration grid
- **`docs/test-output/`**: Output directory for test PDFs

### Coordinate System
- **Origin**: Bottom-left corner of each page
- **X-axis**: 0 (left) to 612 (right)
- **Y-axis**: 0 (bottom) to 792 (top)
- **Page size**: US Letter (8.5" × 11" at 72 DPI)

⚠️ **Important**: Y-axis is inverted from most graphics programs! 0 is at the BOTTOM.

## Workflow for Mapping Coordinates

### Step 1: Generate Calibration Grid
```bash
npx tsx scripts/calibrate-pdf-coordinates.ts
```
This creates `docs/test-output/calibration-grid.pdf` with coordinate overlays.

### Step 2: Find Field Coordinates
1. Open the calibration grid PDF
2. Locate the form field you want to map
3. Read the coordinates:
   - **X**: Red horizontal numbers (distance from left edge)
   - **Y**: Blue vertical numbers (distance from bottom edge)
4. Note the coordinates

### Step 3: Add to FIELD_COORDINATES
Edit `src/lib/reca/pdf-form-filler.ts`:

```typescript
const FIELD_COORDINATES: Record<string, FieldCoordinate> = {
  'part1.firstName': {
    page: 0,              // Page number (0-indexed)
    x: 50,                // X coordinate
    y: 575,               // Y coordinate
    fontSize: 10,         // Font size
    characterSpacing: 11, // For boxed character fields
  },
  // ... more fields
};
```

### Step 4: Test Your Coordinates
```bash
npx tsx scripts/test-pdf-form-filling.ts
```
This generates `docs/test-output/filled-reca-form-test.pdf` with sample data.

### Step 5: Verify and Adjust
1. Open the filled test PDF
2. Check if text aligns properly with form fields
3. Adjust coordinates in `FIELD_COORDINATES` if needed
4. Re-run test until perfect

## Field Types

### Regular Text Fields
```typescript
'part1.email': {
  page: 0,
  x: 50,
  y: 320,
  fontSize: 10,
  maxWidth: 500,  // Truncates text if too long
}
```

### Character-Boxed Fields
For forms with individual boxes per character (names, SSN):
```typescript
'part1.firstName': {
  page: 0,
  x: 50,
  y: 575,
  fontSize: 10,
  characterSpacing: 11,  // Space between characters
}
```

### Date Fields
```typescript
'part1.dob': {
  page: 0,
  x: 300,
  y: 485,
  fontSize: 10,
  type: 'date',
  characterSpacing: 11,
}
```
Automatically formats dates as MM/DD/YYYY with character spacing.

### Checkboxes
```typescript
'part3.spouse': {
  page: 2,
  x: 42,
  y: 650,
  type: 'checkbox',
}
```
Draws an "X" at the specified position.

## Coordinate Mapping Status

### ✅ Completed
- **Part 1**: Filer information (Pages 1-2)
- **Part 2**: Claimant information (Page 2)
- **Part 3**: Relationship checkboxes (Page 3)

### ⏳ To Do
- **Part 4**: Self-filer documents (Page 3)
- **Part 5**: Surviving spouse (Pages 3-4)
- **Part 6**: Surviving child (Pages 4-6)
- **Part 7**: Other relatives (Page 6)
- **Part 8**: Exposure information (Pages 6-7)
- **Part 9**: Proof of presence (Page 8)
- **Part 10**: Compensable diseases (Page 9)
- **Part 11**: Proof of disease (Pages 9-10)
- **Part 12**: Previous payments (Page 10)
- **Part 13**: Attorney representation (Page 11)
- **Part 14**: Attorney acknowledgment (Page 12)
- **Part 15**: Legal guardian (Page 12)
- **Part 16**: Signature (Page 13)
- **Supporting forms**: Pages 14-17

## Tips for Accurate Mapping

### Finding X Coordinate
- Start slightly left of the first character position
- For boxed fields, align with the left edge of the first box
- Test with long text to ensure it doesn't overflow

### Finding Y Coordinate
- Position at the text baseline (where letters sit)
- For boxed fields, center vertically within the box
- Too high = text appears above the line
- Too low = text appears below the line

### Character Spacing
- Measure the distance between box centers
- Usually 10-13 points for standard forms
- Test with full-length text (SSN: 9 chars, names: varies)

### Checkboxes
- Position at center of checkbox
- Typically 1-2 points down and right from top-left corner

## Testing Strategy

1. **Start with one section** (e.g., Part 1)
2. **Map 2-3 fields** at a time
3. **Test immediately** with `test-pdf-form-filling.ts`
4. **Adjust and repeat** until perfect
5. **Move to next section**

## Integration with Form Workflow

Once all coordinates are mapped, update your form submission API to use the form filler:

```typescript
import { fillOfficialRECAPDF } from '@/lib/reca/pdf-form-filler';

// In your API route
const filledPdfBytes = await fillOfficialRECAPDF({
  formData: session.formData,
  supportingForms: session.supportingForms,
  sessionId: session.id,
  officialPdfPath: path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf'),
});

// Save or return the filled PDF
```

## Troubleshooting

### Text Not Appearing
- Check page index (0-indexed)
- Verify coordinates are within bounds (0-612 x, 0-792 y)
- Ensure font is embedded

### Text Misaligned
- Use calibration grid to verify coordinates
- Remember Y-axis is bottom-to-top
- Check if characterSpacing is set correctly

### Text Too Large/Small
- Adjust fontSize in coordinates
- Standard sizes: 8-12 pt

### Text Truncated
- Increase maxWidth
- Check for text wrapping needs

## Next Steps

1. **Map remaining coordinates** for Parts 4-16
2. **Test each section** thoroughly
3. **Add multi-line text support** if needed
4. **Handle edge cases** (long names, missing data)
5. **Integrate with download workflow**
6. **Add supporting forms** (pages 14-17)

## Resources

- PDF Coordinate System: https://pdf-lib.js.org/docs/api/
- Official RECA Form: `docs/RECA Downwinder Claim Form.pdf`
- Calibration Grid: `docs/test-output/calibration-grid.pdf`
- Test Output: `docs/test-output/filled-reca-form-test.pdf`

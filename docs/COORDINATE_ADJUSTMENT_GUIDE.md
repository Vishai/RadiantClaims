# PDF Coordinate Adjustment Guide

Quick reference for fine-tuning PDF form field coordinates.

## Quick Start

1. **Edit coordinates** in `src/lib/reca/pdf-form-filler.ts` (lines 46-165)
2. **Regenerate PDF** by running:
   ```bash
   npx tsx scripts/regenerate-test-pdf.ts
   ```
3. **Check alignment** in the generated PDF
4. **Repeat** until perfect!

## Understanding Coordinates

PDF coordinate system (different from graphics programs!):
- **Origin (0,0)**: Bottom-left corner
- **X-axis**: 0 = left edge, 612 = right edge
- **Y-axis**: 0 = bottom, 792 = top (⚠️ inverted!)

## Adjustment Tips

### If text is misaligned:

| Problem | Solution |
|---------|----------|
| Text too far **LEFT** | Increase `x` by 1-2 points |
| Text too far **RIGHT** | Decrease `x` by 1-2 points |
| Text too **HIGH** | Decrease `y` by 1-2 points |
| Text too **LOW** | Increase `y` by 1-2 points |
| Characters too **CRAMPED** | Increase `characterSpacing` |
| Characters too **SPREAD OUT** | Decrease `characterSpacing` |

### Current settings (from calibration):
- **Character spacing**: 14 points (consistent across Part 1)
- **Font size**: 10 points
- **Font**: Courier (monospace)

## Example Coordinate Entry

```typescript
'part1.firstName': {
  page: 0,              // Page number (0-indexed)
  x: 100,               // Horizontal position (left edge of first box)
  y: 443,               // Vertical position (text baseline)
  fontSize: 10,         // Font size (optional, default: 10)
  characterSpacing: 14, // Space between characters (for box forms)
  maxWidth: 252,        // Maximum width (optional)
},
```

## Calibration Grid Reference

Use the calibration grid to measure coordinates:
- **Red numbers** = X coordinates (horizontal)
- **Blue numbers** = Y coordinates (vertical)
- **Grid lines every 10 points** for precision
- **Labels every 20 points** for readability

Generate calibration grid:
```bash
npx tsx scripts/calibrate-pdf-coordinates-fine.ts
```

Output: `docs/test-output/calibration-grid-fine.pdf`

## Testing Workflow

1. Open calibration grid and form side-by-side
2. Identify the coordinate where text should start
3. Update `FIELD_COORDINATES` in `pdf-form-filler.ts`
4. Run: `npx tsx scripts/regenerate-test-pdf.ts`
5. Check alignment in generated PDF
6. Fine-tune by ±1-2 points if needed
7. Repeat steps 4-6 until perfect

## Character Box Fields

Fields with individual boxes per character require:
- `characterSpacing` property set to 14 points
- Starting `x` coordinate at the LEFT edge of the first box
- `y` coordinate at the text baseline (not top or middle of box)

Examples:
- Name fields (First, Middle, Last)
- SSN (XXX-XX-XXXX format)
- Date of Birth (MM/DD/YYYY format)
- Phone numbers (XXX-XXX-XXXX format)
- Email addresses
- Addresses

## Common Measurements (Page 1)

| Field | X | Y | Spacing | Max Chars |
|-------|---|---|---------|-----------|
| First Name | 100 | 443 | 14 | 18 |
| Middle Name | 400 | 443 | 14 | 14 |
| Last Name | 100 | 403 | 14 | 34 |
| Former Name | 100 | 363 | 14 | 34 |
| SSN | 100 | 303 | 14 | 11 |
| Date of Birth | 400 | 303 | 14 | 10 |
| Mailing Address | 100 | 263 | 14 | 35 |
| Address Line 2 | 100 | 223 | 14 | 35 |
| City | 100 | 183 | 14 | 22 |
| State | 470 | 183 | 14 | 2 |
| Zip Code | 540 | 183 | 14 | 10 |
| Phone (Day) | 100 | 143 | 14 | 12 |
| Phone (Evening) | 400 | 143 | 14 | 12 |
| Email | 100 | 103 | 14 | 35 |

## Troubleshooting

### Characters don't fit in boxes
- Check `characterSpacing` - should be 14 for RECA form
- Verify starting `x` coordinate is at left edge of first box
- Ensure font size is 10 (matches box height)

### Text is cut off
- Check `maxWidth` property
- Count the number of character boxes
- Calculate: `maxWidth = characterSpacing × numberOfBoxes`

### Y-axis confusion
Remember: In PDFs, Y increases going UP (opposite of web/graphics)
- 0 = bottom of page
- 792 = top of page

### Wrong page
- Pages are 0-indexed (first page = 0, second = 1, etc.)
- Check which page the field appears on in the original PDF

## Need Help?

If you're stuck or need coordinates for other pages:
1. Generate calibration grid for that page
2. Take a screenshot with measurements visible
3. Share the screenshot for analysis
4. Update coordinates based on grid readings

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `regenerate-test-pdf.ts` | Quick PDF regeneration for testing |
| `calibrate-pdf-coordinates-fine.ts` | Generate fine calibration grid |
| `parse-pdf-coordinates.ts` | Calculate spacing from measurements |
| `test-pdf-form-filling.ts` | Full test with all form sections |

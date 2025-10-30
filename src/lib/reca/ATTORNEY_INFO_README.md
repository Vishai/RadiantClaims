# RECA Attorney Information Configuration

## Overview

RadiantClaims provides document preparation services and partners with licensed attorneys to provide legal representation for RECA claims. Users of the service automatically opt-in to attorney representation as part of the service.

## Configuration File

**Location**: `src/lib/reca/attorney-info.ts`

This file contains the default attorney information that will be pre-filled in Part 13 of the RECA claim form.

## How to Update Attorney Information

1. Open `src/lib/reca/attorney-info.ts`
2. Update the `DEFAULT_ATTORNEY_INFO` object with your partner law firm's information:

```typescript
export const DEFAULT_ATTORNEY_INFO = {
  hasAttorney: "YES" as const,
  attorneyFirstName: "John",              // Update with actual first name
  attorneyLastName: "Doe",                // Update with actual last name
  attorneyFirm: "Doe & Associates PLLC", // Update with firm name
  attorneyAddress: "123 Main Street",     // Update with street address
  attorneyCity: "Salt Lake City",         // Update with city
  attorneyState: "UT",                    // Update with state (2-letter code)
  attorneyZip: "84101",                   // Update with zip code
  attorneyPhone: "555-123-4567",          // Update with phone number
  attorneyFax: "555-123-4568",            // Optional fax number
  attorneyEmail: "john@doelaw.com",       // Optional email address
};
```

## Important Notes

### Field Editability

By default, attorney information fields are **read-only** for users (`ATTORNEY_INFO_EDITABLE = false`).

This is intentional because:
- Users of RadiantClaims are automatically opting into the service's attorney representation
- The attorney information should be consistent across all claims
- Prevents users from accidentally modifying required legal representation details

To allow users to edit attorney information (not recommended):
```typescript
export const ATTORNEY_INFO_EDITABLE = true;
```

### Attorney Fee Structure

The default fee type is set to `initial_2_percent` for first-time RECA claims:

```typescript
export const DEFAULT_ATTORNEY_FEE_TYPE = "initial_2_percent" as const;
```

This represents the 2% attorney fee limit for initial RECA claims as mandated by federal law.

## Workflow Integration

### Part 13 (Attorney Representation)
- Pre-fills with `DEFAULT_ATTORNEY_INFO`
- Shows user that attorney representation is included with RadiantClaims service
- Displays attorney information as read-only (if `ATTORNEY_INFO_EDITABLE = false`)
- Explains that RECA Program will communicate with the attorney

### Part 14 (Attorney Acknowledgment)
- Uses `DEFAULT_ATTORNEY_FEE_TYPE` to pre-select the 2% fee option
- Attorney signature required (to be completed by partner law firm)

## Legal Compliance

### RECA Attorney Fee Limits

Federal law (42 U.S.C. § 2210 note) limits attorney fees for RECA claims:
- **2% for initial claims**: First-time filing of a RECA claim
- **10% for resubmissions**: Re-filing a previously denied claim OR representation contracts made before July 10, 2000

RadiantClaims uses the 2% initial claim structure.

### Disclosure Requirements

Users are informed:
1. Attorney representation is included with the RadiantClaims service
2. The 2% fee limitation applies to their claim
3. All RECA Program communications will go to the attorney
4. RadiantClaims and partner firm will keep them informed

## Testing

After updating attorney information:

1. **Test the form flow**:
   ```bash
   pnpm dev
   ```
   Navigate to a RECA claim and verify Part 13 shows the updated attorney information

2. **Verify pre-fill**:
   - Start a new RECA claim
   - Navigate to Part 13
   - Confirm all attorney fields are pre-populated correctly

3. **Check read-only behavior**:
   - Attempt to edit attorney fields
   - Should be disabled if `ATTORNEY_INFO_EDITABLE = false`

## Support

For questions about attorney configuration, contact:
- Technical issues: development team
- Legal questions: partner law firm
- Service questions: RadiantClaims support

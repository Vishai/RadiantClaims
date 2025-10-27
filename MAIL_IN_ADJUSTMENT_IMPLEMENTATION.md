# Mail-In Adjustment Implementation Summary

## Overview

This implementation adds support for the temporary mail-in document submission process that will be used until the DOJ digital portal opens in December 2025.

## Process Flow

### Current Process (Temporary until December)

1. **Upload Digital Copies** - Clients take photos/scans of all documents and upload them through the portal
2. **Firm Validates** - Staff reviews digital uploads to ensure completeness and correctness
3. **Lawyer Review** - Lawyer performs "rubber stamp" approval of printed copies
4. **Client Mails Originals** - Clients receive prepaid envelope with instructions and mail required originals/certified copies to DOJ

### Key Features

- **Jurisdiction-Specific Requirements**: System shows state/county-specific document requirements with helpful links
- **Clear Messaging**: Prominent explanation of why this process is necessary and how it works
- **Original Document Tracking**: Each document type clearly indicates if originals/certified copies are required
- **Email Notifications**: Automated emails at each stage keep clients informed
- **Service-Oriented**: Designed to be convenient and user-friendly

## Database Changes

### Schema Updates (`prisma/schema.prisma`)

#### 1. Extended `FileStatus` Enum
```prisma
enum FileStatus {
  UPLOADING
  PROCESSING
  READY
  FAILED
  REJECTED
  VALIDATED        // Staff validated the digital copy
  AWAITING_REVIEW  // Ready for lawyer review
  APPROVED         // Lawyer approved for submission
}
```

#### 2. Enhanced `UploadedFile` Model
Added fields:
- `requiresOriginal` - Boolean flag indicating if document needs original/certified copy
- `validatedBy` - Staff member who validated
- `validatedAt` - Validation timestamp
- `reviewedBy` - Lawyer who reviewed
- `reviewedAt` - Review timestamp
- `reviewNotes` - Notes from review process

#### 3. Extended `PacketStatus` Enum
```prisma
enum PacketStatus {
  GENERATING
  READY
  DELIVERED
  FAILED
  PRINTED           // Digital copies printed for review
  READY_TO_MAIL     // Approved and ready for client to mail
  MAILED_BY_CLIENT  // Client confirmed they mailed it
}
```

#### 4. Enhanced `PacketSubmission` Model
Added fields:
- `printedAt` - When digital copies were printed
- `printedBy` - Staff who printed
- `mailingInstructions` - Custom instructions for claimant
- `trackingNumber` - Prepaid envelope tracking number
- `prepaidEnvelopeIssued` - Boolean flag for envelope status

#### 5. New `JurisdictionRequirement` Model
Stores state/county-specific document requirements:
- `state` - State code (e.g., "UT", "NV")
- `county` - Optional county specification
- `documentCategory` - Maps to FileCategory
- `requiresOriginal` - Whether original is required
- `specificInstructions` - Custom instructions for this jurisdiction
- `helpfulLinks` - JSON array of helpful links
- `exampleDocuments` - JSON array of examples

#### 6. Extended `EmailType` Enum
Added new email types:
- `DOCUMENT_VALIDATED` - When documents pass validation
- `READY_TO_MAIL` - When packet is ready for client to mail

## Code Changes

### 1. Jurisdiction Requirements System

**File**: `src/lib/jurisdiction-requirements.ts`

Defines jurisdiction-specific requirements with:
- Default requirements for all jurisdictions
- State-specific configurations (Utah, Nevada, Arizona)
- Helper functions to get requirements, check if originals needed
- State-specific resource links for obtaining documents
- Process explanation text

### 2. Updated Document Checklist

**File**: `src/lib/document-checklist.ts`

Changes:
- Added `requiresOriginal` field to `DocumentRequirement` interface
- Added `originalNote` field for explaining original requirements
- Updated all document requirements with original/certified copy requirements
- Added guidance tips about obtaining certified copies

### 3. Mail-In Process Banner Component

**File**: `src/components/mail-in-process-banner.tsx`

New component that displays:
- Explanation of why the process is necessary
- Three-step process visualization with icons
- Benefits of this approach
- Temporary nature until December portal launch

### 4. Updated Document Checklist Component

**File**: `src/components/document-checklist.tsx`

Changes:
- Added "Original Required" badge with mail icon
- Display `originalNote` in amber alert box
- Enhanced visual indicators for required originals

### 5. Updated Step 2 Upload Page

**File**: `src/app/intake/step2/page.tsx`

Changes:
- Added import for `MailInProcessBanner`
- Updated header messaging to mention validation process
- Integrated banner into page layout

### 6. Email Templates

#### Updated: Upload Confirmation Email
**File**: `src/emails/upload-confirmation.tsx`

Changes:
- Updated success message to mention validation and review process
- Added "How This Works" section with 3-step process
- Emphasized convenience of uploading digital copies first

#### New: Document Validated Email
**File**: `src/emails/document-validated.tsx`

Features:
- Status tracker showing progress
- Explanation of lawyer review process
- What to do while waiting (request certified copies)
- Action-oriented design

#### New: Ready to Mail Email
**File**: `src/emails/ready-to-mail.tsx`

Features:
- 4-step mailing instructions with clear visual hierarchy
- Tracking number for prepaid envelope
- Important notes about certified copies and originals
- DOJ mailing address
- Support section for questions

## Jurisdiction-Specific Resources

### Utah
- Utah State Archives
- Utah Department of Health - Vital Records
- Utah State Historical Society
- Utah Medical Records Request

### Nevada
- Nevada State Library, Archives and Public Records
- Nevada Division of Public and Behavioral Health
- Clark County Recorder's Office

### Arizona
- Arizona State Library, Archives and Public Records
- Arizona Department of Health Services

## User Experience Flow

### 1. Initial Upload
- User sees prominent banner explaining the process
- Each document category shows "Original Required" badge if applicable
- Amber notes explain which documents need certified copies
- Tips guide users on what to upload now vs. obtain later

### 2. After Upload
- User receives confirmation email
- Email explains validation process
- Encourages continuing uploads

### 3. Validation Complete
- User receives "Document Validated" email
- Status tracker shows progress
- Suggests requesting certified copies while waiting

### 4. Ready to Mail
- User receives "Ready to Mail" email with detailed instructions
- Prepaid envelope arrives with:
  - Printed copies of digital uploads
  - Instruction slip marking which docs need originals
  - Prepaid postage envelope addressed to DOJ
- User replaces marked documents with originals/certified copies
- User mails completed packet

## Implementation Status

### Completed ✓
- [x] Database schema updates
- [x] Migration applied
- [x] Jurisdiction requirements data structure
- [x] Updated document checklist with original requirements
- [x] Mail-in process banner component
- [x] Updated UI components
- [x] Email template updates
- [x] New email templates (validated, ready-to-mail)

### Pending (Phase 2)
- [ ] Document validation workflow API endpoints
- [ ] Staff validation interface
- [ ] Lawyer review/approval interface
- [ ] Prepaid envelope generation system
- [ ] Instruction slip generation
- [ ] Tracking number integration
- [ ] Status update email triggers
- [ ] Portal dashboard showing current status

## Configuration

### Environment Variables
No new environment variables required. Uses existing configuration.

### Feature Flags
Consider adding a feature flag to switch between mail-in and digital portal once available:
```typescript
const USE_DIGITAL_PORTAL = process.env.NEXT_PUBLIC_USE_DIGITAL_PORTAL === 'true'
```

## Testing Considerations

### Manual Testing
1. Upload documents and verify banner displays correctly
2. Check "Original Required" badges appear appropriately
3. Verify jurisdiction-specific links load
4. Test email templates with various states

### Automated Testing (Future)
- Unit tests for jurisdiction requirements functions
- Integration tests for validation workflow
- E2E tests for complete upload-to-mail flow

## Transitioning to Digital Portal (December)

When the DOJ digital portal opens:

1. **Update feature flag** to enable digital submission
2. **Update messaging** to remove mail-in process banner
3. **Keep validation workflow** as it's still useful for quality control
4. **Archive mail-in emails** but keep for reference
5. **Update status tracking** to reflect direct digital submission

The validation and review workflow built for this process will remain useful even after transitioning to digital submission.

## Document Types Requiring Originals

### Always Required as Certified/Original:
- Identity (Government-issued ID) - Certified or notarized copy
- Proof of Residence (historical) - Originals preferred from 1951-1962
- Pathology Reports - Certified copies from medical facility
- Medical Records - Certified copies
- Discharge Summaries - Certified copies from hospital
- Utility Bills (historical) - Originals preferred
- School Records - Originals or certified copies
- Employment Records - Originals preferred
- Tax Returns - Originals or certified IRS copies

### Copies Acceptable:
- Treatment Records
- Other Supporting Documents (unless specifically requested)

## Support and Documentation

### User-Facing Documentation
- Process explanation banner on upload page
- Email instructions at each stage
- Help text in document checklist

### Internal Documentation
- This implementation summary
- Database schema comments
- Code comments in key files

## Future Enhancements

1. **Automated Document Validation**: OCR + AI to pre-validate documents
2. **Status Tracking Dashboard**: Client portal showing current stage
3. **SMS Notifications**: Optional SMS updates at key stages
4. **Certified Copy Request Service**: Direct integration with medical record vendors
5. **Document Quality Checker**: Real-time feedback on upload quality
6. **Multi-Language Support**: Spanish translations for all messaging

## Notes for Developers

- All database changes are backward compatible
- New fields have sensible defaults
- Email templates use existing email infrastructure
- Components follow existing design patterns
- Jurisdiction data can be easily extended for new states

## Rollback Plan

If issues arise:
1. Feature flag can disable new UI components
2. Database changes are additive (no data loss)
3. Old upload flow still functional
4. Emails can revert to previous templates

## Questions or Issues

Contact the development team or refer to:
- `/src/lib/jurisdiction-requirements.ts` for jurisdiction data
- `/src/components/mail-in-process-banner.tsx` for UI messaging
- `/src/emails/` for email templates
- `prisma/schema.prisma` for database structure

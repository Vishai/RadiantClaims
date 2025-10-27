# RECA Downwinder Claim Form - Parsed Data & Workflow Summary

## Project Overview
**Goal**: Create an interactive, conditional guide for completing the RECA Downwinder Claim Form within the RadiantClaims application.

**Generated Files**:
1. `reca_form_structure.json` - Complete form structure with all parts, fields, and validation rules
2. `workflow_logic.json` - Multi-stage guided workflow with conditional logic and UI specifications
3. This summary document

---

## Form Structure Summary

### Main Form Parts (16 total)
The RECA Downwinder form consists of 16 parts with complex conditional logic:

**Part 1**: Filer Information (ALWAYS REQUIRED)
- Personal details of person filing the claim
- Contact information, tribal affiliation (optional)

**Part 2**: Claimant Information (CONDITIONAL - if filing for someone else)
- Information about the person who became ill
- Skip if self-filing

**Part 3**: Relationship Selection (ALWAYS REQUIRED)
- Determines which subsequent parts (4-7) to complete
- Options: Self, Spouse, Child, Parent, Grandchild, Grandparent

**Parts 4-7**: Relationship-Specific Documentation (ONE REQUIRED based on Part 3)
- **Part 4**: Self-Filers - Minimal documentation
- **Part 5**: Surviving Spouse - Marriage verification, eligibility questions
- **Part 6**: Surviving Child - Detailed sibling information, adoption/step-child proof
- **Part 7**: Parent/Grandparent/Grandchild - Initial docs, staff follow-up required

**Part 8**: Exposure Information (ALWAYS REQUIRED)
- Physical presence in affected areas during eligible time periods
- 3 eligibility options with specific date ranges
- Geographic areas: Idaho, New Mexico, Utah, specific counties in Arizona and Nevada

**Part 9**: Proof of Presence (ALWAYS REQUIRED)
- Documentation types and certification requirements
- Different requirements for electronic vs mail filing

**Part 10**: Compensable Diseases (ALWAYS REQUIRED)
- 19 eligible cancer types
- Multi-select (can check multiple if unsure)

**Part 11**: Medical Proof of Disease (ALWAYS REQUIRED)
- Disease-specific medical record requirements
- Option for state cancer registry assistance
- RESEP clinic information

**Part 12**: Previous Payments (ALWAYS REQUIRED)
- Disclosure of any prior RECA or related payments
- EEOICPA claim history

**Part 13-14**: Attorney Representation (OPTIONAL)
- Not required to hire attorney
- Fee limitations: 2% initial, 10% resubmission
- Attorney acknowledgment form if hired

**Part 15**: Legal Guardian (CONDITIONAL)
- Only for court-appointed guardians
- Power of attorney does NOT qualify

**Part 16**: Signature (ALWAYS REQUIRED)
- Penalty of perjury declaration
- Authorization for information sharing

---

## Supporting Forms (4 total)

1. **Authorization to Release Medical Information** (Conditional)
   - Required only if requesting state cancer registry assistance
   - Page 14

2. **Certification of Identity and Privacy Act Release** (Required for all)
   - Verifies identity of filer
   - Optional authorization to share info with another person
   - Page 15

3. **Release of Tribal Vital Records** (Conditional)
   - Required only if tribal affiliation provided
   - Pre-formatted for Navajo, Hopi, San Carlos Apache, or custom
   - Page 16

4. **Attached Signatures of Eligible Surviving Beneficiaries** (Optional)
   - Only for surviving children
   - Expedites processing by getting all siblings to sign
   - Page 17

---

## Workflow Stages

### Stage 1: Initial Eligibility Assessment
**Purpose**: Determine eligibility before starting full form

**Key Questions**:
1. Who is filing? (relationship to ill person)
2. Is the person deceased? (for surviving spouse/child)
3. Marriage duration requirement met? (for spouse)
4. Was person present in affected area during eligible periods?

**Outcomes**: 
- Eligible → Proceed to Stage 2
- Ineligible → Show specific reason and guidance

### Stage 2: Form Completion
**Purpose**: Complete main claim form sections

**Approach**: Sequential, guided completion of relevant parts
- Part 1: Always first
- Part 2: Only if filing for someone else
- Part 3: Relationship selection (determines next path)
- Parts 4-7: Complete appropriate relationship section
- Part 8: Exposure information with interactive tools
- Part 9: Proof of presence documentation
- Part 10: Disease selection
- Part 11: Medical proof upload/checklist
- Part 12: Previous payments disclosure
- Part 13-15: Optional/conditional sections
- Part 16: Review and signature

**UI Components**:
- Progress bar
- Field-level help text
- Document upload (electronic) or checklist (mail)
- Validation with clear error messages
- Auto-save functionality

### Stage 3: Supporting Forms
**Purpose**: Complete required supporting forms

**Forms Generated Based On**:
- Certification of Identity: Always
- Medical Info Release: If cancer registry assistance requested
- Tribal Records Release: If tribal affiliation provided
- Beneficiaries Signatures: If surviving child wanting to expedite

### Stage 4: Document Preparation
**Purpose**: Organize all documents for submission

**Features**:
- Personalized document checklist
- Electronic vs mail filing differences highlighted
- Upload interface (electronic) or print checklist (mail)
- Certification requirement guidance

### Stage 5: Review & Submit
**Purpose**: Final review and submission

**Components**:
- Comprehensive summary of all entered data
- Completeness validation
- Missing document warnings
- Electronic submission OR PDF generation for mail

---

## Key Conditional Logic Rules

### Eligibility Requirements
```
IF relationship === 'spouse'
  THEN deceased === 'YES' AND married_one_year === 'YES'
  ELSE ineligible

IF relationship === 'child' OR relationship === 'parent' etc.
  THEN deceased === 'YES'
  ELSE ineligible

Must have at least ONE of:
  - Present in affected area 1+ year (Jan 1951 - Nov 1962)
  - Present entire period (Jun-Jul 1962)
  - Present in NM 1+ year (Sep 1944 - Nov 1962)
```

### Document Requirements Matrix

| Filer Type | Birth Cert (Self) | Birth Cert (Claimant) | Death Cert | Marriage Certs | Adoption Papers | Guardianship Docs |
|---|---|---|---|---|---|---|
| Self | ✅ | N/A | ❌ | If name changed | N/A | If applicable |
| Spouse | ✅ | ✅ | ✅ | ✅ (all marriages) | N/A | If applicable |
| Child | ✅ | ✅ | ✅ | ✅ (claimant's) | If adopted | If applicable |
| Parent/etc | ✅ | ✅ | ✅ | ✅ | If adopted | If applicable |

**Plus**: For ALL filers - presence documentation and medical records

---

## UI Integration Specifications

### Proposed Button Addition on Claim Details Page

**New Button**: "Assist Me in Filling Form" OR "Guided Form Assistant"
- **Position**: Below claim header, alongside existing buttons
- **Color**: Primary (highlighting recommended path)
- **Icon**: Wizard/help icon
- **Badge**: "Recommended" for new users

### Relationship with Existing "Continue Claim" Button

**Potential Overlap Issue**: Both buttons may serve similar functions

**Recommended Approach: Option B - Differentiate Clearly**

```
┌────────────────────────────────────────────────┐
│  Claim #12345 - John Doe                      │
│  Status: In Progress (45% complete)           │
├────────────────────────────────────────────────┤
│                                                │
│  [📝 Continue Claim]  [🎯 Guided Assistant]   │
│   Direct Entry         Step-by-step help      │
│                        ⭐ Recommended          │
│                                                │
│  [👁️ View Details]                            │
│                                                │
└────────────────────────────────────────────────┘
```

**Alternative Logic-Based Approach (Option C)**:
- **New Claim**: Show only "Start Guided Assistant" 
- **In-Progress Claim**: Show both options
- **Near-Complete Claim**: Show "Continue Claim" prominently

---

## Data Persistence Strategy

### Recommended Approach: Direct Database Integration

**Claim Record Extensions**:
```json
{
  "workflow_stage": 2,
  "workflow_section": "section_part_8",
  "form_data_json": { /* all form fields */ },
  "documents_uploaded": [
    { "doc_id": "...", "type": "birth_certificate", "category": "vital_records" }
  ],
  "eligibility_data": {
    "relationship": "self",
    "exposure_verified": true,
    "disease_selected": ["lung"]
  },
  "completion_percentage": 45,
  "last_updated": "2025-01-15T10:30:00Z"
}
```

**Benefits**:
- Single source of truth
- Seamless resume functionality
- Can power both guided and direct entry modes
- Easy progress tracking

**Auto-Save**:
- Frequency: Every 2 minutes OR after each section completion
- Visual indicator: "Last saved 2 minutes ago"

---

## PDF Generation Requirements

### Purpose
1. Generate pre-filled official RECA form for mail submission
2. Provide printable copy for user records
3. Create backup of completed form

### Technical Approach
**Library**: pdf-lib (JavaScript) or PDFKit (server-side)

**Process**:
1. Load blank RECA form PDF template
2. Map JSON workflow data to PDF form fields
3. Fill in all data (text fields, checkboxes, dates)
4. Generate supporting forms similarly
5. Create cover sheet with document checklist
6. Combine into single PDF package OR separate files

**Output Options**:
- Fillable PDF (user can still edit)
- Flattened PDF (locked, ready to print)

---

## Open Questions & Decisions Needed

### ❓ Question 1: Existing "Continue Claim" Functionality
**What we need to know**:
- What happens when user clicks "Continue Claim"?
- Is there existing form-filling UI?
- How is claim data currently stored?
- Would new workflow duplicate existing functionality?

**Impact**: Determines how to position new guided workflow

---

### ❓ Question 2: Data Modification Approach
**Options**:
A. **Direct Modification**: Workflow saves directly to claim record
   - ✅ Single source of truth
   - ✅ Real-time sync
   - ❌ Tighter coupling

B. **Separate Assistant**: Workflow maintains own state, exports at end
   - ✅ Decoupled, flexible
   - ✅ Works offline
   - ❌ Sync complexity

**Recommendation**: **Option A** for better UX and data integrity

---

### ❓ Question 3: Document Upload Infrastructure
**What we need to know**:
- Current file storage solution (S3, database, etc.)?
- File size limits?
- Supported file types?
- Existing document categorization?

**Impact**: Determines if we can reuse existing upload system or need new implementation

---

### ❓ Question 4: Electronic Submission Capability
**What we need to know**:
- Does RECA.gov have API for form submission?
- Or is it manual upload to their portal?

**Impact**: 
- If API exists: Can auto-submit completed forms
- If manual: Generate PDF for user to upload themselves

---

### ❓ Question 5: UI Integration Approach
**Options**:
A. **New Modal Flow**: Separate overlay experience
B. **Integrated Inline**: Replace existing form
C. **Hybrid**: Guided mode as option, keep direct form

**Recommendation**: **Option C (Hybrid)** - Best of both worlds

---

## Implementation Roadmap

### Phase 1: Data Structure & Backend (2-3 weeks)
- [ ] Extend claim database schema with workflow fields
- [ ] Create API endpoints for workflow save/load
- [ ] Implement validation logic
- [ ] Set up document upload integration
- [ ] Create JSON-to-PDF mapping service

### Phase 2: Core Workflow UI (3-4 weeks)
- [ ] Build multi-step wizard component
- [ ] Implement conditional field rendering
- [ ] Create progress tracking system
- [ ] Build eligibility assessment flow
- [ ] Implement auto-save functionality

### Phase 3: Form Sections (4-5 weeks)
- [ ] Part 1: Filer information form
- [ ] Part 2-3: Claimant & relationship
- [ ] Parts 4-7: Relationship-specific sections with conditional logic
- [ ] Part 8: Exposure information (with map/timeline UI)
- [ ] Part 9: Document upload/checklist
- [ ] Parts 10-11: Disease selection & medical records
- [ ] Parts 12-16: Final sections & signature

### Phase 4: Supporting Features (2-3 weeks)
- [ ] Supporting forms generation
- [ ] Document checklist generator
- [ ] PDF pre-fill functionality
- [ ] Comprehensive review screen
- [ ] Help text / tooltip system

### Phase 5: Integration & Testing (2-3 weeks)
- [ ] Integrate with existing claim detail page
- [ ] Button placement and logic
- [ ] End-to-end testing with all relationship types
- [ ] Edge case handling
- [ ] User acceptance testing

### Phase 6: Polish & Launch (1-2 weeks)
- [ ] Performance optimization
- [ ] Error handling refinement
- [ ] Documentation
- [ ] User guide / help content
- [ ] Soft launch and monitoring

**Total Estimated Timeline**: 14-20 weeks (3.5 - 5 months)

---

## Success Criteria

### User Experience Metrics
- **Completion Rate**: >70% of users who start workflow complete it
- **Time to Complete**: <60 minutes average
- **Error Rate**: <10% of submissions missing required info
- **User Satisfaction**: >4.0/5.0 rating

### Operational Metrics
- **Claim Approval Rate**: Higher % for assisted vs manual submissions
- **Processing Time**: Faster approval for assisted claims
- **Support Tickets**: 30%+ reduction in form help requests

---

## Next Steps

1. **Review Questions**: Address the 5 open questions above
2. **Technical Validation**: Verify compatibility with existing RadiantClaims stack
3. **Design Review**: Create mockups for key workflow screens
4. **Stakeholder Approval**: Get sign-off on approach and timeline
5. **Sprint Planning**: Break Phase 1 into development tasks

---

## File Outputs

Generated files are located in:
`/Users/brandonarmstrong/Documents/Github/RadiantClaims/docs/parsed_form_data/`

1. **reca_form_structure.json** (8.5KB)
   - Complete form specification
   - All fields, types, validation rules
   - Document requirements
   - Supporting forms

2. **workflow_logic.json** (16KB)
   - 5-stage workflow definition
   - Conditional logic rules
   - UI specifications
   - Implementation details

3. **README.md** (This file)
   - Summary and overview
   - Decision points
   - Implementation roadmap

---

## Technical Stack Recommendations

**Frontend**:
- React multi-step form wizard
- React Hook Form or Formik for form state
- Tailwind CSS for styling
- pdf-lib for PDF generation
- React Dropzone for file uploads

**Backend**:
- Extend existing API with workflow endpoints
- JSON schema validation
- S3 or similar for document storage
- Background job for PDF generation (if heavy)

**Database**:
- Add workflow_progress JSON column to claims table
- OR create separate workflow_sessions table for cleaner separation

---

*Generated: January 2025*
*For: RadiantClaims RECA Workflow Project*

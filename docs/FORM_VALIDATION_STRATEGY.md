# RECA Form Validation & Document Tracking Strategy

## Core Principles

1. **Never Block Form Progress** - Users can continue through all sections regardless of missing information
2. **Track Requirements Separately** - Document needs are tracked independently from form completion
3. **Provide Help Throughout** - Assistance available for obtaining missing documents/information
4. **Validate Only at Submission** - Final validation only when submitting to DOJ
5. **Save Progress Always** - Save whatever information users provide, even if incomplete

## Current State Analysis

### Forms with Blocking Validations (Need Refactoring)

| Part | Section | Current Blocking Fields | Refactor Needed |
|------|---------|------------------------|-----------------|
| Part 1 | Filer Info | firstName, lastName, SSN, DOB, address | Make optional, track as "needed" |
| Part 2 | Claimant Info | All name/DOB fields | Make optional for non-self filers |
| Part 6 | Child | Sibling info, marriage details | Already complex - needs careful refactor |
| Part 8 | Exposure | Location, dates, activities | Critical info but shouldn't block |
| Part 14 | Attorney | Attorney details | Only if has attorney |
| Part 15 | Guardian | Guardian details | Only if has guardian |
| Part 16 | Signature | Signature fields | Final step - may need validation |

### Forms Already Non-Blocking (Good Examples)

| Part | Section | Status |
|------|---------|--------|
| Part 4 | Self-Filer | ✅ Refactored - information gathering only |
| Part 5 | Spouse | Placeholder - needs full implementation |
| Part 7 | Other Relatives | Placeholder - needs full implementation |
| Part 9 | Proof of Presence | No required fields |
| Part 10 | Diseases | Checkbox selection |
| Part 11 | Proof of Disease | Text fields optional |
| Part 12 | Previous Payments | Yes/No selection |
| Part 13 | Attorney Rep | Yes/No selection |

## Implementation Strategy

### Phase 1: Core Information Gathering (Parts 1-3)
These establish identity and relationships - critical but shouldn't block.

#### Part 1 - Filer Information
- **Make Optional**: All fields become optional for form progression
- **Track as Needed**: SSN, DOB, full name always needed for submission
- **Document Requirements**: Birth certificate always needed
- **Help Resources**: Links to get replacement SSN cards, birth certificates

#### Part 2 - Claimant Information
- **Only Show**: When not filing for self
- **Make Optional**: All fields for progression
- **Track Requirements**: Based on relationship type
- **Document Requirements**: Death certificate, birth certificate of claimant

#### Part 3 - Relationship
- **Keep Required**: This drives the rest of the form logic
- **No Documents**: This is just a selection

### Phase 2: Relationship-Specific Sections (Parts 4-7)

#### Part 5 - Surviving Spouse (Needs Implementation)
```typescript
Information to Gather:
- Date of marriage
- Date of spouse's death
- Previous marriages (both parties)
- Name at time of marriage
- Current name if different

Documents to Track:
- Marriage certificate(s)
- Death certificate of spouse
- Divorce decrees if applicable
- Name change documents

Help Resources:
- County clerk offices for marriage certificates
- Vital records for death certificates
- Court records for divorce decrees
```

#### Part 6 - Surviving Child (Needs Refactor)
```typescript
Current Issues:
- Blocks if spouse exists and was married 1+ year
- Requires sibling information
- Complex validation rules

Refactor to:
- Warn about eligibility but don't block
- Make sibling info optional
- Track sibling death certificates as "needed if applicable"
```

#### Part 7 - Other Relatives (Needs Implementation)
```typescript
Information to Gather:
- Specific relationship (parent/grandparent/grandchild)
- Family tree connections
- Birth/death dates

Documents to Track:
- Multiple birth certificates (chain of relationship)
- Death certificates
- Marriage certificates for name changes in chain
```

### Phase 3: Exposure & Medical (Parts 8-11)

#### Part 8 - Exposure Information
- **Make Optional**: Dates, locations, activities
- **Provide Guidance**: Maps, date calculators, activity examples
- **Track Completeness**: Flag if minimal info provided

#### Part 9 - Proof of Presence
- **Already Non-Blocking**: Good as-is
- **Add Help**: Examples of acceptable proof
- **Document Tracking**: Each proof document tracked separately

#### Part 10 - Diseases
- **Keep As-Is**: Checkbox selection works well
- **Add Info**: Links to medical information about each disease

#### Part 11 - Proof of Disease
- **Keep Optional**: Medical info fields
- **Document Tracking**: Medical records, pathology reports
- **Help Resources**: How to request medical records

### Phase 4: Administrative (Parts 12-16)

#### Part 12 - Previous Payments
- **Keep Simple**: Yes/No selection
- **If Yes**: Track documentation needs

#### Part 13 - Attorney Representation
- **Keep Simple**: Yes/No selection
- **Drives Part 14**: Show/hide based on selection

#### Part 14 - Attorney Details
- **Make Optional**: For form progression
- **Track as Needed**: If has attorney

#### Part 15 - Legal Guardian
- **Conditional Display**: Only if applicable
- **Make Optional**: For progression
- **Document Tracking**: Guardian appointment papers

#### Part 16 - Signature
- **Special Case**: May need to require for legal reasons
- **Alternative**: "Draft" vs "Final" submission modes

## Document Tracking Integration

### Per-Section Document Identification
Each form section should:
1. Identify documents needed based on user input
2. Update global document tracking state
3. Show document requirements in-context
4. Provide help resources specific to that section

### Global Document Dashboard
Create a unified view showing:
- All required documents across all sections
- Current status of each document
- Help resources for obtaining
- Upload interface when ready
- Checklist for final submission

### Workflow States
1. **Information Gathering**: Forms can be filled in any order
2. **Document Collection**: Parallel process, tracked separately
3. **Review & Verification**: Check completeness
4. **Final Submission**: Validate all requirements met

## Implementation Priority

1. **Immediate**: Fix Part 1 & 2 to not block progression
2. **High**: Implement Part 5, 6, 7 properly
3. **Medium**: Refactor Part 8 for non-blocking
4. **Low**: Polish Parts 9-16 (already mostly non-blocking)

## Success Metrics

- Users can complete entire form in one session with partial info
- Clear visibility of what's still needed
- Reduced abandonment rate
- Fewer rejected applications due to missing documents
- Improved user satisfaction scores
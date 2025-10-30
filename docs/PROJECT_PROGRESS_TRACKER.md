# RadiantClaims - RECA PDF Form Filling Project Tracker

## 🎯 Project Goal

Fill out the **official RECA Downwinder Claim Form PDF** with user data collected through our form wizard, so users receive a pre-filled government form they can sign and mail.

## 📊 Overall Progress: 35% Complete

```
[████████░░░░░░░░░░░░░░░░░░] 35%

✅ Foundation & Architecture (100%)
✅ Parts 1-3 Mapped (100%)
⏳ Parts 4-16 Mapping (0%)
⏳ Supporting Forms (0%)
⏳ Integration (0%)
```

---

## 🏗️ Phase 1: Foundation & Architecture ✅ COMPLETE

### What We Built

1. **PDF Form Filler Service** ✅
   - File: `src/lib/reca/pdf-form-filler.ts`
   - Loads official RECA PDF
   - Overlays text at precise coordinates
   - Handles multiple field types

2. **Calibration Tool** ✅
   - File: `scripts/calibrate-pdf-coordinates.ts`
   - Generates coordinate grid overlay
   - Output: `docs/test-output/calibration-grid.pdf`

3. **Test Framework** ✅
   - File: `scripts/test-pdf-form-filling.ts`
   - Tests with sample data
   - Output: `docs/test-output/filled-reca-form-test.pdf`

4. **Documentation** ✅
   - `docs/PDF_FILLING_IMPLEMENTATION.md` - Overview
   - `docs/PDF_FORM_FILLING_GUIDE.md` - Detailed guide
   - `docs/PROJECT_PROGRESS_TRACKER.md` - This file

### Key Technical Decisions

- **Approach**: Overlay text on official PDF (not fillable form fields)
- **Library**: `pdf-lib` (already in package.json)
- **Font**: Courier (monospace for boxed fields)
- **Coordinate System**: Bottom-left origin (0,0 at bottom-left)

---

## 📋 Phase 2: Form Section Mapping ⏳ IN PROGRESS

### Coordinate Mapping Progress

| Part | Description | Status | Priority | Estimated Time | Pages |
|------|-------------|--------|----------|----------------|-------|
| Part 1 | Filer info | ✅ Done | - | - | 1-2 |
| Part 2 | Claimant info | ✅ Done | - | - | 2 |
| Part 3 | Relationship | ✅ Done | - | - | 3 |
| **Part 4** | Self-filer docs | ⏳ TODO | High | 20 min | 3 |
| **Part 5** | Surviving spouse | ⏳ TODO | High | 45 min | 3-4 |
| **Part 6** | Surviving child | ⏳ TODO | High | 1 hr | 4-6 |
| **Part 7** | Other relatives | ⏳ TODO | Medium | 30 min | 6 |
| **Part 8** | Exposure areas | ⏳ TODO | **Critical** | 1.5 hrs | 6-7 |
| **Part 9** | Proof of presence | ⏳ TODO | Medium | 30 min | 8 |
| **Part 10** | Diseases | ⏳ TODO | **Critical** | 1 hr | 9 |
| **Part 11** | Proof of disease | ⏳ TODO | High | 45 min | 9-10 |
| **Part 12** | Previous payments | ⏳ TODO | Medium | 30 min | 10 |
| **Part 13** | Attorney rep | ⏳ TODO | Medium | 45 min | 11 |
| **Part 14** | Attorney ack | ⏳ TODO | Low | 20 min | 12 |
| **Part 15** | Legal guardian | ⏳ TODO | Low | 30 min | 12 |
| **Part 16** | Signature | ⏳ TODO | High | 20 min | 13 |

**Total Remaining Estimate**: ~8 hours

### Critical Path Parts
These parts are most commonly used and should be prioritized:
1. ⚠️ **Part 8** - Exposure (everyone needs this)
2. ⚠️ **Part 10** - Diseases (everyone needs this)
3. **Part 5** - Surviving Spouse (common use case)
4. **Part 11** - Proof of Disease (common use case)

### Supporting Forms (Pages 14-17)

| Form | Status | Estimated Time |
|------|--------|----------------|
| Medical Info Release | ⏳ TODO | 30 min |
| Certification of Identity | ⏳ TODO | 30 min |
| Tribal Records Release | ⏳ TODO | 20 min |
| Surviving Beneficiaries | ⏳ TODO | 45 min |

**Total Estimate**: ~2 hours

---

## 🔄 Phase 3: Integration ⏳ PENDING

### Tasks

- [ ] Update form submission API endpoint
- [ ] Replace old `pdf-generator.ts` usage with `pdf-form-filler.ts`
- [ ] Update download workflow
- [ ] Test with real form data from database
- [ ] Add error handling for missing data
- [ ] Add logging for debugging

**Estimated Time**: 2-3 hours

### Files to Update

1. **API Route** (likely in `src/app/api/`)
   - Find current PDF generation endpoint
   - Replace with new form filler

2. **Download Handler**
   ```typescript
   import { fillOfficialRECAPDF } from '@/lib/reca/pdf-form-filler';

   const filledPdf = await fillOfficialRECAPDF({
     formData: session.formData,
     supportingForms: session.supportingForms,
     sessionId: session.id,
     officialPdfPath: path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf'),
   });
   ```

---

## 🎬 Quick Start Commands

### For Mapping New Sections

```bash
# 1. View calibration grid (find coordinates)
open docs/test-output/calibration-grid.pdf

# 2. Edit pdf-form-filler.ts
# Add coordinates to FIELD_COORDINATES object
# Update corresponding fillPartX() method

# 3. Test your changes
npx tsx scripts/test-pdf-form-filling.ts

# 4. Verify output
open docs/test-output/filled-reca-form-test.pdf
```

### Regenerate Calibration Grid

```bash
npx tsx scripts/calibrate-pdf-coordinates.ts
```

---

## 📝 Mapping Workflow (Step-by-Step)

### Example: Mapping Part 8 (Exposure)

1. **Open calibration grid**
   ```bash
   open docs/test-output/calibration-grid.pdf
   ```

2. **Navigate to Part 8** (pages 6-7 in original form)

3. **For each field, note coordinates:**
   - X = Red horizontal numbers (left to right)
   - Y = Blue vertical numbers (bottom to top)
   - Remember: Y=0 is at BOTTOM of page

4. **Add to FIELD_COORDINATES** in `pdf-form-filler.ts`:
   ```typescript
   // Part 8: Exposure
   'part8.option1a': { page: 5, x: 42, y: 520, type: 'checkbox' },
   'part8.idaho.townCity': { page: 6, x: 180, y: 680, fontSize: 10 },
   // ... etc
   ```

5. **Implement fillPart8()** method:
   ```typescript
   private async fillPart8() {
     if (!this.formData.part_8) return;

     // Check appropriate exposure option
     if (this.formData.part_8.exposureOptions.includes('option_1a')) {
       this.drawCheckbox('part8.option1a');
     }

     // Fill location data
     this.formData.part_8.affectedAreas?.forEach((area, i) => {
       this.drawText(`part8.area${i}.townCity`, area.townCity);
       this.drawText(`part8.area${i}.state`, area.state);
       // ... etc
     });
   }
   ```

6. **Update test data** in `test-pdf-form-filling.ts`:
   ```typescript
   part_8: {
     exposureOptions: ['option_1a'],
     affectedAreas: [
       { townCity: 'Phoenix', state: 'AZ', timePeriod: '1955-1960' }
     ],
   }
   ```

7. **Test**:
   ```bash
   npx tsx scripts/test-pdf-form-filling.ts
   open docs/test-output/filled-reca-form-test.pdf
   ```

8. **Verify & Adjust**:
   - Check text alignment
   - Adjust coordinates if needed
   - Re-test until perfect

---

## 📋 DETAILED SECTION MAPPINGS

This section provides detailed field breakdowns for each remaining part of the form.

### Part 4: Self-Filers (Page 3)
**Complexity**: Simple | **Estimated Time**: 20 minutes | **Fields**: 2 checkboxes

**Fields to Map**:
```
Checkboxes:
- [ ] Birth certificate: yours
- [ ] Marriage certificate(s): documenting all changes of name, if applicable
```

**Data Structure Needed**:
```typescript
part_4?: {
  hasBirthCertificate: boolean;
  hasMarriageCertificates: boolean;
}
```

**Notes**:
- Simple checkbox section
- Just document submission tracking
- No text fields

---

### Part 5: Surviving Spouse (Pages 3-4)
**Complexity**: Medium | **Estimated Time**: 45 minutes | **Fields**: 5 yes/no + text lines + 9 document checkboxes

**Fields to Map**:

**Questions (Page 3)**:
```
Radio Buttons / Checkboxes:
1. Is the person identified in Part 2 deceased?
   - [ ] YES  [ ] NO
2. Were you married to the claimant for at least one year prior to death?
   - [ ] YES  [ ] NO
3. Was the person who became ill married to anyone else BEFORE marrying you?
   - [ ] YES  [ ] NO
   - Text lines for previous spouse details (if YES)
4. Have you been married to anyone else?
   - [ ] YES  [ ] NO
   - Text lines for other spouse details (if YES)
```

**Document Checklist (Page 4)**:
```
- [ ] Birth certificate: of the person who became ill
- [ ] Death certificate: of the person who became ill
- [ ] Marriage certificate: documenting your marriage
- [ ] Marriage certificate(s): previous marriages of claimant
- [ ] Divorce decree(s) or death certificate(s): end of previous marriages (claimant)
- [ ] Birth certificate: yours
- [ ] Marriage certificate(s): all of your other marriages
- [ ] Divorce decree(s) or death certificate(s): end of your previous marriages
```

**Data Structure Needed**:
```typescript
part_5?: {
  claimantDeceased: boolean;
  marriedOneYearPriorToDeath: boolean;
  claimantPreviousMarriages: boolean;
  claimantPreviousSpouses?: string[]; // Text lines
  filerPreviousMarriages: boolean;
  filerPreviousSpouses?: string[]; // Text lines
  documents: {
    claimantBirthCert: boolean;
    claimantDeathCert: boolean;
    marriageCert: boolean;
    claimantPreviousMarriageCerts: boolean;
    claimantMarriageEndDocs: boolean;
    filerBirthCert: boolean;
    filerOtherMarriageCerts: boolean;
    filerMarriageEndDocs: boolean;
  }
}
```

---

### Part 6: Surviving Child (Pages 4-6)
**Complexity**: High | **Estimated Time**: 1 hour | **Fields**: 4 yes/no + sibling entries (repeating) + 9 document checkboxes

**Fields to Map**:

**Questions (Pages 4-5)**:
```
1. Is the person identified in Part 2 deceased?
   - [ ] YES  [ ] NO
2. Was the person who became ill ever married?
   - [ ] YES  [ ] NO
   - Text lines for spouse details (if YES)
3. Are you a natural, adopted, or step-child?
   - [ ] NATURAL  [ ] ADOPTED CHILD  [ ] STEP-CHILD
4. Did the decedent have other children?
   - [ ] YES  [ ] NO
```

**Sibling Information (Page 5)** - Repeating Section:
```
For each sibling (1-3 pre-printed, more on back):
- Name: _____________________________
- Date and place of birth: ___________
- Date and place of death (if applicable): _______
- Current address (if applicable): _______
- Phone number (if applicable): _______
- [ ] More siblings on additional sheet
```

**Document Checklist (Page 5-6)**:
```
- [ ] Birth certificate: of the person who became ill
- [ ] Death certificate: of the person who became ill
- [ ] Marriage certificate(s): of the person who became ill
- [ ] Divorce decree(s) or death certificate(s): all marriages ended
- [ ] Birth certificate or papers of adoption: yours
- [ ] Marriage certificate(s): your name changes
- [ ] Step-child proof: spouse relationship + parent-child records
- [ ] Death certificates: of any siblings
- [ ] Birth certificate for each eligible surviving beneficiary
- [ ] Marriage certificate(s) for each beneficiary with name change
- [ ] Expedite option: Attached Signatures of Eligible Surviving Beneficiaries
```

**Data Structure Needed**:
```typescript
part_6?: {
  claimantDeceased: boolean;
  claimantEverMarried: boolean;
  claimantSpouses?: string[]; // Text lines
  childType: 'natural' | 'adopted' | 'step';
  hasOtherChildren: boolean;
  siblings?: Array<{
    name: string;
    dateAndPlaceOfBirth: string;
    dateAndPlaceOfDeath?: string;
    currentAddress?: string;
    phoneNumber?: string;
  }>;
  documents: {
    claimantBirthCert: boolean;
    claimantDeathCert: boolean;
    claimantMarriageCerts: boolean;
    claimantMarriageEndDocs: boolean;
    childBirthOrAdoptionCert: boolean;
    childMarriageCerts: boolean;
    stepChildProof: boolean;
    siblingDeathCerts: boolean;
    beneficiaryBirthCerts: boolean;
    beneficiaryMarriageCerts: boolean;
    expediteSignatures: boolean;
  }
}
```

---

### Part 7: Parents, Grandchildren, or Grandparents (Page 6)
**Complexity**: Low | **Estimated Time**: 30 minutes | **Fields**: 1 radio group + 7 document checkboxes

**Fields to Map**:
```
Relationship Selection:
- [ ] PARENT  [ ] GRANDCHILD  [ ] GRANDPARENT

Required Documents:
- [ ] Birth certificate: of the person who became ill
- [ ] Death certificate: of the person who became ill
- [ ] Marriage certificate(s): of the person who became ill
- [ ] Divorce decree(s) or death certificate(s): all marriages ended
- [ ] Death certificate(s): of any deceased children
- [ ] Birth certificate or papers of adoption: yours
- [ ] Marriage certificate(s): your name changes
```

**Data Structure Needed**:
```typescript
part_7?: {
  relationship: 'parent' | 'grandchild' | 'grandparent';
  documents: {
    claimantBirthCert: boolean;
    claimantDeathCert: boolean;
    claimantMarriageCerts: boolean;
    claimantMarriageEndDocs: boolean;
    deceasedChildrenDeathCerts: boolean;
    filerBirthOrAdoptionCert: boolean;
    filerMarriageCerts: boolean;
  }
}
```

**Notes**:
- Program staff will contact filer for additional help
- Simpler than other beneficiary types

---

### Part 8: Exposure (Pages 6-7) ⚠️ CRITICAL
**Complexity**: High | **Estimated Time**: 1.5 hours | **Fields**: 3 main checkboxes + 16 location entries

**Fields to Map**:

**Exposure Period Options (Page 6)**:
```
The claimant must have been physically present:

(1) in a designated affected area-
   [ ] for at least one year during Jan 21, 1951 - Nov 6, 1962; OR
   [ ] for the entire period June 30, 1962 - July 31, 1962; OR

(2) in the State of New Mexico-
   [ ] for at least one year during Sept 24, 1944 - Nov 6, 1962
```

**Location Fields (Page 7)** - Multiple entry tables:

**Simple States (no county)**:
```
State         | Town or City | Time Period
Idaho         | ____________ | ___________
New Mexico    | ____________ | ___________
Utah          | ____________ | ___________
```

**Arizona Counties**:
```
State   | County   | Town or City | Time Period
Arizona | Coconino | ____________ | ___________
Arizona | Yavapai  | ____________ | ___________
Arizona | Navajo   | ____________ | ___________
Arizona | Apache   | ____________ | ___________
Arizona | Gila     | ____________ | ___________
Arizona | Mohave   | ____________ | ___________
```

**Nevada Counties**:
```
State  | County      | Town or City | Time Period
Nevada | White Pine  | ____________ | ___________
Nevada | Nye         | ____________ | ___________
Nevada | Lander      | ____________ | ___________
Nevada | Lincoln     | ____________ | ___________
Nevada | Eureka      | ____________ | ___________
Nevada | Clark*      | ____________ | ___________
```
*Clark County limited to townships 13-16 at ranges 63-71

**Data Structure Needed**:
```typescript
part_8: {
  exposureOption: 'designated_1year' | 'designated_june_july_1962' | 'new_mexico_1year';
  locations: {
    // Simple states (no county)
    idaho?: { townCity: string; timePeriod: string; };
    newMexico?: { townCity: string; timePeriod: string; };
    utah?: { townCity: string; timePeriod: string; };

    // Arizona (with counties)
    arizona?: Array<{
      county: 'Coconino' | 'Yavapai' | 'Navajo' | 'Apache' | 'Gila' | 'Mohave';
      townCity: string;
      timePeriod: string;
    }>;

    // Nevada (with counties)
    nevada?: Array<{
      county: 'White Pine' | 'Nye' | 'Lander' | 'Lincoln' | 'Eureka' | 'Clark';
      townCity: string;
      timePeriod: string;
    }>;
  }
}
```

**Implementation Notes**:
- Most complex section with multiple tables
- Need to handle dynamic number of entries per location
- County fields are pre-printed, only town/city and time period are fillable
- Must validate time periods against exposure options selected

---

### Part 9: Proof of Presence (Page 8)
**Complexity**: Low | **Estimated Time**: 30 minutes | **Fields**: 1 checkbox

**Fields to Map**:
```
Church of LDS Contact:
- [ ] I have contacted the Church of Jesus Christ of Latter-day Saints
      and requested information regarding my claim with the RECA Program
```

**Data Structure Needed**:
```typescript
part_9?: {
  contactedLDS: boolean;
}
```

**Notes**:
- Mostly informational
- Only one checkbox to map
- Rest is instructions for document collection

---

### Part 10: Compensable Diseases (Page 9) ⚠️ CRITICAL
**Complexity**: Medium | **Estimated Time**: 1 hour | **Fields**: 20 disease checkboxes

**Fields to Map**:
```
Disease Checkboxes (Left Column):
- [ ] Leukemia (other than chronic lymphocytic leukemia)
- [ ] Multiple Myeloma
- [ ] Lymphomas (other than Hodgkin's disease)
- [ ] Primary cancer of the thyroid
- [ ] Primary cancer of the male or female breast
- [ ] Primary cancer of the esophagus
- [ ] Primary cancer of the stomach
- [ ] Primary cancer of the pharynx
- [ ] Primary cancer of the small intestine

Disease Checkboxes (Right Column):
- [ ] Primary cancer of the pancreas
- [ ] Primary cancer of the bile ducts
- [ ] Primary cancer of the gall bladder
- [ ] Primary cancer of the salivary gland
- [ ] Primary cancer of the urinary bladder
- [ ] Primary cancer of the brain
- [ ] Primary cancer of the colon
- [ ] Primary cancer of the ovary
- [ ] Primary cancer of the liver (except if cirrhosis or hepatitis B is indicated)
- [ ] Primary cancer of the lung
```

**Data Structure Needed**:
```typescript
part_10: {
  diseases: Array<
    'leukemia' | 'multiple_myeloma' | 'lymphomas' |
    'thyroid' | 'breast' | 'esophagus' | 'stomach' |
    'pharynx' | 'small_intestine' | 'pancreas' |
    'bile_ducts' | 'gall_bladder' | 'salivary_gland' |
    'urinary_bladder' | 'brain' | 'colon' | 'ovary' |
    'liver' | 'lung'
  >;
}
```

**Coordinate Mapping Strategy**:
- 20 checkboxes total
- Two columns on page 9
- Precise vertical alignment critical
- ~9 diseases in left column, ~11 in right column

---

### Part 11: Proof of Disease (Pages 9-10)
**Complexity**: Low | **Estimated Time**: 45 minutes | **Fields**: 3 checkboxes + text field

**Fields to Map**:

**Page 9-10**:
```
- [ ] I HAVE SUBMITTED CERTIFIED MEDICAL RECORDS SHOWING A DIAGNOSIS
      OF A COMPENSABLE CANCER
```

**Page 10**:
```
- [ ] I WANT THE RECA PROGRAM TO CONTACT A STATE CANCER REGISTRY AND I
      HAVE SIGNED THE AUTHORIZATION TO RELEASE MEDICAL INFORMATION

RESEP Clinic Assistance:
Have you received assistance from a RESEP clinic?
- [ ] YES  [ ] NO

If yes, specify clinic:
_______________________________________________________________
```

**Data Structure Needed**:
```typescript
part_11?: {
  submittedMedicalRecords: boolean;
  requestCancerRegistry: boolean;
  receivedRESEPAssistance: boolean;
  resepClinicName?: string;
}
```

---

### Part 12: Previous Payments (Page 10)
**Complexity**: Low | **Estimated Time**: 30 minutes | **Fields**: 2 yes/no questions

**Fields to Map**:
```
1. Previous payment of money (including prior RECA payment):
   - [ ] YES  [ ] NO
   (If YES, attach statement with details)

2. Filed claim under EEOICPA?
   - [ ] YES  [ ] NO
```

**Data Structure Needed**:
```typescript
part_12?: {
  receivedPreviousPayment: boolean;
  previousPaymentDetails?: string; // Attachment reference
  filedEEOICPA: boolean;
}
```

---

### Part 13: Attorney Representation (Page 11)
**Complexity**: Medium | **Estimated Time**: 45 minutes | **Fields**: 1 yes/no + full attorney contact form

**Fields to Map**:

**Question**:
```
Have you hired an attorney?
- [ ] YES  [ ] NO
```

**Attorney Information** (if YES - character-spaced boxes):
```
First Name:    [_][_][_][_][_][_][_][_][_][_][_]
Last Name:     [_][_][_][_][_][_][_][_][_][_][_][_][_][_][_][_]
Firm:          [___________________________________]
Mailing Address: [___________________________________]
City:          [___________________]
State:         [__]
Zip Code:      [_____]
Phone Number:  [___] - [___] - [____]
Fax Number:    [___] - [___] - [____]
E-mail Address: [___________________________________]
```

**Data Structure Needed**:
```typescript
part_13?: {
  hasAttorney: boolean;
  attorney?: {
    firstName: string;
    lastName: string;
    firm: string;
    mailingAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    faxNumber: string;
    email: string;
  }
}
```

---

### Part 14: Attorney Acknowledgment (Page 12)
**Complexity**: Low | **Estimated Time**: 20 minutes | **Fields**: 2 checkboxes + signature line

**Fields to Map**:
```
Fee percentage selection:
- [ ] 2% for filing of initial claim
- [ ] 10% with respect to claim with contract before July 10, 2000;
      or resubmission of denied claim

Signature line:
X_____________________________________________ Date: __________
```

**Data Structure Needed**:
```typescript
part_14?: {
  feePercentage: '2%' | '10%';
  attorneySignatureDate?: string; // Date only, signature is manual
}
```

**Notes**:
- Only filled if Part 13 hasAttorney = true
- Signature line is for attorney, not filer

---

### Part 15: Legal Guardians (Page 12)
**Complexity**: Low | **Estimated Time**: 30 minutes | **Fields**: Full contact form (character-spaced)

**Fields to Map**:
```
First Name:           [_][_][_][_][_][_][_][_][_][_][_]
Middle Name:          [_][_][_][_][_][_][_][_][_][_][_]
Last Name:            [_][_][_][_][_][_][_][_][_][_][_][_][_][_][_][_]
Mailing Address:      [___________________________________]
City:                 [___________________]
State:                [__]
Zip Code:             [_____]
Phone Number (day):   [___] - [___] - [____]
Phone Number (evening): [___] - [___] - [____]
E-mail Address:       [___________________________________]
```

**Data Structure Needed**:
```typescript
part_15?: {
  guardian: {
    firstName: string;
    middleName: string;
    lastName: string;
    mailingAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneDay: string;
    phoneEvening: string;
    email: string;
  }
}
```

**Notes**:
- Only used if filer has court-appointed guardian
- Power of attorney is NOT a legal guardian

---

### Part 16: Signature (Page 13) ⚠️ HIGH PRIORITY
**Complexity**: Low | **Estimated Time**: 20 minutes | **Fields**: 1 signature line

**Fields to Map**:
```
Signature line:
X_____________________________________________ Date: __________
```

**Data Structure Needed**:
```typescript
part_16: {
  signatureDate: string; // Date only, signature is manual
}
```

**Notes**:
- REQUIRED - claim cannot be processed without this
- Signature itself is manual, we only fill the date
- This is the final page of the main form

---

## 📄 SUPPORTING FORMS (Pages 14-17)

### Form 1: Authorization to Release Medical Information (Page 14)
**Complexity**: Low | **Time**: 30 min | **Page**: 14

**Fields to Map**:
```
STATE OF RESIDENCE AT TIME OF DIAGNOSIS: _________________________

1. Name of individual whose records are to be released:
   (First, Middle, Maiden, Last, Other)
   _______________________________________________________________

2. Social Security number: _______________

3. Birth date: _______________

4. Date of death (if applicable): _______________

5. Name of individual requesting release (if different):
   _______________________________________________________________

Signature: X________________________________ Date: __________
```

**Data Structure**:
```typescript
medicalReleaseForm?: {
  stateOfResidence: string;
  subjectName: string;
  subjectSSN: string;
  subjectBirthDate: string;
  subjectDeathDate?: string;
  requesterName?: string;
  signatureDate: string;
}
```

---

### Form 2: Certification of Identity and Privacy Act Release (Page 15)
**Complexity**: Medium | **Time**: 30 min | **Page**: 15

**Fields to Map**:

**Section 1: Certification of Identity**:
```
Full Name: _______________________________________________
Citizenship Status: _______________
Social Security Number: _______________
Current Address: _______________________________________________
Date of Birth: _______________ Place of Birth: _______________

Signature: X________________________________ Date: __________
```

**Section 2: Authorization to Release (OPTIONAL)**:
```
Print or Type Name: _______________
Relationship to Requester: _______________
Phone Number: _______________
Current Address: _______________

Signature: X________________________________ Date: __________
```

**Data Structure**:
```typescript
certificationOfIdentity?: {
  section1: {
    fullName: string;
    citizenshipStatus: string;
    ssn: string;
    currentAddress: string;
    dateOfBirth: string;
    placeOfBirth: string;
    signatureDate: string;
  };
  section2?: {
    authorizedPersonName: string;
    relationship: string;
    phoneNumber: string;
    currentAddress: string;
    signatureDate: string;
  };
}
```

---

### Form 3: Release of Tribal Vital Records (Page 16)
**Complexity**: Low | **Time**: 20 min | **Page**: 16

**Fields to Map**:
```
Tribal Organization Selection:
- [ ] THE NAVAJO NATION OFFICE OF VITAL RECORDS
- [ ] THE HOPI TRIBE ENROLLMENT DEPARTMENT
- [ ] SAN CARLOS APACHE TRIBAL ENROLLMENT OFFICE
- [ ] Other: ________________________________________

Claimant Name: _______________________________________________

Name of tribal organization: _________________________________

Signature: X________________________________ Date: __________
```

**Data Structure**:
```typescript
tribalRecordsRelease?: {
  tribalOrganization: 'navajo' | 'hopi' | 'san_carlos_apache' | 'other';
  otherTribalOrg?: string;
  claimantName: string;
  tribalOrgName: string;
  signatureDate: string;
}
```

---

### Form 4: Attached Signatures of Eligible Surviving Beneficiaries (Page 17)
**Complexity**: Medium | **Time**: 45 min | **Page**: 17

**Fields to Map** - Repeating section for up to 4 beneficiaries:
```
For each beneficiary (1-4):
1. Name (Please print): ___________________________________
   Social Security number: _____________ Date: __________
   Signature: X________________________________________
   Attorney name (if represented): _____________________
   Phone number: __________

2. Name (Please print): ___________________________________
   [Same fields repeat]

3. Name (Please print): ___________________________________
   [Same fields repeat]

4. Name (Please print): ___________________________________
   [Same fields repeat]

- [ ] Additional beneficiaries on attached sheet
```

**Data Structure**:
```typescript
beneficiarySignatures?: {
  beneficiaries: Array<{
    name: string;
    ssn: string;
    signatureDate: string;
    attorneyName?: string;
    phoneNumber?: string;
  }>;
  additionalBeneficiariesAttached: boolean;
}
```

**Notes**:
- Only used for Part 6 (Surviving Child) claims
- Expedites claim processing
- Up to 4 pre-printed, more can be added on back

---

## 🔍 Common Issues & Solutions

### Text Not Appearing
- ✅ Check page index is correct (0-indexed)
- ✅ Verify coordinates are in bounds (0-612 x, 0-792 y)
- ✅ Check field key matches in both FIELD_COORDINATES and drawText() call

### Text Misaligned
- ✅ Use calibration grid to verify coordinates
- ✅ Remember Y-axis: 0 = bottom, 792 = top
- ✅ Adjust characterSpacing for boxed fields

### Text Overlapping
- ✅ Reduce fontSize
- ✅ Adjust maxWidth
- ✅ Use characterSpacing for boxed fields

### Checkbox Not Visible
- ✅ Position slightly inside checkbox border
- ✅ Check font size (usually 10-12pt)
- ✅ Use boldFont for better visibility

---

## 📊 Current State Summary

### ✅ What Works Now
- Core PDF filling infrastructure
- Calibration and testing tools
- Parts 1-3 fully functional:
  - Filer personal information
  - Claimant information (if different)
  - Relationship selection

### ⏳ What's Next (Recommended Order)

1. **Part 8 - Exposure** (1.5 hrs) ← START HERE
   - Most critical for all claims
   - Complex with multiple location entries

2. **Part 10 - Diseases** (1 hr)
   - Critical for all claims
   - Multiple checkboxes

3. **Part 5 - Surviving Spouse** (45 min)
   - Common use case
   - Multiple sub-sections

4. **Part 11 - Proof of Disease** (45 min)
   - Common use case
   - Checkboxes + text fields

5. **Remaining Parts** (5-6 hrs)
   - Parts 4, 6, 7, 9, 12-16
   - Supporting forms

### 🎯 MVP Milestone
To have a **minimally viable product**, we need:
- ✅ Parts 1-3 (Done)
- ⏳ Part 8 - Exposure
- ⏳ Part 10 - Diseases
- ⏳ Part 16 - Signature acknowledgment

**MVP Time Estimate**: ~3 additional hours

---

## 💾 Important Files Reference

### Source Code
```
src/lib/reca/
├── pdf-form-filler.ts          # Main form filler (edit this)
├── pdf-generator.ts            # Old generator (keep for reference)
└── types.ts                    # TypeScript types

scripts/
├── calibrate-pdf-coordinates.ts   # Generate calibration grid
├── test-pdf-form-filling.ts       # Test form filling
└── inspect-pdf-fields.ts          # PDF field inspector
```

### Documentation
```
docs/
├── PROJECT_PROGRESS_TRACKER.md      # This file - progress tracking
├── PDF_FILLING_IMPLEMENTATION.md    # Technical overview
├── PDF_FORM_FILLING_GUIDE.md        # Detailed mapping guide
└── test-output/
    ├── calibration-grid.pdf         # Coordinate finder
    └── filled-reca-form-test.pdf    # Test output
```

### Official Form
```
docs/
└── RECA Downwinder Claim Form.pdf   # Official government PDF
```

---

## 🚀 How to Continue in Next Conversation

Just say one of these:

**Option 1 - Continue incrementally:**
> "Let's map Part 8 (Exposure) next"

**Option 2 - Do multiple parts:**
> "Map Parts 8 and 10 (the critical ones)"

**Option 3 - Complete the project:**
> "Finish mapping all remaining parts (4-16)"

**Option 4 - Move to integration:**
> "The mapping is done, let's integrate with the form submission workflow"

I'll have full context of:
- ✅ All existing code and files
- ✅ The coordinate mapping system
- ✅ Current progress state
- ✅ What needs to be done next

---

## 📈 Completion Checklist

### Foundation ✅
- [x] PDF form filler service
- [x] Coordinate system established
- [x] Calibration tool created
- [x] Test framework working
- [x] Documentation written

### Form Mapping (35% complete)
- [x] Part 1 - Filer info
- [x] Part 2 - Claimant info
- [x] Part 3 - Relationship
- [ ] Part 4 - Self-filer docs
- [ ] Part 5 - Surviving spouse
- [ ] Part 6 - Surviving child
- [ ] Part 7 - Other relatives
- [ ] Part 8 - Exposure ⚠️ **CRITICAL**
- [ ] Part 9 - Proof of presence
- [ ] Part 10 - Diseases ⚠️ **CRITICAL**
- [ ] Part 11 - Proof of disease
- [ ] Part 12 - Previous payments
- [ ] Part 13 - Attorney rep
- [ ] Part 14 - Attorney ack
- [ ] Part 15 - Legal guardian
- [ ] Part 16 - Signature

### Supporting Forms
- [ ] Medical Information Release
- [ ] Certification of Identity
- [ ] Tribal Records Release
- [ ] Surviving Beneficiaries Signatures

### Integration
- [ ] Replace old PDF generator
- [ ] Update API endpoints
- [ ] Test with real data
- [ ] Deploy to production

---

## 🎓 Key Concepts to Remember

### Coordinate System
- Origin: Bottom-left corner (not top-left!)
- X: 0 (left) → 612 (right)
- Y: 0 (bottom) → 792 (top)
- Units: Points (72 per inch)

### Field Types
- **text**: Regular text with maxWidth
- **checkbox**: X mark at position
- **date**: Auto-formats MM/DD/YYYY
- **characterSpacing**: For boxed character fields (SSN, names)

### Best Practices
1. Map 2-3 fields at a time
2. Test after each batch
3. Use calibration grid for accuracy
4. Start with simple fields in each section
5. Document tricky fields with comments

---

**Last Updated**: 2025-10-27 (Initial architecture complete, Parts 1-3 mapped, detailed specifications added for all remaining parts)
**Next Milestone**: Map Parts 8 & 10 (critical path)
**Estimated Time to MVP**: ~3 hours
**Estimated Time to Complete**: ~12 hours total

---

## 📊 COMPREHENSIVE FIELD INVENTORY

### Summary Statistics
```
Main Form (Parts 1-16):
- Total Parts: 16
- Total Fields: ~200+
- Checkboxes: ~80
- Text Fields: ~120
- Character-spaced fields: ~40

Supporting Forms:
- Total Forms: 4
- Total Fields: ~50
- Pages: 4 (14-17)

Grand Total:
- Pages: 17
- Fields: ~250
- Estimated Coordinate Mappings: ~250
```

### Field Type Breakdown by Part

| Part | Checkboxes | Text Fields | Radio/Options | Character-Spaced | Repeating Sections |
|------|------------|-------------|---------------|------------------|-------------------|
| 1 | 0 | 8 | 0 | 8 | No |
| 2 | 0 | 6 | 0 | 6 | No |
| 3 | 6 | 0 | 1 group | 0 | No |
| 4 | 2 | 0 | 0 | 0 | No |
| 5 | 13 | 4+ | 4 pairs | 0 | Yes (text lines) |
| 6 | 13 | 15+ | 2 groups | 0 | Yes (siblings) |
| 7 | 7 | 0 | 1 group | 0 | No |
| 8 | 3 | 32 | 1 group | 0 | Yes (locations) |
| 9 | 1 | 0 | 0 | 0 | No |
| 10 | 20 | 0 | 0 | 0 | No |
| 11 | 4 | 1 | 1 pair | 0 | No |
| 12 | 4 | 1+ | 2 pairs | 0 | No |
| 13 | 2 | 9 | 1 pair | 9 | No |
| 14 | 2 | 1 | 1 group | 0 | No |
| 15 | 0 | 9 | 0 | 9 | No |
| 16 | 0 | 1 | 0 | 0 | No |
| **Subtotal** | **77** | **87+** | **14** | **32** | **3 types** |

### Supporting Forms Field Breakdown

| Form | Page | Checkboxes | Text Fields | Character-Spaced | Complexity |
|------|------|------------|-------------|------------------|------------|
| Medical Release | 14 | 0 | 6 | 0 | Low |
| Certification | 15 | 0 | 12 | 0 | Medium |
| Tribal Records | 16 | 4 | 3 | 0 | Low |
| Beneficiaries | 17 | 1 | 20 | 0 | Medium |
| **Subtotal** | **4** | **5** | **41** | **0** | - |

### Priority Matrix

**Must Have (MVP)**:
- ✅ Part 1: Filer Info (Done)
- ✅ Part 2: Claimant Info (Done)
- ✅ Part 3: Relationship (Done)
- ⏳ Part 8: Exposure (Critical - 1.5 hrs)
- ⏳ Part 10: Diseases (Critical - 1 hr)
- ⏳ Part 16: Signature (High Priority - 20 min)

**Should Have (Common Use Cases)**:
- Part 4: Self-Filers (20 min)
- Part 5: Surviving Spouse (45 min)
- Part 11: Proof of Disease (45 min)

**Could Have (Less Common)**:
- Part 6: Surviving Child (1 hr)
- Part 7: Other Relations (30 min)
- Part 9: Proof of Presence (30 min)
- Part 12: Previous Payments (30 min)
- Part 13: Attorney Rep (45 min)

**Nice to Have (Optional)**:
- Part 14: Attorney Ack (20 min)
- Part 15: Legal Guardian (30 min)
- Supporting Forms (2 hrs total)

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 2A: MVP Completion (3 hours)
Goal: Get to a functional minimum viable product

1. **Part 8: Exposure** (1.5 hrs)
   - 3 exposure option checkboxes
   - 3 simple state location tables (Idaho, New Mexico, Utah)
   - 6 Arizona county location rows
   - 6 Nevada county location rows
   - Total: ~32 text field coordinates + 3 checkboxes

2. **Part 10: Diseases** (1 hr)
   - 20 disease checkboxes in 2-column layout
   - Precise vertical alignment needed
   - Test with multiple disease selections

3. **Part 16: Signature** (20 min)
   - 1 date field
   - Simple but critical

**Deliverable**: Users can submit self-filed claims with exposure and disease info

---

### Phase 2B: Common Cases (3 hours)
Goal: Cover 80% of real-world use cases

4. **Part 4: Self-Filers** (20 min)
   - 2 document checkboxes

5. **Part 5: Surviving Spouse** (45 min)
   - 4 yes/no pairs (8 checkboxes)
   - Text lines for spouse details
   - 9 document checkboxes

6. **Part 11: Proof of Disease** (45 min)
   - 3 checkboxes
   - 1 yes/no pair
   - 1 text field

7. **Part 12: Previous Payments** (30 min)
   - 2 yes/no pairs

8. **Part 13: Attorney** (45 min)
   - 1 yes/no
   - 9 attorney contact fields (character-spaced)

**Deliverable**: Surviving spouse claims fully supported

---

### Phase 2C: Full Coverage (4 hours)
Goal: Support all claim types

9. **Part 6: Surviving Child** (1 hr)
   - 2 yes/no pairs
   - 1 3-option radio group
   - Sibling repeating section (3 entries)
   - 11 document checkboxes

10. **Part 7: Other Relations** (30 min)
    - 1 3-option radio group
    - 7 document checkboxes

11. **Part 9: Proof of Presence** (30 min)
    - 1 checkbox

12. **Part 14: Attorney Ack** (20 min)
    - 2 checkboxes
    - 1 date field

13. **Part 15: Legal Guardian** (30 min)
    - 9 contact fields (character-spaced)

**Deliverable**: All main form parts complete

---

### Phase 2D: Supporting Forms (2 hours)
Goal: Complete all supporting documentation

14. **Medical Release Form** (30 min)
    - 6 text fields
    - Page 14

15. **Certification Form** (30 min)
    - 12 text fields (2 sections)
    - Page 15

16. **Tribal Records Form** (20 min)
    - 4 checkboxes
    - 3 text fields
    - Page 16

17. **Beneficiary Signatures** (45 min)
    - Repeating section (4 beneficiaries)
    - 5 fields per beneficiary
    - Page 17

**Deliverable**: 100% form coverage

---

## 🔄 NEXT STEPS DECISION TREE

```
START
  |
  ├─ Want MVP? (3 hrs)
  |    └─ Map Parts 8, 10, 16
  |         └─ Ready for basic self-filed claims
  |
  ├─ Want Common Cases? (6 hrs total)
  |    └─ Add Parts 4, 5, 11, 12, 13
  |         └─ Ready for 80% of claims
  |
  ├─ Want Full Form? (10 hrs total)
  |    └─ Add Parts 6, 7, 9, 14, 15
  |         └─ Ready for all claim types
  |
  └─ Want Supporting Forms? (12 hrs total)
       └─ Add 4 supporting forms
            └─ 100% complete
```

---

**Last Updated**: 2025-10-27 (Initial architecture complete, Parts 1-3 mapped, detailed specifications added for all remaining parts)
**Next Milestone**: Map Parts 8 & 10 (critical path)
**Estimated Time to MVP**: ~3 hours
**Estimated Time to Complete**: ~12 hours total

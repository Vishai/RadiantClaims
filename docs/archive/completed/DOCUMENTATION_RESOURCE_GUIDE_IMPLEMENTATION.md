# Documentation Resource Guide Implementation Plan

## Overview

This document outlines the complete implementation of the Smart Documentation & Forms Guide feature for RadiantClaims. This feature helps claimants find the correct RECA forms, understand which documents they need based on their specific situation, and locate jurisdiction-specific resources to obtain those documents.

**Key Objectives:**
- Guide users to the correct RECA claim form (4 types available)
- Provide personalized document checklists based on claim type and relationship
- Show jurisdiction-specific resources (county clerks, vital records, hospitals, etc.)
- Clarify certification requirements (original/certified vs digital)
- Integrate seamlessly into existing intake workflow

**Source of Truth:** https://www.justice.gov/civil/reca

---

## Architecture Overview

### Data Sources
1. **RECA Forms** (4 PDFs in `/docs` folder)
   - Downwinder Claim Form
   - Uranium Worker Claim Form
   - Manhattan Project Waste Claim Form
   - General RECA Claim Form

2. **Resource Database** (populated from `/Legacy Yield/01_Strategy/Context & Research/RECA Documentation Resources.md`)
   - State-level resources (vital records, archives)
   - County-level resources (clerk, recorder, assessor, courts)
   - Medical facilities (hospitals, cancer registries)
   - Tribal resources (for Native American claimants)

3. **Document Requirements Matrix**
   - Mapped by: Claim Type × Relationship Type × Cancer Type
   - Specifies: Required docs, certification needs, priorities, where to obtain

### Database Schema

#### New Models to Add

```prisma
// ============================================================================
// RECA FORMS MANAGEMENT
// ============================================================================

model RECAForm {
  id              String       @id @default(cuid())
  formType        RECAFormType
  fileName        String       // "RECA Downwinder Claim Form.pdf"
  fileKey         String       // Path or S3/R2 key
  version         String       // "Revised July 2025"
  pageCount       Int
  description     String       @db.Text
  instructions    String       @db.Text
  oMBApprovalNo   String?      // "1105-0052"
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([formType])
}

enum RECAFormType {
  DOWNWINDER
  URANIUM_WORKER
  MANHATTAN_PROJECT_WASTE
  GENERAL_RECA
}

// ============================================================================
// DOCUMENTATION RESOURCES (WHERE TO GET DOCUMENTS)
// ============================================================================

model DocumentResource {
  id                     String       @id @default(cuid())
  state                  String       // "UT", "ID", "NM", "AZ", "NV"
  county                 String?      // null = state-level resource
  resourceType           ResourceType
  name                   String
  department             String?      // "Member and Statistical Records Division"
  address                String?
  address2               String?
  city                   String?
  stateCode              String?
  zipCode                String?
  phone                  String?
  phoneTollFree          String?
  fax                    String?
  website                String?
  email                  String?
  notes                  String?      @db.Text
  documentTypesProvided  String[]     // ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE"]
  certificationAvailable Boolean      @default(true)
  processingTimeDays     Int?         // Estimated turnaround time
  specialInstructions    String?      @db.Text
  isTribal               Boolean      @default(false)
  tribalAffiliation      String?      // "Navajo Nation", "Hopi Tribe", etc.

  @@index([state, county])
  @@index([resourceType])
  @@index([state, resourceType])
}

enum ResourceType {
  // Government
  VITAL_RECORDS
  COUNTY_CLERK
  COUNTY_RECORDER
  COUNTY_ASSESSOR
  COUNTY_TREASURER
  DISTRICT_COURT
  STATE_ARCHIVES
  TAX_COMMISSION
  DMV

  // Medical
  HOSPITAL
  CANCER_REGISTRY
  RADIATION_CONTROL

  // Education
  SCHOOL_DISTRICT
  UNIVERSITY

  // Religious
  CHURCH

  // Tribal
  TRIBAL_OFFICE
  TRIBAL_VITAL_RECORDS

  // Other
  FEDERAL_ARCHIVES
  IRS
  SOCIAL_SECURITY
  MINING_ADMINISTRATION
}

// ============================================================================
// DOCUMENT REQUIREMENTS (WHAT DOCS ARE NEEDED)
// ============================================================================

model DocumentRequirement {
  id                     String           @id @default(cuid())
  claimType              ClaimType?       // null = applies to all claim types
  relationshipToClaimant RelationshipType
  documentType           String           // "BIRTH_CERTIFICATE", "PATHOLOGY_REPORT"
  displayName            String           // "Birth Certificate"
  description            String           @db.Text
  requiresCertification  Boolean          // Must be certified/original for mail
  acceptsDigital         Boolean          // Can submit digitally
  isRequired             Boolean
  priority               RequirementPriority
  resourceTypes          ResourceType[]   // Where to get this document
  notes                  String?          @db.Text
  formSection            String?          // "Part 4", "Part 9", etc.
  multipleRequired       Boolean          @default(false) // e.g., need 2+ proof of residence
  quantityRequired       Int?             // How many needed
  exampleDocuments       String[]         // Specific examples

  @@unique([claimType, relationshipToClaimant, documentType])
  @@index([claimType])
  @@index([relationshipToClaimant])
}

enum RelationshipType {
  SELF
  SPOUSE
  CHILD
  PARENT
  GRANDCHILD
  GRANDPARENT
}

enum RequirementPriority {
  HIGH      // Required - claim cannot proceed without this
  MEDIUM    // Strongly recommended - helps establish claim
  OPTIONAL  // Helpful but not required
}

// ============================================================================
// MEDICAL RECORD REQUIREMENTS (CANCER-SPECIFIC)
// ============================================================================

model MedicalRecordRequirement {
  id                 String   @id @default(cuid())
  cancerType         String   // "LEUKEMIA", "THYROID_CANCER", etc.
  recordType         String   // "PATHOLOGY_REPORT", "AUTOPSY_REPORT"
  displayName        String   // "Pathology report of tissue biopsy"
  description        String   @db.Text
  priority           Int      // 1 = most preferred, higher = alternatives
  formSection        String?  // Reference to form (e.g., "Part 11")

  @@unique([cancerType, recordType])
  @@index([cancerType])
}

// ============================================================================
// USER DOCUMENT TRACKING (FOR CUSTOMER PORTAL)
// ============================================================================

model ClaimantDocumentStatus {
  id                   String               @id @default(cuid())
  claimantId           String
  claimant             Claimant             @relation(fields: [claimantId], references: [id], onDelete: Cascade)
  documentType         String               // Maps to DocumentRequirement.documentType
  status               DocumentStatusType
  requestedDate        DateTime?
  receivedDate         DateTime?
  uploadedDate         DateTime?
  notes                String?              @db.Text
  resourceContactedId  String?              // Which resource they contacted
  resourceContacted    DocumentResource?    @relation(fields: [resourceContactedId], references: [id])
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  @@unique([claimantId, documentType])
  @@index([claimantId])
  @@index([status])
}

enum DocumentStatusType {
  NOT_STARTED    // Haven't begun obtaining this document
  REQUESTED      // Contacted the resource to request it
  AWAITING       // Waiting to receive from resource
  RECEIVED       // Received but not uploaded
  UPLOADED       // Uploaded to our system
  VERIFIED       // Staff verified the document
}
```

#### Schema Updates to Existing Models

```prisma
// Add to existing Claimant model
model Claimant {
  // ... existing fields ...

  // NEW FIELDS
  claimType              ClaimType?
  relationshipToClaimant RelationshipType?
  cancerType             String?              // Reference to specific cancer
  documentStatuses       ClaimantDocumentStatus[]
}

// Update existing ClaimType enum
enum ClaimType {
  // ... existing values ...

  // ADD THESE
  DOWNWINDER
  URANIUM_WORKER
  MANHATTAN_PROJECT_WASTE
  ONSITE_PARTICIPANT
}
```

---

## Phase 1: Core Infrastructure & Data Foundation

**Goal:** Set up database, seed data, and basic API endpoints

### Tasks

#### 1.1 Database Schema Setup
- [ ] Add new Prisma models to `schema.prisma`
- [ ] Update existing models with new fields
- [ ] Run `pnpm db:generate` to generate Prisma client
- [ ] Run `pnpm db:push` to update database schema

#### 1.2 Form Management
- [ ] Ensure all 4 RECA forms are in `/docs` folder:
  - `RECA Claim Form.pdf`
  - `RECA Downwinder Claim Form.pdf`
  - `RECA Uranium Worker Claim Form.pdf`
  - `RECA Manhattan Project Waste Claim Form.pdf`
- [ ] Set up public serving of PDFs (via `/api/forms/download/[formType]`)
- [ ] Create form metadata seed data

#### 1.3 Data Seeding Scripts

**File: `scripts/seed-documentation-resources.ts`**

Parse `/Users/brandonarmstrong/Documents/Github/Legacy Yield/01_Strategy/Context & Research/RECA Documentation Resources.md` and populate:

- DocumentResource (all state/county contacts)
- RECAForm (form metadata)
- DocumentRequirement (basic requirements matrix)
- MedicalRecordRequirement (from form Medical Records Attachment)

**Key Data to Seed:**

**Utah State Resources:**
```typescript
{
  state: "UT",
  county: null,
  resourceType: "VITAL_RECORDS",
  name: "Utah Department of Health and Human Services - Vital Records",
  address: "288 N 1460 W",
  city: "Salt Lake City",
  stateCode: "UT",
  zipCode: "84116",
  phone: "(801) 538-6105",
  website: "vitalrecords.utah.gov",
  documentTypesProvided: ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE", "MARRIAGE_CERTIFICATE"],
  certificationAvailable: true,
  processingTimeDays: 14
}
```

**LDS Church (Special Case - Fastest Resource):**
```typescript
{
  state: "UT",
  county: null,
  resourceType: "CHURCH",
  name: "The Church of Jesus Christ of Latter-day Saints",
  department: "Member and Statistical Records Division",
  address: "50 East North Temple Street, Seventeenth Floor",
  city: "Salt Lake City",
  stateCode: "UT",
  zipCode: "84150",
  phone: "(801) 240-3500",
  documentTypesProvided: ["CHURCH_RECORDS", "MEMBERSHIP_RECORDS"],
  certificationAvailable: true,
  processingTimeDays: 14,
  notes: "Church records are often the fastest way to prove residence. You must call them directly and request they send information to the RECA Program."
}
```

**Document Requirements Examples:**

```typescript
// Birth Certificate - Self Filer
{
  claimType: "DOWNWINDER",
  relationshipToClaimant: "SELF",
  documentType: "BIRTH_CERTIFICATE_SELF",
  displayName: "Your Birth Certificate",
  description: "Certified or original birth certificate to verify your identity",
  requiresCertification: true,
  acceptsDigital: true,
  isRequired: true,
  priority: "HIGH",
  resourceTypes: ["VITAL_RECORDS"],
  formSection: "Part 4",
  notes: "Unless filing electronically, you must provide certified or original copies."
}

// Proof of Residence - All Downwinders
{
  claimType: "DOWNWINDER",
  relationshipToClaimant: "SELF", // Applies to all
  documentType: "PROOF_OF_RESIDENCE",
  displayName: "Proof of Residence (2+ sources)",
  description: "Documents showing you lived in an affected area during the testing period",
  requiresCertification: true,
  acceptsDigital: true,
  isRequired: true,
  priority: "HIGH",
  resourceTypes: ["SCHOOL_DISTRICT", "CHURCH", "COUNTY_ASSESSOR", "COUNTY_CLERK"],
  formSection: "Part 9",
  multipleRequired: true,
  quantityRequired: 2,
  exampleDocuments: [
    "School records or yearbooks",
    "Church membership records",
    "Employment or tax records",
    "Utility bills or letters with postmarks",
    "Marriage or birth certificates listing residence",
    "Voting or military registration"
  ],
  notes: "Church records are often the fastest! You need at least 2 different sources."
}

// Pathology Report
{
  claimType: "DOWNWINDER",
  relationshipToClaimant: "SELF",
  documentType: "PATHOLOGY_REPORT",
  displayName: "Pathology Report",
  description: "Pathology report of tissue biopsy showing cancer diagnosis",
  requiresCertification: true,
  acceptsDigital: true,
  isRequired: true,
  priority: "HIGH",
  resourceTypes: ["HOSPITAL", "CANCER_REGISTRY"],
  formSection: "Part 11",
  notes: "This is the most important medical document. See Medical Records Attachment for alternatives."
}

// Sibling Death Certificates (Children Only)
{
  claimType: "DOWNWINDER",
  relationshipToClaimant: "CHILD",
  documentType: "SIBLING_DEATH_CERTIFICATES",
  displayName: "Death Certificates for Deceased Siblings",
  description: "Death certificates for ALL siblings who have passed away",
  requiresCertification: true,
  acceptsDigital: true,
  isRequired: true,
  priority: "HIGH",
  resourceTypes: ["VITAL_RECORDS"],
  formSection: "Part 6",
  multipleRequired: true,
  notes: "CRITICAL: All siblings must be disclosed. If any have passed away, their death certificates are required. The $100,000 award is shared equally among all eligible children."
}
```

**Medical Record Requirements:**

```typescript
// Leukemia
{
  cancerType: "LEUKEMIA",
  recordType: "BONE_MARROW_BIOPSY",
  displayName: "Bone marrow biopsy or aspirate report",
  priority: 1,
  formSection: "Medical Records Attachment - (1)"
}

{
  cancerType: "LEUKEMIA",
  recordType: "BLOOD_COUNT",
  displayName: "Peripheral white blood cell differential count report",
  priority: 2
}

// Thyroid Cancer
{
  cancerType: "THYROID_CANCER",
  recordType: "PATHOLOGY_REPORT",
  displayName: "Pathology report of tissue biopsy or fine needle aspirate",
  priority: 1,
  formSection: "Medical Records Attachment - (4)"
}
```

#### 1.4 API Endpoints

**File: `src/app/api/forms/route.ts`**
```typescript
// GET /api/forms
// Returns list of available RECA forms with metadata
```

**File: `src/app/api/forms/[formType]/route.ts`**
```typescript
// GET /api/forms/downwinder
// Returns specific form metadata and download URL
```

**File: `src/app/api/forms/download/[formType]/route.ts`**
```typescript
// GET /api/forms/download/downwinder
// Streams PDF file for download
```

**File: `src/app/api/resources/route.ts`**
```typescript
// GET /api/resources?state=UT&county=Salt Lake
// Returns filtered list of DocumentResources
// Query params: state, county, resourceType, documentType
```

**File: `src/app/api/document-requirements/route.ts`**
```typescript
// GET /api/document-requirements?claimType=DOWNWINDER&relationship=CHILD
// Returns personalized document checklist
```

**File: `src/app/api/medical-records/route.ts`**
```typescript
// GET /api/medical-records?cancerType=THYROID_CANCER
// Returns accepted medical record types for specific cancer
```

### Deliverables - Phase 1
- ✅ Updated database schema
- ✅ Seed scripts populating all resource data
- ✅ API endpoints functional and tested
- ✅ Forms accessible via API

---

## Phase 2: User Interface & Experience

**Goal:** Build user-facing pages and integrate into existing workflow

### Tasks

#### 2.1 Forms Library Page

**File: `src/app/resources/forms/page.tsx`**

Features:
- Display all 4 RECA forms with descriptions
- "Which form do I need?" decision tree
- Download buttons for each form
- Preview modal (PDF viewer)
- Print-friendly checklists

Layout:
```
┌─────────────────────────────────────────────┐
│  RECA Forms Library                         │
├─────────────────────────────────────────────┤
│  [Not sure which form?] → Start Wizard      │
├─────────────────────────────────────────────┤
│  ┌──────────────────────┐                   │
│  │ Downwinder Form      │ [Download] [Info] │
│  │ For individuals who  │                   │
│  │ lived in affected... │                   │
│  └──────────────────────┘                   │
│  ┌──────────────────────┐                   │
│  │ Uranium Worker Form  │ [Download] [Info] │
│  └──────────────────────┘                   │
│  ... (other forms)                          │
└─────────────────────────────────────────────┘
```

#### 2.2 Resource Directory Page

**File: `src/app/resources/documents/page.tsx`**

Features:
- State/County selector
- Filterable by resource type
- Searchable by document type needed
- Contact information cards
- "How to certify documents" guide
- Processing time estimates

Layout:
```
┌──────────────────────────────────────────────┐
│  Documentation Resource Directory            │
├──────────────────────────────────────────────┤
│  Where did the claimant live?                │
│  [State: Utah ▼] [County: Salt Lake ▼]      │
│                                              │
│  What document do you need?                  │
│  [Search: birth certificate...          ]   │
├──────────────────────────────────────────────┤
│  STATE-LEVEL RESOURCES                       │
│  ┌────────────────────────────────────────┐ │
│  │ 📋 Utah Vital Records                  │ │
│  │ Birth/Death/Marriage Certificates      │ │
│  │ 📍 288 N 1460 W, Salt Lake City       │ │
│  │ 📞 (801) 538-6105                      │ │
│  │ 🌐 vitalrecords.utah.gov               │ │
│  │ ⏱️  ~14 days processing                │ │
│  │ [View Details] [Get Directions]        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  SALT LAKE COUNTY RESOURCES                  │
│  ┌────────────────────────────────────────┐ │
│  │ 🏛️ County Clerk                        │ │
│  │ Marriage Records, Voter Registration   │ │
│  │ ...                                    │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

#### 2.3 Personalized Document Checklist (Portal)

**File: `src/app/portal/documents/page.tsx`**

Features:
- Dynamic checklist based on claimant's specific situation
- Visual progress tracking
- Quick actions: "Mark as Requested", "Upload", "View Resource"
- Priority indicators (High/Medium/Optional)
- Sibling disclosure for children filers
- Links to relevant resources
- Document status tracking

Layout:
```
┌────────────────────────────────────────────────┐
│  Your Document Checklist                       │
│  Filing as: Child of Deceased Downwinder       │
├────────────────────────────────────────────────┤
│  Progress: 3/12 documents obtained             │
│  [████████░░░░░░░░] 25%                       │
├────────────────────────────────────────────────┤
│  ✅ DOCUMENTS UPLOADED                         │
│  ✓ Your birth certificate                      │
│  ✓ Death certificate of parent                 │
│  ✓ Birth certificate of parent                 │
├────────────────────────────────────────────────┤
│  ⚠️  CRITICAL - NEED IMMEDIATELY                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🔴 Pathology Report                      │ │
│  │ Most important medical document          │ │
│  │                                          │ │
│  │ Where to get:                            │ │
│  │ → University of Utah Hospital            │ │
│  │   Medical Records: (801) 587-2373        │ │
│  │                                          │ │
│  │ [View Resource Info]                     │ │
│  │ [Mark as Requested] [Upload Document]    │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🔴 Sibling Death Certificates            │ │
│  │ CRITICAL: All siblings must be disclosed │ │
│  │                                          │ │
│  │ You indicated 2 siblings have passed:    │ │
│  │ • John Doe (needed)                      │ │
│  │ • Jane Doe (needed)                      │ │
│  │                                          │ │
│  │ Where to get: Utah Vital Records         │ │
│  │ [View Resource Info] [Upload]            │ │
│  └──────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│  📋 HIGH PRIORITY (Need 2+ sources)            │
│  ┌──────────────────────────────────────────┐ │
│  │ Proof of Residence Documents (0/2)       │ │
│  │                                          │ │
│  │ Fastest options:                         │ │
│  │ 1. ⚡ Church records (~2 weeks)           │ │
│  │    → LDS Church (801) 240-3500           │ │
│  │    [View Details]                        │ │
│  │                                          │ │
│  │ 2. School records (~3 weeks)             │ │
│  │    → Which school district?              │ │
│  │    [Find My School District]             │ │
│  │                                          │ │
│  │ 3. Property tax records (~4 weeks)       │ │
│  │    → Salt Lake County Assessor           │ │
│  │    [View Details]                        │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

#### 2.4 Intake Flow Integration

**Updates to existing intake pages:**

**`src/app/intake/page.tsx`** (Step 1)
- After user enters state/county, show preview:
  ```
  ✓ Great! We have resources for Salt Lake County, Utah
  [Preview Resources] →
  ```

**`src/app/intake/step2/page.tsx`** (Step 2)
- Add claim type selection:
  ```
  Which describes your situation?
  ○ I (or family member) lived in an affected area (Downwinder)
  ○ I (or family member) worked in uranium mining/milling
  ○ Other
  ```

- Add relationship selection:
  ```
  Who are you filing for?
  ○ Myself
  ○ My deceased spouse
  ○ My deceased parent
  ○ Other family member
  ```

**New: `src/app/intake/documents-preview/page.tsx`**
- Show personalized document preview before upload
- "Here's what you'll need based on your situation"
- Link to full resource directory
- Option to download their RECA form now

**`src/app/intake/upload/page.tsx`** (Existing)
- Enhanced with checklist from document requirements
- Show which resource to contact for each missing doc

#### 2.5 Email Templates

**Welcome Email Enhancement**
```
Subject: Your RadiantClaims Next Steps - Document Guide

Hi [Name],

Thank you for starting your RECA claim! Based on your situation
(filing as a child for a parent in Salt Lake County, Utah),
here's what you'll need:

📋 YOUR PERSONALIZED DOCUMENT CHECKLIST

HIGH PRIORITY:
✓ Pathology report → Contact University of Utah Hospital
✓ Birth certificates → Contact Utah Vital Records
✓ Proof of residence (2 sources) → Church records are fastest!

[View Full Checklist in Your Portal]
[Download Your RECA Form]
[Browse Resource Directory]

Need help? Reply to this email or call us at...
```

**Document Reminder Email** (automated)
```
Subject: Reminder: Documents Still Needed for Your Claim

Hi [Name],

You're making progress! You've uploaded 3 of 12 documents.

CRITICAL - Need immediately:
• Pathology report showing cancer diagnosis

Here's where to get it:
University of Utah Hospital Medical Records
Phone: (801) 587-2373
[Get Full Contact Info]

[View Your Complete Checklist]
```

### Deliverables - Phase 2
- ✅ Forms library page functional
- ✅ Resource directory searchable and filterable
- ✅ Portal document checklist personalized
- ✅ Intake flow integrated with resource guidance
- ✅ Email templates updated

---

## Phase 3: Advanced Features & Automation

**Goal:** Streamline the process with smart features

### Tasks

#### 3.1 Interactive Form Wizard

**File: `src/app/resources/forms/wizard/page.tsx`**

Decision tree to determine correct form:

```
Question 1: How were you (or your family member) exposed?
○ Lived in an affected area → DOWNWINDER
○ Worked in uranium mining/milling → URANIUM WORKER
○ Lived near Manhattan Project waste site → MANHATTAN PROJECT
○ Not sure → Show eligibility criteria

Question 2: [Based on answer to Q1, ask follow-ups]
For Downwinder:
  - Which state? [validates against eligible areas]
  - During what years? [validates dates]

Result: "You need the Downwinder Claim Form"
[Download Form] [View Document Checklist] [Start Intake]
```

#### 3.2 PDF Form Pre-Fill

**File: `src/app/api/forms/prefill/route.ts`**

Generate partially completed PDF from intake data:

```typescript
// Use pdf-lib to:
// 1. Load RECA form PDF
// 2. Fill in fields from claimant data:
//    - Part 1: Name, address, contact info
//    - Part 2: Deceased person info (if applicable)
//    - Part 3: Relationship checkbox
//    - Part 8: Location checkboxes and dates
// 3. Return modified PDF for download
```

Features:
- "Download Pre-Filled Form" button in portal
- Saves hours of manual data entry
- Still need to complete medical/document sections

#### 3.3 Document Request Letter Generator

**File: `src/app/resources/letters/page.tsx`**

Generate printable request letters for records offices:

```
[User selects: Birth Certificate from Utah Vital Records]

Generates:

────────────────────────────────────
Utah Department of Health and Human Services
Vital Records Office
288 N 1460 W
Salt Lake City, UT 84116

[Date]

RE: Request for Certified Birth Certificate

To Whom It May Concern:

I am requesting a certified copy of my birth certificate
for the purpose of filing a claim under the Radiation
Exposure Compensation Act (RECA).

Information:
Full Name: [John Doe]
Date of Birth: [MM/DD/YYYY]
Place of Birth: [Salt Lake City, Utah]
Mother's Name: [Jane Doe]
Father's Name: [Jim Doe]

I understand there may be a fee for this service. Please
contact me at the information below if additional
information is needed.

Sincerely,
[Signature line]

Contact Information:
[Address]
[Phone]
[Email]
────────────────────────────────────

[Print] [Download PDF] [Email to Myself]
```

#### 3.4 Processing Time Tracker

**File: `src/components/resource/ProcessingTimeIndicator.tsx`**

Visual indicators for how long each document takes:

```
Utah Vital Records
⚡ FAST (~2 weeks)
[████████░░]

LDS Church Records
⚡⚡ FASTEST (~1-2 weeks)
[██████████]

County Assessor
⏱️  SLOW (~4-6 weeks)
[████░░░░░░]
```

Set expectations and encourage users to start with fastest options.

#### 3.5 Document Status Dashboard (Attorney Portal)

**File: `src/app/attorney/claimants/[id]/documents/page.tsx`**

For attorneys to track client document progress:

```
┌─────────────────────────────────────────┐
│  Client: John Doe                       │
│  Claim Type: Downwinder - Child         │
├─────────────────────────────────────────┤
│  Document Status Overview               │
│  [████████░░░░░░░░] 40% Complete       │
│                                         │
│  ✅ COMPLETE (5)                        │
│  ⏳ IN PROGRESS (3)                     │
│  ❌ NOT STARTED (4)                     │
├─────────────────────────────────────────┤
│  🔴 BLOCKERS                            │
│  • Pathology report still needed        │
│  • Only 1/2 proof of residence docs     │
│                                         │
│  [Send Reminder Email]                  │
│  [Schedule Call to Discuss]             │
└─────────────────────────────────────────┘
```

#### 3.6 Smart Resource Recommendations

ML/rule-based system to suggest best resources:

```typescript
function recommendResources(claimant: Claimant): Resource[] {
  const recommendations = [];

  // If Mormon, prioritize LDS Church
  if (claimant.county === "Salt Lake" || claimant.state === "UT") {
    recommendations.push({
      resource: ldschurch,
      reason: "Fastest for Utah residents",
      estimatedDays: 14
    });
  }

  // If school-aged during exposure, prioritize school records
  const exposureAge = calculateAge(claimant.dob, exposureDates);
  if (exposureAge >= 5 && exposureAge <= 18) {
    recommendations.push({
      resource: schoolDistrict,
      reason: "You were school-aged during exposure",
      estimatedDays: 21
    });
  }

  // Always include vital records as backup
  recommendations.push({
    resource: stateVitalRecords,
    reason: "Official government records",
    estimatedDays: 14
  });

  return recommendations;
}
```

### Deliverables - Phase 3
- ✅ Form wizard implemented
- ✅ PDF pre-fill working
- ✅ Request letter generator
- ✅ Processing time tracking
- ✅ Attorney document dashboard
- ✅ Smart recommendations engine

---

## Testing Plan

### Unit Tests

**API Endpoints**
```bash
# Test resource filtering
GET /api/resources?state=UT
  → Should return only Utah resources

GET /api/resources?state=UT&county=Salt%20Lake
  → Should return state + Salt Lake County resources

# Test document requirements
GET /api/document-requirements?claimType=DOWNWINDER&relationship=CHILD
  → Should return child-specific requirements
  → Should include sibling death certificate requirement
```

**Form Selection Logic**
```typescript
test('selects correct form for downwinder', () => {
  const result = selectRECAForm({
    exposureType: 'RESIDENCE',
    location: { state: 'UT', county: 'Salt Lake' },
    dates: { start: '1955-01-01', end: '1960-01-01' }
  });
  expect(result).toBe('DOWNWINDER');
});
```

### Integration Tests

**Intake Flow**
1. User enters Utah, Salt Lake County
2. System shows resource preview
3. User selects "Child of deceased"
4. System shows child-specific requirements
5. System emphasizes sibling disclosure
6. User reaches upload page
7. Checklist shows all required docs for child filer

**Resource Search**
1. User searches "birth certificate"
2. System filters to resources providing birth certificates
3. User selects state/county
4. System shows both state and county options
5. User sees processing time estimates

### User Acceptance Testing

**Scenarios**

1. **Self-Filer Downwinder**
   - Can find correct form
   - Understands which documents needed
   - Can locate resources for their county
   - Knows difference between certified and digital

2. **Child Filing for Deceased Parent**
   - Receives warning about sibling disclosure
   - Checklist includes ALL sibling documents
   - Clear about $100k split among siblings
   - Can track progress for multiple documents

3. **Attorney Using System**
   - Can see client's document status
   - Can identify blockers
   - Can send targeted reminders
   - Understands which resources client should contact

---

## Data Migration Plan

### Initial Seed

```bash
# 1. Generate Prisma client
pnpm db:generate

# 2. Push schema changes
pnpm db:push

# 3. Run seed script
pnpm tsx scripts/seed-documentation-resources.ts
```

### Seed Script Structure

```typescript
// scripts/seed-documentation-resources.ts

async function main() {
  console.log('🌱 Seeding documentation resources...');

  // 1. Seed RECA Forms
  await seedForms();

  // 2. Seed Document Resources (from MD file)
  await seedUtahResources();
  await seedIdahoResources();
  await seedNewMexicoResources();
  await seedArizonaResources();
  await seedNevadaResources();
  await seedMultiStateResources();

  // 3. Seed Document Requirements
  await seedDocumentRequirements();

  // 4. Seed Medical Record Requirements
  await seedMedicalRecordRequirements();

  console.log('✅ Seeding complete!');
}
```

### Verification Queries

```typescript
// Verify data loaded correctly
const utahResources = await db.documentResource.count({
  where: { state: 'UT' }
});
console.log(`Utah resources: ${utahResources}`);

const downwinderRequirements = await db.documentRequirement.count({
  where: { claimType: 'DOWNWINDER' }
});
console.log(`Downwinder requirements: ${downwinderRequirements}`);
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Indexes**
   - Already included in schema on common query patterns
   - `[state, county]` for resource lookups
   - `[claimType, relationshipToClaimant]` for requirements

2. **Caching**
   ```typescript
   // Cache resource directory data (changes infrequently)
   const cacheConfig = {
     resources: { ttl: 3600 }, // 1 hour
     forms: { ttl: 86400 },    // 24 hours
     requirements: { ttl: 3600 } // 1 hour
   };
   ```

3. **Lazy Loading**
   - Load resource details on demand
   - Paginate long lists (e.g., all Utah counties)

4. **PDF Serving**
   - Use CDN for form PDFs
   - Cache control headers: `max-age=86400` (24 hours)

---

## Security Considerations

### Access Control

- **Public Access:** Forms library, resource directory
- **Authenticated:** Document checklist, status tracking
- **Attorney Role:** Client document dashboards

### Data Validation

```typescript
// Validate state/county combinations
const validCounties = {
  'UT': ['Salt Lake', 'Utah', 'Davis', ...],
  'ID': ['Ada', 'Bannock', ...],
  // ...
};

function validateLocation(state: string, county: string) {
  if (!validCounties[state]?.includes(county)) {
    throw new Error('Invalid state/county combination');
  }
}
```

### PII Protection

- Document resources are public data (government contacts)
- User-specific document status is protected behind auth
- No PII in resource data itself

---

## Deployment Plan

### Phase 1 Deployment

1. Deploy schema changes (use Railway migration)
2. Run seed scripts on production
3. Deploy API endpoints
4. Verify via API testing

**Rollback Plan:**
- Schema changes are additive (safe to rollback)
- Seed data can be re-run (idempotent)

### Phase 2 Deployment

1. Deploy new UI pages
2. Update existing intake flow
3. A/B test with small percentage
4. Monitor user engagement

**Feature Flags:**
```typescript
// Can toggle features on/off
const features = {
  documentChecklist: true,
  resourceDirectory: true,
  formWizard: false // Phase 3
};
```

### Phase 3 Deployment

1. Deploy advanced features incrementally
2. Gather user feedback
3. Iterate based on usage analytics

---

## Success Metrics

### Key Performance Indicators

1. **User Engagement**
   - % of users who view resource directory
   - % of users who download forms
   - Time spent on documentation pages

2. **Document Completion**
   - Average # of documents uploaded per user
   - Time from intake to first document upload
   - % of users with complete document sets

3. **Resource Usage**
   - Most accessed resources
   - Most searched document types
   - Processing time accuracy

4. **Attorney Satisfaction**
   - Time saved per client
   - # of reminder emails sent
   - Client document completion rate

### Analytics Events

```typescript
// Track key user actions
analytics.track('resource_viewed', {
  resourceType: 'VITAL_RECORDS',
  state: 'UT',
  county: 'Salt Lake'
});

analytics.track('form_downloaded', {
  formType: 'DOWNWINDER',
  source: 'intake_flow'
});

analytics.track('document_status_updated', {
  documentType: 'BIRTH_CERTIFICATE',
  status: 'REQUESTED'
});
```

---

## Maintenance Plan

### Regular Updates

**Monthly:**
- Review processing time accuracy
- Update contact information as needed
- Add new resources if identified

**Quarterly:**
- Verify all resource websites still active
- Update form versions if DOJ releases new ones
- Review analytics and adjust recommendations

**Annually:**
- Comprehensive audit of all resource data
- User survey on resource quality
- Update documentation requirements if law changes

### Content Management

Consider building admin interface for:
- Updating resource contact information
- Modifying document requirements
- Managing form versions
- Bulk updates to processing times

**File: `src/app/admin/resources/page.tsx`**
```
Admin panel for RadiantClaims staff to maintain resource data
without needing database access or code deployments.
```

---

## Support Documentation

### User Guides

**For Claimants:**
1. "How to Find Your Documents" guide
2. "Understanding Certification Requirements"
3. "Which Form Do I Need?"
4. "Fastest Ways to Get Proof of Residence"

**For Attorneys:**
1. "Tracking Client Document Progress"
2. "Identifying Common Document Blockers"
3. "Best Resources by State"
4. "Sibling Disclosure Requirements"

### FAQ Integration

Common questions to add to website:

- Q: Do I need certified copies?
  A: Yes for mail submission, but digital acceptable if filing online at justice.gov/civil/reca

- Q: How long does it take to get a birth certificate?
  A: Typically 2-4 weeks depending on the state

- Q: What if I can't find proof of residence?
  A: Church records are often the fastest option. Also try school districts, tax records, or employment records.

- Q: How many proof of residence documents do I need?
  A: At least 2 from different sources

---

## Future Enhancements

### Beyond Phase 3

1. **OCR Document Verification**
   - Automatically extract info from uploaded docs
   - Pre-validate document types
   - Flag potential issues

2. **Direct Resource Integration**
   - API connections to vital records offices
   - Real-time processing time estimates
   - Automated document requests

3. **Mobile App**
   - Document checklist on mobile
   - Photo upload of physical documents
   - Push notifications for reminders

4. **Multi-Language Support**
   - Spanish translation for forms and resources
   - Navajo language for tribal resources
   - Other languages as needed

5. **AI Document Assistant**
   - Chatbot to answer document questions
   - Smart suggestions based on claim details
   - Automated follow-ups

---

## Contact & Questions

**Implementation Team:**
- Backend/Database: [Your Name]
- Frontend/UI: [Developer Name]
- Content/Data: [Team Member]

**Key Stakeholders:**
- Product Owner: [Name]
- Legal Review: [Name]
- User Testing: [Name]

**Questions/Issues:**
- Technical: [Slack Channel or Email]
- Content: [Contact for Resource Data]
- Product: [Product Manager Contact]

---

## Appendix A: Complete File Structure

```
/Users/brandonarmstrong/Documents/Github/RadiantClaims/

docs/
├── RECA Claim Form.pdf
├── RECA Downwinder Claim Form.pdf
├── RECA Uranium Worker Claim Form.pdf
├── RECA Manhattan Project Waste Claim Form.pdf
└── DOCUMENTATION_RESOURCE_GUIDE_IMPLEMENTATION.md (this file)

prisma/
└── schema.prisma (updated with new models)

scripts/
└── seed-documentation-resources.ts (new)

src/
├── app/
│   ├── api/
│   │   ├── forms/
│   │   │   ├── route.ts (new)
│   │   │   ├── [formType]/route.ts (new)
│   │   │   └── download/[formType]/route.ts (new)
│   │   ├── resources/
│   │   │   └── route.ts (new)
│   │   ├── document-requirements/
│   │   │   └── route.ts (new)
│   │   └── medical-records/
│   │       └── route.ts (new)
│   ├── resources/
│   │   ├── forms/
│   │   │   ├── page.tsx (new)
│   │   │   └── wizard/page.tsx (new - Phase 3)
│   │   ├── documents/
│   │   │   └── page.tsx (new)
│   │   └── letters/
│   │       └── page.tsx (new - Phase 3)
│   ├── portal/
│   │   └── documents/
│   │       └── page.tsx (new)
│   ├── attorney/
│   │   └── claimants/[id]/
│   │       └── documents/page.tsx (new - Phase 3)
│   └── intake/
│       ├── page.tsx (updated)
│       ├── step2/page.tsx (updated)
│       ├── documents-preview/page.tsx (new)
│       └── upload/page.tsx (updated)
└── components/
    └── resource/
        ├── ResourceCard.tsx (new)
        ├── DocumentChecklist.tsx (new)
        └── ProcessingTimeIndicator.tsx (new - Phase 3)
```

---

## Appendix B: Reference Links

**Official Sources:**
- DOJ RECA Website: https://www.justice.gov/civil/reca
- Electronic Filing Portal: https://www.justice.gov/civil/reca (forthcoming)
- RECA Statute: 42 U.S.C. § 2210 note, Pub. L. 119-21

**Internal Documentation:**
- Original Resource List: `/Legacy Yield/01_Strategy/Context & Research/RECA Documentation Resources.md`
- Forms Directory: `/docs/`

**Technical References:**
- Prisma Documentation: https://www.prisma.io/docs
- Next.js App Router: https://nextjs.org/docs/app
- PDF Handling: https://github.com/Hopding/pdf-lib

---

## Appendix C: Sample Seed Data Snippet

```typescript
// Example: Salt Lake County Clerk
{
  state: 'UT',
  county: 'Salt Lake',
  resourceType: 'COUNTY_CLERK',
  name: 'Salt Lake County Clerk',
  address: '2001 S State St',
  city: 'Salt Lake City',
  stateCode: 'UT',
  zipCode: '84190',
  phone: '(385) 468-7370',
  website: 'slco.org/clerk',
  documentTypesProvided: [
    'MARRIAGE_CERTIFICATE',
    'VOTER_REGISTRATION',
    'BUSINESS_LICENSE'
  ],
  certificationAvailable: true,
  processingTimeDays: 7,
  notes: 'Walk-in service available. Certified copies $10 each.'
}

// Example: Document Requirement
{
  claimType: 'DOWNWINDER',
  relationshipToClaimant: 'CHILD',
  documentType: 'SIBLING_BIRTH_CERTIFICATES',
  displayName: 'Birth Certificates for All Siblings',
  description: 'Birth certificates for all living siblings to verify family relationship',
  requiresCertification: true,
  acceptsDigital: true,
  isRequired: true,
  priority: 'HIGH',
  resourceTypes: ['VITAL_RECORDS'],
  formSection: 'Part 6',
  multipleRequired: true,
  notes: 'IMPORTANT: All siblings must be documented. This is required even for siblings who will not be filing claims. The $100,000 award is divided equally among all eligible children.'
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-27
**Status:** Ready for Implementation
**Next Steps:** Begin Phase 1 - Core Infrastructure

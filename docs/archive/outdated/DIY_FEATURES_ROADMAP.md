# DIY Document Preparation - Premium Features Roadmap

## Vision
Make the DIY path so valuable that users feel they're getting a professional-grade service at a fraction of the cost of hiring a lawyer, while still not practicing law.

---

## 🎯 Core Value Proposition

**DIY Path ($149.99 setup + $24.99/month):**
- AI-powered document review and completeness checking
- RECA-specialized AI assistant (scoped to RECA rules only)
- Document-to-application alignment verification
- Automated form validation and error detection
- Step-by-step guided workflow
- PDF generation with pre-filled forms
- Payout Pulse timeline tracking

**Legal Path ($0 upfront):**
- Full legal representation by Heritage Law
- Attorney reviews and files on your behalf
- Legal advice and strategy
- Court representation if needed
- Heritage Law pays us $1,000 referral fee

---

## 🚀 Feature Tier 1: Document Intelligence (MVP)

### 1.1 Document Upload & OCR
```typescript
// Features:
- Automatic text extraction from uploaded PDFs/images
- Smart document categorization (birth cert, medical records, etc.)
- Duplicate detection
- File size optimization
```

**Implementation:**
- Use existing `UploadedFile` model with OCR fields
- Integrate with Tesseract.js or cloud OCR (AWS Textract/Google Vision)
- Store extracted text in `ocrText` field
- Use AI to categorize into `FileCategory` enum

### 1.2 Document-to-Application Alignment Check
```typescript
// AI Analysis:
✅ Verify uploaded birth certificate matches Part 3 (claimant info)
✅ Cross-reference medical records with Part 11 (disease info)
✅ Check exposure dates on documents match Part 6 (exposure period)
✅ Validate beneficiary names match supporting forms
❌ Flag mismatches: "Birth certificate shows 'Robert' but form says 'Bob'"
```

**Implementation:**
```typescript
// New model: DocumentValidation
model DocumentValidation {
  id                String           @id @default(cuid())
  uploadedFileId    String
  uploadedFile      UploadedFile     @relation(...)
  intakeSessionId   String
  intakeSession     IntakeSession    @relation(...)

  // Validation Results
  validationType    ValidationType   // ALIGNMENT, COMPLETENESS, REQUIREMENT
  status            ValidationStatus // PASSED, FAILED, WARNING, PENDING
  fieldName         String?          // "part_3.firstName"
  expectedValue     String?          // "Robert Smith"
  actualValue       String?          // "Bob Smith"

  // AI Analysis
  aiConfidence      Float?           // 0-1 confidence score
  aiSuggestion      String?          @db.Text
  userResolved      Boolean          @default(false)
  resolutionNotes   String?          @db.Text

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

enum ValidationType {
  ALIGNMENT      // Document data matches form data
  COMPLETENESS   // All required fields filled
  REQUIREMENT    // Required document uploaded
  FORMAT         // Document is legible/valid format
  CONSISTENCY    // Data consistent across documents
}

enum ValidationStatus {
  PASSED
  FAILED
  WARNING
  PENDING
  USER_OVERRIDDEN
}
```

**User Experience:**
1. User uploads birth certificate
2. AI extracts: "Full Name: Robert James Smith, DOB: 03/15/1952"
3. Compares to Part 3 form data: "Bob Smith, 03/15/1952"
4. Shows warning: ⚠️ "Name mismatch detected. Birth certificate shows 'Robert James Smith' but you entered 'Bob Smith'. Legal documents should use your full legal name."
5. User clicks "Update Form to Match Document" → auto-fills "Robert James Smith"

### 1.3 Application Completeness Assessment
```typescript
// Real-time completeness scoring
interface CompletenessReport {
  overallScore: number;          // 0-100%
  requiredFieldsComplete: number; // 45/50
  requiredDocumentsUploaded: number; // 8/12

  missingFields: Array<{
    section: string;             // "Part 6"
    field: string;               // "exposureStartDate"
    label: string;               // "Date exposure began"
    priority: "HIGH" | "MEDIUM" | "LOW";
    helpText: string;            // "Provide the approximate date..."
  }>;

  missingDocuments: Array<{
    documentType: string;        // "PROOF_OF_RESIDENCE"
    displayName: string;         // "Proof of Residence (1951-1965)"
    required: boolean;
    whereToGet: DocumentResource[];
    exampleDocs: string[];       // ["Utility bill", "Tax return"]
  }>;

  validationIssues: Array<{
    severity: "ERROR" | "WARNING" | "INFO";
    message: string;
    section: string;
    quickFix?: {
      label: string;
      action: string;
    };
  }>;
}
```

**UI Component:**
```tsx
// Completeness Dashboard
<Card>
  <h3>Application Completeness</h3>
  <Progress value={85} />
  <p>85% Complete - 3 items remaining</p>

  <div className="missing-items">
    <h4>Missing Documents (2)</h4>
    <ul>
      <li>
        📄 Proof of Residence (1951-1965)
        <Button>Find Resources</Button>
      </li>
      <li>
        🏥 Medical Records - Pathology Report
        <Button>Upload Document</Button>
      </li>
    </ul>

    <h4>Missing Form Fields (1)</h4>
    <ul>
      <li>
        Part 6: Exact exposure location address
        <Button>Complete Now</Button>
      </li>
    </ul>
  </div>
</Card>
```

---

## 🤖 Feature Tier 2: RECA AI Assistant

### 2.1 Scoped AI Assistant
**Key Principle:** AI can provide information about RECA rules but CANNOT give legal advice.

**Allowed Topics:**
✅ RECA eligibility requirements (public information)
✅ Document requirements (from official DOJ guidance)
✅ Form instructions (from official RECA forms)
✅ Where to obtain documents (public records)
✅ Timeline expectations (based on historical data)
✅ Process explanation (DOJ workflow)

**Prohibited Topics:**
❌ Legal advice ("Should I file this claim?")
❌ Case strategy ("How can I increase my chances?")
❌ Document interpretation ("Does this prove my case?")
❌ Eligibility determination ("Are you eligible?")
❌ Any topic that constitutes practicing law

**Implementation - System Prompt:**
```typescript
const RECA_AI_SYSTEM_PROMPT = `You are the RadiantClaims RECA Information Assistant. Your role is to help users understand the RECA program and complete their claim forms.

IMPORTANT LIMITATIONS:
- You are NOT a lawyer and cannot provide legal advice
- You can only provide factual information from official RECA sources
- You cannot determine eligibility - only explain eligibility criteria
- You cannot interpret documents or evidence
- If asked for legal advice, direct users to the Legal Representation path

KNOWLEDGE BASE:
- RECA statute and regulations (42 U.S.C. § 2210)
- Official RECA claim forms and instructions
- DOJ RECA program guidance
- Document requirements by claim type
- Historical processing timelines
- Public records resources

RESPONSE STYLE:
- Clear, empathetic, and informative
- Always cite official sources when possible
- Use disclaimers when appropriate
- Suggest legal representation for complex situations

When unsure, say: "I can't provide legal advice on that. For a detailed review of your specific situation, I recommend upgrading to our Legal Representation path where Heritage Law Offices can provide professional legal guidance."
`;
```

### 2.2 Context-Aware AI Features

**Feature: Form Field Helper**
```typescript
// User clicks on a confusing form field
User: "What does 'continuous physical presence' mean?"

AI: "According to RECA regulations (42 U.S.C. § 2210), 'continuous physical presence' means you lived in the affected area during the entire exposure period without extended absences.

Specifically:
- You resided in the area for at least 2 consecutive years
- Brief trips away (vacations, work travel) don't break continuity
- Moving away for more than 6 months may break continuous presence

📚 Source: RECA Claim Form Instructions, Page 3

Need help determining if your situation qualifies? Consider upgrading to Legal Representation for a professional review."
```

**Feature: Document Guidance**
```typescript
// User asks about documents
User: "I can't find my birth certificate from 1952. What can I do?"

AI: "For birth certificates from 1952, you have several options:

1. **Utah Vital Records** (if born in Utah)
   - Office of Vital Records & Statistics
   - Phone: (801) 538-6105
   - Cost: $20 per certified copy
   - Processing: 4-6 weeks

2. **Delayed Birth Certificate**
   - If no record exists, you can apply for a delayed certificate
   - Requires: Affidavits, school records, baptismal records

3. **Alternative Documents** (if birth certificate unavailable)
   - Baptismal certificate
   - Hospital birth record
   - Early school records with DOB

Would you like me to show you the contact information for your state's vital records office? (I see you're in [STATE] based on your profile)"
```

**Feature: Eligibility Explainer** (NOT determination)
```typescript
User: "Am I eligible for RECA?"

AI: "I can't determine your eligibility, but I can explain the requirements:

For RECA Downwinder claims, you must meet ALL of these criteria:
1. ✅ **Disease Requirement**: Diagnosed with 1 of 27 compensable cancers
2. ✅ **Exposure Requirement**: Lived in affected areas during atmospheric testing (1951-1962 or 1963-1965)
3. ✅ **Physical Presence**: Resided there for at least 2 years
4. ✅ **Relationship** (if filing for deceased): Be an eligible survivor

Based on what you've entered:
- ✅ You indicated lung cancer diagnosis (compensable)
- ✅ You lived in St. George, UT (affected area)
- ⚠️  Exposure period: 1960-1963 (please verify exact dates)
- ✅ Physical presence: 5 years (meets 2-year requirement)

NOTE: This is informational only. Final eligibility is determined by the DOJ.

For a professional legal review of your specific situation, consider our Legal Representation path ($0 upfront, attorney reviews your case)."
```

### 2.3 Proactive AI Suggestions

**Feature: Smart Recommendations**
```typescript
// AI monitors form completion and proactively suggests next steps
interface AIRecommendation {
  id: string;
  type: "DOCUMENT" | "FORM_FIELD" | "VERIFICATION" | "RESOURCE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  actionButton: {
    label: string;
    href: string;
  };
  dismissible: boolean;
  createdAt: Date;
}

// Example recommendations:
[
  {
    type: "DOCUMENT",
    priority: "HIGH",
    title: "Medical Records Needed",
    description: "Based on your lung cancer diagnosis, DOJ requires pathology reports or autopsy records. I found 3 hospitals in St. George, UT where you can request records.",
    actionButton: {
      label: "View Hospital Contacts",
      href: "/resources/medical-records?state=UT&city=St.+George"
    }
  },
  {
    type: "VERIFICATION",
    priority: "MEDIUM",
    title: "Verify Exposure Dates",
    description: "Your exposure period (1960-1963) spans both testing periods. Atmospheric testing ended in 1962, so dates after 1962 may affect your claim. Want to review?",
    actionButton: {
      label: "Review Part 6",
      href: "/reca/form/[sessionId]?section=part_6"
    }
  },
  {
    type: "RESOURCE",
    priority: "LOW",
    title: "Proof of Residence Available",
    description: "Washington County has property tax records from 1960-1963 that can serve as proof of residence. These are often easier to obtain than utility bills from 60+ years ago.",
    actionButton: {
      label: "Get Contact Info",
      href: "/resources/vital-records?state=UT&county=Washington"
    }
  }
]
```

---

## 📊 Feature Tier 3: Advanced Validation & Quality Control

### 3.1 Multi-Document Cross-Reference
```typescript
// Check consistency across multiple documents
interface CrossReferenceCheck {
  checkType: "NAME_CONSISTENCY" | "DATE_CONSISTENCY" | "ADDRESS_CONSISTENCY";
  documents: string[];      // Document IDs being compared
  status: "PASS" | "FAIL" | "WARNING";
  findings: Array<{
    field: string;
    values: Record<string, string>;  // documentId -> value
    recommendation: string;
  }>;
}

// Example:
{
  checkType: "NAME_CONSISTENCY",
  documents: ["birth_cert_001", "marriage_cert_002", "form_part_3"],
  status: "WARNING",
  findings: [
    {
      field: "Legal Name",
      values: {
        "birth_cert_001": "Mary Elizabeth Johnson",
        "marriage_cert_002": "Mary E. Smith",
        "form_part_3": "Mary Smith"
      },
      recommendation: "Consider using your full legal name 'Mary Elizabeth Johnson' throughout the application to match official documents. Marriage certificate shows name change to 'Smith'."
    }
  ]
}
```

### 3.2 Automated Error Detection
```typescript
// Common errors that cause DOJ rejections
const ERROR_PATTERNS = [
  {
    pattern: "MISSING_SIGNATURE",
    check: (formData) => !formData.part_16?.signature,
    message: "⛔ Critical: Part 16 signature is required. The DOJ will reject unsigned applications.",
    severity: "ERROR"
  },
  {
    pattern: "INCOMPLETE_DATES",
    check: (formData) => {
      const dates = formData.part_6?.exposureDates;
      return !dates?.startMonth || !dates?.startYear || !dates?.endMonth || !dates?.endYear;
    },
    message: "⚠️ Exposure dates are incomplete. DOJ requires both start and end dates (month and year).",
    severity: "ERROR"
  },
  {
    pattern: "INCONSISTENT_DATES",
    check: (formData) => {
      const exposureEnd = new Date(formData.part_6?.exposureDates?.endYear, formData.part_6?.exposureDates?.endMonth);
      const diagnosisDate = new Date(formData.part_11?.diagnosisYear, formData.part_11?.diagnosisMonth);
      return exposureEnd > diagnosisDate;
    },
    message: "⚠️ Warning: Exposure ended after cancer diagnosis. This is unusual - please verify dates are correct.",
    severity: "WARNING"
  },
  {
    pattern: "MISSING_BENEFICIARY_SSN",
    check: (formData) => {
      const isDeceased = formData.part_1?.claimantDeceased === true;
      const beneficiaries = formData.part_14?.beneficiaries || [];
      return isDeceased && beneficiaries.some(b => !b.ssn);
    },
    message: "ℹ️ Beneficiary SSN missing. While not always required, providing SSNs speeds up payment processing.",
    severity: "INFO"
  }
];
```

### 3.3 Pre-Submission Checklist
```typescript
// Before allowing PDF download, run comprehensive check
interface PreSubmissionReport {
  readyToSubmit: boolean;
  overallScore: number;

  checks: Array<{
    category: string;
    passed: boolean;
    items: Array<{
      description: string;
      status: "PASS" | "FAIL" | "WARNING";
      required: boolean;
    }>;
  }>;

  estimatedApprovalProbability?: number; // Based on historical data
  estimatedProcessingTime?: {
    min: number;  // days
    max: number;
    median: number;
  };
}

// Example report:
{
  readyToSubmit: false,
  overallScore: 78,
  checks: [
    {
      category: "Required Documents",
      passed: false,
      items: [
        { description: "Birth certificate", status: "PASS", required: true },
        { description: "Death certificate (for deceased claimant)", status: "PASS", required: true },
        { description: "Medical records (pathology report)", status: "FAIL", required: true },
        { description: "Proof of residence (2+ documents)", status: "WARNING", required: true }
      ]
    },
    {
      category: "Form Completeness",
      passed: true,
      items: [
        { description: "All required fields filled", status: "PASS", required: true },
        { description: "Signatures present", status: "PASS", required: true },
        { description: "Dates validated", status: "PASS", required: true }
      ]
    },
    {
      category: "Document Quality",
      passed: true,
      items: [
        { description: "All documents legible", status: "PASS", required: false },
        { description: "Documents are certified copies", status: "WARNING", required: false }
      ]
    }
  ],
  estimatedApprovalProbability: 0.82,  // 82% based on similar claims
  estimatedProcessingTime: {
    min: 120,
    median: 180,
    max: 365
  }
}
```

---

## 🎨 Feature Tier 4: User Experience Enhancements

### 4.1 Smart Form Auto-Fill
```typescript
// Auto-populate related fields based on uploaded documents
- Upload birth certificate → Auto-fill Part 3 (name, DOB, birthplace)
- Upload marriage certificate → Auto-fill Part 2 (spouse info)
- Upload death certificate → Auto-fill Part 2 (death date, cause)
- Upload medical records → Suggest cancer type for Part 11
```

### 4.2 Progress Tracking & Milestones
```typescript
interface UserMilestone {
  milestone: string;
  completed: boolean;
  completedAt?: Date;
  estimatedTimeToComplete?: number; // hours

  steps: Array<{
    description: string;
    completed: boolean;
  }>;
}

const MILESTONES = [
  {
    milestone: "Account Setup",
    steps: [
      "Create account",
      "Select DIY path",
      "Complete payment"
    ]
  },
  {
    milestone: "Eligibility Confirmed",
    steps: [
      "Verify compensable disease",
      "Confirm exposure location",
      "Validate exposure dates"
    ]
  },
  {
    milestone: "Form Completed",
    steps: [
      "Parts 1-16 filled out",
      "All signatures collected",
      "Form validation passed"
    ]
  },
  {
    milestone: "Documents Gathered",
    steps: [
      "Birth/death certificates uploaded",
      "Medical records obtained",
      "Proof of residence collected",
      "All documents verified"
    ]
  },
  {
    milestone: "Quality Check Passed",
    steps: [
      "Document alignment verified",
      "Cross-reference check passed",
      "Completeness score >95%",
      "No critical errors"
    ]
  },
  {
    milestone: "Ready to Submit",
    steps: [
      "PDF downloaded",
      "Mailing instructions reviewed",
      "Supporting documents organized"
    ]
  }
];
```

### 4.3 Document Request Wizard
```typescript
// Help users obtain hard-to-find documents
interface DocumentRequestWizard {
  documentType: string;
  userState: string;
  userCounty: string;

  steps: Array<{
    stepNumber: number;
    instruction: string;
    templateLetter?: string;  // Pre-filled request letter
    estimatedCost?: number;
    estimatedTime?: string;
    tips?: string[];
  }>;
}

// Example: Requesting 1960s school records
{
  documentType: "SCHOOL_RECORDS",
  userState: "UT",
  userCounty: "Washington",
  steps: [
    {
      stepNumber: 1,
      instruction: "Identify which school you attended in 1960-1963",
      tips: [
        "If the school closed, records may be at the district office",
        "Utah State Archives also maintains old school records"
      ]
    },
    {
      stepNumber: 2,
      instruction: "Contact the school district office",
      templateLetter: `[Your Name]
[Your Address]
[Date]

Washington County School District
Records Department
121 W Tabernacle St
St. George, UT 84770

Re: Request for School Records (1960-1963)

Dear Records Department,

I am requesting copies of my school records from [School Name] for the years 1960-1963 in support of a Radiation Exposure Compensation Act (RECA) claim.

Student Information:
- Name: [Your Full Name]
- Date of Birth: [Your DOB]
- Years Attended: 1960-1963
- School: [School Name]

I understand there may be fees associated with this request. Please let me know the cost and payment method.

Thank you for your assistance.

Sincerely,
[Your Name]`,
      estimatedCost: 25,
      estimatedTime: "2-4 weeks"
    },
    {
      stepNumber: 3,
      instruction: "Upload the records when received",
      tips: [
        "Make sure records show your name and dates attended",
        "School address on records helps prove residence"
      ]
    }
  ]
}
```

---

## 💰 Feature Tier 5: Premium Add-Ons (Future Revenue)

### 5.1 Expedited Service ($99 one-time)
- Priority AI review (within 24 hours)
- Video call with RECA specialist (not legal advice)
- Expedited document resource lookup

### 5.2 Document Concierge ($199 one-time)
- We request documents on your behalf
- Track document requests
- Follow up with agencies
- Organize and digitize received documents

### 5.3 Family Plan ($349 setup + $49.99/month)
- Multiple claims under one account
- Shared document library
- Bulk document requests
- Priority support

---

## 🏗️ Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create `DocumentValidation` model
- [ ] Build document upload with OCR
- [ ] Implement basic completeness scoring
- [ ] Add validation error detection

### Phase 2: AI Assistant (Weeks 3-4)
- [ ] Design AI system prompt with RECA scope
- [ ] Build chat interface
- [ ] Implement context awareness (form section, user progress)
- [ ] Add disclaimer system (not legal advice)
- [ ] Test AI responses for UPL compliance

### Phase 3: Document Intelligence (Weeks 5-6)
- [ ] Build document-to-form alignment checker
- [ ] Implement cross-reference validation
- [ ] Create pre-submission report
- [ ] Add automated error patterns

### Phase 4: UX Polish (Weeks 7-8)
- [ ] Build completeness dashboard
- [ ] Add smart recommendations panel
- [ ] Create document request wizard
- [ ] Implement progress tracking

### Phase 5: Premium Features (Future)
- [ ] Build expedited review system
- [ ] Create document concierge service
- [ ] Implement family plan billing

---

## 📈 Success Metrics

**User Satisfaction:**
- DIY users complete applications 2x faster than manual
- Completeness score >95% before submission
- Document alignment issues caught before submission
- <5% of DIY applications returned as incomplete by DOJ

**Business Metrics:**
- DIY path conversion rate >30%
- Monthly recurring revenue from subscriptions
- <10% churn rate
- Upsell rate to premium features >15%

**AI Performance:**
- AI responses marked as "helpful" >80% of the time
- AI stays within RECA scope 100% (no UPL violations)
- Average response time <2 seconds
- Context-relevant suggestions >90% accuracy

---

## 🛡️ Legal Compliance

**Unauthorized Practice of Law (UPL) Safeguards:**

1. **AI Disclaimers:**
   ```
   "This information is educational only and not legal advice.
   For legal guidance, upgrade to our Legal Representation path."
   ```

2. **No Eligibility Determinations:**
   - AI explains criteria but never says "You are eligible"
   - Always: "Final eligibility is determined by the DOJ"

3. **Document Review Limitation:**
   - AI checks for completeness and alignment
   - AI does NOT interpret whether documents "prove" the case
   - No substantive legal analysis

4. **Prominent Legal Path Promotion:**
   - For complex situations, always suggest legal representation
   - Make it easy to upgrade from DIY → Legal

5. **Terms of Service:**
   - Clear language: "DIY path is document preparation only"
   - "RadiantClaims does not provide legal advice"
   - User acknowledges they're proceeding without legal counsel

---

## 🎯 Competitive Differentiation

**vs. Doing It Manually (Free):**
- ✅ AI catches errors that lead to DOJ rejection
- ✅ Saves 20+ hours of research and document gathering
- ✅ Automated validation catches mistakes
- ✅ Higher approval probability

**vs. Hiring an Attorney ($5,000+):**
- ✅ 97% cheaper ($149.99 vs $5,000)
- ✅ Faster (no waiting for attorney availability)
- ✅ User maintains control
- ❌ No legal advice or representation

**vs. Other Document Prep Services:**
- ✅ RECA-specialized (not generic form filler)
- ✅ AI assistant trained on RECA rules
- ✅ Document intelligence and validation
- ✅ Integrated with Payout Pulse tracking

Would you like me to start implementing any of these features? I recommend starting with:
1. **Phase 1** (Foundation) - Get the basic validation working
2. **Phase 2** (AI Assistant) - This will be the biggest differentiator
3. Then move to document intelligence

What do you think?

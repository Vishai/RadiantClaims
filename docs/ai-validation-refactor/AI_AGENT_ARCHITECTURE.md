# AI Agent Architecture Specification

## Overview

The document validation system uses a team of 7 specialized AI agents, each responsible for validating one specific aspect of RECA claim documents. Agents operate independently and in parallel, storing detailed results for staff review.

## Agent Design Principles

1. **Single Responsibility** - Each agent validates one thing only
2. **Evidence-Based** - All decisions must cite specific evidence from document
3. **Confidence Scoring** - All outputs include confidence levels
4. **Fail Gracefully** - Return partial results rather than crashing
5. **Auditable** - Store complete reasoning chain for review

## Base Agent Interface

All agents implement this common interface:

```typescript
interface BaseAgent<TInput, TOutput> {
  // Agent metadata
  name: string;
  version: string;
  description: string;

  // Main validation method
  validate(input: TInput): Promise<AgentResult<TOutput>>;

  // Health check
  isHealthy(): Promise<boolean>;
}

interface AgentResult<T> {
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'ERROR';
  confidence: number; // 0-1
  data: T;
  evidence: Evidence[];
  reasoning: string;
  issues: Issue[];
  processingTimeMs: number;
  timestamp: Date;
}

interface Evidence {
  type: 'TEXT_EXTRACTED' | 'IMAGE_REGION' | 'METADATA' | 'AI_INFERENCE';
  source: string; // e.g., "page 1, line 15-18"
  content: string;
  confidence: number;
}

interface Issue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string; // e.g., "MISSING_SIGNATURE"
  message: string;
  suggestion: string;
  affectsApproval: boolean;
}
```

## Agent Specifications

---

## Agent 1: Document Classifier Agent

### Purpose
Determine the document type with high confidence.

### Input
```typescript
interface ClassifierInput {
  fileId: string;
  fileUrl: string;
  mimeType: string;
  ocrText?: string; // Optional, will run OCR if not provided
  fileName?: string; // Hint from user
}
```

### Output
```typescript
interface ClassifierOutput {
  category: DocumentCategory;
  confidence: number;
  alternativeCategories: Array<{
    category: DocumentCategory;
    confidence: number;
  }>;
  reasoning: string;
  keyIndicators: string[]; // What made us choose this category
}

type DocumentCategory =
  | 'IDENTITY'
  | 'MEDICAL_RECORDS'
  | 'PATHOLOGY_REPORT'
  | 'PROOF_OF_RESIDENCE'
  | 'UTILITY_BILL'
  | 'MORTGAGE_STATEMENT'
  | 'TAX_RETURN'
  | 'SCHOOL_RECORDS'
  | 'EMPLOYMENT_RECORDS'
  | 'DISCHARGE_SUMMARY'
  | 'TUMOR_REGISTRY'
  | 'TREATMENT_RECORDS'
  | 'OTHER';
```

### Validation Logic
1. Extract text from document (OCR if needed)
2. Use GPT-4o Vision + text analysis to classify
3. Look for key patterns:
   - Header text ("Birth Certificate", "Pathology Report")
   - Form numbers (SSA forms, state forms)
   - Official seals/stamps
   - Layout patterns (medical letterhead, government forms)
4. Return top 3 most likely categories with confidence scores

### Success Criteria
- **PASS**: Confidence ≥ 0.85 for single category
- **NEEDS_REVIEW**: Confidence 0.60-0.84, or multiple categories close
- **FAIL**: No category matches with confidence > 0.60

### Implementation Notes
- Use GPT-4o with vision capability for image-based documents
- Maintain keyword dictionary for each category
- Learn from staff corrections (future: fine-tuning)

---

## Agent 2: Identity Verification Agent

### Purpose
Validate identity documents meet DOJ requirements for RECA claims.

### Input
```typescript
interface IdentityVerificationInput {
  fileId: string;
  ocrText: string;
  documentType: 'BIRTH_CERT' | 'DEATH_CERT' | 'MARRIAGE_CERT' | 'NAME_CHANGE';
  claimantName?: string; // For cross-validation
  expectedDOB?: string; // For cross-validation
}
```

### Output
```typescript
interface IdentityVerificationOutput {
  isValid: boolean;
  fullName: string | null;
  dateOfBirth: string | null;
  placeOfBirth: {
    city?: string;
    county?: string;
    state?: string;
  } | null;
  issuingAuthority: string | null;
  hasOfficialSeal: boolean;
  documentDate: string | null;
  requiredElements: {
    name: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    dob: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    placeOfBirth: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    officialSeal: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    issuingAuthority: 'PRESENT' | 'MISSING' | 'UNCLEAR';
  };
}
```

### Validation Logic

**For Birth Certificates:**
1. Extract full legal name (first, middle, last)
2. Extract date of birth (validate format)
3. Extract place of birth (city, county, state)
4. Verify issuing authority is present (e.g., "State of Nevada")
5. Check for official seal/stamp (image analysis)
6. Verify document is government-issued (not hospital certificate)

**For Death Certificates:**
1. Extract deceased person's name
2. Extract date of death
3. Extract date of birth (for verification)
4. Verify issuing authority
5. Check for official seal

**For Marriage Certificates / Name Change:**
1. Extract both names (previous and new)
2. Extract date of event
3. Verify issuing authority
4. Check for official seal

### Success Criteria
- **PASS**: All required elements present and legible, official seal detected
- **NEEDS_REVIEW**: 1-2 required elements unclear or missing seal
- **FAIL**: Missing 3+ required elements or clearly not government-issued

### DOJ Requirements Reference
- Must be certified copy (indicated by seal/stamp)
- Must show full legal name
- Must show date and place of birth/death
- Must be from vital records office or equivalent

---

## Agent 3: Medical Records Compliance Agent

### Purpose
Verify medical documentation proves a RECA-covered disease.

### Input
```typescript
interface MedicalComplianceInput {
  fileId: string;
  ocrText: string;
  documentType: 'MEDICAL_RECORDS' | 'PATHOLOGY_REPORT' | 'DISCHARGE_SUMMARY' | 'TUMOR_REGISTRY' | 'TREATMENT_RECORDS';
  claimType: 'downwinder' | 'onsite' | 'uranium';
}
```

### Output
```typescript
interface MedicalComplianceOutput {
  diagnosisFound: boolean;
  diagnosis: string | null;
  isCoveredDisease: boolean;
  coveredDiseaseCategory: string | null; // e.g., "Leukemia", "Lung Cancer"
  diagnosisDate: string | null;
  treatingPhysician: string | null;
  medicalFacility: string | null;
  icdCodes: string[];
  requiredElements: {
    diagnosis: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    diagnosisDate: 'PRESENT' | 'MISSING' | 'UNCLEAR';
    treatingProvider: 'PRESENT' | 'MISSING' | 'UNCLEAR';
  };
  acceptableDocumentTypes: string[]; // Per RECA pages 18-24
}
```

### Validation Logic

1. **Extract Diagnosis**
   - Look for explicit diagnosis statements
   - Check ICD-10 codes if present
   - Identify cancer type, stage if applicable

2. **Validate Against RECA Covered Diseases**
   - Cross-reference with official RECA disease list:
     - Leukemia (except CLL)
     - Multiple myeloma
     - Lymphomas (Hodgkin and non-Hodgkin)
     - Primary cancer of thyroid, breast, esophagus, stomach, pharynx, small intestine, pancreas, bile ducts, gall bladder, salivary gland, urinary bladder, brain, colon, ovary, liver, lung
     - And others per RECA statute

3. **Check Document Type Acceptability**
   - Per RECA pages 18-24, different diseases require specific documentation:
     - Leukemia: pathology/biopsy report OR death certificate with disease listed
     - Solid cancers: pathology report showing malignancy
     - Multiple myeloma: specific lab tests (serum electrophoresis, bone marrow biopsy)

4. **Extract Supporting Information**
   - Date of diagnosis (must be after exposure period)
   - Treating physician name
   - Medical facility name
   - Treatment dates

### Success Criteria
- **PASS**: Diagnosis clearly stated, matches RECA covered diseases, document type acceptable for that disease
- **NEEDS_REVIEW**: Diagnosis present but unclear if covered, or document type may not be sufficient
- **FAIL**: No diagnosis found, or diagnosis is clearly not covered, or wrong document type

### RECA Covered Diseases Reference
See RECA statute Section 4(a)(2) and DOJ guidance for complete list.

---

## Agent 4: Residence Proof Agent

### Purpose
Validate physical presence in covered area during exposure period (primarily for downwinder claims).

### Input
```typescript
interface ResidenceProofInput {
  fileId: string;
  ocrText: string;
  documentType: 'PROOF_OF_RESIDENCE' | 'UTILITY_BILL' | 'MORTGAGE_STATEMENT' | 'TAX_RETURN' | 'SCHOOL_RECORDS';
  claimType: 'downwinder' | 'onsite' | 'uranium';
  claimantName?: string;
  exposurePeriod?: {
    start: string;
    end: string;
  };
}
```

### Output
```typescript
interface ResidenceProofOutput {
  addressFound: boolean;
  address: {
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    fullAddress?: string;
  } | null;
  dateRange: {
    start?: string;
    end?: string;
  } | null;
  nameOnDocument: string | null;
  isInCoveredCounty: boolean;
  coveredCounties: string[]; // List of RECA-covered counties
  overlapsWith ExposurePeriod: boolean;
  exposurePeriodCheck: {
    documentDateInRange: boolean;
    exposurePeriod: string; // e.g., "1951-1958 or 1962 for Nevada downwinders"
  };
}
```

### Validation Logic

1. **Extract Address**
   - Full street address
   - City
   - **County** (CRITICAL - required for jurisdiction)
   - State
   - Zip code if available

2. **Extract Date Range**
   - For utility bills: service period dates
   - For tax returns: tax year
   - For school records: academic year/enrollment dates
   - For mortgage: loan date, payment period

3. **Validate County Jurisdiction**
   - Cross-reference against RECA-covered counties:
     - **Arizona**: Apache, Coconino, Gila, Navajo, Yavapai
     - **Nevada**: Clark, Eureka, Lander, Lincoln, Nye, White Pine, Esmeralda, Humboldt, Mineral, Pershing, Washoe, Carson City
     - **Utah**: Beaver, Garfield, Iron, Kane, Millard, Piute, San Juan, Sevier, Washington, Wayne

4. **Validate Exposure Period Overlap**
   - For downwinders: 1951-1958 or 1962
   - Document date must fall within or show residence during this period

5. **Validate Name Match**
   - Name on document should match claimant (or spouse/parent for family members)

### Success Criteria
- **PASS**: Address in covered county, dates overlap exposure period, name matches
- **NEEDS_REVIEW**: County unclear, dates partially overlap, or name slight mismatch (maiden name, etc.)
- **FAIL**: Address not in covered county, dates outside exposure period, or name doesn't match

### DOJ Requirements
- Downwinders need minimum 2 documents proving residence
- Documents must show continuous or repeated presence in covered area during exposure
- Acceptable documents per RECA: utility bills, mortgage statements, tax returns, school records, employment records, medical records with address

---

## Agent 5: Employment Verification Agent

### Purpose
Validate employment at nuclear facility (for onsite participant and uranium worker claims).

### Input
```typescript
interface EmploymentVerificationInput {
  fileId: string;
  ocrText: string;
  claimType: 'onsite' | 'uranium';
  claimantName?: string;
  documentType: 'EMPLOYMENT_RECORDS' | 'PAY_STUB' | 'W2' | 'DOE_BADGE' | 'OTHER';
}
```

### Output
```typescript
interface EmploymentVerificationOutput {
  employerFound: boolean;
  employer: string | null;
  isQualifyingFacility: boolean;
  facilityType: 'NEVADA_TEST_SITE' | 'PACIFIC_PROVING_GROUNDS' | 'URANIUM_MINE' | 'URANIUM_MILL' | 'ORE_TRANSPORT' | 'OTHER' | null;
  employmentDates: {
    start?: string;
    end?: string;
  } | null;
  employeeName: string | null;
  jobTitle: string | null;
  isInQualifyingPeriod: boolean;
  qualifyingPeriod: string; // e.g., "1951-1992 for uranium workers"
}
```

### Validation Logic

**For Onsite Participants:**
1. Extract employer name
2. Validate employer is Nevada Test Site or Pacific Proving Grounds (or contractor)
3. Extract employment dates
4. Verify dates are during atmospheric testing period (1951-1962)
5. Extract employee name and job title

**For Uranium Workers:**
1. Extract employer name
2. Validate employer is uranium mine, mill, or ore transport facility
3. Extract employment dates
4. Verify dates are during qualifying period (1942-1971 for miners/millers)
5. Check for specific uranium-related job duties

### Success Criteria
- **PASS**: Clearly shows employment at qualifying facility during qualifying period
- **NEEDS_REVIEW**: Employer name unclear or dates partially overlap
- **FAIL**: Not a qualifying facility or dates completely outside qualifying period

### Qualifying Facilities Reference
- **Onsite**: Nevada Test Site, Pacific Proving Grounds, any atmospheric test site
- **Uranium**: All uranium mines, mills, and ore transport facilities in designated states

---

## Agent 6: Completeness Orchestrator Agent

### Purpose
Evaluate overall claim completeness and readiness for DOJ submission.

### Input
```typescript
interface CompletenessInput {
  claimId: string;
  claimType: 'downwinder' | 'onsite' | 'uranium';
  documents: Array<{
    fileId: string;
    category: DocumentCategory;
    validationResults: Record<string, AgentResult<any>>;
  }>;
  intakeFormData?: any; // Data from intake wizard
}
```

### Output
```typescript
interface CompletenessOutput {
  isComplete: boolean;
  completenessScore: number; // 0-1
  readyForSubmission: boolean;
  missingRequired: Array<{
    category: DocumentCategory;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    dojRequirement: string; // Reference to specific RECA requirement
  }>;
  criticalBlockers: Issue[]; // Issues that prevent submission
  warnings: Issue[]; // Issues that should be reviewed
  crossDocumentValidation: {
    nameConsistent: boolean;
    datesConsistent: boolean;
    claimTypeConfidence: number;
  };
}
```

### Validation Logic

1. **Check Required Documents by Claim Type**

   **Downwinder:**
   - ✓ Identity document (birth/death certificate) [REQUIRED]
   - ✓ Proof of residence (minimum 2 documents) [REQUIRED]
   - ✓ Medical records proving covered disease [REQUIRED]

   **Onsite Participant:**
   - ✓ Identity document [REQUIRED]
   - ✓ Employment records at test site [REQUIRED]
   - ✓ Medical records proving covered disease [REQUIRED]

   **Uranium Worker:**
   - ✓ Identity document [REQUIRED]
   - ✓ Employment records at uranium facility [REQUIRED]
   - ✓ Medical records proving covered disease [REQUIRED]

2. **Cross-Document Validation**
   - Names consistent across documents (or name changes explained)
   - Dates logical (birth < exposure < diagnosis)
   - No contradictory information

3. **Calculate Readiness Score**
   ```typescript
   score = (
     required_docs_present * 0.6 +
     no_critical_issues * 0.3 +
     supporting_docs_quality * 0.1
   )
   ```

4. **Identify Blockers**
   - Missing critical documents
   - Document validation failures
   - Inconsistent information

### Success Criteria
- **READY**: All required documents present, all validations PASS
- **NEEDS_WORK**: Missing 1-2 required items or some NEEDS_REVIEW results
- **NOT_READY**: Missing 3+ required items or any FAIL results

---

## Agent 7: Data Extraction Agent

### Purpose
Extract structured data from validated documents for RECA form pre-fill.

### Input
```typescript
interface DataExtractionInput {
  documents: Array<{
    fileId: string;
    category: DocumentCategory;
    ocrText: string;
    validationResult: AgentResult<any>;
  }>;
}
```

### Output
```typescript
interface DataExtractionOutput {
  claimant: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    ssn: string | null; // If found, handle securely
  };
  diagnosis: {
    disease: string | null;
    diagnosisDate: string | null;
    treatingPhysician: string | null;
    medicalFacility: string | null;
  };
  residence: {
    addresses: Array<{
      street: string;
      city: string;
      county: string;
      state: string;
      startDate: string;
      endDate: string;
    }>;
  };
  employment: Array<{
    employer: string;
    jobTitle: string;
    location: string;
    startDate: string;
    endDate: string;
  }>;
  formMappings: Record<string, string>; // Maps to RECA form field IDs
}
```

### Validation Logic

1. **Consolidate Information** from all documents
2. **Resolve Conflicts** (e.g., name spelled differently across docs)
3. **Normalize Formats** (dates to ISO 8601, addresses to standard format)
4. **Map to RECA Form Fields** (specific to form structure)
5. **Flag Uncertainties** (fields where confidence < 0.9)

### Success Criteria
- All key fields populated with confidence ≥ 0.9
- Conflicts resolved or flagged for manual review
- Ready for form pre-fill

---

## Agent Orchestration

### Workflow

```
Document Upload
     ↓
1. Classifier Agent (required first)
     ↓
2-5. Specialized Agents (parallel, based on category)
     - Identity Agent (if IDENTITY)
     - Medical Agent (if MEDICAL_RECORDS, etc.)
     - Residence Agent (if PROOF_OF_RESIDENCE, etc.)
     - Employment Agent (if EMPLOYMENT_RECORDS)
     ↓
6. Completeness Agent (after all docs processed)
     ↓
7. Data Extraction Agent (when claim ready)
```

### Parallelization Strategy
- Agents 2-5 run in parallel (independent validation)
- Use job queue for async processing
- Provide real-time status updates to UI

### Error Handling
- If any agent fails, store error but continue other agents
- Retry failed agents up to 3 times
- Escalate to staff review if persistent failures

## Implementation Checklist

- [ ] Create base agent interface and abstract class
- [ ] Implement Agent 1: Classifier
- [ ] Implement Agent 2: Identity Verification
- [ ] Implement Agent 3: Medical Compliance
- [ ] Implement Agent 4: Residence Proof
- [ ] Implement Agent 5: Employment Verification
- [ ] Implement Agent 6: Completeness Orchestrator
- [ ] Implement Agent 7: Data Extraction
- [ ] Build orchestration system
- [ ] Add job queue for async processing
- [ ] Create agent result storage (database)
- [ ] Add monitoring and logging
- [ ] Build staff review interface for agent results
- [ ] Create agent testing framework
- [ ] Validate with real RECA documents

## Testing Strategy

For each agent:
1. **Unit Tests** - Test with known good/bad documents
2. **Integration Tests** - Test with other agents
3. **Accuracy Tests** - Validate against human review (target >95%)
4. **Edge Case Tests** - Test with unclear/damaged documents
5. **Performance Tests** - Ensure processing time < 30 seconds per document

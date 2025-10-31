# Phase 2: Enterprise Document Intelligence Implementation Plan

## Overview
Phase 2 adds advanced AI-powered document analysis specifically tailored for RECA claims processing. This transforms the basic OCR + categorization into a comprehensive intelligence system that actively guides users through the claims process.

---

## Current State (Phase 1 - COMPLETED ✅)

### What Works Now
1. **Automatic Processing**: Documents auto-process on upload
2. **Hybrid PDF Extraction**:
   - pdfjs-dist for digital PDFs (95% confidence)
   - Tesseract OCR fallback for scanned documents
3. **AI Categorization**: GPT-4o-mini categorizes into 12 document types
4. **Smart Tags**: 8 rule-based + AI tags (missing_last_name, needs_signature, etc.)
5. **Quality Metrics**: Resolution, blur, contrast analysis
6. **UI Display**:
   - Compact AI Intelligence panel in cards
   - Grid/List view toggle
   - Shows OCR confidence, tags, page count

### Current Data Schema
```typescript
interface AIIntelligence {
  ocrConfidence?: number;
  textLength?: number;
  aiCategory?: string;
  aiCategoryConfidence?: number;
  aiReasoning?: string;
  tags?: Array<{ tag: string; confidence: number }>;
  qualityScore?: number;
  recommendations?: string[];
  pageCount?: number;
}
```

### Current Files
- `src/lib/document-intelligence/ocr.ts` - OCR processing
- `src/lib/document-intelligence/ai-categorization.ts` - AI categorization & tags
- `src/app/api/documents/upload/route.ts` - Auto-processes on upload
- `src/app/api/documents/route.ts` - Returns AI intelligence with documents
- `src/components/documents/DocumentCard.tsx` - Shows AI panel
- `src/components/documents/DocumentListItem.tsx` - List view
- `src/components/documents/DocumentDashboard.tsx` - Grid/List toggle

---

## Phase 2 Goals

Transform basic intelligence into **actionable RECA-specific guidance**:

1. **Entity Extraction** - Extract structured data (names, dates, addresses, medical info)
2. **RECA Compliance Checks** - Validate claim completeness and eligibility
3. **Risk Analysis** - Flag issues that could cause claim denial
4. **Detailed Intelligence Modal** - 6-tab interface for deep analysis
5. **Actionable Recommendations** - Specific next steps for users

---

## Phase 2 Data Schema

### Extended Intelligence Schema
```json
{
  "doc_id": "uuid",

  // EXISTING (Phase 1) - Keep as-is
  "ocr": {
    "engine": "pdfjs-dist|tesseract",
    "text_length": 2795,
    "avg_confidence": 0.95,
    "page_confidences": [0.95, 0.93, 0.97, 0.94, 0.96]
  },
  "classification": {
    "doc_type": "OTHER",
    "confidence": 0.85,
    "rationale": "The document is a summary of data...",
    "alternatives": [
      {"category": "IDENTITY", "confidence": 0.5},
      {"category": "PROOF_OF_RESIDENCE", "confidence": 0.5}
    ]
  },
  "smart_tags": [
    {"tag": "excellent_quality", "confidence": 1.0},
    {"tag": "needs_signature", "confidence": 0.95},
    {"tag": "missing_last_name", "confidence": 0.9}
  ],

  // NEW (Phase 2) - Add these
  "entities": {
    "persons": [
      {
        "name": "John Doe",
        "role": "claimant|witness|doctor|employer",
        "confidence": 0.92,
        "mentions": [{"page": 1, "context": "Claimant: John Doe"}]
      }
    ],
    "dates": [
      {
        "label": "birth_date|exposure_start|exposure_end|diagnosis_date",
        "value": "1955-06-15",
        "confidence": 0.88,
        "page": 2
      }
    ],
    "addresses": [
      {
        "label": "residence|work|school",
        "full_address": "123 Main St, Las Vegas, NV 89101",
        "city": "Las Vegas",
        "county": "Clark",
        "state": "NV",
        "years": "1951-1958",
        "confidence": 0.85,
        "page": 3
      }
    ],
    "medical": [
      {
        "diagnosis": "Lung Cancer",
        "icd_code": "C34.90",
        "facility": "Desert Regional Medical Center",
        "doctor": "Dr. Sarah Smith",
        "diagnosis_date": "2020-03-15",
        "treatment_dates": ["2020-03-20", "2020-04-10"],
        "confidence": 0.90,
        "page": 4
      }
    ],
    "employment": [
      {
        "employer": "Nevada Test Site",
        "job_title": "Security Guard",
        "start_date": "1952-01-01",
        "end_date": "1958-12-31",
        "confidence": 0.87,
        "page": 5
      }
    ]
  },

  "signatures": {
    "present": false,
    "notary_present": false,
    "pages_requiring_signature": [5],
    "notary_required": true
  },

  "quality": {
    "overall_legibility": 0.85,
    "issues": [
      {
        "page": 3,
        "type": "low_contrast|blurry|skewed|faded",
        "severity": "low|medium|high",
        "description": "Page 3 has low contrast, may affect OCR accuracy"
      }
    ],
    "rescan_recommended_pages": [3]
  },

  "reca_checks": {
    "claim_type_suspected": "downwinder|onsite|uranium",
    "checklist_coverage": 0.65,  // 0-1 scale, how complete is the claim
    "missing_requirements": [
      {
        "item": "Birth Certificate",
        "category": "IDENTITY",
        "priority": "high|medium|low",
        "suggestion": "Upload a birth certificate or other proof of birth"
      },
      {
        "item": "Proof of Residence 1951-1958",
        "category": "PROOF_OF_RESIDENCE",
        "priority": "high",
        "suggestion": "Need utility bills, tax records, or school records showing residence in Clark County during exposure period"
      }
    ],
    "date_sanity": [
      {
        "issue": "Exposure dates before birth date",
        "severity": "high",
        "details": "Exposure period (1951-1958) includes time before claimant's birth (1955)"
      }
    ],
    "jurisdiction_match": {
      "county": "Clark County, NV",
      "in_covered_counties": true,
      "confidence": 0.92,
      "affected_counties": ["Clark", "Lincoln", "Nye"]
    },
    "name_consistency": [
      {
        "issue": "Name appears as 'John Doe' on page 1 but 'J. Doe' on page 3",
        "status": "needs_confirmation|ok",
        "severity": "low"
      }
    ],
    "eligibility_flags": [
      {
        "flag": "age_at_exposure",
        "status": "meets_requirement|does_not_meet|unclear",
        "details": "Claimant was 3 years old during exposure (meets downwinder requirement)"
      }
    ]
  },

  "risk_flags": [
    {
      "flag": "missing_notary_signature",
      "severity": "high",
      "category": "compliance",
      "message": "Affidavit requires notarization but no notary seal detected",
      "action_required": "Get document notarized before submission"
    },
    {
      "flag": "incomplete_exposure_period",
      "severity": "medium",
      "category": "eligibility",
      "message": "Exposure period partially documented. Only 4 of 7 years have proof of residence.",
      "action_required": "Provide additional residence proof for 1954-1957"
    }
  ],

  "ai_summary": "This is a RECA Downwinder Claim data summary for a claimant who resided in Clark County, NV during the atmospheric testing period. The claim is 65% complete. Missing: birth certificate, complete residence proof (4 of 7 years documented), notarized signature. Medical diagnosis of lung cancer is well-documented. Estimated 2-3 additional documents needed before submission.",

  "recommendations": [
    {
      "action": "request_document",
      "priority": "high",
      "item": "Birth Certificate",
      "category": "IDENTITY",
      "message": "Birth certificate is required to establish identity and age during exposure period.",
      "auto_categorize": true
    },
    {
      "action": "request_rescan",
      "priority": "medium",
      "pages": [3],
      "message": "Page 3 has low contrast. Re-scan at higher quality for better OCR accuracy.",
      "current_quality": 0.62
    },
    {
      "action": "escalate_review",
      "priority": "medium",
      "message": "Name inconsistency detected across documents. Manual review recommended.",
      "issue": "name_mismatch"
    },
    {
      "action": "get_notarized",
      "priority": "high",
      "pages": [5],
      "message": "Affidavit on page 5 requires notarization before claim submission."
    }
  ],

  "metrics": {
    "processing_ms": 12458,
    "model_versions": {
      "ocr": "tesseract-5.3|pdfjs-5.4",
      "classifier": "gpt-4o-mini-2024",
      "entity_extractor": "gpt-4o-2024",
      "reca_analyzer": "gpt-4o-2024"
    },
    "api_costs": {
      "ocr": 0.00,
      "classification": 0.002,
      "entity_extraction": 0.015,
      "reca_analysis": 0.012,
      "total_usd": 0.029
    }
  },

  "provenance": {
    "processed_at": "2025-10-31T22:00:00Z",
    "file_hash_sha256": "abc123...",
    "original_filename": "RECA-Data-Summary.pdf",
    "version": "2.0"
  }
}
```

---

## Implementation Steps

### Step 1: Entity Extraction (`src/lib/document-intelligence/entity-extraction.ts`)

**Goal**: Extract structured data from OCR text using GPT-4o

**Implementation**:
```typescript
interface EntityExtractionResult {
  persons: Person[];
  dates: Date[];
  addresses: Address[];
  medical: MedicalRecord[];
  employment: Employment[];
}

async function extractEntities(
  ocrText: string,
  documentType: FileCategory
): Promise<EntityExtractionResult> {
  // Use GPT-4o with structured output to extract:
  // - Names (claimant, witnesses, doctors, employers)
  // - Dates (birth, exposure period, diagnosis, treatment)
  // - Addresses with county extraction for jurisdiction checks
  // - Medical diagnoses with ICD codes
  // - Employment history at nuclear facilities

  const prompt = `Extract all structured data from this RECA claim document...`;

  // Call OpenAI with response_format: { type: "json_schema", ... }
  // Return parsed entities
}
```

**Files to Create**:
- `src/lib/document-intelligence/entity-extraction.ts`
- `src/lib/document-intelligence/schemas/entity-schema.ts` (TypeScript types)

---

### Step 2: RECA Compliance Checker (`src/lib/document-intelligence/reca-compliance.ts`)

**Goal**: Validate claim completeness and eligibility

**Implementation**:
```typescript
interface RECAComplianceResult {
  claim_type_suspected: "downwinder" | "onsite" | "uranium";
  checklist_coverage: number; // 0-1
  missing_requirements: MissingRequirement[];
  date_sanity: DateSanityCheck[];
  jurisdiction_match: JurisdictionMatch;
  name_consistency: NameConsistencyCheck[];
  eligibility_flags: EligibilityFlag[];
}

async function checkRECACompliance(
  entities: EntityExtractionResult,
  allDocuments: Document[],
  ocrText: string
): Promise<RECAComplianceResult> {
  // 1. Determine claim type (downwinder vs onsite vs uranium worker)
  // 2. Build checklist based on claim type
  // 3. Check which documents are present vs required
  // 4. Validate dates (exposure period, birth date, diagnosis date)
  // 5. Check jurisdiction (county in covered area?)
  // 6. Verify name consistency across documents
  // 7. Calculate completion percentage
}
```

**RECA Requirements by Claim Type**:

**Downwinder**:
- Birth certificate or proof of birth
- Proof of residence in affected area during exposure period (1951-1958 or 1962)
- Medical diagnosis of covered disease (21 cancers)
- Death certificate (if posthumous claim)
- Affidavit of residence (notarized)

**Onsite Participant**:
- Birth certificate
- Employment records at Nevada Test Site or Pacific test sites
- Proof of participation dates
- Medical diagnosis
- Security clearance documentation (if applicable)

**Uranium Worker**:
- Birth certificate
- Employment records at uranium mine/mill
- Proof of employment during covered period (1942-1971)
- Medical diagnosis (lung disease, kidney disease, etc.)

**Files to Create**:
- `src/lib/document-intelligence/reca-compliance.ts`
- `src/lib/document-intelligence/schemas/reca-requirements.ts` (requirement checklists)
- `src/lib/document-intelligence/utils/covered-counties.ts` (list of affected counties)

---

### Step 3: Risk Analyzer (`src/lib/document-intelligence/risk-analysis.ts`)

**Goal**: Flag issues that could cause claim denial

**Implementation**:
```typescript
interface RiskFlag {
  flag: string;
  severity: "low" | "medium" | "high";
  category: "compliance" | "eligibility" | "quality" | "consistency";
  message: string;
  action_required: string;
}

async function analyzeRisks(
  entities: EntityExtractionResult,
  compliance: RECAComplianceResult,
  quality: QualityMetrics
): Promise<RiskFlag[]> {
  const risks: RiskFlag[] = [];

  // Check for:
  // - Missing signatures/notarizations
  // - Date inconsistencies (exposure before birth, etc.)
  // - Jurisdiction mismatches
  // - Name mismatches across documents
  // - Incomplete coverage of exposure period
  // - Non-covered diagnoses
  // - Low quality scans affecting legibility

  return risks.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}
```

**Files to Create**:
- `src/lib/document-intelligence/risk-analysis.ts`
- `src/lib/document-intelligence/schemas/risk-schema.ts`

---

### Step 4: Update Processing Pipeline (`src/app/api/documents/upload/route.ts`)

**Modify `processDocumentInBackground()` to include Phase 2 processing**:

```typescript
async function processDocumentInBackground(
  fileId: string,
  fileKey: string,
  mimeType: string
) {
  // PHASE 1 (existing)
  const { ocrResult, qualityMetrics } = await processDocument(fileBuffer, mimeType);
  const categorizationResult = await categorizeDocument(ocrText, filename);
  const documentTags = await generateDocumentTags(ocrText, filename, category);

  // PHASE 2 (new)
  const entities = await extractEntities(ocrResult.text, categorizationResult.category);

  // Get all documents for this session to check completeness
  const allDocuments = await db.uploadedFile.findMany({
    where: { intakeSessionId: uploadedFile.intakeSessionId }
  });

  const compliance = await checkRECACompliance(entities, allDocuments, ocrResult.text);
  const risks = await analyzeRisks(entities, compliance, qualityMetrics);
  const recommendations = await generateRecommendations(compliance, risks, qualityMetrics);
  const aiSummary = await generateAISummary(entities, compliance, risks, ocrResult);

  // Store extended metadata
  const extendedMetadata = {
    ...metadata, // Phase 1 metadata
    entities,
    compliance,
    risks,
    recommendations,
    aiSummary,
  };

  await db.uploadedFile.update({
    where: { id: fileId },
    data: {
      metadata: JSON.stringify(extendedMetadata),
      // ... rest of update
    }
  });
}
```

---

### Step 5: AI Intelligence Detail Modal (`src/components/documents/AIIntelligenceModal.tsx`)

**Goal**: 6-tab detailed view of AI analysis

**Component Structure**:
```tsx
interface AIIntelligenceModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AIIntelligenceModal({ documentId, isOpen, onClose }: AIIntelligenceModalProps) {
  // Fetch full intelligence data from API
  const { data, isLoading } = useSWR(`/api/documents/${documentId}/intelligence`);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="provenance">Provenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              summary={data.aiSummary}
              coverage={data.compliance.checklist_coverage}
              missing={data.compliance.missing_requirements}
              recommendations={data.recommendations}
            />
          </TabsContent>

          <TabsContent value="entities">
            <EntitiesTab entities={data.entities} />
          </TabsContent>

          {/* ... other tabs ... */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

**Tab Components to Create**:
- `OverviewTab.tsx` - AI summary + checklist progress + recommendations
- `EntitiesTab.tsx` - Extracted persons, dates, addresses, medical, employment (copy-to-clipboard)
- `QualityTab.tsx` - Per-page confidence, issues, rescan suggestions
- `ComplianceTab.tsx` - RECA checklist, jurisdiction, date checks, eligibility
- `RisksTab.tsx` - Sortable/filterable risk flags with severity
- `ProvenanceTab.tsx` - File hashes, model versions, processing metrics, costs

**Add "View Intelligence" button to DocumentCard**:
```tsx
// In DocumentCard.tsx, add button next to View/Download
<Button
  size="sm"
  variant="outline"
  onClick={() => setIntelligenceModalOpen(true)}
>
  <Sparkles className="mr-1 h-3 w-3" />
  AI Intelligence
</Button>
```

---

### Step 6: API Endpoint for Intelligence (`src/app/api/documents/[id]/intelligence/route.ts`)

**New endpoint to fetch full intelligence data**:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await db.uploadedFile.findUnique({
    where: { id: params.id },
    include: { tags: true }
  });

  if (!file || !file.metadata) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metadata = JSON.parse(file.metadata);

  return NextResponse.json({
    ocr: metadata.ocrConfidence,
    textLength: file.ocrText?.length,
    entities: metadata.entities,
    compliance: metadata.compliance,
    risks: metadata.risks,
    quality: metadata.qualityMetrics,
    recommendations: metadata.recommendations,
    aiSummary: metadata.aiSummary,
    tags: file.tags,
    metrics: metadata.metrics,
    provenance: metadata.provenance,
  });
}
```

---

## Testing Strategy

### Unit Tests
- Entity extraction accuracy (test with sample RECA documents)
- RECA compliance checker logic
- Risk flag generation
- Date sanity checks
- Jurisdiction matching

### Integration Tests
- Full pipeline: Upload → OCR → Entity Extraction → Compliance → Risk → UI
- Test with real RECA claim documents (downwinder, onsite, uranium)
- Verify metadata storage and retrieval

### User Acceptance Testing
- Can users understand AI suggestions?
- Do recommendations lead to claim completeness?
- Is the UI intuitive?

---

## Estimated Effort

| Task | Time | Complexity |
|------|------|------------|
| Entity Extraction | 4-6 hours | Medium |
| RECA Compliance Checker | 6-8 hours | High |
| Risk Analyzer | 2-4 hours | Low |
| Update Processing Pipeline | 2-3 hours | Low |
| AI Intelligence Modal (6 tabs) | 8-12 hours | High |
| API Endpoint | 1-2 hours | Low |
| Testing & Refinement | 4-6 hours | Medium |
| **TOTAL** | **27-41 hours** | |

---

## API Cost Estimates

**Per Document** (assuming 5-page RECA claim):
- OCR (Tesseract): $0.00
- Classification (GPT-4o-mini): ~$0.002
- Entity Extraction (GPT-4o): ~$0.015
- RECA Analysis (GPT-4o): ~$0.012
- **Total: ~$0.029 per document**

**For 1,000 documents**: ~$29
**For 10,000 documents**: ~$290

---

## Success Metrics

1. **Claim Completeness**: Average checklist coverage increases from 40% to 75%
2. **Document Quality**: Rescan requests reduce low-quality submissions by 60%
3. **Processing Time**: Users complete claims 40% faster with AI guidance
4. **Denial Rate**: Claims with AI validation have 50% lower denial rate
5. **User Satisfaction**: 85%+ users find AI suggestions helpful

---

## Next Steps

1. **Review & Approve Plan** - Stakeholder sign-off
2. **Set Up Development Environment** - OpenAI API keys, test data
3. **Implement Entity Extraction** - Start with Phase 2 Step 1
4. **Iterate Through Steps 2-6** - Build incrementally
5. **Test with Real Documents** - Validate accuracy
6. **Deploy to Production** - Gradual rollout

---

## Notes & Considerations

### OpenAI API Configuration
- Use **GPT-4o** for entity extraction (better accuracy)
- Use **structured outputs** (JSON schema) for consistent parsing
- Implement **retry logic** for API failures
- Add **caching** for repeated analyses

### Security & Privacy
- All processing happens server-side
- PII in metadata should be encrypted at rest
- Audit logs for all AI analysis
- HIPAA compliance for medical data

### Performance
- Entity extraction can be slow (10-15 seconds per document)
- Consider batch processing for multiple documents
- Cache entity extraction results
- Use worker threads for heavy processing

### Future Enhancements (Phase 3)
- **Auto-fill forms** using extracted entities
- **Document comparison** across multiple submissions
- **Fraud detection** using pattern analysis
- **Predictive analytics** (claim approval likelihood)
- **Multi-language support** (Spanish, Navajo)

---

## Files to Create

```
src/lib/document-intelligence/
├── entity-extraction.ts           # NEW
├── reca-compliance.ts            # NEW
├── risk-analysis.ts              # NEW
├── recommendation-generator.ts   # NEW
├── ai-summary-generator.ts       # NEW
├── schemas/
│   ├── entity-schema.ts          # NEW
│   ├── reca-requirements.ts      # NEW
│   ├── risk-schema.ts            # NEW
│   └── compliance-schema.ts      # NEW
└── utils/
    ├── covered-counties.ts        # NEW (list of affected counties)
    ├── icd-codes.ts              # NEW (covered diagnoses)
    └── date-validators.ts        # NEW (date sanity checks)

src/components/documents/
├── AIIntelligenceModal.tsx       # NEW
├── tabs/
│   ├── OverviewTab.tsx           # NEW
│   ├── EntitiesTab.tsx           # NEW
│   ├── QualityTab.tsx            # NEW
│   ├── ComplianceTab.tsx         # NEW
│   ├── RisksTab.tsx              # NEW
│   └── ProvenanceTab.tsx         # NEW

src/app/api/documents/
└── [id]/
    └── intelligence/
        └── route.ts               # NEW (GET /api/documents/:id/intelligence)
```

---

## Continuation Prompt for Next Session

```
Continue working on RadiantClaims document management system - Phase 2 implementation.

# Context
I have a RECA claims platform with Phase 1 document intelligence complete:
- Automatic PDF text extraction (pdfjs-dist + Tesseract OCR fallback)
- AI categorization (12 document types, 85% confidence)
- Smart tags (excellent_quality, needs_signature, missing_last_name, etc.)
- Grid/List view with compact AI intelligence display
- Files stored in R2, metadata in PostgreSQL

# Current State
- Dev server: http://localhost:3000
- Branch: service-tiers
- Database: PostgreSQL at localhost:5432/radiantclaims
- All Phase 1 code is working and tested

# Phase 2 Goal
Implement enterprise document intelligence with:
1. Entity extraction (names, dates, addresses, medical records)
2. RECA compliance checking (claim completeness, eligibility)
3. Risk analysis (flags for potential claim denial)
4. Detailed AI Intelligence modal (6 tabs)
5. Actionable recommendations

# Start Here
Read the full implementation plan at:
`/Users/brandonarmstrong/Documents/Github/RadiantClaims/docs/PHASE_2_IMPLEMENTATION_PLAN.md`

Then begin with Step 1: Entity Extraction
- Create `src/lib/document-intelligence/entity-extraction.ts`
- Use GPT-4o with structured outputs
- Extract persons, dates, addresses, medical, employment from OCR text
- Test with the processed RECA document (ID: cmhfak8mc0001xncrg434n7lc)

Use the existing patterns from Phase 1 files for consistency.
```

---

**END OF PLAN**

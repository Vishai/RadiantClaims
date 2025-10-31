# Phase 2 Step 4: AI Intelligence Modal UI - Continuation Prompt

## Context

RadiantClaims is a RECA claims processing platform. We've completed the backend AI intelligence system (Steps 1-3) and are ready to build the UI to display this intelligence to users.

## What's Already Complete ✅

### Phase 2 Backend (Steps 1-3)
All backend intelligence is **fully functional** and automatically runs when documents are uploaded:

1. **Entity Extraction** - Extracts persons, dates, addresses, medical records, employment
2. **RECA Compliance Checker** - Validates claim completeness, checks jurisdiction, identifies missing documents
3. **Risk Analyzer** - Identifies issues that could cause claim denial

### Current Data Structure
All intelligence is stored in `UploadedFile.metadata` JSON field with this structure:

```typescript
interface Metadata {
  // Phase 1 data
  ocrConfidence: number;
  pageCount: number;
  qualityMetrics?: {
    qualityScore: number;
    isBlurry: boolean;
    isLowContrast: boolean;
  };
  aiCategorization?: {
    suggestedCategory: string;
    confidence: number;
    reasoning: string;
  };

  // Phase 2 data (NEW - already in database)
  entities: EntityExtractionResult;
  entitiesExtractedAt: string;
  compliance: RECAComplianceResult;
  complianceCheckedAt: string;
  risks: RiskAnalysisResult;
  risksAnalyzedAt: string;
}
```

### Key Files
- **Schemas**: `src/lib/document-intelligence/schemas/*`
- **Intelligence Logic**: `src/lib/document-intelligence/{entity-extraction,reca-compliance,risk-analysis}.ts`
- **Processing Pipeline**: `src/app/api/documents/upload/route.ts` (auto-runs on upload)
- **UI Components**: `src/components/documents/{DocumentCard,DocumentDashboard,DocumentListItem}.tsx`

## Task: Build AI Intelligence Modal (Step 4)

### Overview
Create a **6-tab modal** that displays all AI intelligence data when users click "View Intelligence" on a document card.

### Requirements

#### 1. Create API Endpoint
**File**: `src/app/api/documents/[id]/intelligence/route.ts`

```typescript
GET /api/documents/:id/intelligence

Returns:
{
  ocrConfidence: number,
  textLength: number,
  entities: EntityExtractionResult,
  compliance: RECAComplianceResult,
  risks: RiskAnalysisResult,
  quality: QualityMetrics,
  tags: DocumentTag[],
  metadata: {
    processingTimeMs: number,
    entitiesExtractedAt: string,
    complianceCheckedAt: string,
    risksAnalyzedAt: string
  }
}
```

#### 2. Create Modal Component
**File**: `src/components/documents/AIIntelligenceModal.tsx`

- Uses shadcn/ui `Dialog` and `Tabs` components
- Fetches data from `/api/documents/:id/intelligence` using SWR
- 6 tabs with detailed views
- Responsive design (max-w-6xl, max-h-90vh)
- Loading states and error handling

#### 3. Six Tab Components

**Tab 1: Overview** (`src/components/documents/intelligence/OverviewTab.tsx`)
- AI-generated summary
- Claim type and confidence
- Completeness progress bar (0-100%)
- Top 3 missing requirements with priority badges
- Top 5 risks with severity indicators
- Actionable recommendations (bullet list)

**Tab 2: Entities** (`src/components/documents/intelligence/EntitiesTab.tsx`)
- **Persons**: List with name, role, confidence, mentions
- **Dates**: Table with label, value, confidence, page
- **Addresses**: Cards with full address, county, state, years
- **Medical**: Diagnosis, facility, doctor, dates, ICD codes
- **Employment**: Employer, title, dates, nuclear facility flag
- Copy-to-clipboard buttons for each entity

**Tab 3: Quality** (`src/components/documents/intelligence/QualityTab.tsx`)
- Overall quality score (0-100%) with color indicator
- OCR confidence per page (if multi-page)
- Quality issues (blurry, low contrast, etc.) with severity
- Recommendations for rescanning specific pages
- Visual indicators (✅ good, ⚠️ acceptable, ❌ poor)

**Tab 4: Compliance** (`src/components/documents/intelligence/ComplianceTab.tsx`)
- Claim type detection (downwinder/onsite/uranium) with confidence
- Completeness checklist (required documents with ✅/❌ status)
- Jurisdiction check (for downwinders) - covered county or not
- Date sanity checks (timeline validation)
- Name consistency across documents
- Eligibility flags
- Disease match (covered by RECA or not)

**Tab 5: Risks** (`src/components/documents/intelligence/RisksTab.tsx`)
- Risk score gauge (0-100%) with color coding
- Breakdown by category (compliance, eligibility, quality, consistency)
- Sortable/filterable risk table with columns:
  - Severity icon (🔴 high, 🟡 medium, 🟢 low)
  - Category icon (📋 compliance, ✅ eligibility, 📸 quality, 🔄 consistency)
  - Message
  - Action required
  - Details (expandable)
- Recommended actions list

**Tab 6: Provenance** (`src/components/documents/intelligence/ProvenanceTab.tsx`)
- Processing timestamps (uploaded, processed, analyzed)
- File metadata (hash, original filename, size, pages)
- Model versions used (OCR engine, GPT models)
- Processing time breakdown
- API costs (estimated per step)
- Total estimated cost for this document

#### 4. Update DocumentCard Component
**File**: `src/components/documents/DocumentCard.tsx`

Add "View Intelligence" button next to View/Download:
```tsx
<Button
  size="sm"
  variant="outline"
  onClick={() => setIntelligenceModalOpen(true)}
  disabled={doc.status !== "READY" || !doc.metadata}
>
  <Sparkles className="mr-1 h-3 w-3" />
  AI Intelligence
</Button>

<AIIntelligenceModal
  documentId={doc.id}
  isOpen={intelligenceModalOpen}
  onClose={() => setIntelligenceModalOpen(false)}
/>
```

### Design Guidelines

#### Color Scheme
- **Risk Severity**:
  - High: red-500 (🔴)
  - Medium: yellow-500 (🟡)
  - Low: green-500 (🟢)
- **Progress/Completeness**:
  - 0-49%: red
  - 50-79%: yellow
  - 80-100%: green

#### Icons (lucide-react)
- Sparkles (AI Intelligence)
- User (Persons)
- Calendar (Dates)
- MapPin (Addresses)
- Heart (Medical)
- Briefcase (Employment)
- Shield (Compliance)
- AlertTriangle (Risks)
- FileText (Provenance)

#### Typography
- Section headers: `text-lg font-semibold`
- Subsections: `text-sm font-medium text-muted-foreground`
- Data: `text-sm`
- Emphasis: `font-medium`

### Testing

After implementation, test with:
```bash
# Test with existing document that has intelligence
npx tsx scripts/test-full-intelligence.ts cmhfak8mc0001xncrg434n7lc --save

# Visit UI
open http://localhost:3000/portal/documents

# Click "View Intelligence" on the RECA document
```

### Expected User Experience

1. User uploads documents → automatic processing happens in background
2. User sees "AI Intelligence" badge on processed documents
3. User clicks "View Intelligence" button → modal opens
4. Modal shows 6 tabs with comprehensive analysis
5. User can copy entities, see risks, understand what's missing
6. User takes action based on recommendations

### Files to Create

```
src/app/api/documents/[id]/intelligence/
└── route.ts                           # NEW API endpoint

src/components/documents/
├── AIIntelligenceModal.tsx            # NEW main modal
└── intelligence/                      # NEW directory
    ├── OverviewTab.tsx                # Tab 1
    ├── EntitiesTab.tsx                # Tab 2
    ├── QualityTab.tsx                 # Tab 3
    ├── ComplianceTab.tsx              # Tab 4
    ├── RisksTab.tsx                   # Tab 5
    └── ProvenanceTab.tsx              # Tab 6
```

### Files to Modify

```
src/components/documents/DocumentCard.tsx   # Add "View Intelligence" button
src/components/documents/DocumentListItem.tsx  # Optional: add badge/button
```

## Current System Status

- **Dev server**: Running at http://localhost:3000
- **Database**: PostgreSQL at localhost:5432/radiantclaims
- **Branch**: service-tiers
- **Test document**: ID `cmhfak8mc0001xncrg434n7lc` (has full intelligence)
- **Session**: ID `cmhevsi9s00049cdokspre37a`

## Success Criteria

✅ API endpoint returns full intelligence data
✅ Modal opens with 6 functional tabs
✅ All intelligence data is displayed accurately
✅ Copy-to-clipboard works for entities
✅ Risk severity colors are correct
✅ Loading states and error handling work
✅ Modal is responsive and accessible
✅ UI matches design guidelines (shadcn/ui style)

## Next Steps After Step 4

After completing the UI modal:
- **Phase 3 Enhancements**: Auto-fill forms with extracted entities, document comparison, fraud detection, predictive analytics
- **Production Readiness**: Error monitoring, rate limiting, caching, feature flags
- **User Testing**: Get feedback from actual RECA claims processors

---

**Ready to build the UI!** All backend intelligence is working perfectly. Time to make it visible and useful for users. 🎨

# RadiantClaims - Current State Summary

**Date**: October 31, 2025
**Branch**: `service-tiers`
**Status**: Phase 1 Complete ✅ | Phase 2 Ready to Start 🎯

---

## What's Working Now

### 1. Document Upload & Storage
- ✅ Files upload to **Cloudflare R2** (`legacy-yield-claims` bucket)
- ✅ Metadata stored in **PostgreSQL** (`UploadedFile` table)
- ✅ Automatic processing triggers on upload
- ✅ Support for PDFs and images (JPEG, PNG, WEBP, GIF)
- ✅ 10MB file size limit

### 2. AI-Powered Text Extraction
- ✅ **Hybrid approach**: pdfjs-dist (digital PDFs) → Tesseract OCR (scanned PDFs)
- ✅ Successfully extracted 2,795 characters from RECA test document
- ✅ 95% OCR confidence on digital PDFs
- ✅ Quality metrics: resolution, blur detection, contrast analysis

### 3. AI Categorization
- ✅ GPT-4o-mini categorizes into 12 document types
- ✅ 85% confidence with reasoning
- ✅ Categories: IDENTITY, MEDICAL_RECORDS, PATHOLOGY_REPORT, PROOF_OF_RESIDENCE, etc.

### 4. Smart Tags
- ✅ 8 intelligent tags generated per document:
  - `excellent_quality` (100%)
  - `needs_signature` (95%)
  - `missing_last_name` (90%)
  - `no_tribal_info` (85%)
  - `missing_email` (80%)
  - `important_notice` (80%)
  - `incomplete_exposure_info` (75%)
  - `multiple_pages` (70%)

### 5. UI Features
- ✅ **Grid View**: Card-based layout with thumbnails
- ✅ **List View**: Compact horizontal layout
- ✅ **View Toggle**: Switch between grid/list
- ✅ **AI Intelligence Panel**: Shows OCR %, tags, page count
- ✅ **Filters**: Search, category, status
- ✅ **Actions**: View, Download, Delete, Recategorize

### 6. API Endpoints
- ✅ `GET /api/documents?sessionId=xxx` - Returns documents with AI intelligence
- ✅ `POST /api/documents/upload` - Uploads & auto-processes
- ✅ `GET /api/documents/:id/view` - Proxy to R2 for viewing
- ✅ `GET /api/documents/:id/download` - Download from R2
- ✅ `DELETE /api/documents/:id` - Delete from R2 + DB

---

## Key Files & Their Purpose

### Backend (Document Intelligence)
```
src/lib/document-intelligence/
├── ocr.ts                      # OCR processing (pdfjs + Tesseract)
├── ai-categorization.ts        # GPT-4o-mini categorization & tags
```

### API Routes
```
src/app/api/documents/
├── upload/route.ts             # Upload → R2, auto-process in background
├── route.ts                    # GET documents with AI intelligence
├── [id]/
│   ├── view/route.ts           # Proxy to R2 for viewing
│   ├── download/route.ts       # Download from R2
│   └── route.ts                # DELETE document
```

### UI Components
```
src/components/documents/
├── DocumentDashboard.tsx       # Main container with filters & view toggle
├── DocumentCard.tsx            # Grid view card with AI panel
├── DocumentListItem.tsx        # List view row with inline AI tags
├── DocumentCategorySelector.tsx # Category selection dialog
```

### Database Schema
```sql
-- UploadedFile table stores:
- id, intakeSessionId, fileKey (R2 path)
- originalFilename, mimeType, sizeBytes
- category, status (UPLOADING, PROCESSING, READY, FAILED)
- ocrText, ocrConfidence
- metadata (JSON with full AI analysis)
- uploadedAt, processedAt

-- DocumentTag table stores:
- uploadedFileId (FK to UploadedFile)
- tag, confidence
```

---

## Sample Processed Document

**ID**: `cmhfak8mc0001xncrg434n7lc`
**Filename**: `RECA-Data-Summary-cmh9z8gff0008bfxbwl1799oi.pdf`
**Status**: READY
**OCR Confidence**: 95%
**Text Extracted**: 2,795 characters
**Pages**: 5
**Category**: OTHER (85% confidence)
**Tags**: 8 tags including excellent_quality, needs_signature, missing_last_name

**AI Reasoning**:
> "The document is a summary of data related to a RECA Downwinder Claim, which does not fit into the standard categories like medical records or identity documents. It serves as a guide for filling out the official claim form rather than being a formal document itself."

---

## Environment

### Database
- **Host**: localhost:5432
- **Database**: radiantclaims
- **Schema**: Prisma ORM
- **Tables**: UploadedFile, DocumentTag, IntakeSession, User, etc.

### R2 Storage
- **Bucket**: `legacy-yield-claims`
- **Region**: Auto (Cloudflare)
- **CDN**: Cloudflare global network
- **Credentials**: Configured in `.env`

### APIs Used
- **OpenAI**: GPT-4o-mini for categorization
- **Tesseract.js**: Client-side OCR (v5.3)
- **pdfjs-dist**: PDF text extraction (v5.4)
- **pdf-to-png**: PDF to image conversion

### Dev Server
- **URL**: http://localhost:3000
- **Command**: `pnpm dev`
- **Port**: 3000

---

## Known Issues

### 1. PDF Library Compatibility
- ❌ pdfjs-dist has webpack issues in Next.js server environment
- ❌ pdf-to-png not working properly (import error)
- ✅ **Workaround**: Using lazy import for pdfjs, but OCR fallback broken
- 🔧 **Fix needed**: Replace pdf-to-png or find alternative

### 2. Processing Failures
- ❌ Some PDFs fail to process (scanned documents without text)
- ✅ **Fallback**: Status changes to FAILED, user can re-upload
- 🔧 **Fix needed**: Better error handling and retry logic

---

## Next Steps (Phase 2)

1. **Entity Extraction** - Extract names, dates, addresses, medical info
2. **RECA Compliance Checks** - Validate claim completeness
3. **Risk Analysis** - Flag issues that could cause denial
4. **Intelligence Modal** - 6-tab detailed view
5. **Actionable Recommendations** - Guide users through claims

**See**: `/docs/PHASE_2_IMPLEMENTATION_PLAN.md` for full details

---

## Quick Start Commands

```bash
# Start dev server
pnpm dev

# Check database
psql radiantclaims

# View processed documents
psql radiantclaims -c "SELECT id, originalFilename, status, ocrConfidence FROM \"UploadedFile\" WHERE status = 'READY';"

# Test API
curl 'http://localhost:3000/api/documents?sessionId=cmhevsi9s00049cdokspre37a' | python3 -m json.tool

# Run type check
pnpm typecheck

# Build for production
pnpm build
```

---

## Team Notes

### For AI/ML Engineers
- Entity extraction should use **GPT-4o** (not GPT-4o-mini) for better accuracy
- Use **structured outputs** (JSON schema) for consistent parsing
- Implement **retry logic** with exponential backoff
- Cache results to reduce API costs

### For Frontend Engineers
- AI Intelligence Modal needs **6 tabs**: Overview, Entities, Quality, Compliance, Risks, Provenance
- Use **shadcn/ui** components for consistency
- Add **copy-to-clipboard** for extracted entities
- Implement **real-time updates** when processing completes

### For Backend Engineers
- Processing pipeline should be **idempotent** (safe to retry)
- Store **model versions** in metadata for debugging
- Implement **feature flags** for gradual rollout
- Add **monitoring** for API costs and processing times

---

**READY FOR PHASE 2** 🚀

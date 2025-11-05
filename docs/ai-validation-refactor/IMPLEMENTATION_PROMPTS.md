# OCR Multi-Tier System - Implementation Prompts

**Purpose:** Copy-paste prompts for Claude Code to implement each phase of the OCR strategy.

---

## 🚀 Phase 1: Fix PDF.js Text Extraction

### Prompt for Claude Code

```
I need to fix the PDF text extraction in my RadiantClaims application. Currently, PDF.js is failing with this error:

"PDF.js text extraction failed: TypeError: Object.defineProperty called on non-object"

Please implement the following:

1. Install pdf-parse as a more reliable alternative to PDF.js
2. Update src/lib/document-intelligence/ocr.ts to:
   - Add extractTextWithPdfParse() function using pdf-parse library
   - Update extractTextFromPDF() to try pdf-parse FIRST before PDF.js
   - If pdf-parse extracts >50 characters, return success
   - If pdf-parse fails, try existing PDF.js method as fallback
   - Add proper error handling and logging

3. Test with the existing test document to verify it extracts text

Requirements:
- Use pnpm for package installation
- Add console logs showing which method succeeded
- Return OCRResult with method field ('pdf-parse' or 'pdfjs')
- Handle errors gracefully without crashing

Expected output in logs:
"✓ Extracted 1234 characters using pdf-parse"

Files to modify:
- src/lib/document-intelligence/ocr.ts
- package.json (via pnpm add pdf-parse)

Current branch: service-tiers
Please implement this now.
```

---

## 🚀 Phase 2: Add AWS Textract Integration

### Prompt for Claude Code

```
I need to add AWS Textract OCR as a fallback (Tier 2) when PDF.js/pdf-parse returns no text or <50 characters.

Please implement the following:

1. Install @aws-sdk/client-textract using pnpm

2. Create new file src/lib/ocr/aws-textract.ts with:
   - extractTextWithTextract(pdfBuffer: Buffer) function
   - Use AWS Textract DetectDocumentTextCommand API
   - Extract text from LINE blocks (preserves reading order)
   - Calculate average confidence from all blocks
   - Return { text: string, confidence: number, blocks: any[] }
   - Add error handling and logging

3. Update src/lib/document-intelligence/ocr.ts:
   - After PDF.js attempts fail (text.length < 50), check if AWS credentials exist
   - If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set, try Textract
   - Call extractTextWithTextract()
   - If successful (>50 chars), return with method: 'aws-textract'
   - If fails, log error and continue to next tier

4. Add environment variables to .env.example:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

Requirements:
- Only call Textract if PDF.js failed AND credentials exist
- Log cost information: "⚠️ Using AWS Textract (costs $0.0015 per page)"
- Return confidence score from Textract response
- Handle rate limits and API errors gracefully

Expected output in logs:
"📄 PDF appears to be scanned, trying AWS Textract..."
"✅ Textract extracted 1234 chars (95% confidence)"

Files to create/modify:
- src/lib/ocr/aws-textract.ts (new)
- src/lib/document-intelligence/ocr.ts (update)
- .env.example (update)

Current branch: service-tiers
Please implement this now.
```

---

## 🚀 Phase 3: Add Google Cloud Vision Integration

### Prompt for Claude Code

```
I need to add Google Cloud Vision OCR as Tier 3 fallback when AWS Textract is unavailable or failed.

Please implement the following:

1. Install @google-cloud/vision using pnpm

2. Create new file src/lib/ocr/google-vision.ts with:
   - extractTextWithGoogleVision(imageBuffer: Buffer) function
   - Use Google Vision ImageAnnotatorClient
   - Use documentTextDetection API (better for documents than basic text detection)
   - Support both service account file path AND base64 credentials
   - Extract full text from fullTextAnnotation
   - Calculate average confidence from pages
   - Return { text: string, confidence: number }
   - Add error handling and logging

3. Update src/lib/document-intelligence/ocr.ts:
   - After AWS Textract attempt, check if Google credentials exist
   - If GOOGLE_CLOUD_PROJECT_ID is set, try Google Vision
   - Call extractTextWithGoogleVision()
   - If successful (>50 chars), return with method: 'google-vision'
   - If fails, log error and continue to Tier 4

4. Add environment variables to .env.example:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   GOOGLE_CLOUD_CREDENTIALS=/path/to/service-account-key.json
   # OR for Vercel/serverless:
   GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
   ```

Requirements:
- Support both credential methods (file path or base64)
- Only call Google Vision if Textract failed AND credentials exist
- Log cost information: "⚠️ Using Google Cloud Vision (costs $0.0015 per page)"
- Handle authentication errors gracefully
- Return confidence score from Vision API response

Expected output in logs:
"📄 Trying Google Cloud Vision..."
"✅ Google Vision extracted 1234 chars (92% confidence)"

Files to create/modify:
- src/lib/ocr/google-vision.ts (new)
- src/lib/document-intelligence/ocr.ts (update)
- .env.example (update)

Current branch: service-tiers
Please implement this now.
```

---

## 🚀 Phase 4: Integrate GPT-4o Vision into OCR Pipeline

### Prompt for Claude Code

```
I need to integrate the existing GPT-4o Vision API as Tier 4 (final fallback) in the OCR pipeline.

We already have:
- src/lib/ai-agents/utils/pdf-to-image.ts (converts PDF to image)
- src/lib/ai-agents/base-agent.ts (has callOpenAIVision method)

Please implement the following:

1. Update src/lib/document-intelligence/ocr.ts:
   - After all other OCR methods fail, add Tier 4: GPT-4o Vision
   - Import convertPdfToImage from ai-agents utils
   - Convert PDF to image data URL
   - Call OpenAI chat completions API directly (not through BaseAgent)
   - Use system prompt: "You are an OCR assistant. Extract ALL text from the document image. Preserve formatting and layout as much as possible."
   - Use user prompt: "Please extract all text from this document:"
   - Send image with detail: 'high'
   - Model: gpt-4o
   - Temperature: 0.1
   - Max tokens: 4096
   - If successful (>50 chars), return with method: 'gpt-4o-vision'
   - Calculate cost: ~$0.025 per document

2. Add proper error handling:
   - Check if OPENAI_API_KEY exists
   - Handle canvas rendering failures
   - Handle API rate limits
   - Log detailed error messages

3. Add cost tracking:
   - Log: "⚠️ Using GPT-4o Vision as last resort (costs ~$0.025 per document)"
   - Include estimated token count in logs

Requirements:
- Only use as last resort when all other methods failed
- Must check OPENAI_API_KEY exists before attempting
- Handle both canvas rendering errors AND API errors
- Return confidence: 0.8 (since it's AI-generated, not traditional OCR)
- Add detailed logging of each step

Expected output in logs:
"📄 All OCR methods failed, using GPT-4o Vision as last resort..."
"📄 Converting PDF to PNG (1891 bytes)..."
"✅ PDF converted to PNG"
"🔍 Calling GPT-4o Vision for text extraction..."
"✅ GPT-4o Vision extracted 1234 chars (~768 tokens, ~$0.025 cost)"

Files to modify:
- src/lib/document-intelligence/ocr.ts (update)

Current branch: service-tiers
Please implement this now.
```

---

## 🧪 Testing All Tiers: Complete Testing Script

### Prompt for Claude Code

```
I need to create a comprehensive testing script to test all 4 OCR tiers with real documents.

Please create the following:

1. Create new file scripts/test-ocr-tiers.ts with:
   - testAllOCRTiers(documentPath: string) function
   - Test each tier sequentially, measuring:
     * Success/failure
     * Characters extracted
     * Processing time
     * Estimated cost
     * Confidence score
   - Return detailed OCRTestResult object
   - Log progress for each tier attempt
   - Create summary report at the end

2. OCRTestResult interface should include:
   ```typescript
   interface OCRTestResult {
     documentId: string;
     documentType: string;
     fileSize: number;

     // Per-tier metrics
     tier1: TierResult;
     tier2: TierResult;
     tier3: TierResult;
     tier4: TierResult;

     // Summary
     finalTierUsed: 1 | 2 | 3 | 4 | null;
     totalCost: number;
     totalTimeMs: number;
     success: boolean;
     extractedText: string;
   }

   interface TierResult {
     attempted: boolean;
     success: boolean;
     charsExtracted: number;
     timeMs: number;
     cost: number;
     confidence?: number;
     error?: string;
   }
   ```

3. Test with multiple document types:
   - Digital PDF (should succeed with Tier 1)
   - Scanned PDF (should succeed with Tier 2)
   - Photo of document (should succeed with Tier 3)
   - Poor quality doc (should succeed with Tier 4)

4. Create summary report showing:
   - Success rate per tier
   - Average cost per tier
   - Average processing time per tier
   - Total cost for all tests
   - Recommendations based on results

5. Add command to package.json:
   ```json
   "test:ocr": "tsx scripts/test-ocr-tiers.ts"
   ```

Requirements:
- Test all 4 tiers even if earlier tier succeeds (for comparison)
- Log detailed results for each tier
- Calculate and display costs accurately
- Create JSON report file: test-results/ocr-test-[timestamp].json
- Create markdown summary: test-results/ocr-summary-[timestamp].md
- Handle missing test documents gracefully

Expected output:
```
🧪 Testing OCR Tiers for: test-doc.pdf

🔹 Testing Tier 1: PDF.js/pdf-parse
✅ Tier 1 SUCCESS: 1234 chars in 95ms ($0.00)

🔹 Testing Tier 2: AWS Textract
⏭️  Skipping (Tier 1 succeeded)

🔹 Testing Tier 3: Google Vision
⏭️  Skipping (Tier 1 succeeded)

🔹 Testing Tier 4: GPT-4o Vision
⏭️  Skipping (Tier 1 succeeded)

📊 Final Result:
- Tier Used: 1 (PDF.js)
- Cost: $0.00
- Time: 95ms
- Success: ✅
```

Files to create:
- scripts/test-ocr-tiers.ts (new)
- test-results/ directory (create if not exists)

Current branch: service-tiers
Please implement this now.
```

---

## 📊 Monitoring Dashboard

### Prompt for Claude Code

```
I need to add OCR metrics tracking to monitor success rates, costs, and performance of each tier.

Please implement the following:

1. Create new database table for OCR metrics:
   ```prisma
   model OCRMetrics {
     id        String   @id @default(cuid())
     createdAt DateTime @default(now())

     // Document info
     uploadedFileId String
     uploadedFile   UploadedFile @relation(fields: [uploadedFileId], references: [id])

     // Tier attempts
     tier1Attempted Boolean @default(false)
     tier1Success   Boolean @default(false)
     tier1TimeMs    Int?
     tier1Cost      Float   @default(0)

     tier2Attempted Boolean @default(false)
     tier2Success   Boolean @default(false)
     tier2TimeMs    Int?
     tier2Cost      Float   @default(0)
     tier2Confidence Float?

     tier3Attempted Boolean @default(false)
     tier3Success   Boolean @default(false)
     tier3TimeMs    Int?
     tier3Cost      Float   @default(0)
     tier3Confidence Float?

     tier4Attempted Boolean @default(false)
     tier4Success   Boolean @default(false)
     tier4TimeMs    Int?
     tier4Cost      Float   @default(0)

     // Final result
     finalTierUsed  Int?
     totalTimeMs    Int
     totalCost      Float
     charsExtracted Int
     success        Boolean

     @@index([uploadedFileId])
     @@index([createdAt])
   }
   ```

2. Update src/lib/document-intelligence/ocr.ts:
   - Track metrics for each tier attempt
   - Store metrics in database after OCR completion
   - Create helper function: trackOCRMetrics()

3. Create API endpoint: GET /api/analytics/ocr-metrics
   - Return summary statistics:
     * Success rate per tier
     * Average cost per tier
     * Average processing time per tier
     * Total documents processed
     * Total cost (daily/weekly/monthly)
   - Support date range filtering
   - Return JSON response

4. Create simple analytics page: /portal/analytics/ocr
   - Display key metrics in cards
   - Show tier usage distribution (pie chart)
   - Show cost trend over time (line chart)
   - Show success rates (bar chart)
   - Add cost alerts (>$10/month warning)

Requirements:
- Asynchronous metrics tracking (don't block OCR)
- Handle database errors gracefully
- Add indexes for fast queries
- Support date range filtering
- Calculate costs accurately per tier

Expected metrics display:
```
OCR Performance (Last 30 Days)
------------------------------
Total Documents: 7,500
Success Rate: 99.2%
Total Cost: $2.97
Average Time: 0.7s

Tier Distribution:
- Tier 1 (PDF.js): 75.2% ($0.00)
- Tier 2 (Textract): 19.8% ($2.25)
- Tier 3 (Google): 3.1% ($0.34)
- Tier 4 (Vision): 1.9% ($0.38)
```

Files to create/modify:
- prisma/schema.prisma (add OCRMetrics model)
- src/lib/document-intelligence/ocr.ts (add tracking)
- src/app/api/analytics/ocr-metrics/route.ts (new)
- src/app/portal/analytics/ocr/page.tsx (new)

Current branch: service-tiers
Run: npx prisma migrate dev --name add-ocr-metrics

Please implement this now.
```

---

## 🔧 Configuration & Environment Setup

### Prompt for Claude Code

```
I need to set up environment configuration for all OCR tiers with proper validation.

Please implement the following:

1. Update src/env.mjs to add OCR-related environment variables:
   - OCR tier enable flags (optional, default true)
   - AWS Textract credentials
   - Google Cloud Vision credentials
   - OCR thresholds and timeouts
   - Use Zod for validation

2. Add to .env.example:
   ```env
   # OCR Configuration
   OCR_ENABLE_TIER_1=true
   OCR_ENABLE_TIER_2=true
   OCR_ENABLE_TIER_3=true
   OCR_ENABLE_TIER_4=true
   OCR_MIN_CHARS_THRESHOLD=50

   # AWS Textract (Tier 2)
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=us-east-1

   # Google Cloud Vision (Tier 3)
   GOOGLE_CLOUD_PROJECT_ID=
   GOOGLE_CLOUD_CREDENTIALS_BASE64=

   # Already exists:
   # OPENAI_API_KEY=
   ```

3. Create configuration helper: src/lib/config/ocr-config.ts
   ```typescript
   export const ocrConfig = {
     enableTier1: env.OCR_ENABLE_TIER_1 ?? true,
     enableTier2: env.OCR_ENABLE_TIER_2 ?? true,
     enableTier3: env.OCR_ENABLE_TIER_3 ?? true,
     enableTier4: env.OCR_ENABLE_TIER_4 ?? true,
     minCharsThreshold: env.OCR_MIN_CHARS_THRESHOLD ?? 50,

     hasTextractCredentials: () => {
       return !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
     },

     hasGoogleVisionCredentials: () => {
       return !!(env.GOOGLE_CLOUD_PROJECT_ID &&
                 (env.GOOGLE_CLOUD_CREDENTIALS || env.GOOGLE_CLOUD_CREDENTIALS_BASE64));
     },

     hasOpenAICredentials: () => {
       return !!env.OPENAI_API_KEY;
     },
   };
   ```

4. Update OCR pipeline to use configuration:
   - Check ocrConfig.enableTier2 before calling Textract
   - Check ocrConfig.enableTier3 before calling Google Vision
   - Check ocrConfig.enableTier4 before calling GPT-4o Vision
   - Use ocrConfig.minCharsThreshold consistently

5. Add startup validation:
   - Log which OCR tiers are enabled
   - Warn if credentials are missing
   - Show configuration in dev mode

Requirements:
- Use environment variables for all sensitive data
- Validate configuration at startup
- Provide helpful error messages for missing credentials
- Allow disabling individual tiers for testing/cost control
- Make all thresholds configurable

Expected output on startup:
```
🔧 OCR Configuration:
- Tier 1 (PDF.js): ✅ Enabled
- Tier 2 (AWS Textract): ✅ Enabled (credentials found)
- Tier 3 (Google Vision): ⚠️  Disabled (no credentials)
- Tier 4 (GPT-4o Vision): ✅ Enabled (API key found)
- Min chars threshold: 50
```

Files to create/modify:
- src/env.mjs (update)
- src/lib/config/ocr-config.ts (new)
- src/lib/document-intelligence/ocr.ts (use config)
- .env.example (update)

Current branch: service-tiers
Please implement this now.
```

---

## 📖 Documentation Updates

### Prompt for Claude Code

```
I need to update all relevant documentation to reflect the new multi-tier OCR system.

Please update the following:

1. Update README.md:
   - Add "Multi-Tier OCR System" section
   - List all 4 tiers with descriptions
   - Add setup instructions for AWS and Google credentials
   - Include cost estimates
   - Add troubleshooting section

2. Create docs/OCR_SETUP_GUIDE.md:
   - Step-by-step setup for each tier
   - How to get AWS Textract credentials
   - How to get Google Cloud Vision credentials
   - How to configure environment variables
   - How to test each tier
   - Common issues and solutions

3. Update docs/ai-validation-refactor/API_ENDPOINTS.md:
   - Document new OCR metrics endpoint
   - Add examples of OCR responses
   - Include OCR method in validation responses

4. Create docs/COST_ANALYSIS.md:
   - Detailed cost breakdown per tier
   - Monthly cost projections by customer count
   - Cost optimization tips
   - How to monitor costs
   - How to set up cost alerts

5. Add inline code documentation:
   - Add JSDoc comments to all OCR functions
   - Document parameters, return types, and errors
   - Add examples of usage
   - Include cost information in comments

Requirements:
- Clear, beginner-friendly language
- Include code examples
- Add cost information where relevant
- Link related documentation
- Keep documentation in sync with code

Files to create/modify:
- README.md (update)
- docs/OCR_SETUP_GUIDE.md (new)
- docs/ai-validation-refactor/API_ENDPOINTS.md (update)
- docs/COST_ANALYSIS.md (new)
- All OCR source files (add JSDoc)

Current branch: service-tiers
Please implement this now.
```

---

## ✅ Complete Implementation Prompt (All Phases)

### Prompt for Claude Code (Copy this for full implementation)

```
I need to implement a complete multi-tier OCR system for my RadiantClaims application with 4 fallback tiers to achieve 99%+ document text extraction success rate while keeping costs under $10/month.

## Context
Current problem: PDF.js text extraction is failing with "Object.defineProperty" error, causing all documents to return 0 chars extracted.

## Implementation Requirements

Please read and implement ALL phases from:
- docs/ai-validation-refactor/OCR_STRATEGY_MASTER_PLAN.md

Implementation order:
1. Phase 1: Fix PDF.js with pdf-parse (free, 75% success rate)
2. Phase 2: Add AWS Textract fallback ($1.50/1K pages, 95% success on scanned docs)
3. Phase 3: Add Google Vision fallback ($1.50/1K pages, handles photos/handwriting)
4. Phase 4: Add GPT-4o Vision final fallback (~$0.025/doc, AI-powered)
5. Testing: Create comprehensive test script
6. Monitoring: Add metrics tracking and dashboard
7. Configuration: Set up environment variables with validation
8. Documentation: Update all relevant docs

## Success Criteria
- 99%+ overall success rate
- <$10/month cost for 500 customers (7,500 docs/month)
- <1 second average processing time
- Proper error handling at each tier
- Comprehensive logging
- Metrics tracking for monitoring

## Files to Create/Modify
New files:
- src/lib/ocr/aws-textract.ts
- src/lib/ocr/google-vision.ts
- src/lib/config/ocr-config.ts
- scripts/test-ocr-tiers.ts
- src/app/api/analytics/ocr-metrics/route.ts
- docs/OCR_SETUP_GUIDE.md
- docs/COST_ANALYSIS.md

Modified files:
- src/lib/document-intelligence/ocr.ts (main OCR pipeline)
- src/env.mjs (environment validation)
- prisma/schema.prisma (add OCRMetrics model)
- README.md (update with OCR info)
- .env.example (add all OCR variables)

## Package Dependencies
Install with pnpm:
- pdf-parse (Phase 1)
- @aws-sdk/client-textract (Phase 2)
- @google-cloud/vision (Phase 3)
- canvas (Phase 4 - already installed)

## Testing
After implementation:
1. Test with the existing test document (pathology report PDF)
2. Run scripts/test-ocr-tiers.ts with multiple document types
3. Verify each tier can be independently disabled
4. Check metrics are being tracked correctly
5. Verify cost estimates are accurate

## Branch
Current branch: service-tiers

Please implement this complete system now, working through each phase systematically. Use the detailed implementation guides in OCR_STRATEGY_MASTER_PLAN.md and the individual phase prompts above as reference.

Start with Phase 1 and work through all phases in order, testing each phase before moving to the next.
```

---

**Status:** 📋 Ready to use
**Total Implementation Time:** ~1-2 days
**Estimated Cost:** <$10/month for 500 customers

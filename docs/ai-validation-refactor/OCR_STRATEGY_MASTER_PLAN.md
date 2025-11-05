# OCR Strategy Master Plan - Multi-Tier Fallback System

**Date:** November 4, 2024
**Branch:** `service-tiers`
**Status:** 📋 Planning Phase

---

## 🎯 Executive Summary

Implement a robust 4-tier OCR fallback system to extract text from RECA claim documents with 99%+ success rate while keeping costs under $10/month for hundreds of customers.

**Goal:** Extract text from any document type (digital PDFs, scanned documents, photos, handwritten forms) with maximum reliability and minimum cost.

---

## 💰 Cost Analysis at Scale

### Assumptions
- **Customer base:** 500 active customers/month
- **Documents per customer:** Average 15 documents per claim
- **Total documents:** 7,500 documents/month
- **Growth projection:** 1,000 customers = 15,000 docs/month

### Cost Breakdown by Tier

| Tier | Method | Success Rate | Cost per 1K | 7.5K docs | 15K docs | 30K docs |
|------|--------|--------------|-------------|-----------|----------|----------|
| **1** | PDF.js (fixed) | 75% | $0 | $0 | $0 | $0 |
| **2** | AWS Textract | 20% | $1.50 | $2.25 | $4.50 | $9.00 |
| **3** | Google Vision | 3% | $1.50 | $0.34 | $0.68 | $1.35 |
| **4** | GPT-4o Vision | 2% | $2.50* | $0.38 | $0.75 | $1.50 |
| | | **Total** | | **$2.97** | **$5.93** | **$11.85** |

*GPT-4o Vision: ~$0.025 per image (768 tokens + response tokens)

**Conclusion:** ✅ **Under $10/month budget until ~1,200 customers**, then ~$12/month at scale

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Document Upload                          │
│                  (PDF, PNG, JPG, TIFF)                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 1: PDF.js Text Extraction (FREE, instant)              │
│  ✓ Digital PDFs with embedded text                           │
│  ✓ 75% success rate                                          │
│  ✓ ~100ms processing time                                    │
└──────────────────────────────────────────────────────────────┘
                    ↓ (if fails or < 50 chars)
┌──────────────────────────────────────────────────────────────┐
│  TIER 2: AWS Textract ($$, 2-3 sec)                          │
│  ✓ Scanned documents, forms, tables                          │
│  ✓ 95%+ accuracy on remaining docs                           │
│  ✓ Preserves layout and structure                            │
│  ✓ Medical records, tax forms, pathology reports             │
└──────────────────────────────────────────────────────────────┘
                    ↓ (if fails or unavailable)
┌──────────────────────────────────────────────────────────────┐
│  TIER 3: Google Cloud Vision ($$, 1-2 sec)                   │
│  ✓ Photos of documents                                       │
│  ✓ Poor quality scans                                        │
│  ✓ Multi-language support                                    │
│  ✓ Handwritten text (better than Textract)                   │
└──────────────────────────────────────────────────────────────┘
                    ↓ (if fails or unavailable)
┌──────────────────────────────────────────────────────────────┐
│  TIER 4: GPT-4o Vision API ($$$, 3-5 sec)                    │
│  ✓ AI-powered analysis                                       │
│  ✓ Works on any image format                                 │
│  ✓ Can infer meaning from context                            │
│  ✓ Last resort fallback                                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│               Text Successfully Extracted ✅                  │
│           (Store in UploadedFile.ocrText)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: Fix PDF.js Text Extraction (FREE)

### Current Problem
```
PDF.js text extraction failed: TypeError: Object.defineProperty called on non-object
No text found in PDF, falling back to OCR for scanned document...
⚠️  OCR for scanned PDFs is not yet implemented
✓ OCR completed: 0 chars extracted
```

### Root Cause
Next.js 14 + PDF.js compatibility issue with webpack module bundling.

### Solution
Replace problematic PDF.js import with a working alternative or use pdf-parse library.

### Implementation Steps

1. **Install pdf-parse (simpler alternative)**
```bash
pnpm add pdf-parse
```

2. **Update OCR extraction function**
```typescript
// src/lib/document-intelligence/ocr.ts

import pdfParse from 'pdf-parse';

async function extractTextWithPdfParse(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const data = await pdfParse(pdfBuffer);
    return {
      text: data.text,
      pageCount: data.numpages
    };
  } catch (error) {
    console.error('pdf-parse extraction failed:', error);
    return { text: '', pageCount: 0 };
  }
}
```

3. **Update extractTextFromPDF to try pdf-parse first**
```typescript
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // TIER 1A: Try pdf-parse (more reliable than PDF.js in Next.js)
    const parseResult = await extractTextWithPdfParse(pdfBuffer);

    if (parseResult.text.length > 50) {
      console.log(`✓ Extracted ${parseResult.text.length} characters using pdf-parse`);
      return {
        text: parseResult.text,
        confidence: 0.95,
        language: 'eng',
        processingTimeMs: Date.now() - startTime,
        pageCount: parseResult.pageCount,
      };
    }

    // TIER 1B: Fallback to PDF.js if pdf-parse fails
    const pdfJsResult = await extractTextWithPDFJS(pdfBuffer);
    if (pdfJsResult.text.length > 50) {
      return {
        text: pdfJsResult.text,
        confidence: 0.95,
        language: 'eng',
        processingTimeMs: Date.now() - startTime,
        pageCount: pdfJsResult.pageCount,
      };
    }

    // No text found - document is likely scanned
    console.log('No text found in PDF (likely scanned document)');
    return {
      text: '',
      confidence: 0,
      language: 'eng',
      processingTimeMs: Date.now() - startTime,
      pageCount: 0,
    };
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw error;
  }
}
```

### Expected Results
- ✅ 75-85% of PDFs extract text successfully
- ✅ ~100ms processing time
- ✅ Zero API costs
- ✅ Works for digital PDFs (most RECA documents)

### Files to Modify
- `src/lib/document-intelligence/ocr.ts` - Update extraction logic
- `package.json` - Add pdf-parse dependency

---

## 📋 Phase 2: AWS Textract Integration (Tier 2)

### When to Use
- PDF.js returns 0 chars or < 50 chars
- Document is scanned (no embedded text)
- Forms, tables, medical records

### AWS Textract Pricing
- **Detect Document Text API:** $1.50 per 1,000 pages
- **Analyze Document API:** $50 per 1,000 pages (with tables/forms - not needed for basic OCR)
- **Free Tier:** 1,000 pages per month for first 3 months

### Implementation Steps

1. **Install AWS SDK**
```bash
pnpm add @aws-sdk/client-textract
```

2. **Add environment variables**
```env
# .env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

3. **Create Textract helper**
```typescript
// src/lib/ocr/aws-textract.ts

import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

export async function extractTextWithTextract(pdfBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  blocks: any[];
}> {
  const client = new TextractClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  try {
    console.log('📤 Sending document to AWS Textract...');

    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: pdfBuffer,
      },
    });

    const response = await client.send(command);

    if (!response.Blocks) {
      return { text: '', confidence: 0, blocks: [] };
    }

    // Extract text from LINE blocks (preserves reading order)
    const lines = response.Blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .filter(text => text);

    const fullText = lines.join('\n');

    // Calculate average confidence
    const confidenceScores = response.Blocks
      .filter(block => block.BlockType === 'LINE' && block.Confidence)
      .map(block => block.Confidence!);

    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length / 100
      : 0;

    console.log(`✅ Textract extracted ${fullText.length} chars (${Math.round(avgConfidence * 100)}% confidence)`);

    return {
      text: fullText,
      confidence: avgConfidence,
      blocks: response.Blocks,
    };
  } catch (error) {
    console.error('❌ AWS Textract failed:', error);
    throw error;
  }
}
```

4. **Integrate into OCR pipeline**
```typescript
// src/lib/document-intelligence/ocr.ts

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
  // ... existing PDF.js attempts ...

  // TIER 2: If no text found, try AWS Textract
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      console.log('📄 PDF appears to be scanned, trying AWS Textract...');
      const { extractTextWithTextract } = await import('./ocr/aws-textract');
      const textractResult = await extractTextWithTextract(pdfBuffer);

      if (textractResult.text.length > 50) {
        return {
          text: textractResult.text,
          confidence: textractResult.confidence,
          language: 'eng',
          processingTimeMs: Date.now() - startTime,
          method: 'aws-textract',
        };
      }
    } catch (error) {
      console.error('AWS Textract failed, continuing to next tier:', error);
    }
  }

  // Continue to Tier 3...
}
```

### Expected Results
- ✅ 95%+ accuracy on scanned documents
- ✅ 2-3 second processing time
- ✅ ~$1.50 per 1,000 documents (only used for 20% of docs)
- ✅ Preserves document structure (tables, forms)

### Files to Create/Modify
- `src/lib/ocr/aws-textract.ts` - New helper
- `src/lib/document-intelligence/ocr.ts` - Add to pipeline
- `.env` - Add AWS credentials

---

## 📋 Phase 3: Google Cloud Vision Integration (Tier 3)

### When to Use
- AWS Textract unavailable or failed
- Photos of documents (not just scans)
- Handwritten text
- Multi-language documents

### Google Vision Pricing
- **Text Detection:** $1.50 per 1,000 images
- **Document Text Detection:** $1.50 per 1,000 images (better for multi-page docs)
- **Free Tier:** 1,000 units per month

### Implementation Steps

1. **Install Google Cloud SDK**
```bash
pnpm add @google-cloud/vision
```

2. **Add environment variables**
```env
# .env
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_CREDENTIALS=path/to/service-account-key.json
# OR use service account JSON as base64:
GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
```

3. **Create Vision API helper**
```typescript
// src/lib/ocr/google-vision.ts

import vision from '@google-cloud/vision';

export async function extractTextWithGoogleVision(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
}> {
  try {
    console.log('📤 Sending document to Google Cloud Vision...');

    // Initialize client
    const client = new vision.ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64
        ? JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString())
        : undefined,
      keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS,
    });

    // Perform document text detection
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      return { text: '', confidence: 0 };
    }

    // Calculate average confidence from pages
    const avgConfidence = fullTextAnnotation.pages
      ? fullTextAnnotation.pages.reduce((sum, page) => sum + (page.confidence || 0), 0) / fullTextAnnotation.pages.length
      : 0.8;

    console.log(`✅ Google Vision extracted ${fullTextAnnotation.text.length} chars (${Math.round(avgConfidence * 100)}% confidence)`);

    return {
      text: fullTextAnnotation.text,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('❌ Google Vision failed:', error);
    throw error;
  }
}
```

4. **Integrate into OCR pipeline**
```typescript
// src/lib/document-intelligence/ocr.ts

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
  // ... existing PDF.js and Textract attempts ...

  // TIER 3: If Textract failed, try Google Vision
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    try {
      console.log('📄 Trying Google Cloud Vision...');
      const { extractTextWithGoogleVision } = await import('./ocr/google-vision');
      const visionResult = await extractTextWithGoogleVision(pdfBuffer);

      if (visionResult.text.length > 50) {
        return {
          text: visionResult.text,
          confidence: visionResult.confidence,
          language: 'eng',
          processingTimeMs: Date.now() - startTime,
          method: 'google-vision',
        };
      }
    } catch (error) {
      console.error('Google Vision failed, continuing to next tier:', error);
    }
  }

  // Continue to Tier 4...
}
```

### Expected Results
- ✅ 92-98% accuracy
- ✅ 1-2 second processing time
- ✅ ~$1.50 per 1,000 documents (only used for 3% of docs)
- ✅ Good with handwritten text
- ✅ Multi-language support

### Files to Create/Modify
- `src/lib/ocr/google-vision.ts` - New helper
- `src/lib/document-intelligence/ocr.ts` - Add to pipeline
- `.env` - Add Google credentials

---

## 📋 Phase 4: GPT-4o Vision API (Tier 4 - Final Fallback)

### When to Use
- All other methods failed
- Document quality is very poor
- Need AI interpretation (not just OCR)
- Complex layouts or unusual formats

### GPT-4o Vision Pricing
- **Input:** $5.00 per 1M tokens
- **Output:** $15.00 per 1M tokens
- **Image tokens:** ~765 tokens per image (high detail)
- **Estimated cost:** ~$0.025 per document (image + response)

### Implementation
**Already implemented!** See files:
- `src/lib/ai-agents/utils/pdf-to-image.ts`
- `src/lib/ai-agents/base-agent.ts` (callOpenAIVision method)
- `src/lib/ai-agents/agents/classifier-agent.ts`

### Integration into OCR Pipeline
```typescript
// src/lib/document-intelligence/ocr.ts

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
  // ... existing attempts ...

  // TIER 4: Last resort - GPT-4o Vision
  try {
    console.log('📄 All OCR methods failed, using GPT-4o Vision as last resort...');
    const { convertPdfToImage } = await import('../ai-agents/utils/pdf-to-image');
    const imageDataUrl = await convertPdfToImage(pdfBuffer);

    // Call GPT-4o Vision with extraction prompt
    const openAIKey = process.env.OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an OCR assistant. Extract ALL text from the document image. Preserve formatting and layout as much as possible.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please extract all text from this document:' },
              { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';

    if (extractedText.length > 50) {
      console.log(`✅ GPT-4o Vision extracted ${extractedText.length} chars`);
      return {
        text: extractedText,
        confidence: 0.8,
        language: 'eng',
        processingTimeMs: Date.now() - startTime,
        method: 'gpt-4o-vision',
      };
    }
  } catch (error) {
    console.error('GPT-4o Vision failed:', error);
  }

  // All methods failed
  return {
    text: '',
    confidence: 0,
    language: 'eng',
    processingTimeMs: Date.now() - startTime,
    method: 'none',
  };
}
```

### Expected Results
- ✅ Works on any document
- ✅ AI-powered text extraction
- ✅ ~$0.025 per document
- ✅ 3-5 second processing time
- ✅ Can handle very poor quality

---

## 🧪 Testing Plan

### Test Document Types

1. **Digital PDF with text** (75% of docs)
   - Tax returns
   - Modern medical records
   - Computer-generated forms
   - **Expected:** Tier 1 success (PDF.js/pdf-parse)

2. **Scanned PDF** (15% of docs)
   - Old medical records
   - Photocopied documents
   - Faxed documents
   - **Expected:** Tier 2 success (AWS Textract)

3. **Photo of document** (5% of docs)
   - Phone photos of forms
   - Documents on desktop
   - **Expected:** Tier 3 success (Google Vision)

4. **Poor quality/handwritten** (3% of docs)
   - Handwritten notes
   - Very old documents
   - Damaged documents
   - **Expected:** Tier 4 success (GPT-4o Vision)

5. **Complex layouts** (2% of docs)
   - Tables with data
   - Multi-column layouts
   - Forms with checkboxes
   - **Expected:** Tier 2 success (AWS Textract)

### Test Metrics to Track

```typescript
interface OCRTestResult {
  documentId: string;
  documentType: string;
  fileSize: number;

  // Tier 1: PDF.js
  tier1Attempted: boolean;
  tier1Success: boolean;
  tier1CharsExtracted: number;
  tier1TimeMs: number;
  tier1Cost: number; // Always $0

  // Tier 2: AWS Textract
  tier2Attempted: boolean;
  tier2Success: boolean;
  tier2CharsExtracted: number;
  tier2TimeMs: number;
  tier2Cost: number;
  tier2Confidence: number;

  // Tier 3: Google Vision
  tier3Attempted: boolean;
  tier3Success: boolean;
  tier3CharsExtracted: number;
  tier3TimeMs: number;
  tier3Cost: number;
  tier3Confidence: number;

  // Tier 4: GPT-4o Vision
  tier4Attempted: boolean;
  tier4Success: boolean;
  tier4CharsExtracted: number;
  tier4TimeMs: number;
  tier4Cost: number;

  // Final Result
  finalTierUsed: 1 | 2 | 3 | 4 | null;
  totalCost: number;
  totalTimeMs: number;
  success: boolean;
}
```

### Testing Script
```typescript
// scripts/test-ocr-tiers.ts

async function testAllOCRTiers(testDocumentPath: string) {
  const results: OCRTestResult = {
    documentId: 'test-doc',
    documentType: path.extname(testDocumentPath),
    fileSize: fs.statSync(testDocumentPath).size,
    // ... initialize all fields
  };

  const pdfBuffer = fs.readFileSync(testDocumentPath);

  // Test Tier 1
  console.log('\n🔹 Testing Tier 1: PDF.js/pdf-parse');
  const tier1Start = Date.now();
  try {
    const tier1Result = await extractTextWithPdfParse(pdfBuffer);
    results.tier1Attempted = true;
    results.tier1Success = tier1Result.text.length > 50;
    results.tier1CharsExtracted = tier1Result.text.length;
    results.tier1TimeMs = Date.now() - tier1Start;
    results.tier1Cost = 0;

    if (results.tier1Success) {
      console.log(`✅ Tier 1 SUCCESS: ${tier1Result.text.length} chars in ${results.tier1TimeMs}ms`);
      return results;
    }
  } catch (error) {
    console.log(`❌ Tier 1 FAILED: ${error.message}`);
  }

  // Test Tier 2
  console.log('\n🔹 Testing Tier 2: AWS Textract');
  const tier2Start = Date.now();
  try {
    const tier2Result = await extractTextWithTextract(pdfBuffer);
    results.tier2Attempted = true;
    results.tier2Success = tier2Result.text.length > 50;
    results.tier2CharsExtracted = tier2Result.text.length;
    results.tier2TimeMs = Date.now() - tier2Start;
    results.tier2Cost = 0.0015; // $1.50 per 1,000
    results.tier2Confidence = tier2Result.confidence;

    if (results.tier2Success) {
      console.log(`✅ Tier 2 SUCCESS: ${tier2Result.text.length} chars in ${results.tier2TimeMs}ms (${Math.round(tier2Result.confidence * 100)}% confidence)`);
      return results;
    }
  } catch (error) {
    console.log(`❌ Tier 2 FAILED: ${error.message}`);
  }

  // Test Tier 3
  console.log('\n🔹 Testing Tier 3: Google Vision');
  // ... similar pattern

  // Test Tier 4
  console.log('\n🔹 Testing Tier 4: GPT-4o Vision');
  // ... similar pattern

  return results;
}

// Run tests
const testDocuments = [
  './test-docs/digital-pdf.pdf',
  './test-docs/scanned-medical-record.pdf',
  './test-docs/phone-photo.pdf',
  './test-docs/handwritten.pdf',
  './test-docs/complex-table.pdf',
];

for (const doc of testDocuments) {
  const results = await testAllOCRTiers(doc);
  console.log('\n📊 Test Results:', JSON.stringify(results, null, 2));
}
```

---

## 📊 Expected Performance Matrix

| Document Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total Cost | Total Time |
|---------------|--------|--------|--------|--------|------------|------------|
| Digital PDF (75%) | ✅ 95% | - | - | - | $0 | ~100ms |
| Scanned PDF (15%) | ❌ | ✅ 95% | - | - | $0.0015 | ~2.5s |
| Photo (5%) | ❌ | ⚠️ 60% | ✅ 90% | - | $0.0024 | ~4s |
| Poor Quality (3%) | ❌ | ❌ | ⚠️ 70% | ✅ 95% | $0.0040 | ~7s |
| Handwritten (2%) | ❌ | ⚠️ 50% | ✅ 85% | ✅ 90% | $0.0032 | ~5s |

**Overall Success Rate:** 99.2%
**Average Cost per Document:** $0.00039 (~$0.39 per 1,000 docs)
**Average Processing Time:** ~0.7 seconds

---

## 🚀 Deployment Checklist

### Phase 1: PDF.js Fix (Week 1)
- [ ] Install pdf-parse
- [ ] Update extractTextFromPDF function
- [ ] Test with 20 sample documents
- [ ] Deploy to production
- [ ] Monitor success rates for 1 week

### Phase 2: AWS Textract (Week 2)
- [ ] Create AWS account / use existing
- [ ] Set up IAM user with Textract permissions
- [ ] Add AWS credentials to environment
- [ ] Implement aws-textract.ts helper
- [ ] Integrate into OCR pipeline
- [ ] Test with 10 scanned documents
- [ ] Deploy to production
- [ ] Monitor costs for 1 week

### Phase 3: Google Vision (Week 3)
- [ ] Create GCP account / use existing
- [ ] Enable Vision API
- [ ] Create service account
- [ ] Add Google credentials to environment
- [ ] Implement google-vision.ts helper
- [ ] Integrate into OCR pipeline
- [ ] Test with 10 photo documents
- [ ] Deploy to production
- [ ] Monitor costs for 1 week

### Phase 4: GPT-4o Vision (Week 4)
- [ ] Update pdf-to-image.ts with canvas rendering
- [ ] Add GPT-4o Vision to OCR pipeline
- [ ] Test with 10 difficult documents
- [ ] Deploy to production
- [ ] Monitor costs for 1 week

### Phase 5: Analytics & Monitoring
- [ ] Create OCR metrics dashboard
- [ ] Track success rates per tier
- [ ] Track costs per tier
- [ ] Track processing times
- [ ] Set up cost alerts (>$20/month)

---

## 📈 Success Metrics

### Technical Metrics
- **Overall Success Rate:** >99%
- **Tier 1 Success Rate:** >75%
- **Tier 2 Success Rate:** >95% (of remaining)
- **Average Processing Time:** <1 second
- **Error Rate:** <1%

### Business Metrics
- **Cost per Document:** <$0.001
- **Monthly Cost (500 customers):** <$8
- **Monthly Cost (1000 customers):** <$15
- **User Satisfaction:** >95% (successful extractions)

### Monitoring Alerts
- ⚠️ Warning: Cost >$10/month
- 🚨 Critical: Cost >$20/month
- ⚠️ Warning: Success rate <95%
- 🚨 Critical: Success rate <90%
- ⚠️ Warning: Avg processing time >3 seconds

---

## 🔧 Configuration

### Environment Variables

```env
# .env

# OCR Tier Configuration
OCR_ENABLE_TIER_1=true  # PDF.js/pdf-parse (always enabled)
OCR_ENABLE_TIER_2=true  # AWS Textract
OCR_ENABLE_TIER_3=true  # Google Vision
OCR_ENABLE_TIER_4=true  # GPT-4o Vision

# AWS Textract (Tier 2)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Google Cloud Vision (Tier 3)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_CREDENTIALS_BASE64=base64_encoded_service_account_json

# OpenAI (Tier 4)
OPENAI_API_KEY=your_openai_key

# OCR Thresholds
OCR_MIN_CHARS_THRESHOLD=50  # Minimum chars to consider success
OCR_TIER_1_TIMEOUT=5000     # 5 seconds
OCR_TIER_2_TIMEOUT=10000    # 10 seconds
OCR_TIER_3_TIMEOUT=10000    # 10 seconds
OCR_TIER_4_TIMEOUT=15000    # 15 seconds
```

---

## 💡 Future Enhancements

### Short-term (1-3 months)
1. **OCR caching** - Cache results by file hash (avoid re-processing)
2. **Batch processing** - Process multiple documents in parallel
3. **Quality pre-check** - Detect document quality before choosing tier
4. **Auto-rotate** - Detect and rotate upside-down documents

### Medium-term (3-6 months)
1. **Azure OCR** - Add as alternative to Google Vision
2. **Smart routing** - ML model to predict best tier for document
3. **Cost optimization** - Dynamic tier selection based on budget
4. **OCR confidence scoring** - Weighted confidence across tiers

### Long-term (6-12 months)
1. **Custom OCR model** - Train on RECA-specific documents
2. **Hybrid approach** - Combine multiple OCR results
3. **Real-time feedback** - Learn from user corrections
4. **Document preprocessing** - Enhance quality before OCR

---

## 📝 Summary

**This multi-tier OCR system provides:**

✅ **99%+ success rate** across all document types
✅ **<$10/month cost** for hundreds of customers
✅ **<1 second average** processing time
✅ **Graceful degradation** - always has a fallback
✅ **Cost-optimized** - uses cheapest method first
✅ **Production-ready** - handles edge cases

**Recommended Implementation Order:**
1. **Week 1:** Fix PDF.js (gets 75% success rate, zero cost)
2. **Week 2:** Add AWS Textract (gets to 95% success rate, ~$3/month)
3. **Week 3:** Add Google Vision (gets to 98% success rate, ~$4/month)
4. **Week 4:** Add GPT-4o Vision (gets to 99%+ success rate, ~$6/month)

**Total development time:** 4 weeks
**Total cost at scale (1000 customers):** ~$12/month
**Total success rate:** 99%+

---

**Status:** 📋 Ready for implementation
**Next Step:** Proceed with Phase 1 (Fix PDF.js)

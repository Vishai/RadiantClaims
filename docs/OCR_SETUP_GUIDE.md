# OCR Multi-Tier System Setup Guide

Complete guide to setting up and configuring the 4-tier OCR system for RadiantClaims.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Tier 1: PDF.js & pdf-parse (FREE)](#tier-1-pdfjs--pdf-parse-free)
- [Tier 2: AWS Textract Setup](#tier-2-aws-textract-setup)
- [Tier 3: Google Cloud Vision Setup](#tier-3-google-cloud-vision-setup)
- [Tier 4: OpenAI GPT-4o Vision Setup](#tier-4-openai-gpt-4o-vision-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Cost Monitoring](#cost-monitoring)

---

## Overview

The RadiantClaims OCR system uses a 4-tier fallback approach to extract text from documents with 99%+ success rate:

| Tier | Service | Success Rate | Cost | Speed | Use Case |
|------|---------|--------------|------|-------|----------|
| **1** | PDF.js + pdf-parse | 75% | FREE | ~100ms | Digital PDFs with embedded text |
| **2** | AWS Textract | 95% | $1.50/1K | ~2-3s | Scanned documents, forms |
| **3** | Google Vision | 92-98% | $1.50/1K | ~1-2s | Photos, handwriting, multi-language |
| **4** | GPT-4o Vision | ~95% | ~$0.025/doc | ~3-5s | Last resort, AI-powered |

**Estimated Monthly Cost:** $3-6 for 500 customers (7,500 docs/month)

---

## Quick Start

### 1. Install Dependencies

All dependencies are already installed via `package.json`:

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Minimum Configuration (Tier 1 + 4 only):**
```env
# Tier 1 is always enabled (no config needed)

# Tier 4: OpenAI API (fallback)
OPENAI_API_KEY=sk-...
```

**Full Configuration (All Tiers):**
```env
# OpenAI API
OPENAI_API_KEY=sk-...

# AWS Textract (Tier 2)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Google Cloud Vision (Tier 3)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
```

### 3. Test the System

```bash
# Test with a sample PDF
pnpm test:ocr ./path/to/test-document.pdf
```

---

## Tier 1: PDF.js & pdf-parse (FREE)

**Already configured!** This tier requires no setup and works out of the box.

### How It Works

1. First tries `pdf-parse` to extract embedded text
2. Falls back to `PDF.js` if pdf-parse fails
3. Works for ~75% of documents (digital PDFs)
4. Processing time: ~100ms
5. Cost: $0.00

### Testing Tier 1

```bash
# Test with a digital PDF
pnpm test:ocr ./test-docs/digital-document.pdf
```

---

## Tier 2: AWS Textract Setup

AWS Textract provides high-accuracy OCR for scanned documents and forms.

### Prerequisites

- AWS account (free tier available)
- Basic understanding of AWS IAM

### Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Complete the signup process

### Step 2: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. User name: `radiantclaims-ocr`
4. Select **Programmatic access**
5. Click **Next**

### Step 3: Attach Textract Permissions

1. Select **Attach policies directly**
2. Search for and select: `AmazonTextractFullAccess`
3. Click **Next** → **Create user**

### Step 4: Create Access Keys

1. Click on the newly created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **IMPORTANT:** Copy both:
   - Access key ID (starts with `AKIA...`)
   - Secret access key (long string, only shown once)

### Step 5: Configure Environment

Add to your `.env` file:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

### Step 6: Test Textract

```bash
# Test with a scanned document
pnpm test:ocr ./test-docs/scanned-document.pdf
```

You should see:
```
📄 PDF appears to be scanned, trying AWS Textract (Tier 2)...
✅ Textract extracted 1234 chars (95% confidence)
```

### Free Tier Limits

- **1,000 pages per month FREE** for first 3 months
- After that: $1.50 per 1,000 pages

---

## Tier 3: Google Cloud Vision Setup

Google Cloud Vision excels at photos, handwriting, and multi-language documents.

### Prerequisites

- Google Cloud account (free tier available)
- Credit card (required but free tier covers testing)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project**
3. Project name: `radiantclaims-ocr`
4. Click **Create**

### Step 2: Enable Vision API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Vision API"
3. Click **Cloud Vision API**
4. Click **Enable**

### Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `radiantclaims-ocr`
4. Role: Select **Cloud Vision API User**
5. Click **Done**

### Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. A JSON file will be downloaded (e.g., `radiantclaims-ocr-123456.json`)

### Step 5: Configure Environment

**Option A: Base64 Encoding (Recommended for Vercel/Production)**

```bash
# On macOS/Linux:
base64 -i radiantclaims-ocr-123456.json | tr -d '\n'

# On Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("radiantclaims-ocr-123456.json"))
```

Add to `.env`:

```env
GOOGLE_CLOUD_PROJECT_ID=radiantclaims-ocr
GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
```

**Option B: File Path (Development Only)**

```env
GOOGLE_CLOUD_PROJECT_ID=radiantclaims-ocr
GOOGLE_CLOUD_CREDENTIALS=/path/to/radiantclaims-ocr-123456.json
```

### Step 6: Test Google Vision

```bash
# Test with a photo or poor quality scan
pnpm test:ocr ./test-docs/photo-document.pdf
```

You should see:
```
📄 Trying Google Cloud Vision (Tier 3)...
✅ Google Vision extracted 1234 chars (92% confidence)
```

### Free Tier Limits

- **1,000 requests per month FREE**
- After that: $1.50 per 1,000 images

---

## Tier 4: OpenAI GPT-4o Vision Setup

GPT-4o Vision is the last resort fallback, using AI to extract text from difficult documents.

### Prerequisites

- OpenAI account
- API access with GPT-4o Vision enabled

### Step 1: Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click **Create new secret key**
4. Name: `RadiantClaims OCR`
5. Copy the key (starts with `sk-...`)

### Step 2: Add Credits

1. Go to [Billing](https://platform.openai.com/account/billing)
2. Add payment method
3. Add credits (minimum $5 recommended)

### Step 3: Configure Environment

Add to `.env`:

```env
OPENAI_API_KEY=sk-...
```

### Step 4: Test GPT-4o Vision

To force testing of Tier 4, temporarily disable other tiers:

```env
OCR_ENABLE_TIER_1=false
OCR_ENABLE_TIER_2=false
OCR_ENABLE_TIER_3=false
OCR_ENABLE_TIER_4=true
```

```bash
pnpm test:ocr ./test-docs/difficult-document.pdf
```

You should see:
```
📄 All OCR methods failed, using GPT-4o Vision as last resort (Tier 4)...
📄 Converting PDF to PNG...
✅ PDF converted to PNG
🔍 Calling GPT-4o Vision for text extraction...
✅ GPT-4o Vision extracted 1234 chars
```

**Remember to re-enable all tiers after testing!**

---

## Configuration

### Environment Variables

All OCR configuration is managed through environment variables in `.env`:

```env
# Tier Enable Flags (default: true)
OCR_ENABLE_TIER_1=true
OCR_ENABLE_TIER_2=true
OCR_ENABLE_TIER_3=true
OCR_ENABLE_TIER_4=true

# Minimum characters threshold
OCR_MIN_CHARS_THRESHOLD=50
```

### Disabling Tiers

To disable a tier (e.g., for cost control or testing):

```env
# Disable AWS Textract
OCR_ENABLE_TIER_2=false
```

### Custom Thresholds

Adjust the minimum character count to consider extraction successful:

```env
# Default is 50 characters
OCR_MIN_CHARS_THRESHOLD=100
```

---

## Testing

### Test Single Document

```bash
pnpm test:ocr ./path/to/document.pdf
```

### Test Multiple Documents

```bash
pnpm test:ocr ./test-docs/*.pdf
```

### Test Output

The script generates:
- **Console output:** Real-time progress
- **JSON report:** `test-results/ocr-test-[timestamp].json`
- **Markdown summary:** `test-results/ocr-summary-[timestamp].md`

### Example Output

```
🧪 Testing OCR Tiers for: sample.pdf
================================================================================

📄 Attempting Tier 1A: pdf-parse extraction...
✓ Extracted 1234 characters using pdf-parse

📊 Final Result:
────────────────────────────────────────────────────────────────────────────────
✅ Success: YES
🎯 Tier Used: 1 (pdf-parse)
📝 Characters Extracted: 1234
⏱️  Processing Time: 95ms
💰 Cost: $0.0000
🎲 Confidence: 95.0%

📄 Text Preview (first 200 chars):
────────────────────────────────────────────────────────────────────────────────
PATHOLOGY REPORT
Patient Name: John Doe
Date of Service: 01/15/2024
...
```

---

## Troubleshooting

### Tier 1 Issues

**Problem:** "pdf-parse extraction failed"

**Solutions:**
1. Check if file is a valid PDF
2. Try with a different PDF
3. Check console for specific error messages

---

### Tier 2 Issues

**Problem:** "AWS Textract failed: UnrecognizedClientException"

**Solutions:**
1. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
2. Check if IAM user has `AmazonTextractFullAccess` permissions
3. Verify region is set correctly (`AWS_REGION=us-east-1`)

**Problem:** "AccessDeniedException"

**Solutions:**
1. Go to IAM Console
2. Click on your user → Permissions
3. Attach `AmazonTextractFullAccess` policy

---

### Tier 3 Issues

**Problem:** "Google Vision failed: Could not load the default credentials"

**Solutions:**
1. Verify `GOOGLE_CLOUD_PROJECT_ID` matches your GCP project
2. Check base64 encoding:
   ```bash
   echo $GOOGLE_CLOUD_CREDENTIALS_BASE64 | base64 -d
   ```
3. Ensure Vision API is enabled in GCP Console

**Problem:** "API has not been used in project"

**Solutions:**
1. Go to [GCP API Library](https://console.cloud.google.com/apis/library)
2. Search "Vision API"
3. Click **Enable**

---

### Tier 4 Issues

**Problem:** "Invalid API key"

**Solutions:**
1. Verify `OPENAI_API_KEY` starts with `sk-`
2. Check if key is active in [OpenAI Dashboard](https://platform.openai.com/api-keys)
3. Ensure you have credits in your OpenAI account

**Problem:** "Rate limit exceeded"

**Solutions:**
1. Wait a few minutes and retry
2. Check usage in [OpenAI Usage Dashboard](https://platform.openai.com/usage)
3. Consider upgrading to higher tier

---

### General Issues

**Problem:** "All OCR tiers failed"

**Solutions:**
1. Check if at least one tier is properly configured
2. Test each tier individually by disabling others
3. Verify document is not corrupted
4. Try a different document format

**Problem:** "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Cost Monitoring

### Viewing Configuration

Your app logs the OCR configuration on startup:

```
🔧 OCR Multi-Tier Configuration:
────────────────────────────────────────────────────────────────────────────────
  Tier 1 (PDF.js/pdf-parse): ✅ Enabled
  Tier 2 (AWS Textract): ✅ Enabled
  Tier 3 (Google Vision): ⚠️  Disabled (no credentials)
  Tier 4 (GPT-4o Vision): ✅ Enabled
  Min chars threshold: 50
────────────────────────────────────────────────────────────────────────────────
```

### Estimated Monthly Costs

Based on 500 customers × 15 documents = 7,500 docs/month:

| Tier Usage | Monthly Cost |
|------------|--------------|
| 75% Tier 1 (5,625 docs) | $0.00 |
| 20% Tier 2 (1,500 docs) | $2.25 |
| 3% Tier 3 (225 docs) | $0.34 |
| 2% Tier 4 (150 docs) | $3.75 |
| **Total** | **~$6.34/month** |

### Setting Cost Alerts

**AWS Textract:**
1. Go to [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
2. Create budget: $5/month for Textract
3. Set alert at 80% ($4)

**Google Cloud:**
1. Go to [GCP Budgets & Alerts](https://console.cloud.google.com/billing/budgets)
2. Create budget: $2/month for Vision API
3. Set alert at 80% ($1.60)

**OpenAI:**
1. Go to [Usage Limits](https://platform.openai.com/account/limits)
2. Set monthly budget cap
3. Configure email notifications

---

## Best Practices

### 1. Start with Minimum Configuration

Begin with just Tier 1 (free) + Tier 4 (OpenAI):
- Tier 1 handles 75% of documents (free)
- Tier 4 catches the remaining 25% (~$6/month)
- Total: ~$6/month for 7,500 documents

### 2. Add Tiers Based on Volume

Once you exceed 1,000 documents/month:
- Add Tier 2 (AWS Textract) for scanned documents
- This reduces Tier 4 usage and saves money

### 3. Monitor Usage Weekly

Check your costs weekly:
- AWS CloudWatch
- GCP Billing Dashboard
- OpenAI Usage Dashboard

### 4. Test Before Production

Always test with sample documents before deploying:
```bash
pnpm test:ocr ./test-docs/sample-{digital,scanned,photo}.pdf
```

### 5. Set Up Alerts

Configure cost alerts at 80% of budget to prevent surprises.

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test with sample documents
3. ✅ Deploy to production
4. ✅ Monitor costs for first week
5. ✅ Adjust tier configuration based on usage patterns

For more information, see:
- [OCR Strategy Master Plan](./ai-validation-refactor/OCR_STRATEGY_MASTER_PLAN.md)
- [Implementation Prompts](./ai-validation-refactor/IMPLEMENTATION_PROMPTS.md)

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or create an issue on GitHub.

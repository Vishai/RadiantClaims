# Storage Migration: Vercel Blob → Cloudflare R2

## Executive Summary

**Current State:** Document uploads use Vercel Blob Storage
**Desired State:** Migrate to Cloudflare R2 (already set up and configured)
**Estimated Effort:** 30-60 minutes
**Cost Savings:** ~$50-100/month at moderate scale (~$600-1,200/year)

---

## Why Migrate?

### Cost Comparison (1,000 documents/month, 5MB each, 10,000 downloads)

| Service | Storage Cost | Egress Cost | Total/Month | Annual |
|---------|--------------|-------------|-------------|--------|
| **Vercel Blob** | $0.75 | **$50.00** | **$50.75** | **$609** |
| **Cloudflare R2** | $0.08 | **$0.00** ✨ | **$0.08** | **$1** |
| **Savings** | - | - | **$50.67** | **$608** |

### Key Benefits

1. **Zero Egress Fees** 🎉
   - Users can download RECA forms, PDFs unlimited times
   - No surprise bills as traffic grows
   - Perfect for document-heavy applications

2. **10x Cheaper Storage**
   - $0.015/GB vs $0.15/GB
   - Scales better as document volume grows

3. **Already Configured**
   - R2 infrastructure exists in codebase (`src/lib/r2.ts`)
   - Just needs to be wired up to document upload endpoints
   - Environment variables already documented

4. **Better for Production**
   - S3-compatible API (portable)
   - Advanced features (lifecycle policies, versioning)
   - Larger file size support (up to 5TB)

---

## Current Implementation Status

### ✅ What's Already Done

1. **R2 Client Setup** (`src/lib/r2.ts`)
   ```typescript
   - S3Client configured
   - getPresignedPutUrl() implemented
   - generateFileKey() helper
   - getObject() download function
   ```

2. **Environment Variables** (Ready in `.env`)
   ```bash
   R2_ACCESS_KEY_ID=<configured>
   R2_SECRET_ACCESS_KEY=<configured>
   R2_ENDPOINT=<configured>
   R2_BUCKET=<configured>
   ```

3. **Database Schema**
   - `UploadedFile.fileKey` stores URL/key (agnostic to storage provider)
   - No schema changes needed

### ❌ What Needs Migration

1. **Document Upload API** (`src/app/api/documents/upload/route.ts`)
   - Currently: Uses `@vercel/blob` → `put()`
   - Needs: Use `src/lib/r2.ts` → `putObject()`

2. **Document Download/Processing** (`src/app/api/documents/process/[fileId]/route.ts`)
   - Currently: Uses `getObject()` which works for both
   - May need: Update to handle R2 URLs properly

3. **Document Delete** (`src/app/api/documents/[id]/route.ts`)
   - Currently: Uses `@vercel/blob` → `del()`
   - Needs: Use AWS SDK → `DeleteObjectCommand`

---

## Migration Plan

### Phase 1: Update Upload Endpoint (15 min)

**File:** `src/app/api/documents/upload/route.ts`

**Changes:**
```typescript
// BEFORE
import { put } from "@vercel/blob";
const blob = await put(fileKey, file, { access: "public" });

// AFTER
import { uploadToR2 } from "@/lib/r2";
const r2Url = await uploadToR2(fileKey, file);
```

**New function needed in `src/lib/r2.ts`:**
```typescript
export async function uploadToR2(
  key: string,
  file: File | Buffer
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type || 'application/octet-stream',
  });
  await client.send(command);
  return `${env.R2_PUBLIC_URL}/${key}`;
}
```

### Phase 2: Update Delete Endpoint (10 min)

**File:** `src/app/api/documents/[id]/route.ts`

**Changes:**
```typescript
// BEFORE
import { del } from "@vercel/blob";
await del(fileKey);

// AFTER
import { deleteFromR2 } from "@/lib/r2";
await deleteFromR2(fileKey);
```

**New function needed in `src/lib/r2.ts`:**
```typescript
export async function deleteFromR2(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });
  await client.send(command);
}
```

### Phase 3: Update Environment Config (5 min)

**File:** `src/env.mjs`

Ensure R2 variables are validated:
```typescript
server: {
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET: z.string().min(1),
},
```

### Phase 4: Testing (30 min)

1. Upload a test document → Verify it goes to R2
2. Download the document → Verify URL works
3. Delete the document → Verify it's removed from R2
4. Run Document Intelligence → Verify OCR/AI still works
5. Test with large file (5MB+) → Verify no issues

### Phase 5: Deploy & Monitor (Ongoing)

1. Update Railway environment variables (if different from local)
2. Deploy to production
3. Monitor R2 dashboard for usage/costs
4. Set up CloudWatch/alerts for errors

---

## Rollback Plan

If migration fails, rollback is simple:

1. **Keep `@vercel/blob` package** installed during migration
2. **Use feature flag** to switch between storages:
   ```typescript
   const USE_R2 = process.env.USE_R2 === 'true';
   if (USE_R2) {
     await uploadToR2(...);
   } else {
     await put(...); // Vercel Blob
   }
   ```
3. **Revert code** or set `USE_R2=false` in environment

---

## Dependencies

### Install AWS SDK (if not already installed)
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Remove Vercel Blob (after migration confirmed working)
```bash
pnpm remove @vercel/blob
```

---

## Cost Projections

### Year 1 (Low Traffic: 1K docs/month)
- **Vercel Blob:** $609/year
- **R2:** $1/year
- **Savings:** $608/year ✅

### Year 2 (Growth: 5K docs/month)
- **Vercel Blob:** $3,045/year
- **R2:** $5/year
- **Savings:** $3,040/year ✅

### Year 3 (Scale: 20K docs/month)
- **Vercel Blob:** $12,180/year
- **R2:** $20/year
- **Savings:** $12,160/year ✅

**ROI:** Migration pays for itself in first month!

---

## Security Considerations

### Vercel Blob
- ✅ Automatic public URLs
- ✅ HTTPS by default
- ❌ No fine-grained access control
- ❌ No bucket policies

### R2
- ✅ S3-compatible IAM policies
- ✅ Presigned URLs for temporary access
- ✅ Bucket-level encryption
- ✅ CORS configuration
- ⚠️ Requires proper access key management

**Recommendation:** Use presigned URLs for sensitive documents (medical records, identity docs).

---

## Questions to Answer Before Migration

1. ✅ **Do we have R2 credentials?** → YES (already configured in `.env`)
2. ✅ **Is R2 bucket created?** → YES (appears to be set up)
3. ⚠️ **Any existing Vercel Blob files to migrate?** → CHECK: Query database for existing files
4. ⚠️ **CORS configured on R2?** → VERIFY: May need for browser uploads
5. ⚠️ **Public vs Private files?** → DECIDE: Do we need access control?

---

## CONTINUATION PROMPT

When you're ready to migrate, use this prompt:

```
I'm ready to migrate from Vercel Blob to Cloudflare R2 for document storage.

Context:
- R2 is already configured with credentials in .env
- R2 client code exists in src/lib/r2.ts
- Need to update 3 API endpoints: upload, download, delete
- See full plan in: docs/STORAGE_MIGRATION_R2.md

Please:
1. Check if we have any existing files in Vercel Blob (query database)
2. Implement uploadToR2() and deleteFromR2() in src/lib/r2.ts
3. Update src/app/api/documents/upload/route.ts to use R2
4. Update src/app/api/documents/[id]/route.ts to use R2
5. Add feature flag for gradual rollout (USE_R2=true/false)
6. Test with a sample upload
7. Document any R2 bucket configuration needed (CORS, public access)

Let's migrate with zero downtime!
```

---

## Files to Modify

| File | Changes | Estimated Time |
|------|---------|----------------|
| `src/lib/r2.ts` | Add `uploadToR2()` and `deleteFromR2()` | 10 min |
| `src/app/api/documents/upload/route.ts` | Replace Vercel Blob upload | 10 min |
| `src/app/api/documents/[id]/route.ts` | Replace Vercel Blob delete | 10 min |
| `src/env.mjs` | Validate R2 env vars | 5 min |
| `package.json` | Remove `@vercel/blob` | 2 min |
| **Total** | | **~37 minutes** |

---

## Success Metrics

Post-migration, verify:
- ✅ Documents upload successfully to R2
- ✅ Document Intelligence (OCR/AI) still works
- ✅ Downloads work from R2 URLs
- ✅ Deletes remove files from R2
- ✅ No increase in error rate
- ✅ R2 dashboard shows usage
- ✅ Cost reduced (check after 1 week)

---

## Additional Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Vercel Blob Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)

---

**Last Updated:** October 31, 2024
**Status:** 🟡 Planned - Ready to execute
**Priority:** High - Cost optimization opportunity
**Risk:** Low - Easy rollback, R2 already configured

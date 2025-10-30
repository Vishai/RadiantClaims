# RadiantClaims Operations & Maintenance Guide

**Last Updated**: January 2025
**Audience**: Developers, Operations Team, System Administrators

---

## 📋 Table of Contents

1. [Configuration Management](#configuration-management)
2. [Partner Attorney Updates](#partner-attorney-updates)
3. [Environment Variables](#environment-variables)
4. [Database Maintenance](#database-maintenance)
5. [Deployment Procedures](#deployment-procedures)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Configuration Management

### Overview

RadiantClaims uses configuration files to manage operational settings that may change over the application's lifecycle. These configurations are separate from code logic to allow updates without code changes.

### Configuration File Locations

| Configuration Type | File Path | Purpose |
|-------------------|-----------|---------|
| Partner Attorney Info | `src/lib/reca/attorney-info.ts` | RECA claim attorney details |
| Environment Variables | `.env` | API keys, database URLs, secrets |
| Feature Flags | (To be implemented) | Toggle features on/off |
| Email Templates | `src/emails/*.tsx` | Email content and styling |
| Document Checklists | `src/lib/document-checklist.ts` | Required documents by claim type |

---

## Partner Attorney Updates

### When to Update

Update partner attorney information when:
- Switching to a new partner law firm
- Partner attorney contact information changes
- Law firm address or phone number changes
- Adding/updating attorney email or fax

### How to Update

**File**: `src/lib/reca/attorney-info.ts`

#### Step 1: Update Attorney Information

```typescript
export const DEFAULT_ATTORNEY_INFO = {
  hasAttorney: "YES" as const,

  // UPDATE THESE FIELDS
  attorneyFirstName: "Jane",                    // ← Attorney's first name
  attorneyLastName: "Smith",                    // ← Attorney's last name
  attorneyFirm: "Smith & Partners PLLC",        // ← Law firm name
  attorneyAddress: "456 Legal Drive, Suite 200",// ← Street address
  attorneyCity: "Salt Lake City",               // ← City
  attorneyState: "UT",                          // ← State (2-letter code)
  attorneyZip: "84101",                         // ← 5-digit ZIP code
  attorneyPhone: "801-555-0123",                // ← Phone number
  attorneyFax: "801-555-0124",                  // ← Fax (optional, can be empty string)
  attorneyEmail: "jane.smith@smithlaw.com",     // ← Email (optional, can be empty string)
};
```

#### Step 2: Verify Attorney Fee Type (Usually No Change Needed)

```typescript
export const DEFAULT_ATTORNEY_FEE_TYPE = "initial_2_percent" as const;
```

**Note**: This should remain `"initial_2_percent"` for standard RECA claims (2% attorney fee limit).

#### Step 3: Field Editability (Usually Leave as False)

```typescript
export const ATTORNEY_INFO_EDITABLE = false;
```

Set to `true` only if you want users to be able to modify attorney information (not recommended).

#### Step 4: Test Changes Locally

```bash
# Start dev server
pnpm dev

# Navigate to a RECA claim form
# Go to Part 13 (Attorney Representation)
# Verify all fields show updated information
```

#### Step 5: Commit and Deploy

```bash
git add src/lib/reca/attorney-info.ts
git commit -m "chore: update partner attorney information"
git push origin main
```

### Validation Checklist

Before deploying attorney information updates:

- [ ] All required fields are filled (first name, last name, address, city, state, zip, phone)
- [ ] State is 2-letter code (e.g., "UT" not "Utah")
- [ ] ZIP code is 5 digits
- [ ] Phone number is formatted consistently
- [ ] Email address is valid (if provided)
- [ ] Tested locally in RECA form Part 13
- [ ] Verified in Part 14 (Attorney Acknowledgment) as well
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Code formatted: `pnpm format`

---

## Environment Variables

### Critical Variables

These environment variables must be set in production:

#### Database
```bash
DATABASE_URL="postgresql://user:password@host:5432/radiantclaims"
```

#### Authentication
```bash
NEXTAUTH_SECRET="<random-32-char-string>"
NEXTAUTH_URL="https://yourdomain.com"
```

#### File Storage (Cloudflare R2 / S3)
```bash
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="radiantclaims-documents"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

#### Email (Resend)
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"
```

### How to Update Environment Variables

#### Local Development
1. Edit `.env` file
2. Restart dev server: `pnpm dev`

#### Production (Vercel/Railway/etc)
1. Update via platform dashboard
2. Redeploy application or restart services

### Environment Variable Security

**DO NOT**:
- ❌ Commit `.env` files to git
- ❌ Share environment variables in Slack/email
- ❌ Use production credentials in development

**DO**:
- ✅ Use a password manager to share secrets securely
- ✅ Rotate secrets periodically (every 90 days)
- ✅ Use different credentials for dev/staging/prod
- ✅ Document required variables in `.env.example`

---

## Database Maintenance

### Running Migrations

When schema changes are made:

```bash
# Generate Prisma client (after schema.prisma changes)
pnpm db:generate

# Create and apply migration
pnpm db:migrate "migration name"

# Push schema changes (for development only)
pnpm db:push
```

### Seeding Data

```bash
# Run seed script
pnpm db:seed
```

### Backup Procedures

**Recommended Schedule**: Daily automated backups

#### Manual Backup (PostgreSQL)
```bash
pg_dump -h host -U user -d radiantclaims > backup-$(date +%Y%m%d).sql
```

#### Restore from Backup
```bash
psql -h host -U user -d radiantclaims < backup-20250127.sql
```

### Database Health Checks

Monitor these metrics:
- Database size and growth rate
- Connection pool usage
- Slow query logs
- Index usage and missing indexes

---

## Deployment Procedures

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass: `pnpm test` (if tests exist)
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Code is formatted: `pnpm format`
- [ ] No ESLint errors: `pnpm lint`
- [ ] Database migrations are ready
- [ ] Environment variables are set in production
- [ ] Attorney information is up to date (if changed)
- [ ] Code reviewed and approved

### Deployment Steps

#### 1. Merge to Main Branch
```bash
git checkout main
git pull origin main
git merge feature-branch
git push origin main
```

#### 2. Run Migrations (If Needed)
```bash
# On production server or via deployment pipeline
pnpm db:migrate
```

#### 3. Deploy Application
- **Vercel**: Automatic on push to main
- **Railway**: Automatic on push to main
- **Custom**: Run build and restart process

```bash
pnpm build
pnpm start
```

#### 4. Post-Deployment Verification
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] File uploads work (R2/S3)
- [ ] Email sending works (Resend)
- [ ] RECA form loads and submits
- [ ] Admin dashboard accessible

### Rollback Procedure

If deployment fails:

1. **Revert to previous version**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Revert database migration** (if needed)
   ```bash
   pnpm db:migrate rollback
   ```

3. **Verify rollback successful**

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Application Health**
   - Uptime/downtime
   - Response times (API routes)
   - Error rates

2. **Database**
   - Connection pool usage
   - Query performance
   - Disk space

3. **User Activity**
   - New claim submissions
   - Document uploads
   - Failed form submissions

4. **Business Metrics**
   - RECA claims started
   - RECA claims completed
   - Average time to complete claim

### Recommended Tools

- **Application Monitoring**: Sentry, Vercel Analytics
- **Database Monitoring**: Railway Dashboard, DataDog
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: LogFlare, Papertrail

### Alert Thresholds

Set up alerts for:
- Error rate > 5% (15-minute window)
- Response time > 2000ms (p95)
- Database connections > 80% of pool
- Disk space < 20% remaining
- Email send failures > 10/hour

---

## Common Tasks

### 1. Adding a New Attorney to the System

See [Partner Attorney Updates](#partner-attorney-updates) section above.

### 2. Updating Email Templates

**Files**: `src/emails/*.tsx`

1. Edit the React Email component
2. Test locally: `pnpm dev` and navigate to `/api/test-email`
3. Deploy changes

### 3. Modifying Document Requirements

**File**: `src/lib/document-checklist.ts`

Update the document requirements for different claim types:

```typescript
export const DOCUMENT_REQUIREMENTS = {
  DOWNWINDER: [
    {
      id: "birth_certificate",
      name: "Birth Certificate",
      required: true,
      description: "Certified copy of claimant's birth certificate"
    },
    // Add or modify documents here
  ]
};
```

### 4. Adding a New Form Field

1. Update Prisma schema (`prisma/schema.prisma`)
2. Run migration: `pnpm db:migrate "add new field"`
3. Update TypeScript types (usually auto-generated by Prisma)
4. Update form component
5. Test thoroughly

### 5. Rotating API Keys/Secrets

1. Generate new API key from service provider (Resend, R2, etc.)
2. Update environment variables in production
3. Test that new key works
4. Revoke old API key
5. Document the rotation in this guide (update "Last Rotated" date)

### 6. Exporting RECA Claims Data

```typescript
// Example: Export claims to CSV
// File: scripts/export-claims.ts

import { prisma } from '@/lib/db';
import { createObjectCsvWriter } from 'csv-writer';

async function exportClaims() {
  const sessions = await prisma.intakeSession.findMany({
    where: { claimType: 'DOWNWINDER' },
    include: { claimant: true }
  });

  // Process and write to CSV
  // ...
}
```

---

## Troubleshooting

### Common Issues

#### Issue: RECA Form Not Saving

**Symptoms**: User completes form, but data not saved to database

**Troubleshooting Steps**:
1. Check browser console for JavaScript errors
2. Check API route logs: `/api/reca/workflow/[sessionId]`
3. Verify database connection: Check `DATABASE_URL` environment variable
4. Check Prisma client is generated: `pnpm db:generate`

**Solution**: Usually fixed by regenerating Prisma client or checking API route permissions

#### Issue: Attorney Information Not Showing

**Symptoms**: Part 13 shows placeholder text like "[Partner Attorney First Name]"

**Cause**: `attorney-info.ts` not updated with real attorney information

**Solution**: Update `src/lib/reca/attorney-info.ts` with actual attorney details (see [Partner Attorney Updates](#partner-attorney-updates))

#### Issue: Document Upload Failing

**Symptoms**: File upload errors, 500 server error

**Troubleshooting Steps**:
1. Check R2/S3 credentials are set correctly
2. Verify bucket name is correct: `R2_BUCKET_NAME`
3. Check file size limits (default 10MB)
4. Test R2 connection independently

**Solution**: Verify all R2 environment variables and bucket permissions

#### Issue: Email Not Sending

**Symptoms**: No confirmation emails received

**Troubleshooting Steps**:
1. Check `RESEND_API_KEY` is set
2. Check `FROM_EMAIL` domain is verified in Resend
3. Check email service quota/limits
4. Review Resend dashboard for failed sends

**Solution**: Verify Resend API key and domain verification

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check application uptime
- [ ] Review database backup success

### Weekly
- [ ] Review RECA claim completion rates
- [ ] Check storage usage (R2 bucket size)
- [ ] Review slow query logs

### Monthly
- [ ] Review and update attorney information (if needed)
- [ ] Check dependency updates: `pnpm outdated`
- [ ] Review security advisories
- [ ] Test email templates
- [ ] Review document upload quotas

### Quarterly
- [ ] Rotate API keys and secrets
- [ ] Review and optimize database indexes
- [ ] Audit user permissions
- [ ] Update documentation
- [ ] Review and update this operations guide

### Annually
- [ ] Security audit
- [ ] Review and renew SSL certificates (if self-managed)
- [ ] Review compliance requirements (RECA regulations)
- [ ] Update partner agreements (attorney contracts)

---

## Change Log

Document significant operational changes here:

### 2025-01-27
- Created Operations & Maintenance Guide
- Documented partner attorney update procedures
- Established maintenance schedule

### [Future Date]
- Updated attorney information for [reason]
- Rotated API keys
- etc.

---

## Contact & Support

### Internal Team
- **Development Lead**: [Name] - [Email]
- **Operations**: [Name] - [Email]
- **Legal/Compliance**: [Name] - [Email]

### External Partners
- **Partner Law Firm**: [Firm Name] - [Contact]
- **Hosting Provider**: [Provider] - [Support URL]
- **Email Service**: Resend - support@resend.com

### Emergency Contacts
- **After-hours Tech Support**: [Phone/Pager]
- **Database Emergency**: [Contact]

---

## Additional Resources

- [RECA Implementation Status](./RECA_IMPLEMENTATION_STATUS.md) - Development progress tracker
- [API Specifications](./parsed_form_data/API_SPECIFICATIONS.md) - API endpoint documentation
- [Attorney Info README](../src/lib/reca/ATTORNEY_INFO_README.md) - Detailed attorney configuration guide
- [Main README](../README.md) - Project setup and getting started

---

**Document Maintainer**: Development Team
**Last Reviewed**: January 2025
**Next Review Due**: April 2025

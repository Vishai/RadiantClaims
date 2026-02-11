# Waitlist Quick Start Guide

## Overview

Your RadiantClaims application now has a **waitlist/lead collection system** that automatically captures interested users when registration is closed.

## Current Status

🔒 **Registration: BLOCKED** (`.env` has `REGISTRATION_ENABLED=false`)
📧 **Waitlist: ACTIVE** - Collecting leads automatically

## What Happens Now

When someone tries to register:

1. They fill out the registration form
2. Form submits → gets 503 error (registration disabled)
3. **Waitlist form automatically appears** with their email pre-filled
4. They click "Join Waitlist" → lead is saved to database
5. They see confirmation: "We'll notify you when registration opens"

## Viewing Your Leads

### Admin Dashboard

**URL:** `http://localhost:3000/admin/waitlist` (or your production domain)

**Requirements:** Must be logged in as ADMIN user

**Features:**
- View all waitlist entries in a table
- See counts: Pending, Contacted, Converted, Declined
- Filter by status
- Export to CSV for email campaigns
- Update lead status with dropdown

### API Access

**Get all leads (requires admin auth):**
```bash
GET /api/admin/waitlist
GET /api/admin/waitlist?status=PENDING
```

**Update lead status:**
```bash
PATCH /api/admin/waitlist
{
  "id": "lead_id",
  "status": "CONTACTED"
}
```

## Lead Status Workflow

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **PENDING** | New lead, not contacted yet | Default for all new submissions |
| **CONTACTED** | You've reached out via email/phone | After sending notification |
| **CONVERTED** | They created an account | After they successfully register |
| **DECLINED** | They declined when contacted | If they opt out |
| **INVALID** | Spam or invalid email | For cleaning up bad data |

## When You're Ready to Launch

### Step-by-Step Launch Process

**1. Review Your Waitlist (1-2 days before)**
```bash
# Export all pending leads
Go to /admin/waitlist → Click "Export CSV"
```

**2. Prepare Welcome Email**

Sample email template:
```
Subject: RadiantClaims Registration is Now Open! 🎉

Hi [Name],

Thank you for your interest in RadiantClaims!

We're excited to announce that registration is now open. As a
waitlist member, you're among the first to know.

Create your account now: https://radiantclaims.com/register

[Briefly describe what's new/ready: terms of service, workflows, etc.]

Best regards,
The RadiantClaims Team
```

**3. Enable Registration**
```bash
# In your .env file (local)
REGISTRATION_ENABLED=true

# Or in production (Vercel/Railway)
# Add environment variable: REGISTRATION_ENABLED=true
# Then redeploy
```

**4. Send Notifications**
- Use your email provider (Resend, Mailchimp, etc.)
- Send to all `PENDING` leads
- Include clear call-to-action link to `/register`

**5. Track Conversions**
- As leads sign up, match their emails
- Update status to `CONVERTED` in admin panel
- Monitor conversion rate

## Data Collected Per Lead

Each waitlist entry includes:

**Contact Info:**
- ✅ Email (required, unique)
- ✅ Name (optional)
- ✅ Claim Type (optional - e.g., DOWNWINDER)

**Tracking Data:**
- Source page (register_page, reca_signup, etc.)
- Submission count (how many times they tried)
- Last IP address
- UTM parameters (marketing attribution)
- Created/updated timestamps

**Status Tracking:**
- Current status
- Notification sent status
- Contacted date and by whom
- Converted date and user ID

## Tips & Best Practices

### 1. Regular Monitoring
- Check `/admin/waitlist` daily
- Watch for high submission counts (indicates strong interest)
- Look for patterns in claim types

### 2. Duplicate Submissions = High Interest
If someone submits multiple times, they're **very interested**. Consider:
- Prioritizing them in your outreach
- Offering early access
- Following up personally

### 3. Marketing Attribution
The system captures UTM parameters. Use this to track:
- Which marketing channels drive most interest
- ROI of different campaigns
- Best referral sources

### 4. Clean Your List
Before launch:
- Mark obvious spam as `INVALID`
- Remove duplicate/test entries
- Verify email format

### 5. Segment Your Launch
Consider phased rollout:
1. First notify high-interest leads (submission count > 1)
2. Wait 24 hours, measure conversion
3. Then notify remaining PENDING leads

## Automation Ideas (Future Enhancement)

Consider adding:
- **Auto-confirmation email** when someone joins waitlist
- **Weekly digest** of new leads to admin
- **Auto-notification** when registration opens
- **Welcome sequence** for converted leads
- **Drip campaign** to keep leads warm

## Technical Details

**Database Table:** `RegistrationWaitlist`
**API Endpoint:** `/api/waitlist`
**Admin Panel:** `/admin/waitlist`
**Environment Variable:** `REGISTRATION_ENABLED`

**Files:**
- API: `src/app/api/waitlist/route.ts`
- Admin API: `src/app/api/admin/waitlist/route.ts`
- Admin UI: `src/app/admin/waitlist/page.tsx`
- Schema: `prisma/schema.prisma` (lines 1518-1572)

## Support

For questions or issues:
1. Check `REGISTRATION_CONTROL.md` for detailed documentation
2. Review API responses for error messages
3. Check server logs for debugging

## Quick Commands

```bash
# View database directly
npx prisma studio

# Export leads via API (with curl + jq)
curl -H "Cookie: your-admin-session-cookie" \
  http://localhost:3000/api/admin/waitlist | jq '.entries'

# Count leads by status
npx prisma studio
# Then: SELECT status, COUNT(*) FROM RegistrationWaitlist GROUP BY status
```

---

**Remember:** Registration is currently **BLOCKED**. Every visitor who tries to register will automatically be offered the waitlist. This turns your "closed for registration" period into a **lead generation opportunity**! 🚀

# Email Notification Test Scripts

This directory contains test scripts for the RadiantClaims email notification system.

## 🎯 Overview

All test emails are configured to send to **brandon@radiantclaims.com** for safe testing.

## 📧 Available Test Scripts

### 1. Attorney New Client Notification
**File:** `test-attorney-new-client-email.ts`

Tests the immediate notification sent to attorneys when a new client signs up.

```bash
npx tsx scripts/test-attorney-new-client-email.ts
```

**What it tests:**
- New client assignment email
- Claimant information display
- Claim progress tracking
- Attorney dashboard links

---

### 2. Attorney Activity Summary
**File:** `test-attorney-activity-summary-email.ts`

Tests the scheduled summary email that consolidates recent attorney activities.

```bash
npx tsx scripts/test-attorney-activity-summary-email.ts
```

**What it tests:**
- Activity aggregation
- Time period formatting
- Multiple activity types
- Batch email delivery

---

### 3. Attorney Packet Ready Notification
**File:** `test-packet-ready-email.ts`

Tests the notification sent when a claimant's packet is ready for attorney review.

```bash
npx tsx scripts/test-packet-ready-email.ts
```

**What it tests:**
- Packet completion notification
- Document count display
- Download links
- Review workflow triggers

---

### 4. Client Document Follow-Up
**File:** `test-client-follow-up-email.ts`

Tests the automated follow-up email sent to claimants about missing documents.

```bash
npx tsx scripts/test-client-follow-up-email.ts
```

**What it tests:**
- Follow-up cadence system
- Missing document lists
- Resume workflow links
- Client support information

---

### 5. Client Document Assistance
**File:** `test-document-assistance-email.ts`

Tests the email sent to claimants with document request assistance.

```bash
npx tsx scripts/test-document-assistance-email.ts
```

**What it tests:**
- Document provider information
- Step-by-step instructions
- Form template links
- Staff assistance tracking

---

## 🚀 Run All Tests

**File:** `test-all-notification-emails.ts`

Runs all email tests in sequence with proper delays to avoid rate limiting.

```bash
npx tsx scripts/test-all-notification-emails.ts
```

**Output:**
- ✅ Detailed test results
- 📊 Pass/fail summary
- ⏳ Rate limit handling (2s delays)
- 📬 Delivery confirmation

---

## 📋 Prerequisites

1. **Database seeded** with demo data:
   ```bash
   npm run db:seed
   ```

2. **Environment variables** configured:
   ```bash
   RESEND_API_KEY=re_xxxxx
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=postgresql://...
   ```

3. **Dependencies installed**:
   ```bash
   npm install
   ```

---

## 🧪 Testing Workflow

### Quick Test (Single Email)
```bash
# Test one specific email type
npx tsx scripts/test-attorney-new-client-email.ts
```

### Full Test Suite
```bash
# Test all email types
npx tsx scripts/test-all-notification-emails.ts
```

### Verify Delivery
1. Check **brandon@radiantclaims.com** inbox
2. Verify email rendering
3. Test all links and CTAs
4. Check mobile responsiveness

---

## 📊 Expected Results

### Success Output
```
✅ Email sent successfully!
   Sent to: 1 recipient(s)
📬 Check brandon@radiantclaims.com for the email!
```

### Failure Output
```
❌ Email failed to send
   brandon@radiantclaims.com: [error message]
```

---

## 🔍 Troubleshooting

### Error: "Resend not configured"
**Solution:** Set `RESEND_API_KEY` in `.env`

### Error: "Demo data not found"
**Solution:** Run `npm run db:seed`

### Error: "Database connection failed"
**Solution:** Verify `DATABASE_URL` and ensure PostgreSQL is running

### Email not received
**Possible causes:**
1. Check Resend API key is valid
2. Verify brandon@radiantclaims.com is accessible
3. Check spam/junk folder
4. Review Resend dashboard for delivery logs

---

## 📁 Test Data Used

All tests use the seeded demo data:

- **Claimant:** Jane Doe (brandon@radiantclaims.com)
- **Law Firm:** Heritage Law Offices
- **Attorney:** Heritage Law attorney account
- **Activities:** 4 sample activity logs
- **Follow-Ups:** 1 document follow-up record
- **Assistance:** 1 document assistance request

---

## 🔄 Integration Testing

After successful email tests, proceed to integration:

1. **Phase 1:** Wire new client notifications into signup flow
2. **Phase 2:** Add activity logging to document uploads
3. **Phase 3:** Create scheduled summary cron job
4. **Phase 4:** Implement follow-up cadence automation

See `NOTIFICATION_INTEGRATION_STATUS.md` for detailed integration steps.

---

## 📚 Related Documentation

- **Design Doc:** `NOTIFICATION_SYSTEM_DESIGN.md`
- **Integration Status:** `NOTIFICATION_INTEGRATION_STATUS.md`
- **Email Helpers:** `src/lib/notification-emails.ts`
- **Resend Client:** `src/lib/resend.ts`
- **Email Templates:** `src/emails/`

---

## ✅ Production Checklist

Before deploying to production:

- [ ] All test emails render correctly
- [ ] All links work and point to correct URLs
- [ ] Mobile rendering is responsive
- [ ] Unsubscribe links function properly
- [ ] Email preferences are respected
- [ ] Rate limiting is configured
- [ ] Error handling is robust
- [ ] Logging is comprehensive
- [ ] Update recipient emails from brandon@radiantclaims.com to real addresses

---

## 💡 Tips

- Run tests after any email template changes
- Test on multiple email clients (Gmail, Outlook, etc.)
- Verify all dynamic data populates correctly
- Check that timestamps are in correct timezone
- Ensure all CTAs are trackable (if using analytics)

---

**Last Updated:** November 14, 2025
**All emails configured to:** brandon@radiantclaims.com

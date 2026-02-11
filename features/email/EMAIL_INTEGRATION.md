# Email Integration Documentation

**Status:** ✅ Complete
**Last Updated:** 2025-10-26

---

## Overview

RadiantClaims now has a complete email notification system using **Resend** for delivery and **React Email** for beautiful, responsive HTML templates. The system includes 4 core email types with full unsubscribe functionality.

---

## 📧 Email Types

### 1. Welcome Email
**Trigger:** When a new customer account is created during intake
**Purpose:** Deliver login credentials and resume link
**Template:** `src/emails/welcome.tsx`
**Function:** `sendWelcomeEmail()` in `src/lib/email.ts`

**Includes:**
- Email and temporary password
- Login link
- Resume link (if available)
- Password change reminder
- Branded terracotta header

**Usage:**
```typescript
import { sendWelcomeEmail } from "@/lib/email";

await sendWelcomeEmail({
  to: "user@example.com",
  name: "John Doe",
  email: "user@example.com",
  temporaryPassword: "temp123456",
  claimantId: "clm_123",
  resumeToken: "token_abc", // optional
});
```

---

### 2. Resume Link Email
**Trigger:** When user clicks "Save for Later" or requests resume link
**Purpose:** Allow users to continue their claim from any device
**Template:** `src/emails/resume-link.tsx`
**Function:** `sendResumeLinkEmail()` in `src/lib/email.ts`

**Includes:**
- Magic link to continue claim
- Progress summary (current step, documents uploaded)
- Expiration notice
- Document checklist reminder
- Helpful tips

**Usage:**
```typescript
import { sendResumeLinkEmail } from "@/lib/email";

await sendResumeLinkEmail({
  to: "user@example.com",
  name: "John Doe",
  resumeToken: "token_abc",
  currentStep: "Document Upload",
  uploadedDocuments: 5,
  expiresAt: new Date("2025-11-02"),
});
```

**API Endpoint:**
```bash
POST /api/email/send-resume-link
{
  "email": "user@example.com",
  "resumeToken": "token_abc"
}
```

---

### 3. Upload Confirmation Email
**Trigger:** After successful document upload
**Purpose:** Confirm receipt and encourage continued progress
**Template:** `src/emails/upload-confirmation.tsx`
**Function:** `sendUploadConfirmationEmail()` in `src/lib/email.ts`

**Includes:**
- Document type confirmation
- Upload summary (files uploaded, total count)
- Resume link
- Next steps checklist
- Helpful tips

**Usage:**
```typescript
import { sendUploadConfirmationEmail } from "@/lib/email";

await sendUploadConfirmationEmail({
  to: "user@example.com",
  name: "John Doe",
  documentType: "Proof of Residence",
  documentCount: 2,
  totalUploaded: 7,
  resumeToken: "token_abc",
});
```

---

### 4. Packet Ready Email
**Trigger:** When claim packet is successfully assembled
**Purpose:** Notify user their packet is ready for review
**Template:** `src/emails/packet-ready.tsx`
**Function:** `sendPacketReadyEmail()` in `src/lib/email.ts`

**Includes:**
- Packet summary (document count, claim type)
- Next steps (review, attorney assignment)
- Timeline expectations
- View/download links
- Celebration message

**Usage:**
```typescript
import { sendPacketReadyEmail } from "@/lib/email";

await sendPacketReadyEmail({
  to: "user@example.com",
  name: "John Doe",
  claimType: "Pancreatic Cancer",
  documentCount: 12,
  packetUrl: "https://example.com/download/packet_123.pdf", // optional
});
```

---

## 🎨 Email Design

All emails use the RadiantClaims brand colors:

- **Terracotta-500** (#d4674f) - Primary CTAs, headers
- **Sage-500** (#5f7262) - Secondary buttons, text
- **Cream-50** (#fdfcfb) - Background
- **Peach-50** (#fef8f5) - Notice boxes

### Design Features:
- Fully responsive (mobile-first)
- Professional layout with clear hierarchy
- Consistent branding across all templates
- Accessible color contrast ratios
- Clear call-to-action buttons
- Support links in footer

---

## 🚫 Unsubscribe System

### Database Model
```prisma
enum EmailType {
  WELCOME
  RESUME_LINK
  UPLOAD_CONFIRMATION
  PACKET_READY
  MARKETING
  UPDATES
}

model EmailPreference {
  id               String      @id @default(cuid())
  email            String
  emailType        EmailType
  isUnsubscribed   Boolean     @default(false)
  unsubscribedAt   DateTime?
  unsubscribeToken String      @unique @default(cuid())

  @@unique([email, emailType])
}
```

### How It Works

1. **Unsubscribe Link in Every Email**
   - All email templates include an unsubscribe link in the footer
   - Link format: `/api/email/unsubscribe?email=xxx&type=WELCOME`

2. **Automatic Checking Before Send**
   - Each email function checks unsubscribe status
   - If user has unsubscribed, email is not sent
   - Logs the skip reason

3. **API Endpoints**

**Unsubscribe via POST:**
```bash
POST /api/email/unsubscribe
{
  "email": "user@example.com",
  "type": "WELCOME" // or "ALL"
}
```

**Unsubscribe via GET (for email links):**
```
GET /api/email/unsubscribe?email=user@example.com&type=WELCOME
```

4. **Success Page**
   - User is redirected to `/unsubscribe/success`
   - Shows confirmation message
   - Links to customer portal
   - Option to contact support

### Helper Functions

```typescript
import { isUnsubscribed, generateUnsubscribeUrl } from "@/lib/email-preferences";

// Check if user has unsubscribed
const unsubscribed = await isUnsubscribed("user@example.com", EmailType.WELCOME);

// Generate unsubscribe URL
const url = generateUnsubscribeUrl("user@example.com", EmailType.WELCOME);
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```bash
# Resend API Key
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# Base URL for email links
NEXTAUTH_URL="http://localhost:3000"
```

### Getting a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Navigate to API Keys in dashboard
3. Create a new API key
4. Copy and add to `.env`

**Free Tier:**
- 3,000 emails/month
- Perfect for development and small-scale production

**Pricing:**
- $20/month for 50,000 emails
- $0.40 per additional 1,000 emails

---

## 📁 File Structure

```
src/
├── emails/                          # React Email templates
│   ├── welcome.tsx                  # Welcome email template
│   ├── resume-link.tsx              # Resume link template
│   ├── upload-confirmation.tsx      # Upload confirmation template
│   └── packet-ready.tsx             # Packet ready template
│
├── lib/
│   ├── email.ts                     # Main email sending functions
│   ├── email-preferences.ts         # Unsubscribe helper functions
│   └── create-customer-account.ts   # Account creation (calls sendWelcomeEmail)
│
├── app/
│   ├── api/
│   │   └── email/
│   │       ├── send-resume-link/route.ts    # Send resume link endpoint
│   │       └── unsubscribe/route.ts         # Unsubscribe endpoint
│   │
│   └── unsubscribe/
│       └── success/page.tsx         # Unsubscribe success page
│
└── prisma/
    └── schema.prisma                # EmailPreference model
```

---

## 🔌 Integration Points

### 1. Account Creation (Already Integrated)
**Location:** `src/app/api/claimants/route.ts` (line 51-58)

```typescript
// After creating account
if (temporaryPassword) {
  await sendWelcomeEmail({
    email: validated.email,
    name: `${validated.firstName} ${validated.lastName}`,
    temporaryPassword,
    claimantId: claimant.id,
  });
}
```

### 2. Save for Later Button
**Todo:** Add to Step 2 UI

```typescript
// In your "Save for Later" button handler
const handleSaveForLater = async () => {
  // Send resume link email
  await fetch("/api/email/send-resume-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: session.claimant.email,
      resumeToken: session.resumeToken,
    }),
  });

  // Show success message
  alert("We've sent a link to your email to continue later!");
};
```

### 3. Document Upload Confirmation
**Todo:** Add to upload completion handler

```typescript
// After successful upload
await sendUploadConfirmationEmail({
  to: claimant.email,
  name: `${claimant.firstName} ${claimant.lastName}`,
  documentType: categoryName, // "Proof of Residence", etc.
  documentCount: 1,
  totalUploaded: session.uploadedFiles.length + 1,
  resumeToken: session.resumeToken,
});
```

### 4. Packet Generation
**Todo:** Add to packet assembly completion

```typescript
// After packet generation succeeds
await sendPacketReadyEmail({
  to: claimant.email,
  name: `${claimant.firstName} ${claimant.lastName}`,
  claimType: getClaimTypeName(session.claimType),
  documentCount: uploadedFiles.length,
  packetUrl: downloadUrl, // optional
});
```

---

## 🧪 Testing

### Development Testing (Without Resend)

The system gracefully handles missing API keys:

```typescript
// Email functions will log to console if RESEND_API_KEY is not set
console.log("Welcome email sent successfully:", data?.id);
```

### Testing with Resend

1. **Use Resend Test Mode:**
   - Resend automatically provides a test mode
   - Emails are sent but not delivered
   - Check dashboard for sent emails

2. **Test with Real Email:**
   - Add your own email to `.env` for testing
   - Create test claimant with your email
   - Verify emails are received correctly

3. **Test Unsubscribe Flow:**
   ```bash
   # Unsubscribe test user
   curl -X POST http://localhost:3000/api/email/unsubscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","type":"ALL"}'

   # Verify they don't receive emails
   # (emails will be skipped and logged)
   ```

---

## 📊 Email Analytics

Resend provides built-in analytics:
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam complaints

Access via Resend dashboard.

---

## 🚨 Error Handling

All email functions include error handling:

```typescript
try {
  await sendWelcomeEmail(params);
} catch (error) {
  // Email failure won't block account creation
  console.error("Failed to send welcome email:", error);
  // Credentials are still returned to be displayed on-screen
}
```

**Important:** Email failures are logged but don't throw errors to avoid blocking critical operations like account creation.

---

## 📝 Next Steps

### Still Todo:

1. **Add "Save for Later" Button**
   - Location: `src/app/intake/step2/page.tsx`
   - Call `/api/email/send-resume-link` on click

2. **Upload Confirmation Integration**
   - Location: Upload completion handler
   - Send email after each successful upload

3. **Packet Ready Integration**
   - Location: Packet generation completion
   - Send email when packet status changes to READY

4. **Email Preferences Page**
   - Location: `/portal/settings/email-preferences`
   - Allow users to manage subscriptions
   - Show current preferences
   - Re-subscribe option

---

## 🎯 Production Checklist

Before going live:

- [ ] Add real `RESEND_API_KEY` to production `.env`
- [ ] Update `DEFAULT_FROM` email in `src/lib/email.ts` to verified domain
- [ ] Test all email types in production
- [ ] Verify unsubscribe links work correctly
- [ ] Set up domain verification in Resend
- [ ] Add SPF/DKIM records to DNS
- [ ] Test email deliverability (Gmail, Outlook, etc.)
- [ ] Monitor Resend dashboard for bounce/spam rates
- [ ] Remove test credentials from response in `src/app/api/claimants/route.ts` (line 66)

---

## 🔗 Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- [Resend Dashboard](https://resend.com/dashboard)
- [Email Testing Tools](https://www.mail-tester.com)

---

**Questions?** Contact the development team or refer to the inline code documentation.

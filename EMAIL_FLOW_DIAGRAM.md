# RadiantClaims Email Flow Diagram

This diagram shows how emails are triggered throughout the user journey.

---

## 📧 Email Trigger Points

```
User Journey:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. INTAKE FORM SUBMISSION                                          │
│     └─> Create Claimant Account                                    │
│         └─> Generate Temporary Password                            │
│             └─> 📧 WELCOME EMAIL                                    │
│                 ├─ Email: user@example.com                         │
│                 ├─ Password: temp123456                            │
│                 ├─ Login Link: /login                              │
│                 └─ Resume Link: /intake/step2?token=xxx            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  2. SAVE FOR LATER BUTTON                                           │
│     └─> User clicks "Save for Later"                               │
│         └─> Call API: POST /api/email/send-resume-link            │
│             └─> 📧 RESUME LINK EMAIL                                │
│                 ├─ Current Step: Document Upload                   │
│                 ├─ Documents Uploaded: 5                           │
│                 ├─ Expires: 7 days                                 │
│                 └─ Resume Link: /intake/step2?token=xxx            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  3. DOCUMENT UPLOAD COMPLETION                                      │
│     └─> User successfully uploads a document                       │
│         └─> Upload confirmed in database                           │
│             └─> 📧 UPLOAD CONFIRMATION EMAIL                        │
│                 ├─ Document Type: Proof of Residence               │
│                 ├─ Files Uploaded: 2                               │
│                 ├─ Total Documents: 7                              │
│                 └─ Resume Link: /intake/step2?token=xxx            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  4. PACKET ASSEMBLY COMPLETION                                      │
│     └─> All documents uploaded & verified                          │
│         └─> PDF packet generated successfully                      │
│             └─> 📧 PACKET READY EMAIL                               │
│                 ├─ Claim Type: Pancreatic Cancer                   │
│                 ├─ Total Documents: 12                             │
│                 ├─ Portal Link: /portal                            │
│                 └─ Download Link: /download/packet_123.pdf         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Email Processing Flow

```
Email Sending Process:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. TRIGGER EVENT                                                │
│     └─> Function called (e.g., sendWelcomeEmail())              │
│                                                                  │
│  2. CHECK UNSUBSCRIBE STATUS                                     │
│     └─> Query EmailPreference table                             │
│         ├─> If unsubscribed: Skip & log                         │
│         └─> If not unsubscribed: Continue                       │
│                                                                  │
│  3. RENDER EMAIL TEMPLATE                                        │
│     └─> React Email component → HTML                            │
│         └─> Inject unsubscribe URL                              │
│                                                                  │
│  4. SEND VIA RESEND                                              │
│     └─> POST to Resend API                                      │
│         ├─> Success: Log email ID                               │
│         └─> Error: Log error, don't throw                       │
│                                                                  │
│  5. RETURN RESULT                                                │
│     └─> { success: true, emailId: "re_abc123" }                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚫 Unsubscribe Flow

```
Unsubscribe Process:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. USER CLICKS UNSUBSCRIBE LINK IN EMAIL                        │
│     └─> GET /api/email/unsubscribe?email=xxx&type=WELCOME       │
│                                                                  │
│  2. API ENDPOINT PROCESSES REQUEST                               │
│     └─> Validate email address                                  │
│         └─> Update EmailPreference table                        │
│             ├─> Set isUnsubscribed = true                       │
│             └─> Set unsubscribedAt = now()                      │
│                                                                  │
│  3. REDIRECT TO SUCCESS PAGE                                     │
│     └─> /unsubscribe/success?email=xxx                          │
│         └─> Display confirmation message                        │
│                                                                  │
│  4. FUTURE EMAIL ATTEMPTS                                        │
│     └─> sendEmail() checks EmailPreference                      │
│         └─> If unsubscribed: Skip sending                       │
│             └─> Log: "User has unsubscribed"                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Interaction

```
Email Preference Tracking:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  EmailPreference Table                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id                 String    (cuid)                      │  │
│  │ email              String    (user@example.com)          │  │
│  │ emailType          EmailType (WELCOME, RESUME_LINK, etc)│  │
│  │ isUnsubscribed     Boolean   (true/false)                │  │
│  │ unsubscribedAt     DateTime  (2025-10-26T12:00:00Z)      │  │
│  │ unsubscribeToken   String    (unique token)              │  │
│  │ createdAt          DateTime                              │  │
│  │ updatedAt          DateTime                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  @@unique([email, emailType])  <-- One record per email+type   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Example Records:
┌────────────────────────────────────────────────────────────────┐
│ email: "john@example.com"                                      │
│ emailType: WELCOME                                             │
│ isUnsubscribed: false                                          │
│ unsubscribedAt: null                                           │
├────────────────────────────────────────────────────────────────┤
│ email: "john@example.com"                                      │
│ emailType: MARKETING                                           │
│ isUnsubscribed: true                                           │
│ unsubscribedAt: 2025-10-26T10:30:00Z                           │
└────────────────────────────────────────────────────────────────┘

Result: John receives system emails (WELCOME, RESUME_LINK)
        but NOT marketing emails
```

---

## 🎯 Integration Points

### Current Integrations:

```
✅ Account Creation Flow
   src/app/api/claimants/route.ts:51-58
   ↓
   createCustomerAccount()
   ↓
   sendWelcomeEmail()
   ↓
   Resend API
```

### Ready to Integrate (when needed):

```
📝 Save for Later Button
   [User clicks button]
   ↓
   POST /api/email/send-resume-link
   ↓
   sendResumeLinkEmail()
   ↓
   Resend API


📝 Document Upload Handler
   [Upload completes successfully]
   ↓
   sendUploadConfirmationEmail()
   ↓
   Resend API


📝 Packet Generation Handler
   [Packet assembly completes]
   ↓
   sendPacketReadyEmail()
   ↓
   Resend API
```

---

## 🔐 Security & Privacy

```
Data Protection:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. EMAIL ADDRESSES                                         │
│     └─> Stored in User/Claimant tables (hashed passwords)  │
│         └─> EmailPreference table (for unsubscribe)        │
│                                                             │
│  2. TEMPORARY PASSWORDS                                     │
│     └─> Generated: randomBytes(8).toString("base64")       │
│         └─> Stored: bcrypt hashed in database              │
│         └─> Sent: Plain text in email (once)               │
│                                                             │
│  3. RESUME TOKENS                                           │
│     └─> Generated: Secure random string                    │
│         └─> Stored: IntakeSession.resumeToken              │
│         └─> Expires: 7 days from creation                  │
│         └─> One-time use: Updated on resume                │
│                                                             │
│  4. UNSUBSCRIBE TOKENS                                      │
│     └─> Generated: cuid() per preference                   │
│         └─> Unique: @@unique on token                      │
│         └─> Persistent: No expiration                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Email Analytics

```
Resend Dashboard Metrics:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Available Metrics (via Resend):                            │
│  ├─ Total Emails Sent                                       │
│  ├─ Delivery Rate (%)                                       │
│  ├─ Open Rate (%)                                           │
│  ├─ Click Rate (%)                                          │
│  ├─ Bounce Rate (%)                                         │
│  ├─ Spam Complaints (%)                                     │
│  └─ Individual Email Status                                 │
│                                                             │
│  Custom Logging (console):                                  │
│  ├─ Email sent successfully: re_abc123                      │
│  ├─ User has unsubscribed: user@example.com                 │
│  └─ Failed to send: [error details]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Email Template Structure

```
All Email Templates Follow This Pattern:
┌────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════╗    │
│  ║  HEADER (Terracotta/Sage)                         ║    │
│  ║  - RadiantClaims Logo/Name                        ║    │
│  ║  - Tagline                                         ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  GREETING                                         │     │
│  │  Hi [Name],                                       │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  PRIMARY MESSAGE                                  │     │
│  │  - Main content                                   │     │
│  │  - Important information                          │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  INFORMATION BOX (Sage background)               │     │
│  │  - Key details                                    │     │
│  │  - Credentials/summary                            │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  [PRIMARY CTA BUTTON] (Terracotta)               │     │
│  │  [Secondary Button] (Sage)                       │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  NOTICE BOX (Peach background)                   │     │
│  │  ⚠️ Important reminders                           │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  ADDITIONAL INFO                                  │     │
│  │  - Next steps                                     │     │
│  │  - Helpful tips                                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  FOOTER                                                    │
│  - Copyright                                               │
│  - Unsubscribe | Contact Support                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Reference

### Send an Email:
```typescript
import { sendWelcomeEmail } from "@/lib/email";
await sendWelcomeEmail({ to, name, email, temporaryPassword });
```

### Check Unsubscribe Status:
```typescript
import { isUnsubscribed } from "@/lib/email-preferences";
const unsubbed = await isUnsubscribed(email, EmailType.WELCOME);
```

### Generate Unsubscribe URL:
```typescript
import { generateUnsubscribeUrl } from "@/lib/email-preferences";
const url = generateUnsubscribeUrl(email, EmailType.WELCOME);
```

---

**Last Updated:** 2025-10-26
**Status:** Production Ready

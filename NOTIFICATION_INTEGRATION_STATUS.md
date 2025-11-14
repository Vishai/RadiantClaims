# Email Notification System - Integration Status

**Last Updated:** November 14, 2025
**Status:** Infrastructure Complete - Integration Pending

---

## ✅ COMPLETED

### 1. Database Infrastructure
- ✅ Migration applied: `20251113090000_notification_system`
- ✅ Tables created:
  - `LawFirmNotificationSchedule` - Email delivery schedules
  - `AttorneyActivityLog` - Activity tracking
  - `AttorneyNotificationLog` - Sent notification logs
  - `ClaimantFollowUp` - Follow-up reminders
  - `FollowUpPriorityQueue` - Priority scoring
  - `DocumentRequestAssistance` - Document help tracking
  - Supporting tables for preferences and settings

### 2. Seed Data
- ✅ Demo data populated with test accounts
- ✅ All notification emails configured to send to: **brandon@radiantclaims.com**
- ✅ Sample activities, notifications, and follow-ups created
- ✅ Test credentials available for all roles:
  - Customer: `customer@test.com / customer123`
  - Admin: `admin@radiantclaims.com / admin123`
  - Attorney: `attorney@heritagelaw.com / attorney123`
  - Reviewer: `reviewer@radiantclaims.com / reviewer123`

### 3. Email Infrastructure
- ✅ Resend client configured: `src/lib/resend.ts`
- ✅ Email sender functions: `src/lib/notification-emails.ts`
  - `sendAttorneyNewClientNotificationEmail()`
  - `sendAttorneyActivitySummaryEmail()`
  - `sendAttorneyPacketReadyNotificationEmail()`
  - `sendClientDocumentFollowUpEmail()`
  - `sendClientProgressMilestoneEmail()`
  - `sendClientReengagementEmail()`
  - `sendClientDocumentAssistanceEmail()`

### 4. Email Templates (React Components)
- ✅ Attorney templates:
  - `src/emails/attorney/new-client-notification.tsx`
  - `src/emails/attorney/activity-summary.tsx`
  - `src/emails/attorney/packet-ready-notification.tsx`
- ✅ Client templates:
  - `src/emails/client/document-follow-up.tsx`
  - `src/emails/client/progress-milestone.tsx`
  - `src/emails/client/re-engagement.tsx`
  - `src/emails/client/document-assistance.tsx`

### 5. Supporting Features
- ✅ Unsubscribe functionality
- ✅ Email preference management
- ✅ Layout components for attorney and client emails

---

## 🚧 PENDING INTEGRATION

### Critical Integration Points

#### 1. New Client Signup Notification
**Location:** `src/app/api/reca/workflow/create/route.ts`
**Current State:** Creates claimant and intake session, but doesn't trigger notification
**Required Changes:**
```typescript
// After creating intakeSession (around line 109-126)
import { sendAttorneyNewClientNotificationEmail } from "@/lib/notification-emails";

// Find the attorney's law firm
const subscription = await db.serviceSubscription.findUnique({
  where: { userId: session.user.id },
  include: { user: { include: { firm: true } } }
});

if (subscription?.user?.firm && subscription.tier === "LEGAL_REP") {
  // Log the activity
  const activityLog = await db.attorneyActivityLog.create({
    data: {
      firmId: subscription.user.firm.id,
      claimantId: claimantId!,
      sessionId: intakeSession.id,
      activityType: "NEW_CLIENT_SIGNUP",
      title: `New Client: ${claimant.firstName} ${claimant.lastName}`,
      description: "Completed signup and assigned to your firm.",
      metadata: {
        tier: subscription.tier,
        email: claimant.email,
      }
    }
  });

  // Send immediate notification
  const recipients = subscription.user.firm.primaryContactEmail
    ? [subscription.user.firm.primaryContactEmail]
    : [];

  if (recipients.length > 0) {
    await sendAttorneyNewClientNotificationEmail({
      recipients,
      claimantName: `${claimant.firstName} ${claimant.lastName}`,
      claimantEmail: claimant.email || "",
      claimantPhone: claimant.phone || "",
      location: `${claimant.city}, ${claimant.state}`,
      county: claimant.county || "",
      claimId: intakeSession.id,
      completionPercent: 0,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/attorney/dashboard`,
      claimDetailsUrl: `${process.env.NEXTAUTH_URL}/attorney/claimants/${claimantId}`
    });

    // Log the notification
    await db.attorneyNotificationLog.create({
      data: {
        firmId: subscription.user.firm.id,
        notificationType: "IMMEDIATE_NEW_CLIENT",
        recipients,
        subject: "New Client Assigned",
        sessionId: intakeSession.id,
        activityIds: [activityLog.id]
      }
    });
  }
}
```

#### 2. Document Upload Activity Tracking
**Location:** `src/app/api/upload/route.ts` or `src/app/api/documents/upload/route.ts`
**Required Changes:**
```typescript
// After successful document upload
import { db } from "@/lib/db";

// Get the claimant's assigned firm (if any)
const claimant = await db.claimant.findUnique({
  where: { id: document.claimantId },
  include: {
    user: {
      include: {
        serviceSubscription: {
          include: { user: { include: { firm: true } } }
        }
      }
    }
  }
});

const firm = claimant?.user?.serviceSubscription?.user?.firm;
if (firm) {
  await db.attorneyActivityLog.create({
    data: {
      firmId: firm.id,
      claimantId: document.claimantId,
      sessionId: intakeSession?.id,
      activityType: "DOCUMENT_UPLOADED",
      title: `Uploaded ${document.type}`,
      description: document.originalName,
      metadata: {
        documentId: document.id,
        fileSize: document.size,
        mimeType: document.mimeType
      }
    }
  });
}
```

#### 3. Packet Generation Notification
**Location:** Needs to be identified (likely in packet generation logic)
**Required Changes:**
```typescript
// After packet is successfully generated
await sendAttorneyPacketReadyNotificationEmail({
  recipients: [firm.primaryContactEmail],
  claimantName: `${claimant.firstName} ${claimant.lastName}`,
  claimantId: claimant.id,
  packetId: packet.id,
  documentCount: documentCount,
  reviewUrl: `${process.env.NEXTAUTH_URL}/attorney/packets/${packet.id}`,
  downloadUrl: `${process.env.NEXTAUTH_URL}/api/attorney/packets/${packet.id}/download`
});

await db.attorneyNotificationLog.create({
  data: {
    firmId: firm.id,
    notificationType: "IMMEDIATE_PACKET_READY",
    recipients: [firm.primaryContactEmail],
    subject: "Packet Ready for Review",
    sessionId: intakeSession.id
  }
});
```

#### 4. Scheduled Summary Email Job
**Location:** Needs to be created as a cron job or API route
**File to create:** `src/app/api/cron/attorney-summaries/route.ts`
**Required Implementation:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAttorneyActivitySummaryEmail } from "@/lib/notification-emails";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    // Find all firms with summaries scheduled for this time
    const schedules = await db.lawFirmNotificationSchedule.findMany({
      where: {
        summaryEmailTimes: { has: currentTime }
      },
      include: { firm: true }
    });

    for (const schedule of schedules) {
      // Get unsent activities since last summary
      const activities = await db.attorneyActivityLog.findMany({
        where: {
          firmId: schedule.firmId,
          includedInSummary: false,
          createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } // Last 12 hours
        },
        include: {
          claimant: true,
          session: true
        },
        orderBy: { createdAt: "desc" }
      });

      if (activities.length >= (schedule.minimumActivities || 1)) {
        const recipients = schedule.firm.primaryContactEmail
          ? [schedule.firm.primaryContactEmail]
          : [];

        // Send summary email
        await sendAttorneyActivitySummaryEmail({
          recipients,
          firmName: schedule.firm.name,
          summaryPeriod: "Last 12 hours",
          activities: activities.map(a => ({
            type: a.activityType,
            title: a.title,
            description: a.description || "",
            claimantName: a.claimant ? `${a.claimant.firstName} ${a.claimant.lastName}` : "Unknown",
            timestamp: a.createdAt.toISOString(),
            actionUrl: `${process.env.NEXTAUTH_URL}/attorney/claimants/${a.claimantId}`
          })),
          totalActivities: activities.length,
          dashboardUrl: `${process.env.NEXTAUTH_URL}/attorney/dashboard`
        });

        // Log the notification
        const notificationLog = await db.attorneyNotificationLog.create({
          data: {
            firmId: schedule.firmId,
            notificationType: "SCHEDULED_SUMMARY",
            recipients,
            subject: `Activity Summary - ${activities.length} Updates`,
            activityIds: activities.map(a => a.id)
          }
        });

        // Mark activities as included in summary
        await db.attorneyActivityLog.updateMany({
          where: { id: { in: activities.map(a => a.id) } },
          data: {
            includedInSummary: true,
            summaryEmailId: notificationLog.id
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending attorney summaries:", error);
    return NextResponse.json({ error: "Failed to send summaries" }, { status: 500 });
  }
}
```

**Vercel Cron Configuration:**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/attorney-summaries",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### 5. Client Follow-Up System
**Location:** Needs to be created
**File to create:** `src/app/api/cron/client-followups/route.ts`
**Required Implementation:**
```typescript
// Similar to attorney summaries, but:
// 1. Query ClaimantFollowUp records where scheduledFor <= now and status = "PENDING"
// 2. Send appropriate follow-up email based on followUpType
// 3. Update status to "SENT" and sentAt timestamp
// 4. Calculate next follow-up if needed based on phase
```

#### 6. Progress Milestone Notifications
**Location:** Various workflow completion points
**Integration Points:**
- When intake reaches 25%, 50%, 75%, 100%
- When documents are validated
- When packet is submitted

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Core Attorney Notifications (Immediate)
- [ ] Integrate new client notification in workflow creation
- [ ] Add activity logging for document uploads
- [ ] Create scheduled summary cron job
- [ ] Set up Vercel cron configuration
- [ ] Test with brandon@radiantclaims.com

### Phase 2: Packet Ready Notifications
- [ ] Identify packet generation trigger point
- [ ] Integrate packet ready notification
- [ ] Test packet workflow end-to-end

### Phase 3: Client Follow-Up System
- [ ] Create follow-up cron job
- [ ] Implement priority queue processing
- [ ] Add follow-up scheduling logic to workflow steps
- [ ] Test cadence timing

### Phase 4: Document Assistance
- [ ] Wire up document assistance requests
- [ ] Integrate staff assignment notifications
- [ ] Add claimant confirmation emails

### Phase 5: Testing & Optimization
- [ ] End-to-end testing with demo data
- [ ] Verify all emails arrive at brandon@radiantclaims.com
- [ ] Monitor Resend delivery logs
- [ ] Adjust timing and thresholds based on testing

---

## 🔧 Environment Variables Required

Ensure these are set in production:
```bash
RESEND_API_KEY=re_xxxxx
NEXTAUTH_URL=https://radiantclaims.com
CRON_SECRET=random_secure_string_here
```

---

## 📚 Reference Documentation

- Design Doc: `NOTIFICATION_SYSTEM_DESIGN.md`
- Email Helpers: `src/lib/notification-emails.ts`
- Resend Client: `src/lib/resend.ts`
- Seed Script: `prisma/seed.ts`
- Schema: `prisma/schema.prisma`

---

## 🎯 Next Steps

1. **Start with Phase 1** - Core attorney notifications are the highest priority
2. **Use the demo data** - All necessary test data exists in the database
3. **Test incrementally** - Verify each integration point before moving to the next
4. **Monitor brandon@radiantclaims.com** - All emails will go there for testing
5. **When ready for production** - Update law firm emails to real attorney addresses

---

## 💡 Notes

- All email templates are already built and tested
- Database schema supports all planned features
- Unsubscribe/preferences system is ready
- The system is designed to scale to 100s of attorneys and 1000s of claimants
- Email delivery uses Resend with built-in analytics and tracking

# RadiantClaims - Notification & Follow-Up System Design

**Created:** November 13, 2025
**Status:** Design Phase
**Goal:** Implement robust attorney notifications and client follow-up automation

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Attorney Notification System](#attorney-notification-system)
3. [Client Follow-Up System](#client-follow-up-system)
4. [Database Schema](#database-schema)
5. [Email Templates](#email-templates)
6. [Implementation Plan](#implementation-plan)
7. [Open Questions & Research](#open-questions--research)

---

## System Overview

### Architecture Principles

1. **Non-Intrusive:** Balance utility with spam prevention
2. **Configurable:** Attorneys control their notification preferences
3. **Actionable:** Every email should drive specific actions
4. **Tracked:** All interactions logged for analytics and optimization
5. **Scalable:** Built to handle 100s of attorneys and 1000s of claimants

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                   RadiantClaims Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Event Triggers  │───────▶│  Notification    │          │
│  │  - New Client    │        │  Queue System    │          │
│  │  - Packet Ready  │        └──────┬───────────┘          │
│  │  - Doc Upload    │               │                      │
│  └──────────────────┘               │                      │
│                                      ▼                      │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Scheduled Jobs  │───────▶│  Email Delivery  │          │
│  │  - 6am Summary   │        │  (Resend)        │          │
│  │  - 2pm Summary   │        └──────────────────┘          │
│  │  - Follow-ups    │                                      │
│  └──────────────────┘                                      │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Activity Log    │◀───────│  Response        │          │
│  │  Database        │        │  Tracking        │          │
│  └──────────────────┘        └──────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Attorney Notification System

### 1. Immediate Notifications

#### A. New Client Signup
**Trigger:** Client selects `LEGAL_REP` tier and completes payment
**Timing:** Immediate (within 1 minute)
**Recipients:** Attorney firm's primary contact + configured recipients

**Email Content:**
```
Subject: 🎯 New Client: [Claimant Name] - [Location]

Hi [Attorney Name],

Great news! You have a new RECA claim client.

┌─────────────────────────────────────────┐
│ CLAIMANT INFORMATION                    │
├─────────────────────────────────────────┤
│ Name:      Mary Johnson                 │
│ Email:     mary.j@example.com           │
│ Phone:     (435) 555-0123               │
│ Location:  St. George, UT               │
│ County:    Washington County            │
│ Claim ID:  RC-2025-00142                │
└─────────────────────────────────────────┘

CLAIM DETAILS
• Exposure Period: 1955-1962
• Disease: Lung Cancer (Primary)
• Diagnosis Date: March 2024
• Current Status: Documents Upload (35% complete)

WHAT'S NEXT
✓ Client is actively uploading documents
→ You'll receive progress updates at 6:00 AM and 2:00 PM
→ Watch for "Packet Ready" notification when claim is complete

[View Full Claim Details]  [Attorney Dashboard]

───────────────────────────────────────────
RadiantClaims Attorney Portal
Manage notifications: [Settings]
```

**Database Tracking:**
```typescript
AttorneyNotificationLog {
  event: 'NEW_CLIENT_ASSIGNED'
  firmId: string
  sessionId: string
  sentAt: DateTime
  recipients: string[]
  opened: boolean
  clickedThrough: boolean
}
```

---

### 2. Scheduled Summary Emails

#### Default Schedule
- **Morning Summary:** 6:00 AM local time
- **Afternoon Summary:** 2:00 PM local time
- **Optional:** Custom 3rd time (e.g., 8:00 PM)

#### Configuration Options
Stored in `LawFirmNotificationSetting`:
```typescript
{
  firmId: string
  summaryEmailEnabled: boolean
  summaryEmailTimes: string[] // ["06:00", "14:00", "20:00"]
  timezone: string // "America/Denver"
  minDailySummaries: 1
  maxDailySummaries: 3
}
```

#### Summary Email Content

**Subject:** `📊 Client Activity Summary - [X] Updates`

```markdown
# Client Activity Summary
**[Current Date] - [Time Period]**

## 🎯 NEW CLIENTS (2)
┌────────────────────────────────────────────────────┐
│ Mary Johnson - St. George, UT                      │
│ Signed up: Today at 9:45 AM                        │
│ Status: Document Upload (15%)                      │
│ [View Claim] →                                     │
├────────────────────────────────────────────────────┤
│ Robert Martinez - Las Vegas, NV                    │
│ Signed up: Today at 11:20 AM                       │
│ Status: Document Upload (5%)                       │
│ [View Claim] →                                     │
└────────────────────────────────────────────────────┘

## ✅ PACKETS READY FOR REVIEW (3)
┌────────────────────────────────────────────────────┐
│ James Thompson - Phoenix, AZ                       │
│ Packet generated: 45 minutes ago                   │
│ Documents: 12 files (98% complete)                 │
│ [Review Packet] [Download ZIP]                     │
├────────────────────────────────────────────────────┤
│ Linda Chen - Reno, NV                              │
│ Packet generated: 2 hours ago                      │
│ Documents: 15 files (100% complete)                │
│ [Review Packet] [Download ZIP]                     │
├────────────────────────────────────────────────────┤
│ David Williams - Provo, UT                         │
│ Packet generated: 3 hours ago                      │
│ Documents: 10 files (95% complete)                 │
│ [Review Packet] [Download ZIP]                     │
└────────────────────────────────────────────────────┘

## 📤 RECENT ACTIVITY (5)
┌────────────────────────────────────────────────────┐
│ Sarah Davis uploaded 3 documents (Medical Records) │
│ → Now 85% complete                                 │
│ → 20 minutes ago                                   │
├────────────────────────────────────────────────────┤
│ Michael Brown completed all document uploads       │
│ → Packet generation queued                         │
│ → 1 hour ago                                       │
├────────────────────────────────────────────────────┤
│ Patricia Garcia responded to follow-up             │
│ → Confirmed birth certificate request sent         │
│ → 2 hours ago                                      │
├────────────────────────────────────────────────────┤
│ Thomas Anderson downloaded their packet            │
│ → Ready for mailing                                │
│ → 3 hours ago                                      │
├────────────────────────────────────────────────────┤
│ Jennifer Wilson updated their contact info         │
│ → New phone: (702) 555-9876                        │
│ → 4 hours ago                                      │
└────────────────────────────────────────────────────┘

## 📊 PIPELINE OVERVIEW
• Active Claims: 47
• Awaiting Documents: 23 (49%)
• Ready for Review: 8 (17%)
• Packets Mailed: 16 (34%)

[View Full Activity Dashboard] →

───────────────────────────────────────────
Sent at 6:00 AM MST | Next summary: 2:00 PM
Manage email preferences: [Settings]
```

#### Anti-Spam Logic

**Suppress email if:**
- No new activity since last summary
- Only minor activities (e.g., login events)
- Attorney marked "Do Not Disturb" for this time slot
- Firm-wide pause enabled

**Smart Batching:**
```typescript
interface SummaryBatchLogic {
  // Don't send if activity count < threshold
  minimumActivities: 1

  // Group similar activities
  deduplicateUploads: true // "3 documents" not "doc1, doc2, doc3"

  // Priority ordering
  priorityOrder: [
    'PACKET_READY',
    'NEW_CLIENT',
    'SIGNIFICANT_PROGRESS',
    'MINOR_UPDATES'
  ]

  // Max items per section
  maxNewClients: 10
  maxPacketsReady: 10
  maxRecentActivity: 10
}
```

---

### 3. Attorney Activity Dashboard

#### Portal Page: `/attorney/dashboard/activity`

**Features:**
- Real-time activity feed
- Filterable by claim, activity type, date range
- Exportable to CSV
- Search functionality

**Activity Types Tracked:**
```typescript
enum AttorneyActivityType {
  NEW_CLIENT_SIGNUP = 'NEW_CLIENT_SIGNUP',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  PACKET_GENERATED = 'PACKET_GENERATED',
  PACKET_DOWNLOADED = 'PACKET_DOWNLOADED',
  CLAIMANT_RESPONDED = 'CLAIMANT_RESPONDED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  DOCUMENT_VALIDATED = 'DOCUMENT_VALIDATED',
  CONTACT_INFO_UPDATED = 'CONTACT_INFO_UPDATED',
  FOLLOW_UP_COMPLETED = 'FOLLOW_UP_COMPLETED',
}
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ ACTIVITY FEED                                   🔄 Refresh│
├─────────────────────────────────────────────────────────┤
│ Filters: [All Types ▼] [Last 24 Hours ▼] [Search...]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🎯 NEW CLIENT                             45 min ago    │
│ Mary Johnson signed up for legal representation         │
│ Location: St. George, UT · Claim ID: RC-2025-00142      │
│ [View Details] [Send Message]                           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✅ PACKET READY                           2 hours ago   │
│ James Thompson's claim packet is ready for review       │
│ 12 documents · 98% completeness score                   │
│ [Review Packet] [Download ZIP]                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📤 DOCUMENTS UPLOADED                      3 hours ago  │
│ Sarah Davis uploaded 3 medical records                  │
│ Progress: 65% → 85%                                     │
│ [View Documents]                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Client Follow-Up System

### 1. Follow-Up Cadence Design

#### Initial Assessment (Day 0)
After account creation, system analyzes:
- Required documents (based on claim type)
- Documents already uploaded
- Missing critical documents

#### Follow-Up Schedule

**Phase 1: Active Support (Days 1-14)**
```
Day 1:  Welcome + Document Checklist
Day 3:  Progress Check-in (if < 25% complete)
Day 5:  Missing Documents Reminder
Day 7:  Resource Assistance Offer
Day 10: Personalized Help (if < 50% complete)
Day 14: Milestone Check / Escalation
```

**Phase 2: Maintenance (Days 15-60)**
```
Day 21: Progress reminder
Day 35: Re-engagement campaign
Day 50: Final reminder before pause
Day 60: Pause follow-ups (send reactivation option)
```

**Smart Cadence Adjustment:**
```typescript
interface FollowUpCadence {
  // Accelerate if user is responding
  activeUserMultiplier: 0.7 // Send 30% more frequently

  // Slow down if user is unresponsive
  inactiveUserMultiplier: 1.5 // Send 50% less frequently

  // Pause after specific events
  pauseAfter: [
    'PACKET_COMPLETED',
    'USER_REQUESTED_PAUSE',
    'MULTIPLE_BOUNCES'
  ]

  // Resume triggers
  resumeOn: [
    'USER_LOGIN',
    'DOCUMENT_UPLOAD',
    'EXPLICIT_REQUEST'
  ]
}
```

---

### 2. Follow-Up Email Types

#### A. Document-Specific Follow-Up

**Subject:** `📋 Quick Question About Your [Document Type]`

```markdown
Hi Mary,

Hope you're doing well! I wanted to check in about your RECA claim.

I see you're working on gathering your **birth certificate**. Have you been able to contact the vital records office yet?

[ ] Yes, I've contacted them
[ ] No, not yet - I need help
[ ] I already have this document (upload it now)

──────────────────────────────────────────

HELPFUL RESOURCES FOR YOU:

📍 Washington County Vital Records
   • Address: 111 E Tabernacle St, St. George, UT 84770
   • Phone: (435) 301-7500
   • Website: [Click Here]
   • Hours: Mon-Fri, 8am-5pm

💰 Expected Cost: $20-$25
⏱️ Processing Time: 2-3 weeks (request expedited if needed)

Need us to help? Reply to this email and we can:
• Walk you through the request process
• Provide a pre-filled request form
• Answer questions about what you need

[Track My Progress] [View All Documents Needed]

Best regards,
The RadiantClaims Team
```

**Response Tracking:**
```typescript
interface FollowUpResponse {
  claimantId: string
  followUpId: string
  documentType: string
  responseType: 'CONTACTED' | 'NEED_HELP' | 'ALREADY_HAVE'
  respondedAt: DateTime
  nextAction: string // "SCHEDULE_UPLOAD_REMINDER" or "SEND_ASSISTANCE"
}
```

---

#### B. Progress Milestone Emails

**Subject:** `🎉 You're [X]% Complete with Your RECA Claim!`

```markdown
Hi Mary,

Great progress! You're now **65% complete** with your claim documents.

HERE'S WHAT YOU'VE ACCOMPLISHED:
✅ Birth Certificate
✅ Proof of Residence (2 documents)
✅ Medical Records (3 documents)

JUST 3 MORE DOCUMENTS NEEDED:
→ Death Certificate (for claimant)
→ Marriage Certificate
→ Physician Statement

YOU'RE SO CLOSE! Most claimants at 65% finish within 7-10 days.

[Continue My Claim] [See What's Missing]

Need help with any of these? Just hit reply and let us know!

Best,
The RadiantClaims Team

P.S. Your attorney will be notified as soon as your packet is ready!
```

---

#### C. Re-Engagement Campaign

**Subject:** `We're Still Here to Help with Your RECA Claim`

```markdown
Hi Mary,

It's been about 3 weeks since you started your RECA claim, and I wanted to reach out.

I know gathering documents can be overwhelming - you're definitely not alone in feeling this way. Many claimants hit a pause point, and that's completely normal.

YOUR CLAIM STATUS:
• Documents uploaded: 4 out of 12
• Current progress: 35%
• Time remaining on access: 4 months

We're here to help you finish strong. Here are a few ways we can assist:

1. **Document Help:** We can guide you through requesting any missing documents
2. **Progress Review:** We can hop on a quick call to review what's left
3. **Timeline Planning:** We can help you set realistic goals

Would any of these be helpful? Just reply and let me know.

[Resume My Claim] [Request Assistance]

You've got this!
The RadiantClaims Team
```

---

### 3. Document Request Assistance System

#### Proactive Assistance Levels

**Level 1: Resource Provision (Automated)**
- Provide office contact info
- Supply request form templates
- Give cost estimates
- Share tips

**Level 2: Guided Support (Partially Automated)**
- Pre-fill request forms with claimant data
- Send email templates claimant can forward
- Provide phone scripts
- Track request status

**Level 3: Direct Assistance (Manual/Future)**
- RadiantClaims staff contacts office on behalf of claimant
- Follow up with offices about request status
- Expedite requests where possible
- Handle payment processing (with reimbursement)

**System Design:**
```typescript
interface DocumentRequestAssistance {
  documentType: string

  // Level 1: Automated Resources
  resourceProvider: {
    name: string
    address: string
    phone: string
    website: string
    hours: string
    cost: string
    processingTime: string
  }

  // Level 2: Pre-filled Forms
  requestForm: {
    templateUrl: string
    prefilledData: object
    submissionInstructions: string
  }

  // Level 3: Direct Assistance (Future)
  staffAssistance: {
    enabled: boolean
    requestedAt: DateTime | null
    assignedStaffId: string | null
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  }

  // Tracking
  claimantActions: {
    viewedResources: boolean
    downloadedForm: boolean
    requestedHelp: boolean
    confirmedSubmission: boolean
  }
}
```

#### Response Tracking System

**Claimant Response Options:**
```typescript
enum DocumentFollowUpResponse {
  CONTACTED_OFFICE = 'CONTACTED_OFFICE', // "I've reached out"
  NEED_HELP = 'NEED_HELP', // "I need assistance"
  ALREADY_HAVE = 'ALREADY_HAVE', // "I have this document"
  CANT_OBTAIN = 'CANT_OBTAIN', // "I can't get this document"
  WORKING_ON_IT = 'WORKING_ON_IT', // "I'm working on it"
  QUESTIONS = 'QUESTIONS', // "I have questions"
}
```

**Follow-Up Action Logic:**
```typescript
function determineNextAction(response: DocumentFollowUpResponse): NextAction {
  switch (response) {
    case 'CONTACTED_OFFICE':
      return {
        action: 'SCHEDULE_CHECK_IN',
        delay: 7, // days
        message: 'Check if document received'
      }

    case 'NEED_HELP':
      return {
        action: 'SEND_DETAILED_GUIDE',
        delay: 0, // immediate
        escalate: true
      }

    case 'ALREADY_HAVE':
      return {
        action: 'PROMPT_UPLOAD',
        delay: 0,
        message: 'Great! Please upload it now'
      }

    case 'CANT_OBTAIN':
      return {
        action: 'OFFER_ALTERNATIVES',
        delay: 0,
        escalate: true,
        message: 'Let's discuss alternative evidence'
      }

    case 'WORKING_ON_IT':
      return {
        action: 'SCHEDULE_REMINDER',
        delay: 5,
        message: 'Following up on your progress'
      }

    case 'QUESTIONS':
      return {
        action: 'STAFF_RESPONSE_NEEDED',
        delay: 0,
        escalate: true
      }
  }
}
```

---

### 4. Intelligent Follow-Up Prioritization

**Priority Scoring System:**
```typescript
interface FollowUpPriority {
  claimantId: string
  priorityScore: number // 0-100

  factors: {
    // Positive signals (increase priority)
    recentActivity: boolean // +20
    highCompletionRate: boolean // +15
    respondedToLastEmail: boolean // +10
    uploadedRecently: boolean // +15
    nearing80Percent: boolean // +20

    // Negative signals (decrease priority)
    unresponsiveCount: number // -5 per occurrence
    bouncedEmail: boolean // -30
    requestedPause: boolean // -100
    completedPacket: boolean // -100 (remove from queue)

    // Urgency factors
    daysInactive: number // -1 per day after 14 days
    missingCriticalDocs: boolean // +25
    attorneyWaiting: boolean // +30
  }

  nextFollowUpAt: DateTime
}
```

**Example Calculation:**
```typescript
Claimant A:
+ Recent activity (3 days ago): +20
+ High completion (75%): +15
+ Responded to last email: +10
+ Near 80%: +20
- Inactive 5 days: -5
= Priority Score: 60

Claimant B:
+ Uploaded yesterday: +15
+ Responded to last email: +10
- Only 25% complete: 0
- Inactive 20 days: -20
- Unresponsive 3x: -15
= Priority Score: -10 (low priority)
```

---

## Database Schema

### New Tables/Enums

```prisma
// Attorney notification preferences
model LawFirmNotificationSchedule {
  id                    String   @id @default(cuid())
  firmId                String
  firm                  LawFirm  @relation(fields: [firmId], references: [id], onDelete: Cascade)

  // Summary email settings
  summaryEmailEnabled   Boolean  @default(true)
  summaryEmailTimes     String[] @default(["06:00", "14:00"]) // HH:MM format
  timezone              String   @default("America/Denver")

  // Immediate notifications
  immediateNewClient    Boolean  @default(true)
  immediatePacketReady  Boolean  @default(true)

  // Anti-spam
  minimumActivities     Int      @default(1)
  suppressIfNoActivity  Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([firmId])
  @@index([firmId])
}

// Attorney activity log
model AttorneyActivityLog {
  id                String                  @id @default(cuid())
  firmId            String
  firm              LawFirm                 @relation(fields: [firmId], references: [id], onDelete: Cascade)
  sessionId         String?
  session           IntakeSession?          @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  claimantId        String?
  claimant          Claimant?               @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  activityType      AttorneyActivityType
  title             String                  // "New Client: Mary Johnson"
  description       String?                 // Additional context
  metadata          Json?                   // Flexible data storage

  // Tracking
  createdAt         DateTime                @default(now())
  includedInSummary Boolean                 @default(false)
  summaryEmailId    String?

  @@index([firmId, createdAt])
  @@index([sessionId])
  @@index([activityType])
}

enum AttorneyActivityType {
  NEW_CLIENT_SIGNUP
  DOCUMENT_UPLOADED
  PACKET_GENERATED
  PACKET_DOWNLOADED
  CLAIMANT_RESPONDED
  MILESTONE_REACHED
  DOCUMENT_VALIDATED
  CONTACT_INFO_UPDATED
  FOLLOW_UP_COMPLETED
  SIGNIFICANT_PROGRESS
}

// Attorney notification delivery log
model AttorneyNotificationLog {
  id                String                      @id @default(cuid())
  firmId            String
  firm              LawFirm                     @relation(fields: [firmId], references: [id], onDelete: Cascade)

  notificationType  AttorneyNotificationType
  recipients        String[]                    // Email addresses
  subject           String

  // Related entities
  sessionId         String?
  session           IntakeSession?              @relation(fields: [sessionId], references: [id])
  activityIds       String[]                    // For summary emails

  // Delivery tracking
  sentAt            DateTime                    @default(now())
  deliveredAt       DateTime?
  openedAt          DateTime?
  clickedAt         DateTime?
  bouncedAt         DateTime?

  // Anti-spam
  suppressedReason  String?                     // "NO_ACTIVITY", "USER_PREFERENCE"

  @@index([firmId, sentAt])
  @@index([notificationType])
}

enum AttorneyNotificationType {
  IMMEDIATE_NEW_CLIENT
  IMMEDIATE_PACKET_READY
  SCHEDULED_SUMMARY
}

// Client follow-up system
model ClaimantFollowUp {
  id                String                @id @default(cuid())
  claimantId        String
  claimant          Claimant              @relation(fields: [claimantId], references: [id], onDelete: Cascade)
  sessionId         String
  session           IntakeSession         @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  // Follow-up details
  followUpType      FollowUpType
  documentType      String?               // If document-specific
  phase             FollowUpPhase         @default(ACTIVE_SUPPORT)

  // Scheduling
  scheduledFor      DateTime
  sentAt            DateTime?

  // Response tracking
  responseType      FollowUpResponseType?
  respondedAt       DateTime?
  responseMetadata  Json?

  // Next action
  nextFollowUpId    String?
  completed         Boolean               @default(false)

  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  @@index([claimantId, scheduledFor])
  @@index([sessionId])
  @@index([followUpType])
}

enum FollowUpType {
  WELCOME_CHECKLIST
  DOCUMENT_SPECIFIC
  PROGRESS_MILESTONE
  RE_ENGAGEMENT
  GENERAL_CHECK_IN
}

enum FollowUpPhase {
  ACTIVE_SUPPORT    // Days 1-14
  MAINTENANCE       // Days 15-60
  PAUSED            // User requested or auto-paused
}

enum FollowUpResponseType {
  CONTACTED_OFFICE
  NEED_HELP
  ALREADY_HAVE
  CANT_OBTAIN
  WORKING_ON_IT
  QUESTIONS
}

// Document request assistance
model DocumentRequestAssistance {
  id                    String                        @id @default(cuid())
  claimantId            String
  claimant              Claimant                      @relation(fields: [claimantId], references: [id], onDelete: Cascade)
  sessionId             String
  session               IntakeSession                 @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  documentType          String
  assistanceLevel       DocumentAssistanceLevel       @default(RESOURCE_PROVISION)

  // Resource provider info
  providerName          String?
  providerContact       Json?                         // {phone, address, website, hours}
  estimatedCost         String?
  estimatedTime         String?

  // Pre-filled forms
  formTemplateUrl       String?
  formPrefilledData     Json?

  // Staff assistance (Level 3)
  staffAssistanceRequested Boolean                    @default(false)
  assignedStaffId       String?
  assignedStaff         User?                         @relation(fields: [assignedStaffId], references: [id])
  staffStatus           StaffAssistanceStatus?

  // Claimant actions
  viewedResources       Boolean                       @default(false)
  downloadedForm        Boolean                       @default(false)
  requestedHelp         Boolean                       @default(false)
  confirmedSubmission   Boolean                       @default(false)

  createdAt             DateTime                      @default(now())
  updatedAt             DateTime                      @updatedAt

  @@index([claimantId])
  @@index([sessionId])
  @@index([documentType])
}

enum DocumentAssistanceLevel {
  RESOURCE_PROVISION    // Level 1: Automated
  GUIDED_SUPPORT        // Level 2: Pre-filled forms
  DIRECT_ASSISTANCE     // Level 3: Staff intervention
}

enum StaffAssistanceStatus {
  PENDING
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  FAILED
}

// Follow-up priority queue
model FollowUpPriorityQueue {
  id                    String   @id @default(cuid())
  claimantId            String   @unique
  claimant              Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  priorityScore         Int      @default(50) // 0-100

  // Scoring factors
  recentActivity        Boolean  @default(false)
  highCompletionRate    Boolean  @default(false)
  respondedToLastEmail  Boolean  @default(false)
  uploadedRecently      Boolean  @default(false)
  nearingCompletion     Boolean  @default(false)
  unresponsiveCount     Int      @default(0)
  bouncedEmail          Boolean  @default(false)
  requestedPause        Boolean  @default(false)
  daysInactive          Int      @default(0)
  missingCriticalDocs   Boolean  @default(false)
  attorneyWaiting       Boolean  @default(false)

  nextFollowUpAt        DateTime

  updatedAt             DateTime @updatedAt

  @@index([priorityScore, nextFollowUpAt])
  @@index([nextFollowUpAt])
}
```

---

## Email Templates

### Template Structure

All templates extend base React Email layout:

```typescript
// src/emails/components/AttorneyEmailLayout.tsx
export function AttorneyEmailLayout({ children }) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Attorney-specific branding */}
          <Section style={headerStyle}>
            <Img src="logo-attorney.png" alt="RadiantClaims" />
            <Text style={subheaderStyle}>Attorney Portal</Text>
          </Section>

          {children}

          {/* Footer */}
          <Section style={footerStyle}>
            <Link href="/attorney/dashboard">Attorney Dashboard</Link>
            <Link href="/attorney/settings">Notification Settings</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Required Templates

```
src/emails/
├── attorney/
│   ├── new-client-notification.tsx
│   ├── activity-summary.tsx
│   └── packet-ready-notification.tsx
│
└── client/
    ├── document-follow-up.tsx
    ├── progress-milestone.tsx
    ├── re-engagement.tsx
    └── document-assistance.tsx
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### Day 1-2: Database Schema
- [ ] Add new Prisma models
- [ ] Create and run migrations
- [ ] Seed test data for development

#### Day 3-4: Email Templates
- [ ] Create attorney notification templates
- [ ] Create client follow-up templates
- [ ] Test rendering and responsiveness

#### Day 5: Core Email Functions
- [ ] `sendAttorneyNewClientNotification()`
- [ ] `sendAttorneyActivitySummary()`
- [ ] `sendClientFollowUp()`

---

### Phase 2: Attorney Notifications (Week 2)

#### Day 1-2: Immediate Notifications
- [ ] Hook into client signup flow
- [ ] Hook into packet generation
- [ ] Add activity logging
- [ ] Test delivery

#### Day 3-4: Scheduled Summaries
- [ ] Create scheduled job system (cron or queue)
- [ ] Build summary aggregation logic
- [ ] Implement anti-spam filters
- [ ] Test at configured times

#### Day 5: Activity Dashboard
- [ ] Build `/attorney/dashboard/activity` page
- [ ] Create activity feed component
- [ ] Add filtering and search
- [ ] Test with sample data

---

### Phase 3: Client Follow-Ups (Week 3)

#### Day 1-2: Follow-Up Scheduler
- [ ] Build follow-up cadence engine
- [ ] Create priority scoring system
- [ ] Implement smart scheduling
- [ ] Test phase transitions

#### Day 3-4: Response Tracking
- [ ] Create response capture endpoints
- [ ] Build next-action logic
- [ ] Add response tracking UI
- [ ] Test workflows

#### Day 5: Document Assistance
- [ ] Build resource provider database
- [ ] Create pre-filled form system
- [ ] Add assistance level logic
- [ ] Test with real resources

---

### Phase 4: Testing & Optimization (Week 4)

#### Day 1-2: End-to-End Testing
- [ ] Test full attorney notification flow
- [ ] Test full client follow-up flow
- [ ] Load test with 100s of notifications
- [ ] Fix bugs and edge cases

#### Day 3: Analytics & Monitoring
- [ ] Add Mixpanel/PostHog events
- [ ] Create notification dashboards
- [ ] Set up alerting for failures
- [ ] Document metrics

#### Day 4-5: Documentation & Training
- [ ] Update attorney onboarding docs
- [ ] Create video tutorials
- [ ] Write admin operations guide
- [ ] Train support staff

---

## Open Questions & Research

### 1. Third-Party Contact Authorization

**Question:** Can RadiantClaims legally contact vital records offices, medical providers, etc. on behalf of claimants?

**Research Needed:**
- HIPAA implications for medical records
- State laws on vital records requests
- Power of attorney requirements
- Fee payment authorization

**Recommendation:**
- Start with Level 1 & 2 (resources + guided support)
- Add Level 3 (direct assistance) after legal review
- Require explicit client authorization for direct contact

---

### 2. Optimal Summary Frequency

**Question:** What's the right balance between keeping attorneys informed and avoiding email fatigue?

**A/B Test Plan:**
```
Group A: 2 emails/day (6am, 2pm)
Group B: 1 email/day (8am)
Group C: 3 emails/day (6am, 2pm, 8pm)

Metrics:
- Open rate
- Click-through rate
- Unsubscribe rate
- Attorney satisfaction survey
- Time to review packets
```

**Hypothesis:** 2 emails/day will have highest engagement without causing fatigue.

---

### 3. Follow-Up Response Rates

**Question:** What follow-up cadence drives the highest document completion rate?

**Test Variations:**
```
Cadence A: Days 1, 3, 5, 7, 10, 14 (aggressive)
Cadence B: Days 1, 5, 10, 14, 21 (moderate)
Cadence C: Days 1, 7, 14, 28 (gentle)

Measure:
- Response rate by email #
- Document completion rate
- Time to complete claim
- Unsubscribe rate
```

---

### 4. Attorney Activity Table Design

**User Research Needed:**
- What information do attorneys prioritize?
- What actions do they take most frequently?
- How do they currently track claims?
- What causes them to miss important updates?

**Proposed Research:**
- Interview 5 attorneys in pilot program
- Show mockups and gather feedback
- Observe current workflow
- Iterate based on findings

---

## Success Metrics

### Attorney Engagement
- **Open Rate:** > 60% for immediate notifications, > 40% for summaries
- **Click-Through Rate:** > 30%
- **Time to Review:** < 24 hours for "Packet Ready" notifications
- **Satisfaction Score:** > 8/10

### Client Completion
- **Response Rate:** > 40% on follow-up emails
- **Document Upload Rate:** +25% compared to no follow-ups
- **Time to Complete:** -30% reduction
- **Abandonment Rate:** -40% reduction

### System Health
- **Email Delivery Rate:** > 98%
- **Bounce Rate:** < 2%
- **Unsubscribe Rate:** < 1%
- **Processing Latency:** < 5 minutes for immediate notifications

---

## Risk Mitigation

### Email Deliverability
- **Risk:** Emails marked as spam
- **Mitigation:**
  - Proper SPF/DKIM/DMARC setup
  - Gradual volume ramp-up
  - Monitor sender reputation
  - Double opt-in for attorneys

### System Overload
- **Risk:** Too many notifications to process
- **Mitigation:**
  - Use queue system (BullMQ or similar)
  - Rate limiting per recipient
  - Background job processing
  - Horizontal scaling capability

### Data Privacy
- **Risk:** Exposing PII in notifications
- **Mitigation:**
  - Encrypt sensitive data in emails
  - Use portal links instead of inline data
  - Audit all email content
  - HIPAA compliance review

### User Fatigue
- **Risk:** Too many emails cause opt-outs
- **Mitigation:**
  - Granular control in settings
  - Smart suppression logic
  - Regular user feedback surveys
  - A/B test frequencies

---

## Admin Dashboard Integration

### Overview

The admin dashboard already exists at `/admin` and includes:
- ✅ User statistics
- ✅ Claims/intake metrics
- ✅ AI review stats
- ✅ Subscription/revenue tracking
- ✅ Recent activity feed (last 10 audit logs)

### Required Enhancements

To support the notification system, the admin dashboard needs to display the same activity types that trigger attorney notifications and client follow-ups.

---

### 1. Enhanced Activity Feed

**Current State:**
- Shows last 10 `AuditLog` entries
- Generic action names
- Basic user attribution

**Required Updates:**

#### Add New Activity Types
Extend the activity feed to show notification-relevant events:

```typescript
// src/app/api/admin/dashboard/route.ts

const notificationActivity = await prisma.$queryRaw`
  SELECT
    'NEW_CLIENT' as type,
    s.id,
    c."firstName" || ' ' || c."lastName" as claimant_name,
    s."createdAt" as timestamp,
    ss.tier
  FROM "IntakeSession" s
  JOIN "Claimant" c ON c.id = s."claimantId"
  LEFT JOIN "ServiceSubscription" ss ON ss."intakeSessionId" = s.id
  WHERE s."createdAt" >= ${weekAgo}
  ORDER BY s."createdAt" DESC
  LIMIT 20
`

const packetActivity = await prisma.packetSubmission.findMany({
  where: {
    status: 'READY',
    readyAt: { gte: weekAgo }
  },
  include: {
    intakeSession: {
      include: { claimant: true }
    }
  },
  orderBy: { readyAt: 'desc' },
  take: 20
})

const documentActivity = await prisma.uploadedFile.findMany({
  where: {
    uploadedAt: { gte: weekAgo }
  },
  include: {
    intakeSession: {
      include: { claimant: true }
    }
  },
  orderBy: { uploadedAt: 'desc' },
  take: 20
})

// Merge and sort all activities by timestamp
const allActivity = [
  ...notificationActivity.map(a => ({
    id: a.id,
    type: 'NEW_CLIENT',
    message: `New client: ${a.claimant_name} (${a.tier || 'No subscription'})`,
    timestamp: a.timestamp,
    priority: 'high'
  })),
  ...packetActivity.map(p => ({
    id: p.id,
    type: 'PACKET_READY',
    message: `Packet ready: ${p.intakeSession.claimant.firstName} ${p.intakeSession.claimant.lastName}`,
    timestamp: p.readyAt,
    priority: 'high'
  })),
  ...documentActivity.map(d => ({
    id: d.id,
    type: 'DOCUMENT_UPLOADED',
    message: `Document uploaded by ${d.intakeSession.claimant.firstName}: ${d.category}`,
    timestamp: d.uploadedAt,
    priority: 'medium'
  })),
  ...formattedActivity.map(a => ({ ...a, priority: 'low' }))
]
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .slice(0, 50) // Show last 50 activities
```

#### Activity Type Icons & Colors

```typescript
// src/app/admin/page.tsx

const activityIcons = {
  NEW_CLIENT: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
  PACKET_READY: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  DOCUMENT_UPLOADED: { icon: Upload, color: 'text-purple-600', bg: 'bg-purple-100' },
  CLAIMANT_RESPONDED: { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' },
  MILESTONE_REACHED: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  // ... other types
}
```

---

### 2. Activity Filtering & Search

Add filter controls above the activity feed:

```typescript
// New UI component
<div className="flex gap-4 mb-4">
  <Select value={activityFilter} onValueChange={setActivityFilter}>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="All Activity" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Activity</SelectItem>
      <SelectItem value="NEW_CLIENT">New Clients</SelectItem>
      <SelectItem value="PACKET_READY">Packets Ready</SelectItem>
      <SelectItem value="DOCUMENT_UPLOADED">Documents</SelectItem>
      <SelectItem value="CLAIMANT_RESPONDED">Responses</SelectItem>
    </SelectContent>
  </Select>

  <Select value={timeRange} onValueChange={setTimeRange}>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="Last 24 Hours" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1h">Last Hour</SelectItem>
      <SelectItem value="24h">Last 24 Hours</SelectItem>
      <SelectItem value="7d">Last 7 Days</SelectItem>
      <SelectItem value="30d">Last 30 Days</SelectItem>
    </SelectContent>
  </Select>

  <Input
    placeholder="Search claimant..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-64"
  />
</div>
```

---

### 3. Real-Time Updates (Optional)

For truly live monitoring, add real-time updates:

```typescript
// Option 1: Polling (Simple)
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardStats()
  }, 30000) // Refresh every 30 seconds

  return () => clearInterval(interval)
}, [])

// Option 2: WebSockets (Advanced - Future)
// Use Pusher, Ably, or custom WebSocket server
// Subscribe to activity events and update UI instantly
```

---

### 4. Enhanced Metrics Cards

Add notification-specific metrics to the dashboard:

```typescript
// New metrics to track
interface NotificationMetrics {
  attorneyNotifications: {
    sentToday: number
    openRate: number // % of emails opened
    clickRate: number // % clicked through
  }
  clientFollowUps: {
    sentToday: number
    responseRate: number
    pendingResponses: number
  }
  systemHealth: {
    emailDeliveryRate: number
    bounceRate: number
    queueDepth: number // Pending notifications
  }
}
```

Add these as new stat cards:

```tsx
<Card>
  <CardContent className="flex items-center p-6">
    <div className="rounded-full bg-indigo-100 p-3">
      <Mail className="h-6 w-6 text-indigo-600" />
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-600">
        Notifications Today
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {stats.attorneyNotifications.sentToday + stats.clientFollowUps.sentToday}
      </p>
      <p className="text-xs text-gray-500">
        {stats.attorneyNotifications.openRate.toFixed(0)}% open rate
      </p>
    </div>
  </CardContent>
</Card>
```

---

### 5. Client Follow-Up Monitor

Add a dedicated section for monitoring follow-up campaigns:

```tsx
{/* Client Follow-Up Status */}
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Client Follow-Up Pipeline</CardTitle>
    <CardDescription>Active follow-up campaigns</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Phase 1: Active Support */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Active Support (Days 1-14)</span>
          <span className="text-sm text-gray-600">{stats.followUps.activeSupport} claimants</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${(stats.followUps.activeSupport / stats.claims.inProgress) * 100}%` }}
          />
        </div>
      </div>

      {/* Phase 2: Maintenance */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Maintenance (Days 15-60)</span>
          <span className="text-sm text-gray-600">{stats.followUps.maintenance} claimants</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(stats.followUps.maintenance / stats.claims.inProgress) * 100}%` }}
          />
        </div>
      </div>

      {/* Pending Responses */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Pending Responses</span>
          <Badge variant="outline">{stats.followUps.pendingResponses}</Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Claimants who haven't responded to last follow-up
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 6. Attorney Portal Activity Monitor

Show what attorneys are seeing/doing:

```tsx
{/* Attorney Portal Activity */}
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Attorney Portal Activity</CardTitle>
    <CardDescription>What attorneys are seeing today</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
        <div>
          <p className="text-sm font-medium">Summary Emails Sent</p>
          <p className="text-xs text-gray-500">Morning & afternoon digests</p>
        </div>
        <Badge>{stats.attorneyActivity.summariesSent}</Badge>
      </div>

      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
        <div>
          <p className="text-sm font-medium">New Client Alerts</p>
          <p className="text-xs text-gray-500">Immediate notifications</p>
        </div>
        <Badge>{stats.attorneyActivity.newClientAlerts}</Badge>
      </div>

      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
        <div>
          <p className="text-sm font-medium">Packet Ready Notifications</p>
          <p className="text-xs text-gray-500">Ready for attorney review</p>
        </div>
        <Badge>{stats.attorneyActivity.packetReadyAlerts}</Badge>
      </div>

      <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
        <div>
          <p className="text-sm font-medium text-blue-900">Avg. Response Time</p>
          <p className="text-xs text-blue-600">Time to review after notification</p>
        </div>
        <Badge variant="outline">{stats.attorneyActivity.avgResponseTime}</Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 7. Database Schema Updates

The admin dashboard will read from these new tables (defined in the notification system design):

```prisma
// Already in notification design:
- AttorneyActivityLog
- AttorneyNotificationLog
- ClaimantFollowUp
- FollowUpPriorityQueue
```

No additional schema changes needed for admin - just query these tables.

---

### Implementation Checklist for Admin Dashboard

```typescript
// Phase 1: Enhanced Activity Feed
[ ] Update /api/admin/dashboard to include notification activities
[ ] Add activity type filtering
[ ] Add time range filtering
[ ] Add search functionality
[ ] Add activity icons and colors
[ ] Increase activity list from 10 to 50 items

// Phase 2: Notification Metrics
[ ] Add attorneyNotifications stats to dashboard API
[ ] Add clientFollowUps stats to dashboard API
[ ] Add systemHealth metrics
[ ] Create new metric cards in UI

// Phase 3: Follow-Up Monitoring
[ ] Add follow-up pipeline visualization
[ ] Show claimants by phase
[ ] Display pending responses count
[ ] Add response rate tracking

// Phase 4: Attorney Portal Monitor
[ ] Track attorney email sends
[ ] Track attorney engagement metrics
[ ] Display average response time
[ ] Show attorney portal usage stats

// Phase 5: Real-Time Updates (Optional)
[ ] Add 30-second polling
[ ] Add manual refresh button
[ ] Consider WebSocket implementation for future
```

---

### API Response Schema Update

```typescript
// Updated response from /api/admin/dashboard

interface AdminDashboardStats {
  // Existing stats...
  users: { ... }
  claims: { ... }
  aiReview: { ... }
  subscriptions: { ... }
  waitlist: { ... }
  promoCodes: { ... }
  recentActivity: [ ... ]

  // NEW: Notification system stats
  attorneyNotifications: {
    sentToday: number
    sentThisWeek: number
    openRate: number // 0-100
    clickRate: number // 0-100
    summariesSent: number
    newClientAlerts: number
    packetReadyAlerts: number
  }

  clientFollowUps: {
    sentToday: number
    sentThisWeek: number
    responseRate: number // 0-100
    pendingResponses: number
    activeSupport: number // Claimants in phase 1
    maintenance: number // Claimants in phase 2
    paused: number // Claimants who paused follow-ups
  }

  attorneyActivity: {
    summariesSent: number
    newClientAlerts: number
    packetReadyAlerts: number
    avgResponseTime: string // e.g., "4.2 hours"
    packetsReviewed: number
    packetsDownloaded: number
  }

  systemHealth: {
    emailDeliveryRate: number // 0-100
    bounceRate: number // 0-100
    queueDepth: number // Pending notifications
    failedDeliveries: number
  }
}
```

---

## Next Steps
   - Present this design to Brandon and attorney partner
   - Gather feedback and iterate
   - Finalize requirements

2. **Technical Spike** (2-3 days)
   - Evaluate job queue systems (BullMQ vs Inngest vs Trigger.dev)
   - Test email template rendering
   - Validate database schema design

3. **Build Phase** (3-4 weeks)
   - Follow implementation plan above
   - Daily standups to track progress
   - Weekly demos to stakeholders

4. **Pilot Program** (2-4 weeks)
   - Launch with 1-2 attorneys
   - 10-20 test claimants
   - Gather metrics and feedback
   - Iterate rapidly

5. **Full Launch** (After pilot success)
   - Roll out to all attorneys
   - Enable for all new claimants
   - Monitor metrics closely
   - Continue optimization

---

**Document Version:** 1.0
**Last Updated:** November 13, 2025
**Next Review:** After stakeholder feedback

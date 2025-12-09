# Packet Pulse System - Comprehensive Specification

**Date**: December 8, 2024
**Status**: 📋 PLANNING
**Purpose**: Predictive analytics and timeline tracking system for RECA claim lifecycle

---

## 🎯 System Overview

The Packet Pulse system provides real-time, data-driven insights into claim progress by:
1. **Pre-Submission Tracking** - Shows what's needed before packet can be mailed
2. **Submission Readiness Score** - Indicates how close claim is to being submitted
3. **Post-Submission Benchmarking** - Compares claim progress to aggregate data
4. **Predictive Timelines** - Projects future milestones based on historical averages
5. **Rolling Analytics** - Updates projections as new data comes in

---

## 📊 System Architecture

### Two-Phase Lifecycle

#### Phase 1: Pre-Submission (Internal Tracking)
- **Claim ID**: Internal system ID assigned at creation
- **Status**: Building packet, gathering documents
- **Goal**: Track completion percentage and readiness

#### Phase 2: Post-Submission (Government Tracking)
- **DOJ Claim Number**: Government-assigned ID (comes later)
- **Status**: In DOJ system, under review, payment processing
- **Goal**: Track government processing speed and predict completion

---

## 🔧 Core Components

### 1. Pre-Submission Readiness Tracker

#### Purpose
Help users understand what's needed before packet can be submitted to DOJ.

#### Features

**Completion Checklist** with real-time tracking:
- [ ] Personal Information (name, DOB, SSN, address)
- [ ] Exposure Documentation (location, dates, proof of presence)
- [ ] Medical Documentation (diagnosis, medical records)
- [ ] Supporting Documents (birth certificate, marriage certificate, etc.)
- [ ] Affidavits (if applicable)
- [ ] Representative Information (attorney/POA if applicable)
- [ ] Signature & Certification

**Readiness Score**:
```
Readiness = (Completed Items / Total Required Items) × 100%
```

**Status Indicators**:
- 🔴 **0-33%**: Just Getting Started
- 🟡 **34-66%**: Making Progress
- 🟢 **67-99%**: Almost Ready
- ✅ **100%**: Ready to Submit

**Pre-Submission Milestones**:
1. `CLAIM_CREATED` - User started claim
2. `ELIGIBILITY_CONFIRMED` - Passed eligibility check
3. `DOCUMENTS_GATHERING` - Collecting required documents
4. `DOCUMENTS_COMPLETE` - All documents uploaded
5. `REVIEW_IN_PROGRESS` - Staff reviewing packet
6. `REVIEW_APPROVED` - Ready to mail
7. `READY_TO_SUBMIT` - Packet ready, awaiting final authorization

#### UI Display

```
┌─────────────────────────────────────────────┐
│ 📦 Packet Readiness                         │
├─────────────────────────────────────────────┤
│                                             │
│  Progress: 67% (8/12 items complete)        │
│  ████████████░░░░ 🟢 Almost Ready          │
│                                             │
│  ✅ Personal Information                    │
│  ✅ Exposure Documentation                  │
│  ✅ Medical Records (3 documents)           │
│  ⏳ Birth Certificate (pending upload)      │
│  ⏳ Affidavit (in progress)                 │
│  ❌ Signature Required                      │
│                                             │
│  📍 Next Steps:                             │
│  1. Upload birth certificate               │
│  2. Complete affidavit form                 │
│  3. Review and sign packet                  │
│                                             │
│  🎯 Estimated time to ready: 3-5 days      │
│     (Based on similar claims)               │
└─────────────────────────────────────────────┘
```

---

### 2. Post-Submission Benchmarking System

#### Purpose
Once packet is submitted, track government processing speed and provide context.

#### Tracked Milestones & Timing

| Milestone | Description | Avg Time | Our Goal |
|-----------|-------------|----------|----------|
| **SUBMITTED_TO_DOJ** | Packet mailed to DOJ | Day 0 | Day 0 |
| **RECEIVED_BY_DOJ** | DOJ logs receipt | 7-14 days | 10 days |
| **CLAIM_NUMBER_ASSIGNED** | DOJ assigns claim # | 14-21 days | 15 days |
| **COMPLETENESS_REVIEW** | Document review | 30-60 days | 45 days |
| **ELIGIBILITY_REVIEW** | Eligibility determination | 60-120 days | 90 days |
| **APPROVED** | Claim approved | 120-180 days | 150 days |
| **PAYMENT_PROCESSING** | Treasury processing | 30-60 days | 45 days |
| **PAYMENT_ISSUED** | Check mailed | +7-14 days | 10 days |
| **PAYMENT_RECEIVED** | Claimant receives check | +3-7 days | 5 days |

#### Rolling Average Calculations

**Time Windows**:
- Last 7 days
- Last 30 days
- Last 90 days
- Last 6 months
- All time

**Metrics Tracked**:
```typescript
interface MilestoneMetrics {
  milestone: DOJMilestone;

  // Timing data
  averageDays: number;        // Mean time to reach this milestone
  medianDays: number;         // Median (more resistant to outliers)
  minDays: number;            // Fastest observed
  maxDays: number;            // Slowest observed

  // Statistical
  standardDeviation: number;  // Measure of variance
  percentile25: number;       // 25th percentile
  percentile75: number;       // 75th percentile
  percentile90: number;       // 90th percentile

  // Sample size
  sampleSize: number;         // How many claims in this window

  // Trend
  trend: "FASTER" | "SLOWER" | "STABLE";
  trendPercentage: number;    // % change vs previous period
}
```

#### UI Display

```
┌─────────────────────────────────────────────┐
│ 🎯 Packet Pulse - Your Claim Timeline      │
├─────────────────────────────────────────────┤
│                                             │
│  Current Status: RECEIVED_BY_DOJ            │
│  Days in Current Stage: 8 days              │
│  Total Processing Time: 15 days             │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  📊 How You Compare (Last 30 Days):         │
│                                             │
│  ✅ Submitted to DOJ                        │
│     You: Day 0 | Avg: Day 0                │
│                                             │
│  ✅ Received by DOJ                         │
│     You: 12 days | Avg: 10 days (±3)       │
│     📈 Slightly slower than average         │
│                                             │
│  ⏳ Claim Number Assignment (NEXT)          │
│     Expected: 3-8 days from now             │
│     Avg: 15 days | Fastest: 10 days        │
│     📊 Based on 47 recent claims            │
│                                             │
│  ⏳ Completeness Review                     │
│     Expected: ~30 days from now             │
│     Avg: 45 days | Range: 30-60 days       │
│                                             │
│  ⏳ Eligibility Review                      │
│     Expected: ~75 days from now             │
│     Avg: 90 days | Range: 60-120 days      │
│                                             │
│  ⏳ Approval Decision                       │
│     Expected: ~135 days from now            │
│     Avg: 150 days | Range: 120-180 days    │
│                                             │
│  🎯 Projected Completion: May 15, 2025     │
│     (Based on current pace)                 │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  📈 Processing Trends (Last 30 days):       │
│                                             │
│  • Claim ID Assignment: 🟢 2 days faster   │
│  • Completeness Review: 🟡 Stable          │
│  • Eligibility Review: 🔴 5 days slower    │
│  • Approval to Payment: 🟢 3 days faster   │
│                                             │
│  💡 Insight: DOJ is currently processing    │
│     eligibility reviews slower than usual.  │
│     This may affect your timeline.          │
└─────────────────────────────────────────────┘
```

---

### 3. Document-Specific Tracking

#### Special Document Types

Some documents have their own timelines:

**Cancer Registry Documentation**
- Request submitted to state
- Expected receipt: 4-8 weeks
- Status tracking: Pending, Received, Uploaded to claim

**Residential Documentation (COJCoLDS)**
- Church of Jesus Christ of Latter-day Saints records
- Request submitted
- Expected receipt: 2-6 weeks
- Status tracking: Pending, Received, Uploaded to claim

**Medical Records**
- Hospital/provider requests
- Expected receipt: 2-4 weeks per provider
- Status tracking per provider

#### Document Timeline UI

```
┌─────────────────────────────────────────────┐
│ 📄 Document Status Tracker                  │
├─────────────────────────────────────────────┤
│                                             │
│  Cancer Registry Documentation              │
│  ⏳ Requested: Nov 15, 2024                 │
│  📅 Expected: Dec 13-Jan 10, 2025           │
│  📊 Avg Receipt: 5 weeks (±2 weeks)         │
│  🔔 Reminder: Follow up in 4 weeks          │
│                                             │
│  COJCoLDS Records                           │
│  ✅ Received: Nov 28, 2024                  │
│  ⏱️  Took: 3 weeks (faster than avg)        │
│  📁 Uploaded to claim                       │
│                                             │
│  Medical Records - St. Mary's Hospital      │
│  ⏳ Requested: Nov 20, 2024                 │
│  📅 Expected: Dec 11-25, 2024               │
│  📊 Avg Receipt: 3 weeks (±1 week)          │
│                                             │
│  Medical Records - Dr. Johnson              │
│  ❌ Not yet requested                       │
│  💡 Tip: Request now to avoid delays        │
└─────────────────────────────────────────────┘
```

---

## 💾 Database Schema Extensions

### New Tables

#### 1. `PacketReadinessItem`
Tracks individual checklist items for pre-submission.

```prisma
model PacketReadinessItem {
  id          String   @id @default(cuid())
  claimantId  String
  claimant    Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  // Item details
  itemType    ReadinessItemType
  itemName    String
  description String?
  required    Boolean  @default(true)

  // Status
  status      ReadinessStatus @default(PENDING)
  completedAt DateTime?

  // Dependencies
  dependsOn   String[] // Array of other item IDs that must complete first

  // Tracking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([claimantId])
  @@index([status])
}

enum ReadinessItemType {
  PERSONAL_INFO
  EXPOSURE_DOCUMENTATION
  MEDICAL_RECORDS
  BIRTH_CERTIFICATE
  MARRIAGE_CERTIFICATE
  AFFIDAVIT
  SIGNATURE
  ATTORNEY_INFO
  OTHER_DOCUMENT
}

enum ReadinessStatus {
  PENDING           // Not started
  IN_PROGRESS       // User working on it
  AWAITING_UPLOAD   // Document created, needs upload
  UPLOADED          // Uploaded, awaiting review
  APPROVED          // Staff approved
  NEEDS_REVISION    // Staff requested changes
  COMPLETED         // Fully complete
}
```

#### 2. `DocumentRequest`
Tracks external document requests (cancer registry, COJCoLDS, medical records).

```prisma
model DocumentRequest {
  id               String   @id @default(cuid())
  claimantId       String
  claimant         Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  // Request details
  documentType     DocumentRequestType
  provider         String?  // Hospital, state agency, etc.
  description      String?

  // Status
  status           DocumentRequestStatus @default(PENDING)
  requestedAt      DateTime @default(now())
  receivedAt       DateTime?
  uploadedAt       DateTime?

  // Timeline predictions
  expectedDaysMin  Int?     // Minimum expected days
  expectedDaysMax  Int?     // Maximum expected days

  // Follow-up
  followUpDate     DateTime?
  followUpNotes    String?

  // Tracking
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([claimantId])
  @@index([status])
  @@index([documentType])
}

enum DocumentRequestType {
  CANCER_REGISTRY
  COJCOLDS_RECORDS
  MEDICAL_RECORDS
  EMPLOYMENT_RECORDS
  SCHOOL_RECORDS
  OTHER
}

enum DocumentRequestStatus {
  PENDING           // Not yet requested
  REQUESTED         // Request sent
  FOLLOW_UP_NEEDED  // Need to follow up
  RECEIVED          // Document received
  UPLOADED          // Uploaded to claim
  COMPLETED         // Fully processed
  CANCELLED         // No longer needed
}
```

#### 3. `MilestoneBenchmark`
Stores aggregate timing data for benchmarking.

```prisma
model MilestoneBenchmark {
  id                String       @id @default(cuid())

  // Milestone info
  milestone         DOJMilestone
  fromMilestone     DOJMilestone? // Previous milestone (for calculating deltas)

  // Time window
  windowStart       DateTime
  windowEnd         DateTime
  windowType        BenchmarkWindow

  // Timing statistics (in days)
  averageDays       Float
  medianDays        Float
  minDays           Int
  maxDays           Int
  stdDeviation      Float
  percentile25      Float
  percentile50      Float
  percentile75      Float
  percentile90      Float

  // Sample info
  sampleSize        Int

  // Trend analysis
  trend             TrendDirection
  trendPercentage   Float?       // % change from previous period

  // Metadata
  calculatedAt      DateTime @default(now())

  @@index([milestone, windowType])
  @@index([calculatedAt])
}

enum BenchmarkWindow {
  LAST_7_DAYS
  LAST_30_DAYS
  LAST_90_DAYS
  LAST_6_MONTHS
  ALL_TIME
}

enum TrendDirection {
  FASTER
  SLOWER
  STABLE
}
```

#### 4. Extensions to `ClaimLifecycle`

Add pre-submission milestones:

```prisma
model ClaimLifecycle {
  // ... existing fields ...

  // Pre-submission tracking
  readinessScore        Float    @default(0)  // 0-100
  readinessStatus       ReadinessPhase @default(CLAIM_CREATED)

  // Pre-submission dates
  claimCreatedAt        DateTime @default(now())
  eligibilityConfirmedAt DateTime?
  documentsCompleteAt   DateTime?
  reviewApprovedAt      DateTime?
  readyToSubmitAt       DateTime?

  // Predictive fields
  estimatedSubmitDate   DateTime?
  estimatedApprovalDate DateTime?
  estimatedPaymentDate  DateTime?

  // ... existing fields ...
}

enum ReadinessPhase {
  CLAIM_CREATED
  ELIGIBILITY_CONFIRMED
  DOCUMENTS_GATHERING
  DOCUMENTS_COMPLETE
  REVIEW_IN_PROGRESS
  REVIEW_APPROVED
  READY_TO_SUBMIT
}
```

---

## 🔄 Data Flow & Calculation Logic

### 1. Pre-Submission Readiness Calculation

**Triggered on**:
- Document upload
- Form completion
- Staff approval
- Any checklist item status change

**Process**:
```typescript
async function calculateReadinessScore(claimantId: string): Promise<number> {
  // Get all readiness items for this claim
  const items = await db.packetReadinessItem.findMany({
    where: { claimantId, required: true }
  });

  // Count completed items
  const completedItems = items.filter(
    item => item.status === "COMPLETED" || item.status === "APPROVED"
  );

  // Calculate percentage
  const score = (completedItems.length / items.length) * 100;

  // Update lifecycle
  await db.claimLifecycle.update({
    where: { claimantId },
    data: {
      readinessScore: score,
      readinessStatus: determineReadinessPhase(items)
    }
  });

  return score;
}
```

### 2. Benchmark Calculation (Nightly Cron Job)

**Schedule**: Run daily at 2:00 AM

**Process**:
```typescript
async function calculateBenchmarks() {
  const windows: BenchmarkWindow[] = [
    "LAST_7_DAYS",
    "LAST_30_DAYS",
    "LAST_90_DAYS",
    "LAST_6_MONTHS"
  ];

  for (const window of windows) {
    for (const milestone of DOJMilestones) {
      const stats = await calculateMilestoneStats(milestone, window);

      await db.milestoneBenchmark.create({
        data: {
          milestone,
          windowType: window,
          ...stats,
          calculatedAt: new Date()
        }
      });
    }
  }
}

async function calculateMilestoneStats(
  milestone: DOJMilestone,
  window: BenchmarkWindow
): Promise<MilestoneStats> {
  // Get date range for window
  const { startDate, endDate } = getWindowDates(window);

  // Query all claims that reached this milestone in window
  const claims = await db.claimLifecycle.findMany({
    where: {
      currentMilestone: milestone,
      currentMilestoneDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      submittedToDOJAt: true,
      currentMilestoneDate: true
    }
  });

  // Calculate days from submission to milestone
  const daysCounts = claims.map(claim => {
    const days = differenceInDays(
      claim.currentMilestoneDate,
      claim.submittedToDOJAt
    );
    return days;
  }).sort((a, b) => a - b);

  return {
    averageDays: mean(daysCounts),
    medianDays: median(daysCounts),
    minDays: Math.min(...daysCounts),
    maxDays: Math.max(...daysCounts),
    stdDeviation: standardDeviation(daysCounts),
    percentile25: percentile(daysCounts, 25),
    percentile50: percentile(daysCounts, 50),
    percentile75: percentile(daysCounts, 75),
    percentile90: percentile(daysCounts, 90),
    sampleSize: claims.length,
    trend: calculateTrend(milestone, window),
    trendPercentage: calculateTrendPercentage(milestone, window)
  };
}
```

### 3. Predictive Timeline Generation

**Triggered on**:
- User views claim dashboard
- Claim status changes
- Benchmarks update

**Process**:
```typescript
async function generatePredictiveTimeline(claimantId: string) {
  const lifecycle = await db.claimLifecycle.findUnique({
    where: { claimantId }
  });

  const currentMilestone = lifecycle.currentMilestone;
  const currentDate = new Date();

  // Get benchmarks for remaining milestones
  const futureMilestones = getMilestonesAfter(currentMilestone);

  const predictions = [];
  let runningDate = currentDate;

  for (const milestone of futureMilestones) {
    const benchmark = await db.milestoneBenchmark.findFirst({
      where: {
        milestone,
        windowType: "LAST_30_DAYS"
      },
      orderBy: { calculatedAt: "desc" }
    });

    if (benchmark) {
      // Use median (more resistant to outliers)
      const daysToAdd = benchmark.medianDays;
      runningDate = addDays(runningDate, daysToAdd);

      predictions.push({
        milestone,
        expectedDate: runningDate,
        minDate: addDays(runningDate, -benchmark.stdDeviation),
        maxDate: addDays(runningDate, benchmark.stdDeviation),
        confidence: calculateConfidence(benchmark.sampleSize)
      });
    }
  }

  return predictions;
}
```

---

## 🎨 UI Components

### 1. `PacketReadinessTracker`
Pre-submission checklist and progress.

**Props**:
```typescript
interface PacketReadinessTrackerProps {
  claimantId: string;
  showDetailedChecklist?: boolean;
  allowEdit?: boolean;
}
```

**Features**:
- Progress bar with percentage
- Checklist with item statuses
- Next steps recommendations
- Estimated time to ready

---

### 2. `PacketPulseDashboard`
Post-submission timeline and benchmarking.

**Props**:
```typescript
interface PacketPulseDashboardProps {
  claimantId: string;
  showAllMilestones?: boolean;
  comparisonWindow?: BenchmarkWindow;
}
```

**Features**:
- Current status indicator
- Timeline visualization
- Benchmark comparisons
- Trend indicators
- Projected completion date

---

### 3. `DocumentStatusTracker`
External document request tracking.

**Props**:
```typescript
interface DocumentStatusTrackerProps {
  claimantId: string;
  allowCreateRequests?: boolean;
}
```

**Features**:
- List of document requests
- Status indicators
- Expected receipt dates
- Follow-up reminders
- Quick actions (request, follow up, mark received)

---

### 4. `TrendInsightsWidget`
Shows processing trends and insights.

**Props**:
```typescript
interface TrendInsightsWidgetProps {
  window?: BenchmarkWindow;
  milestones?: DOJMilestone[];
}
```

**Features**:
- Trend arrows (faster/slower/stable)
- Percentage changes
- Contextual insights
- Warnings about delays

---

## 🔌 API Endpoints

### Pre-Submission Endpoints

#### `GET /api/claims/[claimId]/readiness`
Get readiness score and checklist.

**Response**:
```json
{
  "claimantId": "clm_123",
  "readinessScore": 67,
  "readinessStatus": "DOCUMENTS_GATHERING",
  "totalItems": 12,
  "completedItems": 8,
  "items": [
    {
      "id": "item_1",
      "itemType": "PERSONAL_INFO",
      "itemName": "Personal Information",
      "status": "COMPLETED",
      "completedAt": "2024-11-15T10:00:00Z"
    },
    // ... more items
  ],
  "estimatedDaysToReady": 5,
  "nextSteps": [
    "Upload birth certificate",
    "Complete affidavit form",
    "Review and sign packet"
  ]
}
```

#### `PUT /api/claims/[claimId]/readiness/items/[itemId]`
Update checklist item status.

**Request**:
```json
{
  "status": "COMPLETED"
}
```

---

### Post-Submission Endpoints

#### `GET /api/claims/[claimId]/packet-pulse`
Get timeline and benchmarks.

**Query Params**:
- `window`: Benchmark window (default: "LAST_30_DAYS")

**Response**:
```json
{
  "claimantId": "clm_123",
  "currentMilestone": "RECEIVED_BY_DOJ",
  "daysInCurrentMilestone": 8,
  "totalProcessingDays": 15,
  "completedMilestones": [
    {
      "milestone": "SUBMITTED_TO_DOJ",
      "date": "2024-11-01T00:00:00Z",
      "daysFromPrevious": 0,
      "benchmark": {
        "averageDays": 0,
        "yourDays": 0,
        "comparison": "ON_TRACK"
      }
    },
    {
      "milestone": "RECEIVED_BY_DOJ",
      "date": "2024-11-12T00:00:00Z",
      "daysFromPrevious": 12,
      "benchmark": {
        "averageDays": 10,
        "yourDays": 12,
        "comparison": "SLIGHTLY_SLOWER"
      }
    }
  ],
  "upcomingMilestones": [
    {
      "milestone": "CLAIM_NUMBER_ASSIGNED",
      "expectedDate": "2024-11-27T00:00:00Z",
      "expectedDaysFromNow": 5,
      "benchmark": {
        "averageDays": 15,
        "minDays": 10,
        "maxDays": 21,
        "confidence": 0.85
      }
    }
    // ... more milestones
  ],
  "projectedCompletionDate": "2025-05-15T00:00:00Z",
  "trends": [
    {
      "milestone": "CLAIM_NUMBER_ASSIGNED",
      "trend": "FASTER",
      "trendPercentage": -12.5,
      "insight": "DOJ is assigning claim numbers 2 days faster than last month"
    }
  ]
}
```

---

### Document Tracking Endpoints

#### `GET /api/claims/[claimId]/document-requests`
Get all document requests.

#### `POST /api/claims/[claimId]/document-requests`
Create new document request.

#### `PUT /api/claims/[claimId]/document-requests/[requestId]`
Update document request status.

---

### Benchmark Endpoints

#### `GET /api/benchmarks/milestones`
Get current benchmarks for all milestones.

**Query Params**:
- `window`: Benchmark window (default: "LAST_30_DAYS")
- `milestone`: Specific milestone (optional)

**Response**:
```json
{
  "window": "LAST_30_DAYS",
  "calculatedAt": "2024-12-08T02:00:00Z",
  "milestones": [
    {
      "milestone": "RECEIVED_BY_DOJ",
      "averageDays": 10,
      "medianDays": 9,
      "range": { "min": 5, "max": 18 },
      "sampleSize": 47,
      "trend": "FASTER",
      "trendPercentage": -8.3
    }
    // ... more milestones
  ]
}
```

---

## 🔄 Background Jobs

### 1. Benchmark Calculation Job
**Schedule**: Daily at 2:00 AM
**Function**: Calculate milestone benchmarks for all time windows

### 2. Readiness Score Update Job
**Schedule**: Hourly
**Function**: Recalculate readiness scores for claims with recent changes

### 3. Document Request Follow-Up Job
**Schedule**: Daily at 9:00 AM
**Function**: Create follow-up reminders for overdue document requests

### 4. Timeline Prediction Update Job
**Schedule**: Daily at 3:00 AM (after benchmark calculation)
**Function**: Update predicted completion dates for all active claims

---

## 📊 Analytics & Reporting

### Admin Dashboard Metrics

**System-Wide Statistics**:
- Average readiness score across all claims
- Average time from claim creation to submission
- Current processing speed vs. historical average
- Bottleneck identification (which milestone is slowest)

**Insights Dashboard**:
- "X% of claims are stuck in [milestone] longer than average"
- "Document requests taking Y days longer than usual"
- "Approval times improved by Z% this month"

---

## 🎯 Success Metrics

### User Experience Metrics
- Reduced "Where is my claim?" support requests
- Increased user engagement with portal
- Higher claim completion rates

### Operational Metrics
- Faster claim preparation (measured by readiness score improvement)
- Reduced time to submission
- Better document collection efficiency

### Predictive Accuracy
- Accuracy of projected dates vs actual (target: 80%+)
- Confidence score calibration

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema updates
- [ ] Basic readiness tracking API
- [ ] Simple checklist UI component

### Phase 2: Pre-Submission (Week 2)
- [ ] Complete readiness tracker
- [ ] Document request system
- [ ] Next steps recommendations

### Phase 3: Post-Submission (Week 3)
- [ ] Benchmark calculation system
- [ ] Basic packet pulse dashboard
- [ ] Timeline predictions

### Phase 4: Analytics & Refinement (Week 4)
- [ ] Trend analysis
- [ ] Advanced insights
- [ ] Admin analytics dashboard

---

## 🤔 Open Questions & Decisions Needed

1. **Checklist Customization**: Should readiness checklist vary by claim type? (e.g., downwinder vs onsite participant)

2. **Benchmark Windows**: Which time window should be default for users? (Last 30 days vs last 90 days)

3. **Confidence Thresholds**: At what sample size do we start showing predictions? (e.g., minimum 10 claims)

4. **Notification Strategy**: When should we notify users about milestone changes or delays?

5. **Data Privacy**: Should users see aggregate data about other claims, or only their own vs average?

6. **Manual Overrides**: Should staff be able to manually adjust predicted dates if they have inside knowledge?

7. **Document Request Integration**: Should we auto-create document requests based on claim type, or require manual creation?

8. **Readiness Weights**: Should some checklist items be weighted more heavily? (e.g., medical records = 2x weight)

---

## 📝 Notes

- System should gracefully handle low sample sizes (show "Not enough data" instead of misleading predictions)
- Predictions should always show confidence levels and ranges, never just a single date
- Consider seasonal variations (e.g., government slower during holidays)
- Build in A/B testing capability to measure impact on user satisfaction
- Ensure mobile-responsive design for all components

---

**Next Steps**: Review this specification, align on approach, prioritize features, then begin implementation.

Last Updated: December 8, 2024

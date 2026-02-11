# DOJ Awards Data Scraping System

**Date**: December 8, 2024
**Status**: 📋 PLANNING
**Purpose**: Scrape daily DOJ RECA awards data to improve Packet Pulse predictions

---

## 🎯 Overview

The Department of Justice publishes daily RECA claim statistics at:
```
https://www.justice.gov/civil/awards-date-[MMDDYYYY]
```

This data provides critical insights into:
- **Processing velocity** - How many claims approved per day
- **Approval rates** - Current approval percentage by claim type
- **Queue depth** - How many claims are pending
- **Total payouts** - Dollar amounts approved

By tracking this data daily, we can:
1. Calculate DOJ processing speed (claims/day)
2. Estimate queue wait times based on pending claims
3. Predict approval likelihood
4. Provide users with real-time context about DOJ capacity

---

## 📊 Available Data

### Data Structure (as of 12/05/2024)

**Downwinder Claims (Our Primary Focus)**:
- Pending: 1,358
- Approved: 391
- Approval %: 100%
- $ Approved: $39,100,000
- Denied: 0
- Total Claims: 1,749

**Historical Progression**:
| Date | Pending | Approved | Daily Approved | $ Approved |
|------|---------|----------|----------------|------------|
| 11/03/2024 | 662 | 263 | - | $26,300,000 |
| 12/04/2024 | 1,306 | 384 | - | $38,400,000 |
| 12/05/2024 | 1,358 | 391 | 7 | $39,100,000 |

**Key Insights**:
- 7 claims approved on 12/05 (391 - 384)
- 52 new claims submitted on 12/05 (1,358 + 7 - 1,306)
- Approval rate: 100% (very high confidence for Downwinders)
- Processing rate: ~7 claims/day (early data, need more samples)

---

## 💾 Database Schema

### New Table: `DOJDailyStats`

Stores daily snapshot of DOJ awards page.

```prisma
model DOJDailyStats {
  id               String   @id @default(cuid())

  // Date tracking
  reportDate       DateTime @unique // Date from URL (e.g., 12/05/2024)
  scrapedAt        DateTime @default(now())

  // Claim type
  claimType        ClaimType

  // Under PL 119-21 (current law, starting 7/3/2025)
  pending          Int
  approved         Int
  approvalPercent  Float
  dollarsApproved  Float    // In dollars (e.g., 39100000)
  denied           Int
  totalClaims      Int

  // Calculated fields
  dailyApproved    Int?     // Approved today vs yesterday
  dailyDenied      Int?     // Denied today vs yesterday
  dailySubmitted   Int?     // New submissions today

  // Processing velocity
  approvalRate     Float?   // Claims approved per day (rolling avg)

  // Data quality
  dataSource       String   @default("justice.gov")
  scrapingSuccess  Boolean  @default(true)
  scrapingError    String?

  @@index([reportDate])
  @@index([claimType, reportDate])
  @@index([scrapedAt])
}

enum ClaimType {
  DOWNWINDER
  ONSITE_PARTICIPANT
  MANHATTAN_PROJECT_WASTE
  URANIUM_WORKER
}
```

### New Table: `DOJProcessingMetrics`

Aggregated metrics calculated from daily stats.

```prisma
model DOJProcessingMetrics {
  id                    String   @id @default(cuid())

  // Time window
  claimType             ClaimType
  windowStart           DateTime
  windowEnd             DateTime
  windowType            MetricWindow

  // Velocity metrics
  avgApprovalsPerDay    Float
  medianApprovalsPerDay Float
  avgSubmissionsPerDay  Float

  // Capacity metrics
  avgPendingQueue       Float
  avgProcessingTime     Float?   // Days from submission to approval (estimated)

  // Success metrics
  approvalRate          Float
  denialRate            Float

  // Trend analysis
  velocityTrend         TrendDirection
  velocityChange        Float    // % change from previous period
  queueTrend            TrendDirection
  queueChange           Float

  // Sample
  daysInSample          Int

  // Metadata
  calculatedAt          DateTime @default(now())

  @@index([claimType, windowType])
}

enum MetricWindow {
  LAST_7_DAYS
  LAST_14_DAYS
  LAST_30_DAYS
  LAST_60_DAYS
  ALL_TIME
}
```

---

## 🔄 Data Collection System

### 1. Daily Scraping Job

**Schedule**: Run every day at 6:00 AM PST (after DOJ updates)

**Process**:
```typescript
async function scrapeDOJDailyData() {
  const today = new Date();
  const dateStr = format(today, 'MMddyyyy'); // e.g., "12052024"
  const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

  try {
    // Fetch page data
    const html = await fetch(url).then(res => res.text());

    // Parse HTML and extract claim statistics
    const stats = parseAwardsPage(html);

    // Store data for each claim type
    for (const claimType of ['DOWNWINDER', 'ONSITE_PARTICIPANT', ...]) {
      const typeStats = stats[claimType];

      // Calculate daily deltas
      const yesterday = await getYesterdayStats(claimType);
      const dailyApproved = typeStats.approved - (yesterday?.approved || 0);
      const dailyDenied = typeStats.denied - (yesterday?.denied || 0);
      const dailySubmitted = (typeStats.pending + dailyApproved + dailyDenied) -
                             (yesterday?.pending || 0) -
                             (yesterday?.approved || 0) -
                             (yesterday?.denied || 0);

      // Store in database
      await db.dOJDailyStats.create({
        data: {
          reportDate: today,
          claimType,
          pending: typeStats.pending,
          approved: typeStats.approved,
          approvalPercent: typeStats.approvalPercent,
          dollarsApproved: typeStats.dollarsApproved,
          denied: typeStats.denied,
          totalClaims: typeStats.totalClaims,
          dailyApproved,
          dailyDenied,
          dailySubmitted,
          scrapingSuccess: true
        }
      });
    }

    console.log('✅ DOJ daily stats scraped successfully');

    // Trigger metrics calculation
    await calculateProcessingMetrics();

  } catch (error) {
    console.error('❌ Failed to scrape DOJ data:', error);

    // Log failure
    await db.dOJDailyStats.create({
      data: {
        reportDate: today,
        claimType: 'DOWNWINDER',
        scrapingSuccess: false,
        scrapingError: error.message
      }
    });
  }
}
```

### 2. Historical Backfill Job

**Purpose**: Scrape all available historical data (11/03/2024 - yesterday)

**Run**: One-time on deployment, then manual as needed

**Process**:
```typescript
async function backfillHistoricalData() {
  const startDate = new Date('2024-11-03'); // Earliest available
  const endDate = subDays(new Date(), 1);   // Yesterday

  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'MMddyyyy');

    // Check if we already have this data
    const exists = await db.dOJDailyStats.findFirst({
      where: { reportDate: currentDate }
    });

    if (!exists) {
      console.log(`Scraping ${dateStr}...`);

      try {
        await scrapeDOJDataForDate(currentDate);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
      } catch (error) {
        console.error(`Failed to scrape ${dateStr}:`, error.message);
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log('✅ Historical backfill complete');

  // Calculate metrics
  await calculateProcessingMetrics();
}
```

### 3. Metrics Calculation Job

**Schedule**: Run daily at 7:00 AM PST (after scraping)

**Process**:
```typescript
async function calculateProcessingMetrics() {
  const windows: MetricWindow[] = [
    'LAST_7_DAYS',
    'LAST_14_DAYS',
    'LAST_30_DAYS',
    'LAST_60_DAYS'
  ];

  for (const claimType of ['DOWNWINDER', 'ONSITE_PARTICIPANT', ...]) {
    for (const window of windows) {
      const { startDate, endDate } = getWindowDates(window);

      // Get daily stats for this window
      const dailyStats = await db.dOJDailyStats.findMany({
        where: {
          claimType,
          reportDate: {
            gte: startDate,
            lte: endDate
          },
          scrapingSuccess: true
        },
        orderBy: { reportDate: 'asc' }
      });

      if (dailyStats.length < 2) continue; // Need at least 2 days

      // Calculate approvals per day
      const approvalsPerDay = dailyStats
        .filter(s => s.dailyApproved !== null)
        .map(s => s.dailyApproved!);

      const avgApprovalsPerDay = mean(approvalsPerDay);
      const medianApprovalsPerDay = median(approvalsPerDay);

      // Calculate submissions per day
      const submissionsPerDay = dailyStats
        .filter(s => s.dailySubmitted !== null)
        .map(s => s.dailySubmitted!);

      const avgSubmissionsPerDay = mean(submissionsPerDay);

      // Calculate average pending queue
      const avgPendingQueue = mean(dailyStats.map(s => s.pending));

      // Estimate processing time
      // If approving X claims/day and have Y pending, takes Y/X days
      const avgProcessingTime = avgApprovalsPerDay > 0
        ? avgPendingQueue / avgApprovalsPerDay
        : null;

      // Calculate approval rate
      const latestStats = dailyStats[dailyStats.length - 1];
      const approvalRate = latestStats.approvalPercent;
      const denialRate = 100 - approvalRate;

      // Calculate trends
      const { trend: velocityTrend, change: velocityChange } =
        calculateTrend(approvalsPerDay);
      const { trend: queueTrend, change: queueChange } =
        calculateTrend(dailyStats.map(s => s.pending));

      // Store metrics
      await db.dOJProcessingMetrics.create({
        data: {
          claimType,
          windowStart: startDate,
          windowEnd: endDate,
          windowType: window,
          avgApprovalsPerDay,
          medianApprovalsPerDay,
          avgSubmissionsPerDay,
          avgPendingQueue,
          avgProcessingTime,
          approvalRate,
          denialRate,
          velocityTrend,
          velocityChange,
          queueTrend,
          queueChange,
          daysInSample: dailyStats.length
        }
      });
    }
  }
}
```

---

## 📈 Integration with Packet Pulse

### Enhanced Timeline Predictions

**Before** (using only internal data):
- "Based on 47 similar claims, expect approval in 150 days"

**After** (using DOJ data):
- "Based on DOJ processing 7 claims/day with 1,358 pending, your claim is estimated position #1,234 in queue"
- "At current pace, expect to reach front of queue in ~176 days"
- "DOJ approval rate for Downwinders: 100%"

### New Prediction Algorithm

```typescript
async function generateEnhancedPrediction(claimantId: string) {
  const claim = await db.claimLifecycle.findUnique({
    where: { claimantId },
    include: { claimant: true }
  });

  // Get DOJ processing metrics
  const dojMetrics = await db.dOJProcessingMetrics.findFirst({
    where: {
      claimType: 'DOWNWINDER',
      windowType: 'LAST_30_DAYS'
    },
    orderBy: { calculatedAt: 'desc' }
  });

  // Get latest DOJ stats
  const latestStats = await db.dOJDailyStats.findFirst({
    where: { claimType: 'DOWNWINDER' },
    orderBy: { reportDate: 'desc' }
  });

  if (!claim.submittedToDOJAt) {
    // Pre-submission: Use internal benchmarks + DOJ queue info
    return {
      phase: 'PRE_SUBMISSION',
      queueDepth: latestStats.pending,
      currentApprovalRate: latestStats.approvalPercent,
      estimatedQueueWait: dojMetrics.avgProcessingTime,
      insight: `DOJ currently has ${latestStats.pending} pending Downwinder claims. ` +
               `At current pace of ${dojMetrics.avgApprovalsPerDay.toFixed(1)} approvals/day, ` +
               `the queue is ~${dojMetrics.avgProcessingTime?.toFixed(0)} days long.`
    };
  }

  // Post-submission: Calculate position in queue
  const daysSubmitted = differenceInDays(new Date(), claim.submittedToDOJAt);

  // Estimate how many claims were ahead when submitted
  const claimsAheadAtSubmission = latestStats.pending -
                                  (dojMetrics.avgApprovalsPerDay * daysSubmitted);

  // Estimate current position
  const estimatedPosition = Math.max(0,
    claimsAheadAtSubmission - (dojMetrics.avgApprovalsPerDay * daysSubmitted)
  );

  // Estimate days to approval
  const daysToApproval = estimatedPosition / dojMetrics.avgApprovalsPerDay;
  const estimatedApprovalDate = addDays(new Date(), daysToApproval);

  return {
    phase: 'POST_SUBMISSION',
    daysSubmitted,
    estimatedPosition: Math.round(estimatedPosition),
    queueDepth: latestStats.pending,
    estimatedApprovalDate,
    approvalLikelihood: latestStats.approvalPercent,
    processingVelocity: dojMetrics.avgApprovalsPerDay,
    insight: `Your claim is estimated to be position #${Math.round(estimatedPosition)} ` +
             `in a queue of ${latestStats.pending} pending Downwinder claims. ` +
             `DOJ is processing ${dojMetrics.avgApprovalsPerDay.toFixed(1)} claims/day ` +
             `(${dojMetrics.velocityTrend === 'FASTER' ? '🟢 faster' :
                 dojMetrics.velocityTrend === 'SLOWER' ? '🔴 slower' : '🟡 stable'} ` +
             `than last period).`
  };
}
```

---

## 🎨 UI Components

### 1. DOJ Processing Status Widget

```
┌─────────────────────────────────────────────┐
│ 🏛️  DOJ Processing Status                   │
├─────────────────────────────────────────────┤
│                                             │
│  As of December 5, 2024:                    │
│                                             │
│  📊 Downwinder Claims:                      │
│     • Pending: 1,358 claims                 │
│     • Approved Today: 7 claims              │
│     • Approval Rate: 100%                   │
│                                             │
│  ⚡ Processing Speed (Last 30 days):        │
│     • Average: 7.2 claims/day               │
│     • Trend: 🟢 12% faster than last month  │
│                                             │
│  ⏱️  Current Queue Wait:                    │
│     • ~189 days at current pace             │
│     • Improving by 2 days/week              │
│                                             │
│  💰 Total Approved:                         │
│     • $39.1M paid to 391 claimants          │
│     • Average: $100,000 per claim           │
└─────────────────────────────────────────────┘
```

### 2. Enhanced Packet Pulse with DOJ Data

```
┌─────────────────────────────────────────────┐
│ 🎯 Your Claim Status                        │
├─────────────────────────────────────────────┤
│                                             │
│  Submitted: November 1, 2024 (34 days ago) │
│  Current Status: RECEIVED_BY_DOJ            │
│                                             │
│  📍 Your Position in Queue:                 │
│     Estimated Position: #892 of 1,358       │
│     Claims Ahead: ~892                      │
│     Claims Behind: ~466                     │
│                                             │
│  ⏱️  Estimated Timeline:                    │
│     • Claims processed since you: ~238      │
│     • Remaining in queue ahead: ~654        │
│     • Days to approval: ~91 days            │
│     • Expected approval: March 6, 2025      │
│                                             │
│  📊 Your Progress:                          │
│     ████████████████░░░░░░░░░░░░ 65%        │
│                                             │
│  💡 Insight:                                │
│     DOJ processing speed increased 12%      │
│     this month. Your approval date moved    │
│     forward by ~14 days based on current    │
│     trends.                                 │
│                                             │
│  ✅ Approval Likelihood: 100%               │
│     (Based on 391 recent Downwinder approvals) │
└─────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### `GET /api/doj/daily-stats`
Get latest DOJ statistics.

**Query Params**:
- `claimType`: Filter by claim type (default: all)
- `date`: Specific date (default: latest)

**Response**:
```json
{
  "reportDate": "2024-12-05T00:00:00Z",
  "stats": {
    "DOWNWINDER": {
      "pending": 1358,
      "approved": 391,
      "approvalPercent": 100,
      "dollarsApproved": 39100000,
      "denied": 0,
      "totalClaims": 1749,
      "dailyApproved": 7,
      "dailySubmitted": 52
    }
  }
}
```

### `GET /api/doj/processing-metrics`
Get DOJ processing velocity and trends.

**Query Params**:
- `claimType`: Filter by claim type
- `window`: Time window (default: "LAST_30_DAYS")

**Response**:
```json
{
  "claimType": "DOWNWINDER",
  "window": "LAST_30_DAYS",
  "metrics": {
    "avgApprovalsPerDay": 7.2,
    "medianApprovalsPerDay": 7,
    "avgSubmissionsPerDay": 12.5,
    "avgPendingQueue": 1320,
    "avgProcessingTime": 183,
    "approvalRate": 100,
    "velocityTrend": "FASTER",
    "velocityChange": 12.5
  }
}
```

### `GET /api/doj/queue-position`
Get estimated queue position for a specific claim.

**Query Params**:
- `claimantId`: Claim ID

**Response**:
```json
{
  "claimantId": "clm_123",
  "submittedAt": "2024-11-01T00:00:00Z",
  "daysSubmitted": 34,
  "estimatedPosition": 892,
  "queueDepth": 1358,
  "estimatedApprovalDate": "2025-03-06T00:00:00Z",
  "daysToApproval": 91,
  "approvalLikelihood": 100,
  "processingVelocity": 7.2,
  "confidence": 0.85
}
```

---

## 🔧 Implementation Tasks

### Phase 1: Data Collection (Priority 1)
- [ ] Create database tables (`DOJDailyStats`, `DOJProcessingMetrics`)
- [ ] Build HTML parser for DOJ awards page
- [ ] Implement daily scraping cron job
- [ ] Run historical backfill (11/03/2024 - present)
- [ ] Implement metrics calculation job
- [ ] Add error handling and logging

### Phase 2: Integration (Priority 2)
- [ ] Update Packet Pulse prediction algorithm
- [ ] Add queue position estimation
- [ ] Create DOJ Processing Status widget
- [ ] Update existing timeline components
- [ ] Add API endpoints

### Phase 3: UI & Polish (Priority 3)
- [ ] Build admin dashboard for DOJ data
- [ ] Add data quality monitoring
- [ ] Create alerts for unusual changes
- [ ] Add historical chart visualization

---

## 📊 Data Quality & Monitoring

### Health Checks
- Daily scraping success rate
- Data completeness validation
- Anomaly detection (e.g., sudden queue size changes)
- Alert if scraping fails 2+ consecutive days

### Admin Dashboard
- Last successful scrape timestamp
- Historical data coverage (% of days with data)
- Processing velocity trends over time
- Queue depth visualization

---

## 🚀 Immediate Next Steps

1. **Run historical backfill** - Get all data from 11/03/2024 to present
2. **Set up daily scraping** - Start collecting daily snapshots
3. **Calculate baseline metrics** - Generate initial processing metrics
4. **Test prediction accuracy** - Compare predictions to actual outcomes
5. **Deploy to production** - Enable for all users

---

**Last Updated**: December 8, 2024

# Payout Pulse & Claim Timeline Tracking System

## Overview

The **Payout Pulse** system provides RadiantClaims customers with unprecedented transparency into their RECA claim processing timeline. By tracking DOJ milestones, medical record requests, cancer registry lookups, and historical payout data, we give claimants realistic expectations and peace of mind.

---

## Core Features

### 1. **Claim Lifecycle Tracking**

Every claim is tracked through 20+ DOJ processing milestones:

#### Pre-Submission
- `NOT_SUBMITTED` - Claim packet being prepared

#### DOJ Receipt & Initial Review (Week 1-2)
- `RECEIVED_BY_DOJ` - DOJ logged receipt
- `INITIAL_REVIEW` - Completeness check
- `INCOMPLETE_RETURNED` - Returned for missing docs

#### Document Verification (Week 2-8)
- `DOCUMENT_VERIFICATION` - Verifying submitted documents
- `REQUESTING_ADDITIONAL_DOCS` - DOJ needs more info
- `CANCER_REGISTRY_LOOKUP` - **Checking state cancer registries**
- `MEDICAL_RECORDS_REQUEST` - **Requesting medical records from providers**

#### Eligibility Assessment (Week 8-16)
- `ELIGIBILITY_REVIEW` - Assessing claim eligibility
- `EXPOSURE_VERIFICATION` - Confirming physical presence
- `DISEASE_VERIFICATION` - Confirming compensable disease
- `RELATIONSHIP_VERIFICATION` - Verifying survivor relationship

#### Final Review & Decision (Week 16-24)
- `FINAL_REVIEW` - DOJ adjudicator final review
- `APPROVED_PENDING_PAYMENT` - Approved, awaiting payment
- `PAYMENT_PROCESSING` - U.S. Treasury processing
- `PAYMENT_ISSUED` - Payment sent

#### Terminal States
- `CLAIM_APPROVED` - Complete and paid
- `CLAIM_DENIED` - Denied (appeal available)
- `CLAIM_WITHDRAWN` - Withdrawn
- `APPEAL_IN_PROGRESS` / `APPEAL_APPROVED` / `APPEAL_DENIED`

---

### 2. **Medical Records & Cancer Registry Tracking**

One of the most valuable features for claimants is visibility into:

- **Cancer Registry Lookup Status**
  - When DOJ checks state cancer registries
  - Whether records were found
  - Timestamp of lookup

- **Medical Records Request Status**
  - When DOJ requests records from healthcare providers
  - When records are received by DOJ
  - Typical timeframes for this step

This addresses a major pain point: **claimants wondering if DOJ has their medical records yet**.

---

### 3. **Queue Position & Cohort Tracking**

Customers can see:
- **Estimated position** in DOJ processing queue
- **Cohort statistics** (claims submitted in same month)
  - How many in cohort have been approved
  - How many are still pending
  - Average processing time for cohort
- **Percentile ranking**: "Your claim is moving faster than 75% of similar claims"

---

### 4. **Payout Pulse Analytics**

Real-time insights based on historical data:

#### Timing Projections
- **Estimated Approval Date** - When claim will be approved
- **Estimated Payout Date** - When $100,000 will be received
- **Confidence Level** - High/Medium/Low based on data quality

#### Historical Benchmarks
- Average time from submission to approval
- Average time from approval to payment
- Approval rates by state, cancer type, relationship

#### Performance Comparison
- Your progress vs. typical progress at this stage
- Speed comparison: "Faster than X% of claims"

---

## Database Schema

### ClaimLifecycle Model
Tracks the full journey of a claim:

```typescript
{
  currentMilestone: DOJMilestone
  currentMilestoneDate: Date
  submittedToDOJAt?: Date
  receivedByDOJAt?: Date
  approvedAt?: Date
  paymentReceivedAt?: Date
  dojClaimNumber?: string
  expectedCompletionDate?: Date
  estimatedPayoutDate?: Date
  daysInCurrentMilestone: number
  totalProcessingDays: number

  // Medical Records Tracking
  cancerRegistryChecked: boolean
  cancerRegistryFoundAt?: Date
  medicalRecordsRequested: boolean
  medicalRecordsReceivedByDOJ: boolean

  // DOJ Communication Log
  lastDOJContactDate?: Date
  lastDOJContactMethod?: string
  lastDOJContactNotes?: string
}
```

### ClaimMilestoneEvent Model
Individual timeline events:

```typescript
{
  milestone: DOJMilestone
  achievedAt: Date
  daysToAchieve?: number  // Days since previous milestone
  notes?: string
  isEstimated: boolean    // Future projections
  notifiedClaimant: boolean
}
```

### ClaimStatistics Model
Aggregate historical data:

```typescript
{
  periodStart: Date
  periodEnd: Date

  // Volume
  totalClaimsSubmitted: number
  totalClaimsApproved: number
  totalClaimsDenied: number

  // Timing (in days)
  avgTimeToReceipt: number
  avgTimeToCancerRegistry: number
  avgTimeToApproval: number
  avgTimeToPayment: number

  // Success Rates
  approvalRate: number        // % approved
  completenessRate: number    // % complete on first submission

  // By Geography
  utahClaimsApproved: number
  idahoClaimsApproved: number
  newMexicoClaimsApproved: number

  // By Cancer Type
  leukemiaApprovalRate: number
  thyroidApprovalRate: number
  breastApprovalRate: number
}
```

### ClaimQueuePosition Model
"Where am I in line?"

```typescript
{
  estimatedPosition?: number    // Position in queue
  totalInQueue?: number
  cohortId?: string            // "2024-10"
  cohortSize?: number
  cohortApproved?: number
  cohortDenied?: number
  percentFasterThan?: number   // Performance percentile
}
```

---

## Customer-Facing Components

### 1. `<ClaimTimeline />` Component

Beautiful visual timeline showing:
- Current milestone with description
- Progress bar (0-100%)
- Time in current stage
- Total processing time
- Estimated completion date
- Queue position
- Cohort statistics
- Full timeline with completed and future milestones

**Visual Design:**
- Color-coded milestones (completed = green, current = orange pulse, future = gray)
- Vertical timeline with connecting line
- Date stamps and duration for each milestone
- Expandable notes section

### 2. `<PayoutPulse />` Component

Analytics dashboard showing:
- **Estimated Approval Date** (large, prominent)
- **Estimated Payout Date** ($100,000)
- Confidence level indicator
- Progress comparison (your claim vs. typical)
- "Faster than X%" indicator
- Cohort statistics
- Historical averages

**Visual Design:**
- Large date displays with countdown
- Progress bars comparing your claim to average
- Green/amber/red color coding for performance
- Confidence badges (high/medium/low)

---

## Data Sources

### 1. **DOJ Public Data**
- FOIA requests for aggregate RECA statistics
- Published DOJ processing times
- Approval/denial rates by claim type

### 2. **Partner Law Firm Data**
- Real claim data from partner attorneys
- Actual approval dates, denial dates
- Document request timelines
- Payment received dates

### 3. **Manual Entry**
- Admin updates when DOJ contacts us
- Milestone transitions
- Special circumstances/notes

---

## Notification System

### LifecycleNotificationPreference Model
Customers control how they're notified:

```typescript
{
  emailNotifications: boolean
  smsNotifications: boolean
  phoneNumber?: string

  // What to notify about
  notifyOnMilestone: boolean
  notifyOnDocumentRequest: boolean
  notifyOnApproval: boolean
  notifyOnPayment: boolean
  weeklyProgressUpdate: boolean

  maxNotificationsPerWeek: number
}
```

### Notification Triggers

**Immediate Notifications:**
- Milestone achieved (e.g., "Your claim has been received by DOJ!")
- DOJ requests additional documents
- Claim approved
- Payment issued

**Weekly Digest:**
- Progress summary
- Queue position update
- Cohort statistics
- Estimated dates (if changed)

---

## Admin Interface

Admins can:
1. **Update milestones** manually when DOJ contacts us
2. **Add notes** to timeline events
3. **Log DOJ communications** (phone calls, letters)
4. **Mark medical records** as requested/received
5. **Set estimated dates** based on specific case factors
6. **View analytics** across all claims

---

## Benefits to Customers

### 1. **Transparency**
Eliminates the black box of DOJ processing. Customers know exactly where their claim is.

### 2. **Peace of Mind**
Realistic timelines reduce anxiety. "It's normal for this step to take 3 weeks."

### 3. **Medical Records Visibility**
Answers the #1 question: "Does DOJ have my medical records?"

### 4. **Peer Comparison**
"Your claim is moving faster than average" builds confidence.

### 5. **Planning**
Knowing estimated payout date helps with financial planning.

---

## Competitive Advantage

**No other RECA service offers this level of transparency.**

Most competitors:
- ❌ Submit claim and go dark
- ❌ No timeline visibility
- ❌ No queue position info
- ❌ No medical records tracking

RadiantClaims:
- ✅ Real-time milestone tracking
- ✅ Queue position & cohort stats
- ✅ Medical records transparency
- ✅ Accurate payout projections
- ✅ Weekly progress updates

---

## Implementation Status

### ✅ Completed
- Database schema design
- DOJ milestone definitions
- Timeline component UI
- Payout Pulse analytics component
- Type definitions

### 🔄 Next Steps
1. Create API endpoints for:
   - Fetching claim timeline data
   - Updating milestones (admin)
   - Historical statistics aggregation
2. Build admin interface for milestone management
3. Implement notification system
4. Seed initial statistics from DOJ public data
5. Integrate into customer portal

---

## Example User Experience

### Customer Portal Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Your Claim Status                                           │
│                                                             │
│ 🟢 Cancer Registry Lookup                                  │
│ DOJ is verifying your diagnosis with state cancer registr  │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 45%                  │
│                                                             │
│ ⏱️  14 days in current stage                                │
│ 📅 Total: 67 days since submission                         │
│ 🎯 Est. Approval: March 15, 2025                           │
│                                                             │
│ 📊 Your claim is progressing faster than 73% of similar    │
│    claims!                                                  │
└─────────────────────────────────────────────────────────────┘

[View Full Timeline] [Payout Pulse Analytics]
```

---

## Future Enhancements

1. **SMS/Text Updates** - Real-time milestone notifications
2. **Mobile App** - Native iOS/Android timeline view
3. **Predictive ML** - Machine learning for better date predictions
4. **Claim Comparison Tool** - Compare your claim to similar approved claims
5. **Document Tracker** - Which docs DOJ has reviewed, which are pending
6. **Appeal Assistant** - Guidance if claim is denied

---

## Technical Notes

### Date-fns Integration
All dates use `date-fns` for:
- Formatting: `format(date, "MMM d, yyyy")`
- Relative time: `formatDistanceToNow(date)`
- Calculations: `differenceInDays(date1, date2)`

### Real-time Updates
- Timeline data refreshes every 5 minutes
- Push notifications via WebSockets for milestone changes
- Optimistic UI updates for instant feedback

### Analytics Calculation
```typescript
// Average time to approval
avgTimeToApproval = SUM(approvedAt - submittedAt) / COUNT(approved_claims)

// Approval rate
approvalRate = (approved_claims / total_claims) * 100

// Percentile ranking
percentFasterThan = (claims_slower_than_you / total_claims) * 100
```

---

## Conclusion

The Payout Pulse system transforms the RECA claim experience from a frustrating black box into a transparent, data-driven journey. By providing real-time milestone tracking, medical records visibility, queue position insights, and accurate payout projections, we give claimants the information they need to plan their lives while waiting for their $100,000 compensation.

This is a **massive competitive advantage** and a core part of RadiantClaims' value proposition.

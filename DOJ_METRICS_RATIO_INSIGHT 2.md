# DOJ Metrics - Applications to Approvals Ratio Insight

## Overview

Enhanced the DOJ metrics insights to include a prominent **Applications to Approvals Ratio** that helps users understand the relationship between new claim submissions and processing capacity.

## What Was Added

### New Key Insight: Applications to Approvals Ratio

The system now calculates and displays the ratio of new applications received per day compared to approvals processed per day.

### Calculation

```typescript
const submissionRate = last7Days.avgSubmissionsPerDay;  // e.g., 54.3/day
const approvalRate = last7Days.avgApprovalsPerDay;      // e.g., 5.3/day
const ratio = submissionRate / approvalRate;             // e.g., 10.17:1
```

### Three Insight Scenarios

#### 1. Queue Growing (Submissions > Approvals × 1.2)
```
⚠️  Applications to Approvals Ratio: 10.17:1 —
    New submissions (54.3/day) are outpacing approvals (5.3/day),
    queue is growing
```

**Interpretation**: For every 1 claim approved, 10.17 new claims are submitted
**Impact**: Queue is accumulating, wait times increasing
**Emoji**: ⚠️ (Warning - concerning trend)

#### 2. Queue Shrinking (Approvals > Submissions × 1.2)
```
💪 Applications to Approvals Ratio: 0.85:1 —
   Approvals (12.5/day) are outpacing new submissions (10.6/day),
   queue is shrinking
```

**Interpretation**: For every 1 claim submitted, 1.17 claims are approved
**Impact**: Queue is decreasing, wait times improving
**Emoji**: 💪 (Strong - positive trend)

#### 3. Balanced Processing
```
⚖️  Applications to Approvals Ratio: 1.05:1 —
    New submissions (6.3/day) and approvals (6.0/day) are
    relatively balanced
```

**Interpretation**: Submissions and approvals are nearly equal
**Impact**: Queue size stable
**Emoji**: ⚖️ (Scales - equilibrium)

## Current Real-World Data

Based on latest DOJ data (as of Dec 8, 2024):

- **Submissions**: 54.3 applications/day
- **Approvals**: 5.3 approvals/day
- **Ratio**: 10.17:1
- **Status**: ⚠️ Queue Growing

This means:
- For every 1 claim approved, over 10 new claims are submitted
- Queue is accumulating rapidly
- Current backlog: 1,394 pending claims
- Estimated wait time: 158-241 days

## User Benefits

### For Claimants
- **Realistic Expectations**: Understand current processing capacity
- **Context**: Why wait times are long (demand >> capacity)
- **Transparency**: Clear view of government processing constraints

### For Admins
- **Capacity Planning**: Anticipate increased support volume
- **Resource Allocation**: Plan for longer customer journeys
- **Communication Strategy**: Set appropriate expectations

### For Attorneys
- **Client Education**: Explain delays with data
- **Case Prioritization**: Focus on claims likely to process soon
- **Strategic Planning**: Adjust capacity based on trends

## Technical Implementation

### File Modified
- `src/lib/doj-metrics-calculator.ts`
- Function: `generateTextualInsights()`
- Lines: 431-453

### Logic Flow
```typescript
if (submissionRate > 0 && approvalRate > 0) {
  const ratio = submissionRate / approvalRate;

  if (submissionRate > approvalRate * 1.2) {
    // Queue growing - warning
  } else if (approvalRate > submissionRate * 1.2) {
    // Queue shrinking - positive
  } else {
    // Balanced - neutral
  }
}
```

### Display Format
- **Ratio**: Displayed as `X.XX:1` (e.g., `10.17:1`)
- **Rates**: Shown with 1 decimal place (e.g., `54.3/day`)
- **Context**: Includes interpretation of impact on queue

## Visual Presentation

In the DOJ Metrics Dashboard, this appears as:

```
┌─────────────────────────────────────────────┐
│ 💡 Key Insights                             │
│                                              │
│ ⚠️  Applications to Approvals Ratio: 10.17:1│
│     New submissions (54.3/day) are          │
│     outpacing approvals (5.3/day),          │
│     queue is growing                        │
└─────────────────────────────────────────────┘
```

## Why This Matters

### 1. **Processing Capacity Visibility**
Shows whether DOJ has sufficient capacity to handle demand

### 2. **Queue Trend Prediction**
Explains why queue grows/shrinks without complex analysis

### 3. **Wait Time Context**
Helps users understand that long waits are systemic, not personal

### 4. **Policy Impact Awareness**
If ratio changes dramatically, may indicate policy/staffing changes

## Example Scenarios

### Scenario A: High Backlog (Current)
- Ratio: 10.17:1
- Submissions: 54.3/day
- Approvals: 5.3/day
- Result: Queue grows by 49/day
- Message: "⚠️ Queue is growing"

### Scenario B: Catch-Up Period
- Ratio: 0.75:1
- Submissions: 9/day
- Approvals: 12/day
- Result: Queue shrinks by 3/day
- Message: "💪 Queue is shrinking"

### Scenario C: Steady State
- Ratio: 1.05:1
- Submissions: 10.5/day
- Approvals: 10/day
- Result: Queue grows by 0.5/day
- Message: "⚖️ Relatively balanced"

## Data Sources

- **Submission Rate**: Calculated from `dailySubmitted` field
- **Approval Rate**: Calculated from `dailyApproved` field
- **Time Window**: Last 7 days (most recent trend)

## Future Enhancements

Potential additions:

1. **Historical Ratio Chart**: Show ratio trends over time
2. **Ratio Thresholds**: Customizable alert levels
3. **Capacity Planning**: Estimate staffing needed for 1:1 ratio
4. **Per-Category Ratios**: Compare different claim types
5. **Regional Breakdowns**: If data becomes available

## Conclusion

The Applications to Approvals Ratio provides a clear, intuitive metric that helps all users understand DOJ processing dynamics at a glance. It transforms raw submission and approval numbers into actionable context about queue trends and wait time expectations.

---

**Implementation Date**: December 8, 2024
**Status**: ✅ Complete
**Impact**: Enhanced transparency and user understanding

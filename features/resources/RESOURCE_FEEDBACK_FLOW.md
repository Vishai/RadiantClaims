# Resource Feedback Flow

## Overview

Two-stage feedback system to validate resource quality:
1. **Immediate Feedback** - Right after showing resource (within chat)
2. **Follow-up Feedback** - After user has time to contact resource (3-7 days later)

## Stage 1: Immediate Feedback (Within Chat)

**Timing**: Immediately after bot shows contact information

**What we ask**:
- "Is this the right type of office for what you need?"
- Simple thumbs up 👍 / thumbs down 👎

**Purpose**:
- Validate resource relevance
- Catch incorrect categorizations
- Quick quality check

**Implementation**:
```
Bot: I found the Tooele County Clerk's office! They handle marriage certificates.

Contact Information:
- Phone: (435) 843-3140
- Website: https://tooeleco.gov/marriage

[👍 This looks right] [👎 Not what I need]

Note: We'll check back in a few days to see if you were able to get your document!
```

**If thumbs down**, ask quick follow-up:
- "What's wrong with this resource?"
  - [ ] Wrong type of office
  - [ ] Wrong location
  - [ ] Contact info looks incorrect
  - [ ] Other (text field)

## Stage 2: Follow-up Feedback (3-7 Days Later)

**Timing Options**:
1. **Next login**: Show modal when user returns to portal
2. **Email**: Send follow-up email 3 days after resource was shown
3. **SMS**: Optional text message (if phone provided)

**What we ask**:
```
Subject: Did you get your marriage certificate from Tooele County?

Hi [Name],

A few days ago, we helped you find:
📍 Tooele County Clerk's Office
📄 For: Marriage Certificate

Quick question - were you able to contact them?

[✓ Yes, I contacted them]
[✗ No, I haven't yet]
[⊘ I found a different resource]

---

[If they clicked "Yes, I contacted them"]

Great! How did it go?

Did you get your document?
[✓ Yes, I got it!]
[⏳ Still waiting for it]
[✗ They couldn't help me]

How was their response?
[★★★★★] (1-5 stars)

How long did it take?
[ ] Same day
[ ] Within 3 days
[ ] Within a week
[ ] 1-2 weeks
[ ] 2-4 weeks
[ ] Still waiting
[ ] They never responded

What did it cost? (optional)
[$____]

Any other feedback?
[________________]
(Optional text field)

[Submit Feedback]
```

## Database Tracking

### ResourceInteraction Model (NEW)
Tracks when we show a resource to someone:

```prisma
model ResourceInteraction {
  id         String   @id @default(cuid())
  resourceId String
  resource   DocumentResource @relation(...)

  userId     String?
  sessionId  String?
  email      String? // For follow-up

  documentType String // What they were looking for
  shownVia     String // "chat_bot", "resource_page", "email"

  // Immediate feedback
  immediatelyHelpful Boolean?
  immediateFeedbackAt DateTime?
  immediateComments String?

  // Follow-up tracking
  followUpScheduledFor DateTime
  followUpSentAt       DateTime?
  followUpMethod       String? // "email", "sms", "modal"
  followUpCompletedAt  DateTime?

  // Link to detailed feedback
  feedbackId String?
  feedback   ResourceFeedback? @relation(...)

  createdAt DateTime @default(now())

  @@index([followUpScheduledFor, followUpSentAt])
  @@index([resourceId])
  @@index([userId])
}
```

## User Journey with Timing

### Minute 0: Bot Shows Resource
```
User: "I need my marriage certificate from Tooele County"
Bot: [Shows Tooele County Clerk info]
     [👍 This looks right] [👎 Not what I need]

→ Create ResourceInteraction record
→ Schedule follow-up for 3 days from now
```

### Minute 1: Immediate Feedback (Optional)
```
User clicks: [👍 This looks right]

→ Update ResourceInteraction.immediatelyHelpful = true
→ Update ResourceStats.helpfulCount++
→ Show: "Great! We'll check back in a few days to see how it went."
```

### Day 3: Follow-up Trigger
```
Background Job runs every 6 hours:
- Find ResourceInteractions where:
  - followUpScheduledFor <= NOW
  - followUpSentAt IS NULL
  - email IS NOT NULL

→ Send follow-up email
→ Update followUpSentAt
```

### Day 3-10: User Responds to Follow-up
```
User clicks link in email → Opens feedback form

User submits detailed feedback:
- Contacted: Yes
- Got document: Yes
- Rating: 5 stars
- Time: Within a week
- Cost: $20

→ Create ResourceFeedback record
→ Update ResourceInteraction.followUpCompletedAt
→ Update ResourceStats aggregates
```

## Non-Intrusive Design Principles

1. **Never block user workflow**: All feedback is optional
2. **One-click initial response**: Thumbs up/down only
3. **Progressive disclosure**: Detailed form only if they want to provide more info
4. **Timing matters**: Don't ask too soon (3 days minimum)
5. **Reminder, not nag**: One follow-up only, don't spam
6. **Show value**: "Your feedback helps others find the right resources"

## Social Proof Display

After collecting feedback, show stats on resources:

```
✓ 15 people contacted this office (93% success rate)
⭐ 4.5/5 average rating
⏱️ Most got documents within 5-7 days
💵 Average cost: $20
```

## Follow-up Schedule Logic

```typescript
function calculateFollowUpDate(interactionDate: Date): Date {
  // Default: 3 days for immediate needs
  let daysToWait = 3;

  // Adjust based on document type
  if (documentType === 'MEDICAL_RECORDS') {
    daysToWait = 7; // Medical records take longer
  }
  if (documentType === 'BIRTH_CERTIFICATE') {
    daysToWait = 5; // Vital records ~5 days
  }

  // Add processing time if we know it
  if (resource.processingTimeDays) {
    daysToWait = Math.max(
      daysToWait,
      resource.processingTimeDays + 2
    );
  }

  return addDays(interactionDate, daysToWait);
}
```

## Email Template Example

```html
Subject: Quick check-in: Did Tooele County Clerk help you?

Hi Brandon,

A few days ago, our Resource Assistant helped you find contact
information for:

📍 Tooele County Clerk's Office
📞 (435) 843-3140
📄 Marriage Certificate

We wanted to check in - were you able to get your document?

[Yes, I got it!] [Still working on it] [Didn't work out]

Your feedback takes 30 seconds and helps other RECA claimants
find the right resources.

---
P.S. If you've already handled this, feel free to ignore this email.
```

## Implementation Priorities

### Phase 1 (MVP):
1. ✅ Immediate thumbs up/down in chat
2. ✅ Track ResourceInteraction
3. ✅ Email follow-up 3 days later
4. ✅ Detailed feedback form

### Phase 2 (Enhanced):
1. In-app modal on next login
2. SMS follow-up option
3. Adaptive timing based on document type
4. A/B test follow-up timing

### Phase 3 (Advanced):
1. Smart reminders (only if no response)
2. Gamification (badges for helpful reviewers)
3. Public review display
4. Staff verification workflow

## Success Metrics

**Immediate Feedback Rate**:
- Target: 40% of users provide thumbs up/down
- Measure: immediatelyHelpful IS NOT NULL

**Follow-up Response Rate**:
- Target: 25% of users respond to follow-up
- Measure: followUpCompletedAt IS NOT NULL

**Detailed Feedback Rate**:
- Target: 15% provide detailed feedback
- Measure: ResourceFeedback.rating IS NOT NULL

**Resource Quality Improvement**:
- Target: 80% helpfulness rate for verified resources
- Measure: (helpfulCount / totalFeedback) * 100

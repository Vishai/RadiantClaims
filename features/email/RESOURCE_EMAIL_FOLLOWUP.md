# Resource Feedback Email Follow-Up System

## Overview

This system automates the collection of user feedback on document resources through a multi-stage email follow-up flow. It helps us track resource quality, response times, costs, and success rates to continuously improve our recommendations for RECA claimants.

## Architecture

### Three-Stage Email Flow

1. **First Follow-Up (3-7 days)** - `ResourceFollowUpEmail`
   - Sent 3-7 days after showing a resource (depending on resource type)
   - Asks: "Did you contact them? How did it go?"
   - Links to detailed feedback form
   - Friendly, helpful tone focused on helping other claimants

2. **Second Follow-Up (10 days)** - `ResourceAlternativesEmail`
   - Sent 7 days after first email if no response
   - More urgent: "Still need help? Here are alternatives"
   - Offers alternative resources
   - Links to chat support

3. **Success Email** - `ResourceSuccessEmail`
   - Sent immediately after positive feedback
   - Congratulates user on getting their document
   - Encourages them to upload the document to their portal
   - Includes upload tips

## Implementation Details

### Database Schema

**EmailType Enum** (prisma/schema.prisma:492-511)
```prisma
enum EmailType {
  // ... existing types
  RESOURCE_FOLLOW_UP        // Initial follow-up for resource feedback
  RESOURCE_ALTERNATIVES     // Second follow-up with alternatives
  RESOURCE_SUCCESS          // Success confirmation with upload prompt
}
```

**ResourceInteraction Model** (prisma/schema.prisma:2107-2146)
- `followUpScheduledFor`: When to send first email
- `followUpSentAt`: When first email was sent
- `followUpMethod`: "email", "sms", or "modal"
- `followUpCompletedAt`: When user provided feedback
- `followUpReminderSent`: Boolean flag for second email

### Email Templates

All templates located in `src/emails/client/`:

1. **resource-follow-up.tsx** - First follow-up
   - Props: claimantName, officeName, officeType, documentType, searchQuery, feedbackUrl
   - Subject: "How did it go with [Office Name]?"
   - Design: Friendly check-in with value proposition

2. **resource-alternatives.tsx** - Second follow-up
   - Props: claimantName, officeName, documentType, alternativeResources, feedbackUrl, chatUrl
   - Subject: "Still need help getting your [Document Type]?"
   - Design: Urgency card + 3 action steps + alternative resources

3. **resource-success.tsx** - Success confirmation
   - Props: claimantName, officeName, documentType, uploadUrl
   - Subject: "🎉 You got your [Document Type]! Now upload it"
   - Design: Celebration + next steps + upload tips

### Email Sending Functions

Located in `src/lib/email.ts:287-490`:

```typescript
// Send first follow-up (3-7 days after interaction)
sendResourceFollowUpEmail({
  to: string,
  claimantName?: string,
  officeName: string,
  officeType: string,
  documentType: string,
  searchQuery?: string,
  feedbackUrl: string,
  alternativesUrl?: string,
})

// Send second follow-up (7 days after first email)
sendResourceAlternativesEmail({
  to: string,
  claimantName?: string,
  officeName: string,
  documentType: string,
  alternativeResources?: Array<{ name, type, phone }>,
  feedbackUrl: string,
  chatUrl?: string,
})

// Send success email (after positive feedback)
sendResourceSuccessEmail({
  to: string,
  claimantName?: string,
  officeName: string,
  documentType: string,
  uploadUrl: string,
})
```

All functions:
- Check unsubscribe preferences via `EmailType`
- Use Resend API for delivery
- Include unsubscribe URLs in footer
- Return `{ success: boolean, emailId?: string, reason?: string }`

### Cron Job

**API Endpoint**: `/api/resources/follow-up/send/route.ts`

**Schedule**: Daily at 10am UTC (configured in vercel.json)

**Process**:
1. Find interactions where `followUpScheduledFor <= NOW` and `followUpSentAt IS NULL`
2. Send first follow-up emails
3. Mark `followUpSentAt` and `followUpMethod = "email"`
4. Find interactions where `followUpSentAt + 7 days <= NOW` and `followUpReminderSent = false`
5. Send second follow-up emails
6. Mark `followUpReminderSent = true`

**Security**: Requires `Bearer ${CRON_SECRET}` authorization header

**Batching**: Processes 100 interactions per run to avoid timeouts

**Error Handling**: Logs errors but continues processing remaining emails

### Feedback Form Integration

When user submits detailed feedback (`/api/resources/feedback/detailed/route.ts:78-127`):

1. Create ResourceFeedback record
2. Update ResourceInteraction with `followUpCompletedAt`
3. **If successfullyObtained = true**: Send success email with upload prompt
4. Update ResourceStats (totalSuccess, totalContacted, etc.)

### When Interactions Are Created

Contact Agent creates ResourceInteraction records when showing resources:
- File: `src/app/api/contact-agent/chat/route.ts`
- Sets `followUpScheduledFor` based on resource type:
  - Vital Records: 3 days
  - Medical Records: 7 days
- Captures: email, documentType, searchQuery, userId/sessionId

## Configuration

### Environment Variables

Required in `.env` and Vercel:

```env
RESEND_API_KEY=re_xxxxx           # For sending emails
CRON_SECRET=your-secret-here      # For securing cron endpoint
NEXTAUTH_URL=https://your-app.com # For generating links
```

### Vercel Cron Configuration

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/resources/follow-up/send",
      "schedule": "0 10 * * *"  // Daily at 10am UTC
    }
  ]
}
```

## Testing

### Manual Testing

1. **Create test interaction with email**:
```sql
INSERT INTO "ResourceInteraction" (
  id, "resourceId", email, "documentType",
  "followUpScheduledFor", "createdAt", "updatedAt"
) VALUES (
  'test123', 'some-resource-id', 'test@example.com', 'Birth Certificate',
  NOW() - INTERVAL '1 day', NOW(), NOW()
);
```

2. **Trigger cron manually**:
```bash
curl -X POST https://your-app.com/api/resources/follow-up/send \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

3. **Check email was sent**:
```sql
SELECT "followUpSentAt", "followUpMethod"
FROM "ResourceInteraction"
WHERE id = 'test123';
```

### Email Preview

To preview emails locally:

1. Start dev server: `pnpm dev`
2. Import email component in a test page
3. Or use `@react-email/render` to generate HTML

### Testing Success Email

Submit positive feedback via `/feedback/[interactionId]`:
- Set "Did you contact them?" = Yes
- Set "Did you get your document?" = Yes
- Submit form
- Check email inbox for success email

## Monitoring

### Metrics to Track

1. **Email Delivery**:
   - First follow-ups sent per day
   - Second follow-ups sent per day
   - Success emails sent per day
   - Failed sends (check logs)

2. **User Engagement**:
   - Feedback completion rate after first email
   - Feedback completion rate after second email
   - Time from email to feedback submission

3. **Resource Quality**:
   - Success rate by resource
   - Average response time by resource
   - Cost trends

### Query Examples

**Pending first follow-ups**:
```sql
SELECT COUNT(*)
FROM "ResourceInteraction"
WHERE "followUpScheduledFor" <= NOW()
  AND "followUpSentAt" IS NULL
  AND email IS NOT NULL;
```

**Pending second follow-ups**:
```sql
SELECT COUNT(*)
FROM "ResourceInteraction"
WHERE "followUpSentAt" <= NOW() - INTERVAL '7 days'
  AND "followUpReminderSent" = false
  AND "followUpCompletedAt" IS NULL
  AND email IS NOT NULL;
```

**Completion rate**:
```sql
SELECT
  COUNT(*) FILTER (WHERE "followUpCompletedAt" IS NOT NULL) * 100.0 / COUNT(*) as completion_rate
FROM "ResourceInteraction"
WHERE "followUpSentAt" IS NOT NULL;
```

## Unsubscribe Handling

Uses existing `EmailPreference` system:
- Each EmailType (RESOURCE_FOLLOW_UP, etc.) can be unsubscribed independently
- Unsubscribe URL included in email footer
- Sending functions check `isUnsubscribed()` before sending
- Returns `{ success: false, reason: "unsubscribed" }` if user opted out

## Future Enhancements

### Phase 2 (Not Yet Implemented)

1. **Alternative Resource Lookup**:
   - Query database for alternative resources by documentType and state
   - Include 2-3 alternatives in second follow-up email

2. **User Name Personalization**:
   - Look up user's name from User table via userId
   - Pass to email templates for "Hi [Name]" greeting

3. **SMS Follow-Ups**:
   - Add SMS option via Twilio
   - Set `followUpMethod = "sms"` for users without email

4. **In-Portal Modal**:
   - Show feedback modal when user visits portal after followUpScheduledFor
   - Track via `followUpMethod = "modal"`

5. **Smart Scheduling**:
   - Adjust followUpScheduledFor based on historical response times
   - Urgent documents: 2 days
   - Slow offices: 14 days

6. **A/B Testing**:
   - Test different subject lines
   - Test different send times
   - Track open rates and conversion

## Support & Troubleshooting

### Common Issues

**Emails not sending**:
1. Check RESEND_API_KEY is set
2. Verify cron is running (check Vercel dashboard)
3. Check logs for errors: `vercel logs --follow`
4. Verify email addresses are valid

**Wrong send time**:
- Cron runs at 10am UTC
- Adjust schedule in vercel.json if needed
- Remember: UTC != your timezone

**Database out of sync**:
```bash
DATABASE_URL="postgresql://..." npx prisma db push
npx prisma generate
```

**Missing followUpScheduledFor**:
- Only new interactions will have this field
- Old interactions need backfill (manual SQL update)

## Files Changed/Created

### New Files
- `src/emails/client/resource-follow-up.tsx`
- `src/emails/client/resource-alternatives.tsx`
- `src/emails/client/resource-success.tsx`
- `src/app/api/resources/follow-up/send/route.ts`
- `RESOURCE_EMAIL_FOLLOWUP.md` (this file)

### Modified Files
- `prisma/schema.prisma` - Added EmailType entries
- `src/lib/email.ts` - Added 3 new email functions
- `src/app/api/resources/feedback/detailed/route.ts` - Added success email trigger
- `vercel.json` - Added cron configuration

## Related Documentation

- `RESOURCE_FEEDBACK_FLOW.md` - Overall feedback system design
- `RESOURCE_HUB_AND_TRACKING_PLAN.md` - Resource tracking strategy
- `EMAIL_INTEGRATION.md` - Email system documentation
- Contact Agent Implementation - See `/api/contact-agent/chat/route.ts`

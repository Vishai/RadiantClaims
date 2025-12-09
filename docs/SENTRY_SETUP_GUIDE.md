# Sentry Error Tracking Setup Guide

**Status**: Configured, needs Sentry DSN
**Last Updated**: December 9, 2024
**Step 4 of Beta Launch Roadmap**

---

## Overview

Sentry has been configured to track errors and performance issues in:
- **Client-side** (browser errors, React component errors)
- **Server-side** (API routes, server components)
- **Edge runtime** (middleware)

---

## Quick Start (5 Minutes)

### 1. Create Sentry Account (if you don't have one)

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for free account
3. Create a new project:
   - Platform: **Next.js**
   - Project name: **radiant-claims** (or your preference)
   - Alert frequency: **On every new issue**

### 2. Get Your DSN

After creating the project:
1. Go to **Settings** → **Projects** → **radiant-claims**
2. Click **Client Keys (DSN)**
3. Copy the **DSN** (looks like: `https://[key]@[region].ingest.sentry.io/[project-id]`)

### 3. Add DSN to Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry Configuration
# Get these from https://sentry.io/settings/radiant-claims/keys/
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-region.ingest.sentry.io/your-project-id"
SENTRY_DSN="https://your-key@your-region.ingest.sentry.io/your-project-id"

# Optional: Auth token for uploading source maps (production only)
# SENTRY_AUTH_TOKEN="your-auth-token"
```

**Note**: Use the same DSN for both variables (client and server)

### 4. Verify Installation

Restart your dev server:
```bash
lsof -ti:3000 | xargs kill -9
pnpm run dev
```

You should see no errors. Sentry is now silently running in the background.

### 5. Test Error Tracking

Create a test error to verify Sentry is working:

1. **Method 1: Add a test page**
   ```typescript
   // app/sentry-test/page.tsx
   'use client';

   export default function SentryTestPage() {
     return (
       <button onClick={() => {
         throw new Error('Test Sentry error tracking!');
       }}>
         Trigger Test Error
       </button>
     );
   }
   ```

2. **Method 2: Use browser console**
   ```javascript
   // In browser console on any page
   import * as Sentry from '@sentry/nextjs';
   Sentry.captureException(new Error('Test error'));
   ```

3. **Check Sentry Dashboard**
   - Go to [sentry.io](https://sentry.io)
   - View **Issues** tab
   - Should see your test error within seconds

---

## Configuration Files Created

### 1. `sentry.client.config.ts`
**Purpose**: Captures client-side errors (browser, React components)

**Features**:
- Session replay (10% of sessions, 100% with errors)
- Masked text and blocked media for privacy
- Filters out browser extension errors
- Filters out ad blocker network errors

### 2. `sentry.server.config.ts`
**Purpose**: Captures server-side errors (API routes, SSR)

**Features**:
- 10% transaction sampling in production
- Filters development database errors
- Tags all errors with `app: radiant-claims` and `component: server`

### 3. `sentry.edge.config.ts`
**Purpose**: Captures Edge runtime errors (middleware)

**Features**:
- Lightweight configuration for edge functions
- Same sampling rates as server

### 4. `next.config.mjs` (updated)
**Purpose**: Integrates Sentry with Next.js build process

**Features**:
- Automatic source map upload (production only)
- React component annotation in breadcrumbs
- Tree-shaking of Sentry logger statements

---

## What Gets Tracked

### Automatic Error Tracking
- ✅ Unhandled JavaScript errors
- ✅ Unhandled promise rejections
- ✅ React component errors (Error Boundaries)
- ✅ API route errors
- ✅ Server component errors
- ✅ Middleware errors

### Performance Monitoring
- ✅ Page load times
- ✅ API response times
- ✅ Database query performance (via transactions)
- ✅ Third-party API calls

### Session Replay (Privacy-Focused)
- ✅ 10% of all sessions recorded
- ✅ 100% of error sessions recorded
- ✅ All text masked (no PII captured)
- ✅ All media blocked (no images/videos)

---

## Manual Error Tracking

### Capture Custom Errors

```typescript
import * as Sentry from '@sentry/nextjs';

// Basic error capture
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// With additional context
Sentry.captureException(error, {
  tags: {
    section: 'document-upload',
    user_action: 'upload-birth-certificate',
  },
  extra: {
    fileSize: file.size,
    fileName: file.name,
  },
});

// Capture messages (non-errors)
Sentry.captureMessage('User uploaded malformed PDF', 'warning');
```

### Add User Context

```typescript
import * as Sentry from '@sentry/nextjs';

// Set user info (do this after authentication)
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear user on logout
Sentry.setUser(null);
```

### Add Breadcrumbs

```typescript
import * as Sentry from '@sentry/nextjs';

// Manual breadcrumbs for debugging
Sentry.addBreadcrumb({
  category: 'document-upload',
  message: 'User started upload',
  level: 'info',
  data: {
    documentType: 'birth_certificate',
    sessionId: 'abc123',
  },
});
```

---

## Integration with RECA Application

### Where to Add Error Tracking

#### 1. Document Upload Errors
**File**: `/src/components/documents/DocumentUploadZone.tsx`

```typescript
import * as Sentry from '@sentry/nextjs';

async function handleUpload(file: File) {
  try {
    const result = await uploadDocument(file);
    return result;
  } catch (error) {
    // Track upload failures
    Sentry.captureException(error, {
      tags: {
        section: 'document-upload',
        fileType: file.type,
      },
      extra: {
        fileName: file.name,
        fileSize: file.size,
      },
    });
    throw error;
  }
}
```

#### 2. Form Submission Errors
**File**: `/src/components/reca/parts/*Form.tsx`

```typescript
import * as Sentry from '@sentry/nextjs';

async function onSubmit(data: FormData) {
  try {
    await saveFormData(data);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'form-submission',
        formPart: 'part_2',
      },
      extra: {
        formData: JSON.stringify(data),
      },
    });
    throw error;
  }
}
```

#### 3. API Route Errors
**File**: `/src/app/api/**/*.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // ... your API logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api_route: '/api/reca/documents',
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 4. Critical User Actions

Track important events even if they don't error:

```typescript
import * as Sentry from '@sentry/nextjs';

// When user completes application
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User completed RECA application',
  level: 'info',
  data: {
    sessionId: session.id,
    documentCount: uploadedFiles.length,
  },
});

// When user submits for review
Sentry.captureMessage('RECA application submitted for review', {
  level: 'info',
  tags: {
    user_id: user.id,
    session_id: session.id,
  },
});
```

---

## Sentry Dashboard Features

### Issues Tab
- **All errors** captured from the application
- Grouped by similar errors
- Shows frequency, affected users, last seen
- Click for full stack trace and context

### Performance Tab
- **Transaction traces** showing slow operations
- Database query performance
- API endpoint response times
- Client-side render times

### Replays Tab
- **Session recordings** for errors
- See exactly what user did before error
- All PII masked for privacy

### Releases Tab
- Track errors by deployment version
- See which version introduced bugs
- Track error resolution across releases

---

## Production Deployment

### Environment Variables

Add to production environment (Railway, Vercel, etc.):

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_DSN="https://..."

# Optional but recommended
SENTRY_AUTH_TOKEN="your-auth-token"  # For source map upload
SENTRY_ORG="your-org-name"
SENTRY_PROJECT="radiant-claims"
```

### Source Maps

Source maps help you debug production errors with readable stack traces.

**To enable**:
1. Get auth token from Sentry: **Settings** → **Auth Tokens** → **Create New Token**
2. Set `SENTRY_AUTH_TOKEN` environment variable
3. Source maps will upload automatically on build

**Security**: Source maps are stored on Sentry's servers, not exposed to users

---

## Alerts & Notifications

### Set Up Alerts

1. Go to **Alerts** in Sentry dashboard
2. Click **Create Alert Rule**
3. Recommended rules:

**Critical Errors**:
- **When**: Error occurs
- **Condition**: `event.level:error AND event.tags.severity:critical`
- **Action**: Email + Slack notification

**High Error Rate**:
- **When**: Error count > 10 in 5 minutes
- **Condition**: Any error
- **Action**: Email team

**Performance Degradation**:
- **When**: Transaction duration > 2s
- **Condition**: Any API route
- **Action**: Create Jira ticket

### Integration Options

Sentry integrates with:
- **Slack**: Real-time error notifications
- **Jira**: Automatic ticket creation
- **GitHub**: Link errors to commits
- **PagerDuty**: On-call alerts

---

## Privacy & Compliance

### PII Protection

Sentry is configured to protect user privacy:

1. **Session Replay**:
   - `maskAllText: true` - All text is masked with `***`
   - `blockAllMedia: true` - No images/videos captured
   - Only captures DOM structure and user interactions

2. **Error Context**:
   - User IDs captured (not names/emails unless you set them)
   - Request URLs captured (query params can contain PII - see below)
   - Form data NOT captured automatically

### Sensitive Data Scrubbing

Add to Sentry configs if needed:

```typescript
// In sentry.client.config.ts
beforeSend(event) {
  // Remove sensitive query params
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/ssn=\d+/g, 'ssn=[Filtered]');
  }

  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
  }

  return event;
}
```

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check**:
1. DSN is set in `.env.local`
2. Dev server restarted after adding DSN
3. Error actually thrown (not just console.log)
4. Network tab shows requests to `sentry.io`

**Debug Mode**:
```typescript
// In sentry configs, set:
debug: true,
```

This will log all Sentry activity to console.

### Too Many Errors

**Reduce noise**:
```typescript
// In sentry configs
ignoreErrors: [
  // Browser extensions
  /chrome-extension/,
  // Ad blockers
  /Failed to fetch/,
  // Known non-issues
  'ResizeObserver loop limit exceeded',
],
```

### Source Maps Not Uploading

**Check**:
1. `SENTRY_AUTH_TOKEN` set in production
2. Token has `project:releases` permission
3. Build logs show `Uploading source maps`

**Manual upload**:
```bash
npx @sentry/cli sourcemaps upload \
  --org your-org \
  --project radiant-claims \
  ./out
```

---

## Cost Estimate

Sentry pricing (as of 2024):

**Free Tier**:
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 replay sessions/month
- **Good for**: Beta testing, small apps

**Paid Tiers**:
- **Team**: $26/month
  - 50,000 errors
  - 100,000 transactions
  - 500 replays

- **Business**: $80/month
  - 500,000 errors
  - Unlimited transactions
  - 5,000 replays

**For Beta Launch**: Free tier is sufficient

---

## Next Steps

1. ✅ Sentry SDK installed
2. ✅ Configuration files created
3. ⏳ Create Sentry account
4. ⏳ Get DSN and add to .env.local
5. ⏳ Test error capture
6. ⏳ Set up alerts
7. ⏳ Add error tracking to critical code paths

---

## Additional Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Next.js Integration**: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- **Session Replay**: https://docs.sentry.io/product/session-replay/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/

---

**Sentry setup is complete! Add your DSN to start tracking errors. 🎉**

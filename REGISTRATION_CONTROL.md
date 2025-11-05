# Registration Control

This document explains how to control user registration on the RadiantClaims platform.

## Overview

A registration blocking feature has been implemented to allow you to temporarily disable new user registrations while keeping the existing system operational for current users. This is useful during onboarding, when finalizing terms of service, legal workflows, or during maintenance periods.

## How It Works

The system uses an environment variable `REGISTRATION_ENABLED` to control whether new user registrations are accepted.

### Environment Variable

- **Variable Name**: `REGISTRATION_ENABLED`
- **Default Value**: `true` (registrations enabled)
- **To Block Registrations**: Set to `false`

### Configuration Files

The variable has been added to:

1. **`.env.example`** - Template for new deployments (default: `true`)
2. **`.env`** - Your local environment (currently set to: `false`)

## How to Use

### Block New Registrations

To prevent new users from signing up:

1. Open your `.env` file
2. Set `REGISTRATION_ENABLED=false`
3. Restart your application server

For production deployments (Vercel, Railway, etc.):
- Add `REGISTRATION_ENABLED=false` to your environment variables
- Redeploy or restart the application

### Enable Registrations

To allow new users to sign up:

1. Open your `.env` file
2. Set `REGISTRATION_ENABLED=true`
3. Restart your application server

## What Gets Blocked

When `REGISTRATION_ENABLED=false`, the following endpoints will reject new registration attempts:

- `/api/auth/register` - Main registration endpoint
- `/api/auth/signup` - Alternative signup endpoint

### Response When Blocked

Users attempting to register will receive:

- **HTTP Status Code**: `503` (Service Unavailable)
- **Error Response**:
  ```json
  {
    "error": "Registration is temporarily disabled",
    "message": "We're currently not accepting new registrations while we finalize our terms of service and workflows. Please check back soon!"
  }
  ```

### User-Facing Pages That Handle This

The following pages have been updated to display the maintenance message:

- `/register` - Main registration page
- `/reca/signup` - RECA-specific signup page
- Account creation modals in the RECA wizard

## What Still Works

When registrations are blocked, **existing users can still**:

- ✅ Log in to their accounts
- ✅ Access the portal and all features
- ✅ Submit claims
- ✅ Upload documents
- ✅ View their claim status
- ✅ All other authenticated functionality

Only **new account creation** is blocked.

## Testing

The feature has been tested and verified to work correctly:

1. ✅ Registration endpoints return 503 when `REGISTRATION_ENABLED=false`
2. ✅ User-facing pages display appropriate error messages
3. ✅ Existing user login continues to work normally

## Current Status

**Registration is currently BLOCKED** (`.env` has `REGISTRATION_ENABLED=false`)

## Lead Collection (Waitlist)

### How It Works

When registration is blocked, interested users can join a **waitlist** instead of creating an account. This allows you to:

- ✅ **Collect leads** while registration is closed
- ✅ **Track interest** with email, name, and claim type
- ✅ **Build anticipation** for your launch
- ✅ **Notify users** when you're ready to accept registrations

### Waitlist Features

**Automatic Lead Collection:**
- When users try to register and see the 503 error, they're prompted to join the waitlist
- Data collected: email (required), name (optional), claim type (optional)
- Tracks source page, UTM parameters, and submission attempts
- Prevents duplicates - multiple submissions increment a counter

**Admin Dashboard:**
- View all waitlist entries at `/admin/waitlist`
- Filter by status (Pending, Contacted, Converted, etc.)
- Export to CSV for email campaigns
- Track conversion metrics

**Lead Status Workflow:**
- `PENDING` - New lead, not yet contacted
- `CONTACTED` - You've reached out to them
- `CONVERTED` - Successfully created their account
- `DECLINED` - They declined when contacted
- `INVALID` - Invalid email or spam

### Database Schema

The `RegistrationWaitlist` table stores:
- Contact info (email, name)
- Interest data (claim type, source)
- Engagement metrics (submission count, notification status)
- Conversion tracking (converted user ID, converted date)
- Marketing attribution (UTM parameters)

### API Endpoints

**Submit to Waitlist:**
```bash
POST /api/waitlist
{
  "email": "user@example.com",
  "name": "John Doe",
  "claimType": "DOWNWINDER",
  "source": "register_page"
}
```

**Admin Management:**
```bash
GET /api/admin/waitlist?status=PENDING  # View leads
PATCH /api/admin/waitlist                # Update status
{
  "id": "lead_id",
  "status": "CONTACTED",
  "notes": "Sent welcome email"
}
```

### Converting Waitlist to Users

When you're ready to enable registration:

1. **Export the waitlist** from `/admin/waitlist`
2. **Update environment**: Set `REGISTRATION_ENABLED=true`
3. **Send notification emails** to waitlist leads
4. **Track conversions** as they sign up (match by email)
5. **Update status** to `CONVERTED` when they create accounts

### Example Workflow

1. User tries to register → sees "Registration temporarily disabled"
2. User joins waitlist with email
3. You collect 100+ leads over 2 weeks
4. Terms of service finalized
5. Set `REGISTRATION_ENABLED=true`
6. Send email to all `PENDING` waitlist entries
7. Users sign up, admin marks them as `CONVERTED`

## When to Re-Enable

Re-enable registrations when:

- ✅ Terms of Service are finalized and published
- ✅ Legal workflows are approved by the firm
- ✅ Privacy Policy is in place
- ✅ Onboarding processes are ready
- ✅ Support systems are prepared for new users
- ✅ You've reviewed and are ready to convert waitlist leads

## Implementation Details

### Protected Endpoints

- `src/app/api/auth/register/route.ts:6-18`
- `src/app/api/auth/signup/route.ts:6-18`

### Updated Frontend Components

- `src/app/register/page.tsx:67-75`
- `src/app/reca/signup/page.tsx:84-91`
- `src/components/reca/wizard/AccountCreationModal.tsx:92-99`
- `src/components/reca/wizard 2/AccountCreationModal.tsx:94-101`

### Environment Configuration

- `.env` - Local environment (set to `false`)
- `.env.example` - Template for deployments (default: `true`)

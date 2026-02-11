# DOJ Claim Tracking System

**Date**: December 7, 2024
**Status**: ✅ COMPLETE
**Purpose**: Track government-assigned claim IDs and sync claim status with DOJ system

---

## 🎯 Overview

This system enables tracking of DOJ-assigned claim numbers and synchronizing claim status updates between RadiantClaims and the Department of Justice's RECA system.

### Key Features
- ✅ Store and manage DOJ claim numbers
- ✅ Track claim lifecycle milestones
- ✅ Prevent duplicate claim numbers
- ✅ Role-based access control
- ✅ Audit logging for all changes
- ✅ User-friendly UI for viewing and updating
- ✅ Visual status tracker with timeline

---

## 📊 Database Structure

### Existing Model: `ClaimLifecycle`

The DOJ claim number is stored in the existing `ClaimLifecycle` model:

```prisma
model ClaimLifecycle {
  id         String   @id @default(cuid())
  claimantId String   @unique
  claimant   Claimant @relation(fields: [claimantId], references: [id], onDelete: Cascade)

  // Current Status
  currentMilestone     DOJMilestone @default(NOT_SUBMITTED)
  currentMilestoneDate DateTime     @default(now())

  // Key Dates
  submittedToRadiantAt DateTime?
  submittedToDOJAt     DateTime?
  receivedByDOJAt      DateTime?
  completenessReviewAt DateTime?
  eligibilityReviewAt  DateTime?
  approvedAt           DateTime?
  deniedAt             DateTime?
  paymentIssuedAt      DateTime?
  paymentReceivedAt    DateTime?

  // Processing Details
  dojClaimNumber         String?   // ← DOJ-assigned claim ID
  expectedCompletionDate DateTime?
  estimatedPayoutDate    DateTime?
  daysInCurrentMilestone Int       @default(0)
  totalProcessingDays    Int       @default(0)

  // ... more fields
}
```

### DOJ Milestones

```prisma
enum DOJMilestone {
  NOT_SUBMITTED        // Claim not yet mailed
  SUBMITTED_TO_DOJ     // Mailed to DOJ
  RECEIVED_BY_DOJ      // DOJ logged receipt
  COMPLETENESS_REVIEW  // DOJ reviewing documents
  ELIGIBILITY_REVIEW   // DOJ reviewing eligibility
  APPROVED             // Claim approved
  DENIED               // Claim denied
  PAYMENT_PROCESSING   // Treasury processing payment
  PAYMENT_ISSUED       // Payment issued
  PAYMENT_RECEIVED     // Claimant received payment
}
```

---

## 🔌 API Endpoints

### 1. GET `/api/claims/[claimantId]/doj-claim-number`

Get the DOJ claim number and status for a claimant.

**Authentication**: Required

**Authorization**:
- Claimant owner
- Admin
- Attorney
- Staff reviewer

**Response**:
```json
{
  "claimantId": "clm_123",
  "claimantName": "John Doe",
  "dojClaimNumber": "DOJ-2024-12345",
  "currentMilestone": "RECEIVED_BY_DOJ",
  "submittedToDOJAt": "2024-11-01T00:00:00.000Z",
  "receivedByDOJAt": "2024-11-15T00:00:00.000Z"
}
```

---

### 2. PUT `/api/claims/[claimantId]/doj-claim-number`

Add or update the DOJ claim number.

**Authentication**: Required

**Authorization**:
- Claimant owner
- Admin
- Attorney
- Staff reviewer

**Request Body**:
```json
{
  "dojClaimNumber": "DOJ-2024-12345",
  "receivedByDOJAt": "2024-11-15" // Optional
}
```

**Features**:
- ✅ Validates claim number is provided
- ✅ Checks for duplicate claim numbers
- ✅ Auto-updates milestone to `RECEIVED_BY_DOJ`
- ✅ Creates milestone event
- ✅ Creates audit log

**Response**:
```json
{
  "success": true,
  "lifecycle": {
    "id": "lc_123",
    "claimantId": "clm_123",
    "dojClaimNumber": "DOJ-2024-12345",
    "currentMilestone": "RECEIVED_BY_DOJ",
    "receivedByDOJAt": "2024-11-15T00:00:00.000Z"
  },
  "message": "DOJ claim number updated successfully"
}
```

**Error Responses**:
- `400`: Missing or invalid claim number
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (not authorized for this claim)
- `404`: Claimant not found
- `409`: Duplicate claim number (already assigned to another claimant)

---

### 3. DELETE `/api/claims/[claimantId]/doj-claim-number`

Remove the DOJ claim number (admin/senior staff only).

**Authentication**: Required

**Authorization**:
- Admin
- Senior reviewer ONLY

**Response**:
```json
{
  "success": true,
  "message": "DOJ claim number removed successfully"
}
```

---

## 🎨 React Components

### 1. DOJClaimNumberManager

Main component for managing DOJ claim numbers.

**File**: `src/components/claims/DOJClaimNumberManager.tsx`

**Features**:
- View current DOJ claim number
- Add/edit DOJ claim number
- View received date
- Delete claim number (admin only)
- Form validation
- Success/error messaging
- Loading states

**Props**:
```typescript
{
  claimantId: string;        // Required
  allowEdit?: boolean;       // Default: true
  allowDelete?: boolean;     // Default: false (admin only)
  onUpdate?: () => void;     // Callback after update
}
```

**Usage**:
```tsx
import { DOJClaimNumberManager } from "@/components/claims/DOJClaimNumberManager";

function ClaimDetailPage({ claimantId }) {
  return (
    <DOJClaimNumberManager
      claimantId={claimantId}
      allowEdit={true}
      allowDelete={isAdmin}
      onUpdate={() => {
        // Refresh other data
        loadClaimData();
      }}
    />
  );
}
```

**States**:
- **No claim number**: Shows prompt to add
- **Has claim number (view mode)**: Shows claim number with edit button
- **Edit mode**: Form to enter/update claim number
- **Loading**: Spinner while fetching/saving
- **Success**: Green checkmark with confirmation
- **Error**: Red alert with error message

---

### 2. DOJStatusTracker

Visual status tracker showing claim progress through DOJ system.

**File**: `src/components/claims/DOJStatusTracker.tsx`

**Features**:
- Current milestone display with icon
- Timeline of completed milestones
- Pending milestones shown in gray
- DOJ contact information
- Color-coded status badges

**Props**:
```typescript
{
  claimantId: string;
  showDetailedTimeline?: boolean;  // Default: true
}
```

**Usage**:
```tsx
import { DOJStatusTracker } from "@/components/claims/DOJStatusTracker";

function ClaimPortal({ claimantId }) {
  return (
    <div>
      <h1>Claim Status</h1>
      <DOJStatusTracker
        claimantId={claimantId}
        showDetailedTimeline={true}
      />
    </div>
  );
}
```

**Milestone Colors**:
- 🔵 Blue: Submitted/Received (early stages)
- 🟣 Purple: Under review
- 🟢 Green: Approved/Payment
- 🔴 Red: Denied
- ⚪ Gray: Not yet reached

---

## 🔐 Security & Permissions

### Role-Based Access

| Action | Owner | Admin | Attorney | Staff | Senior Staff |
|--------|-------|-------|----------|-------|--------------|
| View claim number | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add claim number | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit claim number | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete claim number | ❌ | ✅ | ❌ | ❌ | ✅ |

### Data Validation

1. **Claim Number**: Must be non-empty string
2. **Uniqueness**: Checked across all claimants
3. **Received Date**: Optional, validated if provided
4. **Authorization**: Verified on every request

### Audit Logging

All DOJ claim number changes are logged:

```typescript
{
  userId: "user_123",
  action: "DOJ_CLAIM_NUMBER_UPDATED",
  resourceType: "ClaimLifecycle",
  resourceId: "lc_123",
  ipAddress: "192.168.1.1",
  metadata: {
    claimantId: "clm_123",
    dojClaimNumber: "DOJ-2024-12345",
    receivedByDOJAt: "2024-11-15"
  }
}
```

---

## 📱 User Flows

### Flow 1: Claimant Receives DOJ Claim Number

1. Claimant receives letter from DOJ with claim number
2. Claimant logs into portal
3. Navigates to claim details
4. Sees "No DOJ Claim Number Yet" message
5. Clicks "Add DOJ Claim Number"
6. Enters claim number (e.g., "DOJ-2024-12345")
7. Optionally enters received date
8. Clicks "Save"
9. System validates claim number
10. Checks for duplicates
11. Updates lifecycle milestone
12. Shows success message
13. Claim number displayed with green checkmark

---

### Flow 2: Admin Updates Incorrect Claim Number

1. Admin receives notification of incorrect claim number
2. Navigates to claimant's profile
3. Sees current DOJ claim number displayed
4. Clicks "Edit" button
5. Updates claim number
6. Clicks "Save"
7. System validates and checks duplicates
8. Updates with audit log
9. Success confirmation shown
10. Updated claim number displayed

---

### Flow 3: Staff Removes Duplicate Claim Number

1. Senior staff identifies duplicate claim number
2. Navigates to one of the duplicate claims
3. Sees "Remove" button (trash icon)
4. Clicks "Remove"
5. Confirmation dialog appears
6. Confirms removal
7. System removes claim number
8. Creates audit log
9. Success message shown
10. Claim returns to "No DOJ Claim Number" state

---

## 🔄 Integration Points

### Portal Integration

Add to claimant detail page:

```tsx
// src/app/portal/claims/[id]/page.tsx

import { DOJClaimNumberManager } from "@/components/claims/DOJClaimNumberManager";
import { DOJStatusTracker } from "@/components/claims/DOJStatusTracker";

export default function ClaimDetailPage({ params }) {
  return (
    <div className="space-y-6">
      {/* Existing claim details */}

      {/* DOJ Claim Number */}
      <DOJClaimNumberManager
        claimantId={params.id}
        allowEdit={true}
      />

      {/* Status Tracker */}
      <DOJStatusTracker
        claimantId={params.id}
        showDetailedTimeline={true}
      />

      {/* Other sections */}
    </div>
  );
}
```

### Admin Dashboard Integration

```tsx
// src/app/admin/claims/[id]/page.tsx

import { DOJClaimNumberManager } from "@/components/claims/DOJClaimNumberManager";

export default function AdminClaimPage({ params, session }) {
  const isAdmin = session.user.role === "ADMIN";
  const isSeniorStaff = session.user.role === "SENIOR_REVIEWER";

  return (
    <div>
      <DOJClaimNumberManager
        claimantId={params.id}
        allowEdit={true}
        allowDelete={isAdmin || isSeniorStaff}
        onUpdate={() => {
          // Refresh dashboard data
          revalidateClaimList();
        }}
      />
    </div>
  );
}
```

---

## 📊 Future Enhancements

### Phase 2: Automated Status Sync
- [ ] Scrape DOJ website for status updates
- [ ] Email notifications when status changes
- [ ] Webhook integration with DOJ API (if available)
- [ ] Auto-update milestones based on DOJ data

### Phase 3: Document Sync
- [ ] Upload additional docs requested by DOJ
- [ ] Track document submissions
- [ ] Receive DOJ document acknowledgments
- [ ] Link documents to specific claim milestones

### Phase 4: Analytics
- [ ] Average processing time per milestone
- [ ] Success rate tracking
- [ ] Identify common denial reasons
- [ ] Predictive completion dates

---

## 🧪 Testing

### Manual Testing Checklist

**As Claimant**:
- [ ] View claim without DOJ number (shows prompt)
- [ ] Add DOJ claim number
- [ ] Edit existing claim number
- [ ] View status tracker
- [ ] Verify cannot delete claim number

**As Admin**:
- [ ] View any claimant's DOJ number
- [ ] Edit any claimant's DOJ number
- [ ] Delete claim number
- [ ] Verify audit logs created

**Edge Cases**:
- [ ] Try to add duplicate claim number (should fail)
- [ ] Try to add empty claim number (should fail)
- [ ] Edit claim number for claim that doesn't exist (should 404)
- [ ] Try to delete as non-admin (should 403)

### API Testing

```bash
# Get DOJ claim number
curl http://localhost:3001/api/claims/clm_123/doj-claim-number \
  -H "Cookie: next-auth.session-token=..."

# Add DOJ claim number
curl -X PUT http://localhost:3001/api/claims/clm_123/doj-claim-number \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"dojClaimNumber": "DOJ-2024-12345", "receivedByDOJAt": "2024-11-15"}'

# Delete DOJ claim number (admin only)
curl -X DELETE http://localhost:3001/api/claims/clm_123/doj-claim-number \
  -H "Cookie: next-auth.session-token=..."
```

---

## 📝 Notes

### DOJ Claim Number Format

The DOJ typically assigns claim numbers in formats like:
- `DOJ-2024-12345`
- `RECA-24-12345`
- `RD-2024-12345`

**No specific format is enforced** - any string can be entered to accommodate variations.

### Timeline Accuracy

The timeline shows:
- **Green checkmarks**: Milestones with confirmed dates
- **Gray clocks**: Pending milestones (estimated)

The system relies on manual updates from:
- DOJ correspondence
- Phone calls with DOJ staff
- DOJ online status portal
- Physical mail from DOJ

### Data Privacy

DOJ claim numbers are considered sensitive information:
- Only accessible to authorized users
- All access logged via audit system
- Not exposed in public APIs
- Protected by authentication/authorization

---

## ✅ Completion Status

- [x] Database schema (already existed in ClaimLifecycle)
- [x] API endpoint GET (view claim number)
- [x] API endpoint PUT (add/update claim number)
- [x] API endpoint DELETE (remove claim number)
- [x] DOJClaimNumberManager component
- [x] DOJStatusTracker component
- [x] Authorization checks
- [x] Duplicate detection
- [x] Audit logging
- [x] Documentation

**Status**: ✅ READY FOR INTEGRATION AND TESTING

---

Last Updated: December 7, 2024

# Resource Hub & Document Tracking System

## Overview
A comprehensive system that tracks the user's document-gathering journey from initial contact through receipt, with intelligent guidance based on their specific RECA claim requirements.

---

## Core Components

### 1. Resource Hub (My Contacts)
**Location:** `/dashboard/resources` or `/my-resources`

A centralized view showing all institutional contacts the user has interacted with through the Contact Agent.

#### Card Display Format
```
┌─────────────────────────────────────────────────────┐
│ 🏛️ Tooele County Clerk                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                     │
│ 📋 Requested Documents:                             │
│   • Birth Certificate (Mary Smith, 1954)            │
│     Status: ⏳ Waiting - Contacted 3 days ago      │
│                                                     │
│   • Marriage Certificate (Mary Smith, 1972)         │
│     Status: ⏳ Waiting - Contacted 3 days ago      │
│                                                     │
│ 📞 Contact Info:                                    │
│   Phone: 435-555-0123                              │
│   Email: clerk@tooeleco.org                        │
│   Last contacted: Nov 14, 2025                     │
│                                                     │
│ 💡 Next Step:                                       │
│   Typical response time: 5-7 business days         │
│   Follow up if no response by: Nov 21              │
│                                                     │
│ [Update Status] [Contact Again] [Mark Received]    │
└─────────────────────────────────────────────────────┘
```

#### Status Options
- **Not Started** - Contact found but not contacted yet
- **Contacted** - User reached out, waiting for response
- **In Progress** - Response received, documents being processed
- **Ready for Pickup** - Documents ready
- **Received** - Documents obtained
- **Issue** - Problem occurred (wrong info, office can't help, etc.)
- **Not Needed** - User decided not to pursue

---

### 2. Document Checklist Dashboard
**Location:** `/dashboard` (main widget) or `/dashboard/documents`

An intelligent checklist that adapts to the user's specific claim requirements.

#### Example for Female Claimant (Married Twice)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Your RECA Document Checklist                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│ 👤 IDENTITY DOCUMENTS                                           │
│   ✅ Current Proof of Identity                                  │
│      Driver's License - Uploaded Nov 10                        │
│                                                                 │
│ 📜 NAME CHANGE TRAIL (Required to trace back to maiden name)   │
│   ⏳ Current Marriage Certificate (Mary Johnson → Mary Smith)   │
│      Requested from: Tooele County Clerk                       │
│      Status: Waiting (3 days) - Expected by Nov 21             │
│      [View Details] [Update Status]                            │
│                                                                 │
│   🔴 First Marriage Certificate (Mary Smith → Mary Jones)       │
│      Needed from: Iron County, Utah (1972)                     │
│      [Find Contact] [I Have This]                              │
│                                                                 │
│   🔴 Birth Certificate (Original name: Mary Williams)           │
│      Needed to prove: Original identity                        │
│      Born: St. George, Utah (1954)                             │
│      [Find Contact] [I Have This]                              │
│                                                                 │
│ 🏥 MEDICAL RECORDS                                              │
│   🔴 Cancer Diagnosis Records                                   │
│      [Find Hospital Contacts]                                   │
│                                                                 │
│ 🏠 RESIDENCE PROOF (1951-1958, 1962)                            │
│   ⚠️  School Records (Priority: High)                           │
│      Would prove residence during downwinder period            │
│      [Find School Districts]                                    │
│                                                                 │
│ Progress: 2 of 8 documents started (25%)                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Smart Requirements Engine
The system analyzes the user's intake form and determines:

**For Name Changes:**
- If female → Check marital status
- If married → Request marriage certificate(s)
- If divorced → May need divorce decree showing name restoration
- Chain back: Current name → Marriage 2 → Marriage 1 → Birth certificate

**For Residence Proof:**
- Required years based on claim type (downwinder, worker, ore transporter)
- Suggests: School records, employment records, tax records, utility bills
- Location: Must match exposure site proximity

**For Medical Records:**
- Cancer type determines which records needed
- Hospital/clinic where diagnosed
- Pathology reports, biopsy results

---

### 3. Database Schema Additions

#### New Table: `DocumentRequest`
Tracks each individual document the user needs to obtain.

```prisma
model DocumentRequest {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // What document
  documentType     String  // "BIRTH_CERT", "MARRIAGE_CERT", "MEDICAL_RECORDS"
  documentPurpose  String  // "NAME_CHANGE_TRAIL", "IDENTITY", "RESIDENCE_PROOF", "MEDICAL_EVIDENCE"
  subjectName      String? // "Mary Smith" (who the document is for)
  subjectBirthYear Int?
  requiredForClaim Boolean @default(true) // Is this mandatory or optional?

  // Where to get it
  resourceId       String?
  resource         DocumentResource? @relation(fields: [resourceId], references: [id])
  customLocation   String? // If user sources it elsewhere

  // Status tracking
  status           DocumentRequestStatus @default(NOT_STARTED)
  dateContacted    DateTime?
  dateReceived     DateTime?
  dateUploaded     DateTime? // When uploaded to our system
  uploadedDocId    String?   // Link to Document table

  // Follow-up
  expectedBy       DateTime? // Estimated arrival date
  followUpDate     DateTime? // When to remind user
  notes            String?   @db.Text

  // Metadata
  priority         Int       @default(5) // 1-10, higher = more urgent
  blocksOtherDocs  Boolean   @default(false) // Must get this before requesting others

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([userId, status])
  @@index([followUpDate])
}

enum DocumentRequestStatus {
  NOT_STARTED      // Haven't attempted to get it yet
  RESEARCHING      // Finding the right office/contact
  READY_TO_REQUEST // Know where to get it, haven't contacted yet
  CONTACTED        // Reached out, waiting for response
  IN_PROGRESS      // They're processing the request
  READY_PICKUP     // Available for pickup/download
  RECEIVED         // User has the physical/digital document
  UPLOADED         // Uploaded to our system
  VERIFIED         // Staff verified it's correct
  ISSUE            // Problem occurred
  NOT_NEEDED       // No longer required
}
```

#### Update: `ResourceInteraction`
Link to the specific document request:

```prisma
model ResourceInteraction {
  // ... existing fields ...

  documentRequestId String?
  documentRequest   DocumentRequest? @relation(fields: [documentRequestId], references: [id])
}
```

---

### 4. Intelligent Checklist Generation

#### Logic: Name Change Trail
```typescript
async function generateNameChangeTrail(user: User, claimantData: Claimant) {
  const documents: DocumentRequest[] = [];

  // Start with current identity
  documents.push({
    documentType: 'CURRENT_ID',
    documentPurpose: 'IDENTITY',
    status: 'NOT_STARTED',
    priority: 10,
  });

  // If female and married, trace back name changes
  if (claimantData.gender === 'FEMALE') {
    const marriages = claimantData.maritalHistory; // From intake form

    // Reverse chronological order (most recent first)
    for (let i = marriages.length - 1; i >= 0; i--) {
      const marriage = marriages[i];
      documents.push({
        documentType: 'MARRIAGE_CERT',
        documentPurpose: 'NAME_CHANGE_TRAIL',
        subjectName: `${marriage.priorName} → ${marriage.marriedName}`,
        status: 'NOT_STARTED',
        priority: 9 - i, // Earlier marriages are higher priority
        blocksOtherDocs: true, // Need to trace the chain
      });
    }
  }

  // Finally, birth certificate with maiden name
  documents.push({
    documentType: 'BIRTH_CERT',
    documentPurpose: 'IDENTITY',
    subjectName: claimantData.birthName,
    subjectBirthYear: claimantData.birthYear,
    status: 'NOT_STARTED',
    priority: 10,
  });

  return documents;
}
```

---

### 5. User Flows

#### Flow A: User Finds Contact via Contact Agent
1. User asks: "I need a birth certificate from Utah"
2. Contact Agent shows: Tooele County Clerk
3. User clicks "This looks right"
4. **System prompts**: "Add this to your document tracker?"
5. User confirms → Creates:
   - `ResourceInteraction` (for feedback/follow-up)
   - `DocumentRequest` (links to their checklist)
   - Status: `RESEARCHING` → `READY_TO_REQUEST`

#### Flow B: User Updates Status in Resource Hub
1. User visits Resource Hub
2. Sees "Tooele County Clerk - Birth Certificate - Waiting 5 days"
3. Clicks "Update Status"
4. Options:
   - "I received the document" → Upload prompt
   - "Still waiting" → Updates followUpDate
   - "They can't help" → Marks as ISSUE, suggests alternatives
   - "I contacted them again" → Updates dateContacted

#### Flow C: System Follow-Up Email
1. 3 days after contact → Email: "Status check: Birth certificate"
2. User clicks link → `/resources/[resourceId]/update`
3. Quick update form → Updates DocumentRequest status
4. If "Received" → Prompt to upload
5. If "Issue" → Suggest alternative contacts

---

### 6. Dashboard Widgets

#### Widget 1: Active Requests (High Priority)
```
🔥 Action Needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Follow up with Tooele County Clerk (10 days since contact)
• Still need: First marriage certificate (blocking other docs)
• Ready to request: School records from Cedar City
```

#### Widget 2: Progress Overview
```
📊 Document Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓░░░░░░░░ 35% Complete

✅ 3 Received & Uploaded
⏳ 2 Waiting for Response
🔴 4 Not Yet Started
```

#### Widget 3: Recent Activity
```
📅 Recent Updates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Birth Certificate - Received (Nov 15)
• Contacted Tooele County Clerk (Nov 12)
• Marriage Certificate added to checklist (Nov 10)
```

---

### 7. Integration with Contact Agent

Update the Contact Agent chat to be context-aware:

**Before showing contacts:**
```
AI: "I see you need a marriage certificate to complete your name change trail.
     This is required to trace back to your maiden name for your RECA claim.

     Let me find the right office for your 1972 marriage in Iron County..."
```

**After showing contacts:**
```
AI: "I found Iron County Clerk - they handle marriage certificates from 1972.

     Would you like me to add this to your document tracker? I'll help you
     remember to follow up and track when you receive it."

     [Add to Tracker] [Just Save Contact Info]
```

---

### 8. Implementation Priority

#### Phase 1: Foundation (This sprint)
- [x] Database migration (ResourceInteraction, ResourceFeedback, ResourceStats)
- [x] Contact Agent creates ResourceInteraction records
- [x] Immediate feedback (thumbs up/down)
- [ ] Add DocumentRequest table
- [ ] Resource Hub page (basic view of contacted resources)

#### Phase 2: Smart Checklist (Next sprint)
- [ ] Document requirement logic based on claim type
- [ ] Name change trail generation for married females
- [ ] Dashboard widget showing document progress
- [ ] Link Contact Agent results to DocumentRequest

#### Phase 3: Follow-Up System (Sprint 3)
- [ ] Email system with Resend
- [ ] Status update flows
- [ ] Automated reminders based on typical processing times
- [ ] Alternative contact suggestions if issues

#### Phase 4: Social Proof & Optimization (Sprint 4)
- [ ] Stats aggregation background job
- [ ] Display success rates on contact cards
- [ ] "Others who requested this document also needed..." suggestions
- [ ] Processing time predictions based on historical data

---

## Key Benefits

### For Users:
✅ **Clear roadmap** - Know exactly what documents they need
✅ **Less overwhelm** - One task at a time with priorities
✅ **No lost contacts** - All resources saved in one place
✅ **Proactive reminders** - System nudges when action needed
✅ **Progress visibility** - See how far they've come

### For RadiantClaims:
✅ **Better completion rates** - Users less likely to get stuck
✅ **Quality data** - Know which contacts work, which don't
✅ **Reduced support load** - Self-service tracking
✅ **Claim insights** - See where users struggle most
✅ **Competitive advantage** - No other RECA tool does this

---

## Technical Notes

### Performance Considerations
- Cache document checklist (regenerate only when claim data changes)
- Paginate resource hub if user has 10+ contacts
- Background job for follow-up email scheduling

### Privacy & Security
- Users can delete contacts from their hub
- Sensitive documents encrypted at rest
- Follow-up emails use anonymous links (no userId in URL)

### Edge Cases
- User contacts office directly (not through our system) → "Add manual contact" button
- Office closed/no longer exists → Mark as unavailable, suggest alternatives
- User already has document → "I already have this" option
- Multiple people need documents from same office → Batch tracking

---

## Next Steps

1. **Create DocumentRequest schema** - Add to prisma/schema.prisma
2. **Build Resource Hub page** - `/dashboard/resources`
3. **Update Contact Agent** - Add "Add to Tracker" prompt after showing contacts
4. **Create checklist generator** - Analyze claim → Generate document list
5. **Build status update flows** - Allow users to update document status
6. **Design follow-up email templates** - Using Resend

---

## Questions to Answer
- [ ] Should we pre-populate checklist based on intake form, or let user build it organically?
- [ ] Do we want to let attorneys/staff mark documents as "verified" vs just "uploaded"?
- [ ] Should follow-up emails come from system or attorney's email?
- [ ] Do we show estimated cost/time for each document in checklist?
- [ ] Integration with existing Document Upload system?

---

**Last Updated:** November 17, 2025
**Status:** Phase 1 in progress (feedback system foundation complete)

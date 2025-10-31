# RadiantClaims DIY Features - Implementation Priority

## 🎯 Core Philosophy
- **The app fills out the form for them** - We're not teaching them HOW to fill forms, we're DOING it for them
- Focus on infrastructure before fancy features
- Build things that scale to other claim types (future-proofing the Document Vault)

---

## 📊 Immediate Priorities (Next 4-6 Weeks)

### **Priority 1: Document Resources System** 🏛️
**Why First:** Without this, users are stuck finding documents on their own. This is fundamental value.

#### Database Already Has:
✅ `DocumentResource` model (state/county resources)
✅ `DocumentRequirement` model (what docs are needed)
✅ `ClaimantDocumentStatus` model (tracking what user has)

#### What We Need to Build:

**1.1 Resource Search & Display**
```typescript
// Components to build:
<ResourceFinder
  state={user.state}
  county={user.county}
  documentType="BIRTH_CERTIFICATE"
/>

// Shows:
- Office name, address, phone
- Website link (conditional on availability)
- Cost estimate
- Processing time
- Special instructions
```

**1.2 Conditional Contact Display**
```typescript
interface DocumentResource {
  // Only show fields that exist
  phone?: string;           // Show if available
  phoneTollFree?: string;   // Show if available
  website?: string;         // Show if available
  email?: string;           // Show if available

  // Always show
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

// UI logic:
{resource.website ? (
  <a href={resource.website}>Visit Website</a>
) : null}

{resource.phone ? (
  <a href={`tel:${resource.phone}`}>Call: {resource.phone}</a>
) : null}
```

**1.3 Seed Script for Resources**
```typescript
// prisma/seed-resources.ts
// Pre-populate with government offices for:
- Utah vital records offices
- Nevada vital records offices
- Arizona vital records offices
- Idaho vital records offices
- New Mexico vital records offices
- County clerks (Washington County, etc.)
- Major hospitals (St. George Regional, etc.)
- State cancer registries
```

**Files to Create:**
- `src/components/resources/ResourceFinder.tsx`
- `src/components/resources/ResourceCard.tsx`
- `src/app/resources/page.tsx` (browse all resources)
- `src/app/api/resources/search/route.ts`
- `scripts/seed-resources.ts`

**Estimated Time:** 1 week

---

### **Priority 2: Document Upload System Overhaul** 📤
**Why:** You mentioned it doesn't work well currently. Let's fix it.

#### Current Issues to Address:
- [ ] Upload reliability (large files, timeouts)
- [ ] File preview not working?
- [ ] Missing progress indicators
- [ ] No OCR extraction
- [ ] Can't categorize documents easily

#### What We'll Build:

**2.1 Robust Upload Component**
```typescript
// New component: DocumentUploadZone.tsx
<DocumentUploadZone
  acceptedTypes={["application/pdf", "image/*"]}
  maxSize={10 * 1024 * 1024} // 10MB
  onUploadComplete={(file) => {
    // Trigger OCR extraction
    // Auto-categorize document type
    // Update claimant document status
  }}
  multiple={true}
  showPreview={true}
/>

Features:
- Drag & drop
- Click to upload
- Multiple file support
- Progress bars for each file
- Thumbnail previews
- Mobile camera upload (built into web app, no separate app)
- File size compression before upload
```

**2.2 Smart Document Categorization**
```typescript
// Auto-detect document type from filename/content
"birth_certificate.pdf" → FileCategory.IDENTITY
"pathology_report.pdf" → FileCategory.PATHOLOGY_REPORT
"utility_bill_1962.jpg" → FileCategory.UTILITY_BILL

// Let user confirm/change category
<DocumentCategorySelector
  detectedCategory="PATHOLOGY_REPORT"
  onConfirm={(category) => saveDocument(category)}
/>
```

**2.3 OCR Integration**
```typescript
// Two options:

// Option A: Tesseract.js (free, client-side)
import Tesseract from 'tesseract.js';

async function extractText(imageFile: File) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
  return text;
}

// Option B: AWS Textract (paid, better accuracy)
// Use for production

// Store extracted text in UploadedFile.ocrText
```

**2.4 Mobile Camera Integration** (Web API, not separate app)
```typescript
// Use HTML5 Media Capture API
<input
  type="file"
  accept="image/*"
  capture="environment"  // Use back camera
/>

// Works on mobile web browsers!
// No separate app needed
```

**2.5 Document Management Dashboard**
```typescript
<DocumentDashboard>
  <DocumentList>
    {documents.map(doc => (
      <DocumentCard
        name={doc.originalFilename}
        category={doc.category}
        status={doc.status}
        uploadedAt={doc.uploadedAt}
        onView={() => viewDocument(doc)}
        onDelete={() => deleteDocument(doc)}
        onRecategorize={() => showCategoryPicker(doc)}
      />
    ))}
  </DocumentList>

  <RequiredDocumentsChecklist>
    {/* Show what's missing */}
  </RequiredDocumentsChecklist>
</DocumentDashboard>
```

**Files to Create/Update:**
- `src/components/documents/DocumentUploadZone.tsx` (new)
- `src/components/documents/DocumentCategorySelector.tsx` (new)
- `src/components/documents/DocumentCard.tsx` (new)
- `src/components/documents/DocumentDashboard.tsx` (new)
- `src/app/api/documents/upload/route.ts` (update)
- `src/app/api/documents/[id]/ocr/route.ts` (new)
- `src/lib/ocr/extractor.ts` (new)

**Estimated Time:** 1.5 weeks

---

### **Priority 3: Claimant Portal** 🏠
**Why:** Users need a central hub to see their progress and manage their claim.

#### Portal Sections:

**3.1 Dashboard Overview**
```typescript
<PortalDashboard>
  {/* Progress Card */}
  <Card>
    <h3>Your RECA Claim</h3>
    <Progress value={85} />
    <p>85% Complete</p>

    <div className="quick-stats">
      <Stat label="Documents Uploaded" value="8/12" />
      <Stat label="Form Sections" value="14/16" />
      <Stat label="Completeness Score" value="85%" />
    </div>

    <Button>Continue Form</Button>
  </Card>

  {/* Service Tier Card */}
  <Card>
    <h3>Service Plan</h3>
    <Badge>DIY Document Preparation</Badge>
    <p>Next billing: Dec 15, 2025 ($24.99)</p>
    <Link href="/portal/subscription">Manage Subscription</Link>
  </Card>

  {/* Documents Card */}
  <Card>
    <h3>Documents</h3>
    <p>8 uploaded, 4 needed</p>
    <Link href="/portal/documents">Manage Documents</Link>
  </Card>

  {/* Resources Card */}
  <Card>
    <h3>Find Documents</h3>
    <p>Get contact info for vital records offices</p>
    <Link href="/resources">Browse Resources</Link>
  </Card>

  {/* Payout Pulse Card (if submitted) */}
  {claimSubmitted && (
    <Card>
      <h3>Claim Status</h3>
      <Badge>DOJ Processing</Badge>
      <p>Current milestone: Document Verification</p>
      <Link href="/portal/timeline">View Timeline</Link>
    </Card>
  )}
</PortalDashboard>
```

**3.2 Subscription Management**
```typescript
// src/app/portal/subscription/page.tsx
<SubscriptionPortal>
  {/* Current Plan */}
  <Card>
    <h3>DIY Document Preparation</h3>
    <p>Setup Fee: $149.99 (paid Oct 31, 2025)</p>
    <p>Monthly: $24.99</p>
    <p>Next billing: Dec 15, 2025</p>
    <p>Billing method: •••• 4242</p>
  </Card>

  {/* Actions */}
  <Card>
    <h4>Manage Subscription</h4>
    <Button>Update Payment Method</Button>
    <Button>Upgrade to Legal Representation</Button>
    <Button variant="ghost">Cancel Subscription</Button>
  </Card>

  {/* Billing History */}
  <Card>
    <h4>Billing History</h4>
    <Table>
      <Row date="Oct 31, 2025" amount="$149.99" type="Setup Fee" status="Paid" />
      <Row date="Nov 15, 2025" amount="$24.99" type="Monthly" status="Paid" />
    </Table>
  </Card>

  {/* Refund Eligibility (if applicable) */}
  {canRequestRefund && (
    <Card variant="warning">
      <h4>Refund Available</h4>
      <p>You're within the 7-day refund window and haven't downloaded your RECA form PDF.</p>
      <Button>Request Refund</Button>
    </Card>
  )}
</SubscriptionPortal>
```

**3.3 Document Management Page**
```typescript
// src/app/portal/documents/page.tsx
<DocumentsPortal>
  {/* Upload Area */}
  <DocumentUploadZone />

  {/* Required Documents Checklist */}
  <Card>
    <h3>Required Documents</h3>
    <Checklist>
      <Item
        checked={hasDocument('BIRTH_CERTIFICATE')}
        label="Birth Certificate"
        action={<FindResourceButton type="BIRTH_CERTIFICATE" />}
      />
      <Item
        checked={hasDocument('DEATH_CERTIFICATE')}
        label="Death Certificate"
        action={<FindResourceButton type="DEATH_CERTIFICATE" />}
      />
      {/* ... */}
    </Checklist>
  </Card>

  {/* Uploaded Documents */}
  <DocumentDashboard />
</DocumentsPortal>
```

**3.4 Profile Settings**
```typescript
// src/app/portal/settings/page.tsx
<SettingsPortal>
  <Card>
    <h3>Personal Information</h3>
    <Form>
      <Input label="Name" value={user.name} />
      <Input label="Email" value={user.email} />
      <Input label="Phone" value={user.phone} />
      <Button>Save Changes</Button>
    </Form>
  </Card>

  <Card>
    <h3>Notification Preferences</h3>
    <Toggle label="Email notifications" />
    <Toggle label="Weekly progress updates" />
    <Toggle label="Document reminders" />
  </Card>

  <Card>
    <h3>Security</h3>
    <Button>Change Password</Button>
    <Button>Enable Two-Factor Authentication</Button>
  </Card>
</SettingsPortal>
```

**Files to Create:**
- `src/app/portal/page.tsx` (dashboard)
- `src/app/portal/subscription/page.tsx`
- `src/app/portal/documents/page.tsx`
- `src/app/portal/settings/page.tsx`
- `src/components/portal/DashboardCard.tsx`
- `src/components/portal/ProgressWidget.tsx`
- `src/components/portal/BillingHistory.tsx`

**Estimated Time:** 1 week

---

## 🎨 Nice-to-Have Features (Post-Core)

### **Feature 4: Beneficiary Calculator** (Conditional Sidebar)
**When to Show:** Only when `claimant.relationshipToClaimant !== 'SELF'` AND multiple beneficiaries

```typescript
// Appears as sidebar in Part 14 (Beneficiaries)
<BeneficiaryCalculator
  totalCompensation={100000}
  state="UT"
  beneficiaries={[
    { relationship: "SPOUSE", alive: true },
    { relationship: "CHILD", alive: true },
    { relationship: "CHILD", alive: true }
  ]}
/>

// Output:
// Under Utah intestate succession law:
// Spouse: 100% if no children
// Spouse + Children: Spouse gets 50%, children split 50%
//
// Your distribution (informational only, not legal advice):
// - Spouse: $50,000
// - Child 1: $25,000
// - Child 2: $25,000
//
// Note: This is a general guide. Actual distribution may vary.
// Consult an attorney for legal advice on inheritance.
```

**Files to Create:**
- `src/components/beneficiary/BeneficiaryCalculator.tsx`
- `src/lib/beneficiary/distribution-rules.ts` (state-by-state)

**Estimated Time:** 3 days

---

### **Feature 5: Timeline Visualizer** 📅
**Where:** Part 6 (Exposure Period)

```typescript
<TimelineVisualizer
  events={[
    { date: "1951-01-27", label: "Atmospheric testing begins", type: "historical" },
    { date: "1960-03-15", label: "Your birth", type: "personal" },
    { date: "1960-05-01", label: "Moved to St. George, UT", type: "personal" },
    { date: "1962-10-31", label: "Last atmospheric test", type: "historical" },
    { date: "1963-08-01", label: "Moved away", type: "personal" },
    { date: "1965-12-31", label: "Affected area period ends", type: "historical" },
    { date: "1985-06-15", label: "Cancer diagnosis", type: "personal" }
  ]}
/>

// Visual:
// 1951 |----[Testing Period]------------------| 1962
//      |         1960 (Birth)
//      |         1960-1963 (Lived in affected area)
//      |                                      1963 (Moved)
//      |                              1965 (Period ends)
//      |                                               1985 (Diagnosis)
//
// Highlights:
// ✅ You lived in affected area during testing period
// ✅ Exposure period: 3 years (meets 2-year requirement)
// ⚠️  Diagnosis was 22 years after exposure (within compensable window)
```

**Files to Create:**
- `src/components/timeline/TimelineVisualizer.tsx`
- `src/lib/timeline/reca-dates.ts` (historical test dates)

**Estimated Time:** 4 days

---

### **Feature 6: Document Vault** 🗄️
**Vision:** Secure, lifetime storage that can expand to other claim types

```typescript
// Database expansion:
model DocumentVault {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(...)

  documents   VaultDocument[]

  storageUsed Int          @default(0) // bytes
  storageLimit Int         @default(1073741824) // 1GB default

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model VaultDocument {
  id              String       @id @default(cuid())
  vaultId         String
  vault           DocumentVault @relation(...)

  // Document info
  originalName    String
  fileKey         String       // R2/S3 key
  mimeType        String
  sizeBytes       Int

  // Categorization
  documentType    String       // "BIRTH_CERTIFICATE", "MEDICAL_RECORD"
  claimType       String?      // "RECA", "SSDI", "VA_BENEFITS" (future)
  tags            String[]     // User-defined tags

  // Metadata
  uploadedAt      DateTime
  lastAccessedAt  DateTime?

  // Sharing (future)
  sharedWith      String[]     // User IDs
  expiresAt       DateTime?

  @@index([vaultId])
  @@index([documentType])
  @@index([claimType])
}
```

**UI:**
```typescript
<DocumentVault>
  {/* Folder structure */}
  <VaultSidebar>
    <Folder name="RECA Claim" count={12} />
    <Folder name="Personal Records" count={3} />
    <Folder name="Medical Records" count={8} />
    {/* Future: */}
    {/* <Folder name="SSDI Claim" count={0} /> */}
  </VaultSidebar>

  {/* Document grid */}
  <VaultContent>
    {documents.map(doc => (
      <VaultDocumentCard
        name={doc.originalName}
        type={doc.documentType}
        uploadedAt={doc.uploadedAt}
        size={doc.sizeBytes}
        onView={() => viewDocument(doc)}
        onDownload={() => downloadDocument(doc)}
        onShare={() => shareDocument(doc)}
        onTag={() => addTags(doc)}
      />
    ))}
  </VaultContent>

  {/* Storage meter */}
  <StorageMeter used={vaultStorageUsed} limit={vaultStorageLimit} />
</DocumentVault>
```

**Future Expansion:**
- Support for SSDI claims
- VA benefits claims
- Medicare appeals
- SSI applications
- Any senior-focused claims

**Files to Create:**
- `prisma/schema.prisma` (add DocumentVault models)
- `src/app/vault/page.tsx`
- `src/components/vault/VaultDocumentCard.tsx`
- `src/components/vault/VaultSidebar.tsx`
- `src/app/api/vault/upload/route.ts`
- `src/app/api/vault/[id]/share/route.ts`

**Estimated Time:** 1 week (worth doing right!)

---

## 📅 Implementation Timeline

### **Sprint 1 (Week 1-2): Resources**
- [ ] Build ResourceFinder component
- [ ] Create resource search API
- [ ] Seed database with government offices (UT, NV, AZ, ID, NM)
- [ ] Build resource browse page
- [ ] Integrate into form sections (show relevant resources)

### **Sprint 2 (Week 3-4): Document Upload Overhaul**
- [ ] Build new DocumentUploadZone component
- [ ] Add mobile camera support (web API)
- [ ] Implement OCR extraction (Tesseract.js)
- [ ] Build document categorization
- [ ] Create document management dashboard
- [ ] Fix upload reliability issues

### **Sprint 3 (Week 5): Claimant Portal**
- [ ] Build portal dashboard (overview)
- [ ] Create subscription management page
- [ ] Build document management portal page
- [ ] Add settings/profile page
- [ ] Connect to existing features

### **Sprint 4 (Week 6-7): Polish & Nice-to-Haves**
- [ ] Beneficiary calculator (conditional)
- [ ] Timeline visualizer
- [ ] UI polish and testing
- [ ] Bug fixes

### **Sprint 5 (Week 8+): Document Vault** (Future-proof investment)
- [ ] Design vault data model
- [ ] Build vault UI
- [ ] Implement storage management
- [ ] Add sharing capabilities
- [ ] Plan for multi-claim-type support

---

## 🎯 Success Metrics

After these features:
- **Resources:** Users can find document sources in <30 seconds
- **Upload:** 100% upload success rate, <5 second upload time for typical docs
- **Portal:** Users visit portal 3x per claim (average)
- **Completeness:** 90% of DIY users submit complete applications on first try

---

## 💰 Cost Estimates

**Stripe Fees:**
- $149.99 setup: Stripe takes $4.64 → You get $145.35
- $24.99/month: Stripe takes $1.02 → You get $23.97/month

**Operating Costs:**
- OCR: Free (Tesseract.js) or ~$0.05/document (AWS Textract)
- Storage: Cloudflare R2 ~$0.015/GB/month
- AI Assistant (future): ~$0.50-2.00 per user per month

**Profit per DIY User:**
- Month 1: $145.35 (setup) + $23.97 (monthly) = $169.32
- Month 2+: $23.97/month
- Year 1: $169.32 + (11 × $23.97) = $433.02

---

## 🚀 Ready to Start?

Based on your priorities, I recommend:

1. **Start with Resources** - Quick win, immediate value
2. **Fix Document Upload** - Core feature that's not working well
3. **Build Portal** - Ties everything together

Which one should we tackle first? I can start coding right now! 🎨

My vote: **Resources System** - It's the foundation for everything else and we can knock it out fast with the data model already in place.

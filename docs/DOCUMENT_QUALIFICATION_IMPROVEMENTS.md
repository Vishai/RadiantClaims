# Document Qualification & Categorization Improvements

**Issue:** Users see inflated claim completeness percentages due to AI miscategorization, leading to false confidence that claims are DOJ-ready when they're not.

**Date:** 2025-11-02

---

## Problems Identified

### 1. Miscategorization Creates False Completeness
- AI categorizes documents incorrectly (e.g., random photo as "MEDICAL_RECORDS")
- System calculates 75% completeness based on wrong categories
- User believes claim is nearly complete when it's actually 0% complete
- **Critical UX issue:** False confidence could lead to rejected claims

### 2. "OTHER" Category is Ambiguous
- Documents marked "OTHER" don't count toward completeness (correct)
- But no clear messaging about what this means
- Users don't know if "OTHER" docs are useful or useless

### 3. No Clear Feedback on Document Value
- No visual distinction between:
  - ✅ Required documents that count toward DOJ approval
  - ℹ️ Supporting documents that help but don't count
  - ❌ Irrelevant documents that should be removed
- Users can't quickly assess claim readiness

### 4. No Easy Way to Fix Miscategorization
- If AI gets it wrong, user has to delete and re-upload
- No simple "This is actually a..." correction mechanism

---

## Proposed Solutions

### Solution 1: Add Document Qualification Status Badge

**Add prominent badge to DocumentCard showing DOJ qualification status:**

```typescript
// New badge types:
- 🟢 "COUNTS TOWARD CLAIM" - Required doc, correctly categorized
- 🟡 "SUPPORTING ONLY" - Useful but doesn't satisfy requirement
- 🔴 "DOES NOT COUNT" - Wrong category, fix needed
- ⚪ "UNKNOWN" - Not yet analyzed
```

**Visual Design:**
```
┌─────────────────────────────────────┐
│  📄 birth_certificate.pdf           │
│  Oct 15, 2024 • 2.3 MB              │
│                                      │
│  [Identity Document] [Ready]         │
│  🟢 COUNTS TOWARD CLAIM              │
│     ✓ Satisfies "Birth Certificate  │
│       or Proof of Birth" requirement │
│                                      │
│  [View] [Download] [AI Analysis]     │
└─────────────────────────────────────┘
```

vs

```
┌─────────────────────────────────────┐
│  📄 random_photo.jpg                 │
│  Oct 15, 2024 • 1.1 MB              │
│                                      │
│  [Other] [Ready]                     │
│  🔴 DOES NOT COUNT TOWARD CLAIM      │
│     This document type is not        │
│     required for RECA claims.        │
│     ⚠️ AI detected as "Other" -      │
│     verify this is correct           │
│                                      │
│  [View] [Recategorize] [Delete]      │
└─────────────────────────────────────┘
```

---

### Solution 2: Enhanced Completeness Messaging

**Current (misleading):**
```
Claim Completeness
Overall Progress: 75%
[████████████▓▓▓▓] 75%
```

**Proposed (truthful):**
```
DOJ Claim Readiness
3 of 4 Required Documents: 75%
[████████████▓▓▓▓] 75%

✅ Required Documents (3):
   • Birth Certificate - birth_cert.pdf
   • Proof of Residence - utility_bill_1955.pdf
   • Medical Diagnosis - pathology_report.pdf

⚠️ Missing Required (1):
   • Pathology Report (Medium Priority)
     Upload biopsy or pathology report confirming cancer diagnosis

ℹ️ Supporting Documents (2):
   • school_records_1954.pdf - Provides additional residence proof
   • employment_letter.pdf - Shows work history context

🔴 Documents Not Counted (3):
   • random_photo.jpg - Not a required document type
   • receipt.pdf - Miscategorized, please recategorize or delete
   • notes.txt - Text files not accepted by DOJ
```

---

### Solution 3: Improved "OTHER" Category Handling

**Add intelligence to "OTHER" docs:**

When AI categorizes something as "OTHER", system should:

1. **Check if it might be useful:**
   ```typescript
   // Analyze OTHER docs for potential value
   if (category === "OTHER") {
     const analysis = await analyzeOtherDocument(ocrText);

     if (analysis.mightBeSupporting) {
       // Tag as "potentially_supporting"
       // Show message: "This might provide additional context"
     } else {
       // Tag as "likely_irrelevant"
       // Show message: "This document type is not used for RECA claims"
     }
   }
   ```

2. **Ask user to confirm:**
   ```
   ⚠️ AI couldn't determine document type

   This document was categorized as "Other" which means it won't
   count toward your claim completeness.

   What is this document?
   [ ] Supporting Document (e.g., additional proof, context)
   [ ] I uploaded the wrong file (delete it)
   [ ] This should be: [Dropdown: Select correct category]

   [Confirm] [I'll review later]
   ```

---

### Solution 4: User Recategorization Workflow

**Add "Fix Categorization" button that opens modal:**

```
┌────────────────────────────────────────────┐
│  Fix Document Categorization               │
├────────────────────────────────────────────┤
│                                            │
│  Current: [Other] (AI Confidence: 45%)    │
│           ⚠️ Low confidence - needs review │
│                                            │
│  AI Reasoning:                             │
│  "This document contains mixed content.    │
│   Could not clearly identify as any        │
│   specific RECA document type."            │
│                                            │
│  ─────────────────────────────────────     │
│                                            │
│  What is this document actually?           │
│                                            │
│  ● Required RECA Document                  │
│    └─ [Select Category ▼]                  │
│       - Identity (Birth/Death Certificate) │
│       - Medical Records                    │
│       - Proof of Residence                 │
│       ...                                  │
│                                            │
│  ○ Supporting Document                     │
│    └─ Provides additional context but      │
│       doesn't satisfy a requirement        │
│                                            │
│  ○ Wrong Upload - Delete This              │
│    └─ I uploaded the wrong file            │
│                                            │
│  [Cancel]              [Update Category]   │
└────────────────────────────────────────────┘
```

---

### Solution 5: Real-Time Qualification Feedback

**During upload, show immediate qualification status:**

```
Uploading: birth_certificate.pdf
[████████████████████] 100%

✓ Upload complete
✓ OCR extracted 347 characters
✓ AI Analysis complete

🟢 GREAT NEWS!
This document counts toward your claim!

✓ Categorized as: Identity Document
✓ Satisfies requirement: "Birth Certificate or Proof of Birth"
✓ Claim completeness: 25% → 50% (+25%)

Quality Score: 92% - Excellent quality

[View Document] [Upload Another]
```

vs

```
Uploading: random_photo.jpg
[████████████████████] 100%

✓ Upload complete
✓ OCR extracted 12 characters
✓ AI Analysis complete

⚠️ HEADS UP!
This document doesn't count toward your claim.

❌ Categorized as: Other (Unknown Type)
❌ Does not satisfy any RECA requirements
❌ Claim completeness: 50% (unchanged)

This might be:
• Wrong file uploaded by mistake
• Supporting document (useful but not required)
• Non-document photo/screenshot

[Recategorize] [Delete] [Keep as Supporting]
```

---

## Implementation Plan

### Phase 1: Backend Changes (High Priority)

#### 1.1 Add Qualification Status to Metadata
**File:** `src/lib/document-intelligence/reca-compliance.ts`

```typescript
export interface DocumentQualification {
  status: "QUALIFIES" | "SUPPORTING" | "DOES_NOT_QUALIFY" | "UNKNOWN";
  confidence: number;
  reason: string;
  matchedRequirement?: {
    category: FileCategory;
    name: string;
    priority: "high" | "medium" | "low";
  };
  issues?: string[];
  categoryMismatch?: CategoryMismatch;
  // NEW FIELDS:
  djApprovalImpact: "REQUIRED" | "HELPFUL" | "NEUTRAL" | "HARMFUL";
  userActionNeeded: "NONE" | "VERIFY_CATEGORY" | "RECATEGORIZE" | "DELETE_OR_FIX";
  suggestion: string; // Human-readable action suggestion
}
```

#### 1.2 Enhanced "OTHER" Analysis
**New File:** `src/lib/document-intelligence/other-document-analyzer.ts`

```typescript
/**
 * Analyze "OTHER" category documents to determine if they might be useful
 */
export async function analyzeOtherDocument(
  ocrText: string,
  fileName: string
): Promise<{
  isPotentiallySupporting: boolean;
  likelyRelevance: "HIGH" | "MEDIUM" | "LOW";
  suggestions: string[];
  possibleCategories: FileCategory[];
}> {
  // Use GPT to analyze if "OTHER" doc might be useful
  const prompt = `
  This document couldn't be categorized into standard RECA claim types.

  Analyze if it might still be useful:
  - Does it mention radiation exposure, medical conditions, residence, employment?
  - Could it provide supporting context even if not a required doc?
  - Or is it completely irrelevant (random photo, receipt, etc.)?

  Filename: ${fileName}
  Content: ${ocrText.substring(0, 1000)}
  `;

  // ... GPT call to analyze
}
```

#### 1.3 Store Qualification in Database
**Update:** `src/app/api/documents/upload/route.ts`

```typescript
// After compliance check, store qualification status
const metadata = {
  // ... existing fields
  documentQualification: complianceResult.documentQualification,
  djApprovalImpact: getDJApprovalImpact(
    complianceResult.documentQualification
  ),
};

// If category is OTHER, run additional analysis
if (finalCategory === "OTHER") {
  const otherAnalysis = await analyzeOtherDocument(ocrResult.text, fileName);
  metadata.otherDocumentAnalysis = otherAnalysis;
}
```

---

### Phase 2: UI Enhancements (High Priority)

#### 2.1 Add Qualification Badge to DocumentCard
**File:** `src/components/documents/DocumentCard.tsx`

```typescript
// Add to DocumentCardProps
interface DocumentCardProps {
  // ... existing props
  qualificationStatus?: "QUALIFIES" | "SUPPORTING" | "DOES_NOT_QUALIFY" | "UNKNOWN";
  djApprovalImpact?: "REQUIRED" | "HELPFUL" | "NEUTRAL" | "HARMFUL";
  matchedRequirement?: string;
}

// New component for qualification badge
function QualificationBadge({ status, impact, requirement }) {
  const config = {
    QUALIFIES: {
      icon: "🟢",
      label: "COUNTS TOWARD CLAIM",
      className: "bg-green-50 border-green-300 text-green-800",
      description: `Satisfies: ${requirement}`,
    },
    SUPPORTING: {
      icon: "🟡",
      label: "SUPPORTING ONLY",
      className: "bg-blue-50 border-blue-300 text-blue-800",
      description: "Provides additional context",
    },
    DOES_NOT_QUALIFY: {
      icon: "🔴",
      label: "DOES NOT COUNT",
      className: "bg-red-50 border-red-300 text-red-800",
      description: "Not required for DOJ approval",
    },
    UNKNOWN: {
      icon: "⚪",
      label: "ANALYZING...",
      className: "bg-gray-50 border-gray-300 text-gray-800",
      description: "Processing document",
    },
  };

  const { icon, label, className, description } = config[status];

  return (
    <div className={`rounded-lg border p-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-xs opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Improve OverviewTab Completeness Display
**File:** `src/components/documents/intelligence/OverviewTab.tsx`

```typescript
export function OverviewTab({ data }: OverviewTabProps) {
  const { compliance, risks, aiCategorization, qualification } = data;

  // Separate documents by qualification
  const requiredDocs = documents.filter(d => d.qualification === "QUALIFIES");
  const supportingDocs = documents.filter(d => d.qualification === "SUPPORTING");
  const notCountedDocs = documents.filter(d =>
    d.qualification === "DOES_NOT_QUALIFY" || d.category === "OTHER"
  );

  return (
    <div className="space-y-6 py-4">
      {/* DOJ Claim Readiness Section */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">DOJ Claim Readiness</h3>

        {/* Main Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {requiredDocs.length} of {totalRequired} Required Documents
            </span>
            <span className={`text-2xl font-bold ${getCompletenessColor(completenessPercent)}`}>
              {completenessPercent}%
            </span>
          </div>
          <Progress value={completenessPercent} className="h-2" />

          {completenessPercent < 100 && (
            <p className="text-xs text-muted-foreground">
              ⚠️ This claim is not yet ready for DOJ submission.
              Upload {totalRequired - requiredDocs.length} more required document(s).
            </p>
          )}

          {completenessPercent >= 100 && (
            <p className="text-xs text-green-700">
              ✓ All required documents uploaded! Review for accuracy before submitting.
            </p>
          )}
        </div>
      </div>

      {/* Required Documents List */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Required Documents ({requiredDocs.length})
        </h4>
        <div className="space-y-2">
          {requiredDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 text-sm">
              <span className="text-green-600">✓</span>
              <span className="font-medium">{doc.matchedRequirement}</span>
              <span className="text-xs text-muted-foreground">• {doc.filename}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting Documents (if any) */}
      {supportingDocs.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
            <Info className="h-4 w-4" />
            Supporting Documents ({supportingDocs.length})
          </h4>
          <p className="mb-2 text-xs text-blue-800">
            These documents provide additional context but don't count toward
            the required checklist.
          </p>
          <div className="space-y-1">
            {supportingDocs.map(doc => (
              <div key={doc.id} className="text-xs text-blue-800">
                • {doc.filename}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Not Counted (WARNING) */}
      {notCountedDocs.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-900">
            <AlertTriangle className="h-4 w-4" />
            Documents Not Counted ({notCountedDocs.length})
          </h4>
          <p className="mb-2 text-xs text-red-800">
            ⚠️ These documents do NOT count toward your claim completeness.
            Please review and either recategorize or delete.
          </p>
          <div className="space-y-2">
            {notCountedDocs.map(doc => (
              <div key={doc.id} className="rounded border border-red-300 bg-white p-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-900">{doc.filename}</p>
                    <p className="text-xs text-red-700">
                      Categorized as: {doc.category}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecategorize(doc.id)}
                  >
                    Fix
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest of overview content... */}
    </div>
  );
}
```

---

### Phase 3: Recategorization Workflow (Medium Priority)

#### 3.1 Recategorization Modal Component
**New File:** `src/components/documents/RecategorizeModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface RecategorizeModalProps {
  documentId: string;
  currentCategory: string;
  aiReasoning?: string;
  aiConfidence?: number;
  isOpen: boolean;
  onClose: () => void;
  onRecategorize: (newCategory: string, action: "recategorize" | "supporting" | "delete") => Promise<void>;
}

export function RecategorizeModal({
  documentId,
  currentCategory,
  aiReasoning,
  aiConfidence,
  isOpen,
  onClose,
  onRecategorize,
}: RecategorizeModalProps) {
  const [action, setAction] = useState<"recategorize" | "supporting" | "delete">("recategorize");
  const [newCategory, setNewCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onRecategorize(newCategory, action);
      onClose();
    } catch (error) {
      console.error("Recategorization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fix Document Categorization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Current: {currentCategory}
                </p>
                {aiConfidence && aiConfidence < 0.7 && (
                  <p className="text-xs text-amber-800">
                    AI Confidence: {Math.round(aiConfidence * 100)}% (Low - needs review)
                  </p>
                )}
                {aiReasoning && (
                  <p className="mt-1 text-xs text-amber-800">
                    AI Reasoning: {aiReasoning}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-3">
            <Label>What is this document actually?</Label>

            <RadioGroup value={action} onValueChange={(v) => setAction(v as any)}>
              {/* Required Document Option */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="recategorize" id="recategorize" />
                <div className="flex-1">
                  <Label htmlFor="recategorize" className="font-medium">
                    Required RECA Document
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This is a required document type for my claim
                  </p>

                  {action === "recategorize" && (
                    <div className="mt-2">
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDENTITY">Identity (Birth/Death Certificate)</SelectItem>
                          <SelectItem value="MEDICAL_RECORDS">Medical Records</SelectItem>
                          <SelectItem value="PATHOLOGY_REPORT">Pathology Report</SelectItem>
                          <SelectItem value="PROOF_OF_RESIDENCE">Proof of Residence</SelectItem>
                          <SelectItem value="UTILITY_BILL">Utility Bill</SelectItem>
                          <SelectItem value="MORTGAGE_STATEMENT">Mortgage Statement</SelectItem>
                          <SelectItem value="TAX_RETURN">Tax Return</SelectItem>
                          <SelectItem value="SCHOOL_RECORDS">School Records</SelectItem>
                          <SelectItem value="EMPLOYMENT_RECORDS">Employment Records</SelectItem>
                          <SelectItem value="DISCHARGE_SUMMARY">Hospital Discharge Summary</SelectItem>
                          <SelectItem value="TUMOR_REGISTRY">Tumor Registry</SelectItem>
                          <SelectItem value="TREATMENT_RECORDS">Treatment Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Document Option */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="supporting" id="supporting" />
                <div className="flex-1">
                  <Label htmlFor="supporting" className="font-medium">
                    Supporting Document
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Provides additional context but doesn't satisfy a requirement
                  </p>
                </div>
              </div>

              {/* Delete Option */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="delete" id="delete" />
                <div className="flex-1">
                  <Label htmlFor="delete" className="font-medium text-red-600">
                    Wrong Upload - Delete This
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I uploaded the wrong file
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (action === "recategorize" && !newCategory)}
              variant={action === "delete" ? "destructive" : "default"}
            >
              {loading ? "Processing..." : action === "delete" ? "Delete Document" : "Update Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.2 Recategorization API Endpoint
**New File:** `src/app/api/documents/[id]/recategorize/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRECACompliance } from "@/lib/document-intelligence/reca-compliance";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newCategory, action } = await req.json();

    // Handle delete action
    if (action === "delete") {
      await db.uploadedFile.delete({
        where: { id: params.id }
      });

      return NextResponse.json({ success: true, deleted: true });
    }

    // Handle supporting document
    if (action === "supporting") {
      await db.uploadedFile.update({
        where: { id: params.id },
        data: {
          category: "OTHER",
          metadata: {
            // ... existing metadata
            userMarkedAsSupporting: true,
            qualificationStatus: "SUPPORTING",
          }
        }
      });

      return NextResponse.json({ success: true });
    }

    // Handle recategorization
    if (action === "recategorize" && newCategory) {
      // Update category
      await db.uploadedFile.update({
        where: { id: params.id },
        data: {
          category: newCategory,
          metadata: {
            // ... existing metadata
            userOverrodeCategory: true,
            originalAICategory: file.category,
            userCorrectedAt: new Date().toISOString(),
          }
        }
      });

      // Re-run compliance check for all documents in session
      const file = await db.uploadedFile.findUnique({
        where: { id: params.id },
        include: { intakeSession: true }
      });

      if (file?.intakeSessionId) {
        const allDocuments = await db.uploadedFile.findMany({
          where: { intakeSessionId: file.intakeSessionId },
          select: { id: true, category: true, ocrText: true, metadata: true },
        });

        // Re-run compliance for updated document set
        const complianceResult = await checkRECACompliance(
          // ... entities from metadata
          allDocuments,
          // ...
        );

        // Store updated compliance
        // ... (update session-level compliance)
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Recategorization failed:", error);
    return NextResponse.json(
      { error: "Failed to recategorize document" },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Post-Upload Qualification Feedback (Medium Priority)

#### 4.1 Upload Success Screen with Qualification
**Update:** `src/components/documents/DocumentUploadZone.tsx`

After successful upload, show qualification status immediately:

```typescript
function UploadSuccessMessage({ document, qualification }) {
  if (qualification.status === "QUALIFIES") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">
              🎉 Great! This Document Counts
            </h3>
            <div className="mt-2 space-y-1 text-sm text-green-800">
              <p>✓ Categorized as: <strong>{document.category}</strong></p>
              <p>✓ Satisfies: <strong>{qualification.matchedRequirement}</strong></p>
              <p>✓ Claim completeness increased to <strong>{newCompleteness}%</strong></p>
            </div>
            {qualityScore && (
              <p className="mt-2 text-xs text-green-700">
                Quality Score: {Math.round(qualityScore * 100)}% - {qualityScore >= 0.9 ? "Excellent!" : "Good"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (qualification.status === "DOES_NOT_QUALIFY") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              ⚠️ This Document Doesn't Count
            </h3>
            <div className="mt-2 space-y-1 text-sm text-red-800">
              <p>Categorized as: <strong>{document.category}</strong></p>
              <p>This document type is not required for RECA claims.</p>
              <p>Claim completeness: <strong>{completeness}%</strong> (unchanged)</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRecategorize}>
                This is Actually...
              </Button>
              <Button size="sm" variant="outline" onClick={handleKeepAsSupporting}>
                Keep as Supporting
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                Delete This
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... handle other statuses
}
```

---

## Expected Impact

### User Benefits
1. **Clear Understanding**: Users immediately know which docs count vs don't count
2. **Accurate Expectations**: No false confidence about claim readiness
3. **Faster Correction**: Easy recategorization without re-upload
4. **Better Guidance**: Specific suggestions for what to upload next

### System Benefits
1. **Reduced Support Load**: Fewer "why was my claim rejected?" questions
2. **Higher Accuracy**: User corrections improve AI over time
3. **Better Data**: Track AI miscategorization rates
4. **Compliance**: Ensures only valid docs counted toward DOJ requirements

---

## Testing Plan

### Test Cases

1. **Correctly Categorized Required Doc**
   - Upload birth certificate
   - Verify shows "COUNTS TOWARD CLAIM"
   - Verify completeness increases

2. **Miscategorized Doc (Common Error)**
   - Upload random photo
   - AI miscategorizes as "MEDICAL_RECORDS"
   - Verify shows qualification status
   - User recategorizes to "OTHER"
   - Verify completeness decreases appropriately

3. **"OTHER" Category Doc**
   - Upload non-standard document
   - AI correctly categorizes as "OTHER"
   - Verify shows "DOES NOT COUNT" with clear messaging
   - Verify doesn't affect completeness

4. **Supporting Document**
   - Upload additional residence proof (already have one)
   - Verify shows "SUPPORTING ONLY"
   - Verify doesn't increase completeness (already satisfied)

5. **Low Confidence Categorization**
   - Upload ambiguous document
   - AI returns <70% confidence
   - Verify triggers review prompt
   - User confirms or corrects

---

## Metrics to Track

### AI Accuracy Metrics
- Categorization accuracy rate (% correct on first try)
- Low-confidence categorization rate (<70%)
- User override rate (how often users correct AI)
- Most commonly miscategorized document types

### User Behavior Metrics
- Time to first recategorization
- Delete rate by category
- Supporting document usage rate
- Upload-to-approval time

### Business Impact Metrics
- Claim completeness accuracy
- Reduction in rejected claims due to wrong docs
- Support ticket volume change
- User satisfaction scores

---

## Future Enhancements

1. **AI Learning from Corrections**
   - Store user corrections
   - Periodically retrain or fine-tune model
   - A/B test improvements

2. **Bulk Recategorization**
   - Allow users to fix multiple docs at once
   - "Review all non-counted documents" workflow

3. **Smart Upload Suggestions**
   - "You're missing birth certificate - want to upload now?"
   - Show missing docs prominently on dashboard

4. **Document Comparison**
   - "This looks similar to document X - are they the same?"
   - Detect duplicate uploads

5. **Quality Gates**
   - Require minimum quality score for required docs
   - "This scan is too blurry - please re-upload"

---

## Conclusion

These improvements address the core issue of misleading completeness percentages and provide users with clear, actionable feedback about which documents actually count toward DOJ approval.

**Key Principle:** *Better to show 0% accurate completeness with helpful guidance than 75% false completeness that leads to rejected claims.*

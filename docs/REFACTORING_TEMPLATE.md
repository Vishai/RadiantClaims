# Form Refactoring Template

## Pattern for Non-Blocking Forms

Each form section should follow this consistent pattern:

### 1. Type Definition (in types.ts)
```typescript
export interface Part[X][Description] {
  // Information gathering fields (all optional)
  field1?: string;
  field2?: "YES" | "NO";
  dateField?: string;

  // Arrays for multiple entries
  multipleItems?: Array<{
    itemField1?: string;
    itemField2?: string;
  }>;

  // Special circumstances catch-all
  specialCircumstances?: string;

  // Document awareness (non-blocking)
  documentsIdentified?: {
    doc1Needed: boolean;
    doc2Needed: boolean;
    doc2Count?: number;
  };
}
```

### 2. Form Component Structure
```typescript
"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// ... other imports

// Validation schema - ALL FIELDS OPTIONAL
const partXSchema = z.object({
  field1: z.string().optional(),
  field2: z.enum(["YES", "NO"]).optional(),
  // ... other fields
  specialCircumstances: z.string().optional(),
  documentsIdentified: z.object({
    doc1Needed: z.boolean(),
    doc2Needed: z.boolean(),
  }).optional(),
});

export default function PartXForm({ initialData, onSubmit }: PartXFormProps) {
  const form = useForm<PartXFormData>({
    resolver: zodResolver(partXSchema),
    defaultValues: {
      // Set defaults from initialData or empty
      ...initialData,
    },
  });

  const handleSubmit = useCallback(
    async (data: PartXFormData) => {
      // Save whatever information they've provided
      // No validation blocks - they can continue regardless
      await onSubmit(data as PartX);
      return true;
    },
    [onSubmit]
  );

  // Expose form submission to FormWizard
  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handleSubmit(data);
            resolve(true); // Always allow progression
          },
          async () => {
            // Even with errors, save what we have
            const formData = form.getValues();
            await handleSubmit(formData);
            resolve(true);
          }
        )();
      });
    };

    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handleSubmit]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardContent>
          <Info />
          <p>Fill out what you can. You can come back to complete this later.</p>
        </CardContent>
      </Card>

      {/* Main Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Information We Need</CardTitle>
          <CardDescription>All fields are optional</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form fields here */}
        </CardContent>
      </Card>

      {/* Document Requirements Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Documents You'll Need</CardTitle>
        </CardHeader>
        <CardContent>
          {/* List documents based on form data */}
          {/* Include Help buttons for each */}
        </CardContent>
      </Card>

      {/* Continue Notice */}
      <Card>
        <CardContent>
          <CheckCircle />
          <p>You can continue to the next section at any time.</p>
        </CardContent>
      </Card>
    </form>
  );
}
```

### 3. Document Tracking Integration

Each form should:
1. Identify documents needed based on user input
2. Update the documentsIdentified field
3. Display required documents with help resources
4. Never block progression

### 4. Help Resources Pattern

For each document type, provide:
```typescript
<Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => openDocumentHelp('document_type')}
>
  <HelpCircle className="h-4 w-4 mr-1" />
  Help
</Button>
```

### 5. Common Document Types & Help

| Document Type | Help Resources |
|--------------|----------------|
| Birth Certificate | VitalChek, State vital records |
| Death Certificate | State where death occurred |
| Marriage Certificate | County clerk where married |
| Divorce Decree | Court where divorced |
| Medical Records | HIPAA request, provider records dept |
| Military Records | National Archives, VA |
| School Records | District registrar |
| Employment Records | Former employer HR |
| Tax Records | IRS transcript service |
| Tribal Records | Tribal enrollment office |

### 6. Validation Rules

DO NOT validate/require:
- Any field for form progression
- Document confirmation before continuing
- Complete information in any field

DO validate (at final submission only):
- All required documents are confirmed
- Minimum viable information is present
- Legal requirements are met (signature, attestation)

### 7. Special Considerations by Section

#### Parts 1-3: Identity & Relationship
- Core information but shouldn't block
- Track SSN, DOB, names as "needed for submission"

#### Parts 4-7: Relationship-Specific
- Gather information about specific relationship
- Track relationship-specific documents

#### Parts 8-11: Exposure & Medical
- Historical information that may be incomplete
- Provide examples and guidance

#### Parts 12-16: Administrative
- Simple Yes/No selections where possible
- Conditional sections based on selections

## Implementation Checklist

For each form section:

- [ ] Update type definition to make all fields optional
- [ ] Remove `.min(1)` and `required_error` from Zod schema
- [ ] Add `documentsIdentified` tracking
- [ ] Add help resources for each document type
- [ ] Add "All fields optional" messaging
- [ ] Ensure form saves partial data
- [ ] Test that form allows progression with empty data
- [ ] Update any API endpoints to handle partial data
- [ ] Add document tracking to workflow state
- [ ] Create help modal/drawer for document assistance

## Testing Each Section

1. **Empty Form Test**: Can submit with no data
2. **Partial Data Test**: Saves incomplete information
3. **Document Tracking Test**: Correctly identifies needed documents
4. **Help Resources Test**: All help buttons functional
5. **Workflow Test**: Can navigate away and back without data loss
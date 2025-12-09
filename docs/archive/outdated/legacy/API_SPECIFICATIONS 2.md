# RECA Workflow - API Specifications

## Overview
This document defines the API endpoints needed to support the RECA Downwinder Claim guided workflow.

---

## Base URL
```
/api/claims/{claimId}/workflow
```

---

## Endpoints

### 1. Get Workflow State
**Purpose**: Load existing workflow progress for a claim

**Endpoint**: `GET /api/claims/{claimId}/workflow`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Response** (200 OK):
```json
{
  "claimId": "uuid",
  "workflowStage": 2,
  "workflowSection": "section_part_8",
  "completionPercentage": 45,
  "lastUpdated": "2025-01-15T10:30:00Z",
  "formData": {
    "part_1": {
      "first_name": "John",
      "last_name": "Doe",
      // ... all Part 1 fields
    },
    "part_2": {
      // ... claimant information
    },
    "part_3": {
      "relationship": "self"
    },
    // ... other parts as completed
  },
  "eligibilityData": {
    "relationship": "self",
    "exposureVerified": true,
    "diseaseSelected": ["lung"]
  },
  "documentsUploaded": [
    {
      "documentId": "doc-uuid-1",
      "type": "birth_certificate",
      "category": "vital_records",
      "filename": "birth_cert.pdf",
      "uploadedAt": "2025-01-15T09:00:00Z"
    }
  ],
  "validationState": {
    "part_1": { "valid": true, "errors": [] },
    "part_8": { "valid": false, "errors": ["At least one location required"] }
  }
}
```

**Response** (404 Not Found):
```json
{
  "error": "Claim not found",
  "claimId": "uuid"
}
```

---

### 2. Save Workflow Progress
**Purpose**: Save/update workflow state (auto-save)

**Endpoint**: `POST /api/claims/{claimId}/workflow/save`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Request Body**:
```json
{
  "workflowStage": 2,
  "workflowSection": "section_part_8",
  "completionPercentage": 47,
  "formData": {
    "part_8": {
      "exposure_option": ["option_1a"],
      "affected_areas": [
        {
          "state": "Utah",
          "town_city": "St. George",
          "time_period": "January 1952 - December 1955"
        }
      ]
    }
  },
  "partialUpdate": true  // If true, merge with existing data
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "claimId": "uuid",
  "lastUpdated": "2025-01-15T10:32:00Z",
  "completionPercentage": 47
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Invalid form data",
  "validationErrors": [
    {
      "field": "part_8.affected_areas[0].time_period",
      "message": "Time period must include valid dates"
    }
  ]
}
```

---

### 3. Validate Section
**Purpose**: Validate a specific form section before allowing progression

**Endpoint**: `POST /api/claims/{claimId}/workflow/validate`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Request Body**:
```json
{
  "section": "part_8",
  "data": {
    "exposure_option": ["option_1a"],
    "affected_areas": [
      {
        "state": "Utah",
        "town_city": "St. George",
        "time_period": "January 1952 - December 1955"
      }
    ]
  }
}
```

**Response** (200 OK - Valid):
```json
{
  "valid": true,
  "section": "part_8",
  "errors": [],
  "warnings": []
}
```

**Response** (200 OK - Invalid):
```json
{
  "valid": false,
  "section": "part_8",
  "errors": [
    {
      "field": "affected_areas",
      "message": "At least one location must be provided",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "field": "affected_areas",
      "message": "Consider providing additional locations to strengthen claim",
      "severity": "warning"
    }
  ]
}
```

---

### 4. Get Disease Requirements
**Purpose**: Get medical record requirements for specific disease(s)

**Endpoint**: `GET /api/workflow/disease-requirements`

**Query Parameters**:
- `diseases` (query, required): Comma-separated disease IDs

**Example**: `/api/workflow/disease-requirements?diseases=lung,thyroid`

**Response** (200 OK):
```json
{
  "diseases": [
    {
      "id": "lung",
      "name": "Primary cancer of the lung",
      "acceptedRecords": [
        "Pathology report of tissue biopsy or resection",
        "Autopsy report",
        "Report of bronchoscopy",
        "Physician summary report",
        "Hospital discharge summary report",
        "Radiotherapy summary report",
        "Medical oncology summary report",
        "Operative report",
        "CT scan report",
        "MRI report",
        "Chest X-rays",
        "Chest tomograms",
        "Death certificate (signed by physician at time of death)"
      ],
      "specificNotes": "Tissue samples can be obtained through various methods including surgical resection, bronchoscopy, needle aspirate, etc."
    },
    {
      "id": "thyroid",
      "name": "Primary cancer of the thyroid",
      "acceptedRecords": [
        "Pathology report of tissue biopsy or fine needle aspirate",
        "Autopsy report",
        "Physician summary report",
        "Hospital discharge summary",
        "Operative summary report",
        "Medical oncology summary or consultation report",
        "Death certificate (signed by physician at time of death)"
      ]
    }
  ]
}
```

---

### 5. Generate PDF
**Purpose**: Generate pre-filled RECA form PDF for mail submission or records

**Endpoint**: `POST /api/claims/{claimId}/generate-pdf`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Request Body**:
```json
{
  "formType": "main_claim",  // or "supporting_forms" or "complete_package"
  "includeDocumentChecklist": true,
  "flatten": false  // If true, creates non-editable PDF
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "pdfUrl": "https://storage.radiantclaims.com/pdfs/claim-uuid-main.pdf",
  "expiresAt": "2025-01-16T10:30:00Z",  // URL expires in 24 hours
  "fileSize": 2457600,  // bytes
  "pages": 24,
  "includedForms": [
    "RECA Downwinder Claim Form",
    "Certification of Identity",
    "Document Checklist"
  ]
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Incomplete claim data",
  "missingRequiredSections": ["part_16_signature"],
  "message": "Cannot generate PDF without required signatures"
}
```

---

### 6. Upload Document
**Purpose**: Upload supporting documents (integrates with existing upload system)

**Endpoint**: `POST /api/claims/{claimId}/documents/upload`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Request**: Multipart form data
- `file` (file, required): Document file
- `documentType` (string, required): Type of document (e.g., "birth_certificate")
- `category` (string, required): Category (e.g., "vital_records", "medical_records", "presence_proof")
- `description` (string, optional): Additional description

**Response** (201 Created):
```json
{
  "success": true,
  "document": {
    "documentId": "doc-uuid-1",
    "claimId": "claim-uuid",
    "filename": "birth_certificate.pdf",
    "originalFilename": "John_Doe_Birth_Cert.pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf",
    "documentType": "birth_certificate",
    "category": "vital_records",
    "uploadedAt": "2025-01-15T10:45:00Z",
    "url": "https://storage.radiantclaims.com/documents/doc-uuid-1.pdf"
  }
}
```

---

### 7. Get Document Checklist
**Purpose**: Generate personalized document checklist based on relationship and form data

**Endpoint**: `GET /api/claims/{claimId}/workflow/document-checklist`

**Parameters**:
- `claimId` (path, required): UUID of the claim

**Response** (200 OK):
```json
{
  "claimId": "uuid",
  "relationship": "spouse",
  "filingMethod": "electronic",  // or "mail"
  "checklist": {
    "vital_records": {
      "category": "Vital Records",
      "required": true,
      "documents": [
        {
          "id": "claimant_birth_cert",
          "name": "Birth certificate of the person who became ill",
          "required": true,
          "status": "uploaded",  // or "missing", "pending"
          "certificationRequired": true,
          "uploadedDocumentId": "doc-uuid-1",
          "notes": "Must be certified or original if filing by mail"
        },
        {
          "id": "claimant_death_cert",
          "name": "Death certificate of the person who became ill",
          "required": true,
          "status": "missing",
          "certificationRequired": true
        }
      ]
    },
    "medical_records": {
      "category": "Medical Records",
      "required": true,
      "documents": [
        {
          "id": "pathology_report",
          "name": "Pathology report of tissue biopsy",
          "required": false,
          "acceptedAlternatives": [
            "Autopsy report",
            "CT scan report",
            "Physician summary"
          ],
          "status": "missing",
          "diseaseSpecific": "lung",
          "notes": "At least one medical record type required for lung cancer diagnosis"
        }
      ]
    },
    "presence_proof": {
      "category": "Proof of Presence",
      "required": true,
      "documents": [
        {
          "id": "presence_docs",
          "name": "Documents showing presence in affected area",
          "required": true,
          "status": "missing",
          "acceptedTypes": [
            "Tax Records",
            "School Records",
            "Employment Records",
            "Birth and Marriage Records"
          ]
        }
      ]
    }
  },
  "summary": {
    "totalRequired": 15,
    "uploaded": 1,
    "missing": 14,
    "completionPercentage": 7
  }
}
```

---

### 8. Check Eligibility
**Purpose**: Quick eligibility check before starting full workflow

**Endpoint**: `POST /api/workflow/check-eligibility`

**Request Body**:
```json
{
  "relationship": "spouse",
  "isDeceased": true,
  "marriedOneYear": true,
  "exposureType": "option_1a",
  "hasCompensableDisease": true
}
```

**Response** (200 OK - Eligible):
```json
{
  "eligible": true,
  "reasons": [],
  "nextSteps": "Proceed with claim form completion"
}
```

**Response** (200 OK - Ineligible):
```json
{
  "eligible": false,
  "reasons": [
    {
      "criterion": "married_one_year",
      "message": "To file as surviving spouse, you must have been married to the person who became ill for at least one year immediately before their death.",
      "severity": "blocker"
    }
  ],
  "nextSteps": "Unfortunately, you are not eligible to file under the surviving spouse category. You may want to check if you qualify under a different relationship category."
}
```

---

### 9. Get Affected Areas
**Purpose**: Get list of all designated affected areas with details

**Endpoint**: `GET /api/workflow/affected-areas`

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "areas": [
    {
      "state": "Idaho",
      "requiresCounty": false,
      "eligiblePeriods": [
        {
          "start": "1951-01-21",
          "end": "1962-11-06",
          "minDuration": "1 year"
        },
        {
          "start": "1962-06-30",
          "end": "1962-07-31",
          "minDuration": "entire period"
        }
      ]
    },
    {
      "state": "New Mexico",
      "requiresCounty": false,
      "eligiblePeriods": [
        {
          "start": "1944-09-24",
          "end": "1962-11-06",
          "minDuration": "1 year"
        }
      ],
      "specialNotes": "New Mexico has an earlier start date than other affected areas"
    },
    {
      "state": "Arizona",
      "requiresCounty": true,
      "counties": [
        {"name": "Coconino", "code": "AZ-005"},
        {"name": "Yavapai", "code": "AZ-025"},
        {"name": "Navajo", "code": "AZ-017"},
        {"name": "Apache", "code": "AZ-001"},
        {"name": "Gila", "code": "AZ-007"},
        {"name": "Mohave", "code": "AZ-015"}
      ],
      "eligiblePeriods": [
        {
          "start": "1951-01-21",
          "end": "1962-11-06",
          "minDuration": "1 year"
        },
        {
          "start": "1962-06-30",
          "end": "1962-07-31",
          "minDuration": "entire period"
        }
      ]
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field",
    "message": "Detailed error message"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Common Error Codes
- `CLAIM_NOT_FOUND`: Claim ID doesn't exist
- `INVALID_FORM_DATA`: Form data validation failed
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `UNAUTHORIZED`: User doesn't have access to this claim
- `DOCUMENT_UPLOAD_FAILED`: File upload encountered an error
- `PDF_GENERATION_FAILED`: PDF generation encountered an error
- `VALIDATION_FAILED`: Section validation failed

---

## Authentication
All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Rate Limiting
- **Save endpoint**: 60 requests per minute (supports auto-save)
- **Other endpoints**: 100 requests per minute

---

## Webhooks (Future Enhancement)
Consider implementing webhooks for:
- Document upload completion
- PDF generation completion
- Claim submission confirmation

---

*API Version: 1.0*
*Last Updated: January 2025*

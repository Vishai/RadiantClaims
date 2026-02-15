/**
 * Human-friendly labels for documentType strings.
 *
 * These values show up in ClaimantDocumentStatus.documentType and related APIs.
 * Keep this mapping conservative: if unknown, we fall back to title-casing.
 */

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  // Identity / vital records
  BIRTH_CERTIFICATE: "Birth certificate",
  DEATH_CERTIFICATE: "Death certificate",
  MARRIAGE_CERTIFICATE: "Marriage certificate",
  DIVORCE_DECREE: "Divorce decree",
  ADOPTION_DECREE: "Adoption decree",
  PHOTO_ID: "Government photo ID",
  SOCIAL_SECURITY_CARD: "Social Security card",

  // Residence / presence
  PROOF_OF_RESIDENCE: "Proof of residence/presence",
  RESIDENCE_PROOF: "Proof of residence/presence",
  UTILITY_BILL: "Utility bill (residence proof)",
  MORTGAGE_STATEMENT: "Mortgage/lease statement (residence proof)",
  TAX_RETURN: "Tax return (residence proof)",
  SCHOOL_RECORDS: "School records (residence proof)",
  EMPLOYMENT_RECORDS: "Employment records (residence proof)",
  LDS_CHURCH_RECORDS: "Church records (residence proof)",

  // Medical
  MEDICAL_RECORDS: "Medical records",
  PATHOLOGY_REPORT: "Pathology report",
  DISCHARGE_SUMMARY: "Hospital discharge summary",
  TREATMENT_RECORDS: "Treatment records",
  TUMOR_REGISTRY: "Tumor registry record",
  AUTOPSY_REPORT: "Autopsy report",
  CANCER_DIAGNOSIS: "Cancer diagnosis proof",

  // Other
  PROOF_OF_RELATIONSHIP: "Proof of relationship",
};

export function labelForDocumentType(documentType?: string | null): string {
  const key = normalizeDocumentType(documentType);
  if (!key) return "Document";
  return DOCUMENT_TYPE_LABELS[key] || titleCaseFromKey(key);
}

export function normalizeDocumentType(documentType?: string | null): string {
  if (!documentType) return "";
  return String(documentType).trim().toUpperCase();
}

function titleCaseFromKey(key: string): string {
  return key
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

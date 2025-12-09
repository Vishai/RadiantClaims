/**
 * RECA Form Autofill Engine
 *
 * Intelligently prefills form fields based on previously entered data to eliminate
 * duplicate manual entry across different form parts.
 *
 * Key Autofill Scenarios:
 * 1. Self-filers: Part 1 (filer) data → Part 2 (claimant) data
 * 2. Spouse/Children: Claimant info → Legal guardian fields
 * 3. Address data: Reuse across different form sections
 * 4. Name/DOB data: Propagate to supporting forms
 */

import type { RECAFormData, RECASupportingForms } from "./types";

/**
 * Autofill mapping rules that define which fields can be auto-populated from which sources
 */
export interface AutofillRule {
  targetPart: keyof RECAFormData | keyof RECASupportingForms;
  targetField: string;
  sourcePart: keyof RECAFormData | keyof RECASupportingForms;
  sourceField: string;
  condition?: (formData: Partial<RECAFormData>) => boolean;
  transform?: (value: any) => any;
}

/**
 * Comprehensive autofill rules for RECA forms
 *
 * IMPORTANT: These rules handle multiple claim scenarios where users file for
 * multiple family members (e.g., siblings filing claims for both parents).
 * The system should remember family member data across claims via family-member-cache.
 *
 * NOTE: Family member cache is handled separately in FamilyMemberSelector component.
 * These rules handle within-claim autofill only.
 */
export const AUTOFILL_RULES: AutofillRule[] = [
  // ========================================================================
  // SCENARIO 1: Self-Filer Autofill (Part 1 → Part 2)
  // When filing for yourself, claimant info = filer info
  // ========================================================================
  {
    targetPart: "part_2",
    targetField: "firstName",
    sourcePart: "part_1",
    sourceField: "firstName",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },
  {
    targetPart: "part_2",
    targetField: "middleName",
    sourcePart: "part_1",
    sourceField: "middleName",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },
  {
    targetPart: "part_2",
    targetField: "lastName",
    sourcePart: "part_1",
    sourceField: "lastName",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },
  {
    targetPart: "part_2",
    targetField: "formerNames",
    sourcePart: "part_1",
    sourceField: "formerNames",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },
  {
    targetPart: "part_2",
    targetField: "ssn",
    sourcePart: "part_1",
    sourceField: "ssn",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },
  {
    targetPart: "part_2",
    targetField: "dob",
    sourcePart: "part_1",
    sourceField: "dob",
    condition: (formData) => formData.part_1?.filingForSelf === true,
  },

  // ========================================================================
  // SCENARIO 2: Supporting Forms Autofill (Part 1/2 → Supporting Forms)
  // ========================================================================

  // Medical Information Release Form
  {
    targetPart: "medicalInfoRelease",
    targetField: "firstName",
    sourcePart: "part_2",
    sourceField: "firstName",
    condition: (formData) => !!formData.part_2,
  },
  {
    targetPart: "medicalInfoRelease",
    targetField: "lastName",
    sourcePart: "part_2",
    sourceField: "lastName",
    condition: (formData) => !!formData.part_2,
  },
  {
    targetPart: "medicalInfoRelease",
    targetField: "dob",
    sourcePart: "part_2",
    sourceField: "dob",
    condition: (formData) => !!formData.part_2,
  },
  {
    targetPart: "medicalInfoRelease",
    targetField: "ssn",
    sourcePart: "part_2",
    sourceField: "ssn",
    condition: (formData) => !!formData.part_2,
  },
  {
    targetPart: "medicalInfoRelease",
    targetField: "currentAddress",
    sourcePart: "part_1",
    sourceField: "mailingAddress",
  },

  // Certification of Identity Form
  {
    targetPart: "certificationOfIdentity",
    targetField: "firstName",
    sourcePart: "part_1",
    sourceField: "firstName",
  },
  {
    targetPart: "certificationOfIdentity",
    targetField: "lastName",
    sourcePart: "part_1",
    sourceField: "lastName",
  },
  {
    targetPart: "certificationOfIdentity",
    targetField: "dob",
    sourcePart: "part_1",
    sourceField: "dob",
  },
  {
    targetPart: "certificationOfIdentity",
    targetField: "ssn",
    sourcePart: "part_1",
    sourceField: "ssn",
  },
  {
    targetPart: "certificationOfIdentity",
    targetField: "currentAddress",
    sourcePart: "part_1",
    sourceField: "mailingAddress",
  },

  // ========================================================================
  // SCENARIO 3: Surviving Spouse Autofill (Part 2 → Part 5)
  // Pre-fill spouse information from claimant data
  // ========================================================================
  {
    targetPart: "part_5",
    targetField: "claimantDeceased",
    sourcePart: "part_2",
    sourceField: "dod",
    condition: (formData) => formData.part_3?.relationship === "Spouse",
    transform: (dod) => (dod ? "YES" : "NO"),
  },

  // ========================================================================
  // SCENARIO 4: Surviving Child Autofill (Part 2 → Part 6)
  // Pre-fill child relationship information from claimant data
  // ========================================================================
  {
    targetPart: "part_6",
    targetField: "claimantDeceased",
    sourcePart: "part_2",
    sourceField: "dod",
    condition: (formData) => formData.part_3?.relationship === "Child",
    transform: (dod) => (dod ? "YES" : "NO"),
  },

  // ========================================================================
  // SCENARIO 5: Filer Contact Info → Part 13 (Attorney)
  // Pre-fill filer contact info for attorney communication
  // ========================================================================
  {
    targetPart: "part_13",
    targetField: "filerEmail",
    sourcePart: "part_1",
    sourceField: "email",
  },
  {
    targetPart: "part_13",
    targetField: "filerPhone",
    sourcePart: "part_1",
    sourceField: "phoneDay",
  },

  // ========================================================================
  // SCENARIO 6: Legal Guardian Autofill (Part 1 → Part 15)
  // If filer is also the guardian, prefill guardian info
  // ========================================================================
  {
    targetPart: "part_15",
    targetField: "guardianFirstName",
    sourcePart: "part_1",
    sourceField: "firstName",
  },
  {
    targetPart: "part_15",
    targetField: "guardianMiddleName",
    sourcePart: "part_1",
    sourceField: "middleName",
  },
  {
    targetPart: "part_15",
    targetField: "guardianLastName",
    sourcePart: "part_1",
    sourceField: "lastName",
  },
  {
    targetPart: "part_15",
    targetField: "guardianAddress",
    sourcePart: "part_1",
    sourceField: "mailingAddress",
  },
  {
    targetPart: "part_15",
    targetField: "guardianCity",
    sourcePart: "part_1",
    sourceField: "city",
  },
  {
    targetPart: "part_15",
    targetField: "guardianState",
    sourcePart: "part_1",
    sourceField: "state",
  },
  {
    targetPart: "part_15",
    targetField: "guardianZip",
    sourcePart: "part_1",
    sourceField: "zipCode",
  },
  {
    targetPart: "part_15",
    targetField: "guardianPhoneDay",
    sourcePart: "part_1",
    sourceField: "phoneDay",
  },
  {
    targetPart: "part_15",
    targetField: "guardianPhoneEvening",
    sourcePart: "part_1",
    sourceField: "phoneEvening",
  },
  {
    targetPart: "part_15",
    targetField: "guardianEmail",
    sourcePart: "part_1",
    sourceField: "email",
  },
];

/**
 * Get autofilled default values for a specific form part
 */
export function getAutofillDefaults(
  targetPart: keyof RECAFormData | keyof RECASupportingForms,
  currentFormData: Partial<RECAFormData>,
  currentSupportingForms?: Partial<RECASupportingForms>
): Record<string, any> {
  const defaults: Record<string, any> = {};
  const allData = { ...currentFormData, ...currentSupportingForms };

  // Find all applicable autofill rules for this target part
  const applicableRules = AUTOFILL_RULES.filter((rule) => {
    // Check if rule targets this part
    if (rule.targetPart !== targetPart) return false;

    // Check if condition is met (if defined)
    if (rule.condition && !rule.condition(currentFormData)) return false;

    // Check if source data exists
    const sourcePart = allData[rule.sourcePart as keyof typeof allData];
    if (!sourcePart) return false;

    const sourceValue = (sourcePart as any)[rule.sourceField];
    if (sourceValue === undefined || sourceValue === null || sourceValue === "")
      return false;

    return true;
  });

  // Apply each rule to build defaults object
  applicableRules.forEach((rule) => {
    const sourcePart = allData[rule.sourcePart as keyof typeof allData];
    let value = (sourcePart as any)?.[rule.sourceField];

    // Apply transform if defined
    if (rule.transform) {
      value = rule.transform(value);
    }

    defaults[rule.targetField] = value;
  });

  return defaults;
}

/**
 * Get a single autofilled value for a specific field
 */
export function getAutofillValue(
  targetPart: keyof RECAFormData | keyof RECASupportingForms,
  targetField: string,
  currentFormData: Partial<RECAFormData>,
  currentSupportingForms?: Partial<RECASupportingForms>
): any | undefined {
  const defaults = getAutofillDefaults(
    targetPart,
    currentFormData,
    currentSupportingForms
  );
  return defaults[targetField];
}

/**
 * Check if a field has an autofill value available
 */
export function hasAutofillValue(
  targetPart: keyof RECAFormData | keyof RECASupportingForms,
  targetField: string,
  currentFormData: Partial<RECAFormData>,
  currentSupportingForms?: Partial<RECASupportingForms>
): boolean {
  const value = getAutofillValue(
    targetPart,
    targetField,
    currentFormData,
    currentSupportingForms
  );
  return value !== undefined && value !== null && value !== "";
}

/**
 * Get autofill metadata for displaying hints to the user
 */
export function getAutofillMetadata(
  targetPart: keyof RECAFormData | keyof RECASupportingForms,
  targetField: string,
  currentFormData: Partial<RECAFormData>
): { source: string; label: string } | null {
  const rule = AUTOFILL_RULES.find(
    (r) =>
      r.targetPart === targetPart &&
      r.targetField === targetField &&
      (!r.condition || r.condition(currentFormData))
  );

  if (!rule) return null;

  const sourceLabels: Record<string, string> = {
    part_1: "Your Information",
    part_2: "Claimant Information",
    part_3: "Relationship",
    part_4: "Self-Filer",
    part_5: "Surviving Spouse",
    part_6: "Surviving Child",
    part_7: "Other Relatives",
    part_8: "Exposure Information",
    part_9: "Proof of Presence",
    part_10: "Compensable Diseases",
    part_11: "Proof of Disease",
    part_12: "Previous Payments",
    part_13: "Attorney",
    part_15: "Legal Guardian",
    part_16: "Signature",
    medicalInfoRelease: "Medical Information Release",
    certificationOfIdentity: "Certification of Identity",
  };

  return {
    source: rule.sourcePart as string,
    label:
      sourceLabels[rule.sourcePart as string] || (rule.sourcePart as string),
  };
}

/**
 * Merge autofill defaults with existing form values
 * (existing values take precedence)
 */
export function mergeWithAutofill<T extends Record<string, any>>(
  targetPart: keyof RECAFormData | keyof RECASupportingForms,
  existingValues: T,
  currentFormData: Partial<RECAFormData>,
  currentSupportingForms?: Partial<RECASupportingForms>
): T {
  const autofillDefaults = getAutofillDefaults(
    targetPart,
    currentFormData,
    currentSupportingForms
  );

  // Merge: autofill defaults first, then override with existing values
  return {
    ...autofillDefaults,
    ...existingValues,
  } as T;
}

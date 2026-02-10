/**
 * Utility for computing diffs between RECA form data versions.
 * Used by the admin edit API to track what changed and by the audit log display.
 */

export interface FormFieldChange {
  part: string;
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Compute a diff between old and new form data.
 * Only compares fields present in newData (partial updates).
 * Returns an array of changed fields with before/after values.
 */
export function computeFormDataDiff(
  oldData: Record<string, any>,
  newData: Record<string, any>
): FormFieldChange[] {
  const changes: FormFieldChange[] = [];

  for (const [partKey, partData] of Object.entries(newData)) {
    if (!partData || typeof partData !== "object") continue;

    const oldPart = oldData[partKey] || {};

    for (const [fieldKey, newValue] of Object.entries(
      partData as Record<string, any>
    )) {
      const oldValue = oldPart[fieldKey];

      // Compare using JSON serialization to handle arrays/objects
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          part: partKey,
          field: fieldKey,
          oldValue: oldValue ?? null,
          newValue: newValue ?? null,
        });
      }
    }
  }

  return changes;
}

/**
 * Deep merge form data at the part level.
 * For each part in newData, merges its fields into the corresponding part in currentData.
 */
export function deepMergeFormData(
  currentData: Record<string, any>,
  newData: Record<string, any>
): Record<string, any> {
  const merged = { ...currentData };

  for (const [partKey, partData] of Object.entries(newData)) {
    if (!partData || typeof partData !== "object") continue;

    merged[partKey] = {
      ...(currentData[partKey] || {}),
      ...partData,
    };
  }

  return merged;
}

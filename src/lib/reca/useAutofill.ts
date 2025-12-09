/**
 * React Hook for RECA Form Autofill
 *
 * Provides easy access to autofilled values in form components
 */

import { useMemo } from "react";
import type { RECAFormData, RECASupportingForms } from "./types";
import {
  getAutofillDefaults,
  getAutofillValue,
  hasAutofillValue,
  getAutofillMetadata,
  mergeWithAutofill,
} from "./autofill-engine";

export interface UseAutofillOptions {
  targetPart: keyof RECAFormData | keyof RECASupportingForms;
  currentFormData: Partial<RECAFormData>;
  currentSupportingForms?: Partial<RECASupportingForms>;
  existingValues?: Record<string, any>;
}

export interface UseAutofillReturn {
  /**
   * All autofilled default values for the current form part
   */
  defaults: Record<string, any>;

  /**
   * Get the autofilled value for a specific field
   */
  getValue: (fieldName: string) => any | undefined;

  /**
   * Check if a field has an autofill value available
   */
  hasValue: (fieldName: string) => boolean;

  /**
   * Get metadata about where the autofill value came from
   */
  getSource: (fieldName: string) => { source: string; label: string } | null;

  /**
   * Merge autofill defaults with existing values
   * (existing values take precedence)
   */
  mergeDefaults: <T extends Record<string, any>>(existingValues: T) => T;

  /**
   * Get all field names that have autofill values
   */
  autofilledFields: string[];
}

/**
 * Hook to access autofilled form values
 *
 * @example
 * ```tsx
 * const autofill = useAutofill({
 *   targetPart: 'part_2',
 *   currentFormData: formData,
 * });
 *
 * // Get all defaults
 * const defaults = autofill.defaults;
 *
 * // Check if field has autofill
 * if (autofill.hasValue('firstName')) {
 *   const value = autofill.getValue('firstName');
 *   const source = autofill.getSource('firstName');
 * }
 *
 * // Merge with existing form values
 * const mergedValues = autofill.mergeDefaults(form.getValues());
 * ```
 */
export function useAutofill({
  targetPart,
  currentFormData,
  currentSupportingForms,
}: UseAutofillOptions): UseAutofillReturn {
  // Memoize the defaults calculation
  const defaults = useMemo(
    () =>
      getAutofillDefaults(targetPart, currentFormData, currentSupportingForms),
    [targetPart, currentFormData, currentSupportingForms]
  );

  // Memoize the list of autofilled field names
  const autofilledFields = useMemo(() => Object.keys(defaults), [defaults]);

  // Create stable callback functions
  const getValue = useMemo(
    () => (fieldName: string) => {
      return getAutofillValue(
        targetPart,
        fieldName,
        currentFormData,
        currentSupportingForms
      );
    },
    [targetPart, currentFormData, currentSupportingForms]
  );

  const hasValue = useMemo(
    () => (fieldName: string) => {
      return hasAutofillValue(
        targetPart,
        fieldName,
        currentFormData,
        currentSupportingForms
      );
    },
    [targetPart, currentFormData, currentSupportingForms]
  );

  const getSource = useMemo(
    () => (fieldName: string) => {
      return getAutofillMetadata(targetPart, fieldName, currentFormData);
    },
    [targetPart, currentFormData]
  );

  const mergeDefaults = useMemo(
    () =>
      <T extends Record<string, any>>(existingValues: T): T => {
        return mergeWithAutofill(
          targetPart,
          existingValues,
          currentFormData,
          currentSupportingForms
        );
      },
    [targetPart, currentFormData, currentSupportingForms]
  );

  return {
    defaults,
    getValue,
    hasValue,
    getSource,
    mergeDefaults,
    autofilledFields,
  };
}

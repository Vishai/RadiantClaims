import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format SSN with dashes (XXX-XX-XXXX)
 * @param value - Raw SSN input
 * @returns Formatted SSN string
 */
export function formatSSN(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 9 digits
  const limitedDigits = digits.slice(0, 9);

  // Format based on length
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 5) {
    return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
  } else {
    return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 5)}-${limitedDigits.slice(5)}`;
  }
}

/**
 * Remove formatting from SSN (remove dashes)
 * @param value - Formatted SSN
 * @returns Raw SSN digits only
 */
export function unformatSSN(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validate SSN format
 * @param value - SSN to validate
 * @returns true if valid SSN (9 digits)
 */
export function isValidSSN(value: string): boolean {
  const digits = unformatSSN(value);
  return digits.length === 9 && /^\d{9}$/.test(digits);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

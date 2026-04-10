/**
 * Field-Level Help Content
 *
 * Contextual help text for form fields across all 16 parts.
 * Used by the HelpTooltip component via FormField's helpTooltip prop.
 *
 * Key: "{part}_{fieldName}" or a descriptive key for non-FormField fields.
 * Each entry provides: explanation, optional example, optional whereToFind.
 */

import type { HelpTooltipProps } from "@/components/reca/HelpTooltip";

export const FIELD_HELP: Record<string, HelpTooltipProps> = {
  // ─── Part 1: Filer Information ───────────────────────────────
  part1_firstName: {
    explanation:
      "Your legal first name exactly as it appears on your government-issued ID.",
    example: "John",
    whereToFind: "Check your driver's license or birth certificate.",
  },
  part1_middleName: {
    explanation:
      "Your middle name or initial. If you don't have one, leave this blank.",
    example: "Michael or M.",
  },
  part1_lastName: {
    explanation:
      "Your legal last name. If your name has changed (marriage, adoption, etc.), use your current legal name. You can list former names below.",
    example: "Johnson",
  },
  part1_ssn: {
    explanation:
      "Your 9-digit Social Security Number. The DOJ uses this to match your claim to federal records. If you don't have it handy, you can skip this and come back later.",
    example: "123-45-6789",
    whereToFind: "Your Social Security card, tax returns, or bank statements.",
  },
  part1_dateOfBirth: {
    explanation: "Your date of birth as shown on your birth certificate.",
    whereToFind: "Your birth certificate, driver's license, or passport.",
  },
  part1_placeOfBirth: {
    explanation:
      "The city and state (or country) where you were born. This helps the DOJ verify your identity.",
    example: "St. George, Utah",
    whereToFind: "Your birth certificate.",
  },
  part1_tribalCensusNumber: {
    explanation:
      "If you are a member of a federally recognized tribe, your tribal census or enrollment number. This is NOT required — only provide it if applicable.",
    whereToFind:
      "Your Certificate of Indian Blood (CIB) or tribal enrollment card. Contact your tribal enrollment office if you're unsure.",
  },
  part1_mailingAddress: {
    explanation:
      "The address where you receive mail. The DOJ will send all correspondence about your claim here.",
    example: "123 Main Street, Apt 4B",
  },
  part1_phoneDay: {
    explanation:
      "A phone number where the DOJ can reach you during business hours (Monday-Friday, 8am-5pm ET).",
    example: "(435) 555-1234",
  },
  part1_phoneEvening: {
    explanation:
      "An alternate phone number for evenings or weekends. Leave blank if same as daytime.",
  },
  part1_email: {
    explanation:
      "Your email address for electronic correspondence from the DOJ. Not required, but speeds up communication.",
  },

  // ─── Part 2: Deceased Person Information ─────────────────────
  part2_deceasedFirstName: {
    explanation:
      "The full legal first name of the person who was exposed to radiation and has passed away.",
    whereToFind: "Their death certificate or birth certificate.",
  },
  part2_dateOfDeath: {
    explanation:
      "The date the exposed person passed away. This is important for determining filing eligibility.",
    whereToFind: "The death certificate.",
  },
  part2_dateOfBirth: {
    explanation: "The birth date of the deceased person.",
    whereToFind:
      "Their birth certificate, death certificate, or other vital records.",
  },

  // ─── Part 3: Relationship ───────────────────────────────────
  part3_relationship: {
    explanation:
      "Your relationship to the person who was exposed to radiation. If you are the exposed person filing for yourself, select 'Self.' If filing for a deceased family member, select the relationship that applies.",
  },

  // ─── Part 8: Exposure Information ────────────────────────────
  part8_exposureLocation: {
    explanation:
      "The city, town, or area where you (or the exposed person) lived during the nuclear testing period. The DOJ will verify this falls within a covered 'affected area.'",
    example: "St. George, Washington County, Utah",
    whereToFind:
      "Old utility bills, school records, property tax records, or church records from that period.",
  },
  part8_timePeriod: {
    explanation:
      "The years you lived in the affected area. You don't need exact months — approximate years are fine. The key requirement is at least 1 full year of residence between January 1951 and October 1958, or the entire month of July 1962.",
    example: "1953 - 1968",
    whereToFind:
      "Property records, school transcripts, old utility bills, or employment records from that era.",
  },
  part8_county: {
    explanation:
      "The county where you lived. Some states (Arizona, Nevada) only qualify for specific counties. The form will let you know if your county is covered.",
  },

  // ─── Part 9: Proof of Presence ───────────────────────────────
  part9_proofDocuments: {
    explanation:
      "Documents that prove you lived in the affected area during the testing period. The DOJ accepts many types of records — you don't need all of them, just enough to establish your presence.",
    whereToFind:
      "County clerk offices, school districts, church archives, the LDS Family History Library, your own files, or family members who may have kept old records.",
  },

  // ─── Part 10: Disease Information ────────────────────────────
  part10_diseaseSelection: {
    explanation:
      "Select the cancer(s) you or the exposed person was diagnosed with. The disease must be a 'primary' cancer — meaning where the cancer originated, not where it spread to. For example, if lung cancer spread to your liver, select 'Lung cancer,' not liver.",
    whereToFind:
      "Your pathology report, oncologist records, or hospital discharge summary will state the primary site.",
  },

  // ─── Part 11: Proof of Disease ───────────────────────────────
  part11_medicalRecords: {
    explanation:
      "Medical records that confirm your cancer diagnosis. The DOJ needs documentation from the time of diagnosis — these are called 'contemporary records' because they were created when the diagnosis was made.",
    whereToFind:
      "Request from your doctor's office, hospital medical records department, or oncology clinic. Ask for pathology reports, operative reports, or discharge summaries.",
  },

  // ─── Part 12: Previous Compensation ──────────────────────────
  part12_previousPayments: {
    explanation:
      "Whether you or the exposed person has received any prior compensation under RECA or the Energy Employees Occupational Illness Compensation Program (EEOICPA). Most first-time filers have not received prior RECA payments.",
  },
  part12_eeoicpa: {
    explanation:
      "EEOICPA is a separate federal program for nuclear weapons workers. If you or the exposed person received benefits under EEOICPA Part B, the amount may be offset from your RECA award. Part E benefits are not offset.",
    whereToFind:
      "Check past tax records or contact the Department of Labor at 1-866-888-3322.",
  },

  // ─── Part 13: Attorney Information ───────────────────────────
  part13_hasAttorney: {
    explanation:
      "Whether you have hired an attorney to represent you in your RECA claim. Most DIY filers do not have an attorney — if you're using RadiantClaims' DIY service, select 'No.' You can always hire one later if needed.",
  },
  part13_attorneyName: {
    explanation:
      "The full name of your attorney. If using RadiantClaims' legal representation service, this will be pre-filled.",
  },

  // ─── Part 16: Signature & Certification ──────────────────────
  part16_signature: {
    explanation:
      "By typing your full legal name, you are certifying that all information in this claim is true and correct to the best of your knowledge. This is a federal declaration — equivalent to signing under oath.",
  },
};

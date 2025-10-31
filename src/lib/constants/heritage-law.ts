/**
 * Heritage Law Offices - Legal Representation Partner
 *
 * Heritage Law Offices provides legal representation services for
 * RadiantClaims clients who select the Legal Representation path.
 */

export const HERITAGE_LAW_OFFICES = {
  name: "Heritage Law Offices",

  address: {
    street: "898 South State Street, Suite 100",
    city: "Orem",
    state: "UT",
    zip: "84097",
    full: "898 South State Street, Suite 100, Orem, UT 84097",
  },

  contact: {
    phone: "(801) 609-8182",
    phoneRaw: "8016098182",
    label: "Office Staff Text",
    // TODO: Confirm these details with Heritage Law:
    email: "contact@heritagelawoffices.com", // NEEDS CONFIRMATION
    website: "https://heritagelawoffices.com", // NEEDS CONFIRMATION
  },

  // Law firm details
  firm: {
    // TODO: Add these details:
    barNumber: "", // Bar association license number - NEEDS CONFIRMATION
    primaryContact: "", // Primary contact name - NEEDS CONFIRMATION
    primaryContactEmail: "", // Primary contact email - NEEDS CONFIRMATION
  },

  // Service agreement details
  serviceAgreement: {
    serviceFee: 1000.0, // $1,000 per referral
    // Payment terms to be confirmed:
    // - When is fee due? (Upon referral? Upon claim acceptance? Upon DOJ approval?)
    // - How is it invoiced? (Monthly batch? Per referral?)
    // - How is it paid? (Wire? Check? ACH?)
  },

  // Attorney fee (governed by federal RECA regulations)
  attorneyFee: {
    percentage: 2, // 2% of award
    standardAward: 100000, // $100,000 standard RECA award
    standardFee: 2000, // $2,000 standard attorney fee
    paidBy: "DOJ", // Department of Justice pays attorney directly
    note: "Attorney fees are paid directly by the Department of Justice via separate check. This is mandated by federal RECA regulations to prevent fee gouging.",
  },

  // SLA expectations
  sla: {
    responseTimeHours: 48, // Heritage Law contacts client within 48 hours of referral
    note: "Heritage Law will contact referred clients within 48 business hours to discuss representation and sign retainer agreement.",
  },
} as const;

// Type exports for use throughout the application
export type HeritageLawInfo = typeof HERITAGE_LAW_OFFICES;

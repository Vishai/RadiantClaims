/**
 * Service Tier Pricing and Configuration
 *
 * Defines the two service paths available to RadiantClaims customers:
 * 1. DIY Document Preparation ($149.99 + $24.99/mo)
 * 2. Legal Representation (No upfront cost, referred to Heritage Law)
 */

export const SERVICE_TIERS = {
  DIY_PREP: {
    id: "DIY_PREP",
    name: "DIY Document Preparation",
    shortName: "DIY Path",
    description:
      "We prepare your RECA claim forms and documents. You file directly with the Department of Justice.",

    pricing: {
      setupFee: 499.0, // One-time flat fee
      monthlyFeeFirstClaim: 0, // No monthly fee
      monthlyFeeAdditional: 0, // No monthly fee
      currency: "USD",
      billingCycle: "one-time",
      note: "One-time flat fee. Includes full document generation.",
    },

    features: [
      "Keep 100% of your award",
      "Instant PDF Packet Download",
      "Step-by-step filing instructions",
      "Document checklist & organization",
      "Secure portal access",
      "Progress tracking",
    ],

    userResponsibilities: [
      "Gather required documents",
      "Upload documents to portal",
      "Download completed form",
      "Print, sign, and mail form to DOJ",
      "Track claim status with DOJ",
    ],

    disclaimers: [
      "RadiantClaims provides document preparation services only.",
      "We are not a law firm and do not provide legal advice.",
      "For legal representation, select our Legal Representation Path.",
    ],

    refundPolicy: {
      periodDays: 7,
      conditions: [
        "Must request refund within 7 days of payment",
        "Cannot have downloaded the completed RECA form PDF",
        "Fee is refundable during grace period",
      ],
      note: "Once you download your completed RECA form PDF, the fee is non-refundable.",
    },
  },

  LEGAL_REP: {
    id: "LEGAL_REP",
    name: "Legal Representation",
    shortName: "Legal Path",
    description:
      "Work with Heritage Law Offices for full legal representation throughout your RECA claim process.",

    pricing: {
      setupFee: 0, // No upfront cost
      setupFeeRefundable: false,
      monthlyFeePerClaim: 0, // No monthly fee
      currency: "USD",
      billingCycle: "none",
      attorneyFeeAmount: 2000,
      attorneyFeePercentage: 2,
      recaAwardAmount: 100000,
      attorneyFeeNote:
        "Attorney fees are limited to 2% of the $100,000 RECA award ($2,000). The DOJ pays you directly, and you pay the attorney fee from your award. This is governed by federal RECA regulations (42 U.S.C. § 2210 note).",
      note: "No upfront cost. 2% attorney fee paid from award.",
    },

    features: [
      "Everything in DIY Path, plus:",
      "Professional attorney review of all documents",
      "Full legal representation throughout the process",
      "Attorney submits claim to DOJ on your behalf",
      "Resubmission assistance if claim is initially denied",
      "Legal guidance on complex eligibility issues",
      "Direct communication with DOJ on your behalf",
    ],

    userResponsibilities: [
      "Complete intake questionnaire",
      "Gather required documents",
      "Upload documents to portal",
      "Sign retainer agreement with Heritage Law",
      "Respond to attorney requests for information",
    ],

    disclaimers: [
      "By selecting legal representation, you will be connected with Heritage Law Offices, a licensed law firm.",
      "Heritage Law will contact you directly to discuss their services and sign a retainer agreement.",
      "Attorney fees are governed by federal RECA regulations (2% of award, paid when the DOJ pays out).",
      "RadiantClaims prepares your intake packet; Heritage Law provides legal services.",
    ],

    refundPolicy: {
      note: "No upfront fees charged.",
    },
  },
} as const;

// Stripe product IDs (to be set after creating products in Stripe)
export const STRIPE_PRODUCTS = {
  // DIY Path - NEW PRICING (Dec 2024)
  DIY_PACKET_FULL: {
    priceId:
      process.env.STRIPE_PRICE_ID_DIY_PACKET ||
      process.env.STRIPE_PRICE_ID_DIY_SETUP ||
      "",
    amount: SERVICE_TIERS.DIY_PREP.pricing.setupFee,
    currency: "usd",
    description: "RadiantClaims DIY - Complete Packet (One-time $499.00)",
  },
  DIY_PACKET_INSTALLMENT: {
    priceId:
      process.env.STRIPE_PRICE_ID_DIY_INSTALLMENT ||
      process.env.STRIPE_PRICE_ID_PACKET_2_PAYMENTS ||
      "",
    amount: 249.99, // Per payment ($499.98 total for 2 payments)
    currency: "usd",
    interval: "month",
    intervalCount: 1,
    maxPayments: 2, // Limit to exactly 2 payments
    description: "RadiantClaims DIY - 2 Payment Plan ($249.99 × 2)",
  },

  // DEPRECATED - Legacy per-claim pricing (kept for backwards compatibility)
  // Note: These are deprecated and should not be used. No env vars required.
  DIY_SETUP_FEE: {
    priceId: "",
    amount: 499.0,
    currency: "usd",
    description: "DEPRECATED: Use DIY_PACKET_FULL instead",
  },
  DIY_MONTHLY_FIRST_CLAIM: {
    priceId: "",
    amount: 0,
    currency: "usd",
    interval: "month",
    description: "DEPRECATED",
  },
  DIY_MONTHLY_ADDITIONAL: {
    priceId: "",
    amount: 0,
    currency: "usd",
    interval: "month",
    description: "DEPRECATED",
  },
  LEGAL_SETUP_FEE: {
    priceId: "",
    amount: SERVICE_TIERS.LEGAL_REP.pricing.setupFee,
    currency: "usd",
    description: "RadiantClaims Legal - No Upfront Cost",
  },
  LEGAL_MONTHLY_PER_CLAIM: {
    priceId: "",
    amount: SERVICE_TIERS.LEGAL_REP.pricing.monthlyFeePerClaim,
    currency: "usd",
    interval: "month",
    description: "DEPRECATED",
  },
} as const;

// Type exports
export type ServiceTierId = keyof typeof SERVICE_TIERS;
export type ServiceTierConfig = (typeof SERVICE_TIERS)[ServiceTierId];

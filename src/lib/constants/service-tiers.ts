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
      setupFee: 149.99,
      monthlyFee: 24.99,
      currency: "USD",
      billingCycle: "monthly",
    },

    features: [
      "Eligibility assessment",
      "Document checklist & organization",
      "RECA form preparation",
      "Ongoing portal access",
      "Document tracking",
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
        "Must request refund within 7 days of initial payment",
        "Cannot have downloaded the completed RECA form PDF",
        "Setup fee is refundable during grace period",
        "Monthly subscription can be canceled anytime (no refund on partial months)",
      ],
      note: "Once you download your completed RECA form PDF, the setup fee is non-refundable.",
    },
  },

  LEGAL_REP: {
    id: "LEGAL_REP",
    name: "Legal Representation",
    shortName: "Legal Path",
    description:
      "Work with Heritage Law Offices for full legal representation throughout your RECA claim process.",

    pricing: {
      setupFee: 0,
      monthlyFee: 0,
      attorneyFeeAmount: 2000,
      attorneyFeePercentage: 2,
      recaAwardAmount: 100000,
      attorneyFeeNote:
        "Attorney fees are limited to 2% of the $100,000 RECA award ($2,000) and are paid directly by the Department of Justice. This is governed by federal RECA regulations (42 U.S.C. § 2210 note).",
      currency: "USD",
    },

    features: [
      "Everything in DIY Path, plus:",
      "Attorney review of all documents",
      "Legal representation throughout process",
      "Attorney submits claim to DOJ on your behalf",
      "Resubmission assistance if claim is denied",
      "Legal guidance on complex issues",
      "Communication with DOJ on your behalf",
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
      "Attorney fees are governed by federal RECA regulations (2% of award, paid only if your claim is successful).",
      "RadiantClaims prepares your intake packet; Heritage Law provides legal services.",
    ],

    refundPolicy: {
      note: "No upfront payment required. No refunds applicable.",
    },
  },
} as const;

// Stripe product IDs (to be set after creating products in Stripe)
export const STRIPE_PRODUCTS = {
  DIY_SETUP_FEE: {
    priceId: process.env.STRIPE_PRICE_ID_DIY_SETUP || "",
    amount: SERVICE_TIERS.DIY_PREP.pricing.setupFee,
    currency: "usd",
    description: "RadiantClaims DIY Document Preparation - Setup Fee",
  },
  DIY_MONTHLY_SUBSCRIPTION: {
    priceId: process.env.STRIPE_PRICE_ID_DIY_MONTHLY || "",
    amount: SERVICE_TIERS.DIY_PREP.pricing.monthlyFee,
    currency: "usd",
    interval: "month",
    description:
      "RadiantClaims DIY Document Preparation - Monthly Subscription",
  },
} as const;

// Type exports
export type ServiceTierId = keyof typeof SERVICE_TIERS;
export type ServiceTierConfig = (typeof SERVICE_TIERS)[ServiceTierId];

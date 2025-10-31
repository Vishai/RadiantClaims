/**
 * Claim Timeline & Payout Pulse Types
 * Customer-facing timeline visualization and progress tracking
 */

export type DOJMilestone =
  | "NOT_SUBMITTED"
  | "RECEIVED_BY_DOJ"
  | "INITIAL_REVIEW"
  | "INCOMPLETE_RETURNED"
  | "DOCUMENT_VERIFICATION"
  | "REQUESTING_ADDITIONAL_DOCS"
  | "CANCER_REGISTRY_LOOKUP"
  | "MEDICAL_RECORDS_REQUEST"
  | "ELIGIBILITY_REVIEW"
  | "EXPOSURE_VERIFICATION"
  | "DISEASE_VERIFICATION"
  | "RELATIONSHIP_VERIFICATION"
  | "FINAL_REVIEW"
  | "APPROVED_PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_ISSUED"
  | "CLAIM_APPROVED"
  | "CLAIM_DENIED"
  | "CLAIM_WITHDRAWN"
  | "APPEAL_IN_PROGRESS"
  | "APPEAL_APPROVED"
  | "APPEAL_DENIED";

export interface MilestoneConfig {
  milestone: DOJMilestone;
  label: string;
  description: string;
  estimatedDays: number; // Typical days to complete this milestone
  icon: string; // Icon identifier
  category:
    | "pre-submission"
    | "initial"
    | "verification"
    | "assessment"
    | "decision"
    | "terminal";
  isTerminal: boolean;
}

export interface ClaimTimelineData {
  claimantId: string;
  currentMilestone: DOJMilestone;
  currentMilestoneDate: Date;
  daysInCurrentMilestone: number;
  totalProcessingDays: number;
  estimatedCompletionDate?: Date;
  estimatedPayoutDate?: Date;
  dojClaimNumber?: string;
  milestones: MilestoneEventData[];
  queuePosition?: QueuePositionData;
}

export interface MilestoneEventData {
  milestone: DOJMilestone;
  achievedAt: Date;
  daysToAchieve?: number;
  notes?: string;
  isEstimated: boolean;
  notifiedClaimant: boolean;
}

export interface QueuePositionData {
  estimatedPosition?: number;
  totalInQueue?: number;
  cohortId?: string;
  cohortSize?: number;
  cohortApproved?: number;
  cohortDenied?: number;
  percentFasterThan?: number;
}

export interface PayoutPulseData {
  // Current Period Stats
  avgTimeToApproval: number; // days
  avgTimeToPayment: number; // days
  approvalRate: number; // percentage

  // User's Claim Comparison
  yourProgress: number; // percentage complete
  typicalProgress: number; // typical progress at this point
  fasterThanPercent?: number; // "faster than X% of claims"

  // Timeline Projections
  estimatedApprovalDate: Date;
  estimatedPaymentDate: Date;
  confidenceLevel: "high" | "medium" | "low";

  // Cohort Info
  cohortSubmitted: number;
  cohortCompleted: number;
  cohortInProgress: number;
}

export const MILESTONE_CONFIGS: Record<DOJMilestone, MilestoneConfig> = {
  NOT_SUBMITTED: {
    milestone: "NOT_SUBMITTED",
    label: "Preparing Your Claim",
    description: "Your claim packet is being prepared for submission",
    estimatedDays: 0,
    icon: "FileText",
    category: "pre-submission",
    isTerminal: false,
  },
  RECEIVED_BY_DOJ: {
    milestone: "RECEIVED_BY_DOJ",
    label: "Received by DOJ",
    description:
      "Your claim has been received and logged by the Department of Justice",
    estimatedDays: 7,
    icon: "Inbox",
    category: "initial",
    isTerminal: false,
  },
  INITIAL_REVIEW: {
    milestone: "INITIAL_REVIEW",
    label: "Initial Review",
    description: "DOJ is checking that all required documents are included",
    estimatedDays: 14,
    icon: "Search",
    category: "initial",
    isTerminal: false,
  },
  INCOMPLETE_RETURNED: {
    milestone: "INCOMPLETE_RETURNED",
    label: "Additional Info Needed",
    description: "DOJ returned your claim requesting additional documentation",
    estimatedDays: 0,
    icon: "AlertCircle",
    category: "initial",
    isTerminal: false,
  },
  DOCUMENT_VERIFICATION: {
    milestone: "DOCUMENT_VERIFICATION",
    label: "Verifying Documents",
    description: "DOJ is verifying the authenticity of submitted documents",
    estimatedDays: 21,
    icon: "CheckCircle",
    category: "verification",
    isTerminal: false,
  },
  REQUESTING_ADDITIONAL_DOCS: {
    milestone: "REQUESTING_ADDITIONAL_DOCS",
    label: "Requesting More Info",
    description: "DOJ has requested additional supporting documentation",
    estimatedDays: 14,
    icon: "FileQuestion",
    category: "verification",
    isTerminal: false,
  },
  CANCER_REGISTRY_LOOKUP: {
    milestone: "CANCER_REGISTRY_LOOKUP",
    label: "Checking Cancer Registry",
    description: "DOJ is verifying diagnosis with state cancer registries",
    estimatedDays: 21,
    icon: "Database",
    category: "verification",
    isTerminal: false,
  },
  MEDICAL_RECORDS_REQUEST: {
    milestone: "MEDICAL_RECORDS_REQUEST",
    label: "Requesting Medical Records",
    description: "DOJ is obtaining medical records from healthcare providers",
    estimatedDays: 28,
    icon: "FileHeart",
    category: "verification",
    isTerminal: false,
  },
  ELIGIBILITY_REVIEW: {
    milestone: "ELIGIBILITY_REVIEW",
    label: "Eligibility Assessment",
    description: "DOJ is reviewing your eligibility for compensation",
    estimatedDays: 21,
    icon: "ClipboardCheck",
    category: "assessment",
    isTerminal: false,
  },
  EXPOSURE_VERIFICATION: {
    milestone: "EXPOSURE_VERIFICATION",
    label: "Verifying Exposure",
    description: "DOJ is confirming physical presence during testing period",
    estimatedDays: 14,
    icon: "MapPin",
    category: "assessment",
    isTerminal: false,
  },
  DISEASE_VERIFICATION: {
    milestone: "DISEASE_VERIFICATION",
    label: "Verifying Disease",
    description: "DOJ is confirming diagnosis of compensable disease",
    estimatedDays: 14,
    icon: "Stethoscope",
    category: "assessment",
    isTerminal: false,
  },
  RELATIONSHIP_VERIFICATION: {
    milestone: "RELATIONSHIP_VERIFICATION",
    label: "Verifying Relationship",
    description:
      "DOJ is confirming your relationship to the affected individual",
    estimatedDays: 7,
    icon: "Users",
    category: "assessment",
    isTerminal: false,
  },
  FINAL_REVIEW: {
    milestone: "FINAL_REVIEW",
    label: "Final Review",
    description: "DOJ adjudicator is conducting final review of your claim",
    estimatedDays: 14,
    icon: "Eye",
    category: "decision",
    isTerminal: false,
  },
  APPROVED_PENDING_PAYMENT: {
    milestone: "APPROVED_PENDING_PAYMENT",
    label: "Approved!",
    description:
      "Congratulations! Your claim has been approved and is awaiting payment processing",
    estimatedDays: 7,
    icon: "CheckCircle2",
    category: "decision",
    isTerminal: false,
  },
  PAYMENT_PROCESSING: {
    milestone: "PAYMENT_PROCESSING",
    label: "Payment Processing",
    description: "Your payment is being processed by the U.S. Treasury",
    estimatedDays: 14,
    icon: "DollarSign",
    category: "decision",
    isTerminal: false,
  },
  PAYMENT_ISSUED: {
    milestone: "PAYMENT_ISSUED",
    label: "Payment Issued",
    description: "Your payment has been issued and should arrive soon",
    estimatedDays: 7,
    icon: "Banknote",
    category: "decision",
    isTerminal: false,
  },
  CLAIM_APPROVED: {
    milestone: "CLAIM_APPROVED",
    label: "Claim Approved & Paid",
    description: "Your claim is complete. Congratulations!",
    estimatedDays: 0,
    icon: "Trophy",
    category: "terminal",
    isTerminal: true,
  },
  CLAIM_DENIED: {
    milestone: "CLAIM_DENIED",
    label: "Claim Denied",
    description:
      "Your claim was denied. You have the right to appeal this decision.",
    estimatedDays: 0,
    icon: "XCircle",
    category: "terminal",
    isTerminal: true,
  },
  CLAIM_WITHDRAWN: {
    milestone: "CLAIM_WITHDRAWN",
    label: "Claim Withdrawn",
    description: "This claim has been withdrawn",
    estimatedDays: 0,
    icon: "MinusCircle",
    category: "terminal",
    isTerminal: true,
  },
  APPEAL_IN_PROGRESS: {
    milestone: "APPEAL_IN_PROGRESS",
    label: "Appeal In Progress",
    description: "Your appeal is being reviewed by DOJ",
    estimatedDays: 60,
    icon: "Scale",
    category: "assessment",
    isTerminal: false,
  },
  APPEAL_APPROVED: {
    milestone: "APPEAL_APPROVED",
    label: "Appeal Approved",
    description: "Your appeal was successful!",
    estimatedDays: 0,
    icon: "CheckCircle2",
    category: "terminal",
    isTerminal: true,
  },
  APPEAL_DENIED: {
    milestone: "APPEAL_DENIED",
    label: "Appeal Denied",
    description: "Your appeal was denied",
    estimatedDays: 0,
    icon: "XCircle",
    category: "terminal",
    isTerminal: true,
  },
};

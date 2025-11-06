/**
 * Risk Analysis Schema
 * Defines types for risk flags that could cause claim denial
 */

export type RiskSeverity = "high" | "medium" | "low";
export type RiskCategory =
  | "compliance"
  | "eligibility"
  | "quality"
  | "consistency"
  | "authenticity";

export type RiskBlockingLevel = "BLOCKING" | "ADVISORY";
export type RiskDisposition =
  | "OPEN"
  | "PENDING_REVIEW"
  | "RESOLVED"
  | "WAIVED"
  | "BLOCKING_EXCLUDED";
export type RiskFixability = "CLAIMANT" | "REVIEWER" | "SYSTEM";
export type RiskAction =
  | "RESOLVE"
  | "LINK_EVIDENCE"
  | "REQUEST_WAIVER"
  | "EXCLUDE_DOCUMENT"
  | "ACKNOWLEDGE";
export type DocumentContributionStatus = "counts" | "provisional" | "excluded";

export interface RiskHistoryEntry {
  disposition: RiskDisposition;
  actorRole: RiskFixability | "SYSTEM_AUTO";
  actorId?: string;
  timestamp: string;
  comment?: string;
}

export interface RiskFlag {
  flag: string; // Unique identifier for the risk type
  severity: RiskSeverity;
  category: RiskCategory;
  message: string; // User-friendly description of the issue
  actionRequired: string; // What the user needs to do to resolve it
  details?: string; // Additional technical details
  affectedPages?: number[]; // Pages where the issue occurs
  relatedDocuments?: string[]; // Document IDs related to this risk
  blockingLevel?: RiskBlockingLevel; // Risk impact on document contribution
  disposition?: RiskDisposition; // Current lifecycle state
  fixableBy?: RiskFixability; // Primary actor responsible
  nextActionBy?: RiskFixability; // Who needs to take the next action
  availableActions?: RiskAction[]; // Supported actions for UI
  waiverExpiration?: string; // Optional waiver expiration ISO date
  linkedDocumentIds?: string[]; // Supporting evidence
  acknowledgedAt?: string; // When claimant acknowledged advisory risk
  history?: RiskHistoryEntry[]; // Lifecycle audit trail
  lastUpdatedAt?: string;
}

export interface RiskAnalysisResult {
  totalRisks: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  risks: RiskFlag[];
  overallRiskScore: number; // 0-1, where 1 is highest risk
  recommendedActions: string[];
  blockingRiskCount?: number;
  advisoryRiskCount?: number;
  pendingReviewCount?: number;
  awaitingClaimantCount?: number;
  awaitingSystemCount?: number;
  acknowledgedCount?: number;
  documentContributionStatus?: DocumentContributionStatus;
}

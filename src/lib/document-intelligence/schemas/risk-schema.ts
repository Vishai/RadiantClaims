/**
 * Risk Analysis Schema
 * Defines types for risk flags that could cause claim denial
 */

export type RiskSeverity = "high" | "medium" | "low";
export type RiskCategory =
  | "compliance"
  | "eligibility"
  | "quality"
  | "consistency";

export interface RiskFlag {
  flag: string; // Unique identifier for the risk type
  severity: RiskSeverity;
  category: RiskCategory;
  message: string; // User-friendly description of the issue
  actionRequired: string; // What the user needs to do to resolve it
  details?: string; // Additional technical details
  affectedPages?: number[]; // Pages where the issue occurs
  relatedDocuments?: string[]; // Document IDs related to this risk
}

export interface RiskAnalysisResult {
  totalRisks: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  risks: RiskFlag[];
  overallRiskScore: number; // 0-1, where 1 is highest risk
  recommendedActions: string[];
}

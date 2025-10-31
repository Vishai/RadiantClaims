/**
 * RECA Compliance Check Schema
 * Defines types for compliance validation results
 */

import { ClaimType, RequiredDocument } from "./reca-requirements";

export interface MissingRequirement {
  item: string;
  category: string;
  priority: "high" | "medium" | "low";
  suggestion: string;
}

export interface DateSanityCheck {
  issue: string;
  severity: "high" | "medium" | "low";
  details: string;
  dates?: {
    label: string;
    value: string;
  }[];
}

export interface JurisdictionMatch {
  county?: string;
  state?: string;
  inCoveredCounties: boolean;
  confidence: number;
  affectedCounties?: string[];
  issues?: string[];
}

export interface NameConsistencyCheck {
  issue: string;
  status: "needs_confirmation" | "ok" | "warning";
  severity: "high" | "medium" | "low";
  details?: string;
}

export interface EligibilityFlag {
  flag: string;
  status: "meets_requirement" | "does_not_meet" | "unclear";
  details: string;
  severity?: "high" | "medium" | "low";
}

export interface RECAComplianceResult {
  claimTypeSuspected: ClaimType;
  claimTypeConfidence: number; // 0-1
  claimTypeReasoning: string;
  checklistCoverage: number; // 0-1 (percentage complete)
  missingRequirements: MissingRequirement[];
  dateSanity: DateSanityCheck[];
  jurisdictionMatch: JurisdictionMatch;
  nameConsistency: NameConsistencyCheck[];
  eligibilityFlags: EligibilityFlag[];
  diseaseMatch?: {
    diagnosisFound: boolean;
    isCoveredDisease: boolean;
    diagnosisName?: string;
    confidence: number;
  };
}

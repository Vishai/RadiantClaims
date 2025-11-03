import type {
  DocumentQualificationStatus as BackendDocumentQualificationStatus,
  DocumentDjApprovalImpact,
  DocumentUserAction,
} from "@/lib/document-intelligence/schemas/compliance-schema";
import type { OtherDocumentAnalysis } from "@/lib/document-intelligence/other-document-analyzer";

export type DocumentQualificationStatus = BackendDocumentQualificationStatus;

export interface DocumentQualificationSummary {
  status: DocumentQualificationStatus;
  confidence: number;
  reason: string;
  matchedRequirementName?: string;
  matchedRequirementCategory?: string;
  matchedRequirementPriority?: "high" | "medium" | "low";
  djApprovalImpact: DocumentDjApprovalImpact;
  userActionNeeded: DocumentUserAction;
  suggestion: string;
  issues: string[];
  categoryMismatch?: {
    userSelected: string;
    aiDetected: string;
    aiConfidence: number;
    shouldUseAiCategory: boolean;
    explanation: string;
  } | null;
}

export type SupportingDocumentInsight = OtherDocumentAnalysis;

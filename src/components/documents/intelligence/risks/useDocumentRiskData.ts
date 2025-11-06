import { useMemo } from "react";
import type {
  RiskAnalysisResult,
  RiskCategory,
  RiskFlag,
  DocumentContributionStatus,
} from "@/lib/document-intelligence/schemas";
import {
  determineContributionStatus,
  resolveBlockingLevel,
  resolveNextActionBy,
  resolveDisposition,
  severityOrder,
} from "./helpers";

export interface DocumentRiskItem {
  index: number;
  risk: RiskFlag;
}

export interface RiskLevelDescriptor {
  label: string;
  color: string;
  bgColor: string;
}

export interface DocumentRiskSummary {
  total: number;
  byCategory: Record<RiskCategory, number>;
  bySeverity: Record<"high" | "medium" | "low", number>;
  blocking: number;
  advisory: number;
  pendingReview: number;
  awaitingClaimant: number;
  awaitingSystem: number;
  acknowledged: number;
  contribution: DocumentContributionStatus;
  riskScore: number;
  riskLevel: RiskLevelDescriptor;
}

export function useDocumentRiskData(
  analysis?: RiskAnalysisResult | null,
  documentId?: string
): { items: DocumentRiskItem[]; summary: DocumentRiskSummary } {
  return useMemo(() => {
    const risks = analysis?.risks ?? [];
    const relevant = risks
      .map<DocumentRiskItem>((risk, index) => ({ risk, index }))
      .filter(({ risk }) => isRiskRelevantToDocument(risk, documentId));

    const totals: DocumentRiskSummary = {
      total: relevant.length,
      byCategory: {
        compliance: 0,
        eligibility: 0,
        quality: 0,
        consistency: 0,
        authenticity: 0,
      },
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0,
      },
      blocking: 0,
      advisory: 0,
      pendingReview: 0,
      awaitingClaimant: 0,
      awaitingSystem: 0,
      acknowledged: 0,
      contribution: determineContributionStatus(relevant.map((r) => r.risk)),
      riskScore: Math.round((analysis?.overallRiskScore ?? 0) * 100),
      riskLevel: resolveRiskLevel(
        Math.round((analysis?.overallRiskScore ?? 0) * 100)
      ),
    };

    for (const item of relevant) {
      const { risk } = item;
      totals.byCategory[risk.category] += 1;
      totals.bySeverity[risk.severity] += 1;

      const blockingLevel = resolveBlockingLevel(risk);
      if (blockingLevel === "BLOCKING") {
        totals.blocking += 1;
      } else {
        totals.advisory += 1;
      }

      const disposition = resolveDisposition(risk);
      const nextActor = resolveNextActionBy(risk);

      if (disposition === "PENDING_REVIEW") {
        totals.pendingReview += 1;
      }

      if (nextActor === "CLAIMANT") {
        totals.awaitingClaimant += 1;
      } else if (nextActor === "SYSTEM") {
        totals.awaitingSystem += 1;
      }

      if (
        blockingLevel === "ADVISORY" &&
        typeof risk.acknowledgedAt === "string"
      ) {
        totals.acknowledged += 1;
      }
    }

    return {
      items: relevant.sort((a, b) => {
        const severityDiff =
          severityOrder[a.risk.severity] - severityOrder[b.risk.severity];
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return a.index - b.index;
      }),
      summary: totals,
    };
  }, [analysis, documentId]);
}

function isRiskRelevantToDocument(risk: RiskFlag, documentId?: string) {
  if (!documentId) {
    return true;
  }

  if (!risk.relatedDocuments || risk.relatedDocuments.length === 0) {
    return true;
  }

  return risk.relatedDocuments.includes(documentId);
}

function resolveRiskLevel(score: number): RiskLevelDescriptor {
  if (score >= 70) {
    return {
      label: "High Document Risk",
      color: "text-red-500",
      bgColor: "bg-red-500",
    };
  }
  if (score >= 40) {
    return {
      label: "Moderate Document Risk",
      color: "text-amber-500",
      bgColor: "bg-amber-500",
    };
  }
  return {
    label: "Low Document Risk",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
  };
}

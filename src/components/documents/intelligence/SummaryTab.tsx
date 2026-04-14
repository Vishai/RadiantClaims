"use client";

import type { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { QUALIFICATION_COPY } from "../qualification-utils";
import { cn } from "@/lib/utils";

interface SummaryTabProps {
  data: IntelligenceResponse;
  mimeType?: string;
}

export function SummaryTab({ data, mimeType }: SummaryTabProps) {
  const {
    compliance,
    risks,
    aiCategorization,
    qualification,
    ocrConfidence,
    quality,
  } = data;

  const qualificationCopy = qualification
    ? QUALIFICATION_COPY[qualification.status]
    : null;

  const isPdf = mimeType === "application/pdf";

  // Check for blocking document-level risks that override qualification
  const DOCUMENT_RISK_CATEGORIES = new Set([
    "authenticity",
    "quality",
    "consistency",
  ]);
  const blockingDocRisks = (risks?.risks ?? []).filter(
    (r) =>
      DOCUMENT_RISK_CATEGORIES.has(r.category) &&
      r.severity === "high" &&
      r.disposition !== "RESOLVED" &&
      r.disposition !== "WAIVED"
  );
  const hasBlockingDocIssues = blockingDocRisks.length > 0;

  // Quality metrics
  const ocrPercent = Math.round((ocrConfidence ?? 0) * 100);
  const qualityPercent = quality?.qualityScore
    ? Math.round(quality.qualityScore * 100)
    : ocrPercent;

  const getQualityLevel = (score: number) => {
    if (score >= 80)
      return { label: "Good", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 60)
      return {
        label: "Acceptable",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    return { label: "Poor", color: "text-red-600", bg: "bg-red-50" };
  };

  const qualityLevel = getQualityLevel(qualityPercent);

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Compliance metrics moved to packet-level view

  // Filter to only document-level issues for the summary
  const docTopRisks = (risks?.risks ?? [])
    .filter((r) => DOCUMENT_RISK_CATEGORIES.has(r.category))
    .sort((a, b) => {
      const s = { high: 0, medium: 1, low: 2 } as const;
      return (
        (s[a.severity as keyof typeof s] ?? 2) -
        (s[b.severity as keyof typeof s] ?? 2)
      );
    })
    .slice(0, 3);

  return (
    <div className="space-y-5 py-4">
      {/* BLOCKING ISSUES FIRST — show before any positive signals */}
      {hasBlockingDocIssues && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-red-900">
                Blocking Issues Found
              </h3>
              <p className="text-sm text-red-800">
                This document has critical issues that must be resolved or
                addressed before it can count toward your claim.
              </p>
              <div className="space-y-2">
                {blockingDocRisks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded bg-red-100/50 p-2"
                  >
                    <span className="mt-0.5 text-sm">{"\u{1F534}"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">
                        {risk.message}
                      </p>
                      <p className="text-xs text-red-700">
                        {risk.actionRequired}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-red-700">
                Go to the{" "}
                <span className="font-semibold">Compliance &amp; Risks</span>{" "}
                tab to dismiss, provide explanation, or take action on these
                issues.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Alert — shown after blocking issues if any */}
      {qualification && qualificationCopy && !hasBlockingDocIssues && (
        <div
          className={cn("rounded-lg border p-4", qualificationCopy.className)}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none">
              {qualificationCopy.icon}
            </span>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {qualificationCopy.label}
                </h3>
                <span className="text-xs uppercase tracking-wide opacity-80">
                  {Math.round(qualification.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-sm leading-relaxed">{qualification.reason}</p>
              {qualification.matchedRequirement && (
                <p className="text-xs font-medium">
                  Satisfies: {qualification.matchedRequirement.name}
                </p>
              )}
              {qualification.suggestion && (
                <p className="text-xs text-muted-foreground">
                  {qualification.suggestion}
                </p>
              )}
              {qualification.issues && qualification.issues.length > 0 && (
                <ul className="list-inside list-disc text-xs opacity-80">
                  {qualification.issues.map((issue, idx) => (
                    <li key={`${issue}-${idx}`}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiCategorization && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <FileCheck className="h-4 w-4" />
            AI Summary
          </h3>
          <p className="text-sm text-muted-foreground">
            {aiCategorization.reasoning}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {aiCategorization.suggestedCategory
                .split("_")
                .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                .join(" ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(aiCategorization.confidence * 100)}% confident
            </span>
          </div>
        </div>
      )}

      {/* Document Quality Assessment */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Document Quality
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${qualityLevel.color}`}>
              {qualityPercent}%
            </span>
            <Badge
              variant={
                qualityPercent >= 80
                  ? "default"
                  : qualityPercent >= 60
                    ? "secondary"
                    : "destructive"
              }
            >
              {qualityLevel.label}
            </Badge>
          </div>
        </div>
        <Progress
          value={qualityPercent}
          className="mb-3 h-2"
          indicatorClassName={getProgressColor(qualityPercent)}
        />

        {/* OCR Confidence */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isPdf ? "Text Extraction" : "Text Recognition (OCR)"}
          </span>
          <span className="font-medium">{ocrPercent}%</span>
        </div>

        {/* Quality recommendations */}
        {quality?.recommendations && quality.recommendations.length > 0 && (
          <div className="mt-3 space-y-1">
            {quality.recommendations.map((rec, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">
                {rec}
              </p>
            ))}
          </div>
        )}

        {/* Image-specific issues */}
        {!isPdf && quality && (quality.isBlurry || quality.isLowContrast) && (
          <div className="mt-3 space-y-2">
            {quality.isBlurry && (
              <div className="flex items-center gap-2 text-xs text-yellow-700">
                <AlertTriangle className="h-3 w-3" />
                Document appears blurry - consider rescanning
              </div>
            )}
            {quality.isLowContrast && (
              <div className="flex items-center gap-2 text-xs text-yellow-700">
                <AlertTriangle className="h-3 w-3" />
                Low contrast detected - ensure good lighting when scanning
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claim Completeness and Missing Requirements are packet-level metrics
          and belong on the /portal/documents overview page, not here. */}

      {/* Top Document-Level Risks (not claim-wide ones) */}
      {docTopRisks.length > 0 && !hasBlockingDocIssues && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Document Issues
          </h3>
          <div className="space-y-2">
            {docTopRisks.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 text-sm">
                  {risk.severity === "high"
                    ? "\u{1F534}"
                    : risk.severity === "medium"
                      ? "\u{1F7E1}"
                      : "\u{1F7E2}"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{risk.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {risk.actionRequired}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions — filter to document-specific only */}
      {risks &&
        (() => {
          // Filter out claim-wide recommendations (about uploading other docs, claim completeness)
          const claimWidePatterns = [
            /upload.*remaining/i,
            /claim.*complete/i,
            /missing.*document/i,
            /increase.*completeness/i,
            /upload.*required/i,
          ];
          const docActions = (risks.recommendedActions ?? []).filter(
            (a) => !claimWidePatterns.some((p) => p.test(a))
          );
          return docActions.length > 0 ? (
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                Next Steps
              </h3>
              <ul className="list-inside list-disc space-y-1">
                {docActions.map((action, idx) => (
                  <li key={idx} className="text-sm">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

      {/* No data fallback */}
      {!qualification && !aiCategorization && !compliance && !risks && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          <p className="text-sm">
            No analysis data available yet. The document may still be
            processing.
          </p>
        </div>
      )}
    </div>
  );
}

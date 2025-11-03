"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { QUALIFICATION_COPY } from "../qualification-utils";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  data: IntelligenceResponse;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { compliance, risks, aiCategorization, qualification } = data;
  const qualificationCopy = qualification
    ? QUALIFICATION_COPY[qualification.status]
    : null;

  // Defensive check for missing data
  if (!compliance || !risks) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Intelligence data is incomplete. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Calculate completeness percentage
  const completenessPercent = Math.round(
    (compliance.checklistCoverage ?? 0) * 100
  );

  // Get top 3 missing requirements
  const topMissing = (compliance.missingRequirements ?? [])
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  // Get top 5 risks
  const topRisks = (risks.risks ?? [])
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 5);

  // Determine completeness color
  const getCompletenessColor = (percent: number) => {
    if (percent >= 80) return "text-green-500";
    if (percent >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getCompletenessBarColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 py-4">
      {qualification && qualificationCopy && (
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
                  ✓ Satisfies: {qualification.matchedRequirement.name}
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

      {/* AI-Generated Summary */}
      {aiCategorization && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-lg font-semibold">AI Summary</h3>
          <p className="text-sm text-muted-foreground">
            {aiCategorization.reasoning}
          </p>
        </div>
      )}

      {/* Claim Type */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Claim Analysis</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Claim Type:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {compliance.claimTypeSuspected ?? "Unknown"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.round((compliance.claimTypeConfidence ?? 0) * 100)}%
                confident
              </span>
            </div>
          </div>
          {aiCategorization && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Document Category:</span>
              <Badge variant="secondary">
                {aiCategorization.suggestedCategory}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Completeness Progress */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Claim Completeness</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span
              className={`text-2xl font-bold ${getCompletenessColor(completenessPercent)}`}
            >
              {completenessPercent}%
            </span>
          </div>
          <Progress
            value={completenessPercent}
            className="h-2"
            indicatorClassName={getCompletenessBarColor(completenessPercent)}
          />
        </div>
      </div>

      {/* Top Missing Requirements */}
      {topMissing.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <XCircle className="h-5 w-5 text-red-500" />
            Top Missing Requirements
          </h3>
          <div className="space-y-3">
            {topMissing.map((req, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Badge
                  variant={
                    req.priority === "high"
                      ? "destructive"
                      : req.priority === "medium"
                        ? "default"
                        : "secondary"
                  }
                  className="mt-0.5"
                >
                  {req.priority}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{req.item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {req.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Risks */}
      {topRisks.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Top Risks
          </h3>
          <div className="space-y-3">
            {topRisks.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span
                  className={`text-lg ${
                    risk.severity === "high"
                      ? "text-red-500"
                      : risk.severity === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                >
                  {risk.severity === "high"
                    ? "🔴"
                    : risk.severity === "medium"
                      ? "🟡"
                      : "🟢"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{risk.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {risk.actionRequired}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {(risks.recommendedActions ?? []).length > 0 && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            Recommended Actions
          </h3>
          <ul className="list-inside list-disc space-y-2">
            {(risks.recommendedActions ?? []).map((action, idx) => (
              <li key={idx} className="text-sm">
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

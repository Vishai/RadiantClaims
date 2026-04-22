"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, Shield } from "lucide-react";

interface ComplianceTabProps {
  data: IntelligenceResponse;
}

export function ComplianceTab({ data }: ComplianceTabProps) {
  const { compliance } = data;

  // Defensive check for missing data
  if (!compliance) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Compliance data is not available. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const completenessPercent = Math.round(
    (compliance.checklistCoverage ?? 0) * 100
  );
  const confidencePercent = Math.round(
    (compliance.claimTypeConfidence ?? 0) * 100
  );

  return (
    <div className="space-y-6 py-4">
      {/* Claim Type Detection */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5" />
          Claim Type Detection
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Detected Type:</span>
            <Badge variant="default" className="text-base capitalize">
              {compliance.claimTypeSuspected}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-2" />
          </div>
          {compliance.claimTypeReasoning && (
            <p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
              {compliance.claimTypeReasoning}
            </p>
          )}
        </div>
      </div>

      {/* Completeness Checklist */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Completeness Checklist</h3>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold">{completenessPercent}%</span>
          </div>
          <Progress value={completenessPercent} className="h-2" />
        </div>
        {compliance.missingRequirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Missing Requirements ({compliance.missingRequirements.length})
            </p>
            {compliance.missingRequirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-muted/30 p-2"
              >
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{req.item}</p>
                    <Badge
                      variant={
                        req.priority === "high"
                          ? "destructive"
                          : req.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {req.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {req.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {compliance.missingRequirements.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              All required documents appear to be present
            </p>
          </div>
        )}
      </div>

      {/* Jurisdiction Check (for downwinders) */}
      {compliance.claimTypeSuspected === "downwinder" && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Jurisdiction Check</h3>
          <div className="space-y-3">
            {compliance.jurisdictionMatch.inCoveredCounties ? (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Location is in covered counties
                  </p>
                  {compliance.jurisdictionMatch.county && (
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      {compliance.jurisdictionMatch.county},{" "}
                      {compliance.jurisdictionMatch.state}
                    </p>
                  )}
                  {compliance.jurisdictionMatch.affectedCounties && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Affected counties:{" "}
                      {compliance.jurisdictionMatch.affectedCounties.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Location may not be in covered counties
                  </p>
                  {compliance.jurisdictionMatch.issues && (
                    <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
                      {compliance.jurisdictionMatch.issues.map((issue, idx) => (
                        <li key={idx}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Sanity Checks */}
      {compliance.dateSanity.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Date Validation</h3>
          <div className="space-y-2">
            {compliance.dateSanity.map((check, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-lg p-3 ${
                  check.severity === "high"
                    ? "bg-red-50 dark:bg-red-950"
                    : check.severity === "medium"
                      ? "bg-yellow-50 dark:bg-yellow-950"
                      : "bg-blue-50 dark:bg-blue-950"
                }`}
              >
                <AlertCircle
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                    check.severity === "high"
                      ? "text-red-500"
                      : check.severity === "medium"
                        ? "text-yellow-500"
                        : "text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{check.issue}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {check.details}
                  </p>
                  {check.dates && check.dates.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {check.dates.map((date, didx) => (
                        <p key={didx} className="text-xs">
                          {date.label}:{" "}
                          <span className="font-mono">{date.value}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {check.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Name Consistency */}
      {compliance.nameConsistency.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Name Consistency</h3>
          <div className="space-y-2">
            {compliance.nameConsistency.map((check, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-lg p-3 ${
                  check.status === "ok"
                    ? "bg-green-50 dark:bg-green-950"
                    : check.status === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-950"
                      : "bg-blue-50 dark:bg-blue-950"
                }`}
              >
                {check.status === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle
                    className={`mt-0.5 h-4 w-4 ${
                      check.status === "warning"
                        ? "text-yellow-500"
                        : "text-blue-500"
                    }`}
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{check.issue}</p>
                  {check.details && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligibility Flags */}
      {compliance.eligibilityFlags.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Eligibility Checks</h3>
          <div className="space-y-2">
            {compliance.eligibilityFlags.map((flag, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-lg p-3 ${
                  flag.status === "meets_requirement"
                    ? "bg-green-50 dark:bg-green-950"
                    : flag.status === "does_not_meet"
                      ? "bg-red-50 dark:bg-red-950"
                      : "bg-yellow-50 dark:bg-yellow-950"
                }`}
              >
                {flag.status === "meets_requirement" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                ) : flag.status === "does_not_meet" ? (
                  <XCircle className="mt-0.5 h-4 w-4 text-red-500" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{flag.flag}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {flag.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disease Match */}
      {compliance.diseaseMatch && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Disease Coverage</h3>
          <div className="space-y-3">
            {compliance.diseaseMatch.diagnosisFound ? (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 ${
                  compliance.diseaseMatch.isCoveredDisease
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-red-50 dark:bg-red-950"
                }`}
              >
                {compliance.diseaseMatch.isCoveredDisease ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {compliance.diseaseMatch.isCoveredDisease
                      ? "Disease is covered by RECA"
                      : "Disease may not be covered by RECA"}
                  </p>
                  {compliance.diseaseMatch.diagnosisName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diagnosis: {compliance.diseaseMatch.diagnosisName}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confidence:{" "}
                    {Math.round(compliance.diseaseMatch.confidence * 100)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <p className="text-sm font-medium">
                  No diagnosis information found in document
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

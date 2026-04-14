"use client";

import { useEffect, useMemo, useState } from "react";
import type { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  AlertTriangle,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { RiskAction } from "@/lib/document-intelligence/schemas";
import {
  FilterCategory,
  REVIEWER_ROLES,
  formatTimestamp,
} from "./risks/helpers";
import {
  useDocumentRiskData,
  DocumentRiskItem,
} from "./risks/useDocumentRiskData";
import { RiskSummaryPanel } from "./risks/RiskSummaryPanel";
// RiskWorkflowSummary and RiskCategoryFilter removed — risks are now split by scope
import { RiskTable } from "./risks/RiskTable";
import { RiskActionDialog } from "./risks/RiskActionDialog";

interface ComplianceRisksTabProps {
  data: IntelligenceResponse;
  documentId?: string;
  userRole?: UserRole;
  onRefresh?: () => Promise<unknown> | void;
}

export function ComplianceRisksTab({
  data,
  documentId,
  userRole,
  onRefresh,
}: ComplianceRisksTabProps) {
  const { compliance, risks: riskAnalysis } = data;
  const [filterCategory] = useState<FilterCategory>("all");
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    item: DocumentRiskItem;
    action: RiskAction;
  } | null>(null);

  const effectiveRole = (userRole ?? "CUSTOMER") as UserRole;
  const userActor = REVIEWER_ROLES.has(effectiveRole) ? "REVIEWER" : "CLAIMANT";
  const canMutate = Boolean(documentId);

  const { items, summary } = useDocumentRiskData(riskAnalysis, documentId);
  const filteredItems = useMemo(() => {
    if (filterCategory === "all") return items;
    return items.filter((item) => item.risk.category === filterCategory);
  }, [items, filterCategory]);

  useEffect(() => {
    if (actionStatus?.type === "success") {
      const timer = window.setTimeout(() => setActionStatus(null), 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [actionStatus]);

  const hasCompliance = Boolean(compliance);
  const hasRisks = Boolean(riskAnalysis);

  if (!hasCompliance && !hasRisks) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Compliance and risk analysis data is not yet available.
          </p>
        </div>
      </div>
    );
  }

  const completenessPercent = compliance
    ? Math.round((compliance.checklistCoverage ?? 0) * 100)
    : 0;
  const confidencePercent = compliance
    ? Math.round((compliance.claimTypeConfidence ?? 0) * 100)
    : 0;

  const handleAction = async (
    item: DocumentRiskItem,
    action: RiskAction,
    formValues: {
      comment?: string;
      linkedDocumentIds?: string[];
      waiverExpiration?: string;
    }
  ): Promise<boolean> => {
    if (!documentId) {
      setActionStatus({
        type: "error",
        message: "Document identifier missing.",
      });
      return false;
    }

    const { index } = item;
    if (index === undefined || index === null) {
      setActionStatus({ type: "error", message: "Could not locate risk." });
      return false;
    }

    const trimmedComment = formValues.comment?.trim();
    const payload: Record<string, unknown> = { riskIndex: index, action };

    if (action === "REQUEST_WAIVER" && !trimmedComment) {
      setActionStatus({
        type: "error",
        message: "Please provide a brief explanation.",
      });
      return false;
    }

    if (trimmedComment) payload.comment = trimmedComment;
    if (formValues.linkedDocumentIds)
      payload.linkedDocumentIds = formValues.linkedDocumentIds;
    if (formValues.waiverExpiration) {
      const parsed = new Date(formValues.waiverExpiration);
      if (Number.isNaN(parsed.getTime())) {
        setActionStatus({ type: "error", message: "Invalid expiration date." });
        return false;
      }
      payload.waiverExpiration = parsed.toISOString();
    }

    try {
      setProcessingIndex(index);
      setActionStatus(null);

      const response = await fetch(`/api/documents/${documentId}/risks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to update.");

      setActionStatus({
        type: "success",
        message: result.message || "Risk updated.",
      });
      if (onRefresh) await onRefresh();
      return true;
    } catch (error: any) {
      setActionStatus({
        type: "error",
        message: error?.message || "Failed to update.",
      });
      return false;
    } finally {
      setProcessingIndex(null);
    }
  };

  const lastAnalyzed = formatTimestamp(data.metadata?.risksAnalyzedAt);

  return (
    <div className="space-y-6 py-4">
      {actionStatus && (
        <Alert
          variant={actionStatus.type === "error" ? "destructive" : "default"}
        >
          {actionStatus.type === "error" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <AlertTitle>
            {actionStatus.type === "error" ? "Action Failed" : "Action Saved"}
          </AlertTitle>
          <AlertDescription>{actionStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* ─── COMPLIANCE SECTION ─── */}
      {hasCompliance && compliance && (
        <>
          <div className="flex items-center gap-2 border-b pb-2">
            <Shield className="h-5 w-5 text-sage-600" />
            <h3 className="text-lg font-semibold">Compliance</h3>
          </div>

          {/* Claim Type Detection */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-base font-semibold">
              Claim Type Detection
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Detected Type:</span>
                <Badge variant="default" className="capitalize">
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
            <h4 className="mb-3 text-base font-semibold">
              Completeness Checklist
            </h4>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-lg font-bold">
                  {completenessPercent}%
                </span>
              </div>
              <Progress value={completenessPercent} className="h-2" />
            </div>
            {compliance.missingRequirements.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Missing ({compliance.missingRequirements.length})
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
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  All required documents appear to be present
                </p>
              </div>
            )}
          </div>

          {/* Jurisdiction Check (downwinder) */}
          {compliance.claimTypeSuspected === "downwinder" && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-base font-semibold">
                Jurisdiction Check
              </h4>
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
                        {compliance.jurisdictionMatch.issues.map(
                          (issue, idx) => (
                            <li key={idx}>{issue}</li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Sanity Checks */}
          {compliance.dateSanity.length > 0 && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-base font-semibold">Date Validation</h4>
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
              <h4 className="mb-3 text-base font-semibold">Name Consistency</h4>
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
              <h4 className="mb-3 text-base font-semibold">
                Eligibility Checks
              </h4>
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
              <h4 className="mb-3 text-base font-semibold">Disease Coverage</h4>
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
          )}
        </>
      )}

      {/* ─── DOCUMENT RISKS SECTION ─── */}
      {hasRisks && riskAnalysis && (
        <>
          <div className="mt-2 flex items-center gap-2 border-b pb-2">
            <AlertTriangle className="h-5 w-5 text-sage-600" />
            <h3 className="text-lg font-semibold">Document Risks</h3>
          </div>

          <RiskSummaryPanel summary={summary} lastAnalyzedAt={lastAnalyzed} />

          {/* Document-specific risks (authenticity, quality, consistency) */}
          {(() => {
            const DOCUMENT_RISK_CATEGORIES = new Set([
              "authenticity",
              "quality",
              "consistency",
            ]);
            const docRisks = filteredItems.filter((item) =>
              DOCUMENT_RISK_CATEGORIES.has(item.risk.category)
            );
            // Claim-wide risks excluded from document view

            return (
              <>
                {docRisks.length > 0 && (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Issues with this document
                    </p>
                    <RiskTable
                      risks={docRisks}
                      actor={userActor}
                      canMutate={canMutate}
                      processingIndex={processingIndex}
                      onActionSelect={(item, action) =>
                        setPendingAction({ item, action })
                      }
                    />
                  </>
                )}

                {docRisks.length === 0 && (
                  <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        No document-level issues detected
                      </p>
                    </div>
                  </div>
                )}

                {/* Claim-wide risks omitted — those belong on the documents overview page */}
              </>
            );
          })()}

          {riskAnalysis.recommendedActions.length > 0 && (
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
              <h4 className="mb-3 text-base font-semibold">
                Recommended Actions
              </h4>
              <ul className="space-y-2">
                {riskAnalysis.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 font-bold text-blue-500">
                      &rarr;
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RiskActionDialog
            open={Boolean(pendingAction)}
            action={pendingAction?.action}
            actor={userActor}
            risk={pendingAction?.item.risk}
            submitting={Boolean(
              pendingAction &&
                processingIndex !== null &&
                processingIndex === pendingAction.item.index
            )}
            onClose={() => {
              if (
                pendingAction &&
                processingIndex !== null &&
                processingIndex === pendingAction.item.index
              )
                return;
              setPendingAction(null);
            }}
            onSubmit={async (formValues) => {
              if (!pendingAction) return;
              const success = await handleAction(
                pendingAction.item,
                pendingAction.action,
                formValues
              );
              if (success) setPendingAction(null);
            }}
          />
        </>
      )}
    </div>
  );
}

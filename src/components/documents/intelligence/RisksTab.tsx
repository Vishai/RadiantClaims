"use client";

import { useEffect, useMemo, useState } from "react";
import type { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { RiskWorkflowSummary } from "./risks/RiskWorkflowSummary";
import { RiskCategoryFilter } from "./risks/RiskCategoryFilter";
import { RiskTable } from "./risks/RiskTable";
import { RiskActionDialog } from "./risks/RiskActionDialog";

interface RisksTabProps {
  data: IntelligenceResponse;
  documentId?: string;
  userRole?: UserRole;
  onRefresh?: () => Promise<unknown> | void;
}

export function RisksTab({
  data,
  documentId,
  userRole,
  onRefresh,
}: RisksTabProps) {
  const { risks: riskAnalysis } = data;
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
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
    if (filterCategory === "all") {
      return items;
    }
    return items.filter((item) => item.risk.category === filterCategory);
  }, [items, filterCategory]);

  useEffect(() => {
    if (actionStatus?.type === "success") {
      const timer = window.setTimeout(() => setActionStatus(null), 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [actionStatus]);

  if (!riskAnalysis) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Risk analysis data is not available. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

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
        message: "Document identifier missing. Unable to perform action.",
      });
      return false;
    }

    const { index } = item;
    if (index === undefined || index === null) {
      setActionStatus({
        type: "error",
        message: "Could not locate risk entry.",
      });
      return false;
    }

    const trimmedComment = formValues.comment?.trim();
    const payload: Record<string, unknown> = {
      riskIndex: index,
      action,
    };

    if (action === "REQUEST_WAIVER" && !trimmedComment) {
      setActionStatus({
        type: "error",
        message: "Please provide a brief explanation before dismissing.",
      });
      return false;
    }

    if (trimmedComment && trimmedComment.length > 0) {
      payload.comment = trimmedComment;
    }
    if (formValues.linkedDocumentIds) {
      payload.linkedDocumentIds = formValues.linkedDocumentIds;
    }
    if (formValues.waiverExpiration) {
      const parsed = new Date(formValues.waiverExpiration);
      if (Number.isNaN(parsed.getTime())) {
        setActionStatus({
          type: "error",
          message: "Invalid dismissal expiration date.",
        });
        return false;
      }
      payload.waiverExpiration = parsed.toISOString();
    }

    try {
      setProcessingIndex(index);
      setActionStatus(null);

      const response = await fetch(`/api/documents/${documentId}/risks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to update risk.");
      }

      setActionStatus({
        type: "success",
        message: result.message || "Risk updated successfully.",
      });

      if (onRefresh) {
        await onRefresh();
      }
      return true;
    } catch (error: any) {
      setActionStatus({
        type: "error",
        message: error?.message || "Failed to update risk.",
      });
      return false;
    } finally {
      setProcessingIndex(null);
    }
  };

  const lastAnalyzed = formatTimestamp(data.metadata?.risksAnalyzedAt);

  return (
    <div className="space-y-6 py-4">
      {actionStatus ? (
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
      ) : null}

      <RiskSummaryPanel summary={summary} lastAnalyzedAt={lastAnalyzed} />

      <RiskWorkflowSummary summary={summary} />

      <RiskCategoryFilter
        value={filterCategory}
        summary={summary}
        onChange={setFilterCategory}
      />

      <RiskTable
        risks={filteredItems}
        actor={userActor}
        canMutate={canMutate}
        processingIndex={processingIndex}
        onActionSelect={(item, action) => {
          setPendingAction({ item, action });
        }}
      />

      {riskAnalysis.recommendedActions.length > 0 ? (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-3 text-lg font-semibold">Recommended Actions</h3>
          <ul className="space-y-2">
            {riskAnalysis.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 font-bold text-blue-500">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
          ) {
            return;
          }
          setPendingAction(null);
        }}
        onSubmit={async (formValues) => {
          if (!pendingAction) return;
          const success = await handleAction(
            pendingAction.item,
            pendingAction.action,
            formValues
          );
          if (success) {
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}

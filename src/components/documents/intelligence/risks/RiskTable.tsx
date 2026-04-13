import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentRiskItem } from "./useDocumentRiskData";
import type {
  RiskAction,
  RiskFixability,
} from "@/lib/document-intelligence/schemas";
import {
  actionLabels,
  actorLabels,
  canUserActOnRisk,
  dispositionMeta,
  formatTimestamp,
  getActionOptionsForUser,
  getActorLabel,
  isClosed,
  resolveBlockingLevel,
  resolveDisposition,
  resolveFixableBy,
  resolveNextActionBy,
  severityOrder,
  SortField,
  SortOrder,
} from "./helpers";

interface RiskTableProps {
  risks: DocumentRiskItem[];
  actor: RiskFixability;
  canMutate: boolean;
  processingIndex: number | null;
  onActionSelect: (item: DocumentRiskItem, action: RiskAction) => void;
}

const severityEmoji: Record<string, string> = {
  high: "\u{1F534}",
  medium: "\u{1F7E1}",
  low: "\u{1F7E2}",
};

export function RiskTable({
  risks,
  actor,
  canMutate,
  processingIndex,
  onActionSelect,
}: RiskTableProps) {
  const [sortField, setSortField] = useState<SortField>("severity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const sortedRisks = useMemo(() => {
    const result = [...risks];
    result.sort((a, b) => {
      switch (sortField) {
        case "severity": {
          const diff =
            severityOrder[a.risk.severity] - severityOrder[b.risk.severity];
          return sortOrder === "asc" ? diff : -diff;
        }
        case "category": {
          const diff = a.risk.category.localeCompare(b.risk.category);
          return sortOrder === "asc" ? diff : -diff;
        }
        case "message": {
          const diff = a.risk.message.localeCompare(b.risk.message);
          return sortOrder === "asc" ? diff : -diff;
        }
        default:
          return 0;
      }
    });
    return result;
  }, [risks, sortField, sortOrder]);

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (sortedRisks.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        No risks found in this category.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sort by:</span>
        {(["severity", "category"] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => {
              if (sortField === field) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortField(field);
                setSortOrder("asc");
              }
            }}
            className={`rounded px-2 py-0.5 capitalize hover:bg-sage-100 ${
              sortField === field ? "bg-sage-100 font-medium text-sage-900" : ""
            }`}
          >
            {field}
            {sortField === field &&
              (sortOrder === "asc" ? " \u2191" : " \u2193")}
          </button>
        ))}
      </div>

      {/* Risk cards */}
      {sortedRisks.map((item) => {
        const { risk, index } = item;
        const isExpanded = expanded.has(index);
        const blockingLevel = resolveBlockingLevel(risk);
        const disposition = resolveDisposition(risk);
        const nextActor = resolveNextActionBy(risk);
        const actionOptions = getActionOptionsForUser(risk, actor);
        const userCanAct = canUserActOnRisk(risk, actor, canMutate);
        const showActionMenu = userCanAct && actionOptions.length > 0;
        const isProcessing = processingIndex === index;
        const closed = isClosed(disposition);

        return (
          <div
            key={`${risk.flag}-${index}`}
            className={`rounded-lg border p-4 ${
              closed
                ? "border-sage-200 bg-sage-50/50 opacity-75"
                : blockingLevel === "BLOCKING"
                  ? "border-red-200 bg-red-50/30"
                  : "border-sage-200"
            }`}
          >
            {/* Top row: severity + category + impact + status */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-base">{severityEmoji[risk.severity]}</span>
              <Badge
                variant={
                  risk.severity === "high"
                    ? "destructive"
                    : risk.severity === "medium"
                      ? "default"
                      : "secondary"
                }
                className="text-xs"
              >
                {risk.severity}
              </Badge>
              <span className="text-xs capitalize text-muted-foreground">
                {risk.category}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Badge
                  className={`text-xs ${
                    blockingLevel === "BLOCKING"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {blockingLevel === "BLOCKING" ? "Blocking" : "Advisory"}
                </Badge>
                <Badge
                  className={`text-xs ${dispositionMeta[disposition].className}`}
                >
                  {dispositionMeta[disposition].label}
                </Badge>
              </div>
            </div>

            {/* Issue description */}
            <p className="text-sm font-medium text-sage-900">{risk.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {risk.actionRequired}
            </p>

            {/* Actions row */}
            {!closed && (
              <div className="mt-3 flex items-center gap-2">
                {nextActor && (
                  <span className="text-xs text-muted-foreground">
                    {actorLabels[nextActor]} action needed
                  </span>
                )}
                {showActionMenu && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-7 text-xs"
                        disabled={isProcessing}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <MoreHorizontal className="mr-1 h-3 w-3" />
                        )}
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actionOptions.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing) onActionSelect(item, option);
                          }}
                        >
                          {actionLabels[option]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Expand toggle */}
                {hasExpandableDetails(risk) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleExpanded(index)}
                  >
                    {isExpanded ? (
                      <>
                        Less <ChevronUp className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Details <ChevronDown className="ml-1 h-3 w-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-3 border-t pt-3">
                <RiskExpandedDetails risk={risk} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function hasExpandableDetails(risk: DocumentRiskItem["risk"]) {
  return Boolean(
    risk.details ||
      (risk.linkedDocumentIds && risk.linkedDocumentIds.length > 0) ||
      (risk.history && risk.history.length > 0) ||
      (risk.affectedPages && risk.affectedPages.length > 0) ||
      risk.acknowledgedAt ||
      risk.waiverExpiration
  );
}

function RiskExpandedDetails({ risk }: { risk: DocumentRiskItem["risk"] }) {
  return (
    <div className="space-y-3 text-sm">
      {risk.details && <p className="text-muted-foreground">{risk.details}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border border-dashed p-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Fixable By
          </p>
          <p className="font-medium">{actorLabels[resolveFixableBy(risk)]}</p>
        </div>
        <div className="rounded border border-dashed p-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Evidence
          </p>
          <p className="font-medium">
            {(risk.linkedDocumentIds ?? []).length > 0
              ? `${risk.linkedDocumentIds?.length} linked`
              : "None"}
          </p>
        </div>
        <div className="rounded border border-dashed p-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Updated
          </p>
          <p className="font-medium">
            {formatTimestamp(risk.lastUpdatedAt) ?? "Unknown"}
          </p>
        </div>
      </div>

      {risk.history && risk.history.length > 0 && (
        <div>
          <p className="text-xs font-medium">History</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {risk.history.map((entry, i) => (
              <li key={i}>
                {dispositionMeta[entry.disposition]?.label ?? entry.disposition}{" "}
                &middot; {getActorLabel(entry.actorRole)} &middot;{" "}
                {formatTimestamp(entry.timestamp)}
                {entry.comment && <> &mdash; {entry.comment}</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

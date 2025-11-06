import { Fragment, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  resolveAvailableActions,
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

const severityEmoji = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (sortedRisks.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No document-level risks found in this category.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              label="Severity"
              field="severity"
              sortField={sortField}
              sortOrder={sortOrder}
              className="w-28"
              onClick={toggleSort}
            />
            <SortableHeader
              label="Category"
              field="category"
              sortField={sortField}
              sortOrder={sortOrder}
              onClick={toggleSort}
            />
            <SortableHeader
              label="Issue"
              field="message"
              sortField={sortField}
              sortOrder={sortOrder}
              onClick={toggleSort}
            />
            <TableHead>Impact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Step</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRisks.map((item) => {
            const { risk, index } = item;
            const isExpanded = expanded.has(index);
            const blockingLevel = resolveBlockingLevel(risk);
            const disposition = resolveDisposition(risk);
            const nextActor = resolveNextActionBy(risk);
            const availableActions = resolveAvailableActions(risk);
            const actionOptions = getActionOptionsForUser(risk, actor);
            const userCanAct = canUserActOnRisk(risk, actor, canMutate);
            const showActionMenu = userCanAct && actionOptions.length > 0;
            const isProcessing = processingIndex === index;

            return (
              <Fragment key={`${risk.flag}-${index}`}>
                <TableRow className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {severityEmoji[risk.severity]}
                      </span>
                      <Badge
                        variant={
                          risk.severity === "high"
                            ? "destructive"
                            : risk.severity === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{risk.category}</TableCell>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <p>{risk.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {risk.actionRequired}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        blockingLevel === "BLOCKING"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      }
                    >
                      {blockingLevel === "BLOCKING" ? "Blocking" : "Advisory"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`font-medium ${dispositionMeta[disposition].className}`}
                    >
                      {dispositionMeta[disposition].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {nextActor
                          ? `${actorLabels[nextActor]} action needed`
                          : "No further action"}
                      </p>
                      {availableActions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {availableActions.map((action) => (
                            <Badge
                              key={action}
                              variant="outline"
                              className="border-dashed px-2 text-xs"
                            >
                              {actionLabels[action]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No actions configured
                        </p>
                      )}
                      {showActionMenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              disabled={isProcessing}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <MoreHorizontal className="mr-2 h-3 w-3" />
                              )}
                              Take action
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {actionOptions.map((option) => (
                              <DropdownMenuItem
                                key={option}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!isProcessing) {
                                    onActionSelect(item, option);
                                  }
                                }}
                              >
                                {actionLabels[option]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasExpandableDetails(risk) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(index)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30">
                      <RiskExpandedDetails risk={risk} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableHeader({
  label,
  field,
  sortField,
  sortOrder,
  onClick,
  className = "",
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
  onClick: (field: SortField) => void;
  className?: string;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none ${className}`}
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortOrder === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : null}
      </div>
    </TableHead>
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
    <div className="space-y-4 p-4 text-sm">
      {risk.details ? (
        <div>
          <p className="font-medium">Details</p>
          <p className="mt-1 text-muted-foreground">{risk.details}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border border-dashed bg-white/40 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Fixable By
          </p>
          <p className="mt-1 font-semibold">
            {actorLabels[resolveFixableBy(risk)]}
          </p>
          {risk.nextActionBy && !isClosed(risk.disposition) ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Next actor: {actorLabels[risk.nextActionBy]}
            </p>
          ) : null}
        </div>

        <div className="rounded border border-dashed bg-white/40 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Evidence
          </p>
          <p className="mt-1 font-semibold">
            {(risk.linkedDocumentIds ?? []).length > 0
              ? `${risk.linkedDocumentIds?.length} linked`
              : "No evidence linked"}
          </p>
          {risk.linkedDocumentIds && risk.linkedDocumentIds.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {risk.linkedDocumentIds.map((docId) => (
                <li key={docId} className="font-mono">
                  {docId}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded border border-dashed bg-white/40 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Timeline
          </p>
          <p className="mt-1 font-semibold">
            {formatTimestamp(risk.lastUpdatedAt) ?? "Unknown"}
          </p>
          {risk.waiverExpiration || risk.acknowledgedAt ? (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {risk.waiverExpiration ? (
                <p>
                  Dismissal expires: {formatTimestamp(risk.waiverExpiration)}
                </p>
              ) : null}
              {risk.acknowledgedAt ? (
                <p>Acknowledged: {formatTimestamp(risk.acknowledgedAt)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {risk.history && risk.history.length > 0 ? (
        <div>
          <p className="font-medium">History</p>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {risk.history.map((entry, entryIdx) => (
              <li key={entryIdx}>
                <span className="font-medium text-slate-600 dark:text-slate-200">
                  {dispositionMeta[entry.disposition]?.label ??
                    entry.disposition}
                </span>
                {" • "}
                <span>{getActorLabel(entry.actorRole)}</span>
                {" • "}
                <span>{formatTimestamp(entry.timestamp)}</span>
                {entry.comment ? (
                  <>
                    <br />
                    <span>{entry.comment}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {risk.affectedPages && risk.affectedPages.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Affected pages: {risk.affectedPages.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

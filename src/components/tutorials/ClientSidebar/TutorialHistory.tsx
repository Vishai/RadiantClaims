"use client";

import { useMemo } from "react";
import { TutorialStatus } from "@prisma/client";
import { Clock, CheckCircle2, SkipForward } from "lucide-react";
import type { TutorialProgressRecord } from "@/lib/tutorials";

interface TutorialHistoryProps {
  history: TutorialProgressRecord[];
  loading?: boolean;
  collapsed?: boolean;
}

export function TutorialHistory({
  history,
  loading,
  collapsed,
}: TutorialHistoryProps) {
  const entries = useMemo(() => history.slice(0, 4), [history]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tutorials completed yet.
      </p>
    );
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center text-xs text-muted-foreground">
        <Clock className="h-5 w-5" aria-hidden />
        <span>{entries.length}</span>
        <span>History</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.tutorialKey}
          className="rounded-lg border border-border/60 bg-white/70 p-3 text-sm"
        >
          <div className="flex items-center gap-2 font-medium text-foreground">
            <StatusIcon status={entry.status} />
            <span>{entry.title}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {statusDescription(entry)}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: TutorialStatus }) {
  switch (status) {
    case TutorialStatus.COMPLETED:
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case TutorialStatus.SKIPPED:
      return <SkipForward className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
}

function statusDescription(entry: TutorialProgressRecord) {
  const date = entry.completedAt ?? entry.skippedAt ?? entry.startedAt;
  const formatted = new Date(date).toLocaleDateString();
  switch (entry.status) {
    case TutorialStatus.COMPLETED:
      return `Completed on ${formatted}`;
    case TutorialStatus.SKIPPED:
      return `Skipped on ${formatted}`;
    default:
      return `Started on ${formatted}`;
  }
}

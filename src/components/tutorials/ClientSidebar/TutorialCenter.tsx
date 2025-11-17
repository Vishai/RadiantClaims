"use client";

import { useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { TutorialStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTutorialStore } from "@/lib/tutorials/context";
import type { TutorialSummary } from "@/lib/tutorials";
import { ProgressIndicator } from "../shared/ProgressIndicator";

interface TutorialCenterProps {
  collapsed?: boolean;
  onLaunch: (tutorialKey: string) => Promise<void> | void;
}

export function TutorialCenter({ collapsed, onLaunch }: TutorialCenterProps) {
  const tutorials = useTutorialStore((state) => state.tutorials);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const sortedTutorials = useMemo(() => {
    return [...tutorials].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [tutorials]);

  if (collapsed) {
    const remaining = tutorials.filter(
      (tutorial) => tutorial.status !== TutorialStatus.COMPLETED
    ).length;
    return (
      <div className="text-center text-xs text-muted-foreground">
        <p>{remaining} active</p>
        <p className="text-[10px] uppercase tracking-wide">Tutorials</p>
      </div>
    );
  }

  const handleLaunch = async (tutorialKey: string) => {
    setPendingKey(tutorialKey);
    try {
      await onLaunch(tutorialKey);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="space-y-3">
      {sortedTutorials.slice(0, 4).map((tutorial) => (
        <TutorialCard
          key={tutorial.key}
          tutorial={tutorial}
          loading={pendingKey === tutorial.key}
          onLaunch={handleLaunch}
        />
      ))}
      {sortedTutorials.length > 4 && (
        <p className="text-xs text-muted-foreground">
          Showing top {sortedTutorials.length > 4 ? 4 : sortedTutorials.length}{" "}
          of {sortedTutorials.length} tutorials.
        </p>
      )}
    </div>
  );
}

function TutorialCard({
  tutorial,
  loading,
  onLaunch,
}: {
  tutorial: TutorialSummary;
  loading: boolean;
  onLaunch: (key: string) => void;
}) {
  const status = tutorial.status ?? TutorialStatus.NOT_STARTED;
  const stepCount =
    tutorial.totalSteps ??
    (Array.isArray(tutorial.steps) ? tutorial.steps.length : 0);
  const progressPercent =
    stepCount > 0
      ? Math.round(((tutorial.currentStep ?? 0) / stepCount) * 100)
      : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-white/80 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {tutorial.title}
          </p>
          {tutorial.description && (
            <p className="text-xs text-muted-foreground">
              {tutorial.description}
            </p>
          )}
        </div>
        <Badge variant={statusBadgeVariant(status)}>
          {statusLabel(status)}
        </Badge>
      </div>
      <div className="mt-3">
        <ProgressIndicator
          value={progressPercent}
          compact
          statusLabel={`${progressPercent}%`}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{stepCount} steps</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          className="gap-1"
          onClick={() => onLaunch(tutorial.key)}
        >
          {status === TutorialStatus.COMPLETED ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {status === TutorialStatus.IN_PROGRESS
            ? "Resume"
            : status === TutorialStatus.COMPLETED
              ? "Replay"
              : "Start"}
        </Button>
      </div>
    </div>
  );
}

function statusLabel(status: TutorialStatus) {
  switch (status) {
    case TutorialStatus.COMPLETED:
      return "Done";
    case TutorialStatus.IN_PROGRESS:
      return "In progress";
    case TutorialStatus.SKIPPED:
      return "Skipped";
    default:
      return "Not started";
  }
}

function statusBadgeVariant(status: TutorialStatus) {
  switch (status) {
    case TutorialStatus.COMPLETED:
      return "secondary";
    case TutorialStatus.IN_PROGRESS:
      return "default";
    case TutorialStatus.SKIPPED:
      return "destructive";
    default:
      return "outline";
  }
}

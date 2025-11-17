"use client";

import { useMemo } from "react";
import { BookOpenCheck } from "lucide-react";
import { TutorialStatus } from "@prisma/client";
import { useTutorialStore } from "@/lib/tutorials/context";
import type { ClientJourneyStage } from "@/lib/tutorials";

interface ContextualHelpProps {
  page: string;
  stage?: ClientJourneyStage | null;
  collapsed?: boolean;
  onLaunch: (tutorialKey: string) => void;
}

export function ContextualHelp({
  page,
  stage,
  collapsed,
  onLaunch,
}: ContextualHelpProps) {
  const tutorials = useTutorialStore((state) => state.tutorials);
  const relevant = useMemo(() => {
    return tutorials
      .filter((tutorial) => {
        const matchesPage =
          tutorial.targetPages && tutorial.targetPages.length > 0
            ? tutorial.targetPages.some((target) => page.startsWith(target))
            : true;
        const matchesStage = stage
          ? !tutorial.journeyStages || tutorial.journeyStages.includes(stage)
          : true;
        return (
          matchesPage &&
          matchesStage &&
          tutorial.status !== TutorialStatus.COMPLETED
        );
      })
      .slice(0, collapsed ? 2 : 3);
  }, [tutorials, page, stage, collapsed]);

  if (relevant.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contextual tips for this page.
      </p>
    );
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center text-xs text-muted-foreground">
        <BookOpenCheck className="h-5 w-5" aria-hidden />
        <span>{relevant.length}</span>
        <span>Tips</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relevant.map((tutorial) => (
        <button
          key={tutorial.key}
          className="w-full rounded-md border border-transparent bg-muted/40 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5"
          onClick={() => onLaunch(tutorial.key)}
        >
          <p className="font-semibold text-foreground">{tutorial.title}</p>
          {tutorial.description && (
            <p className="text-xs text-muted-foreground">
              {tutorial.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

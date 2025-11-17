"use client";

import { ClientJourneyStage } from "@/lib/tutorials";
import { cn } from "@/lib/utils";

const STAGE_META: Record<
  ClientJourneyStage,
  { label: string; description: string; color: string }
> = {
  [ClientJourneyStage.NEW_USER]: {
    label: "New user",
    description: "Getting started",
    color: "bg-gray-100 text-gray-700",
  },
  [ClientJourneyStage.ONBOARDING]: {
    label: "Onboarding",
    description: "Profile & basics",
    color: "bg-blue-100 text-blue-700",
  },
  [ClientJourneyStage.DOCUMENT_COLLECTION]: {
    label: "Collecting docs",
    description: "Gathering evidence",
    color: "bg-amber-100 text-amber-700",
  },
  [ClientJourneyStage.FORM_FILLING]: {
    label: "Form filling",
    description: "RECA application",
    color: "bg-purple-100 text-purple-700",
  },
  [ClientJourneyStage.SUBMITTED]: {
    label: "Submitted",
    description: "Packet sent",
    color: "bg-emerald-100 text-emerald-700",
  },
  [ClientJourneyStage.UNDER_REVIEW]: {
    label: "Under review",
    description: "Attorney / DOJ review",
    color: "bg-sky-100 text-sky-700",
  },
  [ClientJourneyStage.APPROVED]: {
    label: "Approved",
    description: "Awaiting payment",
    color: "bg-green-100 text-green-700",
  },
  [ClientJourneyStage.COMPLETED]: {
    label: "Completed",
    description: "Claim closed",
    color: "bg-gray-200 text-gray-700",
  },
};

export function StageIndicator({
  stage,
}: {
  stage?: ClientJourneyStage | null;
}) {
  if (!stage) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
        Detecting your claim journey…
      </div>
    );
  }

  const meta = STAGE_META[stage];

  return (
    <div className="rounded-md border border-muted px-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Journey stage</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            meta.color
          )}
        >
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
    </div>
  );
}

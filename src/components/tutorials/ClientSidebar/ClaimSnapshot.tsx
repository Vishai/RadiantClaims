"use client";

import { FileText, Flag } from "lucide-react";
import { ClientJourneyStage } from "@/lib/tutorials";
import { ProgressIndicator } from "../shared/ProgressIndicator";

const STAGE_PROGRESS: Record<ClientJourneyStage, number> = {
  [ClientJourneyStage.NEW_USER]: 5,
  [ClientJourneyStage.ONBOARDING]: 15,
  [ClientJourneyStage.DOCUMENT_COLLECTION]: 35,
  [ClientJourneyStage.FORM_FILLING]: 55,
  [ClientJourneyStage.SUBMITTED]: 70,
  [ClientJourneyStage.UNDER_REVIEW]: 85,
  [ClientJourneyStage.APPROVED]: 95,
  [ClientJourneyStage.COMPLETED]: 100,
};

interface ClaimSnapshotProps {
  stage?: ClientJourneyStage | null;
  collapsed?: boolean;
}

export function ClaimSnapshot({ stage, collapsed }: ClaimSnapshotProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center text-xs text-muted-foreground">
        <FileText className="h-5 w-5" aria-hidden />
        <span>{stage ?? "..."}</span>
      </div>
    );
  }

  const progress = stage ? STAGE_PROGRESS[stage] : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-gradient-to-br from-white to-primary/5 p-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Flag className="h-4 w-4 text-primary" />
        <span>Claim snapshot</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Track your claim progress here. We surface any required actions or
        missing info automatically.
      </p>
      <ProgressIndicator
        value={progress}
        label="Overall progress"
        statusLabel={`${progress}%`}
      />
      <div className="rounded-md bg-white/60 p-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Next milestone</p>
        <p>{nextMilestone(stage)}</p>
      </div>
    </div>
  );
}

function nextMilestone(stage?: ClientJourneyStage | null) {
  switch (stage) {
    case ClientJourneyStage.DOCUMENT_COLLECTION:
      return "Upload remaining residency proof.";
    case ClientJourneyStage.FORM_FILLING:
      return "Complete section 4 of the RECA form.";
    case ClientJourneyStage.SUBMITTED:
      return "Attorney review in progress.";
    case ClientJourneyStage.UNDER_REVIEW:
      return "Waiting on DOJ milestone update.";
    case ClientJourneyStage.APPROVED:
      return "Payment processing by DOJ/Treasury.";
    case ClientJourneyStage.COMPLETED:
      return "Congratulations! Your claim is complete.";
    default:
      return "Complete your profile to unlock personalized guidance.";
  }
}

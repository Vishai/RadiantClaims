/**
 * Section Transition Encouragement Messages
 *
 * Shown as toast notifications when the user successfully
 * saves and advances to the next form section.
 */

import type { RECAWorkflowSection } from "./types";

interface EncouragementMessage {
  message: string;
  /** Milestone sections get a larger inline celebration card */
  isMilestone?: boolean;
}

export const ENCOURAGEMENT_MESSAGES: Partial<
  Record<RECAWorkflowSection, EncouragementMessage>
> = {
  part_1: {
    message: "Great start! Your personal information is saved.",
  },
  part_2: {
    message: "Thank you — this information helps verify the claim.",
  },
  part_3: {
    message:
      "Perfect. We've customized the remaining sections for your situation.",
    isMilestone: true,
  },
  part_4: {
    message: "Your identity details are saved. Keep going!",
  },
  part_5: {
    message: "Marriage information saved. You're making great progress.",
  },
  part_6: {
    message: "Family information complete. The hardest section is behind you.",
    isMilestone: true,
  },
  part_7: {
    message: "Relationship details saved.",
  },
  part_8: {
    message: "You're past the halfway mark! Exposure information saved.",
    isMilestone: true,
  },
  part_9: {
    message: "Proof of presence section saved.",
  },
  part_10: {
    message:
      "Disease information recorded. Almost through the medical sections.",
    isMilestone: true,
  },
  part_11: {
    message: "Medical documentation section saved.",
  },
  part_12: {
    message: "Previous compensation check complete. Just a few sections left!",
  },
  part_13: {
    message: "Attorney information saved.",
  },
  part_14: {
    message: "Attorney acknowledgment recorded.",
  },
  part_15: {
    message: "Guardian information saved. One more section to go!",
  },
  part_16: {
    message:
      "All form sections complete! Time to review everything and prepare to file.",
    isMilestone: true,
  },
};

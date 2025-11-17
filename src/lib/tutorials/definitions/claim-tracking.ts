import { ClientJourneyStage, TutorialDefinition } from "../types";

export const claimTrackingTutorials: TutorialDefinition[] = [
  {
    key: "claim-status-deep-dive",
    title: "Understanding status updates",
    description:
      "How to interpret timeline chips, DOJ milestones, and required tasks.",
    triggerEvent: "MANUAL",
    targetPages: ["/portal/claim"],
    steps: [
      {
        id: "milestones",
        title: "Milestones",
        content: "Each milestone corresponds to specific DOJ processing steps.",
        placement: "bottom-right",
        spotlightTarget: "#claim-timeline",
      },
      {
        id: "required-actions",
        title: "Required actions",
        content:
          "We surface required actions here so nothing slips through the cracks.",
        placement: "right",
        spotlightTarget: "#required-actions",
      },
      {
        id: "history",
        title: "History & notes",
        content:
          "See everything RadiantClaims, your attorney, and DOJ have done so far.",
        placement: "right",
        spotlightTarget: "#claim-history",
      },
    ],
    journeyStages: [
      ClientJourneyStage.UNDER_REVIEW,
      ClientJourneyStage.SUBMITTED,
    ],
  },
  {
    key: "claim-timeline-interpretation",
    title: "Timeline interpretation",
    description: "Learn how to predict next steps and understand delays.",
    triggerEvent: "MANUAL",
    targetPages: ["/portal/claim"],
    steps: [
      {
        id: "progress",
        title: "Progress indicator",
        content:
          "Percents are based on real milestone completion, not guesses.",
        placement: "bottom-right",
        spotlightTarget: "#progress-indicator",
      },
      {
        id: "eta",
        title: "Estimated timelines",
        content:
          "We use historical data and your case type to estimate next milestones.",
        placement: "right",
        spotlightTarget: "#timeline-eta",
      },
      {
        id: "delays",
        title: "Handling delays",
        content:
          "We’ll proactively tell you if anything is stalled and how we’re fixing it.",
        placement: "right",
        spotlightTarget: "#delay-banner",
      },
    ],
    journeyStages: [ClientJourneyStage.UNDER_REVIEW],
  },
  {
    key: "claim-next-steps",
    title: "Next steps guidance",
    description: "Shows how we recommend actions based on your journey stage.",
    triggerEvent: "NEEDS_HELP",
    targetPages: ["/portal", "/portal/claim"],
    steps: [
      {
        id: "recommended-tutorials",
        title: "Recommended tutorials",
        content:
          "The tutorial center suggests walkthroughs based on your current stage.",
        placement: "right",
        spotlightTarget: "#tutorial-center-trigger",
      },
      {
        id: "contextual-help",
        title: "Contextual help",
        content: "Each page has tips tailored to what you’re working on.",
        placement: "right",
        spotlightTarget: "#contextual-help-card",
      },
      {
        id: "support-actions",
        title: "Support resources",
        content: "Chat, schedule, or call directly from the sidebar.",
        placement: "right",
        spotlightTarget: "#support-contact-card",
        actions: [{ label: "Finish", action: "COMPLETE", variant: "primary" }],
      },
    ],
    journeyStages: [
      ClientJourneyStage.ONBOARDING,
      ClientJourneyStage.UNDER_REVIEW,
    ],
  },
];

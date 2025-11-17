import { ClientJourneyStage, TutorialDefinition } from "../types";

export const recaFormTutorials: TutorialDefinition[] = [
  {
    key: "reca-form-overview",
    title: "RECA form overview",
    description: "High-level orientation before you dive into the application.",
    triggerEvent: "FORM_STARTED",
    targetPages: ["/portal/reca", "/portal/forms/reca"],
    steps: [
      {
        id: "sections",
        title: "Sections",
        content:
          "We split the DOJ form into short, autosaving sections you can finish in any order.",
        placement: "left",
        spotlightTarget: "#reca-section-list",
      },
      {
        id: "autosave",
        title: "Autosave",
        content:
          "Everything saves as you type. You can safely close the browser anytime.",
        placement: "right",
        spotlightTarget: "#reca-editor",
      },
      {
        id: "supporting-docs",
        title: "Supporting documents",
        content:
          "Each section shows which uploads or affidavits are needed to back up your answers.",
        placement: "right",
        spotlightTarget: "#reca-supporting-docs",
      },
    ],
    journeyStages: [ClientJourneyStage.FORM_FILLING],
  },
  {
    key: "reca-section-guide",
    title: "Section-by-section guide",
    description: "Mini tips surface while you work through the form.",
    triggerEvent: "FORM_RESUMED",
    targetPages: ["/portal/forms/reca"],
    steps: [
      {
        id: "claimant-info",
        title: "Claimant information",
        content:
          "Use the identity information exactly as it appears on IDs or legal records.",
        placement: "right",
        spotlightTarget: "#reca-claimant-section",
      },
      {
        id: "exposure",
        title: "Exposure details",
        content:
          "Provide the specific sites, roles, and years of exposure for easier verification.",
        placement: "right",
        spotlightTarget: "#reca-exposure-section",
      },
      {
        id: "disease",
        title: "Disease confirmation",
        content:
          "Match the diagnosis to one of the DOJ-approved conditions to avoid delays.",
        placement: "right",
        spotlightTarget: "#reca-disease-section",
      },
    ],
    journeyStages: [ClientJourneyStage.FORM_FILLING],
  },
  {
    key: "reca-common-mistakes",
    title: "Common mistakes",
    description: "Highlights the top issues that slow down approvals.",
    triggerEvent: "NEEDS_HELP",
    targetPages: ["/portal/forms/reca/review"],
    steps: [
      {
        id: "missing-dates",
        title: "Missing or inconsistent dates",
        content: "Make sure employment, exposure, and residency dates align.",
        placement: "right",
        spotlightTarget: "#reca-review-dates",
      },
      {
        id: "witness-info",
        title: "Witness information",
        content:
          "List at least one person who can verify your work or residency history.",
        placement: "right",
        spotlightTarget: "#reca-review-witness",
      },
      {
        id: "signatures",
        title: "Signatures",
        content:
          "All required signature blocks must be signed by the claimant or authorized rep.",
        placement: "right",
        spotlightTarget: "#reca-review-signatures",
      },
    ],
    journeyStages: [
      ClientJourneyStage.FORM_FILLING,
      ClientJourneyStage.SUBMITTED,
    ],
  },
  {
    key: "reca-submission",
    title: "Submission process",
    description: "Explains what happens after you sign and submit.",
    triggerEvent: "FORM_SUBMITTED",
    targetPages: ["/portal/forms/reca/submission"],
    steps: [
      {
        id: "packet-generation",
        title: "Packet generation",
        content: "We compile the full PDF with exhibits so it’s DOJ-ready.",
        placement: "right",
        spotlightTarget: "#reca-packet-status",
      },
      {
        id: "attorney-review",
        title: "Attorney review",
        content:
          "Our legal team reviews the packet before mailing or e-filing.",
        placement: "right",
        spotlightTarget: "#attorney-review-status",
      },
      {
        id: "tracking",
        title: "Tracking & follow-up",
        content:
          "You’ll get updates when the DOJ receives it and if they need anything else.",
        placement: "right",
        spotlightTarget: "#submission-tracking-card",
        actions: [{ label: "Finish", action: "COMPLETE", variant: "primary" }],
      },
    ],
    journeyStages: [ClientJourneyStage.SUBMITTED],
  },
];

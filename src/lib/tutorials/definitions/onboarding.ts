import { ClientJourneyStage, TutorialDefinition } from "../types";

export const onboardingTutorials: TutorialDefinition[] = [
  {
    key: "onboarding-welcome",
    title: "Welcome to RadiantClaims",
    description: "Quick tour of the client portal and how to get help.",
    triggerEvent: "FIRST_LOGIN",
    targetPages: ["/portal"],
    steps: [
      {
        id: "welcome",
        title: "Welcome!",
        content:
          "Let’s take a 60-second tour so you always know what to do next.",
        placement: "center",
        spotlightTarget: null,
        actions: [
          { label: "Start Tour", action: "NEXT", variant: "primary" },
          { label: "Skip", action: "SKIP", variant: "ghost" },
        ],
      },
      {
        id: "claim-status",
        title: "Track your claim",
        content:
          "The dashboard shows live claim status, required tasks, and important dates.",
        placement: "bottom-right",
        spotlightTarget: "#claim-status-card",
        scrollTo: "#claim-status-card",
        actions: [
          { label: "Next", action: "NEXT", variant: "primary" },
          { label: "Back", action: "PREV" },
        ],
      },
      {
        id: "upload-documents",
        title: "Upload important documents",
        content:
          "Use this section anytime you need to submit proof, IDs, or medical records.",
        placement: "right",
        spotlightTarget: '[data-tutorial="upload-section"]',
        scrollTo: '[data-tutorial="upload-section"]',
        actions: [
          { label: "Next", action: "NEXT", variant: "primary" },
          { label: "Back", action: "PREV" },
        ],
      },
      {
        id: "sidebar",
        title: "Get help anytime",
        content:
          "Open the help sidebar for tutorials, FAQs, walkthroughs, or to contact support.",
        placement: "right",
        spotlightTarget: "#client-sidebar",
        actions: [{ label: "Finish", action: "COMPLETE", variant: "primary" }],
      },
    ],
    journeyStages: [ClientJourneyStage.NEW_USER, ClientJourneyStage.ONBOARDING],
    priority: 100,
  },
  {
    key: "account-setup",
    title: "Complete your account setup",
    description:
      "Guided steps for verifying info, enabling MFA, and customizing alerts.",
    triggerEvent: "FORM_STARTED",
    targetPages: ["/portal/settings"],
    steps: [
      {
        id: "verify-profile",
        title: "Verify your profile",
        content:
          "Double-check your contact information so we can reach you quickly.",
        placement: "right",
        spotlightTarget: "#profile-card",
        actions: [
          { label: "Next", action: "NEXT" },
          { label: "Skip", action: "SKIP", variant: "ghost" },
        ],
      },
      {
        id: "enable-mfa",
        title: "Secure your account",
        content:
          "Turn on multi-factor authentication to protect sensitive documents.",
        placement: "right",
        spotlightTarget: "#mfa-card",
        checklist: [
          "Download an authenticator app",
          "Scan the QR code",
          "Save backup codes",
        ],
        actions: [
          { label: "Next", action: "NEXT" },
          { label: "Back", action: "PREV" },
        ],
      },
      {
        id: "notification-preferences",
        title: "Choose notifications",
        content:
          "We’ll only nudge you when there is something important to do.",
        placement: "right",
        spotlightTarget: "#notification-card",
        actions: [
          { label: "Finish", action: "COMPLETE", variant: "primary" },
          { label: "Back", action: "PREV" },
        ],
      },
    ],
    journeyStages: [ClientJourneyStage.ONBOARDING],
    priority: 80,
  },
  {
    key: "first-document-upload",
    title: "Your first document upload",
    description:
      "Step-by-step walkthrough of uploading IDs or medical evidence.",
    triggerEvent: "UPLOAD_COMPLETE",
    targetPages: ["/portal/documents"],
    steps: [
      {
        id: "document-types",
        title: "Know what you need",
        content:
          "We’ll tell you exactly which document works best for each requirement.",
        placement: "left",
        spotlightTarget: "#document-required-list",
      },
      {
        id: "upload-flow",
        title: "Drag & drop or browse",
        content:
          "Use drag & drop, mobile upload links, or email to send documents.",
        placement: "right",
        spotlightTarget: "#document-uploader",
        actions: [
          { label: "Next", action: "NEXT" },
          { label: "Back", action: "PREV" },
        ],
      },
      {
        id: "status-tracking",
        title: "Track processing",
        content:
          "Each document shows when it’s processed, validated, or needs attention.",
        placement: "bottom-right",
        spotlightTarget: "#document-status-feed",
        actions: [
          { label: "Finish", action: "COMPLETE", variant: "primary" },
          { label: "Back", action: "PREV" },
        ],
      },
    ],
    journeyStages: [ClientJourneyStage.DOCUMENT_COLLECTION],
    priority: 60,
  },
  {
    key: "claim-status-orientation",
    title: "Understand claim status",
    description:
      "Learn how to read your claim timeline, milestones, and required tasks.",
    triggerEvent: "MANUAL",
    targetPages: ["/portal", "/portal/claim"],
    steps: [
      {
        id: "timeline",
        title: "Timeline overview",
        content:
          "Each milestone shows what RadiantClaims and DOJ are doing behind the scenes.",
        placement: "bottom-right",
        spotlightTarget: "#claim-timeline",
      },
      {
        id: "next-steps",
        title: "Your next steps",
        content:
          "Action cards appear here whenever we need information from you.",
        placement: "right",
        spotlightTarget: "#next-steps-card",
      },
      {
        id: "support",
        title: "Need help?",
        content:
          "Use live chat, schedule a call, or open the Help Center without leaving the page.",
        placement: "right",
        spotlightTarget: "#client-sidebar",
        actions: [{ label: "Finish", action: "COMPLETE", variant: "primary" }],
      },
    ],
    journeyStages: [
      ClientJourneyStage.FORM_FILLING,
      ClientJourneyStage.UNDER_REVIEW,
    ],
    priority: 50,
  },
];

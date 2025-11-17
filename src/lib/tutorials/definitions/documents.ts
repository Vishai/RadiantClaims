import { ClientJourneyStage, TutorialDefinition } from "../types";

export const documentTutorials: TutorialDefinition[] = [
  {
    key: "docs-upload-basics",
    title: "How to upload documents",
    description: "Covers supported formats, mobile uploads, and auto-tagging.",
    triggerEvent: "NEEDS_HELP",
    targetPages: ["/portal/documents"],
    steps: [
      {
        id: "supported-formats",
        title: "Supported formats",
        content:
          "PDF, JPG, PNG, and HEIC are supported. Each file can be up to 25 MB.",
        placement: "right",
        spotlightTarget: "#document-supported-formats",
      },
      {
        id: "upload-options",
        title: "Choose how to upload",
        content:
          "Drag & drop, browse files, or send from mobile using a secure upload link.",
        placement: "right",
        spotlightTarget: "#document-uploader",
      },
      {
        id: "smart-tagging",
        title: "Automatic sorting",
        content:
          "We auto-detect IDs, proof of residency, and medical evidence to speed review.",
        placement: "bottom-right",
        spotlightTarget: "#document-tag-grid",
        actions: [{ label: "Finish", action: "COMPLETE", variant: "primary" }],
      },
    ],
    journeyStages: [ClientJourneyStage.DOCUMENT_COLLECTION],
  },
  {
    key: "docs-requirements",
    title: "Document requirements",
    description: "Explains what qualifies as proof for each requirement.",
    triggerEvent: "MANUAL",
    targetPages: ["/portal/documents/requirements"],
    steps: [
      {
        id: "id-proof",
        title: "Identity proof",
        content:
          "Government-issued photo ID for the claimant or authorized representative.",
        placement: "right",
        spotlightTarget: "#requirement-id",
      },
      {
        id: "residency",
        title: "Residency evidence",
        content:
          "Utility bills, school records, tax forms, or sworn statements work best.",
        placement: "right",
        spotlightTarget: "#requirement-residency",
      },
      {
        id: "medical",
        title: "Medical or diagnosis proof",
        content:
          "Pathology reports, oncologist letters, or doctor notes that confirm diagnosis.",
        placement: "right",
        spotlightTarget: "#requirement-medical",
      },
    ],
    journeyStages: [ClientJourneyStage.DOCUMENT_COLLECTION],
  },
  {
    key: "docs-ai-analysis",
    title: "AI analysis explained",
    description: "Breaks down the AI validation process so results are clear.",
    triggerEvent: "UPLOAD_COMPLETE",
    targetPages: ["/portal/documents/review"],
    steps: [
      {
        id: "processing",
        title: "Processing queue",
        content:
          "Most documents finish in a few minutes. We notify you if we need anything else.",
        placement: "bottom-right",
        spotlightTarget: "#document-processing-queue",
      },
      {
        id: "ai-flags",
        title: "AI flags",
        content:
          "Yellow flags highlight areas for you or our team to double-check.",
        placement: "right",
        spotlightTarget: "#ai-flags-panel",
      },
      {
        id: "resolve-flags",
        title: "Resolve issues",
        content:
          "Follow the recommended fix or ask for human help straight from the flag.",
        placement: "right",
        spotlightTarget: "#flag-resolution-actions",
      },
    ],
    journeyStages: [
      ClientJourneyStage.DOCUMENT_COLLECTION,
      ClientJourneyStage.FORM_FILLING,
    ],
  },
  {
    key: "docs-categorization",
    title: "Document categorization",
    description:
      "Shows how to keep uploads organized for faster attorney review.",
    triggerEvent: "MANUAL",
    targetPages: ["/portal/documents"],
    steps: [
      {
        id: "categories",
        title: "Categories",
        content:
          "Group files by exposure, diagnosis, identification, and supporting affidavits.",
        placement: "right",
        spotlightTarget: "#document-category-tabs",
      },
      {
        id: "bulk-actions",
        title: "Bulk actions",
        content:
          "Select multiple files to re-label, download, or share with your attorney.",
        placement: "right",
        spotlightTarget: "#document-bulk-actions",
      },
      {
        id: "share",
        title: "Share securely",
        content:
          "Share a time-limited link with supporting staff while keeping data protected.",
        placement: "right",
        spotlightTarget: "#document-share-card",
      },
    ],
    journeyStages: [
      ClientJourneyStage.DOCUMENT_COLLECTION,
      ClientJourneyStage.UNDER_REVIEW,
    ],
  },
];

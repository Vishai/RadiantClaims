import { HelpIntensity, TutorialStatus, UserRole } from "@prisma/client";

export type TutorialTriggerEvent =
  | "FIRST_LOGIN"
  | "UPLOAD_COMPLETE"
  | "FORM_STARTED"
  | "FORM_RESUMED"
  | "FORM_SUBMITTED"
  | "NEEDS_HELP"
  | "MANUAL";

export type TutorialActionType =
  | "NEXT"
  | "PREV"
  | "SKIP"
  | "COMPLETE"
  | "LAUNCH";

export interface TutorialActionConfig {
  label: string;
  action: TutorialActionType;
  payload?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export interface TutorialMedia {
  type: "image" | "video" | "lottie";
  src: string;
  alt?: string;
}

export interface TutorialStepDefinition {
  id: string;
  title: string;
  content: string;
  description?: string;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center"
    | "bottom-right"
    | "bottom-left";
  spotlightTarget?: string | null;
  scrollTo?: string | null;
  tooltipId?: string;
  actions?: TutorialActionConfig[];
  media?: TutorialMedia;
  checklist?: string[];
}

export interface TutorialDefinition {
  key: string;
  title: string;
  description?: string;
  targetRole?: UserRole;
  targetPages?: string[];
  triggerEvent?: TutorialTriggerEvent;
  steps: TutorialStepDefinition[];
  isRequired?: boolean;
  priority?: number;
  isActive?: boolean;
  journeyStages?: ClientJourneyStage[];
  tags?: string[];
}

export interface TutorialSummary extends TutorialDefinition {
  status?: TutorialStatus;
  currentStep?: number;
  totalSteps?: number;
  lastViewedAt?: string | null;
}

export interface TutorialProgressRecord {
  tutorialKey: string;
  title: string;
  status: TutorialStatus;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string | null;
  skippedAt?: string | null;
}

export interface TutorialPreferenceSettings {
  tooltipsEnabled: boolean;
  walkthroughsEnabled: boolean;
  helpIntensity: HelpIntensity;
  pageDismissals: Record<string, PageDismissalState>;
  updatedAt?: string;
}

export interface PageDismissalState {
  dismissed?: boolean;
  snoozedUntil?: string | null;
  dismissedAt?: string | null;
}

export interface TooltipConfig {
  id: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  dismissible?: boolean;
  snoozeDuration?: number; // days
  delay?: number; // ms
}

export interface TooltipRuntimeState {
  lastShownAt?: string;
  snoozedUntil?: string;
  dismissed?: boolean;
}

export interface WalkthroughStepRuntime {
  id: string;
  completed: boolean;
  viewedAt?: string;
}

export interface WalkthroughRuntimeState {
  tutorialKey: string;
  currentStepIndex: number;
  steps: WalkthroughStepRuntime[];
  status: TutorialStatus;
}

export enum ClientJourneyStage {
  NEW_USER = "NEW_USER",
  ONBOARDING = "ONBOARDING",
  DOCUMENT_COLLECTION = "DOCUMENT_COLLECTION",
  FORM_FILLING = "FORM_FILLING",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
}

export interface TutorialAnalyticsEvent {
  type:
    | "TUTORIAL_STARTED"
    | "TUTORIAL_COMPLETED"
    | "TUTORIAL_SKIPPED"
    | "STEP_VIEWED"
    | "STEP_COMPLETED"
    | "SIDEBAR_OPENED"
    | "TOOLTIP_DISMISSED";
  tutorialKey: string;
  userId: string;
  stepIndex?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface TutorialRecommendation {
  stage: ClientJourneyStage;
  tutorialKeys: string[];
  message?: string;
}

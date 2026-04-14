"use client";

import type { Route } from "next";
import {
  ClipboardList,
  CheckCircle,
  ExternalLink,
  FileText,
  MessageSquareText,
  Puzzle,
} from "lucide-react";
import Link from "next/link";

const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/kdbankgnojlkljikngcmcfopiakkdmhe";

export type JourneyStep = "prepare" | "file" | "track";

interface FilingJourneyTrackerProps {
  /** 0-100, overall form completion */
  formPercent: number;
  /** Current section key (e.g., "part_8"), or null if not started */
  currentSection: string | null;
  /** Number of documents uploaded by the user */
  uploadedDocs: number;
  /** Estimated number of required documents for this claimant's path */
  requiredDocs: number;
  /** True when the DOJ packet has been generated and is ready to download */
  packetReady: boolean;
  /** True when the user has marked the claim as submitted to DOJ */
  claimSubmitted: boolean;
  /** Primary CTA destination for Step 1 (form or review, depending on state) */
  continueHref: string;
  /** Label for the primary CTA (e.g., "Continue Form", "Review Application") */
  continueLabel: string;
}

const PART_LABELS: Record<string, string> = {
  part_1: "Filer Info",
  part_2: "Deceased Info",
  part_3: "Relationship",
  part_4: "Self-Filer",
  part_5: "Surviving Spouse",
  part_6: "Surviving Child",
  part_7: "Other Relatives",
  part_8: "Exposure Info",
  part_9: "Proof of Presence",
  part_10: "Diseases",
  part_11: "Proof of Disease",
  part_12: "Previous Payments",
  part_13: "Attorney",
  part_14: "Attorney Ack.",
  part_15: "Legal Guardian",
  part_16: "Signature",
};

function getPartLabel(section: string | null): string | null {
  if (!section) return null;
  return PART_LABELS[section] ?? null;
}

/**
 * Determine which of the 3 journey steps is currently active.
 *
 * - prepare: form incomplete OR docs not all uploaded OR packet not ready
 * - file:    everything prepared, waiting for user to file on DOJ.gov
 * - track:   user has marked the claim as submitted
 */
function getActiveStep(
  formPercent: number,
  uploadedDocs: number,
  requiredDocs: number,
  packetReady: boolean,
  claimSubmitted: boolean
): JourneyStep {
  if (claimSubmitted) return "track";
  const docsDone = requiredDocs === 0 || uploadedDocs >= requiredDocs;
  if (formPercent >= 100 && docsDone && packetReady) return "file";
  return "prepare";
}

export function FilingJourneyTracker({
  formPercent,
  currentSection,
  uploadedDocs,
  requiredDocs,
  packetReady,
  claimSubmitted,
  continueHref,
  continueLabel,
}: FilingJourneyTrackerProps) {
  const activeStep = getActiveStep(
    formPercent,
    uploadedDocs,
    requiredDocs,
    packetReady,
    claimSubmitted
  );

  const prepareActive = activeStep === "prepare";
  const fileActive = activeStep === "file";
  const trackActive = activeStep === "track";

  const prepareComplete = !prepareActive;
  const fileComplete = trackActive;

  const partLabel = getPartLabel(currentSection);
  const docsPercent =
    requiredDocs > 0
      ? Math.min(100, Math.round((uploadedDocs / requiredDocs) * 100))
      : 0;

  return (
    <div className="rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-white to-cream-50 p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-base font-semibold text-sage-900">
          Your Filing Journey
        </h3>
        <span className="text-xs font-medium uppercase tracking-wider text-sage-500">
          {activeStep === "prepare" && "Step 1 of 3"}
          {activeStep === "file" && "Step 2 of 3"}
          {activeStep === "track" && "Step 3 of 3"}
        </span>
      </div>
      <p className="mb-5 text-xs text-sage-600">
        RadiantClaims helps you prepare. The actual filing happens on the
        DOJ&apos;s official website.
      </p>

      {/* 3-step visual */}
      <div className="mb-5 flex items-start gap-2 sm:gap-4">
        {/* Step 1: Prepare */}
        <StepIndicator
          number={1}
          label="Prepare Here"
          icon={FileText}
          state={
            prepareComplete ? "complete" : prepareActive ? "active" : "locked"
          }
          activeColor="sage"
        />
        <StepConnector complete={prepareComplete} />

        {/* Step 2: File */}
        <StepIndicator
          number={2}
          label="File on DOJ.gov"
          icon={Puzzle}
          state={fileComplete ? "complete" : fileActive ? "active" : "locked"}
          activeColor="purple"
        />
        <StepConnector complete={fileComplete} />

        {/* Step 3: Track */}
        <StepIndicator
          number={3}
          label="Track Claim"
          icon={CheckCircle}
          state={trackActive ? "active" : "locked"}
          activeColor="terracotta"
        />
      </div>

      {/* Active step detail panel */}
      {prepareActive && (
        <div className="rounded-2xl border border-sage-200 bg-white p-4">
          {/* Progress */}
          <div className="mb-3 space-y-2">
            {/* Form sub-progress */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-sage-700">Form</span>
                <span className="font-semibold text-sage-900">
                  {formPercent}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage-100">
                <div
                  className="h-full rounded-full bg-sage-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, formPercent))}%`,
                  }}
                />
              </div>
            </div>

            {/* Docs sub-progress */}
            {requiredDocs > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-sage-700">Documents</span>
                  <span className="font-semibold text-sage-900">
                    {uploadedDocs}/{requiredDocs}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${docsPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {partLabel && formPercent < 100 && (
            <p className="mb-3 text-xs text-sage-600">
              You&apos;re on Part {currentSection?.replace("part_", "")} —{" "}
              {partLabel}
            </p>
          )}

          <Link
            href={continueHref as Route}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
          >
            {continueLabel} →
          </Link>

          {/* Included-in-your-journey reminder (not a pitch — they're already in) */}
          <div className="mt-5 border-t border-cream-200 pt-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-sage-500">
              What&apos;s included in your prep
            </p>

            <ul className="space-y-2.5">
              <ValueProp
                icon={ClipboardList}
                title="Personalized document checklist"
                body="Tailored to your state, relationship, and disease — no generic list to decipher."
                tone="sage"
              />
              <ValueProp
                icon={Puzzle}
                title="Chrome extension fills forms &amp; routes documents"
                body="Auto-fills justice.gov and tells you which document goes in which tab."
                tone="purple"
              />
              <ValueProp
                icon={MessageSquareText}
                title="Plain-English questions, save &amp; resume"
                body="DOJ legalese translated. Pick up right where you left off."
                tone="terracotta"
              />
            </ul>

            {/* Persistent Chrome extension install button */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-purple-100 p-1.5">
                  <Puzzle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    Install the Filing Assistant now
                  </p>
                  <p className="text-xs text-purple-700">
                    30 seconds — it&apos;ll be ready when you file
                  </p>
                </div>
              </div>
              <a
                href={CHROME_EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Install
              </a>
            </div>
          </div>
        </div>
      )}

      {fileActive && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-sage-900">
              Your preparation is complete
            </span>
          </div>
          <p className="mb-3 text-xs text-sage-700">
            Next: file on the DOJ&apos;s official website. Our Chrome extension
            auto-fills your data so you don&apos;t have to retype anything.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={CHROME_EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Install Chrome Extension
            </a>
            <Link
              href={continueHref as Route}
              className="inline-flex items-center rounded-full border-2 border-sage-300 px-5 py-2.5 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-50"
            >
              {continueLabel}
            </Link>
          </div>
        </div>
      )}

      {trackActive && (
        <div className="rounded-2xl border border-terracotta-200 bg-terracotta-50/60 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-terracotta-600" />
            <span className="text-sm font-semibold text-sage-900">
              Filed with DOJ
            </span>
          </div>
          <p className="text-xs text-sage-700">
            Track your claim status and record your DOJ claim number below.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Internal components
// ============================================================================

type StepState = "locked" | "active" | "complete";
type StepColor = "sage" | "purple" | "terracotta";

const COLOR_CLASSES: Record<
  StepColor,
  {
    active: { circle: string; label: string };
    complete: { circle: string; label: string };
  }
> = {
  sage: {
    active: {
      circle: "border-sage-500 bg-sage-500 text-white shadow-md",
      label: "text-sage-800 font-semibold",
    },
    complete: {
      circle: "border-sage-500 bg-sage-100 text-sage-600",
      label: "text-sage-600",
    },
  },
  purple: {
    active: {
      circle:
        "border-purple-500 bg-purple-500 text-white shadow-md animate-pulse",
      label: "text-purple-800 font-semibold",
    },
    complete: {
      circle: "border-purple-500 bg-purple-100 text-purple-600",
      label: "text-purple-600",
    },
  },
  terracotta: {
    active: {
      circle: "border-terracotta-500 bg-terracotta-500 text-white shadow-md",
      label: "text-terracotta-800 font-semibold",
    },
    complete: {
      circle: "border-terracotta-500 bg-terracotta-100 text-terracotta-600",
      label: "text-terracotta-600",
    },
  },
};

function StepIndicator({
  number,
  label,
  icon: Icon,
  state,
  activeColor,
}: {
  number: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  state: StepState;
  activeColor: StepColor;
}) {
  const colors = COLOR_CLASSES[activeColor];
  let circleClass = "border-cream-300 bg-white text-sage-300";
  let labelClass = "text-sage-400";

  if (state === "active") {
    circleClass = colors.active.circle;
    labelClass = colors.active.label;
  } else if (state === "complete") {
    circleClass = colors.complete.circle;
    labelClass = colors.complete.label;
  }

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${circleClass}`}
        aria-label={`Step ${number}: ${label} (${state})`}
      >
        {state === "complete" ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <p className={`mt-2 text-xs leading-tight ${labelClass}`}>{label}</p>
    </div>
  );
}

function StepConnector({ complete }: { complete: boolean }) {
  return (
    <div className="mt-5 h-0.5 flex-1 self-start">
      <div
        className={`h-full w-full ${
          complete ? "bg-sage-400" : "border-t-2 border-dashed border-cream-300"
        }`}
      />
    </div>
  );
}

// ============================================================================
// ValueProp — single row in the "why use us" strip
// ============================================================================

type ValuePropTone = "sage" | "purple" | "terracotta";

const VALUE_PROP_TONES: Record<
  ValuePropTone,
  { iconBg: string; iconFg: string }
> = {
  sage: { iconBg: "bg-sage-100", iconFg: "text-sage-700" },
  purple: { iconBg: "bg-purple-100", iconFg: "text-purple-700" },
  terracotta: {
    iconBg: "bg-terracotta-100",
    iconFg: "text-terracotta-700",
  },
};

function ValueProp({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: ValuePropTone;
}) {
  const toneClasses = VALUE_PROP_TONES[tone];
  return (
    <li className="flex items-start gap-3">
      <div className={`flex-shrink-0 rounded-lg p-1.5 ${toneClasses.iconBg}`}>
        <Icon className={`h-4 w-4 ${toneClasses.iconFg}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-sage-900">{title}</p>
        <p className="text-xs leading-relaxed text-sage-600">{body}</p>
      </div>
    </li>
  );
}

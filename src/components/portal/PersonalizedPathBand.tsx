"use client";

import type { Route } from "next";
import { CheckCircle, Clock, FileText, Puzzle, Upload } from "lucide-react";
import Link from "next/link";
import type { RelationshipType } from "@/lib/reca/types";

const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/kdbankgnojlkljikngcmcfopiakkdmhe";

interface PersonalizedPathBandProps {
  /** The claimant's confirmed relationship (eligibility has passed) */
  relationship: RelationshipType;
  /** Number of form sections still ahead of the user */
  remainingSections: number;
  /** Rough minutes to finish the form */
  estimatedMinutesLeft: number;
  /** Total documents this claimant's path requires */
  requiredDocs: number;
  /** Number of documents the user has already uploaded */
  uploadedDocs: number;
  /** Href to continue the form */
  continueFormHref: string;
  /** Href to the session-scoped documents page */
  documentsHref: string;
}

/**
 * Post-eligibility roadmap band. Shown once the user has cleared Part 6
 * (eligibility gate) and has a confirmed relationship, until the form is
 * complete. Explains *why* the order matters (form -> docs -> file) so the
 * user isn't confused about why they're answering questions before gathering
 * paperwork.
 */
export function PersonalizedPathBand({
  relationship,
  remainingSections,
  estimatedMinutesLeft,
  requiredDocs,
  uploadedDocs,
  continueFormHref,
  documentsHref,
}: PersonalizedPathBandProps) {
  const docsRemaining = Math.max(requiredDocs - uploadedDocs, 0);

  return (
    <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
      {/* Eligibility confirmation header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-sage-900">
            You&apos;re eligible. Here&apos;s what&apos;s ahead for you.
          </h3>
          <p className="text-xs text-sage-600">
            Filing as{" "}
            <span className="font-semibold text-emerald-700">
              {relationshipLabel(relationship)}
            </span>{" "}
            — we&apos;ve tailored your path based on your answers.
          </p>
        </div>
      </div>

      {/* Personalized checklist */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <RoadmapTile
          icon={FileText}
          label="Form sections left"
          value={remainingSections > 0 ? `${remainingSections}` : "All done ✓"}
          sublabel={
            remainingSections > 0
              ? `~${estimatedMinutesLeft} min`
              : "Ready to review"
          }
          tone="terracotta"
        />
        <RoadmapTile
          icon={Upload}
          label="Documents to gather"
          value={
            requiredDocs === 0
              ? "—"
              : docsRemaining > 0
                ? `${docsRemaining} left`
                : "All uploaded ✓"
          }
          sublabel={
            requiredDocs > 0
              ? `${uploadedDocs} of ${requiredDocs} uploaded`
              : "Set once form is done"
          }
          tone="emerald"
        />
        <RoadmapTile
          icon={Puzzle}
          label="Chrome extension"
          value="Install now"
          sublabel="Auto-fills DOJ at filing time"
          tone="purple"
        />
      </div>

      {/* Why this order — the one piece of inline education */}
      <div className="mb-4 rounded-2xl border border-sage-200 bg-white p-4">
        <div className="mb-1 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-sage-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-sage-600">
            Why this order
          </span>
        </div>
        <p className="text-sm leading-relaxed text-sage-700">
          <strong>Finish the form first</strong> — it sets your exact document
          list based on your relationship, state, and diseases. Then gather
          documents. Then file on DOJ.gov with the Chrome extension. Doing it in
          this order means you won&apos;t chase paperwork you don&apos;t
          actually need.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={continueFormHref as Route}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
        >
          Continue Form →
        </Link>
        <Link
          href={documentsHref as Route}
          className="inline-flex items-center gap-2 rounded-full border-2 border-sage-300 px-5 py-2.5 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-50"
        >
          See document list
        </Link>
        <a
          href={CHROME_EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border-2 border-purple-300 px-5 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50"
        >
          Install extension
        </a>
      </div>
    </div>
  );
}

function relationshipLabel(relationship: RelationshipType): string {
  switch (relationship) {
    case "Self":
      return "the claimant (self)";
    case "Spouse":
      return "a surviving spouse";
    case "Child":
      return "a surviving child";
    case "Parent":
      return "a surviving parent";
    case "Grandchild":
      return "a surviving grandchild";
    case "Grandparent":
      return "a surviving grandparent";
    default:
      return relationship;
  }
}

type Tone = "terracotta" | "emerald" | "purple";

const TONE_CLASSES: Record<
  Tone,
  { bg: string; iconBg: string; iconFg: string }
> = {
  terracotta: {
    bg: "border-terracotta-200 bg-terracotta-50/40",
    iconBg: "bg-terracotta-100",
    iconFg: "text-terracotta-600",
  },
  emerald: {
    bg: "border-emerald-200 bg-emerald-50/40",
    iconBg: "bg-emerald-100",
    iconFg: "text-emerald-600",
  },
  purple: {
    bg: "border-purple-200 bg-purple-50/40",
    iconBg: "bg-purple-100",
    iconFg: "text-purple-600",
  },
};

function RoadmapTile({
  icon: Icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
  tone: Tone;
}) {
  const classes = TONE_CLASSES[tone];
  return (
    <div className={`rounded-2xl border p-3 ${classes.bg}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${classes.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${classes.iconFg}`} />
        </div>
        <span className="text-xs font-medium text-sage-700">{label}</span>
      </div>
      <div className="text-lg font-semibold text-sage-900">{value}</div>
      <div className="text-xs text-sage-600">{sublabel}</div>
    </div>
  );
}

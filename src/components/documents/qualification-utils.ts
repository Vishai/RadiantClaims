import type { DocumentQualificationStatus } from "./types";

export interface QualificationCopy {
  icon: string;
  label: string;
  className: string;
  description: string;
}

export const QUALIFICATION_COPY: Record<
  DocumentQualificationStatus,
  QualificationCopy
> = {
  QUALIFIES: {
    icon: "🟢",
    label: "Counts Toward Claim",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    description: "Ready for DOJ submission",
  },
  SUPPORTING: {
    icon: "🟡",
    label: "Supporting Only",
    className: "border-blue-300 bg-blue-50 text-blue-800",
    description: "Helpful but not required",
  },
  DOES_NOT_QUALIFY: {
    icon: "🔴",
    label: "Does Not Count",
    className: "border-red-300 bg-red-50 text-red-800",
    description: "Fix or replace this upload",
  },
  UNKNOWN: {
    icon: "⚪",
    label: "Analyzing...",
    className: "border-slate-300 bg-slate-50 text-slate-700",
    description: "AI still working",
  },
};

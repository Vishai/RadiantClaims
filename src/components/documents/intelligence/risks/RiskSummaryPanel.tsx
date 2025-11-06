import { contributionConfig } from "./helpers";
import type { DocumentRiskSummary } from "./useDocumentRiskData";

interface RiskSummaryPanelProps {
  summary: DocumentRiskSummary;
  lastAnalyzedAt?: string;
}

export function RiskSummaryPanel({
  summary,
  lastAnalyzedAt,
}: RiskSummaryPanelProps) {
  const contributionMeta = contributionConfig[summary.contribution];

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Document Risk Overview</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Focuses exclusively on risks tied to this document&apos;s
            authenticity and validity.
          </p>
          {lastAnalyzedAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Last analyzed {lastAnalyzedAt}
            </p>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${contributionMeta.badgeClass}`}
        >
          {contributionMeta.label}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${summary.riskScore * 2.51} 251`}
              className={summary.riskLevel.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${summary.riskLevel.color}`}>
              {summary.riskScore}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-2xl font-bold ${summary.riskLevel.color}`}>
            {summary.riskLevel.label}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <SeverityCard
              label="High"
              value={summary.bySeverity.high}
              accent="text-red-500"
            />
            <SeverityCard
              label="Medium"
              value={summary.bySeverity.medium}
              accent="text-amber-500"
            />
            <SeverityCard
              label="Low"
              value={summary.bySeverity.low}
              accent="text-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

import type { DocumentRiskSummary } from "./useDocumentRiskData";

interface RiskWorkflowSummaryProps {
  summary: DocumentRiskSummary;
}

export function RiskWorkflowSummary({ summary }: RiskWorkflowSummaryProps) {
  const metrics = [
    {
      key: "blocking",
      label: "Blocking Risks",
      value: summary.blocking,
      description: "Need clear resolution or dismissal.",
      accentClass: "text-red-500",
    },
    {
      key: "advisory",
      label: "Advisory Flags",
      value: summary.advisory,
      description: "Explain or acknowledge when appropriate.",
      accentClass: "text-amber-500",
    },
    {
      key: "pending",
      label: "Pending Review",
      value: summary.pendingReview,
      description: "Waiting for reviewer confirmation.",
      accentClass: "text-blue-500",
    },
    {
      key: "claimant",
      label: "Waiting On You",
      value: summary.awaitingClaimant,
      description: "Your clarification or evidence is needed.",
      accentClass: "text-emerald-500",
    },
    {
      key: "system",
      label: "System Follow-Up",
      value: summary.awaitingSystem,
      description: "Automatic checks still running.",
      accentClass: "text-purple-500",
    },
    {
      key: "acknowledged",
      label: "Acknowledged",
      value: summary.acknowledged,
      description: "Advisory items you have noted.",
      accentClass: "text-slate-500",
    },
  ];

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-lg font-semibold">Risk Workflow Snapshot</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-md border border-dashed bg-muted/30 p-4"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${metric.accentClass}`}>
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

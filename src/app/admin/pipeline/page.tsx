"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Bucket {
  label: string;
  count: number;
}

interface PipelineMetrics {
  days: number;
  documents: number;
  legacyDocuments: number;
  pages: number;
  tierMix: { tier: string; pages: number }[];
  escalatedPages: number;
  ocrCostUsd: number;
  ocrConfidence: Bucket[];
  extractionConfidence: Bucket[];
  review: {
    filings: number;
    filingsInReview: number;
    filingShare: number;
    documents: number;
    documentsInReview: number;
    reasons: Record<string, number>;
  };
}

const TIER_LABELS: Record<string, string> = {
  pdfjs: "Tier 1 · pdfjs text layer (free)",
  tesseract: "Tier 2 · Tesseract (free)",
  "google-vision": "Tier 3 · Google Cloud Vision",
  "aws-textract": "Tier 4 · AWS Textract",
  none: "No tier passed",
};

const REASON_LABELS: Record<string, string> = {
  LOW_OCR_CONFIDENCE: "Low OCR confidence",
  LOW_EXTRACTION_CONFIDENCE: "Low extraction confidence",
  CATEGORY_MISMATCH_HIGH_CONFIDENCE: "Category mismatch",
  UNCLASSIFIED: "Couldn't classify",
};

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[220px_1fr_48px] items-center gap-3 text-sm"
        >
          <span className="text-gray-600">{r.label}</span>
          <div className="h-3 rounded bg-gray-100">
            <div
              className="h-3 rounded bg-blue-500"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right tabular-nums text-gray-900">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default function PipelineMetricsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PipelineMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`/api/admin/pipeline-metrics?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Couldn't load metrics (${res.status})`);
        setData(await res.json());
      })
      .catch((err) => setError(err.message));
  }, [days]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Document pipeline
          </h1>
          <p className="text-sm text-gray-600">
            Which OCR tier each page lands on, how confident each hop was, and
            how much goes to staff review.
          </p>
        </div>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Stat
              label="Pages processed"
              value={String(data.pages)}
              note={`${data.documents} documents`}
            />
            <Stat
              label="Pages that escalated"
              value={
                data.pages
                  ? `${Math.round((data.escalatedPages / data.pages) * 100)}%`
                  : "–"
              }
              note={`${data.escalatedPages} past tier 1`}
            />
            <Stat
              label="Paid OCR spend"
              value={`$${data.ocrCostUsd.toFixed(4)}`}
              note="Vision + Textract calls"
            />
            <Stat
              label="Filings routed to review"
              value={
                data.review.filings
                  ? `${Math.round(data.review.filingShare * 100)}%`
                  : "–"
              }
              note={`${data.review.filingsInReview} of ${data.review.filings} filings`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tier mix (the OCR cost)</CardTitle>
              <CardDescription>
                Every page starts on the free tier and escalates only when
                confidence falls short.
                {data.legacyDocuments > 0 &&
                  ` ${data.legacyDocuments} documents were processed before per-page tracking.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bars
                rows={data.tierMix.map((t) => ({
                  label: TIER_LABELS[t.tier] ?? t.tier,
                  value: t.pages,
                }))}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>OCR confidence (per page)</CardTitle>
                <CardDescription>
                  Below 60% the document goes to review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Bars
                  rows={data.ocrConfidence.map((b) => ({
                    label: b.label,
                    value: b.count,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Extraction confidence (per document)</CardTitle>
                <CardDescription>
                  Lowest of the classifier and validation agent; below 70% it
                  goes to review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Bars
                  rows={data.extractionConfidence.map((b) => ({
                    label: b.label,
                    value: b.count,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why documents went to review</CardTitle>
              <CardDescription>
                {data.review.documentsInReview} of {data.review.documents}{" "}
                documents. The rules engine never takes a model&apos;s word on
                eligibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bars
                rows={Object.entries(data.review.reasons).map(([code, n]) => ({
                  label: REASON_LABELS[code] ?? code,
                  value: n,
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

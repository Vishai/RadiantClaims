"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  FileArchive,
  ListChecks,
  CheckCircle,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { trackClaimFiled } from "@/lib/analytics/meta-pixel";

type UploadedFile = {
  id: string;
  originalFilename: string;
  category?: string | null;
  status: string;
  sizeBytes: number;
  uploadedAt: string;
};

interface DOJSubmissionCardProps {
  packetReady?: boolean;
  onDownloadPacket?: () => void;
  isDownloading?: boolean;
  uploadedFiles?: UploadedFile[];
  claimantId?: string;
  /** If already submitted, show the claim number */
  existingDojClaimNumber?: string | null;
  existingSubmittedAt?: string | null;
  onMarkedAsSubmitted?: () => void;
}

const DOJ_PORTAL_URL = "https://reca.justice.gov/";

export function DOJSubmissionCard({
  packetReady = false,
  onDownloadPacket,
  isDownloading = false,
  uploadedFiles = [],
  claimantId,
  existingDojClaimNumber,
  existingSubmittedAt,
  onMarkedAsSubmitted,
}: DOJSubmissionCardProps) {
  const [showSubmitFlow, setShowSubmitFlow] = useState(false);
  const [dojClaimNumber, setDojClaimNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(!!existingDojClaimNumber);

  const docNames = uploadedFiles
    .filter((f) => (f.status ?? "").toUpperCase() !== "REJECTED")
    .map((f) => ({
      name: f.originalFilename ?? f.id,
      category: f.category ?? "Uncategorized",
    }))
    .slice(0, 12);

  const remaining = Math.max(
    0,
    uploadedFiles.filter((f) => (f.status ?? "").toUpperCase() !== "REJECTED")
      .length - docNames.length
  );

  const handleMarkAsSubmitted = async () => {
    if (!claimantId) return;

    try {
      setSaving(true);
      setError(null);

      const body: Record<string, string> = {};
      if (dojClaimNumber.trim()) {
        body.dojClaimNumber = dojClaimNumber.trim();
      }
      body.receivedByDOJAt = new Date().toISOString();

      // If we have a claim number, save it via the API
      if (dojClaimNumber.trim()) {
        const response = await fetch(
          `/api/claims/${claimantId}/doj-claim-number`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save claim number");
        }
      }

      setSubmitted(true);
      // Fire ClaimFiled custom event for Meta funnel optimization.
      // Users file via the justice.gov portal (often with our Chrome
      // extension), so the method is e-file.
      trackClaimFiled("e-file");
      onMarkedAsSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Already submitted state ──
  if (submitted || existingDojClaimNumber) {
    return (
      <Card className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">
                Claim Submitted to DOJ
              </p>
              {(existingDojClaimNumber || dojClaimNumber) && (
                <p className="font-mono text-lg font-bold text-green-800">
                  {existingDojClaimNumber || dojClaimNumber}
                </p>
              )}
              {existingSubmittedAt && (
                <p className="text-xs text-green-700">
                  Submitted{" "}
                  {new Date(existingSubmittedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-white/70 p-3 text-sm text-green-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <PartyPopper className="h-4 w-4" />
              What happens next
            </div>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                DOJ will send an acknowledgement letter by mail with your
                official RECA claim number
              </li>
              <li>
                Processing times vary — check{" "}
                <a
                  href="https://www.justice.gov/civil/reca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  justice.gov/civil/reca
                </a>{" "}
                for updates
              </li>
              <li>
                DOJ may request original/certified copies of documents you
                uploaded
              </li>
              <li>Keep this page bookmarked to track your claim status</li>
            </ul>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-green-300 text-green-800 hover:bg-green-50"
            onClick={() =>
              window.open(DOJ_PORTAL_URL, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4" />
            Check Status on DOJ Portal
          </Button>
        </div>
      </Card>
    );
  }

  // ── Pre-submission state ──
  return (
    <Card className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-700">
              DOJ E-file Handoff
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">New</Badge>
              <span className="text-sm font-semibold text-blue-900">
                Submit your claim online (recommended)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="gap-2 rounded-full"
              onClick={onDownloadPacket}
              disabled={!packetReady || !onDownloadPacket || isDownloading}
            >
              <FileArchive className="h-4 w-4" />
              {isDownloading ? "Preparing…" : "Download Upload Packet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full border-blue-300 text-blue-800 hover:bg-blue-50"
              onClick={() =>
                window.open(DOJ_PORTAL_URL, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4" />
              Open DOJ Portal
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white/70 p-3 text-sm text-blue-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4" />
            What to do (2 minutes)
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-blue-900">
            <li>
              Use the <strong>Answer Sheet</strong> above to copy your data into
              the DOJ portal fields.
            </li>
            <li>
              Upload your supporting documents to the matching portal tabs.
            </li>
            <li>
              Review everything and click <strong>"Submit My Claim"</strong> in
              the DOJ portal.
            </li>
            <li>Come back here and mark your claim as submitted below.</li>
          </ol>
        </div>

        {/* Document list */}
        <div className="rounded-xl border border-blue-200 bg-white/70 p-3">
          <p className="mb-2 text-sm font-semibold text-blue-900">
            Your upload set (from this claim)
          </p>
          {uploadedFiles.length === 0 ? (
            <p className="text-sm text-blue-800">
              No supporting documents uploaded yet.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-blue-900">
              {docNames.map((doc) => (
                <li key={`${doc.category}-${doc.name}`}>
                  • {doc.name}{" "}
                  <span className="text-xs text-blue-700">
                    ({doc.category})
                  </span>
                </li>
              ))}
              {remaining > 0 && (
                <li className="text-xs text-blue-700">…and {remaining} more</li>
              )}
            </ul>
          )}
        </div>

        {/* Mark as Submitted flow */}
        {!showSubmitFlow ? (
          <Button
            variant="outline"
            className="gap-2 rounded-full border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
            onClick={() => setShowSubmitFlow(true)}
          >
            <CheckCircle className="h-4 w-4" />
            I've submitted my claim on the DOJ portal
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50/50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Great! Let's record your submission.
            </p>

            <div className="space-y-1.5">
              <Label
                htmlFor="doj-claim-number"
                className="text-sm text-green-900"
              >
                DOJ Claim Number{" "}
                <span className="text-xs font-normal text-green-700">
                  (optional — you can add this later when DOJ sends it)
                </span>
              </Label>
              <Input
                id="doj-claim-number"
                value={dojClaimNumber}
                onChange={(e) => setDojClaimNumber(e.target.value)}
                placeholder="e.g., 00007390"
                className="rounded-lg border-green-300"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setShowSubmitFlow(false);
                  setError(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-2 rounded-full bg-green-600 hover:bg-green-700"
                onClick={handleMarkAsSubmitted}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Submission
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

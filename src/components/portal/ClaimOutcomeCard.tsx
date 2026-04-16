"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackClaimOutcome } from "@/lib/analytics/meta-pixel";

/**
 * ClaimOutcomeCard — portal UI for a claimant to self-report what
 * happened after they filed their RECA claim with the DOJ.
 *
 * Rendered conditionally inside ClaimSummaryCard (only when
 * intakeSession.status === "SUBMITTED"). Data is fetched lazily on
 * mount and persisted via PUT /api/claims/[claimantId]/outcome.
 *
 * Write-side pixel event: trackClaimOutcome — the exact award amount
 * is stored server-side but only a bucketed range is sent to Meta.
 *
 * See `docs/CAMPAIGN_PLAYBOOK.md` §10 for the strategic context.
 */

type OutcomeKind = "AWARDED" | "DENIED" | "WITHDRAWN" | "PENDING";
type PaidMethod = "CHECK" | "DIRECT_DEPOSIT" | "WIRE" | "OTHER";

interface OutcomeRecord {
  id: string;
  outcome: OutcomeKind;
  awardAmount: number | null;
  awardReceivedAt: string | null;
  paidMethod: PaidMethod | null;
  denialReason: string | null;
  appealed: boolean;
  selfReportedAt: string | null;
  updatedAt: string;
}

interface ClaimOutcomeCardProps {
  claimantId: string;
  claimantName: string;
}

type EditMode = null | "AWARDED" | "DENIED" | "PENDING";

export function ClaimOutcomeCard({
  claimantId,
  claimantName,
}: ClaimOutcomeCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeRecord | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);

  // Form state for the three branches
  const [awardAmount, setAwardAmount] = useState("");
  const [awardReceivedAt, setAwardReceivedAt] = useState("");
  const [paidMethod, setPaidMethod] = useState<PaidMethod | "">("");
  const [denialReason, setDenialReason] = useState("");
  const [appealed, setAppealed] = useState(false);

  const loadOutcome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimantId}/outcome`);
      if (!res.ok) {
        throw new Error(`Failed to load outcome (${res.status})`);
      }
      const data = await res.json();
      setOutcome(data.outcome ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load outcome");
    } finally {
      setLoading(false);
    }
  }, [claimantId]);

  useEffect(() => {
    loadOutcome();
  }, [loadOutcome]);

  const resetForm = () => {
    setAwardAmount("");
    setAwardReceivedAt("");
    setPaidMethod("");
    setDenialReason("");
    setAppealed(false);
  };

  const openEditor = (mode: EditMode) => {
    setEditMode(mode);
    // If editing an existing record, pre-fill the form
    if (outcome && mode === outcome.outcome) {
      setAwardAmount(
        outcome.awardAmount != null ? String(outcome.awardAmount) : ""
      );
      setAwardReceivedAt(
        outcome.awardReceivedAt ? outcome.awardReceivedAt.slice(0, 10) : ""
      );
      setPaidMethod(outcome.paidMethod ?? "");
      setDenialReason(outcome.denialReason ?? "");
      setAppealed(outcome.appealed);
    } else {
      resetForm();
    }
  };

  const submit = async (mode: Exclude<EditMode, null>) => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { outcome: mode };
      if (mode === "AWARDED") {
        const parsed = parseFloat(awardAmount);
        if (awardAmount && !isNaN(parsed) && parsed > 0) {
          body.awardAmount = parsed;
        }
        if (awardReceivedAt) body.awardReceivedAt = awardReceivedAt;
        if (paidMethod) body.paidMethod = paidMethod;
      } else if (mode === "DENIED") {
        if (denialReason.trim()) body.denialReason = denialReason.trim();
        body.appealed = appealed;
      }

      const res = await fetch(`/api/claims/${claimantId}/outcome`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      const data = await res.json();
      setOutcome(data.outcome);
      setEditMode(null);

      // Fire pixel event AFTER server-side persistence succeeds.
      // Exact dollar amount stays server-side; only a bucket is sent.
      trackClaimOutcome(
        mode === "AWARDED"
          ? "awarded"
          : mode === "DENIED"
            ? "denied"
            : "pending",
        mode === "AWARDED" ? data.outcome.awardAmount : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading / error states ─────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-sage-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading outcome status…
      </div>
    );
  }

  // ─── Editor mode ────────────────────────────────────────────

  if (editMode) {
    return (
      <OutcomeEditor
        mode={editMode}
        awardAmount={awardAmount}
        setAwardAmount={setAwardAmount}
        awardReceivedAt={awardReceivedAt}
        setAwardReceivedAt={setAwardReceivedAt}
        paidMethod={paidMethod}
        setPaidMethod={setPaidMethod}
        denialReason={denialReason}
        setDenialReason={setDenialReason}
        appealed={appealed}
        setAppealed={setAppealed}
        saving={saving}
        error={error}
        onCancel={() => {
          setEditMode(null);
          setError(null);
        }}
        onSubmit={() => submit(editMode)}
      />
    );
  }

  // ─── Summary of an existing outcome ─────────────────────────

  if (outcome) {
    return (
      <OutcomeSummary
        outcome={outcome}
        claimantName={claimantName}
        onEdit={() => openEditor(outcome.outcome as EditMode)}
        onChangeStatus={() => setOutcome(null)}
      />
    );
  }

  // ─── Initial state: three CTAs ──────────────────────────────

  return (
    <div className="space-y-3">
      <p className="text-sm text-sage-700">
        When you hear back from the DOJ, let us know how it went. Your answer
        stays private — we use aggregate numbers (never your name or exact
        amount) to help other families understand what to expect.
      </p>
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => openEditor("AWARDED")}
          className="gap-2 rounded-full border-sage-600 bg-sage-50 text-sage-900 hover:bg-sage-100"
        >
          <Trophy className="h-4 w-4" />I was awarded
        </Button>
        <Button
          variant="outline"
          onClick={() => openEditor("DENIED")}
          className="gap-2 rounded-full border-rose-300 text-rose-800 hover:bg-rose-50"
        >
          <XCircle className="h-4 w-4" />I was denied
        </Button>
        <Button
          variant="outline"
          onClick={() => openEditor("PENDING")}
          className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
        >
          <Clock className="h-4 w-4" />
          Still waiting
        </Button>
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────

function OutcomeSummary({
  outcome,
  claimantName,
  onEdit,
  onChangeStatus,
}: {
  outcome: OutcomeRecord;
  claimantName: string;
  onEdit: () => void;
  onChangeStatus: () => void;
}) {
  const reportedAt = outcome.selfReportedAt
    ? new Date(outcome.selfReportedAt).toLocaleDateString()
    : new Date(outcome.updatedAt).toLocaleDateString();

  return (
    <div className="rounded-2xl border border-sage-200 bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {outcome.outcome === "AWARDED" && (
            <CheckCircle2 className="h-5 w-5 text-sage-700" />
          )}
          {outcome.outcome === "DENIED" && (
            <XCircle className="h-5 w-5 text-rose-700" />
          )}
          {outcome.outcome === "PENDING" && (
            <Clock className="h-5 w-5 text-sage-500" />
          )}
          {outcome.outcome === "WITHDRAWN" && (
            <Clock className="h-5 w-5 text-sage-500" />
          )}
          <div>
            <div className="text-sm font-semibold text-sage-900">
              {outcome.outcome === "AWARDED" && "Awarded"}
              {outcome.outcome === "DENIED" && "Denied"}
              {outcome.outcome === "WITHDRAWN" && "Withdrawn"}
              {outcome.outcome === "PENDING" && "Still waiting to hear back"}
            </div>
            <div className="text-xs text-sage-600">Reported {reportedAt}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-xs text-sage-700 hover:text-sage-900"
        >
          Update
        </Button>
      </div>

      {outcome.outcome === "AWARDED" && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {outcome.awardAmount != null && (
            <>
              <dt className="text-sage-600">Award amount</dt>
              <dd className="text-sage-900">
                ${outcome.awardAmount.toLocaleString()}
              </dd>
            </>
          )}
          {outcome.awardReceivedAt && (
            <>
              <dt className="text-sage-600">Received</dt>
              <dd className="text-sage-900">
                {new Date(outcome.awardReceivedAt).toLocaleDateString()}
              </dd>
            </>
          )}
          {outcome.paidMethod && (
            <>
              <dt className="text-sage-600">Payment method</dt>
              <dd className="text-sage-900">
                {labelForPaidMethod(outcome.paidMethod)}
              </dd>
            </>
          )}
        </dl>
      )}

      {outcome.outcome === "DENIED" && (
        <div className="mt-3 space-y-2 text-sm">
          {outcome.denialReason && (
            <div>
              <div className="text-xs font-medium text-sage-600">
                Reason given
              </div>
              <p className="whitespace-pre-wrap text-sage-900">
                {outcome.denialReason}
              </p>
            </div>
          )}
          <div className="text-sage-700">
            Appeal status:{" "}
            <span className="font-medium">
              {outcome.appealed ? "Appealed" : "Not appealed"}
            </span>
          </div>
          <p className="text-xs text-sage-600">
            If you haven&apos;t appealed yet and would like help,{" "}
            <a href="/contact" className="font-medium text-sage-800 underline">
              reach out
            </a>
            .
          </p>
        </div>
      )}

      {outcome.outcome === "PENDING" && (
        <p className="mt-2 text-sm text-sage-700">
          Thanks for checking in, {claimantName.split(" ")[0]}. We&apos;ll keep
          your record up to date. The DOJ typically takes several months after
          filing — use the DOJ status tracker to see where your claim is in the
          queue.
        </p>
      )}

      <button
        type="button"
        onClick={onChangeStatus}
        className="mt-3 text-xs text-sage-600 underline hover:text-sage-900"
      >
        Change status entirely
      </button>
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────

function OutcomeEditor({
  mode,
  awardAmount,
  setAwardAmount,
  awardReceivedAt,
  setAwardReceivedAt,
  paidMethod,
  setPaidMethod,
  denialReason,
  setDenialReason,
  appealed,
  setAppealed,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  mode: Exclude<EditMode, null>;
  awardAmount: string;
  setAwardAmount: (v: string) => void;
  awardReceivedAt: string;
  setAwardReceivedAt: (v: string) => void;
  paidMethod: PaidMethod | "";
  setPaidMethod: (v: PaidMethod | "") => void;
  denialReason: string;
  setDenialReason: (v: string) => void;
  appealed: boolean;
  setAppealed: (v: boolean) => void;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-sage-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-sage-900">
        {mode === "AWARDED" && "Record your award"}
        {mode === "DENIED" && "Record the denial"}
        {mode === "PENDING" && "Confirm you're still waiting"}
      </h4>

      {mode === "AWARDED" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="award-amount" className="text-sm text-sage-800">
              Award amount (USD)
            </Label>
            <Input
              id="award-amount"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="e.g. 50000"
              value={awardAmount}
              onChange={(e) => setAwardAmount(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-sage-600">
              Stored securely. Only a range (e.g. &quot;$25k-$50k&quot;) is ever
              used in aggregate metrics or ad tracking.
            </p>
          </div>
          <div>
            <Label
              htmlFor="award-received-at"
              className="text-sm text-sage-800"
            >
              Date you received it
            </Label>
            <Input
              id="award-received-at"
              type="date"
              value={awardReceivedAt}
              onChange={(e) => setAwardReceivedAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="paid-method" className="text-sm text-sage-800">
              How were you paid?
            </Label>
            <select
              id="paid-method"
              value={paidMethod}
              onChange={(e) => setPaidMethod(e.target.value as PaidMethod | "")}
              className="mt-1 block w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900"
            >
              <option value="">Select…</option>
              <option value="CHECK">Paper check</option>
              <option value="DIRECT_DEPOSIT">Direct deposit</option>
              <option value="WIRE">Wire transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      )}

      {mode === "DENIED" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="denial-reason" className="text-sm text-sage-800">
              Reason given by the DOJ (optional)
            </Label>
            <textarea
              id="denial-reason"
              rows={4}
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Copy/paste or paraphrase the reason from the letter"
              className="mt-1 block w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-sage-800">
            <input
              type="checkbox"
              checked={appealed}
              onChange={(e) => setAppealed(e.target.checked)}
              className="h-4 w-4 rounded border-sage-300"
            />
            I&apos;ve filed an appeal
          </label>
        </div>
      )}

      {mode === "PENDING" && (
        <p className="text-sm text-sage-700">
          We&apos;ll mark that you&apos;re still waiting. You can update this
          any time your status changes.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={onSubmit}
          disabled={saving}
          className="gap-2 rounded-full bg-sage-800 text-white hover:bg-sage-900"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function labelForPaidMethod(pm: PaidMethod): string {
  switch (pm) {
    case "CHECK":
      return "Paper check";
    case "DIRECT_DEPOSIT":
      return "Direct deposit";
    case "WIRE":
      return "Wire transfer";
    case "OTHER":
      return "Other";
  }
}

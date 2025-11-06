import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type {
  RiskAction,
  RiskFlag,
  RiskFixability,
} from "@/lib/document-intelligence/schemas";
import { actionLabels, actorLabels, resolveBlockingLevel } from "./helpers";

interface RiskActionDialogProps {
  open: boolean;
  action?: RiskAction;
  risk?: RiskFlag;
  actor: RiskFixability;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    comment?: string;
    linkedDocumentIds?: string[];
    waiverExpiration?: string;
  }) => void;
}

export function RiskActionDialog({
  open,
  action,
  risk,
  actor,
  submitting,
  onClose,
  onSubmit,
}: RiskActionDialogProps) {
  const [comment, setComment] = useState("");
  const [documentIds, setDocumentIds] = useState("");
  const [waiverExpiration, setWaiverExpiration] = useState("");
  const [error, setError] = useState<string | null>(null);

  const config = useMemo(
    () => (action ? buildActionConfig(action, actor) : null),
    [action, actor]
  );

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (submitting) return;
      onClose();
    }
  };

  useEffect(() => {
    if (!open) {
      setComment("");
      setDocumentIds("");
      setWaiverExpiration("");
      setError(null);
      return;
    }

    setError(null);
    setComment("");
    setWaiverExpiration(
      risk?.waiverExpiration ? risk.waiverExpiration.slice(0, 10) : ""
    );
    setDocumentIds((risk?.linkedDocumentIds ?? []).join(", "));
  }, [open, risk]);

  if (!config || !action || !risk) {
    return (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action unavailable</DialogTitle>
            <DialogDescription>
              We could not determine the requested action. Please close the
              dialog and try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const blockingLevel = resolveBlockingLevel(risk);
  const severityVariant =
    risk.severity === "high"
      ? "destructive"
      : risk.severity === "medium"
        ? "default"
        : "secondary";

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setError(null);

    const trimmedComment = comment.trim();

    if (config.commentRequired && trimmedComment.length === 0) {
      setError(config.commentRequiredMessage);
      return;
    }

    let linkedDocumentIds: string[] | undefined;
    if (action === "LINK_EVIDENCE") {
      if (documentIds.trim().length === 0) {
        linkedDocumentIds = [];
      } else {
        linkedDocumentIds = documentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }
    }

    onSubmit({
      comment: trimmedComment.length > 0 ? trimmedComment : undefined,
      linkedDocumentIds,
      waiverExpiration:
        action === "REQUEST_WAIVER" && actor === "REVIEWER"
          ? waiverExpiration || undefined
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-3">
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>{config.description}</span>
              <div className="rounded-md border border-dashed bg-muted/40 p-3 text-left">
                <p className="text-sm font-semibold">{risk.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {risk.actionRequired}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={severityVariant}>{risk.severity}</Badge>
                  <Badge
                    className={
                      blockingLevel === "BLOCKING"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    }
                  >
                    {blockingLevel === "BLOCKING" ? "Blocking" : "Advisory"}
                  </Badge>
                  <span className="text-muted-foreground">
                    Next actor:{" "}
                    {risk.nextActionBy
                      ? actorLabels[risk.nextActionBy]
                      : "None"}
                  </span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {config.warning ? (
            <Alert variant="destructive">
              <AlertTitle>{config.warning.title}</AlertTitle>
              <AlertDescription>{config.warning.body}</AlertDescription>
            </Alert>
          ) : null}

          {action === "LINK_EVIDENCE" ? (
            <div className="space-y-2">
              <Label htmlFor="linkedDocs">Supporting document IDs</Label>
              <Input
                id="linkedDocs"
                value={documentIds}
                onChange={(event) => setDocumentIds(event.target.value)}
                placeholder="doc-123, doc-456"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple IDs with commas. Leave blank to clear linked
                evidence.
              </p>
            </div>
          ) : null}

          {config.showCommentField ? (
            <div className="space-y-2">
              <Label htmlFor="riskActionComment">
                {config.commentLabel}
                {config.commentRequired ? (
                  <span className="ml-1 text-red-500">*</span>
                ) : null}
              </Label>
              <Textarea
                id="riskActionComment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={config.commentPlaceholder}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {config.commentHelpText}
              </p>
            </div>
          ) : null}

          {action === "REQUEST_WAIVER" && actor === "REVIEWER" ? (
            <div className="space-y-2">
              <Label htmlFor="waiverExpiration">
                Dismissal expiration (optional)
              </Label>
              <Input
                id="waiverExpiration"
                type="date"
                value={waiverExpiration}
                onChange={(event) => setWaiverExpiration(event.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                If set, the dismissal will expire on this date unless renewed.
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <DialogFooter className="gap-2 sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                config.submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildActionConfig(action: RiskAction, actor: RiskFixability) {
  switch (action) {
    case "RESOLVE":
      return {
        title: "Mark risk as resolved",
        description:
          "Explain what changed so reviewers understand how this document is now compliant.",
        submitLabel: "Submit resolution",
        showCommentField: true,
        commentLabel: "Resolution notes",
        commentPlaceholder:
          "Example: Provided corrected signature page from claimant.",
        commentHelpText:
          "Optional, but helps reviewers confirm your resolution quickly.",
        commentRequired: false,
        commentRequiredMessage: "",
      };
    case "LINK_EVIDENCE":
      return {
        title: "Attach supporting evidence",
        description:
          "Link other documents that clarify or correct this issue. Reviewers will verify them.",
        submitLabel: "Save evidence",
        showCommentField: true,
        commentLabel: "Context for reviewer (optional)",
        commentPlaceholder: "Summarize how these documents support this item.",
        commentHelpText:
          "Mention key page numbers or excerpts to speed up review.",
        commentRequired: false,
        commentRequiredMessage: "",
      };
    case "REQUEST_WAIVER":
      return {
        title: "Dismiss this risk",
        description:
          actor === "REVIEWER"
            ? "Explain why this flag does not prevent the document from being used."
            : "Tell reviewers why this flag should not block this document.",
        submitLabel:
          actor === "REVIEWER" ? "Record dismissal" : "Submit appeal",
        showCommentField: true,
        commentLabel:
          actor === "REVIEWER" ? "Dismissal rationale" : "Your explanation",
        commentPlaceholder:
          actor === "REVIEWER"
            ? "Example: Verified with claimant; issue is a formatting quirk."
            : "Example: This is the signed policy; the wording is standard.",
        commentHelpText:
          actor === "REVIEWER"
            ? "Required so we have an audit trail for this dismissal."
            : "Required so reviewers understand why this risk is not applicable.",
        commentRequired: true,
        commentRequiredMessage:
          "Please include a brief explanation before dismissing this risk.",
      };
    case "EXCLUDE_DOCUMENT":
      return {
        title: "Exclude this document",
        description:
          "Removing the document means it no longer contributes to eligibility or evidence.",
        submitLabel: "Exclude document",
        showCommentField: true,
        commentLabel: "Optional notes for the team",
        commentPlaceholder:
          "Explain why this document cannot be corrected or used.",
        commentHelpText:
          "Helpful if another reviewer needs to understand this decision.",
        commentRequired: false,
        commentRequiredMessage: "",
        warning: {
          title: "This action removes the document from the claim",
          body: "Only continue if there is no viable fix. You can add a note so others understand the exclusion.",
        },
      };
    case "ACKNOWLEDGE":
      return {
        title: "Acknowledge advisory flag",
        description:
          "Confirm you understand this advisory note. Reviewers will see your acknowledgement.",
        submitLabel: "Acknowledge risk",
        showCommentField: true,
        commentLabel: "Optional acknowledgement note",
        commentPlaceholder: "Add context if you want reviewers to see it.",
        commentHelpText:
          "Use this when you want to clarify why the advisory risk is acceptable.",
        commentRequired: false,
        commentRequiredMessage: "",
      };
    default:
      return null;
  }
}

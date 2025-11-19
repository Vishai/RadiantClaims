"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ResourceFeedbackInlineProps {
  resourceId: string;
  resourceName: string;
  interactionId?: string; // If we already created an interaction
  onFeedbackSubmitted?: (helpful: boolean) => void;
}

export function ResourceFeedbackInline({
  resourceId,
  // resourceName,
  interactionId,
  onFeedbackSubmitted,
}: ResourceFeedbackInlineProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showNegativeForm, setShowNegativeForm] = useState(false);
  const [negativeReason, setNegativeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    if (feedbackGiven) return;

    // If thumbs down, show the reason form
    if (!helpful) {
      setShowNegativeForm(true);
      return;
    }

    // Thumbs up - submit immediately
    await submitFeedback(helpful, null);
  };

  const submitFeedback = async (helpful: boolean, reason: string | null) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/resources/feedback/immediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          interactionId,
          helpful,
          reason,
        }),
      });

      if (response.ok) {
        setFeedbackGiven(true);
        setShowNegativeForm(false);
        onFeedbackSubmitted?.(helpful);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegativeSubmit = async () => {
    await submitFeedback(false, negativeReason);
  };

  if (feedbackGiven) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        <CheckCircle className="h-4 w-4" />
        <span>
          Thanks for your feedback! We'll check back in a few days to see how it
          went.
        </span>
      </div>
    );
  }

  if (showNegativeForm) {
    return (
      <div className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-medium text-amber-900">
          What's wrong with this resource?
        </p>
        <Textarea
          placeholder="Wrong type of office, wrong location, contact info looks incorrect, etc."
          value={negativeReason}
          onChange={(e) => setNegativeReason(e.target.value)}
          className="min-h-[60px] text-sm"
          disabled={isSubmitting}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleNegativeSubmit}
            disabled={isSubmitting || !negativeReason.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNegativeForm(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        Is this the right resource for what you need?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(true)}
          className="flex flex-shrink-0 items-center gap-1.5 border-green-300 hover:bg-green-50 hover:text-green-700"
          disabled={isSubmitting}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">This looks right</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(false)}
          className="flex flex-shrink-0 items-center gap-1.5 border-red-300 hover:bg-red-50 hover:text-red-700"
          disabled={isSubmitting}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Not what I need</span>
        </Button>
      </div>
      <p className="text-xs italic text-muted-foreground">
        We'll email you in a few days to see how it went. Your feedback helps
        other RECA claimants!
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Star } from "lucide-react";

interface InteractionData {
  id: string;
  resource: {
    id: string;
    name: string;
    resourceType: string;
    state: string;
    county: string | null;
  };
  documentType: string;
  searchQuery: string | null;
  createdAt: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interactionId = params.interactionId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionData | null>(null);

  // Form state
  const [didContact, setDidContact] = useState<string>("");
  const [responseTime, setResponseTime] = useState<string>("");
  const [gotDocument, setGotDocument] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [actualCost, setActualCost] = useState<string>("");
  const [processingDays, setProcessingDays] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  useEffect(() => {
    fetchInteraction();
  }, [interactionId]);

  const fetchInteraction = async () => {
    try {
      const response = await fetch(
        `/api/resources/feedback/interaction/${interactionId}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "Feedback request not found. It may have already been submitted."
          );
        } else {
          setError("Failed to load feedback request");
        }
        return;
      }

      const data = await response.json();
      setInteraction(data);
    } catch (err) {
      console.error("Error fetching interaction:", err);
      setError("Failed to load feedback request");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/resources/feedback/detailed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactionId,
          resourceId: interaction?.resource.id,
          didContact: didContact === "yes",
          responseTime:
            didContact === "yes" && responseTime ? responseTime : null,
          gotDocument: gotDocument === "yes",
          rating: rating > 0 ? rating : null,
          actualCost: actualCost ? parseFloat(actualCost) : null,
          processingDays: processingDays ? parseInt(processingDays, 10) : null,
          comments: comments.trim() || null,
          documentType: interaction?.documentType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);

      // Redirect to thank you message after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <h1 className="mb-2 text-2xl font-bold">Thank You!</h1>
          <p className="mb-4 text-muted-foreground">
            Your feedback helps us improve our resources for future RECA
            claimants.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you home...
          </p>
        </Card>
      </div>
    );
  }

  if (!interaction) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card className="mb-4 p-6">
          <h1 className="mb-2 text-2xl font-bold">How did it go?</h1>
          <p className="mb-4 text-muted-foreground">
            We'd love to hear about your experience contacting this resource.
          </p>

          {/* Resource info */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <h3 className="text-sm font-semibold">
              {interaction.resource.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {interaction.resource.resourceType.replace(/_/g, " ")}
              {interaction.resource.county &&
                ` • ${interaction.resource.county} County, ${interaction.resource.state}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Looking for: {interaction.documentType}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Did you contact them? */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Did you contact this office? *
              </Label>
              <RadioGroup
                value={didContact}
                onValueChange={setDidContact}
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="contact-yes" />
                  <Label
                    htmlFor="contact-yes"
                    className="cursor-pointer font-normal"
                  >
                    Yes, I contacted them
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="contact-no" />
                  <Label
                    htmlFor="contact-no"
                    className="cursor-pointer font-normal"
                  >
                    No, I haven't contacted them yet
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wrong" id="contact-wrong" />
                  <Label
                    htmlFor="contact-wrong"
                    className="cursor-pointer font-normal"
                  >
                    This wasn't the right place for my needs
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Response time (only if they contacted) */}
            {didContact === "yes" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  How quickly did they respond?
                </Label>
                <RadioGroup
                  value={responseTime}
                  onValueChange={setResponseTime}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="same_day" id="time-same" />
                    <Label
                      htmlFor="time-same"
                      className="cursor-pointer font-normal"
                    >
                      Same day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="within_3_days" id="time-3" />
                    <Label
                      htmlFor="time-3"
                      className="cursor-pointer font-normal"
                    >
                      Within 3 days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="within_week" id="time-week" />
                    <Label
                      htmlFor="time-week"
                      className="cursor-pointer font-normal"
                    >
                      Within a week
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1_2_weeks" id="time-2weeks" />
                    <Label
                      htmlFor="time-2weeks"
                      className="cursor-pointer font-normal"
                    >
                      1-2 weeks
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2_4_weeks" id="time-4weeks" />
                    <Label
                      htmlFor="time-4weeks"
                      className="cursor-pointer font-normal"
                    >
                      2-4 weeks
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_response" id="time-none" />
                    <Label
                      htmlFor="time-none"
                      className="cursor-pointer font-normal"
                    >
                      They never responded
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Did they get the document? */}
            {didContact === "yes" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Were you able to get your document?
                </Label>
                <RadioGroup value={gotDocument} onValueChange={setGotDocument}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="doc-yes" />
                    <Label
                      htmlFor="doc-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes, I got the document
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="doc-pending" />
                    <Label
                      htmlFor="doc-pending"
                      className="cursor-pointer font-normal"
                    >
                      Still waiting for it
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="doc-no" />
                    <Label
                      htmlFor="doc-no"
                      className="cursor-pointer font-normal"
                    >
                      No, they couldn't help me
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                How would you rate this resource overall?
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Cost */}
            {gotDocument !== "no" && (
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-base font-semibold">
                  What was the actual cost? (optional)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder="0.00"
                    className="max-w-[150px]"
                  />
                </div>
              </div>
            )}

            {/* Processing time */}
            {gotDocument === "yes" && (
              <div className="space-y-2">
                <Label htmlFor="days" className="text-base font-semibold">
                  How long did it take to receive the document? (optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    type="number"
                    min="0"
                    value={processingDays}
                    onChange={(e) => setProcessingDays(e.target.value)}
                    placeholder="0"
                    className="max-w-[100px]"
                  />
                  <span className="text-muted-foreground">days</span>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-base font-semibold">
                Additional comments (optional)
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any tips, warnings, or advice for future claimants?"
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!didContact || submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
              >
                Skip for Now
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Your feedback is completely optional but greatly appreciated!
        </p>
      </div>
    </div>
  );
}

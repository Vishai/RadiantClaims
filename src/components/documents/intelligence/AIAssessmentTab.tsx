"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Brain,
  Tag,
  ArrowRight,
  AlertCircle,
  CheckCheck,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AIAssessmentTabProps {
  data: IntelligenceResponse;
  documentId: string;
}

export function AIAssessmentTab({ data, documentId }: AIAssessmentTabProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const categoryMismatch =
    data.compliance?.documentQualification?.categoryMismatch;
  const aiCategorization = data.categoryInsights?.aiCategorization;
  const heuristicReason = data.categoryInsights?.heuristicReason;
  const userSelectedCategory = data.categoryInsights?.userSelectedCategory;
  const finalCategory = data.categoryInsights?.finalCategory;
  const autoCorrected = data.categoryInsights?.autoCorrected;

  const hasCategoryMismatch =
    categoryMismatch &&
    categoryMismatch.userSelected !== categoryMismatch.aiDetected;

  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleAcceptAICategory = async () => {
    if (!categoryMismatch) return;

    setIsAccepting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryMismatch.aiDetected,
          categoryLocked: true,
          source: "ai_accepted",
        }),
      });

      if (response.ok) {
        router.refresh();
        // Close modal after success
        window.location.reload();
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      console.error("Failed to accept AI category:", error);
      alert("An error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectAICategory = async () => {
    if (!categoryMismatch) return;

    setIsRejecting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryMismatch.userSelected,
          categoryLocked: true,
          source: "user_confirmed",
        }),
      });

      if (response.ok) {
        router.refresh();
        window.location.reload();
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      console.error("Failed to reject AI category:", error);
      alert("An error occurred");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Category Mismatch Alert */}
      {hasCategoryMismatch && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            Category Mismatch Detected
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">You labeled as:</span>
              <Badge variant="outline" className="font-mono">
                {formatCategoryName(categoryMismatch.userSelected)}
              </Badge>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium">AI detected:</span>
              <Badge variant="default" className="bg-purple-600 font-mono">
                {formatCategoryName(categoryMismatch.aiDetected)}
              </Badge>
              <span className="text-muted-foreground">
                ({Math.round((categoryMismatch.aiConfidence ?? 0) * 100)}%
                confidence)
              </span>
            </div>

            <p className="text-sm">{categoryMismatch.explanation}</p>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAcceptAICategory}
                disabled={isAccepting || isRejecting}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                {isAccepting ? "Accepting..." : "Accept AI Suggestion"}
              </Button>
              <Button
                onClick={handleRejectAICategory}
                disabled={isAccepting || isRejecting}
                size="sm"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                {isRejecting ? "Confirming..." : "Keep My Label"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Category Locked Status */}
      {data.categoryInsights?.categoryLocked && !hasCategoryMismatch && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Category Confirmed</AlertTitle>
          <AlertDescription className="text-green-800">
            This document's category has been confirmed and locked as{" "}
            <strong>{formatCategoryName(finalCategory || "")}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-Corrected Info */}
      {autoCorrected && !hasCategoryMismatch && (
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Auto-Corrected by AI
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            The category was automatically updated from{" "}
            <strong>{formatCategoryName(userSelectedCategory || "")}</strong> to{" "}
            <strong>{formatCategoryName(finalCategory || "")}</strong> by the
            AI.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Categorization Details */}
      {aiCategorization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Classification Analysis
            </CardTitle>
            <CardDescription>
              AI's assessment of this document's category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Suggested Category
                </p>
                <Badge variant="secondary" className="mt-1 font-mono text-sm">
                  {formatCategoryName(aiCategorization.suggestedCategory)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Confidence
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        aiCategorization.confidence >= 0.8
                          ? "bg-green-500"
                          : aiCategorization.confidence >= 0.6
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      )}
                      style={{ width: `${aiCategorization.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(aiCategorization.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {aiCategorization.reasoning && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  AI Reasoning
                </p>
                <p className="text-sm">{aiCategorization.reasoning}</p>
              </div>
            )}

            {aiCategorization.alternatives &&
              aiCategorization.alternatives.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Alternative Categories
                  </p>
                  <div className="space-y-1">
                    {aiCategorization.alternatives.map(
                      (alt: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded border bg-background p-2 text-sm"
                        >
                          <span>{formatCategoryName(alt.category)}</span>
                          <span className="text-muted-foreground">
                            {Math.round(alt.confidence * 100)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Heuristic Analysis */}
      {heuristicReason && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-blue-600" />
              Heuristic Pattern Detection
            </CardTitle>
            <CardDescription>
              Rule-based classification signals found in document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm">{heuristicReason}</p>
            </div>
            {data.categoryInsights?.heuristicSignals &&
              data.categoryInsights.heuristicSignals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {data.categoryInsights.heuristicSignals.map(
                    (signal: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    )
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Category Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Category Decision Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">
                User Selection:
              </dt>
              <dd className="font-mono">
                {formatCategoryName(userSelectedCategory || "None")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">
                Final Category:
              </dt>
              <dd className="font-mono font-semibold">
                {formatCategoryName(finalCategory || "Unknown")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">
                Auto-Corrected:
              </dt>
              <dd>{autoCorrected ? "Yes" : "No"}</dd>
            </div>
            {data.categoryInsights?.autoCorrectionSource && (
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">
                  Correction Source:
                </dt>
                <dd className="capitalize">
                  {data.categoryInsights.autoCorrectionSource.replace("_", " ")}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">
                Category Locked:
              </dt>
              <dd>{data.categoryInsights?.categoryLocked ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* No AI Analysis Available */}
      {!aiCategorization && !heuristicReason && !hasCategoryMismatch && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No AI Assessment Available</AlertTitle>
          <AlertDescription>
            AI classification analysis was not performed on this document.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

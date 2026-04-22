"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReadinessScoreProps {
  sessionId: string;
  showDetails?: boolean;
  onValidate?: () => void;
  className?: string;
}

interface Section {
  category: string;
  required: boolean;
  minDocuments: number;
  currentDocuments: number;
  status: "COMPLETE" | "INCOMPLETE" | "NEEDS_REVIEW";
  documents: Array<{
    fileId: string;
    fileName: string;
    status: string;
  }>;
}

interface CompletenessData {
  readinessScore: number;
  isReadyForSubmission: boolean;
  completeness: {
    sections: Section[];
    overallPercent: number;
  };
  criticalBlockers: Array<{
    severity: string;
    code: string;
    message: string;
    suggestion: string;
  }>;
  warnings: Array<{
    severity: string;
    code: string;
    message: string;
    suggestion: string;
  }>;
  recommendations: string[];
}

export function ReadinessScore({
  sessionId,
  showDetails = true,
  onValidate,
  className,
}: ReadinessScoreProps) {
  const [readiness, setReadiness] = useState<CompletenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/validation/status/${sessionId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch readiness status");
      }

      const data = await response.json();

      // Check if completeness check has been run
      if (data.status.completenessCheck?.completed) {
        setReadiness(data.status.completenessCheck);
      } else {
        setReadiness(null);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading readiness status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">Error: {error}</p>
            <Button variant="outline" size="sm" onClick={fetchReadiness}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Claim Readiness</CardTitle>
          <CardDescription>
            Run validation to check if your claim is ready for submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <span className="text-3xl text-gray-400">?</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              No readiness check has been performed yet
            </p>
            {onValidate && <Button onClick={onValidate}>Run Validation</Button>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    readinessScore,
    isReadyForSubmission,
    completeness,
    criticalBlockers,
    warnings,
    recommendations,
  } = readiness;

  // Determine score color
  const scoreColor =
    readinessScore >= 80
      ? "text-green-600"
      : readinessScore >= 60
        ? "text-yellow-600"
        : "text-red-600";

  const scoreBgColor =
    readinessScore >= 80
      ? "bg-green-50 border-green-200"
      : readinessScore >= 60
        ? "bg-yellow-50 border-yellow-200"
        : "bg-red-50 border-red-200";

  const statusIcon =
    readinessScore >= 80 ? (
      <CheckCircle className="h-6 w-6 text-green-600" />
    ) : readinessScore >= 60 ? (
      <AlertCircle className="h-6 w-6 text-yellow-600" />
    ) : (
      <XCircle className="h-6 w-6 text-red-600" />
    );

  const statusMessage =
    readinessScore >= 80
      ? "Your claim is ready for submission!"
      : readinessScore >= 60
        ? "Your claim is almost ready. A few items need attention."
        : "More documents are needed before submission.";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Claim Readiness</span>
          {onValidate && (
            <Button variant="ghost" size="sm" onClick={onValidate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Revalidate
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-32 w-32 flex-col items-center justify-center rounded-full border-4",
              scoreBgColor
            )}
          >
            <span className={cn("text-4xl font-bold", scoreColor)}>
              {readinessScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>

          {/* Status Message */}
          <div className="flex items-center gap-2">
            {statusIcon}
            <p className="text-sm font-medium">{statusMessage}</p>
          </div>
        </div>

        {/* Critical Blockers */}
        {criticalBlockers.length > 0 && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-900">
              <XCircle className="h-4 w-4" />
              <span>Critical Issues ({criticalBlockers.length})</span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-800">
              {criticalBlockers.slice(0, 3).map((blocker, idx) => (
                <li key={idx}>{blocker.message}</li>
              ))}
              {criticalBlockers.length > 3 && (
                <li className="text-red-600">
                  +{criticalBlockers.length - 3} more issues
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && criticalBlockers.length === 0 && (
          <div className="space-y-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-900">
              <AlertCircle className="h-4 w-4" />
              <span>Warnings ({warnings.length})</span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-yellow-800">
              {warnings.slice(0, 3).map((warning, idx) => (
                <li key={idx}>{warning.message}</li>
              ))}
              {warnings.length > 3 && (
                <li className="text-yellow-600">
                  +{warnings.length - 3} more warnings
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Checklist */}
        {showDetails && completeness.sections.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Document Checklist</h4>
            <div className="space-y-2">
              {completeness.sections.map((section, idx) => {
                const isComplete = section.status === "COMPLETE";
                const needsReview = section.status === "NEEDS_REVIEW";
                const isIncomplete = section.status === "INCOMPLETE";

                return (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {isComplete && (
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    )}
                    {needsReview && (
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                    )}
                    {isIncomplete && (
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <span
                        className={cn(
                          isComplete && "text-green-900",
                          needsReview && "text-yellow-900",
                          isIncomplete && "text-gray-600"
                        )}
                      >
                        {section.category}
                      </span>
                      {section.required && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (Required: {section.currentDocuments}/
                          {section.minDocuments})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ready Status */}
        {isReadyForSubmission && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-900">
              <CheckCircle className="h-4 w-4" />
              <span>This claim is ready for submission!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

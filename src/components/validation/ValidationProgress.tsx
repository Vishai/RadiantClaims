"use client";

import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";

interface ValidationProgressProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onComplete?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface ValidationStatusData {
  documents: {
    total: number;
    completed: number;
    pending: number;
    processing: number;
    verified: number;
    needsReview: number;
    rejected: number;
    error: number;
  };
  progress: {
    documentsPercent: number;
    overallStatus: "not_started" | "in_progress" | "completed";
  };
  completenessCheck?: {
    completed: boolean;
    readinessScore?: number;
  };
}

export function ValidationProgress({
  sessionId,
  autoRefresh = true,
  refreshInterval = 2000,
  onComplete,
  showDetails = true,
  className,
}: ValidationProgressProps) {
  const [status, setStatus] = useState<ValidationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/validation/status/${sessionId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch validation status");
      }

      const data = await response.json();
      setStatus(data.status);
      setError(null);

      // Check if validation is complete
      if (data.status.progress.overallStatus === "completed") {
        onComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [sessionId, onComplete]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up auto-refresh if enabled
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only continue polling if not completed
      if (status?.progress.overallStatus !== "completed") {
        fetchStatus();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [sessionId, autoRefresh, refreshInterval, fetchStatus, status?.progress.overallStatus]);

  if (loading && !status) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading validation status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-red-200 bg-red-50 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { documents, progress } = status;
  const isInProgress = progress.overallStatus === "in_progress";
  const isCompleted = progress.overallStatus === "completed";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInProgress && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
          {isCompleted && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <span className="font-medium text-sm">
            {isInProgress && "Validating Documents..."}
            {isCompleted && "Validation Complete"}
            {progress.overallStatus === "not_started" && "No Validations"}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {documents.completed}/{documents.total} ({Math.round(progress.documentsPercent)}%)
        </span>
      </div>

      {/* Progress bar */}
      <Progress
        value={progress.documentsPercent}
        className="h-2"
        indicatorClassName={cn(
          isCompleted && "bg-green-600",
          isInProgress && "bg-blue-600"
        )}
      />

      {/* Detailed breakdown */}
      {showDetails && documents.total > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {documents.verified > 0 && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Verified: {documents.verified}</span>
            </div>
          )}

          {documents.processing > 0 && (
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Processing: {documents.processing}</span>
            </div>
          )}

          {documents.needsReview > 0 && (
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Needs Review: {documents.needsReview}</span>
            </div>
          )}

          {documents.pending > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Pending: {documents.pending}</span>
            </div>
          )}

          {documents.rejected > 0 && (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Failed: {documents.rejected}</span>
            </div>
          )}

          {documents.error > 0 && (
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Error: {documents.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Readiness score (if available) */}
      {isCompleted && status.completenessCheck?.completed && status.completenessCheck.readinessScore !== undefined && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Readiness Score:</span>
            <span className={cn(
              "font-semibold",
              status.completenessCheck.readinessScore >= 80 && "text-green-600",
              status.completenessCheck.readinessScore >= 60 && status.completenessCheck.readinessScore < 80 && "text-yellow-600",
              status.completenessCheck.readinessScore < 60 && "text-red-600"
            )}>
              {status.completenessCheck.readinessScore}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

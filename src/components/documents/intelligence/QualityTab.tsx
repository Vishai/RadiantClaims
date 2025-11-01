"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface QualityTabProps {
  data: IntelligenceResponse;
}

export function QualityTab({ data }: QualityTabProps) {
  const { ocrConfidence, quality } = data;

  // Convert OCR confidence to 0-100 scale
  const ocrPercent = Math.round((ocrConfidence ?? 0) * 100);

  // Quality score (if available)
  const qualityPercent = quality?.qualityScore
    ? Math.round(quality.qualityScore * 100)
    : ocrPercent;

  // Determine quality level
  const getQualityLevel = (score: number) => {
    if (score >= 80)
      return {
        label: "Good",
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-50 dark:bg-green-950",
      };
    if (score >= 60)
      return {
        label: "Acceptable",
        icon: AlertTriangle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
      };
    return {
      label: "Poor",
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    };
  };

  const qualityLevel = getQualityLevel(qualityPercent);
  const QualityIcon = qualityLevel.icon;

  // Get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 py-4">
      {/* Overall Quality Score */}
      <div className={`rounded-lg border p-6 ${qualityLevel.bgColor}`}>
        <div className="mb-4 flex items-center gap-3">
          <QualityIcon className={`h-8 w-8 ${qualityLevel.color}`} />
          <div>
            <h3 className="text-lg font-semibold">Overall Quality</h3>
            <p className="text-sm text-muted-foreground">
              {qualityLevel.label}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quality Score</span>
            <span className={`text-3xl font-bold ${qualityLevel.color}`}>
              {qualityPercent}%
            </span>
          </div>
          <Progress
            value={qualityPercent}
            className="h-3"
            indicatorClassName={getProgressColor(qualityPercent)}
          />
        </div>
      </div>

      {/* OCR Confidence */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">OCR Confidence</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Text Recognition Quality
            </span>
            <Badge
              variant={
                ocrPercent >= 80
                  ? "default"
                  : ocrPercent >= 60
                    ? "secondary"
                    : "destructive"
              }
            >
              {ocrPercent}%
            </Badge>
          </div>
          <Progress
            value={ocrPercent}
            className="h-2"
            indicatorClassName={getProgressColor(ocrPercent)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {ocrPercent >= 80
              ? "Excellent text recognition quality. AI can confidently extract information."
              : ocrPercent >= 60
                ? "Acceptable text recognition. Some text may be unclear."
                : "Poor text recognition quality. Consider rescanning the document."}
          </p>
        </div>
      </div>

      {/* Quality Issues */}
      {quality && (quality.isBlurry || quality.isLowContrast) && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Quality Issues Detected
          </h3>
          <div className="space-y-3">
            {quality.isBlurry && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Blurry Image</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The document appears to be blurry or out of focus, which may
                    affect text extraction accuracy.
                  </p>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>
            )}
            {quality.isLowContrast && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low Contrast</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The document has low contrast between text and background,
                    making it harder to read.
                  </p>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {qualityPercent < 80 && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-3 text-lg font-semibold">Recommendations</h3>
          <ul className="list-inside list-disc space-y-2 text-sm">
            {qualityPercent < 60 && (
              <>
                <li>
                  Consider rescanning the document at a higher resolution (300
                  DPI or higher)
                </li>
                <li>Ensure the document is flat and well-lit when scanning</li>
                <li>
                  If possible, use the original document rather than a photocopy
                </li>
              </>
            )}
            {quality?.isBlurry && (
              <li>Adjust camera focus or scanner settings to reduce blur</li>
            )}
            {quality?.isLowContrast && (
              <>
                <li>Increase scanner contrast settings</li>
                <li>If using a phone camera, ensure good lighting</li>
              </>
            )}
            {qualityPercent >= 60 && qualityPercent < 80 && (
              <li>
                While the document is acceptable, a higher quality scan would
                improve accuracy
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Good Quality Message */}
      {qualityPercent >= 80 && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Excellent Document Quality
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                This document has high quality and should be processed
                accurately by the AI systems.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

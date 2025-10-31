"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DocumentTag {
  id: string;
  tag: string;
  confidence: number;
  createdAt: string;
}

interface IntelligencePanelProps {
  fileId: string;
  initialStatus?: string;
  className?: string;
}

interface IntelligenceData {
  ocrConfidence?: number | null;
  textLength: number;
  category?: string | null;
  qualityScore?: number;
  tags: DocumentTag[];
  recommendations: string[];
  aiCategorization?: {
    suggestedCategory: string;
    confidence: number;
    reasoning: string;
  };
}

export function IntelligencePanel({
  fileId,
  initialStatus = "UPLOADING",
  className,
}: IntelligencePanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showOCRText, setShowOCRText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "UPLOADING" || status === "PROCESSING") {
      // Poll for status updates
      const interval = setInterval(checkProcessingStatus, 2000);
      return () => clearInterval(interval);
    } else {
      // Load intelligence data if ready
      loadIntelligenceData();
    }
  }, [fileId, status]);

  const checkProcessingStatus = async () => {
    try {
      const response = await fetch(`/api/documents/process/${fileId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.file?.status === "READY") {
          setStatus("READY");
          setIntelligence(data.intelligence);
          setLoading(false);
        } else if (data.file?.status === "FAILED") {
          setStatus("FAILED");
          setError("Processing failed");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    }
  };

  const loadIntelligenceData = async () => {
    try {
      const response = await fetch(`/api/documents/process/${fileId}`);
      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
        setStatus(data.file.status);
      }
    } catch (err) {
      console.error("Failed to load intelligence:", err);
      setError("Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.9) return "text-emerald-600";
    if (score >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  // Show loading state
  if (loading || status === "UPLOADING" || status === "PROCESSING") {
    return (
      <Card className={cn("rounded-2xl border-2", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 animate-pulse text-purple-600" />
            Processing Document...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={status === "UPLOADING" ? 30 : 70} className="h-2" />
          <p className="text-sm text-sage-600">
            {status === "UPLOADING"
              ? "Analyzing image quality..."
              : "Extracting text and categorizing..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || status === "FAILED") {
    return (
      <Card
        className={cn(
          "rounded-2xl border-2 border-red-200 bg-red-50",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-900">
            <AlertTriangle className="h-5 w-5" />
            Processing Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            {error || "Document processing failed. Please try re-uploading."}
          </p>
          <Button
            onClick={() => {
              setLoading(true);
              setError(null);
              loadIntelligenceData();
            }}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show intelligence results
  if (!intelligence) {
    return null;
  }

  const {
    ocrConfidence,
    textLength,
    category,
    qualityScore,
    tags,
    recommendations,
    aiCategorization,
  } = intelligence;

  return (
    <Card
      className={cn(
        "rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Document Intelligence
        </CardTitle>
        <CardDescription>AI-powered analysis results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OCR Confidence */}
        {ocrConfidence && ocrConfidence > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-sage-700">Text Extraction</span>
              <span
                className={cn(
                  "font-semibold",
                  getConfidenceColor(ocrConfidence)
                )}
              >
                {Math.round(ocrConfidence * 100)}%
              </span>
            </div>
            <Progress value={ocrConfidence * 100} className="h-2" />
            <p className="mt-1 text-xs text-sage-600">
              Extracted {textLength.toLocaleString()} characters
            </p>
          </div>
        )}

        {/* Quality Score */}
        {qualityScore && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-sage-700">Image Quality</span>
              <span
                className={cn("font-semibold", getQualityColor(qualityScore))}
              >
                {Math.round(qualityScore * 100)}%
              </span>
            </div>
            <Progress
              value={qualityScore * 100}
              className={cn(
                "h-2",
                qualityScore >= 0.9
                  ? "bg-emerald-200"
                  : qualityScore >= 0.7
                    ? "bg-yellow-200"
                    : "bg-red-200"
              )}
            />
          </div>
        )}

        {/* AI Categorization */}
        {aiCategorization && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-900">
                AI Suggested Category
              </p>
              <Badge variant="secondary" className="text-xs">
                {Math.round(aiCategorization.confidence * 100)}% confident
              </Badge>
            </div>
            <p className="mb-1 text-sm font-medium text-blue-900">
              {aiCategorization.suggestedCategory.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-blue-700">
              {aiCategorization.reasoning}
            </p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-sage-700">
              Smart Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isWarning =
                  tag.tag.includes("missing") ||
                  tag.tag.includes("poor") ||
                  tag.tag.includes("unclear");
                const isGood =
                  tag.tag.includes("excellent") ||
                  tag.tag.includes("certified") ||
                  tag.tag.includes("visible");

                return (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isWarning &&
                        "border-orange-300 bg-orange-50 text-orange-700",
                      isGood &&
                        "border-emerald-300 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {isWarning && "⚠️ "}
                    {isGood && "✓ "}
                    {tag.tag.replace(/_/g, " ")}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-sage-700">
              Recommendations
            </p>
            {recommendations.map((rec, idx) => {
              const isPositive =
                rec.toLowerCase().includes("excellent") ||
                rec.toLowerCase().includes("good");
              const isWarning =
                rec.toLowerCase().includes("low") ||
                rec.toLowerCase().includes("poor") ||
                rec.toLowerCase().includes("try");

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2 rounded-lg border p-2 text-xs",
                    isPositive &&
                      "border-emerald-200 bg-emerald-50 text-emerald-800",
                    isWarning &&
                      "border-orange-200 bg-orange-50 text-orange-800",
                    !isPositive &&
                      !isWarning &&
                      "border-blue-200 bg-blue-50 text-blue-800"
                  )}
                >
                  {isPositive && (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  {isWarning && (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  {!isPositive && !isWarning && (
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span>{rec}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Show/Hide OCR Text */}
        {textLength > 0 && (
          <Button
            onClick={() => setShowOCRText(!showOCRText)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {showOCRText ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Extracted Text
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Extracted Text
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

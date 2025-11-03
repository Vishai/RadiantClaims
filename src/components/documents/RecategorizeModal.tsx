"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Sparkles, Wand2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileCategory } from "./DocumentCategorySelector";
import type {
  DocumentQualificationSummary,
  SupportingDocumentInsight,
} from "./types";
import { Switch } from "@/components/ui/switch";

const ALL_CATEGORIES: FileCategory[] = [
  "IDENTITY",
  "PROOF_OF_RESIDENCE",
  "PATHOLOGY_REPORT",
  "MEDICAL_RECORDS",
  "DISCHARGE_SUMMARY",
  "TUMOR_REGISTRY",
  "TREATMENT_RECORDS",
  "UTILITY_BILL",
  "MORTGAGE_STATEMENT",
  "TAX_RETURN",
  "SCHOOL_RECORDS",
  "EMPLOYMENT_RECORDS",
  "OTHER",
];

const formatCategoryLabel = (category: FileCategory | string) =>
  category
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

interface RecategorizeModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentCategory?: FileCategory | null;
  qualification?: DocumentQualificationSummary | null;
  otherAnalysis?: SupportingDocumentInsight | null;
  aiIntelligence?: {
    aiCategory?: string;
    aiCategoryConfidence?: number;
    aiReasoning?: string;
  } | null;
  isCategoryLocked?: boolean;
  onConfirm: (args: {
    category: FileCategory;
    lockCategory: boolean;
  }) => Promise<void>;
  onKeepSupporting?: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
}

interface RecommendedCategory {
  value: FileCategory;
  label: string;
  context: string;
  confidence?: number;
  highlight?: boolean;
}

export function RecategorizeModal({
  open,
  onClose,
  fileName,
  currentCategory,
  qualification,
  otherAnalysis,
  aiIntelligence,
  isCategoryLocked = false,
  onConfirm,
  onKeepSupporting,
  onDelete,
  isSubmitting = false,
}: RecategorizeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | "">(
    ""
  );
  const [error, setError] = useState<string | null>(null);
  const [lockCategory, setLockCategory] = useState<boolean>(isCategoryLocked);

  const recommendedCategories = useMemo<RecommendedCategory[]>(() => {
    const results: RecommendedCategory[] = [];
    const seen = new Set<FileCategory>();

    const pushUnique = (entry: RecommendedCategory | null) => {
      if (!entry) return;
      if (seen.has(entry.value)) return;
      seen.add(entry.value);
      results.push(entry);
    };

    if (qualification?.categoryMismatch) {
      pushUnique({
        value: qualification.categoryMismatch.aiDetected as FileCategory,
        label: formatCategoryLabel(qualification.categoryMismatch.aiDetected),
        context: qualification.categoryMismatch.shouldUseAiCategory
          ? "AI is confident this is the correct category"
          : "AI suspects this category. Please double-check.",
        confidence: qualification.categoryMismatch.aiConfidence,
        highlight: qualification.categoryMismatch.shouldUseAiCategory,
      });
    }

    if (
      aiIntelligence?.aiCategory &&
      ALL_CATEGORIES.includes(aiIntelligence.aiCategory as FileCategory)
    ) {
      pushUnique({
        value: aiIntelligence.aiCategory as FileCategory,
        label: formatCategoryLabel(aiIntelligence.aiCategory),
        context: "Initial AI categorization",
        confidence: aiIntelligence.aiCategoryConfidence,
      });
    }

    if (otherAnalysis?.possibleCategories?.length) {
      otherAnalysis.possibleCategories.forEach((category) => {
        pushUnique({
          value: category,
          label: formatCategoryLabel(category),
          context: "Similar documents mention this category",
        });
      });
    }

    if (currentCategory && !seen.has(currentCategory)) {
      pushUnique({
        value: currentCategory,
        label: formatCategoryLabel(currentCategory),
        context: "Current category",
      });
    }

    return results;
  }, [qualification, otherAnalysis, aiIntelligence, currentCategory]);

  useEffect(() => {
    if (!open) {
      setSelectedCategory("");
      setError(null);
      setLockCategory(isCategoryLocked);
      return;
    }

    const firstRecommendation = recommendedCategories[0];
    if (firstRecommendation) {
      setSelectedCategory(firstRecommendation.value);
    } else if (currentCategory) {
      setSelectedCategory(currentCategory);
    } else {
      setSelectedCategory("");
    }

    setError(null);
    setLockCategory(isCategoryLocked);
  }, [open, recommendedCategories, currentCategory, isCategoryLocked]);

  const handleConfirm = async () => {
    if (!selectedCategory) {
      setError("Select a category before saving.");
      return;
    }

    setError(null);
    try {
      await onConfirm({
        category: selectedCategory,
        lockCategory,
      });
    } catch (confirmationError) {
      const message =
        confirmationError instanceof Error
          ? confirmationError.message
          : "Failed to recategorize document";
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fix document category</DialogTitle>
          <DialogDescription className="space-y-1 text-xs text-muted-foreground">
            <p>{fileName}</p>
            {qualification?.suggestion && (
              <p className="text-sm text-sage-700">
                {qualification.suggestion}
              </p>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {qualification?.categoryMismatch && (
            <Alert>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-sm font-semibold">
                Category mismatch detected
              </AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">
                {qualification.categoryMismatch.explanation}
              </AlertDescription>
            </Alert>
          )}

          {recommendedCategories.length > 0 && (
            <div className="space-y-3 rounded-lg border border-sage-200 bg-sage-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-sage-900">
                <Sparkles className="h-4 w-4" />
                Recommended categories
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendedCategories.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      selectedCategory === option.value ? "default" : "outline"
                    }
                    className={cn(
                      "flex h-auto flex-col items-start gap-1 whitespace-normal px-3 py-2 text-left text-xs",
                      option.highlight ? "border-emerald-500" : ""
                    )}
                    onClick={() => setSelectedCategory(option.value)}
                  >
                    <span className="text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {option.context}
                    </span>
                    {option.confidence !== undefined && (
                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px] uppercase tracking-wide"
                      >
                        {Math.round(option.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-sage-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sage-900">
              <Wand2 className="h-4 w-4" />
              Choose a category
            </div>
            <Select
              value={selectedCategory || ""}
              onValueChange={(value) => {
                setError(null);
                setSelectedCategory(value as FileCategory);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the correct document type" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-sage-200 bg-white p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-sage-900">
                {lockCategory ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                Lock this category
              </div>
              <p className="text-xs text-muted-foreground">
                Prevent AI from changing this classification automatically.
              </p>
            </div>
            <Switch
              checked={lockCategory}
              onCheckedChange={(value) => setLockCategory(value)}
              disabled={isSubmitting}
            />
          </div>

          {otherAnalysis && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
              <p className="font-semibold">Supporting document insight</p>
              <p className="mt-1 leading-relaxed">
                {otherAnalysis.isPotentiallySupporting
                  ? "This document could still support the claim. Keep it as supporting evidence if it helps with exposure or diagnosis."
                  : "This document looks unrelated to RECA requirements."}
              </p>
              {otherAnalysis.suggestions?.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {otherAnalysis.suggestions.map((suggestion, index) => (
                    <li key={`${suggestion}-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            {onKeepSupporting && (
              <Button
                type="button"
                variant="outline"
                onClick={onKeepSupporting}
                disabled={isSubmitting}
              >
                Keep as supporting
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || !selectedCategory}
            >
              {isSubmitting ? "Saving..." : "Save category"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

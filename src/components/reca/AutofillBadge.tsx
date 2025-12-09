/**
 * Autofill Badge Component
 *
 * Visual indicator showing that a field has been pre-filled from a previous form section
 */

import { Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AutofillBadgeProps {
  sourceLabel: string;
  fieldName?: string;
  variant?: "inline" | "tooltip";
  className?: string;
}

export function AutofillBadge({
  sourceLabel,
  fieldName,
  variant = "inline",
  className = "",
}: AutofillBadgeProps) {
  const badgeContent = (
    <Badge
      variant="secondary"
      className={`bg-sage-100 text-xs text-sage-700 hover:bg-sage-200 ${className}`}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      Auto-filled
    </Badge>
  );

  if (variant === "tooltip") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Pre-filled from <strong>{sourceLabel}</strong>
              {fieldName && (
                <span className="text-gray-500"> ({fieldName})</span>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              You can edit this value if needed
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

/**
 * Autofill Info Banner
 *
 * Shows a prominent message when multiple fields have been auto-filled
 */
export interface AutofillInfoBannerProps {
  autofilledCount: number;
  sources: string[];
  onDismiss?: () => void;
}

export function AutofillInfoBanner({
  autofilledCount,
  sources,
  onDismiss,
}: AutofillInfoBannerProps) {
  if (autofilledCount === 0) return null;

  return (
    <div className="mb-6 rounded-lg border-2 border-sage-200 bg-gradient-to-r from-sage-50 to-cream-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Sparkles className="h-5 w-5 text-sage-600" />
        </div>
        <div className="flex-1">
          <h4 className="mb-1 text-sm font-semibold text-sage-900">
            Smart Form Pre-fill Active
          </h4>
          <p className="text-sm text-sage-700">
            We've pre-filled{" "}
            <strong>
              {autofilledCount} field{autofilledCount > 1 ? "s" : ""}
            </strong>{" "}
            based on information you previously entered
            {sources.length > 0 && (
              <>
                {" "}
                from <strong>{sources.join(", ")}</strong>
              </>
            )}
            .
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-sage-600">
            <Info className="h-3 w-3" />
            You can review and edit any pre-filled values as needed
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-sm text-sage-500 hover:text-sage-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Autofill Field Label
 *
 * Wrapper for form labels that adds an autofill badge when applicable
 */
export interface AutofillFieldLabelProps {
  label: string;
  isAutofilled: boolean;
  sourceLabel?: string;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AutofillFieldLabel({
  label,
  isAutofilled,
  sourceLabel,
  required,
  className = "",
  children,
}: AutofillFieldLabelProps) {
  return (
    <div className={`mb-2 flex items-center justify-between ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {isAutofilled && sourceLabel && (
        <AutofillBadge sourceLabel={sourceLabel} variant="tooltip" />
      )}
      {children}
    </div>
  );
}

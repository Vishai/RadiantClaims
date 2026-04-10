import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HelpTooltip, type HelpTooltipProps } from "./HelpTooltip";

export type FieldImportance = "required" | "recommended" | "optional";

interface FieldLabelProps {
  htmlFor?: string;
  importance?: FieldImportance;
  children: React.ReactNode;
  className?: string;
  /** Optional contextual help popover shown via a help icon */
  helpTooltip?: HelpTooltipProps;
}

const importanceConfig: Record<
  FieldImportance,
  { dot: string; label: string; srLabel: string }
> = {
  required: {
    dot: "bg-red-500",
    label: "text-red-600",
    srLabel: "(Required for DOJ submission)",
  },
  recommended: {
    dot: "bg-amber-400",
    label: "text-amber-600",
    srLabel: "(Recommended for faster processing)",
  },
  optional: {
    dot: "bg-sage-300",
    label: "text-sage-400",
    srLabel: "(Optional)",
  },
};

export function FieldLabel({
  htmlFor,
  importance,
  children,
  className,
  helpTooltip,
}: FieldLabelProps) {
  const config = importance ? importanceConfig[importance] : null;

  return (
    <div className="flex items-center gap-0.5">
      <Label
        htmlFor={htmlFor}
        className={cn("flex items-center gap-1.5", className)}
      >
        {children}
        {config && (
          <>
            <span
              className={cn(
                "inline-block h-2 w-2 flex-shrink-0 rounded-full",
                config.dot
              )}
              aria-hidden="true"
            />
            <span className="sr-only">{config.srLabel}</span>
          </>
        )}
      </Label>
      {helpTooltip && <HelpTooltip {...helpTooltip} />}
    </div>
  );
}

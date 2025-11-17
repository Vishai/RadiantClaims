"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  label?: string;
  value: number;
  statusLabel?: string;
  compact?: boolean;
}

export function ProgressIndicator({
  label,
  value,
  statusLabel,
  compact,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label && <span>{label}</span>}
        {statusLabel && <span>{statusLabel}</span>}
      </div>
      <Progress value={Math.min(100, Math.max(0, value))} className="h-2" />
    </div>
  );
}

"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TooltipContentProps {
  title?: string;
  content: ReactNode;
  onDismiss?: () => void;
  dismissible?: boolean;
  onSnooze?: (() => void) | null;
}

export function TooltipContent({
  title,
  content,
  onDismiss,
  dismissible = true,
  onSnooze,
}: TooltipContentProps) {
  return (
    <div className="max-w-xs rounded-lg border border-border/60 bg-white/95 p-4 text-sm shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          {title && (
            <p className="text-sm font-semibold text-foreground">{title}</p>
          )}
          <div className="text-sm text-muted-foreground">{content}</div>
        </div>
        {dismissible && (
          <button
            type="button"
            className="text-muted-foreground transition hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss tooltip"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {onSnooze && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-3 h-7 px-2 text-xs text-muted-foreground"
          onClick={onSnooze}
        >
          Snooze for later
        </Button>
      )}
    </div>
  );
}

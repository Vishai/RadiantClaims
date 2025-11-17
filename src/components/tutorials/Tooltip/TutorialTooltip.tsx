"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  type Placement,
} from "@floating-ui/react";
import { useTooltipManager } from "./TooltipProvider";
import { TooltipContent } from "./TooltipContent";

interface TutorialTooltipProps {
  id: string;
  title?: string;
  content: ReactNode;
  placement?: Placement;
  showOnce?: boolean;
  dismissible?: boolean;
  snoozeDuration?: number;
  children: ReactElement;
}

export function TutorialTooltip({
  id,
  title,
  content,
  placement = "top",
  showOnce = true,
  dismissible = true,
  snoozeDuration = 7,
  children,
}: TutorialTooltipProps) {
  const tooltipManager = useTooltipManager();
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    const shouldShow = tooltipManager.shouldShowTooltip({
      id,
      content: String(content),
      showOnce,
    });
    if (shouldShow) {
      setOpen(true);
      tooltipManager.markShown(id);
    }
  }, [tooltipManager, id, content, showOnce]);

  if (!children) return null;

  return (
    <span className="inline-flex" ref={refs.setReference}>
      {children}
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 animate-in fade-in-0 zoom-in-95"
          role="status"
        >
          <TooltipContent
            title={title}
            content={content}
            dismissible={dismissible}
            onDismiss={() => {
              tooltipManager.dismiss(id);
              setOpen(false);
            }}
            onSnooze={
              dismissible
                ? () => {
                    tooltipManager.snooze(id, snoozeDuration);
                    setOpen(false);
                  }
                : null
            }
          />
        </div>
      )}
    </span>
  );
}

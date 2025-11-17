"use client";

import { useEffect } from "react";

interface WalkthroughSpotlightProps {
  selector?: string | null;
  active: boolean;
}

export function WalkthroughSpotlight({
  selector,
  active,
}: WalkthroughSpotlightProps) {
  useEffect(() => {
    if (!selector || !active) return;
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;

    const originalPosition = target.style.position;
    if (getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }

    target.classList.add(
      "ring-4",
      "ring-primary/60",
      "rounded-lg",
      "transition-shadow"
    );

    return () => {
      target.classList.remove(
        "ring-4",
        "ring-primary/60",
        "rounded-lg",
        "transition-shadow"
      );
      target.style.position = originalPosition;
    };
  }, [selector, active]);

  return null;
}

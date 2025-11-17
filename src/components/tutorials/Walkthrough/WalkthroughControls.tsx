"use client";

import { Button } from "@/components/ui/button";

interface WalkthroughControlsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export function WalkthroughControls({
  canGoBack,
  canGoNext,
  isLastStep,
  onPrev,
  onNext,
  onSkip,
  onFinish,
}: WalkthroughControlsProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <Button variant="ghost" size="sm" disabled={!canGoBack} onClick={onPrev}>
        Back
      </Button>
      <div className="flex items-center gap-2">
        {!isLastStep && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip walkthrough
          </Button>
        )}
        <Button
          size="sm"
          onClick={isLastStep ? onFinish : onNext}
          disabled={!canGoNext}
        >
          {isLastStep ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

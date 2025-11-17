"use client";

import type { TutorialStepDefinition } from "@/lib/tutorials";

interface WalkthroughStepProps {
  step: TutorialStepDefinition;
}

export function WalkthroughStep({ step }: WalkthroughStepProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Step
        </p>
        <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
      </div>
      <p className="text-base text-muted-foreground">{step.content}</p>
      {step.checklist && step.checklist.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {step.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

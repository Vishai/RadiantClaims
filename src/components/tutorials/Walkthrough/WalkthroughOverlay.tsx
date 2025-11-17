"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTutorialStore, useActiveTutorial } from "@/lib/tutorials/context";
import { sendTutorialAnalyticsEvent } from "@/lib/tutorials/analytics";
import { WalkthroughStep } from "./WalkthroughStep";
import { WalkthroughControls } from "./WalkthroughControls";
import { WalkthroughProgress } from "./WalkthroughProgress";
import { WalkthroughSpotlight } from "./WalkthroughSpotlight";

export default function WalkthroughOverlay() {
  const activeTutorial = useActiveTutorial();
  const setActiveTutorial = useTutorialStore(
    (state) => state.setActiveTutorial
  );
  const bootstrap = useTutorialStore((state) => state.bootstrap);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepStartedAt, setStepStartedAt] = useState<number>(Date.now());
  const lastTutorialKey = useRef<string | null>(null);
  const lastServerStep = useRef<number>(0);

  useEffect(() => {
    if (!activeTutorial) {
      lastTutorialKey.current = null;
      lastServerStep.current = 0;
      return;
    }

    const tutorialKey = activeTutorial.key;
    const serverStep = activeTutorial.currentStep ?? 0;
    const tutorialChanged = tutorialKey !== lastTutorialKey.current;
    const serverAhead = serverStep > lastServerStep.current;

    if (tutorialChanged || serverAhead) {
      lastTutorialKey.current = tutorialKey;
      lastServerStep.current = serverStep;
      setStepIndex(serverStep);
      setStepStartedAt(Date.now());
    }
  }, [activeTutorial]);

  const totalSteps = activeTutorial?.steps.length ?? 0;
  const currentStep = activeTutorial?.steps[stepIndex];
  const isLastStep = stepIndex >= totalSteps - 1;

  useEffect(() => {
    if (!activeTutorial) return;
    sendTutorialAnalyticsEvent({
      type: "STEP_VIEWED",
      tutorialKey: activeTutorial.key,
      userId: "self",
      stepIndex,
    });
  }, [activeTutorial, stepIndex]);

  if (!activeTutorial || !currentStep) {
    return null;
  }

  const closeOverlay = () => setActiveTutorial(null);

  const postProgress = async (
    action: "STEP" | "COMPLETE" | "SKIP",
    nextStepIndex?: number
  ) => {
    try {
      const durationMs = Date.now() - stepStartedAt;
      await fetch("/api/tutorials/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorialKey: activeTutorial.key,
          action,
          stepIndex: nextStepIndex ?? stepIndex,
          durationMs,
        }),
      });
    } catch (error) {
      console.error("[WalkthroughOverlay] Failed to record progress", error);
    }
  };

  const handleNext = async () => {
    const next = Math.min(stepIndex + 1, totalSteps - 1);
    await postProgress("STEP", next);
    setStepIndex(next);
    lastServerStep.current = next;
    setStepStartedAt(Date.now());
  };

  const handlePrev = () => {
    const prev = Math.max(stepIndex - 1, 0);
    setStepIndex(prev);
    lastServerStep.current = prev;
    setStepStartedAt(Date.now());
  };

  const handleFinish = async () => {
    await postProgress("COMPLETE", totalSteps);
    await bootstrap();
    sendTutorialAnalyticsEvent({
      type: "TUTORIAL_COMPLETED",
      tutorialKey: activeTutorial.key,
      userId: "self",
    });
    lastServerStep.current = totalSteps;
    closeOverlay();
  };

  const handleSkip = async () => {
    await postProgress("SKIP", stepIndex);
    await bootstrap();
    sendTutorialAnalyticsEvent({
      type: "TUTORIAL_SKIPPED",
      tutorialKey: activeTutorial.key,
      userId: "self",
    });
    lastServerStep.current = stepIndex;
    closeOverlay();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="walkthrough-overlay"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 p-6">
          <div className="mx-auto flex max-w-3xl flex-col rounded-xl bg-white/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-primary">
                  Walkthrough
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  {activeTutorial.title}
                </h2>
              </div>
              <button
                className="rounded-full border border-border/60 p-2 text-muted-foreground hover:text-foreground"
                onClick={closeOverlay}
                aria-label="Close walkthrough"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <WalkthroughProgress total={totalSteps} current={stepIndex} />
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            </div>

            <div className="mt-6 space-y-6">
              <WalkthroughStep step={currentStep} />
              <WalkthroughControls
                canGoBack={stepIndex > 0}
                canGoNext={!isLastStep || totalSteps === 1}
                isLastStep={isLastStep}
                onPrev={handlePrev}
                onNext={handleNext}
                onSkip={handleSkip}
                onFinish={handleFinish}
              />
            </div>
          </div>
        </div>
        <WalkthroughSpotlight
          selector={currentStep.spotlightTarget ?? undefined}
          active
        />
      </motion.div>
    </AnimatePresence>
  );
}

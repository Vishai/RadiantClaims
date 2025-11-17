import { TutorialStatus } from "@prisma/client";
import type { TutorialDefinition, WalkthroughRuntimeState } from "./types";

interface WalkthroughManagerOptions {
  initialState?: WalkthroughRuntimeState;
}

export class WalkthroughManager {
  private state?: WalkthroughRuntimeState;

  constructor(options: WalkthroughManagerOptions = {}) {
    this.state = options.initialState;
  }

  start(definition: TutorialDefinition) {
    this.state = {
      tutorialKey: definition.key,
      currentStepIndex: 0,
      status: TutorialStatus.IN_PROGRESS,
      steps: definition.steps.map((step) => ({
        id: step.id,
        completed: false,
      })),
    };
  }

  completeStep(stepIndex: number) {
    if (!this.state) return;
    const record = this.state.steps[stepIndex];
    if (record) {
      record.completed = true;
      record.viewedAt = new Date().toISOString();
    }
    this.state.currentStepIndex = Math.min(
      stepIndex + 1,
      this.state.steps.length - 1
    );
  }

  goTo(stepIndex: number) {
    if (!this.state) return;
    this.state.currentStepIndex = Math.max(
      0,
      Math.min(stepIndex, this.state.steps.length - 1)
    );
  }

  finish() {
    if (!this.state) return;
    this.state.status = TutorialStatus.COMPLETED;
    this.state.currentStepIndex = this.state.steps.length;
  }

  skip() {
    if (!this.state) return;
    this.state.status = TutorialStatus.SKIPPED;
  }

  getState(): WalkthroughRuntimeState | undefined {
    return this.state;
  }
}

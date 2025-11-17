import type { UserRole } from "@prisma/client";
import { TutorialManager } from "./tutorial-manager";
import { detectUserStage } from "./journey-detector";
import { tutorialDefinitions } from "./definitions";
import type { TutorialDefinition, TutorialTriggerEvent } from "./types";
import { ClientJourneyStage } from "./types";

interface TutorialTriggerContext {
  userId: string;
  pathname?: string;
  role?: UserRole;
  event?: TutorialTriggerEvent;
  stage?: ClientJourneyStage;
}

export class TutorialEngine {
  private readonly manager: TutorialManager;

  constructor(manager = new TutorialManager()) {
    this.manager = manager;
  }

  async bootstrap() {
    await this.manager.initialize();
  }

  async getEligibleTutorials(context: TutorialTriggerContext) {
    const stage = context.stage ?? (await this.safeDetectStage(context.userId));
    return tutorialDefinitions
      .filter((definition) =>
        this.matchesContext(definition, { ...context, stage })
      )
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  private matchesContext(
    definition: TutorialDefinition,
    context: TutorialTriggerContext & { stage?: ClientJourneyStage }
  ) {
    if (definition.isActive === false) return false;
    if (
      definition.targetRole &&
      context.role &&
      definition.targetRole !== context.role
    )
      return false;
    if (
      definition.targetPages &&
      definition.targetPages.length > 0 &&
      context.pathname &&
      !definition.targetPages.some((page) => context.pathname?.startsWith(page))
    ) {
      return false;
    }
    if (
      definition.triggerEvent &&
      context.event &&
      definition.triggerEvent !== context.event
    )
      return false;
    if (
      definition.journeyStages &&
      context.stage &&
      !definition.journeyStages.includes(context.stage)
    ) {
      return false;
    }
    return true;
  }

  async triggerNextTutorial(context: TutorialTriggerContext) {
    const eligible = await this.getEligibleTutorials(context);
    if (eligible.length === 0) return null;
    const tutorial = eligible[0];
    if (!tutorial) return null;
    await this.manager.startTutorial(context.userId, tutorial.key);
    return tutorial;
  }

  async handleManualLaunch(userId: string, tutorialKey: string) {
    await this.manager.startTutorial(userId, tutorialKey);
    return (
      tutorialDefinitions.find(
        (definition) => definition.key === tutorialKey
      ) ?? null
    );
  }

  private async safeDetectStage(userId: string): Promise<ClientJourneyStage> {
    try {
      return await detectUserStage(userId);
    } catch (error) {
      console.error("[TutorialEngine] Failed to detect user stage", error);
      return ClientJourneyStage.NEW_USER;
    }
  }
}

export const tutorialEngine = new TutorialEngine();

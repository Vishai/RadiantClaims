import type { Tutorial as TutorialModel } from "@prisma/client";
import { TutorialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tutorialDefinitions } from "./definitions";
import type { TutorialDefinition } from "./types";

interface TutorialManagerOptions {
  autoSync?: boolean;
}

export class TutorialManager {
  private readonly shouldAutoSync: boolean;

  constructor(options: TutorialManagerOptions = {}) {
    this.shouldAutoSync = options.autoSync ?? true;
  }

  async initialize() {
    if (!this.shouldAutoSync) return;
    await this.syncDefinitions();
  }

  async syncDefinitions(
    definitions: TutorialDefinition[] = tutorialDefinitions
  ) {
    await Promise.all(
      definitions.map((definition) => this.upsertDefinition(definition))
    );
  }

  private async upsertDefinition(
    definition: TutorialDefinition
  ): Promise<TutorialModel> {
    return prisma.tutorial.upsert({
      where: { key: definition.key },
      create: {
        key: definition.key,
        title: definition.title,
        description: definition.description,
        targetRole: definition.targetRole,
        targetPages: definition.targetPages ?? [],
        triggerEvent: definition.triggerEvent,
        steps: definition.steps as any,
        isRequired: definition.isRequired ?? false,
        priority: definition.priority ?? 0,
        isActive: definition.isActive ?? true,
      },
      update: {
        title: definition.title,
        description: definition.description,
        targetRole: definition.targetRole,
        targetPages: definition.targetPages ?? [],
        triggerEvent: definition.triggerEvent,
        steps: definition.steps as any,
        isRequired: definition.isRequired ?? false,
        priority: definition.priority ?? 0,
        isActive: definition.isActive ?? true,
      },
    });
  }

  async listTutorialsForUser(userId: string) {
    const [tutorials, progress] = await Promise.all([
      prisma.tutorial.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
      }),
      prisma.tutorialProgress.findMany({ where: { userId } }),
    ]);

    const progressMap = new Map(
      progress.map((record) => [record.tutorialId, record])
    );

    return tutorials.map((tutorial) => ({
      tutorial,
      progress: progressMap.get(tutorial.id),
    }));
  }

  async startTutorial(userId: string, tutorialKey: string) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { key: tutorialKey },
    });
    if (!tutorial) throw new Error(`Tutorial ${tutorialKey} not found`);

    await prisma.tutorialProgress.upsert({
      where: { userId_tutorialId: { userId, tutorialId: tutorial.id } },
      create: {
        userId,
        tutorialId: tutorial.id,
        status: TutorialStatus.IN_PROGRESS,
        totalSteps: Array.isArray(tutorial.steps) ? tutorial.steps.length : 0,
      },
      update: {
        status: TutorialStatus.IN_PROGRESS,
        currentStep: 0,
        skippedAt: null,
        completedAt: null,
        lastViewedAt: new Date(),
      },
    });

    return tutorial;
  }

  async recordStep(userId: string, tutorialKey: string, stepIndex: number) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { key: tutorialKey },
    });
    if (!tutorial) throw new Error(`Tutorial ${tutorialKey} not found`);

    return prisma.tutorialProgress.update({
      where: { userId_tutorialId: { userId, tutorialId: tutorial.id } },
      data: {
        currentStep: stepIndex,
        lastViewedAt: new Date(),
      },
    });
  }

  async completeTutorial(userId: string, tutorialKey: string) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { key: tutorialKey },
    });
    if (!tutorial) throw new Error(`Tutorial ${tutorialKey} not found`);

    await prisma.tutorialProgress.update({
      where: { userId_tutorialId: { userId, tutorialId: tutorial.id } },
      data: {
        status: TutorialStatus.COMPLETED,
        currentStep: Array.isArray(tutorial.steps) ? tutorial.steps.length : 0,
        completedAt: new Date(),
        lastViewedAt: new Date(),
      },
    });
  }

  async skipTutorial(userId: string, tutorialKey: string) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { key: tutorialKey },
    });
    if (!tutorial) throw new Error(`Tutorial ${tutorialKey} not found`);

    await prisma.tutorialProgress.upsert({
      where: { userId_tutorialId: { userId, tutorialId: tutorial.id } },
      create: {
        userId,
        tutorialId: tutorial.id,
        status: TutorialStatus.SKIPPED,
        totalSteps: Array.isArray(tutorial.steps) ? tutorial.steps.length : 0,
        skippedAt: new Date(),
      },
      update: {
        status: TutorialStatus.SKIPPED,
        skippedAt: new Date(),
      },
    });
  }
}

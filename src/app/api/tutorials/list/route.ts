import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TutorialStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tutorialEngine } from "@/lib/tutorials";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await tutorialEngine.bootstrap();

  const tutorials = await prisma.tutorial.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
    include: {
      progress: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  const data = tutorials.map((tutorial) => {
    const progress = tutorial.progress[0];
    return {
      key: tutorial.key,
      title: tutorial.title,
      description: tutorial.description,
      steps: tutorial.steps,
      targetPages: tutorial.targetPages,
      triggerEvent: tutorial.triggerEvent,
      isRequired: tutorial.isRequired,
      priority: tutorial.priority,
      status: progress?.status ?? TutorialStatus.NOT_STARTED,
      currentStep: progress?.currentStep ?? 0,
      totalSteps:
        progress?.totalSteps ??
        (Array.isArray(tutorial.steps) ? tutorial.steps.length : 0),
      lastViewedAt: progress?.lastViewedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ data });
}

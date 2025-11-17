import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { TutorialStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectUserStage } from "@/lib/tutorials/journey-detector";

const updateSchema = z.object({
  tutorialKey: z.string(),
  action: z.enum(["STEP", "COMPLETE", "SKIP"]),
  stepIndex: z.number().optional(),
  durationMs: z.number().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [progress, stage] = await Promise.all([
    prisma.tutorialProgress.findMany({
      where: { userId: session.user.id },
      include: {
        tutorial: {
          select: {
            key: true,
            title: true,
          },
        },
      },
      orderBy: { lastViewedAt: "desc" },
    }),
    detectUserStage(session.user.id),
  ]);

  const formatted = progress.map((record) => ({
    tutorialKey: record.tutorial.key,
    title: record.tutorial.title,
    status: record.status,
    currentStep: record.currentStep,
    totalSteps: record.totalSteps,
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
    skippedAt: record.skippedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ progress: formatted, stage });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tutorial = await prisma.tutorial.findUnique({
    where: { key: parsed.data.tutorialKey },
  });
  if (!tutorial) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  const tutorialId = tutorial.id;
  const identifier = {
    userId_tutorialId: { userId: session.user.id, tutorialId },
  };
  const existing = await prisma.tutorialProgress.findUnique({
    where: identifier,
  });
  const totalSteps =
    Array.isArray(tutorial.steps) && tutorial.steps.length > 0
      ? tutorial.steps.length
      : (existing?.totalSteps ?? 0);
  const stepIndex = parsed.data.stepIndex ?? 0;
  const secondsSpent = parsed.data.durationMs
    ? Math.max(1, Math.round(parsed.data.durationMs / 1000))
    : 0;

  if (parsed.data.action === "STEP") {
    if (existing) {
      await prisma.tutorialProgress.update({
        where: identifier,
        data: {
          status: TutorialStatus.IN_PROGRESS,
          currentStep: stepIndex,
          lastViewedAt: new Date(),
          timeSpent: existing.timeSpent + secondsSpent,
          dropOffStep: stepIndex,
          totalSteps,
        },
      });
    } else {
      await prisma.tutorialProgress.create({
        data: {
          userId: session.user.id,
          tutorialId,
          status: TutorialStatus.IN_PROGRESS,
          currentStep: stepIndex,
          totalSteps,
          timeSpent: secondsSpent,
          dropOffStep: stepIndex,
        },
      });
    }
  } else if (parsed.data.action === "COMPLETE") {
    if (!existing) {
      await prisma.tutorialProgress.create({
        data: {
          userId: session.user.id,
          tutorialId,
          status: TutorialStatus.COMPLETED,
          currentStep: totalSteps,
          totalSteps,
          completedAt: new Date(),
          timeSpent: secondsSpent,
        },
      });
    } else {
      await prisma.tutorialProgress.update({
        where: identifier,
        data: {
          status: TutorialStatus.COMPLETED,
          currentStep: totalSteps,
          completedAt: new Date(),
          lastViewedAt: new Date(),
          timeSpent: existing.timeSpent + secondsSpent,
        },
      });
    }
  } else if (parsed.data.action === "SKIP") {
    if (!existing) {
      await prisma.tutorialProgress.create({
        data: {
          userId: session.user.id,
          tutorialId,
          status: TutorialStatus.SKIPPED,
          currentStep: stepIndex,
          totalSteps,
          skippedAt: new Date(),
        },
      });
    } else {
      await prisma.tutorialProgress.update({
        where: identifier,
        data: {
          status: TutorialStatus.SKIPPED,
          skippedAt: new Date(),
          currentStep: stepIndex,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}

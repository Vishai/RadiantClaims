import type { TutorialAnalytics as TutorialAnalyticsModel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TutorialAnalyticsEvent } from "./types";

export async function sendTutorialAnalyticsEvent(
  event: TutorialAnalyticsEvent
) {
  if (typeof window === "undefined") {
    await recordTutorialAnalytics(event);
    return;
  }

  try {
    await fetch("/api/tutorials/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("[TutorialAnalytics] Failed to send event", error);
  }
}

export async function recordTutorialAnalytics(event: TutorialAnalyticsEvent) {
  const tutorial = await prisma.tutorial.findUnique({
    where: { key: event.tutorialKey },
  });
  if (!tutorial) {
    throw new Error(
      `Unable to record analytics for missing tutorial ${event.tutorialKey}`
    );
  }

  const dateKey = startOfDay(new Date(event.timestamp ?? Date.now()));
  const analytics = await prisma.tutorialAnalytics.upsert({
    where: {
      tutorialId_date: {
        tutorialId: tutorial.id,
        date: dateKey,
      },
    },
    update: {},
    create: {
      tutorialId: tutorial.id,
      date: dateKey,
    },
  });

  const next = buildUpdatePayload(event, analytics);
  await prisma.tutorialAnalytics.update({
    where: { id: analytics.id },
    data: next,
  });
}

function buildUpdatePayload(
  event: TutorialAnalyticsEvent,
  analytics: TutorialAnalyticsModel
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (event.type === "TUTORIAL_STARTED") {
    payload.totalViews = analytics.totalViews + 1;
  }
  if (event.type === "TUTORIAL_COMPLETED") {
    payload.totalCompleted = analytics.totalCompleted + 1;
  }
  if (event.type === "TUTORIAL_SKIPPED") {
    payload.totalSkipped = analytics.totalSkipped + 1;
  }
  if (event.type === "STEP_VIEWED") {
    payload.stepDropoffs = incrementStepData(
      analytics.stepDropoffs,
      event.stepIndex
    );
  }
  if (event.type === "STEP_COMPLETED") {
    payload.avgTimePerStep = calculateAverageStepTime(
      analytics.avgTimePerStep,
      event.stepIndex,
      event.durationMs
    );
  }

  return payload;
}

function incrementStepData(raw: unknown, stepIndex?: number) {
  if (stepIndex === undefined) return raw ?? {};
  const map = (raw as Record<string, number>) ?? {};
  const key = String(stepIndex);
  map[key] = (map[key] ?? 0) + 1;
  return map;
}

function calculateAverageStepTime(
  raw: unknown,
  stepIndex?: number,
  durationMs?: number
) {
  if (stepIndex === undefined || durationMs === undefined) return raw ?? {};
  const map = (raw as Record<string, number>) ?? {};
  const key = String(stepIndex);
  const previous = map[key] ?? 0;
  const seconds = durationMs / 1000;
  map[key] = map[key]
    ? Math.round((previous + seconds) / 2)
    : Math.round(seconds);
  return map;
}

function startOfDay(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

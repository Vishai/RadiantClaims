import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { recordTutorialAnalytics } from "@/lib/tutorials/analytics";

const analyticsSchema = z.object({
  type: z.enum([
    "TUTORIAL_STARTED",
    "TUTORIAL_COMPLETED",
    "TUTORIAL_SKIPPED",
    "STEP_VIEWED",
    "STEP_COMPLETED",
    "SIDEBAR_OPENED",
    "TOOLTIP_DISMISSED",
  ]),
  tutorialKey: z.string(),
  stepIndex: z.number().optional(),
  durationMs: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = analyticsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await recordTutorialAnalytics({
    ...parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { TutorialPreference } from "@prisma/client";
import { HelpIntensity } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const preferenceSchema = z.object({
  tooltipsEnabled: z.boolean().optional(),
  walkthroughsEnabled: z.boolean().optional(),
  helpIntensity: z.nativeEnum(HelpIntensity).optional(),
  pageDismissals: z.record(z.any()).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preference = await prisma.tutorialPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json(serializePreference(preference));
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = preferenceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const preference = await prisma.tutorialPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return NextResponse.json(serializePreference(preference));
}

function serializePreference(preference: TutorialPreference) {
  return {
    tooltipsEnabled: preference.tooltipsEnabled,
    walkthroughsEnabled: preference.walkthroughsEnabled,
    helpIntensity: preference.helpIntensity,
    pageDismissals: preference.pageDismissals,
    updatedAt: preference.updatedAt.toISOString(),
  };
}

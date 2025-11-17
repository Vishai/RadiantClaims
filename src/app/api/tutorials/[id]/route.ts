import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TutorialStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tutorial = await prisma.tutorial.findUnique({
    where: { key: params.id },
    include: {
      progress: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  if (!tutorial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const progress = tutorial.progress[0];
  return NextResponse.json({
    key: tutorial.key,
    title: tutorial.title,
    description: tutorial.description,
    steps: tutorial.steps,
    status: progress?.status ?? TutorialStatus.NOT_STARTED,
    currentStep: progress?.currentStep ?? 0,
    totalSteps:
      progress?.totalSteps ??
      (Array.isArray(tutorial.steps) ? tutorial.steps.length : 0),
  });
}

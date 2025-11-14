import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.intakeSession.findMany({
      select: {
        id: true,
        status: true,
        claimType: true,
        currentStep: true,
        isPremiumService: true,
        createdAt: true,
        updatedAt: true,
        lastActivityAt: true,
        recaWorkflowStage: true,
        recaCompletionPercent: true,
        claimant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            state: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        serviceSubscription: {
          select: {
            tier: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            uploadedFiles: true,
            intakeResponses: true,
          },
        },
        claimReadiness: {
          select: {
            readinessScore: true,
            isReadyForSubmission: true,
            staffReviewStatus: true,
          },
        },
      },
      orderBy: {
        lastActivityAt: "desc",
      },
      take: 500, // Limit to recent 500 sessions
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

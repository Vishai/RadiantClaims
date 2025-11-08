import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sampledOnly = searchParams.get("sampledOnly") === "true";

    // Build where clause
    const where: any = {};

    if (status && status !== "all") {
      where.reviewStatus = status;
    }

    if (sampledOnly) {
      where.sampledForReview = true;
    }

    // Get all AI review QA records with related data
    const reviews = await prisma.aIReviewQA.findMany({
      where,
      include: {
        claimReadiness: {
          include: {
            intakeSession: {
              include: {
                claimant: true,
                serviceSubscription: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { sampledForReview: "desc" }, // Sampled reviews first
        { createdAt: "desc" },
      ],
    });

    // Calculate statistics
    const stats = {
      total: reviews.length,
      pending: reviews.filter((r) => r.reviewStatus === "PENDING").length,
      inReview: reviews.filter((r) => r.reviewStatus === "IN_REVIEW").length,
      completed: reviews.filter((r) => r.reviewStatus === "COMPLETED").length,
      sampled: reviews.filter((r) => r.sampledForReview).length,
      averageAccuracy:
        reviews
          .filter((r) => r.aiAccuracyScore !== null)
          .reduce((sum, r) => sum + (r.aiAccuracyScore || 0), 0) /
        Math.max(reviews.filter((r) => r.aiAccuracyScore !== null).length, 1),
    };

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("Error fetching AI review queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI review queue" },
      { status: 500 }
    );
  }
}

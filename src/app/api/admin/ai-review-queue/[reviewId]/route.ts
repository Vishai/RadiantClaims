import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = params;

    const review = await prisma.aIReviewQA.findUnique({
      where: { id: reviewId },
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
                uploadedFiles: {
                  include: {
                    validation: true,
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
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error fetching AI review:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI review" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = params;
    const body = await request.json();

    const {
      reviewStatus,
      aiAccuracyScore,
      readinessScoreMatch,
      correctReadiness,
      completenessAccurate,
      criticalBlockersAccurate,
      warningsAccurate,
      nameConsistencyAccurate,
      datesConsistencyAccurate,
      claimTypeAccurate,
      reviewerNotes,
      aiStrengths,
      aiWeaknesses,
      improvementSuggestions,
      falsePositives,
      falseNegatives,
      correctedAssessment,
    } = body;

    // Build update data
    const updateData: any = {};

    if (reviewStatus) {
      updateData.reviewStatus = reviewStatus;

      // Set timestamps based on status
      if (reviewStatus === "IN_REVIEW" && !updateData.reviewStartedAt) {
        updateData.reviewStartedAt = new Date();
      }
      if (reviewStatus === "COMPLETED") {
        updateData.reviewCompletedAt = new Date();
      }
    }

    // If starting review, set reviewer
    if (reviewStatus === "IN_REVIEW") {
      updateData.reviewerId = session.user.id;
    }

    // Update review fields if provided
    if (aiAccuracyScore !== undefined)
      updateData.aiAccuracyScore = aiAccuracyScore;
    if (readinessScoreMatch !== undefined)
      updateData.readinessScoreMatch = readinessScoreMatch;
    if (correctReadiness !== undefined)
      updateData.correctReadiness = correctReadiness;
    if (completenessAccurate !== undefined)
      updateData.completenessAccurate = completenessAccurate;
    if (criticalBlockersAccurate !== undefined)
      updateData.criticalBlockersAccurate = criticalBlockersAccurate;
    if (warningsAccurate !== undefined)
      updateData.warningsAccurate = warningsAccurate;
    if (nameConsistencyAccurate !== undefined)
      updateData.nameConsistencyAccurate = nameConsistencyAccurate;
    if (datesConsistencyAccurate !== undefined)
      updateData.datesConsistencyAccurate = datesConsistencyAccurate;
    if (claimTypeAccurate !== undefined)
      updateData.claimTypeAccurate = claimTypeAccurate;
    if (reviewerNotes !== undefined) updateData.reviewerNotes = reviewerNotes;
    if (aiStrengths !== undefined) updateData.aiStrengths = aiStrengths;
    if (aiWeaknesses !== undefined) updateData.aiWeaknesses = aiWeaknesses;
    if (improvementSuggestions !== undefined)
      updateData.improvementSuggestions = improvementSuggestions;
    if (falsePositives !== undefined)
      updateData.falsePositives = falsePositives;
    if (falseNegatives !== undefined)
      updateData.falseNegatives = falseNegatives;
    if (correctedAssessment !== undefined)
      updateData.correctedAssessment = correctedAssessment;

    const review = await prisma.aIReviewQA.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        claimReadiness: {
          include: {
            intakeSession: {
              include: {
                claimant: true,
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
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error updating AI review:", error);
    return NextResponse.json(
      { error: "Failed to update AI review" },
      { status: 500 }
    );
  }
}

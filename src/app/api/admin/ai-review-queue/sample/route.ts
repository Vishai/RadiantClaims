import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/ai-review-queue/sample
 * Sample claims for AI review quality assurance
 * Supports configurable sampling rate, date range filtering, and dynamic sampling
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      samplingRate = 0.1,
      maxSamples = 100,
      startDate,
      endDate,
      autoSample = false,
      accuracyThreshold = 75,
    } = body;

    // Build where clause with optional date filtering
    const whereClause: any = {
      aiReviewQA: null,
      staffReviewStatus: {
        in: ["PENDING", "IN_REVIEW", "READY", "APPROVED"],
      },
    };

    // Add date range filtering if provided
    if (startDate || endDate) {
      whereClause.lastAssessedAt = {};
      if (startDate) {
        whereClause.lastAssessedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.lastAssessedAt.lte = new Date(endDate);
      }
    }

    // If auto-sampling, check if we need to sample more based on accuracy
    if (autoSample) {
      const recentReviews = await prisma.aIReviewQA.findMany({
        where: {
          reviewStatus: "COMPLETED",
          aiAccuracyScore: { not: null },
          reviewCompletedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          aiAccuracyScore: true,
        },
      });

      if (recentReviews.length > 0) {
        const avgAccuracy =
          recentReviews.reduce((sum, r) => sum + (r.aiAccuracyScore || 0), 0) /
          recentReviews.length;

        // If accuracy is below threshold, increase sampling rate
        if (avgAccuracy < accuracyThreshold) {
          const increaseFactor = 1 + (accuracyThreshold - avgAccuracy) / 100;
          const adjustedRate = Math.min(samplingRate * increaseFactor, 0.5); // Cap at 50%

          return NextResponse.json({
            message: `Auto-sampling triggered: Recent accuracy (${avgAccuracy.toFixed(1)}%) is below threshold (${accuracyThreshold}%). Increasing sampling rate to ${(adjustedRate * 100).toFixed(1)}%.`,
            shouldIncreaseSampling: true,
            currentAccuracy: avgAccuracy,
            threshold: accuracyThreshold,
            recommendedSamplingRate: adjustedRate,
            adjustedSamplingRate: adjustedRate,
          });
        }
      }
    }

    // Get all ClaimReadiness records that don't have a review yet
    const claimsWithoutReview = await prisma.claimReadiness.findMany({
      where: whereClause,
      select: {
        id: true,
        readinessScore: true,
        isReadyForSubmission: true,
        lastAssessedAt: true,
      },
      orderBy: {
        lastAssessedAt: "desc",
      },
    });

    // Calculate how many to sample
    const sampleCount = Math.min(
      Math.ceil(claimsWithoutReview.length * samplingRate),
      maxSamples
    );

    if (sampleCount === 0) {
      return NextResponse.json({
        message: "No eligible claims found for sampling",
        sampledCount: 0,
        totalEligible: claimsWithoutReview.length,
        samplingRate,
        dateRange: startDate || endDate ? { startDate, endDate } : null,
      });
    }

    // Randomly sample claims
    const shuffled = claimsWithoutReview.sort(() => 0.5 - Math.random());
    const sampled = shuffled.slice(0, sampleCount);

    // Create AIReviewQA records for sampled claims
    const createdReviews = await Promise.all(
      sampled.map((claim) =>
        prisma.aIReviewQA.create({
          data: {
            claimReadinessId: claim.id,
            sampledForReview: true,
            sampledAt: new Date(),
            reviewStatus: "PENDING",
          },
        })
      )
    );

    return NextResponse.json({
      message: `Sampled ${createdReviews.length} claims for review`,
      sampledCount: createdReviews.length,
      totalEligible: claimsWithoutReview.length,
      samplingRate,
      dateRange: startDate || endDate ? { startDate, endDate } : null,
      reviews: createdReviews,
    });
  } catch (error) {
    console.error("Error sampling claims for review:", error);
    return NextResponse.json(
      { error: "Failed to sample claims" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ai-review-queue/sample/stats
 * Get sampling statistics with accuracy trends
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalClaims,
      totalReviews,
      sampledReviews,
      completedReviews,
      averageAccuracy,
      recentAccuracy,
      lowAccuracyReviews,
      claimsEligibleForSampling,
    ] = await Promise.all([
      // Total claims with AI assessments
      prisma.claimReadiness.count(),

      // Total reviews created
      prisma.aIReviewQA.count(),

      // Sampled for review
      prisma.aIReviewQA.count({
        where: { sampledForReview: true },
      }),

      // Completed reviews
      prisma.aIReviewQA.count({
        where: { reviewStatus: "COMPLETED" },
      }),

      // Average accuracy score (all time)
      prisma.aIReviewQA.aggregate({
        _avg: {
          aiAccuracyScore: true,
        },
        where: {
          aiAccuracyScore: { not: null },
        },
      }),

      // Recent accuracy (last 7 days)
      prisma.aIReviewQA.aggregate({
        _avg: {
          aiAccuracyScore: true,
        },
        where: {
          aiAccuracyScore: { not: null },
          reviewCompletedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Count of reviews with accuracy < 75%
      prisma.aIReviewQA.count({
        where: {
          aiAccuracyScore: { lt: 75, not: null },
          reviewStatus: "COMPLETED",
        },
      }),

      // Claims eligible for sampling (no review yet)
      prisma.claimReadiness.count({
        where: {
          aiReviewQA: null,
          staffReviewStatus: {
            in: ["PENDING", "IN_REVIEW", "READY", "APPROVED"],
          },
        },
      }),
    ]);

    const samplingRate = totalClaims > 0 ? totalReviews / totalClaims : 0;
    const reviewCompletionRate =
      sampledReviews > 0 ? completedReviews / sampledReviews : 0;

    const avgAccuracyScore = averageAccuracy._avg?.aiAccuracyScore;
    const recentAvgAccuracyScore = recentAccuracy._avg?.aiAccuracyScore;

    // Determine if we should auto-sample based on recent accuracy
    const shouldAutoSample =
      recentAvgAccuracyScore && recentAvgAccuracyScore < 75;
    const recommendedSamplingRate = shouldAutoSample
      ? Math.min(0.1 * (1 + (75 - recentAvgAccuracyScore) / 100), 0.5)
      : 0.1;

    return NextResponse.json({
      totalClaims,
      totalReviews,
      sampledReviews,
      completedReviews,
      samplingRate: (samplingRate * 100).toFixed(1) + "%",
      reviewCompletionRate: (reviewCompletionRate * 100).toFixed(1) + "%",
      averageAccuracy: avgAccuracyScore?.toFixed(1) || "N/A",
      recentAccuracy: recentAvgAccuracyScore?.toFixed(1) || "N/A",
      lowAccuracyCount: lowAccuracyReviews,
      claimsEligibleForSampling,
      shouldAutoSample,
      recommendedSamplingRate: (recommendedSamplingRate * 100).toFixed(1) + "%",
      alert: shouldAutoSample
        ? `Recent AI accuracy (${recentAvgAccuracyScore?.toFixed(1)}%) is below 75%. Consider increasing sampling rate.`
        : null,
    });
  } catch (error) {
    console.error("Error fetching sampling stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

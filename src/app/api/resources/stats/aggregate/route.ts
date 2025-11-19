import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResourceFeedbackType } from "@prisma/client";

/**
 * API endpoint to aggregate ResourceFeedback into ResourceStats
 * This should be called by a cron job daily to update stats
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      resourcesUpdated: 0,
      errors: [] as string[],
    };

    // Get all resources that have feedback or interactions
    const resourcesWithActivity = await prisma.documentResource.findMany({
      where: {
        OR: [
          { resourceFeedback: { some: {} } },
          { resourceInteractions: { some: {} } },
        ],
      },
      include: {
        resourceFeedback: true,
        resourceInteractions: true,
      },
    });

    console.log(
      `Found ${resourcesWithActivity.length} resources with activity`
    );

    for (const resource of resourcesWithActivity) {
      try {
        const feedback = resource.resourceFeedback;
        // const interactions = resource.resourceInteractions;

        // Calculate usage stats
        const totalSearches = resource.searchCount || 0;
        const totalSelections = resource.selectionCount || 0;
        const totalFeedback = feedback.length;

        // Calculate feedback breakdown
        const helpfulCount = feedback.filter(
          (f) => f.wasHelpful === true
        ).length;
        const notHelpfulCount = feedback.filter(
          (f) => f.wasHelpful === false
        ).length;
        const contactedCount = feedback.filter(
          (f) =>
            f.feedbackType === ResourceFeedbackType.CONTACTED ||
            f.feedbackType === ResourceFeedbackType.DOCUMENT_OBTAINED
        ).length;
        const successCount = feedback.filter(
          (f) => f.successfullyObtained === true
        ).length;

        // Calculate averages
        const ratingsWithValues = feedback.filter(
          (f) => f.rating !== null && f.rating !== undefined
        );
        const avgRating =
          ratingsWithValues.length > 0
            ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) /
              ratingsWithValues.length
            : null;

        const costsWithValues = feedback.filter(
          (f) => f.actualCost !== null && f.actualCost !== undefined
        );
        const avgActualCost =
          costsWithValues.length > 0
            ? costsWithValues.reduce((sum, f) => sum + (f.actualCost || 0), 0) /
              costsWithValues.length
            : null;

        const processingWithValues = feedback.filter(
          (f) =>
            f.actualProcessingDays !== null &&
            f.actualProcessingDays !== undefined
        );
        const avgProcessingDays =
          processingWithValues.length > 0
            ? processingWithValues.reduce(
                (sum, f) => sum + (f.actualProcessingDays || 0),
                0
              ) / processingWithValues.length
            : null;

        // Most common response time
        const responseTimes = feedback
          .filter((f) => f.responseTime)
          .map((f) => f.responseTime!);
        const responseTimeCount: Record<string, number> = {};
        responseTimes.forEach((rt) => {
          responseTimeCount[rt] = (responseTimeCount[rt] || 0) + 1;
        });
        const avgResponseTime =
          responseTimes.length > 0
            ? Object.entries(responseTimeCount).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0] || null
            : null;

        // Quality indicators
        const helpfulnessRate =
          helpfulCount + notHelpfulCount > 0
            ? (helpfulCount / (helpfulCount + notHelpfulCount)) * 100
            : null;

        const successRate =
          contactedCount > 0 ? (successCount / contactedCount) * 100 : null;

        // Last feedback date
        const lastFeedbackAt =
          feedback.length > 0
            ? feedback.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0]?.createdAt
            : null;

        // Upsert ResourceStats
        await prisma.resourceStats.upsert({
          where: { resourceId: resource.id },
          create: {
            resourceId: resource.id,
            totalSearches,
            totalSelections,
            totalFeedback,
            helpfulCount,
            notHelpfulCount,
            contactedCount,
            successCount,
            avgRating,
            avgActualCost,
            avgProcessingDays,
            avgResponseTime,
            helpfulnessRate,
            successRate,
            lastFeedbackAt,
          },
          update: {
            totalSearches,
            totalSelections,
            totalFeedback,
            helpfulCount,
            notHelpfulCount,
            contactedCount,
            successCount,
            avgRating,
            avgActualCost,
            avgProcessingDays,
            avgResponseTime,
            helpfulnessRate,
            successRate,
            lastFeedbackAt,
            updatedAt: new Date(),
          },
        });

        results.resourcesUpdated++;
        console.log(
          `Updated stats for resource ${resource.id} (${resource.name})`
        );
      } catch (error) {
        const errorMsg = `Failed to update stats for resource ${resource.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in stats aggregation job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing/manual trigger
export async function GET(request: NextRequest) {
  return POST(request);
}

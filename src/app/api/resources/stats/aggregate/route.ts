import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResourceFeedbackType } from "@prisma/client";
import { db } from "@/lib/db";
import { subDays, format } from "date-fns";

/**
 * Combined Early Morning Cron Job
 *
 * Runs daily at 2 AM UTC to:
 * 1. Scrape latest DOJ claim data from justice.gov
 * 2. Aggregate ResourceFeedback into ResourceStats
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
      dojScrapingSuccess: false,
      errors: [] as string[],
    };

    // SCRAPE DOJ DATA
    console.log("\n🌐 Scraping latest DOJ claim data...");
    try {
      // Scrape yesterday's data (today's might not be available yet)
      const yesterday = subDays(new Date(), 1);
      yesterday.setHours(7, 0, 0, 0); // Set to 7 AM to match data timestamp

      const dateStr = format(yesterday, "MMddyyyy");
      const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

      // Fetch with simple HTTP (works better than Puppeteer - no bot detection)
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse the HTML using the same function as /api/doj/scrape
      const downwinderMatch = html.match(
        /Downwinder[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
      );

      if (downwinderMatch) {
        const extractNumber = (text: string | undefined): number => {
          if (!text) return 0;
          return parseInt(text.replace(/,/g, ""), 10);
        };

        const extractPercent = (text: string | undefined): number => {
          if (!text) return 0;
          return parseFloat(text);
        };

        const stats = {
          pending: extractNumber(downwinderMatch[1]),
          approved: extractNumber(downwinderMatch[2]),
          approvalPercent: extractPercent(downwinderMatch[3]),
          dollarsApproved: extractNumber(downwinderMatch[4]),
          denied: extractNumber(downwinderMatch[5]),
          totalClaims: extractNumber(downwinderMatch[6]),
        };

        // Get yesterday's data for calculating deltas
        const dayBefore = subDays(yesterday, 1);
        const yesterdayData = await db.dOJDailyStats.findUnique({
          where: {
            reportDate_claimCategory: {
              reportDate: dayBefore,
              claimCategory: "DOWNWINDER",
            },
          },
        });

        const dailyApproved = yesterdayData
          ? stats.approved - yesterdayData.approved
          : null;
        const dailyDenied = yesterdayData
          ? stats.denied - yesterdayData.denied
          : null;
        const dailySubmitted =
          yesterdayData && dailyApproved !== null && dailyDenied !== null
            ? stats.pending +
              dailyApproved +
              dailyDenied -
              yesterdayData.pending
            : null;

        // Store in database
        await db.dOJDailyStats.upsert({
          where: {
            reportDate_claimCategory: {
              reportDate: yesterday,
              claimCategory: "DOWNWINDER",
            },
          },
          create: {
            reportDate: yesterday,
            claimCategory: "DOWNWINDER",
            pending: stats.pending,
            approved: stats.approved,
            approvalPercent: stats.approvalPercent,
            dollarsApproved: stats.dollarsApproved,
            denied: stats.denied,
            totalClaims: stats.totalClaims,
            dailyApproved,
            dailyDenied,
            dailySubmitted,
            scrapingSuccess: true,
            dataSource: "http_scraper",
          },
          update: {
            pending: stats.pending,
            approved: stats.approved,
            approvalPercent: stats.approvalPercent,
            dollarsApproved: stats.dollarsApproved,
            denied: stats.denied,
            totalClaims: stats.totalClaims,
            dailyApproved,
            dailyDenied,
            dailySubmitted,
            scrapingSuccess: true,
            dataSource: "http_scraper",
            scrapingError: null,
          },
        });

        results.dojScrapingSuccess = true;
        console.log(
          `✅ Successfully scraped DOJ data for ${format(yesterday, "MM/dd/yyyy")}`
        );
      } else {
        throw new Error("Could not parse Downwinder data from HTML");
      }
    } catch (dojError) {
      const errorMsg = `Failed to scrape DOJ data: ${dojError}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
      // Don't fail the entire job if DOJ scraping fails
    }

    // AGGREGATE RESOURCE STATS
    console.log("\n📊 Aggregating resource feedback stats...");

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

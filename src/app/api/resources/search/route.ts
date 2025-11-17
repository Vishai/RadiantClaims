import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";

/**
 * GET /api/resources/search
 *
 * Search for document resources by state, county, and resource type.
 * Used to help users find where to obtain documents for their RECA claim.
 *
 * Query params:
 * - state: Two-letter state code (e.g., "UT", "NV")
 * - county: County name (optional)
 * - resourceType: Type of resource (e.g., "VITAL_RECORDS", "HOSPITAL")
 * - documentType: What document they need (e.g., "BIRTH_CERTIFICATE")
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const county = searchParams.get("county");
    const resourceType = searchParams.get(
      "resourceType"
    ) as ResourceType | null;
    const documentType = searchParams.get("documentType");

    // Build query filters
    const where: any = {};

    if (state) {
      where.state = state.toUpperCase();
    }

    if (county) {
      where.county = {
        equals: county,
        mode: "insensitive" as const,
      };
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (documentType) {
      where.documentTypesProvided = {
        has: documentType,
      };
    }

    // Search for resources
    const resources = await prisma.documentResource.findMany({
      where,
      orderBy: [
        { county: "asc" }, // County-level resources first
        { name: "asc" },
      ],
    });

    // Fetch stats for all resources
    const resourceIds = resources.map((r) => r.id);
    const stats = await prisma.resourceStats.findMany({
      where: {
        resourceId: { in: resourceIds },
      },
      select: {
        resourceId: true,
        totalFeedback: true,
        successCount: true,
        contactedCount: true,
        successRate: true,
        avgRating: true,
      },
    });

    // Create stats map
    const statsMap = new Map(stats.map((s) => [s.resourceId, s]));

    // Attach stats to resources
    const resourcesWithStats = resources.map((resource) => {
      const resourceStats = statsMap.get(resource.id);
      return {
        ...resource,
        stats: resourceStats
          ? {
              totalFeedback: resourceStats.totalFeedback,
              successCount: resourceStats.successCount,
              contactedCount: resourceStats.contactedCount,
              successRate: resourceStats.successRate,
              avgRating: resourceStats.avgRating,
            }
          : undefined,
      };
    });

    // If no county-specific results and county was specified, also get state-level resources
    if (resources.length === 0 && county) {
      const stateWideResources = await prisma.documentResource.findMany({
        where: {
          ...where,
          county: null, // State-wide only
        },
        orderBy: { name: "asc" },
      });

      // Fetch stats for state-wide resources
      const stateWideIds = stateWideResources.map((r) => r.id);
      const stateWideStats = await prisma.resourceStats.findMany({
        where: {
          resourceId: { in: stateWideIds },
        },
        select: {
          resourceId: true,
          totalFeedback: true,
          successCount: true,
          contactedCount: true,
          successRate: true,
          avgRating: true,
        },
      });

      const stateWideStatsMap = new Map(
        stateWideStats.map((s) => [s.resourceId, s])
      );

      const stateWideWithStats = stateWideResources.map((resource) => {
        const resourceStats = stateWideStatsMap.get(resource.id);
        return {
          ...resource,
          stats: resourceStats
            ? {
                totalFeedback: resourceStats.totalFeedback,
                successCount: resourceStats.successCount,
                contactedCount: resourceStats.contactedCount,
                successRate: resourceStats.successRate,
                avgRating: resourceStats.avgRating,
              }
            : undefined,
        };
      });

      return NextResponse.json({
        resources: stateWideWithStats,
        resultsType: "state_wide",
        message: `No ${county} County resources found. Showing state-wide options.`,
      });
    }

    return NextResponse.json({
      resources: resourcesWithStats,
      resultsType: county ? "county_specific" : "state_wide",
      count: resourcesWithStats.length,
    });
  } catch (error) {
    console.error("Error searching resources:", error);
    return NextResponse.json(
      { error: "Failed to search resources" },
      { status: 500 }
    );
  }
}

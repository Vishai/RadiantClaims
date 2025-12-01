import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";
import { searchContactsWithAI } from "@/lib/contact-agent/web-search";

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
    const city = searchParams.get("city"); // Added city param
    const resourceType = searchParams.get(
      "resourceType"
    ) as ResourceType | null;
    const documentType = searchParams.get("documentType");
    const query = searchParams.get("query") || searchParams.get("name"); // Generic search query

    console.log(
      `[API Search] Parameters: query="${query}", state="${state}", county="${county}", city="${city}", resourceType="${resourceType}"`
    );

    // Build query filters
    const where: any = {};

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

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

    // Search for resources (we'll sort after attaching stats)
    const resources = await prisma.documentResource.findMany({
      where,
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

    // Sort by best quality first
    // Priority:
    // 1. Resources with stats (rated resources first)
    // 2. High success rate
    // 3. High avg rating
    // 4. Number of feedbacks (more is better)
    // 5. County-specific over state-wide
    // 6. Name alphabetically
    resourcesWithStats.sort((a, b) => {
      const aHasStats = a.stats && a.stats.totalFeedback >= 3;
      const bHasStats = b.stats && b.stats.totalFeedback >= 3;

      // Resources with sufficient stats come first
      if (aHasStats && !bHasStats) return -1;
      if (!aHasStats && bHasStats) return 1;

      // Both have stats - compare quality
      if (aHasStats && bHasStats) {
        // Sort by success rate (higher is better)
        const aSuccess = a.stats!.successRate || 0;
        const bSuccess = b.stats!.successRate || 0;
        if (aSuccess !== bSuccess) {
          return bSuccess - aSuccess; // Descending
        }

        // If success rates are equal, sort by avg rating
        const aRating = a.stats!.avgRating || 0;
        const bRating = b.stats!.avgRating || 0;
        if (aRating !== bRating) {
          return bRating - aRating; // Descending
        }

        // If ratings are equal, sort by number of feedbacks
        const aFeedback = a.stats!.totalFeedback;
        const bFeedback = b.stats!.totalFeedback;
        if (aFeedback !== bFeedback) {
          return bFeedback - aFeedback; // Descending
        }
      }

      // County-specific resources before state-wide
      if (a.county && !b.county) return -1;
      if (!a.county && b.county) return 1;

      // Finally, alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // If no results found in DB, try Web Search
    console.log(
      `[API Search] Web search check: resourcesWithStats.length=${resourcesWithStats.length}, query="${query}"`
    );
    if (resourcesWithStats.length === 0 && query) {
      console.log(
        `No internal resources found for "${query}". Falling back to AI web search (Google).`
      );

      // Perform web search using Google (via Serper) + OpenAI Parsing
      const searchQuery = `${query} ${city || ""} Hospital`;
      console.log(`[Web Search] Executing search with query: "${searchQuery}"`);

      const webContacts = await searchContactsWithAI({
        query: searchQuery,
        state: state || undefined,
        county: county || undefined,
      });

      console.log(`[Web Search] Found ${webContacts.length} contacts from AI`);
      console.log(
        `[Web Search] Raw contacts:`,
        JSON.stringify(webContacts, null, 2)
      );

      if (webContacts.length > 0) {
        // Map to Resource format
        const webResources = webContacts.map((contact, index) => ({
          id: `web-${index}`,
          name: contact.name,
          resourceType: "HOSPITAL",
          address: contact.address || null,
          city: contact.city || null,
          county: contact.county || null,
          state: contact.state || null,
          zip: null,
          phone: contact.phone || null,
          email: contact.email || null,
          website: contact.website || null,
          yearOpened: contact.yearOpened || null,
          yearClosed: contact.yearClosed || null,
          stillOperating:
            contact.stillOperating !== undefined
              ? contact.stillOperating
              : null,
          notes: contact.notes || "Found via web search",
          isVetted: false, // Explicitly mark as not vetted
          documentTypesProvided: [],
          requirements: [],
          fees: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        console.log(
          `[Web Search] Returning ${webResources.length} mapped resources`
        );

        return NextResponse.json({
          resources: webResources,
          resultsType: "web_search",
          count: webResources.length,
          message: "Found results via web search.",
        });
      }
    }

    // If no county-specific results and county was specified (and no web results), also get state-level resources
    console.log(
      `[API Search] Checking county fallback: resources.length=${resources.length}, county="${county}"`
    );
    if (resources.length === 0 && county) {
      console.log(
        `[API Search] Falling back to state-wide resources (county was specified but no results)`
      );
      const stateWideResources = await prisma.documentResource.findMany({
        where: {
          ...where,
          county: null, // State-wide only
        },
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

      // Sort state-wide resources by quality too
      stateWideWithStats.sort((a, b) => {
        const aHasStats = a.stats && a.stats.totalFeedback >= 3;
        const bHasStats = b.stats && b.stats.totalFeedback >= 3;

        if (aHasStats && !bHasStats) return -1;
        if (!aHasStats && bHasStats) return 1;

        if (aHasStats && bHasStats) {
          const aSuccess = a.stats!.successRate || 0;
          const bSuccess = b.stats!.successRate || 0;
          if (aSuccess !== bSuccess) return bSuccess - aSuccess;

          const aRating = a.stats!.avgRating || 0;
          const bRating = b.stats!.avgRating || 0;
          if (aRating !== bRating) return bRating - aRating;

          const aFeedback = a.stats!.totalFeedback;
          const bFeedback = b.stats!.totalFeedback;
          if (aFeedback !== bFeedback) return bFeedback - aFeedback;
        }

        return a.name.localeCompare(b.name);
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

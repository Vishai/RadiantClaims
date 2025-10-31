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

    // If no county-specific results and county was specified, also get state-level resources
    if (resources.length === 0 && county) {
      const stateWideResources = await prisma.documentResource.findMany({
        where: {
          ...where,
          county: null, // State-wide only
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        resources: stateWideResources,
        resultsType: "state_wide",
        message: `No ${county} County resources found. Showing state-wide options.`,
      });
    }

    return NextResponse.json({
      resources,
      resultsType: county ? "county_specific" : "state_wide",
      count: resources.length,
    });
  } catch (error) {
    console.error("Error searching resources:", error);
    return NextResponse.json(
      { error: "Failed to search resources" },
      { status: 500 }
    );
  }
}

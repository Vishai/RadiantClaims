import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";

/**
 * POST /api/admin/resources/import
 *
 * Import contact resources into the database
 * This is used by Python scripts or manual imports to populate the DocumentResource table
 *
 * Body:
 * - resources: Array of contact resource objects
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can import resources
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { resources } = body;

    if (!resources || !Array.isArray(resources)) {
      return NextResponse.json(
        { error: "Resources array is required" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const resource of resources) {
      try {
        // Validate required fields
        if (!resource.state || !resource.name || !resource.resourceType) {
          results.errors.push(
            `Skipped resource: Missing required fields (state: ${resource.state}, name: ${resource.name})`
          );
          results.skipped++;
          continue;
        }

        // Check if resource already exists (by name, state, county)
        const existing = await prisma.documentResource.findFirst({
          where: {
            name: resource.name,
            state: resource.state,
            county: resource.county || null,
          },
        });

        const data = {
          state: resource.state.toUpperCase(),
          county: resource.county || null,
          resourceType: resource.resourceType as ResourceType,
          name: resource.name,
          department: resource.department || null,
          address: resource.address || null,
          address2: resource.address2 || null,
          city: resource.city || null,
          stateCode: resource.stateCode || resource.state.toUpperCase(),
          zipCode: resource.zipCode || null,
          phone: resource.phone || null,
          phoneTollFree: resource.phoneTollFree || null,
          fax: resource.fax || null,
          website: resource.website || null,
          email: resource.email || null,
          notes: resource.notes || null,
          documentTypesProvided: resource.documentTypesProvided || [],
          certificationAvailable:
            resource.certificationAvailable !== undefined
              ? resource.certificationAvailable
              : true,
          processingTimeDays: resource.processingTimeDays || null,
          specialInstructions: resource.specialInstructions || null,
          isTribal: resource.isTribal || false,
          tribalAffiliation: resource.tribalAffiliation || null,
          purposeDescription: resource.purposeDescription || null,
          whatToBring: resource.whatToBring || [],
          appointmentRequired: resource.appointmentRequired || false,
          acceptsMailRequests:
            resource.acceptsMailRequests !== undefined
              ? resource.acceptsMailRequests
              : true,
          acceptsOnlineRequests: resource.acceptsOnlineRequests || false,
          estimatedCost: resource.estimatedCost || null,
        };

        if (existing) {
          // Update existing resource
          await prisma.documentResource.update({
            where: { id: existing.id },
            data,
          });
          results.updated++;
        } else {
          // Create new resource
          await prisma.documentResource.create({
            data,
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(
          `Error importing ${resource.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
    });
  } catch (error) {
    console.error("Resource import error:", error);
    return NextResponse.json(
      {
        error: "Failed to import resources",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

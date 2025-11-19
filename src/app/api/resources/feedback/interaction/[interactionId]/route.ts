import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/resources/feedback/interaction/[interactionId]
 *
 * Fetch interaction details for the feedback form
 */
export async function GET(
  _request: Request,
  { params }: { params: { interactionId: string } }
) {
  try {
    const { interactionId } = params;

    const interaction = await prisma.resourceInteraction.findUnique({
      where: { id: interactionId },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            resourceType: true,
            state: true,
            county: true,
          },
        },
      },
    });

    if (!interaction) {
      return NextResponse.json(
        { error: "Interaction not found" },
        { status: 404 }
      );
    }

    // Check if feedback already submitted for this interaction
    if (interaction.followUpCompletedAt) {
      return NextResponse.json(
        { error: "Feedback already submitted for this interaction" },
        { status: 410 } // Gone
      );
    }

    return NextResponse.json({
      id: interaction.id,
      resource: interaction.resource,
      documentType: interaction.documentType,
      searchQuery: interaction.searchQuery,
      createdAt: interaction.createdAt,
    });
  } catch (error) {
    console.error("Error fetching interaction:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch interaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

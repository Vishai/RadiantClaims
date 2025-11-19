import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/documents/tracking
 * Get all document tracking statuses for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user's claimant record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimants: {
          include: {
            documentStatuses: {
              include: {
                resourceContacted: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!user || user.claimants.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    const claimant = user.claimants[0]; // Primary claimant

    if (!claimant) {
      return NextResponse.json({ documents: [] });
    }

    // Get resource interactions to enrich tracking data
    const interactions = await prisma.resourceInteraction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        resource: true,
        feedback: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine document statuses with interactions
    const trackingData = claimant.documentStatuses.map((docStatus) => {
      // Find related interactions
      const relatedInteractions = interactions.filter(
        (i) => i.documentType === docStatus.documentType
      );

      return {
        id: docStatus.id,
        documentType: docStatus.documentType,
        status: docStatus.status,
        requestedDate: docStatus.requestedDate,
        receivedDate: docStatus.receivedDate,
        uploadedDate: docStatus.uploadedDate,
        notes: docStatus.notes,
        resourceContacted: docStatus.resourceContacted
          ? {
              id: docStatus.resourceContacted.id,
              name: docStatus.resourceContacted.name,
              resourceType: docStatus.resourceContacted.resourceType,
              phone: docStatus.resourceContacted.phone,
              email: docStatus.resourceContacted.email,
              website: docStatus.resourceContacted.website,
            }
          : null,
        interactions: relatedInteractions.map((i) => ({
          id: i.id,
          resource: {
            id: i.resource.id,
            name: i.resource.name,
            resourceType: i.resource.resourceType,
          },
          shownAt: i.createdAt,
          followUpScheduledFor: i.followUpScheduledFor,
          followUpCompletedAt: i.followUpCompletedAt,
          hasFeedback: !!i.feedback,
        })),
      };
    });

    // Also get interactions that don't have document statuses yet
    const trackedDocTypes = new Set(
      claimant.documentStatuses.map((ds) => ds.documentType)
    );
    const untrackedInteractions = interactions
      .filter((i) => !trackedDocTypes.has(i.documentType))
      .reduce((acc, interaction) => {
        if (!acc.has(interaction.documentType)) {
          acc.set(interaction.documentType, {
            documentType: interaction.documentType,
            status: "NOT_STARTED",
            interactions: [],
          });
        }
        acc.get(interaction.documentType)!.interactions.push({
          id: interaction.id,
          resource: {
            id: interaction.resource.id,
            name: interaction.resource.name,
            resourceType: interaction.resource.resourceType,
          },
          shownAt: interaction.createdAt,
          followUpScheduledFor: interaction.followUpScheduledFor,
          followUpCompletedAt: interaction.followUpCompletedAt,
          hasFeedback: !!interaction.feedback,
        });
        return acc;
      }, new Map());

    const allTracking = [
      ...trackingData,
      ...Array.from(untrackedInteractions.values()),
    ];

    return NextResponse.json({
      claimantId: claimant.id,
      documents: allTracking,
    });
  } catch (error) {
    console.error("Error fetching document tracking:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch document tracking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/tracking
 * Update document tracking status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentType, status, resourceId, notes } = body;

    if (!documentType || !status) {
      return NextResponse.json(
        { error: "documentType and status are required" },
        { status: 400 }
      );
    }

    // Find the user's claimant record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimants: true,
      },
    });

    if (!user || user.claimants.length === 0) {
      return NextResponse.json({ error: "No claimant found" }, { status: 404 });
    }

    const claimant = user.claimants[0];

    // Prepare status update data
    const statusData: any = {
      status,
      notes: notes || undefined,
    };

    // Set dates based on status
    if (status === "REQUESTED" && !statusData.requestedDate) {
      statusData.requestedDate = new Date();
    }
    if (status === "RECEIVED" && !statusData.receivedDate) {
      statusData.receivedDate = new Date();
    }
    if (status === "UPLOADED" && !statusData.uploadedDate) {
      statusData.uploadedDate = new Date();
    }

    // Add resource if provided
    if (resourceId) {
      statusData.resourceContactedId = resourceId;
    }

    // Upsert document status
    const documentStatus = await prisma.claimantDocumentStatus.upsert({
      where: {
        claimantId_documentType: {
          claimantId: claimant?.id || "unknown",
          documentType,
        },
      },
      create: {
        claimantId: claimant?.id || "unknown",
        documentType,
        ...statusData,
      },
      update: statusData,
      include: {
        resourceContacted: true,
      },
    });

    return NextResponse.json({
      success: true,
      documentStatus,
    });
  } catch (error) {
    console.error("Error updating document tracking:", error);
    return NextResponse.json(
      {
        error: "Failed to update document tracking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

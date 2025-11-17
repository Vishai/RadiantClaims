import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * POST /api/resources/feedback/immediate
 *
 * Handle immediate thumbs up/down feedback when resource is shown
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { resourceId, interactionId, helpful, reason } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    // Skip web-imported resources (they have temporary IDs that aren't in DB yet)
    if (resourceId.startsWith("web-")) {
      return NextResponse.json({
        success: true,
        message: "Web-imported resources don't support feedback yet",
      });
    }

    // Get user info
    const userId = session?.user?.id;
    const headersList = headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    let interaction;

    if (interactionId) {
      // Update existing interaction
      interaction = await prisma.resourceInteraction.update({
        where: { id: interactionId },
        data: {
          immediatelyHelpful: helpful,
          immediateFeedbackAt: new Date(),
          immediateComments: reason || undefined,
        },
      });
    } else {
      // Create new interaction (shouldn't happen, but handle it)
      interaction = await prisma.resourceInteraction.create({
        data: {
          resourceId,
          userId,
          documentType: "UNKNOWN", // We don't have this context here
          shownVia: "chat_bot",
          immediatelyHelpful: helpful,
          immediateFeedbackAt: new Date(),
          immediateComments: reason || undefined,
          // Schedule follow-up for 3 days from now
          followUpScheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Update resource search/selection counts
    await prisma.documentResource.update({
      where: { id: resourceId },
      data: {
        selectionCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
    });
  } catch (error) {
    console.error("Immediate feedback error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

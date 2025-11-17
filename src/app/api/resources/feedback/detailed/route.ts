import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { sendResourceSuccessEmail } from "@/lib/email";

/**
 * POST /api/resources/feedback/detailed
 *
 * Submit detailed feedback from the follow-up form
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      interactionId,
      resourceId,
      didContact,
      responseTime,
      gotDocument,
      rating,
      actualCost,
      processingDays,
      comments,
      documentType,
    } = body;

    if (!interactionId || !resourceId) {
      return NextResponse.json(
        { error: "interactionId and resourceId are required" },
        { status: 400 }
      );
    }

    // Get user info
    const userId = session?.user?.id;
    const headersList = headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    // Determine feedback type based on responses
    let feedbackType: string;
    if (didContact === false || didContact === "no") {
      feedbackType = "NOT_CONTACTED";
    } else if (didContact && gotDocument) {
      feedbackType = "SUCCESS";
    } else if (didContact && !gotDocument) {
      feedbackType = "NO_RESPONSE";
    } else {
      feedbackType = "GENERAL";
    }

    // Determine successful outcome
    const successfullyObtained = gotDocument === true || gotDocument === "yes";

    // Create feedback record
    const feedback = await prisma.resourceFeedback.create({
      data: {
        resourceId,
        userId,
        feedbackType: feedbackType as any,
        rating: rating || null,
        wasHelpful:
          didContact && successfullyObtained ? true : didContact ? null : false,
        documentType: documentType || null,
        comments: comments || null,
        contactedAt: didContact ? new Date() : null,
        responseTime: responseTime || null,
        successfullyObtained,
        actualCost: actualCost || null,
        actualProcessingDays: processingDays || null,
        ipAddress,
        userAgent,
      },
    });

    // Update the interaction record and get the full interaction with resource
    const updatedInteraction = await prisma.resourceInteraction.update({
      where: { id: interactionId },
      data: {
        feedbackId: feedback.id,
        followUpCompletedAt: new Date(),
      },
      include: {
        resource: true,
      },
    });

    // Update resource stats
    await prisma.resourceStats.upsert({
      where: { resourceId },
      create: {
        resourceId,
        totalInteractions: 1,
        totalFeedback: 1,
        ...(didContact && { totalContacted: 1 }),
        ...(successfullyObtained && { totalSuccess: 1 }),
      },
      update: {
        totalInteractions: { increment: 1 },
        totalFeedback: { increment: 1 },
        ...(didContact && { totalContacted: { increment: 1 } }),
        ...(successfullyObtained && { totalSuccess: { increment: 1 } }),
      },
    });

    // Send success email if they successfully obtained the document
    if (successfullyObtained && updatedInteraction.email) {
      try {
        const baseUrl =
          process.env.NEXTAUTH_URL || "https://app.radiantclaims.com";
        const uploadUrl = `${baseUrl}/portal/documents`; // Or specific upload page

        await sendResourceSuccessEmail({
          to: updatedInteraction.email,
          claimantName: undefined, // Could get from User table if needed
          officeName: updatedInteraction.resource.officeName,
          documentType: updatedInteraction.documentType,
          uploadUrl,
        });

        console.log(
          `Sent success email to ${updatedInteraction.email} for interaction ${interactionId}`
        );
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send success email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error("Detailed feedback error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ValidationStatus } from "@prisma/client";
import { sendDocumentValidatedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { validationId, decision, notes } = body;

    if (!validationId || !decision) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate decision
    if (decision !== "STAFF_APPROVED" && decision !== "REJECTED") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    // Update validation
    const validation = await prisma.documentValidation.update({
      where: { id: validationId },
      data: {
        status: decision as ValidationStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        staffNotes: notes || null,
      },
    });

    // Update the uploaded file customer status
    await prisma.uploadedFile.update({
      where: { id: validation.uploadedFileId },
      data: {
        customerStatus:
          decision === "STAFF_APPROVED" ? "VERIFIED" : "NEEDS_REVIEW",
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action:
          decision === "STAFF_APPROVED" ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
        resourceType: "DocumentValidation",
        resourceId: validationId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          decision,
          notes,
        }),
      },
    });

    // Send document validated email when approved (fire-and-forget)
    if (decision === "STAFF_APPROVED") {
      const file = await prisma.uploadedFile.findUnique({
        where: { id: validation.uploadedFileId },
        include: {
          intakeSession: {
            include: {
              claimant: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (file?.intakeSession?.claimant?.email) {
        const claimant = file.intakeSession.claimant;
        sendDocumentValidatedEmail({
          to: claimant.email,
          name: `${claimant.firstName} ${claimant.lastName}`,
          resumeToken: file.intakeSession.resumeToken || undefined,
        }).catch((err) =>
          console.error("Failed to send document validated email:", err)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

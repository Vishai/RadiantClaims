import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sessions/[sessionId]
 * Returns full session data including recaFormData for admin detail view
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      include: {
        claimant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dob: true,
            claimType: true,
            relationshipToClaimant: true,
            userId: true,
          },
        },
        packetSubmission: {
          include: {
            generations: {
              orderBy: { generatedAt: "desc" },
              take: 1,
            },
          },
        },
        staffActions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        uploadedFiles: {
          select: {
            id: true,
            originalFilename: true,
            category: true,
            status: true,
            uploadedAt: true,
            sizeBytes: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: intakeSession.id,
        status: intakeSession.status,
        currentStep: intakeSession.currentStep,
        recaWorkflowStage: intakeSession.recaWorkflowStage,
        recaWorkflowSection: intakeSession.recaWorkflowSection,
        recaFormData: intakeSession.recaFormData,
        recaSupportingForms: intakeSession.recaSupportingForms,
        recaEligibilityData: intakeSession.recaEligibilityData,
        recaCompletionPercent: intakeSession.recaCompletionPercent,
        recaFormPdfGenerated: intakeSession.recaFormPdfGenerated,
        recaFormPdfDownloadedAt: intakeSession.recaFormPdfDownloadedAt,
        createdAt: intakeSession.createdAt,
        updatedAt: intakeSession.updatedAt,
        lastActivityAt: intakeSession.lastActivityAt,
        claimant: intakeSession.claimant,
        packetSubmission: intakeSession.packetSubmission,
        staffActions: intakeSession.staffActions,
        uploadedFiles: intakeSession.uploadedFiles,
      },
    });
  } catch (error) {
    console.error("Error fetching admin session detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

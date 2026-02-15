import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/context?sessionId=...
 *
 * Returns claim/workflow context suitable for injecting into the AI chat.
 * Intended for authenticated customers.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    type IntakeSessionWithClaim = Prisma.IntakeSessionGetPayload<{
      include: {
        claimant: true;
        uploadedFiles: {
          select: {
            id: true;
            originalFilename: true;
            category: true;
            status: true;
            customerStatus: true;
            uploadedAt: true;
          };
        };
      };
    }>;

    const intakeSession = (await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      include: {
        claimant: true,
        uploadedFiles: {
          select: {
            id: true,
            originalFilename: true,
            category: true,
            status: true,
            customerStatus: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
          take: 25,
        },
      },
    })) as IntakeSessionWithClaim | null;

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Intake session not found" },
        { status: 404 }
      );
    }

    // AuthZ: ensure the current user owns the claimant/session
    if (
      !intakeSession.claimant ||
      intakeSession.claimant.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const claimantId = intakeSession.claimantId;

    const docStatuses = claimantId
      ? await prisma.claimantDocumentStatus.findMany({
          where: { claimantId },
          select: { documentType: true, status: true, updatedAt: true },
        })
      : [];

    const statusCounts = docStatuses.reduce<Record<string, number>>(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // “Missing” is a heuristic: anything not uploaded/verified yet.
    const missingDocuments = docStatuses
      .filter((s) => !["UPLOADED", "VERIFIED"].includes(s.status))
      .slice(0, 12)
      .map((s) => ({ documentType: s.documentType, status: s.status }));

    return NextResponse.json({
      sessionId: intakeSession.id,
      claimType: intakeSession.claimType,
      recaWorkflowStage: intakeSession.recaWorkflowStage,
      recaWorkflowSection: intakeSession.recaWorkflowSection,
      recaCompletionPercent: intakeSession.recaCompletionPercent,
      validationErrors: intakeSession.recaValidationErrors,
      eligibilityData: intakeSession.recaEligibilityData,
      uploadedFiles: intakeSession.uploadedFiles.map((f) => ({
        id: f.id,
        fileName: f.originalFilename,
        category: f.category,
        status: f.status,
        customerStatus: f.customerStatus,
        createdAt: f.uploadedAt,
      })),
      documentStatusCounts: statusCounts,
      missingDocuments,
      claimant: {
        id: intakeSession.claimant.id,
        firstName: intakeSession.claimant.firstName,
        lastName: intakeSession.claimant.lastName,
        state: intakeSession.claimant.state,
        county: intakeSession.claimant.county,
      },
    });
  } catch (error) {
    console.error("[chat/context] error", error);
    return NextResponse.json(
      { error: "Failed to load chat context" },
      { status: 500 }
    );
  }
}

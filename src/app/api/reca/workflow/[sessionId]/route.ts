import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  RECAWorkflowState,
  SaveWorkflowRequest,
  SaveWorkflowResponse,
} from "@/lib/reca/types";

/**
 * GET /api/reca/workflow/[sessionId]
 * Load workflow state for a RECA form session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = params;

    // Find the intake session
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      include: {
        claimant: true,
        uploadedFiles: {
          where: {
            status: {
              in: ["READY", "APPROVED", "VALIDATED"],
            },
          },
          select: {
            id: true,
            fileKey: true,
            originalFilename: true,
            category: true,
            status: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    // Check authorization - must be the owner or an admin/attorney
    if (
      session?.user?.id !== intakeSession.claimant?.userId &&
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "ATTORNEY"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Construct workflow state response
    const workflowState: RECAWorkflowState = {
      sessionId: intakeSession.id,
      currentStage: intakeSession.recaWorkflowStage || 1,
      currentSection:
        (intakeSession.recaWorkflowSection as any) || "eligibility",
      completionPercentage: intakeSession.recaCompletionPercent || 0,
      formData: (intakeSession.recaFormData as any) || {},
      supportingForms: (intakeSession.recaSupportingForms as any) || {},
      eligibilityData: intakeSession.recaEligibilityData as any,
      validationErrors: intakeSession.recaValidationErrors as any,
      lastSaved: intakeSession.updatedAt.toISOString(),
      documentsUploaded: intakeSession.uploadedFiles.map((file) => ({
        documentId: file.id,
        type: file.fileKey,
        category: file.category || "OTHER",
        filename: file.originalFilename,
        uploadedAt: file.uploadedAt.toISOString(),
      })),
    };

    return NextResponse.json(workflowState);
  } catch (error) {
    console.error("Error loading RECA workflow state:", error);
    return NextResponse.json(
      { error: "Failed to load workflow state" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reca/workflow/[sessionId]/save
 * Save/update workflow state (auto-save)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = params;
    const body: SaveWorkflowRequest = await req.json();

    // Find the intake session
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      session?.user?.id !== intakeSession.claimant?.userId &&
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "ATTORNEY"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Merge form data (deep merge for partial updates)
    const currentFormData = (intakeSession.recaFormData as any) || {};
    const updatedFormData = body.formData
      ? { ...currentFormData, ...body.formData }
      : currentFormData;

    // Merge supporting forms
    const currentSupportingForms =
      (intakeSession.recaSupportingForms as any) || {};
    const updatedSupportingForms = body.supportingForms
      ? { ...currentSupportingForms, ...body.supportingForms }
      : currentSupportingForms;

    // Calculate completion percentage
    const completionPercentage = calculateCompletionPercentage(
      updatedFormData,
      updatedSupportingForms,
      body.eligibilityData
    );

    // Update the session
    const updated = await prisma.intakeSession.update({
      where: { id: sessionId },
      data: {
        recaWorkflowStage: body.currentStage || intakeSession.recaWorkflowStage,
        recaWorkflowSection:
          body.currentSection || intakeSession.recaWorkflowSection,
        recaFormData: updatedFormData,
        recaSupportingForms: updatedSupportingForms,
        recaEligibilityData: body.eligibilityData || intakeSession.recaEligibilityData,
        recaCompletionPercent: completionPercentage,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const response: SaveWorkflowResponse = {
      success: true,
      sessionId: updated.id,
      completionPercentage,
      lastSaved: updated.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving RECA workflow state:", error);
    return NextResponse.json(
      { error: "Failed to save workflow state" },
      { status: 500 }
    );
  }
}

/**
 * Calculate completion percentage based on filled sections
 */
function calculateCompletionPercentage(
  formData: any,
  supportingForms: any,
  eligibilityData: any
): number {
  const sections = [
    "part_1",
    "part_2",
    "part_3",
    "part_8",
    "part_9",
    "part_10",
    "part_11",
    "part_12",
    "part_13",
    "part_16",
  ];

  let completedSections = 0;
  const totalSections = sections.length;

  // Check each section
  sections.forEach((section) => {
    if (formData[section] && Object.keys(formData[section]).length > 0) {
      completedSections++;
    }
  });

  // Add eligibility if completed
  if (eligibilityData?.isEligible !== undefined) {
    completedSections += 0.5;
  }

  // Add supporting forms if any exist
  if (supportingForms && Object.keys(supportingForms).length > 0) {
    completedSections += 1;
  }

  return Math.round((completedSections / (totalSections + 1.5)) * 100);
}

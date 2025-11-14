import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  RECAWorkflowState,
  RECAWorkflowStage,
  SaveWorkflowRequest,
  SaveWorkflowResponse,
} from "@/lib/reca/types";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";

export const dynamic = "force-dynamic";

/**
 * Pre-populate Part 1 (Filer Information) from Claimant intake data
 * This ensures users don't have to re-enter information they already provided during intake
 */
function preFillPart1FromClaimant(formData: any, claimant: any) {
  if (!formData.part_1 && claimant) {
    formData.part_1 = {
      firstName: claimant.firstName,
      middleName: claimant.middleName || "",
      lastName: claimant.lastName,
      formerNames: "",
      ssn: claimant.ssn || "",
      dob: claimant.dateOfBirth || "",
      mailingAddress: claimant.mailingAddress || "",
      city: claimant.city || "",
      state: claimant.state || "",
      zipCode: claimant.zipCode || "",
      phoneDay: claimant.phoneNumber || "",
      phoneEvening: "",
      email: claimant.email || "",
      residenceAddress: "",
      tribalAffiliation: "",
      tribalCensusNumber: "",
    };
  }
  return formData;
}

/**
 * Auto-populate Part 2 (Claimant Information) from Part 1 for Self-filers
 * When a user selects "Self" as the relationship, Part 2 should mirror Part 1
 * This maintains data consistency and prevents duplicate data entry
 */
function autoPopulatePart2ForSelfFiler(formData: any) {
  if (
    formData.part_1 &&
    !formData.part_2 &&
    formData.part_3?.relationship === "Self"
  ) {
    formData.part_2 = {
      firstName: formData.part_1.firstName,
      middleName: formData.part_1.middleName,
      lastName: formData.part_1.lastName,
      formerNames: formData.part_1.formerNames,
      ssn: formData.part_1.ssn,
      dob: formData.part_1.dob,
      // dod is not applicable for self-filers (they are still alive)
    };
  }
  return formData;
}

/**
 * GET /api/reca/workflow/[sessionId]
 * Load workflow state for a RECA form session
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the intake session
    const intakeSession = await db.intakeSession.findUnique({
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

    // Check authorization - must be the owner with active subscription or an admin/attorney
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isOwner = userId && userId === intakeSession.claimant?.userId;
    const isAdminOrAttorney = userRole === "ADMIN" || userRole === "ATTORNEY";

    let hasPaidAccess = false;
    if (isOwner) {
      const access = await getActiveSubscriptionAccess(userId);
      hasPaidAccess = !!access;
    }

    if (!isAdminOrAttorney && !(isOwner && hasPaidAccess)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get form data and pre-populate from Claimant if empty
    let formData = (intakeSession.recaFormData as any) || {};
    formData = preFillPart1FromClaimant(formData, intakeSession.claimant);

    // Construct workflow state response
    const workflowState: RECAWorkflowState = {
      sessionId: intakeSession.id,
      currentStage: (intakeSession.recaWorkflowStage || 1) as RECAWorkflowStage,
      currentSection: (intakeSession.recaWorkflowSection as any) || "part_1",
      completionPercentage: intakeSession.recaCompletionPercent || 0,
      formData,
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the intake session
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Workflow session not found" },
        { status: 404 }
      );
    }

    // Check authorization - must be the owner with active subscription or an admin/attorney
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isOwner = userId && userId === intakeSession.claimant?.userId;
    const isAdminOrAttorney = userRole === "ADMIN" || userRole === "ATTORNEY";

    let hasPaidAccess = false;
    if (isOwner) {
      const access = await getActiveSubscriptionAccess(userId);
      hasPaidAccess = !!access;
    }

    if (!isAdminOrAttorney && !(isOwner && hasPaidAccess)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Merge form data (deep merge for partial updates)
    const currentFormData = (intakeSession.recaFormData as any) || {};
    let updatedFormData = body.formData
      ? { ...currentFormData, ...body.formData }
      : currentFormData;

    // Auto-populate Part 2 from Part 1 if user is Self-filer
    updatedFormData = autoPopulatePart2ForSelfFiler(updatedFormData);

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
    const updated = await db.intakeSession.update({
      where: { id: sessionId },
      data: {
        recaWorkflowStage: body.currentStage || intakeSession.recaWorkflowStage,
        recaWorkflowSection:
          body.currentSection || intakeSession.recaWorkflowSection,
        recaFormData: updatedFormData,
        recaSupportingForms: updatedSupportingForms,
        recaEligibilityData:
          (body.eligibilityData as any) || intakeSession.recaEligibilityData,
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

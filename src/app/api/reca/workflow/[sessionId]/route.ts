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
import { calculateCompletionPercentage } from "@/lib/reca/workflow";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import { toISODateString } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

/**
 * Pre-populate Part 1 (Filer Information) from Claimant intake data
 * This ensures users don't have to re-enter information they already provided during intake
 */
function preFillPart1FromClaimant(formData: any, claimant: any) {
  if (!formData.part_1 && claimant) {
    // DIAGNOSTIC: Log claimant data to debug prefill issues
    console.log("[RECA Prefill] Claimant data:", {
      firstName: claimant.firstName,
      lastName: claimant.lastName,
      email: claimant.email,
      phone: claimant.phone,
      address1: claimant.address1,
      city: claimant.city,
      state: claimant.state,
      postalCode: claimant.postalCode,
      dob: claimant.dob,
    });

    // Format DOB as YYYY-MM-DD for date input field
    let dobFormatted = "";
    if (claimant.dob) {
      dobFormatted = toISODateString(claimant.dob);
    }

    formData.part_1 = {
      firstName: claimant.firstName,
      middleName: claimant.middleName || "",
      lastName: claimant.lastName,
      formerNames: [], // Initialize as empty array for new multi-entry format
      ssn: claimant.ssn || "",
      dob: dobFormatted,
      mailingAddress: claimant.address1 || "",
      city: claimant.city || "",
      state: claimant.state || "",
      zipCode: claimant.postalCode || "",
      phoneDay: claimant.phone || "",
      phoneEvening: "",
      email: claimant.email || "",
      residenceAddress: "",
      tribalAffiliation: "",
      tribalCensusNumber: "",
    };

    console.log("[RECA Prefill] Generated Part 1 data:", formData.part_1);
  }
  return formData;
}

/**
 * Pre-populate Part 3 (Relationship) from Claimant eligibility data
 * This ensures users don't have to re-select their relationship if they provided it during eligibility
 */
function preFillPart3FromClaimant(formData: any, claimant: any) {
  if (!formData.part_3 && claimant?.relationshipToClaimant) {
    // Convert database enum format to form format
    // E.g., "SELF" → "Self", "SPOUSE" → "Spouse"
    const relationship = claimant.relationshipToClaimant
      .split("_")
      .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");

    formData.part_3 = {
      relationship,
      filingForSelf: claimant.relationshipToClaimant === "SELF",
    };
  }
  return formData;
}

/**
 * Pre-populate Part 2 (Deceased Individual's Information) from eligibility data
 * This ensures users don't have to re-enter deceased individual information from eligibility screening
 */
function preFillPart2FromEligibility(formData: any, eligibilityData: any) {
  if (!formData.part_2 && eligibilityData) {
    const { deceasedFirstName, deceasedLastName, deceasedDOD } =
      eligibilityData;

    // Only pre-fill if we have deceased individual data from eligibility
    if (deceasedFirstName && deceasedLastName && deceasedDOD) {
      formData.part_2 = {
        firstName: deceasedFirstName,
        lastName: deceasedLastName,
        middleName: "",
        formerNames: [],
        ssn: "",
        dob: "",
        dod: deceasedDOD,
      };

      console.log(
        "[RECA Prefill] Part 2 pre-populated from eligibility:",
        formData.part_2
      );
    }
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

    // Check authorization - must be the owner (portal access) or an admin/attorney
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isOwner = userId && userId === intakeSession.claimant?.userId;
    const isAdminOrAttorney = userRole === "ADMIN" || userRole === "ATTORNEY";

    let hasPaidAccess = false;
    if (isOwner) {
      const access = await getActiveSubscriptionAccess(userId);
      hasPaidAccess = !!access;
    }

    if (!isAdminOrAttorney && !(isOwner || hasPaidAccess)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get form data and pre-populate from Claimant and Eligibility if empty
    let formData = (intakeSession.recaFormData as any) || {};
    formData = preFillPart1FromClaimant(formData, intakeSession.claimant);
    formData = preFillPart2FromEligibility(
      formData,
      intakeSession.recaEligibilityData
    );
    formData = preFillPart3FromClaimant(formData, intakeSession.claimant);

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
      {
        error: "Failed to load workflow state",
        details: error instanceof Error ? error.message : String(error),
      },
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

    // Check authorization - must be the owner (portal access) or an admin/attorney
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isOwner = userId && userId === intakeSession.claimant?.userId;
    const isAdminOrAttorney = userRole === "ADMIN" || userRole === "ATTORNEY";

    let hasPaidAccess = false;
    if (isOwner) {
      const access = await getActiveSubscriptionAccess(userId);
      hasPaidAccess = !!access;
    }

    if (!isAdminOrAttorney && !(isOwner || hasPaidAccess)) {
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
      {
        error: "Failed to save workflow state",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

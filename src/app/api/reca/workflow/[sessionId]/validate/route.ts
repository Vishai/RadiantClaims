import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import {
  ValidateSectionRequest,
  ValidateSectionResponse,
  FieldError,
  RECAWorkflowSection,
} from "@/lib/reca/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/reca/workflow/[sessionId]/validate
 * Validate a specific section of the RECA form
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = params;
    const body: ValidateSectionRequest = await req.json();

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

    // Validate the section
    const errors = validateSection(body.section, body.data);

    const response: ValidateSectionResponse = {
      isValid: errors.length === 0,
      errors,
    };

    // Update validation errors in database
    const currentErrors = (intakeSession.recaValidationErrors as any) || {};
    await db.intakeSession.update({
      where: { id: sessionId },
      data: {
        recaValidationErrors: {
          ...currentErrors,
          [body.section]: errors,
        },
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error validating RECA section:", error);
    return NextResponse.json(
      { error: "Failed to validate section" },
      { status: 500 }
    );
  }
}

/**
 * Validate a specific section based on its requirements
 */
function validateSection(
  section: RECAWorkflowSection,
  data: any
): FieldError[] {
  // const errors: FieldError[] = [];

  switch (section) {
    case "part_1":
      return validatePart1(data);
    case "part_2":
      return validatePart2(data);
    case "part_3":
      return validatePart3(data);
    case "part_5":
      return validatePart5(data);
    case "part_6":
      return validatePart6(data);
    case "part_8":
      return validatePart8(data);
    case "part_10":
      return validatePart10(data);
    case "part_11":
      return validatePart11(data);
    case "part_12":
      return validatePart12(data);
    case "part_13":
      return validatePart13(data);
    case "part_16":
      return validatePart16(data);
    case "eligibility":
      return validateEligibility(data);
    default:
      return [];
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

function validatePart1(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.firstName?.trim()) {
    errors.push({ field: "firstName", message: "First name is required" });
  }
  if (!data.lastName?.trim()) {
    errors.push({ field: "lastName", message: "Last name is required" });
  }
  if (!data.ssn?.match(/^\d{3}-\d{2}-\d{4}$/)) {
    errors.push({
      field: "ssn",
      message: "SSN must be in format XXX-XX-XXXX",
    });
  }
  if (!data.dob) {
    errors.push({ field: "dob", message: "Date of birth is required" });
  }
  if (!data.mailingAddress?.trim()) {
    errors.push({
      field: "mailingAddress",
      message: "Mailing address is required",
    });
  }
  if (!data.city?.trim()) {
    errors.push({ field: "city", message: "City is required" });
  }
  if (!data.state) {
    errors.push({ field: "state", message: "State is required" });
  }
  if (!data.zipCode?.match(/^\d{5}$/)) {
    errors.push({
      field: "zipCode",
      message: "ZIP code must be 5 digits",
    });
  }

  return errors;
}

function validatePart2(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.firstName?.trim()) {
    errors.push({ field: "firstName", message: "First name is required" });
  }
  if (!data.lastName?.trim()) {
    errors.push({ field: "lastName", message: "Last name is required" });
  }
  if (!data.ssn?.match(/^\d{3}-\d{2}-\d{4}$/)) {
    errors.push({
      field: "ssn",
      message: "SSN must be in format XXX-XX-XXXX",
    });
  }
  if (!data.dob) {
    errors.push({ field: "dob", message: "Date of birth is required" });
  }

  return errors;
}

function validatePart3(data: any): FieldError[] {
  const errors: FieldError[] = [];

  const validRelationships = [
    "Self",
    "Spouse",
    "Child",
    "Parent",
    "Grandchild",
    "Grandparent",
  ];
  if (!validRelationships.includes(data.relationship)) {
    errors.push({
      field: "relationship",
      message: "Relationship selection is required",
    });
  }

  return errors;
}

function validatePart5(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (data.claimantDeceased !== "YES") {
    errors.push({
      field: "claimantDeceased",
      message: "Claimant must be deceased to file as surviving spouse",
    });
  }
  if (data.marriedOneYear !== "YES") {
    errors.push({
      field: "marriedOneYear",
      message: "Must have been married for at least one year prior to death",
    });
  }
  if (!data.claimantPreviousMarriages) {
    errors.push({
      field: "claimantPreviousMarriages",
      message: "Must indicate if claimant had previous marriages",
    });
  }
  if (!data.filerOtherMarriages) {
    errors.push({
      field: "filerOtherMarriages",
      message: "Must indicate if you had other marriages",
    });
  }

  return errors;
}

function validatePart6(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (data.claimantDeceased !== "YES") {
    errors.push({
      field: "claimantDeceased",
      message: "Claimant must be deceased to file as surviving child",
    });
  }
  if (!data.claimantEverMarried) {
    errors.push({
      field: "claimantEverMarried",
      message: "Must indicate if claimant was ever married",
    });
  }
  if (!data.childType) {
    errors.push({
      field: "childType",
      message: "Must specify if natural, adopted, or step-child",
    });
  }
  if (!data.otherChildrenExist) {
    errors.push({
      field: "otherChildrenExist",
      message: "Must indicate if other eligible children exist",
    });
  }

  return errors;
}

function validatePart8(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.exposureOptions || data.exposureOptions.length === 0) {
    errors.push({
      field: "exposureOptions",
      message: "Must select at least one exposure time period",
    });
  }

  const hasLocations =
    (data.affectedAreas && data.affectedAreas.length > 0) ||
    (data.arizonaCounties && data.arizonaCounties.length > 0) ||
    (data.nevadaCounties && data.nevadaCounties.length > 0);

  if (!hasLocations) {
    errors.push({
      field: "locations",
      message: "Must provide at least one location where claimant was present",
    });
  }

  return errors;
}

function validatePart10(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.diseases || data.diseases.length === 0) {
    errors.push({
      field: "diseases",
      message: "Must select at least one compensable disease",
    });
  }

  return errors;
}

function validatePart11(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.medicalRecordsSubmitted && !data.cancerRegistryAuthorization) {
    errors.push({
      field: "medicalRecordsSubmitted",
      message:
        "Must either submit medical records or authorize cancer registry assistance",
    });
  }

  return errors;
}

function validatePart12(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.receivedPayment) {
    errors.push({
      field: "receivedPayment",
      message: "Must indicate if any previous payments were received",
    });
  }
  if (data.receivedPayment === "YES" && !data.paymentDetails?.trim()) {
    errors.push({
      field: "paymentDetails",
      message: "Must provide details of previous payments",
    });
  }
  if (!data.eeoicpaClaim) {
    errors.push({
      field: "eeoicpaClaim",
      message: "Must indicate if EEOICPA claim was filed",
    });
  }

  return errors;
}

function validatePart13(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.hasAttorney) {
    errors.push({
      field: "hasAttorney",
      message: "Must indicate if you have hired an attorney",
    });
  }

  if (data.hasAttorney === "YES") {
    if (!data.attorneyFirstName?.trim()) {
      errors.push({
        field: "attorneyFirstName",
        message: "Attorney first name is required",
      });
    }
    if (!data.attorneyLastName?.trim()) {
      errors.push({
        field: "attorneyLastName",
        message: "Attorney last name is required",
      });
    }
  }

  return errors;
}

function validatePart16(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.signature?.trim()) {
    errors.push({ field: "signature", message: "Signature is required" });
  }
  if (!data.signatureDate) {
    errors.push({
      field: "signatureDate",
      message: "Signature date is required",
    });
  }
  if (!data.authorizationAcknowledgment) {
    errors.push({
      field: "authorizationAcknowledgment",
      message: "Must acknowledge authorization",
    });
  }

  return errors;
}

function validateEligibility(data: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.relationship) {
    errors.push({
      field: "relationship",
      message: "Relationship must be selected",
    });
  }
  if (
    !data.exposureOptions ||
    (Array.isArray(data.exposureOptions) && data.exposureOptions.length === 0)
  ) {
    errors.push({
      field: "exposureOptions",
      message: "Must verify exposure during eligible time periods",
    });
  }

  return errors;
}

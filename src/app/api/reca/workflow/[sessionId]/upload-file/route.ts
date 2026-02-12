import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import { FileCategory, Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const uploadFileSchema = z.object({
  fileKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  documentType: z.string(), // ProofOfPresenceDocumentType or MedicalDocumentType
  category: z.string().optional(), // "Medical" or undefined (defaults to ProofOfResidence)
});

const PROOF_OF_PRESENCE_CATEGORY_MAP: Record<string, FileCategory> = {
  TAX_RECORDS: FileCategory.TAX_RETURN,
  PROPERTY_RECORDS: FileCategory.PROOF_OF_RESIDENCE,
  SCHOOL_ENROLLMENT: FileCategory.SCHOOL_RECORDS,
  UTILITY_BILLS: FileCategory.UTILITY_BILL,
  MORTGAGE_STATEMENTS: FileCategory.MORTGAGE_STATEMENT,
  RENTAL_AGREEMENTS: FileCategory.PROOF_OF_RESIDENCE,
  EMPLOYMENT_RECORDS: FileCategory.EMPLOYMENT_RECORDS,
  CENSUS_RECORDS: FileCategory.PROOF_OF_RESIDENCE,
  GOVERNMENT_CORRESPONDENCE: FileCategory.PROOF_OF_RESIDENCE,
  GOVERNMENT_ID: FileCategory.IDENTITY,
  VOTING_RECORDS: FileCategory.PROOF_OF_RESIDENCE,
  MILITARY_RECORDS: FileCategory.OTHER,
  CHURCH_RECORDS: FileCategory.LDS_CHURCH_RECORDS,
  BIRTH_MARRIAGE_RECORDS: FileCategory.OTHER,
  OTHER: FileCategory.OTHER,
};

const MEDICAL_CATEGORY_MAP: Record<string, FileCategory> = {
  PATHOLOGY_REPORT: FileCategory.PATHOLOGY_REPORT,
  OPERATIVE_REPORT: FileCategory.MEDICAL_RECORDS,
  DISCHARGE_SUMMARY: FileCategory.DISCHARGE_SUMMARY,
  PHYSICIAN_SUMMARY: FileCategory.MEDICAL_RECORDS,
  DEATH_CERTIFICATE: FileCategory.DEATH_CERTIFICATE,
  AUTOPSY_REPORT: FileCategory.MEDICAL_RECORDS,
  BONE_MARROW_BIOPSY: FileCategory.PATHOLOGY_REPORT,
  LAB_REPORT: FileCategory.PATHOLOGY_REPORT,
  XRAY_REPORT: FileCategory.MEDICAL_RECORDS,
  OTHER_MEDICAL: FileCategory.OTHER,
};

function resolveFileCategory(
  categoryHint: string | undefined,
  documentType: string
): FileCategory {
  if (categoryHint === "Medical") {
    return MEDICAL_CATEGORY_MAP[documentType] || FileCategory.MEDICAL_RECORDS;
  }

  return (
    PROOF_OF_PRESENCE_CATEGORY_MAP[documentType] ||
    FileCategory.PROOF_OF_RESIDENCE
  );
}

/**
 * POST /api/reca/workflow/[sessionId]/upload-file
 * Save an uploaded file record to the database after successful R2 upload
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await req.json();
    const validated = uploadFileSchema.parse(body);

    // Verify the intake session exists
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
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

    const category = resolveFileCategory(
      validated.category,
      validated.documentType
    );

    // Create the uploaded file record
    const uploadedFile = await db.uploadedFile.create({
      data: {
        intakeSessionId: sessionId,
        fileKey: validated.fileKey,
        originalFilename: validated.fileName,
        mimeType: validated.mimeType,
        sizeBytes: validated.fileSize,
        category,
        status: "READY", // Ready for review
        metadata: JSON.stringify({
          documentType: validated.documentType,
          uploadedFrom:
            validated.category === "Medical"
              ? "part_11_proof_of_disease"
              : "part_9_proof_of_presence",
        }),
      },
    });

    return NextResponse.json(
      {
        id: uploadedFile.id,
        fileKey: uploadedFile.fileKey,
        message: "File record created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving uploaded file:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Database write failed while saving file record",
          code: error.code,
          details: error.message,
        },
        { status: 500 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to save file record" },
      { status: 500 }
    );
  }
}

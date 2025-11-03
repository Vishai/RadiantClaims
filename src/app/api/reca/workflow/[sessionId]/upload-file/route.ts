import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import { z } from "zod";

const uploadFileSchema = z.object({
  fileKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  documentType: z.string(), // ProofOfPresenceDocumentType or MedicalDocumentType
  category: z.string().optional(), // "Medical" or undefined (defaults to ProofOfResidence)
});

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

    // Determine file category
    let category: string;

    if (validated.category === "Medical") {
      // Medical documents from Part 11
      category = "Medical";
    } else {
      // Map proof of presence document types to category
      const categoryMap: Record<string, string> = {
        TAX_RECORDS: "ProofOfResidence",
        PROPERTY_RECORDS: "ProofOfResidence",
        SCHOOL_ENROLLMENT: "ProofOfResidence",
        UTILITY_BILLS: "ProofOfResidence",
        MORTGAGE_STATEMENTS: "ProofOfResidence",
        RENTAL_AGREEMENTS: "ProofOfResidence",
        EMPLOYMENT_RECORDS: "ProofOfResidence",
        CENSUS_RECORDS: "ProofOfResidence",
        GOVERNMENT_CORRESPONDENCE: "ProofOfResidence",
        GOVERNMENT_ID: "ProofOfResidence",
        VOTING_RECORDS: "ProofOfResidence",
        MILITARY_RECORDS: "ProofOfResidence",
        CHURCH_RECORDS: "ProofOfResidence",
        BIRTH_MARRIAGE_RECORDS: "ProofOfResidence",
        OTHER: "ProofOfResidence",
      };
      category = categoryMap[validated.documentType] || "ProofOfResidence";
    }

    // Create the uploaded file record
    const uploadedFile = await db.uploadedFile.create({
      data: {
        intakeSessionId: sessionId,
        fileKey: validated.fileKey,
        originalFilename: validated.fileName,
        mimeType: validated.mimeType,
        sizeBytes: validated.fileSize,
        category: category as any,
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to save file record" },
      { status: 500 }
    );
  }
}

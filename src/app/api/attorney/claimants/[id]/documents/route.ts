import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, canAccessClaimant } from "@/lib/auth/permissions";
import { logDocumentAccess } from "@/lib/audit";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    // Require permission
    const { user } = await requirePermission("document:view");

    const claimantId = params.id;

    // Check access to this specific claimant
    const hasAccess = await canAccessClaimant(user.id, claimantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this claimant" },
        { status: 403 }
      );
    }

    // Fetch claimant with documents and assignment info
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      include: {
        intakeSession: {
          include: {
            uploadedFiles: {
              orderBy: {
                uploadedAt: "desc",
              },
            },
          },
        },
        firmAssignments: {
          where: {
            firmId: user.firmId || "",
          },
          take: 1,
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    // Get documents from intake session
    const documents = claimant.intakeSession?.uploadedFiles || [];

    // Get IP and user agent for audit log
    const ipAddress = req.headers.get("x-forwarded-for") ||
                      req.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Log document access
    await logDocumentAccess(
      user.id,
      claimantId,
      "DOCUMENT_VIEWED",
      ipAddress,
      userAgent,
      {
        claimantId,
        documentCount: documents.length,
      }
    );

    // Get workflow status and claim type from assignment
    const assignment = claimant.firmAssignments[0];

    return NextResponse.json({
      claimant: {
        id: claimant.id,
        firstName: claimant.firstName,
        lastName: claimant.lastName,
        email: claimant.email,
        workflowStatus: assignment?.status || "INTAKE",
        claimType: (claimant as any).claimType || null,
        isPremiumService: (claimant as any).isPremiumService || false,
      },
      documents: documents.map((doc: any) => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        fileKey: doc.fileKey,
        category: doc.category,
        status: doc.status,
        sizeBytes: doc.sizeBytes,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt,
        isRequired: doc.isRequired,
        requiresOriginal: doc.requiresOriginal,
        validatedAt: doc.validatedAt,
        validatedBy: doc.validatedBy,
      })),
    });
  } catch (error) {
    console.error("Error fetching claimant documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

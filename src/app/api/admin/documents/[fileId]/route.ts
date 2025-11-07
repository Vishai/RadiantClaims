import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedGetUrl } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;

    // Get file details
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        intakeSession: {
          include: {
            claimant: true,
            serviceSubscription: {
              include: {
                user: true,
              },
            },
          },
        },
        validation: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate signed URL for file access (valid for 1 hour)
    const signedUrl = await getPresignedGetUrl(file.fileKey, 3600);

    return NextResponse.json({
      file: {
        id: file.id,
        originalFilename: file.originalFilename,
        category: file.category,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        status: file.status,
        customerStatus: file.customerStatus,
        uploadedAt: file.uploadedAt,
        signedUrl,
        claimant: file.intakeSession.claimant,
        user: file.intakeSession.serviceSubscription?.user || null,
        validation: file.validation,
      },
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

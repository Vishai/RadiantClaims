import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { requirePermission, canAccessClaimant } from "@/lib/auth/permissions";
import { logDocumentAccess } from "@/lib/audit";
import { env } from "@/env.mjs";

interface RouteContext {
  params: {
    id: string;
  };
}

// Initialize R2 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    // Require permission
    const { user } = await requirePermission("document:download");

    const documentId = params.id;

    // Fetch document with claimant info
    const document = await db.uploadedFile.findUnique({
      where: { id: documentId },
      include: {
        intakeSession: {
          include: {
            claimant: true,
          },
        },
      },
    });

    if (!document || !document.intakeSession?.claimant) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check access to this claimant
    const hasAccess = await canAccessClaimant(
      user.id,
      document.intakeSession.claimant.id
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this document" },
        { status: 403 }
      );
    }

    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: document.fileKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Get IP and user agent for audit log
    const ipAddress = req.headers.get("x-forwarded-for") ||
                      req.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Log document download
    await logDocumentAccess(
      user.id,
      document.id,
      "DOCUMENT_DOWNLOADED",
      ipAddress,
      userAgent,
      {
        claimantId: document.intakeSession.claimant.id,
        filename: document.originalFilename,
        fileKey: document.fileKey,
      }
    );

    return NextResponse.json({
      url: presignedUrl,
      filename: document.originalFilename,
      mimeType: document.mimeType,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}

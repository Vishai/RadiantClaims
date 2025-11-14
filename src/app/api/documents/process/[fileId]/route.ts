/**
 * Document Intelligence Processing API
 * Processes uploaded documents with OCR, AI categorization, and quality analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getObject } from "@/lib/r2";
import { processDocument } from "@/lib/document-intelligence/ocr";
import {
  categorizeDocument,
  generateDocumentTags,
  type FileCategory,
} from "@/lib/document-intelligence/ai-categorization";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;

    // Fetch the uploaded file record
    const uploadedFile = await db.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        intakeSession: {
          include: {
            claimant: true,
          },
        },
      },
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify user has access to this file
    const claimant = uploadedFile.intakeSession?.claimant;
    if (claimant?.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already processed
    if (uploadedFile.ocrText && uploadedFile.status === "READY") {
      return NextResponse.json({
        message: "File already processed",
        file: uploadedFile,
      });
    }

    // Update status to PROCESSING
    await db.uploadedFile.update({
      where: { id: fileId },
      data: { status: "PROCESSING" },
    });

    // Download file from R2 storage
    const fileBuffer = await getObject(uploadedFile.fileKey);
    if (!fileBuffer) {
      throw new Error("Failed to download file from storage");
    }

    // STEP 1: OCR & Quality Analysis
    const { ocrResult, qualityMetrics } = await processDocument(
      fileBuffer,
      uploadedFile.mimeType
    );

    // STEP 2: AI Categorization (if not already categorized)
    let finalCategory: FileCategory =
      (uploadedFile.category as FileCategory) || "OTHER";
    let categorizationResult;

    if (ocrResult.text.length > 20) {
      categorizationResult = await categorizeDocument(
        ocrResult.text,
        uploadedFile.originalFilename,
        uploadedFile.category as FileCategory | undefined
      );

      // Use AI category if confidence is high and no manual category set
      if (
        categorizationResult.confidence > 0.7 &&
        (!uploadedFile.category || uploadedFile.category === "OTHER")
      ) {
        finalCategory = categorizationResult.category;
      }
    }

    // STEP 3: Generate Smart Tags
    const documentTags = await generateDocumentTags(
      ocrResult.text,
      uploadedFile.originalFilename,
      finalCategory,
      qualityMetrics?.qualityScore || ocrResult.confidence
    );

    // STEP 4: Store Results in Database
    const metadata = {
      ocrConfidence: ocrResult.confidence,
      processingTimeMs: ocrResult.processingTimeMs,
      pageCount: ocrResult.pageCount,
      qualityMetrics: qualityMetrics
        ? {
            resolution: qualityMetrics.resolution,
            qualityScore: qualityMetrics.qualityScore,
            isBlurry: qualityMetrics.isBlurry,
            isLowContrast: qualityMetrics.isLowContrast,
            recommendations: qualityMetrics.recommendations,
          }
        : undefined,
      aiCategorization: categorizationResult
        ? {
            suggestedCategory: categorizationResult.category,
            confidence: categorizationResult.confidence,
            reasoning: categorizationResult.reasoning,
            alternatives: categorizationResult.alternativeCategories,
          }
        : undefined,
    };

    // Update file record with OCR results
    const updatedFile = await db.uploadedFile.update({
      where: { id: fileId },
      data: {
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        category: finalCategory,
        metadata: JSON.stringify(metadata),
        status: "READY",
        processedAt: new Date(),
      },
    });

    // Delete existing tags and create new ones
    await db.documentTag.deleteMany({
      where: { uploadedFileId: fileId },
    });

    if (documentTags.length > 0) {
      await db.documentTag.createMany({
        data: documentTags.map((tag) => ({
          uploadedFileId: fileId,
          tag: tag.tag,
          confidence: tag.confidence,
        })),
      });
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "DOCUMENT_UPLOADED",
      resourceType: "UploadedFile",
      resourceId: fileId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        category: finalCategory,
        ocrConfidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        tagsCount: documentTags.length,
      },
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
      intelligence: {
        ocrConfidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        category: finalCategory,
        qualityScore: qualityMetrics?.qualityScore,
        tags: documentTags,
        recommendations: qualityMetrics?.recommendations || [],
      },
    });
  } catch (error) {
    console.error("Document processing error:", error);

    // Update file status to FAILED
    try {
      await db.uploadedFile.update({
        where: { id: params.fileId },
        data: {
          status: "FAILED",
        },
      });
    } catch (dbError) {
      console.error("Failed to update file status:", dbError);
    }

    return NextResponse.json(
      {
        error: "Document processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check processing status
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadedFile = await db.uploadedFile.findUnique({
      where: { id: params.fileId },
      include: {
        tags: true,
        intakeSession: {
          include: {
            claimant: true,
          },
        },
      },
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify access
    const claimant = uploadedFile.intakeSession?.claimant;
    if (claimant?.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse metadata
    const metadata = uploadedFile.metadata
      ? JSON.parse(uploadedFile.metadata)
      : {};

    return NextResponse.json({
      file: uploadedFile,
      intelligence: {
        ocrConfidence: uploadedFile.ocrConfidence,
        textLength: uploadedFile.ocrText?.length || 0,
        category: uploadedFile.category,
        qualityScore: metadata.qualityMetrics?.qualityScore,
        tags: uploadedFile.tags,
        recommendations: metadata.qualityMetrics?.recommendations || [],
        aiCategorization: metadata.aiCategorization,
      },
    });
  } catch (error) {
    console.error("Error fetching file status:", error);
    return NextResponse.json(
      { error: "Failed to fetch file status" },
      { status: 500 }
    );
  }
}

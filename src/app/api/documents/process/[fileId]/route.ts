/**
 * Document Intelligence Processing API
 * Re-processes uploaded documents with the full AI pipeline:
 * OCR, categorization, entity extraction, compliance, and risk analysis.
 * Used for retrying failed or stuck documents.
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
import { extractEntities } from "@/lib/document-intelligence/entity-extraction";
import { checkRECACompliance } from "@/lib/document-intelligence/reca-compliance";
import { analyzeRisks } from "@/lib/document-intelligence/risk-analysis";
import { detectCategoryFromText } from "@/lib/document-intelligence/heuristic-categorization";
import { analyzeOtherDocument } from "@/lib/document-intelligence/other-document-analyzer";
import { parseUploadedFileMetadata } from "@/lib/uploaded-file-metadata";
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

    const userSelectedCategory = uploadedFile.category as FileCategory | null;
    const categoryIsLocked = uploadedFile.categoryLocked ?? false;

    // STEP 1: OCR & Quality Analysis
    const { ocrResult, qualityMetrics } = await processDocument(
      fileBuffer,
      uploadedFile.mimeType
    );

    console.log(
      `✓ OCR completed for ${fileId}: ${ocrResult.text.length} chars extracted`
    );

    // STEP 2: AI Categorization
    let finalCategory: FileCategory = userSelectedCategory ?? "OTHER";
    let categorizationResult;
    let categoryAutoCorrected = false;
    let categoryAutoCorrectionSource: "ai" | "heuristic" | undefined;
    let heuristicCategorization;

    if (ocrResult.text.length > 20) {
      categorizationResult = await categorizeDocument(
        ocrResult.text,
        uploadedFile.originalFilename,
        uploadedFile.category as FileCategory | undefined
      );

      if (!categoryIsLocked && categorizationResult.confidence > 0.75) {
        if (categorizationResult.category !== finalCategory) {
          finalCategory = categorizationResult.category;
          categoryAutoCorrected =
            (!!userSelectedCategory &&
              userSelectedCategory !== categorizationResult.category) ||
            finalCategory === "OTHER";
          categoryAutoCorrectionSource = "ai";
        }
      } else if (!userSelectedCategory && !categoryIsLocked) {
        finalCategory = categorizationResult.category;
      }

      console.log(
        `✓ AI categorization: ${finalCategory} (${(categorizationResult.confidence * 100).toFixed(0)}%)`
      );
    }

    heuristicCategorization = detectCategoryFromText(ocrResult.text);

    if (
      heuristicCategorization &&
      heuristicCategorization.confidence >= 0.85 &&
      heuristicCategorization.category !== finalCategory &&
      !categoryIsLocked
    ) {
      finalCategory = heuristicCategorization.category;
      categoryAutoCorrected = true;
      categoryAutoCorrectionSource = "heuristic";
    }

    // STEP 3: Generate Smart Tags
    const documentTags = await generateDocumentTags(
      ocrResult.text,
      uploadedFile.originalFilename,
      finalCategory,
      qualityMetrics?.qualityScore || ocrResult.confidence
    );

    // STEP 4: Extract Entities
    let entities;
    try {
      entities = await extractEntities(
        ocrResult.text,
        finalCategory,
        ocrResult.pageCount || 1
      );
      console.log(
        `✓ Entity extraction: ${entities.persons.length} persons, ${entities.dates.length} dates`
      );
    } catch (error) {
      console.error(`⚠️ Entity extraction failed:`, error);
      entities = {
        persons: [],
        dates: [],
        addresses: [],
        medical: [],
        employment: [],
      };
    }

    // STEP 5: RECA Compliance Check
    let complianceResult;
    try {
      if (uploadedFile.intakeSessionId) {
        const allDocuments = await db.uploadedFile.findMany({
          where: { intakeSessionId: uploadedFile.intakeSessionId },
          select: { id: true, category: true, ocrText: true, metadata: true },
        });

        complianceResult = await checkRECACompliance(
          entities,
          allDocuments as any,
          ocrResult.text,
          finalCategory,
          {
            userSelectedCategory,
            aiCategorizationResult: categorizationResult,
            heuristicReason: heuristicCategorization?.reason,
            heuristicSignals: heuristicCategorization?.matchedSignals,
            autoCorrected: categoryAutoCorrected,
            categoryLocked: categoryIsLocked,
          }
        );
        console.log(
          `✓ Compliance check: ${complianceResult.claimTypeSuspected}, ${(complianceResult.checklistCoverage * 100).toFixed(0)}% complete`
        );
      }
    } catch (error) {
      console.error(`⚠️ Compliance check failed:`, error);
    }

    // STEP 6: Risk Analysis
    let riskAnalysis;
    if (complianceResult) {
      try {
        const riskOptions: Parameters<typeof analyzeRisks>[2] = {
          documentText: ocrResult.text,
        };

        if (qualityMetrics) {
          riskOptions.qualityMetrics = {
            qualityScore: qualityMetrics.qualityScore,
            isBlurry: qualityMetrics.isBlurry || false,
            isLowContrast: qualityMetrics.isLowContrast || false,
            recommendations: qualityMetrics.recommendations,
          };
        }

        riskAnalysis = await analyzeRisks(
          entities,
          complianceResult,
          riskOptions
        );
        console.log(
          `✓ Risk analysis: ${riskAnalysis.totalRisks} risks (${riskAnalysis.highSeverityCount} high)`
        );
      } catch (error) {
        console.error(`⚠️ Risk analysis failed:`, error);
      }
    }

    let otherDocumentAnalysis;
    if (finalCategory === "OTHER") {
      try {
        otherDocumentAnalysis = await analyzeOtherDocument(
          ocrResult.text,
          uploadedFile.originalFilename
        );
      } catch (error) {
        console.error("OTHER document analysis failed:", error);
      }
    }

    // STEP 7: Store Results
    const existingMetadata = parseUploadedFileMetadata(uploadedFile.metadata);
    const metadata = {
      ...existingMetadata,
      ocrConfidence: ocrResult.confidence,
      // Which cascade tier each page landed on (the OCR cost) and its confidence
      ocrTier: ocrResult.method,
      ocrPages: ocrResult.pages,
      processingTimeMs: ocrResult.processingTimeMs,
      pageCount: ocrResult.pageCount,
      textLength: ocrResult.text.length,
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
      categoryInsights: {
        userSelectedCategory,
        finalCategory,
        autoCorrected: categoryAutoCorrected,
        autoCorrectionSource: categoryAutoCorrectionSource,
        heuristicReason: heuristicCategorization?.reason,
        heuristicSignals: heuristicCategorization?.matchedSignals,
        categoryLocked: categoryIsLocked,
      },
      entities,
      entitiesExtractedAt: new Date().toISOString(),
      compliance: complianceResult,
      complianceCheckedAt: complianceResult
        ? new Date().toISOString()
        : undefined,
      documentQualification: complianceResult?.documentQualification,
      risks: riskAnalysis,
      risksAnalyzedAt: riskAnalysis ? new Date().toISOString() : undefined,
      otherDocumentAnalysis,
    };

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

    // Update tags
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
        reprocessed: true,
      },
    });

    console.log(`✅ Re-processing complete for ${fileId}`);

    return NextResponse.json({
      success: true,
      file: updatedFile,
      intelligence: {
        ocrConfidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        category: finalCategory,
        qualityScore: qualityMetrics?.qualityScore,
        tags: documentTags,
        entitiesExtracted: !!entities,
        complianceChecked: !!complianceResult,
        risksAnalyzed: !!riskAnalysis,
      },
    });
  } catch (error) {
    console.error("Document processing error:", error);

    // Update file status to FAILED
    try {
      await db.uploadedFile.update({
        where: { id: params.fileId },
        data: { status: "FAILED" },
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
    let metadata: Record<string, any> = {};
    if (uploadedFile.metadata) {
      try {
        metadata =
          typeof uploadedFile.metadata === "string"
            ? JSON.parse(uploadedFile.metadata)
            : (uploadedFile.metadata as Record<string, any>);
      } catch {
        metadata = {};
      }
    }

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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const documentSchema = z.object({
  claimantId: z.string(),
  type: z.enum(["ID", "Medical", "ProofOfResidency", "Other"]),
  fileKey: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

/**
 * GET /api/documents?sessionId=xxx
 * Get all uploaded documents for a session
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Get uploaded files for this session with AI intelligence data and validation
    const files = await db.uploadedFile.findMany({
      where: {
        intakeSessionId: sessionId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      include: {
        tags: {
          select: {
            tag: true,
            confidence: true,
          },
          orderBy: {
            confidence: "desc",
          },
        },
        validation: {
          select: {
            status: true,
            overallConfidence: true,
            classifierResult: true,
          },
        },
      },
    });

    // Transform files to include parsed AI intelligence
    const filesWithIntelligence = files.map((file) => {
      let aiIntelligence = null;
      let qualification = null;
      let otherDocumentAnalysis = null;

      // Parse metadata if file is processed
      if (file.status === "READY" && file.metadata) {
        try {
          const metadata =
            typeof file.metadata === "string"
              ? JSON.parse(file.metadata)
              : file.metadata;

          aiIntelligence = {
            ocrConfidence: file.ocrConfidence,
            textLength:
              typeof metadata?.textLength === "number"
                ? metadata.textLength
                : file.ocrText?.length || 0,
            aiCategory: metadata?.aiCategorization?.suggestedCategory,
            aiCategoryConfidence: metadata?.aiCategorization?.confidence,
            aiReasoning: metadata?.aiCategorization?.reasoning,
            tags: file.tags,
            qualityScore: metadata?.qualityMetrics?.qualityScore,
            recommendations: metadata?.qualityMetrics?.recommendations,
            pageCount: metadata?.pageCount,
          };

          const qualificationSource =
            metadata?.documentQualification ||
            metadata?.compliance?.documentQualification;

          if (qualificationSource) {
            qualification = {
              status: qualificationSource.status,
              confidence: qualificationSource.confidence,
              reason: qualificationSource.reason,
              matchedRequirementName:
                qualificationSource.matchedRequirement?.name,
              matchedRequirementCategory:
                qualificationSource.matchedRequirement?.category,
              matchedRequirementPriority:
                qualificationSource.matchedRequirement?.priority,
              djApprovalImpact: qualificationSource.djApprovalImpact,
              userActionNeeded: qualificationSource.userActionNeeded,
              suggestion: qualificationSource.suggestion,
              issues: qualificationSource.issues ?? [],
              categoryMismatch: qualificationSource.categoryMismatch ?? null,
            };
          }

          if (metadata?.otherDocumentAnalysis) {
            otherDocumentAnalysis = metadata.otherDocumentAnalysis;
          }
        } catch (error) {
          console.error("Failed to parse metadata for file:", file.id, error);
        }
      }

      // Parse validation data to extract category from classifierResult
      let validationData = null;
      if (file.validation) {
        let category = null;

        // Extract category from classifierResult JSON
        if (file.validation.classifierResult) {
          try {
            const classifierResult =
              typeof file.validation.classifierResult === "string"
                ? JSON.parse(file.validation.classifierResult)
                : file.validation.classifierResult;
            category = classifierResult?.data?.category || null;
          } catch (error) {
            console.error("Failed to parse classifierResult:", error);
          }
        }

        validationData = {
          status: file.validation.status,
          category,
          confidence: file.validation.overallConfidence,
        };
      }

      return {
        id: file.id,
        category: file.category,
        categoryLocked: file.categoryLocked,
        originalFilename: file.originalFilename,
        fileKey: file.fileKey,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        status: file.status,
        uploadedAt: file.uploadedAt,
        requiresOriginal: file.requiresOriginal,
        thumbnailKey: file.thumbnailKey,
        rejectionReason: file.rejectionReason,
        aiIntelligence,
        qualification,
        otherDocumentAnalysis,
        validation: validationData,
      };
    });

    return NextResponse.json({ files: filesWithIntelligence });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = documentSchema.parse(body);

    const document = await db.document.create({
      data: validated,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

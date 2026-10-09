import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToR2, getObject } from "@/lib/r2";
import { nanoid } from "nanoid";
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
import { sendUploadConfirmationEmail } from "@/lib/email";
import { assertInviteTokenAccess } from "@/lib/collaboration";
import {
  parseUploadedFileMetadata,
  type ContributorUploadAttribution,
} from "@/lib/uploaded-file-metadata";

// Allow up to 60 seconds for upload + AI processing on Vercel
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;
    const category = formData.get("category") as string | null;
    const requiresOriginal = formData.get("requiresOriginal") === "true";
    const inviteToken = formData.get("inviteToken") as string | null;
    const contributorSiblingIndex = formData.get("contributorSiblingIndex");
    const contributorSiblingName = formData.get("contributorSiblingName");
    const contributorTaskId = formData.get("contributorTaskId");
    const contributorTaskTitle = formData.get("contributorTaskTitle");
    const contributorWorkspace = formData.get("contributorWorkspace");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Document category is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    // Verify session exists and get claimant info for upload confirmation
    const session = await db.intakeSession.findUnique({
      where: { id: sessionId },
      include: {
        claimant: { select: { email: true, firstName: true, lastName: true } },
        uploadedFiles: { select: { id: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 404 }
      );
    }

    let contributorAttribution: ContributorUploadAttribution | undefined;
    if (inviteToken) {
      const access = await assertInviteTokenAccess({
        intakeSessionId: sessionId,
        token: inviteToken,
      });

      if (!access.ok) {
        return NextResponse.json(
          {
            error:
              "reason" in access && access.reason === "expired"
                ? "Invite expired"
                : "Forbidden",
          },
          {
            status:
              "reason" in access && access.reason === "expired" ? 410 : 403,
          }
        );
      }

      const parsedSiblingIndex =
        contributorSiblingIndex !== null &&
        contributorSiblingIndex !== undefined &&
        contributorSiblingIndex !== ""
          ? Number(contributorSiblingIndex)
          : undefined;

      contributorAttribution = {
        source: "collaborator_invite",
        inviteId: access.invite.id,
        inviteName: access.invite.name ?? null,
        siblingIndex:
          parsedSiblingIndex !== undefined &&
          Number.isFinite(parsedSiblingIndex)
            ? parsedSiblingIndex
            : undefined,
        siblingName:
          typeof contributorSiblingName === "string"
            ? contributorSiblingName
            : undefined,
        taskId:
          typeof contributorTaskId === "string" ? contributorTaskId : undefined,
        taskTitle:
          typeof contributorTaskTitle === "string"
            ? contributorTaskTitle
            : undefined,
        workspace:
          typeof contributorWorkspace === "string"
            ? contributorWorkspace
            : undefined,
        uploadedAt: new Date().toISOString(),
      };
    }

    // Generate unique file key for R2
    const fileExtension = file.name.split(".").pop();
    const fileKey = `${sessionId}/${nanoid()}.${fileExtension}`;

    // Upload to R2
    const { key: r2Key } = await uploadToR2(fileKey, file, file.type);

    // Create database record
    const uploadedFile = await db.uploadedFile.create({
      data: {
        intakeSessionId: sessionId,
        fileKey: r2Key, // Store the R2 key
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        category: category as any,
        status: "UPLOADING",
        requiresOriginal: requiresOriginal,
        uploadedAt: new Date(),
        metadata: contributorAttribution
          ? JSON.stringify({
              contributorAttribution,
            })
          : null,
      },
    });

    // Send upload confirmation email (fire-and-forget)
    if (session.claimant?.email && session.resumeToken) {
      const totalUploaded = (session.uploadedFiles?.length || 0) + 1;
      sendUploadConfirmationEmail({
        to: session.claimant.email,
        name: `${session.claimant.firstName} ${session.claimant.lastName}`,
        documentType: category || "Document",
        totalUploaded,
        resumeToken: session.resumeToken,
      }).catch((err) =>
        console.error("Failed to send upload confirmation email:", err)
      );
    }

    // Process document synchronously so Vercel doesn't kill the function.
    // The frontend shows a "Processing" state and polls for completion.
    // maxDuration=60 gives us enough time for OCR + AI analysis.
    let processingError: string | null = null;
    try {
      await processDocumentInBackground(uploadedFile.id, r2Key, file.type);
    } catch (error) {
      console.error("Document processing failed:", error);
      processingError =
        error instanceof Error ? error.message : "Processing failed";
    }

    return NextResponse.json(
      {
        success: true,
        fileId: uploadedFile.id,
        category: uploadedFile.category,
        requiresOriginal: uploadedFile.requiresOriginal,
        message: processingError
          ? "File uploaded but AI analysis encountered an error. You can retry from the document page."
          : "File uploaded and analyzed successfully.",
        processingComplete: !processingError,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all documents for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const files = await db.uploadedFile.findMany({
      where: { intakeSessionId: sessionId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * Process document in background with AI intelligence
 */
async function processDocumentInBackground(
  fileId: string,
  fileKey: string,
  mimeType: string
) {
  try {
    console.log(`🔬 Starting background processing for file: ${fileId}`);

    // Update status to PROCESSING
    await db.uploadedFile.update({
      where: { id: fileId },
      data: { status: "PROCESSING" },
    });

    // Download file from R2
    const fileBuffer = await getObject(fileKey);
    if (!fileBuffer) {
      throw new Error("Failed to download file from storage");
    }

    const currentFile = await db.uploadedFile.findUnique({
      where: { id: fileId },
      select: {
        category: true,
        originalFilename: true,
        categoryLocked: true,
        metadata: true,
      },
    });

    const userSelectedCategory = currentFile?.category as FileCategory | null;

    // STEP 1: OCR & Quality Analysis
    const { ocrResult, qualityMetrics } = await processDocument(
      fileBuffer,
      mimeType
    );

    console.log(
      `✓ OCR completed for ${fileId}: ${ocrResult.text.length} chars extracted`
    );

    // STEP 2: AI Categorization (if we have enough text)
    let finalCategory: FileCategory = userSelectedCategory ?? "OTHER";
    let categorizationResult;
    let categoryAutoCorrected = false;
    let categoryAutoCorrectionSource: "ai" | "heuristic" | undefined;
    let heuristicCategorization;

    const categoryIsLocked = currentFile?.categoryLocked ?? false;

    if (ocrResult.text.length > 20) {
      categorizationResult = await categorizeDocument(
        ocrResult.text,
        currentFile?.originalFilename || "",
        currentFile?.category as FileCategory | undefined
      );

      // Use AI category if confidence is high and no manual category set
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
        `✓ AI categorization for ${fileId}: ${finalCategory} (${(categorizationResult.confidence * 100).toFixed(0)}%)`
      );
    }

    heuristicCategorization = detectCategoryFromText(ocrResult.text);

    if (
      heuristicCategorization &&
      heuristicCategorization.confidence >= 0.85 &&
      heuristicCategorization.category !== finalCategory &&
      !categoryIsLocked
    ) {
      console.log(
        `⚙️  Heuristic recategorization applied for ${fileId}: ${finalCategory} → ${heuristicCategorization.category}`
      );
      finalCategory = heuristicCategorization.category;
      categoryAutoCorrected = true;
      categoryAutoCorrectionSource = "heuristic";
    }

    // STEP 3: Generate Smart Tags
    const documentTags = await generateDocumentTags(
      ocrResult.text,
      "", // filename not needed here
      finalCategory,
      qualityMetrics?.qualityScore || ocrResult.confidence
    );

    console.log(`✓ Generated ${documentTags.length} tags for ${fileId}`);

    // STEP 4: Extract Entities (Phase 2)
    let entities;
    try {
      entities = await extractEntities(
        ocrResult.text,
        finalCategory,
        ocrResult.pageCount || 1
      );
      console.log(
        `✓ Entity extraction for ${fileId}: ${entities.persons.length} persons, ${entities.dates.length} dates, ${entities.addresses.length} addresses`
      );
    } catch (error) {
      console.error(`⚠️ Entity extraction failed for ${fileId}:`, error);
      // Continue processing even if entity extraction fails
      entities = {
        persons: [],
        dates: [],
        addresses: [],
        medical: [],
        employment: [],
      };
    }

    // STEP 5: RECA Compliance Check (Phase 2)
    let complianceResult;
    try {
      // Get all documents for this session
      const uploadedFile = await db.uploadedFile.findUnique({
        where: { id: fileId },
        select: { intakeSessionId: true },
      });

      if (uploadedFile?.intakeSessionId) {
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
          `✓ Compliance check for ${fileId}: ${complianceResult.claimTypeSuspected} claim, ${(complianceResult.checklistCoverage * 100).toFixed(0)}% complete`
        );
      }
    } catch (error) {
      console.error(`⚠️ Compliance check failed for ${fileId}:`, error);
      // Continue processing even if compliance check fails
    }

    // STEP 6: Risk Analysis (Phase 2)
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
          `✓ Risk analysis for ${fileId}: ${riskAnalysis.totalRisks} risks found (${riskAnalysis.highSeverityCount} high severity)`
        );
      } catch (error) {
        console.error(`⚠️ Risk analysis failed for ${fileId}:`, error);
        // Continue processing even if risk analysis fails
      }
    }

    let otherDocumentAnalysis;
    if (finalCategory === "OTHER") {
      try {
        otherDocumentAnalysis = await analyzeOtherDocument(
          ocrResult.text,
          currentFile?.originalFilename || fileId
        );
      } catch (error) {
        console.error("OTHER document analysis failed:", error);
      }
    }

    // STEP 7: Store Results
    const existingMetadata = parseUploadedFileMetadata(currentFile?.metadata);
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
      // Phase 2: Entity extraction
      entities: entities,
      entitiesExtractedAt: new Date().toISOString(),
      // Phase 2: Compliance check
      compliance: complianceResult,
      complianceCheckedAt: complianceResult
        ? new Date().toISOString()
        : undefined,
      documentQualification: complianceResult?.documentQualification,
      djApprovalImpact:
        complianceResult?.documentQualification?.djApprovalImpact,
      qualificationSuggestion:
        complianceResult?.documentQualification?.suggestion,
      qualificationUserAction:
        complianceResult?.documentQualification?.userActionNeeded,
      // Phase 2: Risk analysis
      risks: riskAnalysis,
      risksAnalyzedAt: riskAnalysis ? new Date().toISOString() : undefined,
      otherDocumentAnalysis,
    };

    // Update file record
    await db.uploadedFile.update({
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

    // Create tags
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

    console.log(`✅ Background processing complete for ${fileId}`);
  } catch (error) {
    console.error(`❌ Background processing failed for ${fileId}:`, error);

    // Update file status to FAILED
    await db.uploadedFile.update({
      where: { id: fileId },
      data: { status: "FAILED" },
    });
  }
}

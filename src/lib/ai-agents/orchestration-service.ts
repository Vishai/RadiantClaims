/**
 * AI Validation Orchestration Service
 *
 * Orchestrates the execution of all AI validation agents in the correct order.
 * Handles document-level validation, session-level data extraction, and completeness checks.
 *
 * Execution Flow:
 * Phase 1 (Document-Level): Classifier → Validation Agents (parallel)
 * Phase 2 (Session-Level): Data Extraction
 * Phase 3 (Session-Level): Completeness Check
 */

import {
  ClassifierAgent,
  IdentityVerificationAgent,
  MedicalComplianceAgent,
  ResidenceProofAgent,
  EmploymentVerificationAgent,
  DataExtractionAgent,
  CompletenessOrchestratorAgent,
} from "./agents";
import { db } from "@/lib/db";
import type { AgentExecutionContext } from "./base-agent";
import type { CompletenessResult } from "./types/agent-results";

/**
 * Helper to format category names for display
 */
function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Below this OCR confidence a document goes to staff review instead of proceeding. */
const OCR_REVIEW_THRESHOLD = parseFloat(
  process.env.OCR_REVIEW_THRESHOLD || "0.6"
);
/** Below this extraction confidence (lowest of classifier and validation agent) it goes to review. */
const EXTRACTION_REVIEW_THRESHOLD = parseFloat(
  process.env.EXTRACTION_REVIEW_THRESHOLD || "0.7"
);

/**
 * Result type for document validation
 */
export interface DocumentValidationResult {
  uploadedFileId: string;
  status: "SUCCESS" | "FAILED";
  category?: string;
  error?: string;
}

/**
 * Result type for session validation
 */
export interface SessionValidationResult {
  totalDocuments: number;
  validated: number;
  failed: number;
  results: DocumentValidationResult[];
}

/**
 * Result type for full validation pipeline
 */
export interface FullValidationResult {
  documentsValidated: number;
  documentsFailed: number;
  dataExtracted: boolean;
  readinessScore: number;
  isReadyForSubmission: boolean;
  error?: string;
}

// ============================================================================
// PHASE 1: Document-Level Validation
// ============================================================================

/**
 * Validate a single uploaded document
 *
 * Process:
 * 1. Run ClassifierAgent to determine document category
 * 2. Based on category, run appropriate validation agent:
 *    - IDENTITY → IdentityVerificationAgent
 *    - MEDICAL_* → MedicalComplianceAgent
 *    - RESIDENCE_* → ResidenceProofAgent
 *    - EMPLOYMENT_RECORDS → EmploymentVerificationAgent
 * 3. Update DocumentValidation status in database
 *
 * @param uploadedFileId - The ID of the UploadedFile to validate
 * @returns Promise that resolves when validation is complete
 * @throws Error if document not found or validation fails
 */
export async function validateDocument(
  uploadedFileId: string
): Promise<DocumentValidationResult> {
  try {
    // Fetch the uploaded file from database
    const file = await db.uploadedFile.findUnique({
      where: { id: uploadedFileId },
    });

    if (!file) {
      throw new Error(`UploadedFile ${uploadedFileId} not found`);
    }

    // Create or update DocumentValidation record to PROCESSING status
    await db.documentValidation.upsert({
      where: { uploadedFileId },
      create: {
        uploadedFileId,
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
      update: {
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
    });

    // Build agent execution context
    const context: AgentExecutionContext = {
      uploadedFileId,
      intakeSessionId: file.intakeSessionId,
      documentUrl: file.fileKey,
      documentText: file.ocrText || undefined,
      userSelectedCategory: file.category || undefined,
      categoryLocked: file.categoryLocked || false,
      metadata: {},
    };

    // Step 1: Classify the document
    const classifierAgent = new ClassifierAgent();
    const classificationResult = await classifierAgent.execute(context);
    // The image fallback can come back without a category; that's a document a
    // person needs to look at, not an error.
    const aiCategory = classificationResult.data.category || "OTHER";

    // Step 1.5: Check for category mismatch
    let finalStatus: "VERIFIED" | "NEEDS_REVIEW" = "VERIFIED";
    const warnings: Array<{
      code: string;
      message: string;
      severity: "WARNING" | "INFO";
    }> = [];
    if (!classificationResult.data.category) {
      finalStatus = "NEEDS_REVIEW";
      warnings.push({
        code: "UNCLASSIFIED",
        message:
          "We couldn't tell what kind of document this is, so a reviewer will categorize it.",
        severity: "WARNING",
      });
    }

    if (
      context.userSelectedCategory &&
      context.userSelectedCategory !== aiCategory
    ) {
      const userCategoryFormatted = formatCategoryName(
        context.userSelectedCategory
      );
      const aiCategoryFormatted = formatCategoryName(aiCategory);
      const confidence = classificationResult.confidence;

      if (context.categoryLocked) {
        // User has locked the category - just warn, don't change status
        warnings.push({
          code: "CATEGORY_MISMATCH_LOCKED",
          message: `Category locked as "${userCategoryFormatted}". AI detected this as "${aiCategoryFormatted}" with ${Math.round(confidence * 100)}% confidence, but respecting your selection.`,
          severity: "INFO",
        });
        console.log(
          `⚠️  Category mismatch (locked): User="${context.userSelectedCategory}", AI="${aiCategory}"`
        );
      } else if (confidence >= 0.75) {
        // High confidence mismatch - flag for review
        warnings.push({
          code: "CATEGORY_MISMATCH_HIGH_CONFIDENCE",
          message: `AI detected this as "${aiCategoryFormatted}" with ${Math.round(confidence * 100)}% confidence, but you selected "${userCategoryFormatted}". Please review the category.`,
          severity: "WARNING",
        });
        finalStatus = "NEEDS_REVIEW";
        console.log(
          `⚠️  Category mismatch (high confidence): User="${context.userSelectedCategory}", AI="${aiCategory}" (${Math.round(confidence * 100)}%)`
        );
      } else {
        // Low confidence mismatch - just inform
        warnings.push({
          code: "CATEGORY_MISMATCH_LOW_CONFIDENCE",
          message: `AI suggested "${aiCategoryFormatted}" (${Math.round(confidence * 100)}% confidence), but you selected "${userCategoryFormatted}". Your selection has been kept.`,
          severity: "INFO",
        });
        console.log(
          `ℹ️  Category mismatch (low confidence): User="${context.userSelectedCategory}", AI="${aiCategory}" (${Math.round(confidence * 100)}%)`
        );
      }
    }

    // Use AI category for validation agent routing
    const category = aiCategory;

    // Step 2: Run appropriate validation agent based on category
    const medicalCategories = [
      "PATHOLOGY_REPORT",
      "MEDICAL_RECORDS",
      "DISCHARGE_SUMMARY",
      "TUMOR_REGISTRY",
      "TREATMENT_RECORDS",
    ];

    const residenceCategories = [
      "PROOF_OF_RESIDENCE",
      "UTILITY_BILL",
      "MORTGAGE_STATEMENT",
      "TAX_RETURN",
      "SCHOOL_RECORDS",
    ];

    let validationConfidence: number | undefined;
    if (category === "IDENTITY") {
      const identityAgent = new IdentityVerificationAgent();
      validationConfidence = (await identityAgent.execute(context)).confidence;
    } else if (medicalCategories.includes(category)) {
      const medicalAgent = new MedicalComplianceAgent();
      validationConfidence = (await medicalAgent.execute(context)).confidence;
    } else if (residenceCategories.includes(category)) {
      const residenceAgent = new ResidenceProofAgent();
      validationConfidence = (await residenceAgent.execute(context)).confidence;
    } else if (category === "EMPLOYMENT_RECORDS") {
      const employmentAgent = new EmploymentVerificationAgent();
      validationConfidence = (await employmentAgent.execute(context))
        .confidence;
    }
    // For 'OTHER' category, we only classify but don't run validation

    // Step 3: Confidence routing. A misread page doesn't throw: it produces
    // confident-looking text and a clean extraction. So nothing proceeds on
    // low confidence at either hop; it goes to the staff review queue instead.
    const extractionConfidence = Math.min(
      classificationResult.confidence,
      validationConfidence ?? 1
    );
    const ocrConfidence = file.ocrConfidence ?? undefined;
    if (ocrConfidence !== undefined && ocrConfidence < OCR_REVIEW_THRESHOLD) {
      finalStatus = "NEEDS_REVIEW";
      warnings.push({
        code: "LOW_OCR_CONFIDENCE",
        message: `Text on this document was read with ${Math.round(ocrConfidence * 100)}% confidence, so a reviewer will check it before it's used.`,
        severity: "WARNING",
      });
    }
    if (extractionConfidence < EXTRACTION_REVIEW_THRESHOLD) {
      finalStatus = "NEEDS_REVIEW";
      warnings.push({
        code: "LOW_EXTRACTION_CONFIDENCE",
        message: `The details on this document were extracted with ${Math.round(extractionConfidence * 100)}% confidence, so a reviewer will confirm them.`,
        severity: "WARNING",
      });
    }

    // Mark document validation as complete with appropriate status
    await db.documentValidation.update({
      where: { uploadedFileId },
      data: {
        status: finalStatus,
        overallConfidence: extractionConfidence,
        warnings: warnings.length > 0 ? warnings : [],
        processingCompletedAt: new Date(),
      },
    });

    return {
      uploadedFileId,
      status: "SUCCESS",
      category,
    };
  } catch (error) {
    // Mark document validation as rejected
    try {
      await db.documentValidation.update({
        where: { uploadedFileId },
        data: {
          status: "REJECTED",
          processingCompletedAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error("Failed to update DocumentValidation status:", dbError);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Document validation failed for ${uploadedFileId}:`,
      errorMessage
    );

    return {
      uploadedFileId,
      status: "FAILED",
      error: errorMessage,
    };
  }
}

/**
 * Validate all documents in a session (Phase 1)
 *
 * Runs validation for all uploaded files in parallel.
 * Uses Promise.allSettled to continue even if some documents fail.
 *
 * @param intakeSessionId - The ID of the IntakeSession
 * @returns Summary of validation results
 * @throws Error if session not found
 */
export async function validateSession(
  intakeSessionId: string
): Promise<SessionValidationResult> {
  // Fetch the session with all uploaded files
  const session = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    include: {
      uploadedFiles: true,
    },
  });

  if (!session) {
    throw new Error(`IntakeSession ${intakeSessionId} not found`);
  }

  if (session.uploadedFiles.length === 0) {
    return {
      totalDocuments: 0,
      validated: 0,
      failed: 0,
      results: [],
    };
  }

  // Run validation for all files in parallel
  // Use allSettled to continue even if some fail (Continue on Error strategy)
  const results = await Promise.allSettled(
    session.uploadedFiles.map((file) => validateDocument(file.id))
  );

  // Process results
  const validationResults: DocumentValidationResult[] = results.map(
    (result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // Extract uploadedFileId from error if possible
        return {
          uploadedFileId: "unknown",
          status: "FAILED",
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        };
      }
    }
  );

  const validated = validationResults.filter(
    (r) => r.status === "SUCCESS"
  ).length;
  const failed = validationResults.filter((r) => r.status === "FAILED").length;

  return {
    totalDocuments: session.uploadedFiles.length,
    validated,
    failed,
    results: validationResults,
  };
}

// ============================================================================
// PHASE 2: Session-Level Data Extraction
// ============================================================================

/**
 * Run data extraction for a session (Phase 2)
 *
 * Prerequisites: All documents should be validated (Phase 1 complete)
 * Consolidates data from all document validation results into a unified structure.
 * Stores result in IntakeSession.recaFormData for form pre-fill.
 *
 * @param intakeSessionId - The ID of the IntakeSession
 * @returns Promise that resolves when data extraction is complete
 * @throws Error if session not found or data extraction fails
 */
export async function extractSessionData(
  intakeSessionId: string
): Promise<void> {
  // Fetch the session
  const session = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    include: {
      uploadedFiles: true,
    },
  });

  if (!session) {
    throw new Error(`IntakeSession ${intakeSessionId} not found`);
  }

  // Check if all documents have been validated
  const validations = await db.documentValidation.findMany({
    where: {
      uploadedFileId: {
        in: session.uploadedFiles.map((f) => f.id),
      },
    },
  });

  const allValidated = session.uploadedFiles.every((file) =>
    validations.find(
      (v) => v.uploadedFileId === file.id && v.status === "VERIFIED"
    )
  );

  if (!allValidated) {
    console.warn(
      `Not all documents validated for session ${intakeSessionId}. Proceeding with data extraction anyway.`
    );
  }

  // Build context for data extraction (session-level, no specific document)
  const context: AgentExecutionContext = {
    intakeSessionId,
    documentUrl: "", // Not used for session-level agents
    metadata: {
      uploadedFileIds: session.uploadedFiles.map((f) => f.id),
    },
  };

  // Run DataExtractionAgent
  const dataExtractionAgent = new DataExtractionAgent();
  const extractionResult = await dataExtractionAgent.execute(context);

  // Store extracted data in IntakeSession.recaFormData
  await db.intakeSession.update({
    where: { id: intakeSessionId },
    data: {
      recaFormData: extractionResult.data as any,
    },
  });

  console.log(`Data extraction completed for session ${intakeSessionId}`);
}

// ============================================================================
// PHASE 3: Session-Level Completeness Check
// ============================================================================

/**
 * Run completeness check for a session (Phase 3)
 *
 * Prerequisites: Data extraction should be complete (Phase 2)
 * Analyzes the entire claim to determine if it's ready for submission.
 * Calculates readiness score (0-100) and identifies missing documents.
 * Stores result in ClaimReadiness table.
 *
 * @param intakeSessionId - The ID of the IntakeSession
 * @returns Completeness analysis result with readiness score
 * @throws Error if session not found or completeness check fails
 */
export async function checkSessionCompleteness(
  intakeSessionId: string
): Promise<CompletenessResult> {
  // Fetch the session
  const session = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    include: {
      uploadedFiles: true,
    },
  });

  if (!session) {
    throw new Error(`IntakeSession ${intakeSessionId} not found`);
  }

  // Check if data extraction has been completed
  if (!session.recaFormData) {
    console.warn(
      `Data extraction not yet completed for session ${intakeSessionId}. Proceeding with completeness check anyway.`
    );
  }

  // Build context for completeness check (session-level)
  const context: AgentExecutionContext = {
    intakeSessionId,
    documentUrl: "", // Not used for session-level agents
    metadata: {
      uploadedFileIds: session.uploadedFiles.map((f) => f.id),
      recaFormData: session.recaFormData || {},
    },
  };

  // Run CompletenessOrchestratorAgent
  const completenessAgent = new CompletenessOrchestratorAgent();
  const completenessResult = await completenessAgent.execute(context);

  // Store result in ClaimReadiness table
  await db.claimReadiness.upsert({
    where: { intakeSessionId },
    create: {
      intakeSessionId,
      readinessScore: completenessResult.readinessScore,
      isReadyForSubmission: completenessResult.isReadyForSubmission,
      criticalBlockers: completenessResult.criticalBlockers as any,
      warnings: completenessResult.warnings as any,
      completeness: completenessResult.completeness as any,
      nameConsistent: completenessResult.crossDocumentValidation.nameConsistent,
      datesConsistent:
        completenessResult.crossDocumentValidation.datesConsistent,
      claimTypeConfidence:
        completenessResult.crossDocumentValidation.claimTypeConfidence,
      detectedClaimType: completenessResult.crossDocumentValidation
        .detectedClaimType as any,
    },
    update: {
      readinessScore: completenessResult.readinessScore,
      isReadyForSubmission: completenessResult.isReadyForSubmission,
      criticalBlockers: completenessResult.criticalBlockers as any,
      warnings: completenessResult.warnings as any,
      completeness: completenessResult.completeness as any,
      nameConsistent: completenessResult.crossDocumentValidation.nameConsistent,
      datesConsistent:
        completenessResult.crossDocumentValidation.datesConsistent,
      claimTypeConfidence:
        completenessResult.crossDocumentValidation.claimTypeConfidence,
      detectedClaimType: completenessResult.crossDocumentValidation
        .detectedClaimType as any,
      lastAssessedAt: new Date(),
    },
  });

  console.log(
    `Completeness check completed for session ${intakeSessionId}. Readiness score: ${completenessResult.readinessScore}`
  );

  return completenessResult;
}

// ============================================================================
// FULL PIPELINE: All Phases
// ============================================================================

/**
 * Run the full validation pipeline for a session
 *
 * Executes all three phases in order:
 * 1. Document validation (parallel)
 * 2. Data extraction (sequential)
 * 3. Completeness check (sequential)
 *
 * This is the main entry point for validating an entire claim.
 *
 * @param intakeSessionId - The ID of the IntakeSession
 * @returns Summary of full validation including readiness score
 * @throws Error if any critical step fails
 */
export async function runFullValidation(
  intakeSessionId: string
): Promise<FullValidationResult> {
  try {
    console.log(
      `Starting full validation pipeline for session ${intakeSessionId}`
    );

    // Phase 1: Validate all documents in parallel
    console.log("Phase 1: Validating documents...");
    const sessionValidation = await validateSession(intakeSessionId);
    console.log(
      `Phase 1 complete: ${sessionValidation.validated}/${sessionValidation.totalDocuments} documents validated`
    );

    // Phase 2: Extract data from all validated documents
    console.log("Phase 2: Extracting session data...");
    await extractSessionData(intakeSessionId);
    console.log("Phase 2 complete: Data extraction successful");

    // Phase 3: Check claim completeness and readiness
    console.log("Phase 3: Checking claim completeness...");
    const completenessResult = await checkSessionCompleteness(intakeSessionId);
    console.log(
      `Phase 3 complete: Readiness score ${completenessResult.readinessScore}/100`
    );

    console.log(
      `Full validation pipeline completed for session ${intakeSessionId}`
    );

    return {
      documentsValidated: sessionValidation.validated,
      documentsFailed: sessionValidation.failed,
      dataExtracted: true,
      readinessScore: completenessResult.readinessScore,
      isReadyForSubmission: completenessResult.isReadyForSubmission,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Full validation pipeline failed for session ${intakeSessionId}:`,
      errorMessage
    );

    throw new Error(`Full validation failed: ${errorMessage}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current validation status for a session
 *
 * Useful for progress tracking and status polling.
 *
 * @param intakeSessionId - The ID of the IntakeSession
 * @returns Current validation status and progress
 */
export async function getValidationStatus(intakeSessionId: string): Promise<{
  totalDocuments: number;
  completed: number;
  processing: number;
  failed: number;
  pending: number;
  dataExtracted: boolean;
  completenessChecked: boolean;
  readinessScore?: number;
}> {
  const session = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    include: {
      uploadedFiles: {
        include: {
          validation: true,
        },
      },
      claimReadiness: true,
    },
  });

  if (!session) {
    throw new Error(`IntakeSession ${intakeSessionId} not found`);
  }

  const validations = session.uploadedFiles
    .map((f) => f.validation)
    .filter(Boolean);

  const completed = validations.filter((v) => v?.status === "VERIFIED").length;
  const processing = validations.filter(
    (v) => v?.status === "PROCESSING"
  ).length;
  const failed = validations.filter((v) => v?.status === "REJECTED").length;
  const pending = session.uploadedFiles.length - validations.length;

  return {
    totalDocuments: session.uploadedFiles.length,
    completed,
    processing,
    failed,
    pending,
    dataExtracted: !!session.recaFormData,
    completenessChecked: !!session.claimReadiness,
    readinessScore: session.claimReadiness?.readinessScore,
  };
}

/**
 * Re-validate a single document
 *
 * Useful when a document is updated or staff wants to re-run validation.
 *
 * @param uploadedFileId - The ID of the UploadedFile to re-validate
 */
export async function revalidateDocument(
  uploadedFileId: string
): Promise<DocumentValidationResult> {
  // Delete existing validation results
  await db.documentValidation.deleteMany({
    where: { uploadedFileId },
  });

  // Run validation again
  return validateDocument(uploadedFileId);
}

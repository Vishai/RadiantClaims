/**
 * Completeness Orchestrator Agent
 *
 * A claim-level agent that analyzes all documents together to determine:
 * - Whether the claim is ready for submission
 * - What documents are missing
 * - Cross-document validation (name consistency, date consistency, etc.)
 * - Detected claim type and confidence
 * - Actionable recommendations
 *
 * This agent operates at the session level and depends on results from all other agents.
 */

import type { AgentExecutionContext } from "../base-agent";
import type {
  CompletenessResult,
  Issue,
  ClassifierResult,
  IdentityResult,
  MedicalResult,
  ResidenceResult,
  EmploymentResult,
} from "../types/agent-results";
import { db } from "@/lib/db";
import { ClaimType, AgentExecutionStatus } from "@prisma/client";

// Document categories required for RECA claims
interface DocumentRequirement {
  category: string;
  required: boolean;
  minDocuments: number;
  description: string;
  claimTypes?: ClaimType[]; // If specified, only required for these claim types
}

const RECA_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    category: "Identity Documents",
    required: true,
    minDocuments: 1,
    description: "Birth certificate or government-issued ID",
  },
  {
    category: "Medical Records",
    required: true,
    minDocuments: 1,
    description:
      "Pathology reports, medical records, or diagnosis documentation",
  },
  {
    category: "Residence Proof",
    required: true,
    minDocuments: 1,
    description:
      "Utility bills, tax returns, or other proof of residence in covered counties",
    claimTypes: [ClaimType.DOWNWINDER],
  },
  {
    category: "Employment Verification",
    required: true,
    minDocuments: 1,
    description: "Employment records from DOE facilities or uranium mines",
    claimTypes: [ClaimType.URANIUM_WORKER, ClaimType.ONSITE_PARTICIPANT],
  },
];

export class CompletenessOrchestratorAgent {
  private readonly agentName = "CompletenessOrchestratorAgent";
  private readonly agentVersion = "1.0";

  /**
   * Main execution method
   */
  async execute(context: AgentExecutionContext): Promise<CompletenessResult> {
    const startTime = Date.now();
    const logId = await this.createExecutionLog(context);

    try {
      await this.updateExecutionLog(logId, AgentExecutionStatus.RUNNING);

      const result = await this.analyze(context);

      const processingTimeMs = Date.now() - startTime;

      await this.storeResult(context, result, logId);
      await this.updateExecutionLog(logId, AgentExecutionStatus.COMPLETED, {
        output: result,
        executionTimeMs: processingTimeMs,
      });

      return result;
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.updateExecutionLog(logId, AgentExecutionStatus.FAILED, {
        error: errorMessage,
        executionTimeMs: processingTimeMs,
      });

      throw error;
    }
  }

  private async analyze(
    context: AgentExecutionContext
  ): Promise<CompletenessResult> {
    if (!context.intakeSessionId) {
      throw new Error(
        "intakeSessionId is required for CompletenessOrchestratorAgent"
      );
    }

    // Fetch session with all documents and validations
    const session = await db.intakeSession.findUnique({
      where: { id: context.intakeSessionId },
      include: {
        uploadedFiles: {
          include: {
            validation: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error(`IntakeSession ${context.intakeSessionId} not found`);
    }

    // Collect all validation results
    const validations = session.uploadedFiles
      .map((f) => f.validation)
      .filter((v) => v !== null);

    const classifierResults: (ClassifierResult & {
      fileId: string;
      fileName: string;
    })[] = [];
    const identityResults: IdentityResult[] = [];
    const medicalResults: MedicalResult[] = [];
    const residenceResults: ResidenceResult[] = [];
    const employmentResults: EmploymentResult[] = [];

    for (const file of session.uploadedFiles) {
      const validation = file.validation;
      if (!validation) continue;

      if (validation.classifierResult) {
        classifierResults.push({
          ...(validation.classifierResult as unknown as ClassifierResult),
          fileId: file.id,
          fileName: file.originalFilename,
        });
      }
      if (validation.identityResult) {
        identityResults.push(
          validation.identityResult as unknown as IdentityResult
        );
      }
      if (validation.medicalResult) {
        medicalResults.push(
          validation.medicalResult as unknown as MedicalResult
        );
      }
      if (validation.residenceResult) {
        residenceResults.push(
          validation.residenceResult as unknown as ResidenceResult
        );
      }
      if (validation.employmentResult) {
        employmentResults.push(
          validation.employmentResult as unknown as EmploymentResult
        );
      }
    }

    // Detect claim type
    const claimTypeDetection = this.detectClaimType(
      residenceResults,
      employmentResults,
      session.claimType || undefined
    );

    // Perform cross-document validation
    const crossDocValidation = this.performCrossDocumentValidation(
      identityResults,
      medicalResults,
      residenceResults
    );

    // Collect all critical issues and warnings
    const criticalBlockers: Issue[] = [];
    const warnings: Issue[] = [];

    for (const validation of validations) {
      if (validation.criticalIssues) {
        criticalBlockers.push(
          ...(validation.criticalIssues as unknown as Issue[])
        );
      }
      if (validation.warnings) {
        warnings.push(...(validation.warnings as unknown as Issue[]));
      }
    }

    // Add cross-document validation issues
    if (!crossDocValidation.nameConsistent) {
      criticalBlockers.push({
        severity: "CRITICAL",
        code: "NAME_INCONSISTENCY",
        message: "Name is inconsistent across documents",
        suggestion:
          "Ensure all documents show the same name, or provide documentation for name changes (marriage certificate, court order, etc.)",
        affectsApproval: true,
      });
    }

    if (!crossDocValidation.datesConsistent) {
      warnings.push({
        severity: "WARNING",
        code: "DATE_INCONSISTENCY",
        message: "Dates appear inconsistent across documents",
        suggestion:
          "Review all dates to ensure timeline makes sense (birth date, diagnosis date, residence dates, etc.)",
        affectsApproval: false,
      });
    }

    // Analyze completeness by category
    const completenessAnalysis = this.analyzeCompleteness(
      classifierResults,
      session.uploadedFiles,
      claimTypeDetection.detectedClaimType
    );

    // Add missing document issues
    for (const section of completenessAnalysis.sections) {
      if (section.status === "INCOMPLETE" && section.required) {
        criticalBlockers.push({
          severity: "CRITICAL",
          code: "MISSING_REQUIRED_DOCUMENTS",
          message: `Missing required documents: ${section.category}`,
          suggestion:
            section.documents.length === 0
              ? `Upload at least ${section.minDocuments} document(s) for ${section.category}`
              : `Need ${section.minDocuments - section.currentDocuments} more document(s) for ${section.category}`,
          affectsApproval: true,
        });
      }
    }

    // Calculate readiness score
    const readinessScore = this.calculateReadinessScore(
      completenessAnalysis.overallPercent,
      criticalBlockers.length,
      warnings.length,
      crossDocValidation
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      completenessAnalysis,
      criticalBlockers,
      warnings,
      claimTypeDetection.detectedClaimType
    );

    // Estimate approval probability
    const estimatedApprovalProbability = this.estimateApprovalProbability(
      readinessScore,
      criticalBlockers.length,
      completenessAnalysis.overallPercent
    );

    const isReadyForSubmission =
      criticalBlockers.length === 0 && readinessScore >= 80;

    return {
      readinessScore,
      isReadyForSubmission,
      completeness: completenessAnalysis,
      criticalBlockers,
      warnings,
      crossDocumentValidation: {
        ...crossDocValidation,
        detectedClaimType: claimTypeDetection.detectedClaimType || undefined,
        claimTypeConfidence: claimTypeDetection.confidence,
      },
      recommendations,
      estimatedApprovalProbability,
    };
  }

  private async storeResult(
    context: AgentExecutionContext,
    result: CompletenessResult,
    _logId: string
  ): Promise<void> {
    if (!context.intakeSessionId) {
      throw new Error("intakeSessionId is required");
    }

    // Store in ClaimReadiness table
    await db.claimReadiness.upsert({
      where: { intakeSessionId: context.intakeSessionId },
      create: {
        intakeSessionId: context.intakeSessionId,
        readinessScore: result.readinessScore,
        isReadyForSubmission: result.isReadyForSubmission,
        completeness: result.completeness as any,
        criticalBlockers: result.criticalBlockers as any,
        warnings: result.warnings as any,
        nameConsistent: result.crossDocumentValidation.nameConsistent,
        datesConsistent: result.crossDocumentValidation.datesConsistent,
        detectedClaimType: result.crossDocumentValidation
          .detectedClaimType as ClaimType | null,
        claimTypeConfidence:
          result.crossDocumentValidation.claimTypeConfidence || null,
      },
      update: {
        readinessScore: result.readinessScore,
        isReadyForSubmission: result.isReadyForSubmission,
        completeness: result.completeness as any,
        criticalBlockers: result.criticalBlockers as any,
        warnings: result.warnings as any,
        nameConsistent: result.crossDocumentValidation.nameConsistent,
        datesConsistent: result.crossDocumentValidation.datesConsistent,
        detectedClaimType: result.crossDocumentValidation
          .detectedClaimType as ClaimType | null,
        claimTypeConfidence:
          result.crossDocumentValidation.claimTypeConfidence || null,
        lastAssessedAt: new Date(),
      },
    });

    // Update IntakeSession with detected claim type if not already set
    if (
      result.crossDocumentValidation.detectedClaimType &&
      !context.metadata?.skipClaimTypeUpdate
    ) {
      const currentSession = await db.intakeSession.findUnique({
        where: { id: context.intakeSessionId },
        select: { claimType: true },
      });

      if (!currentSession?.claimType) {
        await db.intakeSession.update({
          where: { id: context.intakeSessionId },
          data: {
            claimType: result.crossDocumentValidation
              .detectedClaimType as ClaimType,
          },
        });
      }
    }
  }

  /**
   * Detect claim type based on documents
   */
  private detectClaimType(
    residenceResults: ResidenceResult[],
    employmentResults: EmploymentResult[],
    existingClaimType?: ClaimType
  ): { detectedClaimType: string | null; confidence: number } {
    // If claim type is already set, return it
    if (existingClaimType) {
      return { detectedClaimType: existingClaimType, confidence: 1.0 };
    }

    // Detect based on available evidence
    const hasResidenceProof = residenceResults.some(
      (r) => r.data.inCoveredArea
    );
    const hasEmploymentProof = employmentResults.some(
      (e) => e.data.isCoveredFacility
    );
    const exposureType = employmentResults.find(
      (e) => e.data.occupationalExposure.detected
    )?.data.occupationalExposure.type;

    // Uranium worker - has employment at uranium facility
    if (exposureType?.includes("uranium")) {
      return { detectedClaimType: ClaimType.URANIUM_WORKER, confidence: 0.9 };
    }

    // Onsite participant - has employment at test site
    if (exposureType?.includes("onsite")) {
      return {
        detectedClaimType: ClaimType.ONSITE_PARTICIPANT,
        confidence: 0.9,
      };
    }

    // Downwinder - has residence proof in covered county but no employment
    if (hasResidenceProof && !hasEmploymentProof) {
      return { detectedClaimType: ClaimType.DOWNWINDER, confidence: 0.85 };
    }

    // Has both - could be either, lean toward employment-based
    if (hasResidenceProof && hasEmploymentProof) {
      return { detectedClaimType: ClaimType.URANIUM_WORKER, confidence: 0.7 };
    }

    return { detectedClaimType: null, confidence: 0 };
  }

  /**
   * Perform cross-document validation
   */
  private performCrossDocumentValidation(
    identityResults: IdentityResult[],
    medicalResults: MedicalResult[],
    residenceResults: ResidenceResult[]
  ): {
    nameConsistent: boolean;
    datesConsistent: boolean;
    addressesConsistent: boolean;
  } {
    // Check name consistency
    const names = identityResults
      .map((r) => r.data.fullName?.toLowerCase().trim())
      .filter(Boolean);
    const nameConsistent = names.length === 0 || new Set(names).size === 1;

    // Check date consistency (birth date should be before diagnosis date, etc.)
    let datesConsistent = true;
    const birthDates = identityResults
      .map((r) => r.data.dateOfBirth)
      .filter(Boolean);
    const diagnosisDates = medicalResults
      .map((r) => r.data.diagnosisDate)
      .filter(Boolean);

    if (birthDates.length > 0 && diagnosisDates.length > 0) {
      const latestBirth = new Date(
        Math.max(...birthDates.map((d) => new Date(d!).getTime()))
      );
      const earliestDiagnosis = new Date(
        Math.min(...diagnosisDates.map((d) => new Date(d!).getTime()))
      );

      // Diagnosis should be after birth
      if (earliestDiagnosis <= latestBirth) {
        datesConsistent = false;
      }
    }

    // Check address consistency (basic check - same county across residence docs)
    const counties = residenceResults
      .map((r) => r.data.address?.county?.toLowerCase().trim())
      .filter(Boolean);
    const addressesConsistent =
      counties.length === 0 || new Set(counties).size <= 2; // Allow up to 2 different counties

    return {
      nameConsistent,
      datesConsistent,
      addressesConsistent,
    };
  }

  /**
   * Analyze document completeness by category
   */
  private analyzeCompleteness(
    classifierResults: (ClassifierResult & {
      fileId: string;
      fileName: string;
    })[],
    _allFiles: any[],
    detectedClaimType?: string | null
  ): CompletenessResult["completeness"] {
    const sections: CompletenessResult["completeness"]["sections"] = [];

    for (const requirement of RECA_DOCUMENT_REQUIREMENTS) {
      // Skip if not required for this claim type
      if (
        requirement.claimTypes &&
        detectedClaimType &&
        !requirement.claimTypes.includes(detectedClaimType as ClaimType)
      ) {
        continue;
      }

      // Find documents matching this category
      const matchingDocs = classifierResults.filter((cr) =>
        this.categoryMatches(cr.data.category, requirement.category)
      );

      const documents = matchingDocs.map((cr) => ({
        fileId: cr.fileId,
        fileName: cr.fileName,
        status: (cr.status === "PASS"
          ? "VERIFIED"
          : cr.status === "FAIL"
            ? "NEEDS_REVIEW"
            : "PROCESSING") as "VERIFIED" | "NEEDS_REVIEW" | "PROCESSING",
      }));

      const currentDocuments = matchingDocs.length;
      const status: "COMPLETE" | "INCOMPLETE" | "NEEDS_REVIEW" =
        currentDocuments >= requirement.minDocuments
          ? matchingDocs.some((cr) => cr.status !== "PASS")
            ? "NEEDS_REVIEW"
            : "COMPLETE"
          : "INCOMPLETE";

      sections.push({
        category: requirement.category,
        required: requirement.required,
        minDocuments: requirement.minDocuments,
        currentDocuments,
        status,
        documents,
      });
    }

    // Calculate overall completion percentage
    const totalRequired = sections.filter((s) => s.required).length;
    const completed = sections.filter((s) => s.status === "COMPLETE").length;
    const overallPercent =
      totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;

    return {
      sections,
      overallPercent,
    };
  }

  /**
   * Check if a document category matches a requirement category
   */
  private categoryMatches(
    documentCategory: string,
    requirementCategory: string
  ): boolean {
    const categoryMap: Record<string, string[]> = {
      "Identity Documents": ["IDENTITY"],
      "Medical Records": [
        "PATHOLOGY_REPORT",
        "MEDICAL_RECORDS",
        "DISCHARGE_SUMMARY",
        "TUMOR_REGISTRY",
        "TREATMENT_RECORDS",
      ],
      "Residence Proof": [
        "PROOF_OF_RESIDENCE",
        "UTILITY_BILL",
        "MORTGAGE_STATEMENT",
        "TAX_RETURN",
        "SCHOOL_RECORDS",
      ],
      "Employment Verification": ["EMPLOYMENT_RECORDS"],
    };

    const allowedCategories = categoryMap[requirementCategory] || [];
    return allowedCategories.includes(documentCategory);
  }

  /**
   * Calculate overall readiness score (0-100)
   */
  private calculateReadinessScore(
    completenessPercent: number,
    criticalBlockersCount: number,
    warningsCount: number,
    crossDocValidation: { nameConsistent: boolean; datesConsistent: boolean }
  ): number {
    let score = completenessPercent;

    // Deduct points for critical blockers
    score -= criticalBlockersCount * 20;

    // Deduct points for warnings
    score -= warningsCount * 5;

    // Deduct points for cross-doc validation failures
    if (!crossDocValidation.nameConsistent) score -= 30;
    if (!crossDocValidation.datesConsistent) score -= 10;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    completeness: CompletenessResult["completeness"],
    criticalBlockers: Issue[],
    warnings: Issue[],
    claimType?: string | null
  ): string[] {
    const recommendations: string[] = [];

    // Incomplete sections
    const incompleteSections = completeness.sections.filter(
      (s) => s.status === "INCOMPLETE"
    );
    for (const section of incompleteSections) {
      const needed = section.minDocuments - section.currentDocuments;
      recommendations.push(
        `Upload ${needed} more document(s) for ${section.category} to meet minimum requirements`
      );
    }

    // Documents needing review
    const reviewSections = completeness.sections.filter(
      (s) => s.status === "NEEDS_REVIEW"
    );
    for (const section of reviewSections) {
      recommendations.push(
        `Review and address issues in ${section.category} documents to improve validation status`
      );
    }

    // Critical blockers
    if (criticalBlockers.length > 0) {
      recommendations.push(
        `Resolve ${criticalBlockers.length} critical issue(s) before submission`
      );
    }

    // Warnings
    if (warnings.length > 3) {
      recommendations.push(
        `Address ${warnings.length} warning(s) to improve claim quality`
      );
    }

    // Claim type specific recommendations
    if (claimType === ClaimType.DOWNWINDER) {
      recommendations.push(
        "For downwinder claims, ensure residence documents clearly show county and dates during 1951-1958"
      );
    } else if (claimType === ClaimType.URANIUM_WORKER) {
      recommendations.push(
        "For uranium worker claims, ensure employment records show facility name and employment dates during 1942-1971"
      );
    }

    // General recommendation if ready
    if (incompleteSections.length === 0 && criticalBlockers.length === 0) {
      recommendations.push(
        "Claim appears complete - review all information before final submission"
      );
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Estimate probability of approval (0-1)
   */
  private estimateApprovalProbability(
    readinessScore: number,
    criticalBlockersCount: number,
    completenessPercent: number
  ): number {
    // Cannot approve with critical blockers
    if (criticalBlockersCount > 0) {
      return 0;
    }

    // Base probability on readiness score and completeness
    const baseProb =
      (readinessScore / 100) * 0.7 + (completenessPercent / 100) * 0.3;

    // Boost if very complete
    const boost = completenessPercent === 100 ? 0.1 : 0;

    return Math.max(0, Math.min(1, baseProb + boost));
  }

  /**
   * Create an execution log entry
   */
  private async createExecutionLog(
    context: AgentExecutionContext
  ): Promise<string> {
    const log = await db.agentExecutionLog.create({
      data: {
        agentName: this.agentName,
        agentVersion: this.agentVersion,
        uploadedFileId: context.uploadedFileId,
        intakeSessionId: context.intakeSessionId,
        status: AgentExecutionStatus.PENDING,
        input: {
          documentUrl: context.documentUrl,
          hasOCRText: !!context.documentText,
          metadata: context.metadata || {},
        } as any,
        modelUsed: "gpt-4o",
      },
    });

    return log.id;
  }

  /**
   * Update an execution log entry
   */
  private async updateExecutionLog(
    logId: string,
    status: AgentExecutionStatus,
    data?: {
      output?: unknown;
      error?: string;
      executionTimeMs?: number;
    }
  ): Promise<void> {
    await db.agentExecutionLog.update({
      where: { id: logId },
      data: {
        status,
        completedAt:
          status === AgentExecutionStatus.COMPLETED ||
          status === AgentExecutionStatus.FAILED
            ? new Date()
            : undefined,
        output: data?.output as any,
        error: data?.error,
        executionTimeMs: data?.executionTimeMs,
      },
    });
  }
}

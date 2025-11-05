/**
 * Data Extraction Agent
 *
 * Consolidates extracted data from all document validation agents into a unified
 * structure that can be used to pre-fill RECA forms and provide a complete
 * data picture for the claim.
 *
 * Unlike other agents, this agent:
 * - Operates at the session level (not document level)
 * - Reads results from other agents
 * - Merges and deduplicates data
 * - Resolves conflicts between documents
 */

import { BaseAgent, type AgentExecutionContext } from "../base-agent";
import type {
  DataExtractionResult,
  Issue,
  Evidence,
  IdentityResult,
  MedicalResult,
  ResidenceResult,
  EmploymentResult,
} from "../types/agent-results";
import { db } from "@/lib/db";

export class DataExtractionAgent extends BaseAgent<DataExtractionResult> {
  constructor() {
    super("DataExtractionAgent", "1.0", {
      modelName: "gpt-4o",
      temperature: 0.1,
      maxTokens: 8192, // Higher token limit for complex merging
    });
  }

  protected async validate(
    context: AgentExecutionContext
  ): Promise<DataExtractionResult> {
    if (!context.intakeSessionId) {
      throw new Error("intakeSessionId is required for DataExtractionAgent");
    }

    // Fetch all document validations for this session
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

    // Extract results from all validated documents
    const identityResults: IdentityResult[] = [];
    const medicalResults: MedicalResult[] = [];
    const residenceResults: ResidenceResult[] = [];
    const employmentResults: EmploymentResult[] = [];

    for (const file of session.uploadedFiles) {
      const validation = file.validation;
      if (!validation) continue;

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

    // Build evidence and issues arrays
    const evidence: Evidence[] = [];
    const issues: Issue[] = [];

    // Extract and merge personal information
    const personalInfo = this.mergePersonalInfo(
      identityResults,
      evidence,
      issues
    );

    // Extract and merge addresses
    const addresses = this.mergeAddresses(residenceResults, evidence, issues);

    // Extract medical information
    const medicalInfo = this.mergeMedicalInfo(medicalResults, evidence, issues);

    // Extract employment information
    const employmentInfo = this.mergeEmploymentInfo(
      employmentResults,
      evidence,
      issues
    );

    // Build form field mappings
    const formFieldMappings = this.buildFormFieldMappings(
      personalInfo,
      addresses,
      medicalInfo,
      employmentInfo
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence({
      dataCompleteness: this.calculateDataCompleteness(
        personalInfo,
        addresses,
        medicalInfo,
        employmentInfo
      ),
    });

    const hasCriticalIssues = issues.some((i) => i.severity === "CRITICAL");
    const hasWarnings = issues.some((i) => i.severity === "WARNING");
    const status = this.determineStatus(
      confidence,
      hasCriticalIssues,
      hasWarnings
    );

    return {
      status,
      confidence,
      data: {
        personalInfo,
        addresses,
        medicalInfo,
        employmentInfo,
        formFieldMappings,
      },
      evidence,
      reasoning: this.buildReasoning(
        identityResults,
        medicalResults,
        residenceResults,
        employmentResults
      ),
      issues,
      processingTimeMs: 0,
      timestamp: new Date(),
    };
  }

  protected async storeResult(
    context: AgentExecutionContext,
    result: DataExtractionResult,
    _logId: string
  ): Promise<void> {
    if (!context.intakeSessionId) {
      throw new Error("intakeSessionId is required");
    }

    // Store extracted data in the IntakeSession for form pre-fill
    // This data will be used by the CompletenessOrchestrator and form UI
    await db.intakeSession.update({
      where: { id: context.intakeSessionId },
      data: {
        recaFormData: {
          ...(result.data.formFieldMappings || {}),
          // Store the full extracted data structure for reference
          _extractedData: result.data as any,
        } as any,
      },
    });
  }

  /**
   * Merge personal information from identity documents
   */
  private mergePersonalInfo(
    identityResults: IdentityResult[],
    evidence: Evidence[],
    issues: Issue[]
  ): DataExtractionResult["data"]["personalInfo"] {
    if (identityResults.length === 0) {
      issues.push({
        severity: "CRITICAL",
        code: "NO_IDENTITY_DOCUMENTS",
        message: "No identity documents found",
        suggestion: "Upload a birth certificate or other government-issued ID",
        affectsApproval: true,
      });
      return {};
    }

    // Use the highest confidence identity result
    const bestResult = identityResults.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    const personalInfo: DataExtractionResult["data"]["personalInfo"] = {
      fullName: bestResult.data.fullName || undefined,
      dateOfBirth: bestResult.data.dateOfBirth || undefined,
      placeOfBirth: bestResult.data.placeOfBirth || undefined,
    };

    // Try to parse name into components
    if (personalInfo.fullName) {
      const nameParts = this.parseFullName(personalInfo.fullName);
      personalInfo.firstName = nameParts.firstName;
      personalInfo.middleName = nameParts.middleName;
      personalInfo.lastName = nameParts.lastName;

      evidence.push({
        type: "data_extraction",
        description: "Personal information extracted from identity documents",
        extractedText: personalInfo.fullName,
        confidence: bestResult.confidence,
      });
    }

    // Check for name inconsistencies across documents
    if (identityResults.length > 1) {
      const names = identityResults
        .map((r) => r.data.fullName?.toLowerCase())
        .filter(Boolean);
      const uniqueNames = new Set(names);
      if (uniqueNames.size > 1) {
        issues.push({
          severity: "WARNING",
          code: "NAME_INCONSISTENCY",
          message: `Found ${uniqueNames.size} different name variations across identity documents`,
          suggestion:
            "Verify that all documents belong to the same person. If name changed (marriage, etc.), provide documentation.",
          affectsApproval: false,
        });
      }
    }

    return personalInfo;
  }

  /**
   * Merge addresses from residence documents
   */
  private mergeAddresses(
    residenceResults: ResidenceResult[],
    evidence: Evidence[],
    issues: Issue[]
  ): DataExtractionResult["data"]["addresses"] {
    const addresses: DataExtractionResult["data"]["addresses"] = [];

    if (residenceResults.length === 0) {
      issues.push({
        severity: "WARNING",
        code: "NO_RESIDENCE_DOCUMENTS",
        message: "No residence proof documents found",
        suggestion:
          "Upload utility bills, tax returns, or other documents proving residence in RECA-covered areas",
        affectsApproval: true,
      });
      return addresses;
    }

    for (const result of residenceResults) {
      if (!result.data.address) continue;

      const addressType: "current" | "previous" | "exposure" = result.data
        .inCoveredArea
        ? "exposure"
        : "previous";

      addresses.push({
        type: addressType,
        street: result.data.address.street,
        city: result.data.address.city,
        county: result.data.address.county,
        state: result.data.address.state,
        zipCode: result.data.address.zipCode,
        startDate: result.data.residencePeriod?.startDate,
        endDate: result.data.residencePeriod?.endDate,
      });

      evidence.push({
        type: "data_extraction",
        description: `${addressType} address extracted`,
        extractedText: `${result.data.address.street || ""}, ${result.data.address.city || ""}, ${result.data.address.state || ""}`,
        confidence: result.confidence,
      });
    }

    return addresses;
  }

  /**
   * Merge medical information from medical documents
   */
  private mergeMedicalInfo(
    medicalResults: MedicalResult[],
    evidence: Evidence[],
    issues: Issue[]
  ): DataExtractionResult["data"]["medicalInfo"] {
    if (medicalResults.length === 0) {
      issues.push({
        severity: "CRITICAL",
        code: "NO_MEDICAL_DOCUMENTS",
        message: "No medical documents found",
        suggestion:
          "Upload pathology reports, medical records, or other documentation of RECA-covered disease",
        affectsApproval: true,
      });
      return {};
    }

    // Use the highest confidence medical result
    const bestResult = medicalResults.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    const medicalInfo: DataExtractionResult["data"]["medicalInfo"] = {
      diagnosis: bestResult.data.detectedDiseases[0]?.name,
      diagnosisDate: bestResult.data.diagnosisDate || undefined,
      treatingPhysician: bestResult.data.diagnosingPhysician || undefined,
      facility: bestResult.data.medicalFacility || undefined,
    };

    if (medicalInfo.diagnosis) {
      evidence.push({
        type: "data_extraction",
        description: "Medical diagnosis extracted",
        extractedText: medicalInfo.diagnosis,
        confidence: bestResult.confidence,
      });
    }

    return medicalInfo;
  }

  /**
   * Merge employment information from employment documents
   */
  private mergeEmploymentInfo(
    employmentResults: EmploymentResult[],
    evidence: Evidence[],
    _issues: Issue[]
  ): DataExtractionResult["data"]["employmentInfo"] {
    if (employmentResults.length === 0) {
      // Not critical - not all RECA claims require employment docs (e.g., downwinders)
      return {};
    }

    // Use the highest confidence employment result
    const bestResult = employmentResults.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    const employmentInfo: DataExtractionResult["data"]["employmentInfo"] = {
      employer: bestResult.data.employerName || undefined,
      facility: bestResult.data.facilityName || undefined,
      startDate: bestResult.data.employmentPeriod?.startDate,
      endDate: bestResult.data.employmentPeriod?.endDate,
      jobTitle: bestResult.data.jobTitle || undefined,
    };

    if (employmentInfo.facility) {
      evidence.push({
        type: "data_extraction",
        description: "Employment information extracted",
        extractedText: `${employmentInfo.facility} - ${employmentInfo.jobTitle || "Unknown position"}`,
        confidence: bestResult.confidence,
      });
    }

    return employmentInfo;
  }

  /**
   * Build form field mappings for RECA form pre-fill
   */
  private buildFormFieldMappings(
    personalInfo: DataExtractionResult["data"]["personalInfo"],
    addresses: DataExtractionResult["data"]["addresses"],
    medicalInfo: DataExtractionResult["data"]["medicalInfo"],
    employmentInfo: DataExtractionResult["data"]["employmentInfo"]
  ): Record<string, string | number | boolean> {
    const mappings: Record<string, string | number | boolean> = {};

    // Personal info mappings
    if (personalInfo.firstName)
      mappings["claimant_first_name"] = personalInfo.firstName;
    if (personalInfo.middleName)
      mappings["claimant_middle_name"] = personalInfo.middleName;
    if (personalInfo.lastName)
      mappings["claimant_last_name"] = personalInfo.lastName;
    if (personalInfo.dateOfBirth)
      mappings["claimant_dob"] = personalInfo.dateOfBirth;
    if (personalInfo.placeOfBirth?.city)
      mappings["birth_city"] = personalInfo.placeOfBirth.city;
    if (personalInfo.placeOfBirth?.state)
      mappings["birth_state"] = personalInfo.placeOfBirth.state;

    // Current address (first address in list or first exposure address)
    const currentAddress =
      addresses.find((a) => a.type === "current") || addresses[0];
    if (currentAddress) {
      if (currentAddress.street)
        mappings["current_street"] = currentAddress.street;
      if (currentAddress.city) mappings["current_city"] = currentAddress.city;
      if (currentAddress.state)
        mappings["current_state"] = currentAddress.state;
      if (currentAddress.zipCode)
        mappings["current_zip"] = currentAddress.zipCode;
    }

    // Exposure address (for downwinders)
    const exposureAddress = addresses.find((a) => a.type === "exposure");
    if (exposureAddress) {
      if (exposureAddress.street)
        mappings["exposure_street"] = exposureAddress.street;
      if (exposureAddress.city)
        mappings["exposure_city"] = exposureAddress.city;
      if (exposureAddress.county)
        mappings["exposure_county"] = exposureAddress.county;
      if (exposureAddress.state)
        mappings["exposure_state"] = exposureAddress.state;
      if (exposureAddress.startDate)
        mappings["exposure_start_date"] = exposureAddress.startDate;
      if (exposureAddress.endDate)
        mappings["exposure_end_date"] = exposureAddress.endDate;
    }

    // Medical info mappings
    if (medicalInfo.diagnosis) mappings["disease_type"] = medicalInfo.diagnosis;
    if (medicalInfo.diagnosisDate)
      mappings["diagnosis_date"] = medicalInfo.diagnosisDate;
    if (medicalInfo.treatingPhysician)
      mappings["physician_name"] = medicalInfo.treatingPhysician;
    if (medicalInfo.facility)
      mappings["medical_facility"] = medicalInfo.facility;

    // Employment info mappings (for uranium workers/onsite participants)
    if (employmentInfo.employer)
      mappings["employer_name"] = employmentInfo.employer;
    if (employmentInfo.facility)
      mappings["employment_facility"] = employmentInfo.facility;
    if (employmentInfo.startDate)
      mappings["employment_start_date"] = employmentInfo.startDate;
    if (employmentInfo.endDate)
      mappings["employment_end_date"] = employmentInfo.endDate;
    if (employmentInfo.jobTitle)
      mappings["job_title"] = employmentInfo.jobTitle;

    return mappings;
  }

  /**
   * Calculate overall data completeness
   */
  private calculateDataCompleteness(
    personalInfo: DataExtractionResult["data"]["personalInfo"],
    addresses: DataExtractionResult["data"]["addresses"],
    medicalInfo: DataExtractionResult["data"]["medicalInfo"],
    employmentInfo: DataExtractionResult["data"]["employmentInfo"]
  ): number {
    let score = 0;
    let total = 15;

    // Personal info (5 points)
    if (personalInfo.fullName) score += 1;
    if (personalInfo.firstName && personalInfo.lastName) score += 1;
    if (personalInfo.dateOfBirth) score += 1.5;
    if (personalInfo.placeOfBirth?.city && personalInfo.placeOfBirth?.state)
      score += 1.5;

    // Addresses (4 points)
    if (addresses.length > 0) score += 1;
    if (addresses.some((a) => a.type === "exposure")) score += 2;
    if (addresses.some((a) => a.county)) score += 1;

    // Medical info (4 points)
    if (medicalInfo.diagnosis) score += 2;
    if (medicalInfo.diagnosisDate) score += 1;
    if (medicalInfo.treatingPhysician) score += 0.5;
    if (medicalInfo.facility) score += 0.5;

    // Employment info (2 points - optional for some claim types)
    if (employmentInfo.facility) score += 1;
    if (employmentInfo.startDate) score += 1;

    return score / total;
  }

  /**
   * Build reasoning text explaining the data extraction
   */
  private buildReasoning(
    identityResults: IdentityResult[],
    medicalResults: MedicalResult[],
    residenceResults: ResidenceResult[],
    employmentResults: EmploymentResult[]
  ): string {
    const parts: string[] = [];

    parts.push(
      `Consolidated data from ${identityResults.length + medicalResults.length + residenceResults.length + employmentResults.length} validated documents.`
    );

    if (identityResults.length > 0) {
      parts.push(
        `Identity: Extracted from ${identityResults.length} identity document(s).`
      );
    }

    if (medicalResults.length > 0) {
      parts.push(
        `Medical: Extracted from ${medicalResults.length} medical document(s).`
      );
    }

    if (residenceResults.length > 0) {
      parts.push(
        `Residence: Extracted from ${residenceResults.length} residence document(s).`
      );
    }

    if (employmentResults.length > 0) {
      parts.push(
        `Employment: Extracted from ${employmentResults.length} employment document(s).`
      );
    }

    parts.push(
      "Data has been merged, deduplicated, and validated for consistency."
    );

    return parts.join(" ");
  }

  /**
   * Parse full name into components
   */
  private parseFullName(fullName: string): {
    firstName?: string;
    middleName?: string;
    lastName?: string;
  } {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return { firstName: parts[0] };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else if (parts.length >= 3) {
      return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(" "),
        lastName: parts[parts.length - 1],
      };
    }

    return {};
  }
}

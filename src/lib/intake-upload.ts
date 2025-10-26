/**
 * Client-side helper functions for Step 2 intake file uploads
 */

export type FileCategory =
  | "IDENTITY"
  | "PROOF_OF_RESIDENCE"
  | "PATHOLOGY_REPORT"
  | "MEDICAL_RECORDS"
  | "DISCHARGE_SUMMARY"
  | "TUMOR_REGISTRY"
  | "TREATMENT_RECORDS"
  | "UTILITY_BILL"
  | "MORTGAGE_STATEMENT"
  | "TAX_RETURN"
  | "SCHOOL_RECORDS"
  | "EMPLOYMENT_RECORDS"
  | "OTHER";

export interface UploadFileParams {
  file: File;
  intakeSessionId: string;
  category?: FileCategory;
  onProgress?: (progress: number) => void;
}

export interface UploadFileResult {
  uploadedFileId: string;
  fileKey: string;
  success: boolean;
  error?: string;
}

/**
 * Upload a file to R2 via presigned URL
 * Step 1: Request presigned URL
 * Step 2: Upload file directly to R2
 * Step 3: Confirm upload completion
 */
export async function uploadFile({
  file,
  intakeSessionId,
  category,
  onProgress,
}: UploadFileParams): Promise<UploadFileResult> {
  try {
    // Step 1: Request presigned URL
    onProgress?.(0);
    const uploadRequest = await fetch("/api/intake/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeSessionId,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        category,
      }),
    });

    if (!uploadRequest.ok) {
      const error = await uploadRequest.json();
      throw new Error(error.error || "Failed to request upload URL");
    }

    const { uploadedFileId, putUrl, fileKey } = await uploadRequest.json();

    // Step 2: Upload file to R2
    onProgress?.(25);

    const uploadResponse = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    onProgress?.(75);

    if (!uploadResponse.ok) {
      // Step 3a: Mark upload as failed
      await fetch(`/api/intake/upload/${uploadedFileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: `Upload failed with status ${uploadResponse.status}`,
        }),
      });

      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    // Step 3b: Confirm upload success
    const confirmResponse = await fetch(`/api/intake/upload/${uploadedFileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    });

    if (!confirmResponse.ok) {
      throw new Error("Failed to confirm upload");
    }

    onProgress?.(100);

    return {
      uploadedFileId,
      fileKey,
      success: true,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      uploadedFileId: "",
      fileKey: "",
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete an uploaded file
 */
export async function deleteFile(uploadedFileId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/intake/upload/${uploadedFileId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Create a new intake session
 */
export async function createIntakeSession(params?: {
  claimantId?: string;
  claimType?: string;
  isPremiumService?: boolean;
}) {
  const response = await fetch("/api/intake/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });

  if (!response.ok) {
    throw new Error("Failed to create intake session");
  }

  return response.json();
}

/**
 * Get intake session by resume token
 */
export async function getIntakeSession(token: string) {
  const response = await fetch(`/api/intake/session?token=${token}`);

  if (!response.ok) {
    throw new Error("Failed to retrieve intake session");
  }

  return response.json();
}

/**
 * Update intake session progress
 */
export async function updateIntakeSession(
  sessionId: string,
  data: {
    currentStep?: string;
    status?: string;
    completedSteps?: string[];
    claimType?: string;
    isPremiumService?: boolean;
    claimantId?: string;
  }
) {
  const response = await fetch(`/api/intake/session/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update intake session");
  }

  return response.json();
}

/**
 * Save intake question response
 */
export async function saveIntakeResponse(params: {
  intakeSessionId: string;
  questionKey: string;
  questionText: string;
  answerValue: string;
}) {
  const response = await fetch("/api/intake/response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to save response");
  }

  return response.json();
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
  ];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 50MB limit",
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Accepted: PDF, JPG, PNG, HEIC`,
    };
  }

  return { valid: true };
}

/**
 * Generate suggested filename based on category
 */
export function generateSuggestedFilename(
  claimantName: { firstName: string; lastName: string },
  category: FileCategory,
  originalFilename: string
): string {
  const { firstName, lastName } = claimantName;
  const ext = originalFilename.split(".").pop();
  const date = new Date().toISOString().split("T")[0];

  const categoryMap: Record<FileCategory, string> = {
    IDENTITY: "id",
    PROOF_OF_RESIDENCE: "residence",
    PATHOLOGY_REPORT: "pathology",
    MEDICAL_RECORDS: "medical",
    DISCHARGE_SUMMARY: "discharge",
    TUMOR_REGISTRY: "tumor_registry",
    TREATMENT_RECORDS: "treatment",
    UTILITY_BILL: "utility",
    MORTGAGE_STATEMENT: "mortgage",
    TAX_RETURN: "tax",
    SCHOOL_RECORDS: "school",
    EMPLOYMENT_RECORDS: "employment",
    OTHER: "document",
  };

  const categorySlug = categoryMap[category] || "document";

  return `${lastName}_${firstName}_${categorySlug}_${date}.${ext}`
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");
}

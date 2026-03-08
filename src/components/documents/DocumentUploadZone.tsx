"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DocumentCategorySelector,
  type FileCategory,
} from "./DocumentCategorySelector";

interface PendingFile {
  id: string;
  file: File;
  category?: FileCategory;
  requiresOriginal?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  category: FileCategory;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
  uploadedFileId?: string;
}

interface DocumentUploadZoneProps {
  sessionId: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  className?: string;
  defaultCategory?: FileCategory;
  defaultCategoryLabel?: string;
  defaultCategoryDescription?: string;
  onClearDefaultCategory?: () => void;
}

// Documents that require original copies
const ORIGINAL_REQUIRED_CATEGORIES: FileCategory[] = [
  "IDENTITY",
  "DEATH_CERTIFICATE",
  "BIRTH_CERTIFICATE",
  "MARRIAGE_CERTIFICATE",
  "PATHOLOGY_REPORT",
  "MEDICAL_RECORDS",
  "DISCHARGE_SUMMARY",
  "TUMOR_REGISTRY",
  "TREATMENT_RECORDS",
];

export function DocumentUploadZone({
  sessionId,
  onUploadComplete,
  onUploadError,
  acceptedTypes = ["application/pdf", "image/*"],
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  className,
  defaultCategory,
  defaultCategoryLabel,
  defaultCategoryDescription,
  onClearDefaultCategory,
}: DocumentUploadZoneProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categorizingFile, setCategorizingFile] = useState<PendingFile | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const filesToProcess = Array.from(files);

      // Validate files
      const validFiles: PendingFile[] = [];
      const autoUploadFiles: Array<PendingFile & { category: FileCategory }> =
        [];
      for (const file of filesToProcess) {
        // Check file size
        if (file.size > maxSize) {
          onUploadError?.(
            `File "${file.name}" is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`
          );
          continue;
        }

        // Check file type
        const isValidType = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const baseType = type.replace("/*", "");
            return file.type.startsWith(baseType);
          }
          return file.type === type;
        });

        if (!isValidType) {
          onUploadError?.(
            `File "${file.name}" has an invalid type. Accepted types: ${acceptedTypes.join(", ")}`
          );
          continue;
        }

        const assignedCategory =
          defaultCategory || detectCategoryFromFilename(file.name);
        const nextFile: PendingFile = {
          id: Math.random().toString(36).substring(7),
          file,
          category: assignedCategory,
          requiresOriginal: assignedCategory
            ? ORIGINAL_REQUIRED_CATEGORIES.includes(assignedCategory)
            : undefined,
        };

        if (defaultCategory && assignedCategory) {
          autoUploadFiles.push({
            ...nextFile,
            category: assignedCategory,
          });
          continue;
        }

        validFiles.push(nextFile);
      }

      if (validFiles.length > 0) {
        setPendingFiles((prev) => [...prev, ...validFiles]);
      }

      if (validFiles.length === 1) {
        const onlyFile = validFiles[0];
        if (onlyFile) {
          setCategorizingFile(onlyFile);
        }
      } else {
        // Multiple files - categorize first one
        const firstUncategorized = validFiles.find((f) => !f.category);
        if (firstUncategorized) {
          setCategorizingFile(firstUncategorized);
        }
      }

      for (const file of autoUploadFiles) {
        await uploadFile(file);
      }
    },
    [maxSize, acceptedTypes, defaultCategory, onUploadError]
  );

  const handleCategoryConfirm = async (category: FileCategory) => {
    if (!categorizingFile) return;

    const fileToCategorize = categorizingFile;
    const requiresOriginal = ORIGINAL_REQUIRED_CATEGORIES.includes(category);

    // Update pending file with category
    setPendingFiles((prev) =>
      prev.map((f) =>
        f.id === fileToCategorize.id ? { ...f, category, requiresOriginal } : f
      )
    );

    const remaining = pendingFiles.filter(
      (f) => f.id !== fileToCategorize.id && !f.category
    );

    setCategorizingFile(null);

    // Upload this file
    await uploadFile({
      ...fileToCategorize,
      category,
      requiresOriginal,
    } as PendingFile & { category: FileCategory });

    const nextFile = remaining[0];
    if (nextFile) {
      setCategorizingFile(nextFile);
    }
  };

  const uploadFile = async (
    pendingFile: PendingFile & { category: FileCategory }
  ) => {
    const uploadingFile: UploadingFile = {
      id: pendingFile.id,
      file: pendingFile.file,
      category: pendingFile.category,
      progress: 0,
      status: "uploading",
    };

    setUploadingFiles((prev) => [...prev, uploadingFile]);
    setPendingFiles((prev) => prev.filter((f) => f.id !== pendingFile.id));

    const formData = new FormData();
    formData.append("file", pendingFile.file);
    formData.append("sessionId", sessionId);
    formData.append("category", pendingFile.category);
    if (pendingFile.requiresOriginal) {
      formData.append("requiresOriginal", "true");
    }

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      // Update status to complete
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id
            ? {
                ...f,
                progress: 100,
                status: "complete",
                uploadedFileId: data.fileId,
              }
            : f
        )
      );

      onUploadComplete?.(data.fileId);

      // Remove from list after 2 seconds
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((f) => f.id !== uploadingFile.id)
        );
      }, 2000);
    } catch (error: any) {
      // Update status to error
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id
            ? {
                ...f,
                status: "error",
                error: error.message,
              }
            : f
        )
      );

      onUploadError?.(error.message);
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be uploaded again
      e.target.value = "";
    },
    [handleFiles]
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType === "application/pdf") return FileText;
    return File;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {defaultCategory && defaultCategoryLabel && (
        <div className="rounded-xl border-2 border-terracotta-200 bg-terracotta-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-terracotta-900">
                Uploading for: {defaultCategoryLabel}
              </p>
              <p className="mt-1 text-terracotta-800">
                {defaultCategoryDescription ||
                  "Files chosen here will be saved under the selected document type."}
              </p>
            </div>
            {onClearDefaultCategory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearDefaultCategory}
                className="border-terracotta-200 bg-white text-terracotta-800 hover:bg-terracotta-100"
              >
                Use general uploader
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-blue-900">
              Document Upload Instructions
            </p>
            <p className="mt-1 text-blue-800">
              Upload scans or photos of your documents. We'll help you organize
              your claim packet and identify which documents you'll need.
              Certain documents (such as medical records and vital records)
              typically must be submitted as originals—we'll indicate which ones
              as you upload.
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-terracotta-500 bg-terracotta-50"
            : "border-sage-300 bg-cream-50 hover:border-sage-400 hover:bg-cream-100"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
          <Upload className="h-8 w-8 text-sage-600" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-sage-900">
          {defaultCategoryLabel
            ? `Upload ${defaultCategoryLabel}`
            : "Upload Your Documents"}
        </h3>
        <p className="mb-4 text-sm text-sage-600">
          {defaultCategoryLabel
            ? `Choose scans or photos for ${defaultCategoryLabel.toLowerCase()}.`
            : "Upload scans or photos to help organize your claim packet and verify you have everything needed."}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
          >
            <Upload className="mr-2 h-4 w-4" />
            {defaultCategoryLabel
              ? `Choose ${defaultCategoryLabel}`
              : "Choose Files"}
          </Button>

          {/* Mobile Camera Button (only shows on mobile) */}
          <Button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            variant="outline"
            className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50 sm:hidden"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>

        <p className="mt-4 text-xs text-sage-500">
          Maximum file size: {maxSize / 1024 / 1024}MB • Accepted formats: PDF,
          JPG, PNG
        </p>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((uploadingFile) => {
            const Icon = getFileIcon(uploadingFile.file.type);
            const requiresOriginal = ORIGINAL_REQUIRED_CATEGORIES.includes(
              uploadingFile.category
            );

            return (
              <div
                key={uploadingFile.id}
                className="rounded-xl border border-cream-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sage-100">
                    <Icon className="h-5 w-5 text-sage-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sage-900">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-sage-600">
                          {(uploadingFile.file.size / 1024).toFixed(1)} KB
                          {requiresOriginal && (
                            <span className="ml-2 text-amber-700">
                              • Original may be required
                            </span>
                          )}
                        </p>
                      </div>

                      {uploadingFile.status !== "complete" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(uploadingFile.id)}
                          className="h-6 w-6 flex-shrink-0 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {uploadingFile.status === "uploading" && (
                      <div className="mt-2">
                        <Progress
                          value={uploadingFile.progress}
                          className="h-1"
                        />
                        <p className="mt-1 text-xs text-sage-600">
                          Uploading...
                        </p>
                      </div>
                    )}

                    {uploadingFile.status === "processing" && (
                      <p className="mt-1 text-xs text-sage-600">
                        Processing...
                      </p>
                    )}

                    {uploadingFile.status === "complete" && (
                      <p className="mt-1 text-xs text-emerald-600">
                        ✓ Uploaded — AI analysis in progress
                      </p>
                    )}

                    {uploadingFile.status === "error" && (
                      <p className="mt-1 text-xs text-red-600">
                        ✗ {uploadingFile.error || "Upload failed"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Selector Dialog */}
      {categorizingFile && (
        <DocumentCategorySelector
          open={!!categorizingFile}
          onOpenChange={(open) => {
            if (!open) {
              // Remove from pending if dialog is closed without categorizing
              setPendingFiles((prev) =>
                prev.filter((f) => f.id !== categorizingFile?.id)
              );
              setCategorizingFile(null);
            }
          }}
          detectedCategory={categorizingFile.category}
          onConfirm={handleCategoryConfirm}
          fileName={categorizingFile.file.name}
        />
      )}
    </div>
  );
}

// Auto-detect document category from filename
function detectCategoryFromFilename(
  filename: string
): FileCategory | undefined {
  const lower = filename.toLowerCase();

  if (lower.includes("death")) {
    return "DEATH_CERTIFICATE";
  }

  if (lower.includes("birth")) {
    return "BIRTH_CERTIFICATE";
  }

  if (lower.includes("marriage")) {
    return "MARRIAGE_CERTIFICATE";
  }

  if (lower.includes("certificate")) {
    return "IDENTITY";
  }

  if (
    lower.includes("pathology") ||
    lower.includes("biopsy") ||
    lower.includes("lab")
  ) {
    return "PATHOLOGY_REPORT";
  }

  if (
    lower.includes("medical") ||
    lower.includes("hospital") ||
    lower.includes("doctor")
  ) {
    return "MEDICAL_RECORDS";
  }

  if (lower.includes("discharge")) {
    return "DISCHARGE_SUMMARY";
  }

  if (
    lower.includes("utility") ||
    lower.includes("electric") ||
    lower.includes("gas")
  ) {
    return "UTILITY_BILL";
  }

  if (
    lower.includes("mortgage") ||
    lower.includes("deed") ||
    lower.includes("property")
  ) {
    return "MORTGAGE_STATEMENT";
  }

  if (lower.includes("tax") || lower.includes("1040") || lower.includes("w2")) {
    return "TAX_RETURN";
  }

  if (
    lower.includes("school") ||
    lower.includes("transcript") ||
    lower.includes("report card")
  ) {
    return "SCHOOL_RECORDS";
  }

  if (
    lower.includes("employment") ||
    lower.includes("paystub") ||
    lower.includes("w-2")
  ) {
    return "EMPLOYMENT_RECORDS";
  }

  if (
    lower.includes("residence") ||
    lower.includes("address") ||
    lower.includes("proof")
  ) {
    return "PROOF_OF_RESIDENCE";
  }

  return undefined;
}

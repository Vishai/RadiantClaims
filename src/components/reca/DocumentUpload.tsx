"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProofOfPresenceDocumentType } from "@/lib/reca/types";

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileKey: string;
  documentType: ProofOfPresenceDocumentType;
  mimeType?: string;
  uploadedAt: Date;
  fileSize: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
  localFile?: File;
}

interface DocumentUploadProps {
  sessionId: string;
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  initialDocuments?: UploadedDocument[];
}

// Categorize document types for RECA requirements
const RESIDENTIAL_DOCUMENTS = [
  "TAX_RECORDS",
  "PROPERTY_RECORDS",
  "SCHOOL_ENROLLMENT",
  "UTILITY_BILLS",
  "MORTGAGE_STATEMENTS",
  "RENTAL_AGREEMENTS",
];

const SUPPLEMENTAL_DOCUMENTS = [
  "EMPLOYMENT_RECORDS",
  "CENSUS_RECORDS",
  "GOVERNMENT_CORRESPONDENCE",
  "GOVERNMENT_ID",
  "VOTING_RECORDS",
  "MILITARY_RECORDS",
];

const DOCUMENT_TYPE_OPTIONS = [
  {
    value: "TAX_RECORDS",
    label: "Tax Records (property tax rolls, returns)",
    category: "residential",
  },
  {
    value: "PROPERTY_RECORDS",
    label: "Property Records (deed, mortgage, lease)",
    category: "residential",
  },
  {
    value: "SCHOOL_ENROLLMENT",
    label: "School Enrollment Records",
    category: "residential",
  },
  {
    value: "UTILITY_BILLS",
    label: "Utility Bills (contemporaneous)",
    category: "residential",
  },
  {
    value: "MORTGAGE_STATEMENTS",
    label: "Mortgage Statements",
    category: "residential",
  },
  {
    value: "RENTAL_AGREEMENTS",
    label: "Rental/Lease Agreements",
    category: "residential",
  },
  {
    value: "EMPLOYMENT_RECORDS",
    label: "Employment Records (employer-issued)",
    category: "supplemental",
  },
  {
    value: "CENSUS_RECORDS",
    label: "Census Records",
    category: "supplemental",
  },
  {
    value: "GOVERNMENT_CORRESPONDENCE",
    label: "Government Correspondence",
    category: "supplemental",
  },
  {
    value: "GOVERNMENT_ID",
    label: "Government-Issued ID/Documents",
    category: "supplemental",
  },
  {
    value: "VOTING_RECORDS",
    label: "Voting Records",
    category: "supplemental",
  },
  {
    value: "MILITARY_RECORDS",
    label: "Military Records",
    category: "supplemental",
  },
  {
    value: "CHURCH_RECORDS",
    label: "Church/Religious Records",
    category: "additional",
  },
  {
    value: "BIRTH_MARRIAGE_RECORDS",
    label: "Birth/Marriage Records",
    category: "additional",
  },
  {
    value: "OTHER",
    label: "Other Contemporary Documents",
    category: "additional",
  },
];

export function DocumentUpload({
  sessionId,
  onDocumentsChange,
  initialDocuments = [],
}: DocumentUploadProps) {
  const [documents, setDocuments] =
    useState<UploadedDocument[]>(initialDocuments);
  const [selectedType, setSelectedType] = useState<
    ProofOfPresenceDocumentType | ""
  >("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onDocumentsChange(documents);
  }, [documents, onDocumentsChange]);

  const getErrorMessage = async (
    response: Response,
    fallbackMessage: string
  ): Promise<string> => {
    try {
      const payload = await response.json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        const details =
          typeof payload?.details === "string" && payload.details.trim()
            ? ` Details: ${payload.details}`
            : "";
        return `${payload.error}${details}`;
      }
    } catch {
      // Fall through to generic response status message.
    }
    return `${fallbackMessage} (HTTP ${response.status})`;
  };

  const uploadSingleFile = async (
    file: File,
    documentType: ProofOfPresenceDocumentType,
    existingDocId?: string
  ) => {
    const tempId = existingDocId || `temp-${Date.now()}-${Math.random()}`;
    const tempDoc: UploadedDocument = {
      id: tempId,
      fileName: file.name,
      fileKey: "",
      documentType,
      mimeType: file.type,
      uploadedAt: new Date(),
      fileSize: file.size,
      status: "uploading",
      localFile: file,
      errorMessage: undefined,
    };

    if (existingDocId) {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === existingDocId ? tempDoc : doc))
      );
    } else {
      setDocuments((prev) => [...prev, tempDoc]);
    }

    try {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!uploadResponse.ok) {
        const message = await getErrorMessage(
          uploadResponse,
          "Failed to get upload URL"
        );
        throw new Error(message);
      }

      const { putUrl, fileKey } = await uploadResponse.json();

      const uploadFileResponse = await fetch(putUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error(
          `Failed to upload file to storage (HTTP ${uploadFileResponse.status})`
        );
      }

      const saveFileResponse = await fetch(
        `/api/reca/workflow/${sessionId}/upload-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            documentType,
          }),
        }
      );

      if (!saveFileResponse.ok) {
        const message = await getErrorMessage(
          saveFileResponse,
          "Failed to save file record to database"
        );
        throw new Error(message);
      }

      const { id: dbId } = await saveFileResponse.json();

      const successDoc: UploadedDocument = {
        ...tempDoc,
        id: dbId,
        fileKey,
        status: "success",
        localFile: undefined,
      };

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === tempId ? successDoc : doc))
      );
    } catch (error) {
      console.error("Upload error:", error);

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId
            ? {
                ...doc,
                status: "error" as const,
                errorMessage:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : doc
        )
      );
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedType) {
      if (!selectedType) {
        alert("Please select a document type first");
      }
      return;
    }

    const filesArray = Array.from(files);

    // Validate file types (allow common document formats)
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const file of filesArray) {
      if (!validTypes.includes(file.type)) {
        alert(
          `File type not supported: ${file.name}. Please upload PDF, images, or Word documents.`
        );
        continue;
      }

      await uploadSingleFile(file, selectedType as ProofOfPresenceDocumentType);
    }
  };

  const retryDocument = async (docId: string) => {
    const doc = documents.find((item) => item.id === docId);
    if (!doc || doc.status !== "error") return;

    if (!doc.localFile) {
      setDocuments((prev) =>
        prev.map((item) =>
          item.id === docId
            ? {
                ...item,
                errorMessage:
                  "Automatic retry is unavailable for this file. Remove it and upload again.",
              }
            : item
        )
      );
      return;
    }

    await uploadSingleFile(doc.localFile, doc.documentType, docId);
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Track RECA requirements
  const hasResidentialDoc = documents.some(
    (doc) =>
      doc.status === "success" &&
      RESIDENTIAL_DOCUMENTS.includes(doc.documentType)
  );
  const hasSupplementalDoc = documents.some(
    (doc) =>
      doc.status === "success" &&
      SUPPLEMENTAL_DOCUMENTS.includes(doc.documentType)
  );
  const meetsRECARequirement = hasResidentialDoc && hasSupplementalDoc;
  const successfulDocuments = documents.filter(
    (doc) => doc.status === "success"
  );
  const successfulCount = successfulDocuments.length;
  const uploadingCount = documents.filter(
    (doc) => doc.status === "uploading"
  ).length;
  const failedCount = documents.filter((doc) => doc.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label
          htmlFor="documentType"
          className="text-base font-semibold text-sage-900"
        >
          Document Type
        </Label>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as ProofOfPresenceDocumentType)
          }
        >
          <SelectTrigger id="documentType" className="w-full">
            <SelectValue placeholder="Select the type of document you're uploading" />
          </SelectTrigger>
          <SelectContent>
            {/* Residential Documents Section */}
            <div className="pointer-events-none px-2 py-1.5 text-xs font-semibold text-sage-500">
              Residential Documents (Required: 1)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(
              (opt) => opt.category === "residential"
            ).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}

            {/* Official/Government Documents Section */}
            <div className="pointer-events-none mt-2 px-2 py-1.5 text-xs font-semibold text-sage-500">
              Official/Government Documents (Required: 1+)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(
              (opt) => opt.category === "supplemental"
            ).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}

            {/* Additional Supporting Documents Section */}
            <div className="pointer-events-none mt-2 px-2 py-1.5 text-xs font-semibold text-sage-500">
              Additional Supporting Documents (Optional)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(
              (opt) => opt.category === "additional"
            ).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-terracotta-500 bg-terracotta-50"
            : selectedType
              ? "border-sage-300 bg-white hover:border-sage-400 hover:bg-sage-50"
              : "cursor-not-allowed border-sage-200 bg-gray-50"
        } `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={!selectedType}
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-sage-400" />
        <label
          htmlFor="file-upload"
          className={`block ${selectedType ? "cursor-pointer" : "cursor-not-allowed"}`}
        >
          <p className="mb-2 font-medium text-sage-700">
            {isDragging
              ? "Drop files here"
              : "Drag and drop files here, or click to browse"}
          </p>
          <p className="mb-4 text-sm text-sage-600">
            Supported formats: PDF, JPG, PNG, TIFF, DOC, DOCX
          </p>
          {selectedType && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose Files
            </Button>
          )}
        </label>
        {!selectedType && (
          <p className="mt-2 text-sm text-amber-600">
            Please select a document type above before uploading
          </p>
        )}
      </div>

      {/* RECA Requirement Tracker */}
      {documents.length > 0 && (
        <div
          className={`rounded-lg border-2 p-4 ${
            meetsRECARequirement
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {meetsRECARequirement ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            )}
            <div className="flex-1">
              <p
                className={`mb-2 font-semibold ${
                  meetsRECARequirement ? "text-green-900" : "text-amber-900"
                }`}
              >
                {meetsRECARequirement
                  ? "✓ RECA Requirements Met"
                  : "RECA Requirements Progress"}
              </p>
              <ul className="ml-5 list-disc space-y-1 text-sm">
                <li
                  className={
                    hasResidentialDoc
                      ? "font-medium text-green-700"
                      : "text-amber-800"
                  }
                >
                  Residential Document:{" "}
                  {hasResidentialDoc ? "Added" : "Required"}
                </li>
                <li
                  className={
                    hasSupplementalDoc
                      ? "font-medium text-green-700"
                      : "text-amber-800"
                  }
                >
                  Official/Government Document:{" "}
                  {hasSupplementalDoc ? "Added" : "Required"}
                </li>
              </ul>
              {!meetsRECARequirement && (
                <p className="mt-2 text-xs text-amber-700">
                  Upload at least one document from each required category
                  above.
                </p>
              )}
              {meetsRECARequirement && (
                <p className="mt-2 text-xs text-green-700">
                  You've met the minimum requirements. Additional documents will
                  further strengthen your claim.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold text-sage-900">
            Uploaded Documents ({documents.length})
          </Label>
          <p className="text-xs text-sage-600">
            {successfulCount} saved to claim (pending verification)
            {uploadingCount > 0 ? ` • ${uploadingCount} uploading` : ""}
            {failedCount > 0 ? ` • ${failedCount} failed` : ""}
          </p>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-md border border-sage-200 bg-white p-3"
              >
                <FileText className="h-5 w-5 flex-shrink-0 text-sage-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sage-900">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-sage-600">
                    {
                      DOCUMENT_TYPE_OPTIONS.find(
                        (opt) => opt.value === doc.documentType
                      )?.label
                    }{" "}
                    • {formatFileSize(doc.fileSize)}
                  </p>
                  {doc.status === "error" && doc.errorMessage && (
                    <p className="mt-1 text-xs text-red-700">
                      {doc.errorMessage}
                    </p>
                  )}
                </div>
                {doc.status === "uploading" && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-xs text-blue-700">Uploading...</span>
                  </div>
                )}
                {doc.status === "success" && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-700">Saved</span>
                  </div>
                )}
                {doc.status === "error" && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-700">Failed</span>
                  </div>
                )}
                {doc.status === "error" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryDocument(doc.id)}
                    className="flex-shrink-0"
                  >
                    Retry
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Reminder */}
      {meetsRECARequirement && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-800">
              <p className="mb-1 font-semibold">Great Progress!</p>
              <p>
                You've met the minimum RECA requirements. Consider uploading
                additional documents from different categories to further
                strengthen your claim and speed up processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

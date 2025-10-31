"use client";

import React, { useState } from "react";
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

export type MedicalDocumentType =
  | "PATHOLOGY_REPORT"
  | "OPERATIVE_REPORT"
  | "DISCHARGE_SUMMARY"
  | "PHYSICIAN_SUMMARY"
  | "DEATH_CERTIFICATE"
  | "AUTOPSY_REPORT"
  | "BONE_MARROW_BIOPSY"
  | "LAB_REPORT"
  | "XRAY_REPORT"
  | "OTHER_MEDICAL";

export interface UploadedMedicalDocument {
  id: string;
  fileName: string;
  fileKey: string;
  documentType: MedicalDocumentType;
  uploadedAt: Date;
  fileSize: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

interface MedicalDocumentUploadProps {
  sessionId: string;
  onDocumentsChange: (documents: UploadedMedicalDocument[]) => void;
  initialDocuments?: UploadedMedicalDocument[];
}

const DOCUMENT_TYPE_OPTIONS = [
  {
    value: "PATHOLOGY_REPORT",
    label: "Pathology Report (Tissue Biopsy/Surgical Resection)",
  },
  { value: "OPERATIVE_REPORT", label: "Operative Report" },
  { value: "DISCHARGE_SUMMARY", label: "Hospital Discharge Summary Report" },
  { value: "PHYSICIAN_SUMMARY", label: "Physician Summary Report" },
  {
    value: "DEATH_CERTIFICATE",
    label: "Death Certificate (with physician signature)",
  },
  { value: "AUTOPSY_REPORT", label: "Autopsy Report" },
  { value: "BONE_MARROW_BIOPSY", label: "Bone Marrow Biopsy/Aspirate Report" },
  { value: "LAB_REPORT", label: "Laboratory Report (Blood Tests, etc.)" },
  { value: "XRAY_REPORT", label: "X-Ray/Imaging Report" },
  { value: "OTHER_MEDICAL", label: "Other Medical Documentation" },
];

export function MedicalDocumentUpload({
  sessionId,
  onDocumentsChange,
  initialDocuments = [],
}: MedicalDocumentUploadProps) {
  const [documents, setDocuments] =
    useState<UploadedMedicalDocument[]>(initialDocuments);
  const [selectedType, setSelectedType] = useState<MedicalDocumentType | "">(
    ""
  );
  const [isDragging, setIsDragging] = useState(false);

  const updateDocuments = (newDocs: UploadedMedicalDocument[]) => {
    setDocuments(newDocs);
    onDocumentsChange(newDocs);
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

      // Create temporary document entry
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempDoc: UploadedMedicalDocument = {
        id: tempId,
        fileName: file.name,
        fileKey: "",
        documentType: selectedType as MedicalDocumentType,
        uploadedAt: new Date(),
        fileSize: file.size,
        status: "uploading",
      };

      updateDocuments([...documents, tempDoc]);

      try {
        // Step 1: Get presigned URL
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { putUrl, fileKey } = await uploadResponse.json();

        // Step 2: Upload file to R2/S3
        const uploadFileResponse = await fetch(putUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadFileResponse.ok) {
          throw new Error("Failed to upload file");
        }

        // Step 3: Save file record to database
        const saveFileResponse = await fetch(
          `/api/reca/workflow/${sessionId}/upload-file`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileKey: fileKey,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              documentType: selectedType,
              category: "Medical", // Medical documents
            }),
          }
        );

        if (!saveFileResponse.ok) {
          throw new Error("Failed to save file record to database");
        }

        const { id: dbId } = await saveFileResponse.json();

        // Step 4: Update document with success status
        const successDoc: UploadedMedicalDocument = {
          ...tempDoc,
          id: dbId, // Use database ID
          fileKey: fileKey,
          status: "success",
        };

        setDocuments((prev) => {
          const updated = prev.map((doc) =>
            doc.id === tempId ? successDoc : doc
          );
          onDocumentsChange(updated);
          return updated;
        });
      } catch (error) {
        console.error("Upload error:", error);

        // Update with error status
        setDocuments((prev) => {
          const updated = prev.map((doc) =>
            doc.id === tempId
              ? {
                  ...doc,
                  status: "error" as const,
                  errorMessage:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : doc
          );
          onDocumentsChange(updated);
          return updated;
        });
      }
    }
  };

  const removeDocument = (docId: string) => {
    const newDocs = documents.filter((doc) => doc.id !== docId);
    updateDocuments(newDocs);
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

  const successfulUploads = documents.filter(
    (doc) => doc.status === "success"
  ).length;

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label
          htmlFor="medicalDocumentType"
          className="text-base font-semibold text-sage-900"
        >
          Document Type <span className="text-red-600">*</span>
        </Label>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as MedicalDocumentType)
          }
        >
          <SelectTrigger id="medicalDocumentType" className="w-full">
            <SelectValue placeholder="Select the type of medical document you're uploading" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
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
          id="medical-file-upload"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={!selectedType}
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-sage-400" />
        <label
          htmlFor="medical-file-upload"
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
              onClick={() =>
                document.getElementById("medical-file-upload")?.click()
              }
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

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold text-sage-900">
            Uploaded Documents ({documents.length})
          </Label>
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
                </div>
                {doc.status === "uploading" && (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-600" />
                )}
                {doc.status === "success" && (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                )}
                {doc.status === "error" && (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
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

      {/* Success Message */}
      {successfulUploads > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-800">
              <p className="mb-1 font-semibold">✓ Medical Records Saved!</p>
              <p>
                You've successfully uploaded and saved {successfulUploads}{" "}
                medical document{successfulUploads !== 1 ? "s" : ""} to your
                claim. These are securely stored and will be reviewed by our
                team.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
  uploadedAt: Date;
  fileSize: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
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
  { value: "TAX_RECORDS", label: "Tax Records (property tax rolls, returns)", category: "residential" },
  { value: "PROPERTY_RECORDS", label: "Property Records (deed, mortgage, lease)", category: "residential" },
  { value: "SCHOOL_ENROLLMENT", label: "School Enrollment Records", category: "residential" },
  { value: "UTILITY_BILLS", label: "Utility Bills (contemporaneous)", category: "residential" },
  { value: "MORTGAGE_STATEMENTS", label: "Mortgage Statements", category: "residential" },
  { value: "RENTAL_AGREEMENTS", label: "Rental/Lease Agreements", category: "residential" },
  { value: "EMPLOYMENT_RECORDS", label: "Employment Records (employer-issued)", category: "supplemental" },
  { value: "CENSUS_RECORDS", label: "Census Records", category: "supplemental" },
  { value: "GOVERNMENT_CORRESPONDENCE", label: "Government Correspondence", category: "supplemental" },
  { value: "GOVERNMENT_ID", label: "Government-Issued ID/Documents", category: "supplemental" },
  { value: "VOTING_RECORDS", label: "Voting Records", category: "supplemental" },
  { value: "MILITARY_RECORDS", label: "Military Records", category: "supplemental" },
  { value: "CHURCH_RECORDS", label: "Church/Religious Records", category: "additional" },
  { value: "BIRTH_MARRIAGE_RECORDS", label: "Birth/Marriage Records", category: "additional" },
  { value: "OTHER", label: "Other Contemporary Documents", category: "additional" },
];

export function DocumentUpload({
  sessionId,
  onDocumentsChange,
  initialDocuments = [],
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [selectedType, setSelectedType] = useState<ProofOfPresenceDocumentType | "">("");
  const [isDragging, setIsDragging] = useState(false);

  const updateDocuments = (newDocs: UploadedDocument[]) => {
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
        alert(`File type not supported: ${file.name}. Please upload PDF, images, or Word documents.`);
        continue;
      }

      // Create temporary document entry
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempDoc: UploadedDocument = {
        id: tempId,
        fileName: file.name,
        fileKey: "",
        documentType: selectedType as ProofOfPresenceDocumentType,
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

        // Step 3: Update document with success status
        const successDoc: UploadedDocument = {
          ...tempDoc,
          id: fileKey,
          fileKey: fileKey,
          status: "success",
        };

        setDocuments((prev) => {
          const updated = prev.map((doc) => (doc.id === tempId ? successDoc : doc));
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
                  errorMessage: error instanceof Error ? error.message : "Upload failed",
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

  const successfulUploads = documents.filter((doc) => doc.status === "success").length;

  // Track RECA requirements
  const hasResidentialDoc = documents.some(
    (doc) => doc.status === "success" && RESIDENTIAL_DOCUMENTS.includes(doc.documentType)
  );
  const hasSupplementalDoc = documents.some(
    (doc) => doc.status === "success" && SUPPLEMENTAL_DOCUMENTS.includes(doc.documentType)
  );
  const meetsRECARequirement = hasResidentialDoc && hasSupplementalDoc;

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="documentType" className="text-base font-semibold text-sage-900">
          Document Type
        </Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as ProofOfPresenceDocumentType)}
        >
          <SelectTrigger id="documentType" className="w-full">
            <SelectValue placeholder="Select the type of document you're uploading" />
          </SelectTrigger>
          <SelectContent>
            {/* Residential Documents Section */}
            <div className="px-2 py-1.5 text-xs font-semibold text-sage-500 pointer-events-none">
              Residential Documents (Required: 1)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(opt => opt.category === 'residential').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}

            {/* Official/Government Documents Section */}
            <div className="px-2 py-1.5 text-xs font-semibold text-sage-500 pointer-events-none mt-2">
              Official/Government Documents (Required: 1+)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(opt => opt.category === 'supplemental').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}

            {/* Additional Supporting Documents Section */}
            <div className="px-2 py-1.5 text-xs font-semibold text-sage-500 pointer-events-none mt-2">
              Additional Supporting Documents (Optional)
            </div>
            {DOCUMENT_TYPE_OPTIONS.filter(opt => opt.category === 'additional').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${
            isDragging
              ? "border-terracotta-500 bg-terracotta-50"
              : selectedType
              ? "border-sage-300 bg-white hover:border-sage-400 hover:bg-sage-50"
              : "border-sage-200 bg-gray-50 cursor-not-allowed"
          }
        `}
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
        <Upload className="h-12 w-12 text-sage-400 mx-auto mb-4" />
        <label
          htmlFor="file-upload"
          className={`block ${selectedType ? "cursor-pointer" : "cursor-not-allowed"}`}
        >
          <p className="text-sage-700 font-medium mb-2">
            {isDragging ? "Drop files here" : "Drag and drop files here, or click to browse"}
          </p>
          <p className="text-sm text-sage-600 mb-4">
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
          <p className="text-sm text-amber-600 mt-2">
            Please select a document type above before uploading
          </p>
        )}
      </div>

      {/* RECA Requirement Tracker */}
      {documents.length > 0 && (
        <div className={`rounded-lg border-2 p-4 ${
          meetsRECARequirement
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-start gap-3">
            {meetsRECARequirement ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-semibold mb-2 ${
                meetsRECARequirement ? "text-green-900" : "text-amber-900"
              }`}>
                {meetsRECARequirement
                  ? "✓ RECA Requirements Met"
                  : "RECA Requirements Progress"}
              </p>
              <div className="text-sm space-y-1">
                <p className={hasResidentialDoc ? "text-green-700 font-medium" : "text-amber-800"}>
                  {hasResidentialDoc ? "✓" : "○"} Residential Document: {hasResidentialDoc ? "Provided" : "Required"}
                </p>
                <p className={hasSupplementalDoc ? "text-green-700 font-medium" : "text-amber-800"}>
                  {hasSupplementalDoc ? "✓" : "○"} Official/Government Document: {hasSupplementalDoc ? "Provided" : "Required"}
                </p>
              </div>
              {!meetsRECARequirement && (
                <p className="text-xs text-amber-700 mt-2">
                  Upload at least one document from each required category above.
                </p>
              )}
              {meetsRECARequirement && (
                <p className="text-xs text-green-700 mt-2">
                  You've met the minimum requirements. Additional documents will further strengthen your claim.
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
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-md border border-sage-200 p-3 bg-white"
              >
                <FileText className="h-5 w-5 text-sage-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sage-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-sage-600">
                    {DOCUMENT_TYPE_OPTIONS.find((opt) => opt.value === doc.documentType)?.label} •{" "}
                    {formatFileSize(doc.fileSize)}
                  </p>
                </div>
                {doc.status === "uploading" && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {doc.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                {doc.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
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
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">Great Progress!</p>
              <p>
                You've met the minimum RECA requirements. Consider uploading additional documents from different categories to further strengthen your claim and speed up processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";

interface DocumentViewerProps {
  fileId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FileData {
  id: string;
  originalFilename: string;
  category: string | null;
  mimeType: string;
  sizeBytes: number;
  status: string;
  customerStatus: string;
  uploadedAt: string;
  signedUrl: string;
  claimant: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  user: {
    email: string;
    name: string | null;
  } | null;
  validation: {
    status: string;
    overallConfidence: number | null;
  } | null;
}

export function DocumentViewer({
  fileId,
  isOpen,
  onClose,
}: DocumentViewerProps) {
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileId) {
      fetchFile();
    }
  }, [isOpen, fileId]);

  const fetchFile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/documents/${fileId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const data = await response.json();
      setFile(data.file);
    } catch (error) {
      console.error("Error fetching file:", error);
      setError("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (file?.signedUrl) {
      window.open(file.signedUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPDF = file?.mimeType === "application/pdf";
  const isImage = file?.mimeType.startsWith("image/");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : file ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {file.originalFilename}
              </DialogTitle>
              <DialogDescription>
                {file.claimant
                  ? `${file.claimant.firstName} ${file.claimant.lastName}`
                  : file.user?.name || "Unknown"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* File Metadata */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-base">
                    {file.category?.replace(/_/g, " ") || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">File Size</p>
                  <p className="text-base">{formatFileSize(file.sizeBytes)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge>{file.status.replace(/_/g, " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Status
                  </p>
                  <Badge
                    className={
                      file.customerStatus === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : file.customerStatus === "NEEDS_REVIEW"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                    }
                  >
                    {file.customerStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                {file.validation && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        AI Validation
                      </p>
                      <Badge>{file.validation.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Confidence
                      </p>
                      <p className="text-base">
                        {file.validation.overallConfidence !== null
                          ? `${(file.validation.overallConfidence * 100).toFixed(0)}%`
                          : "—"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Uploaded</p>
                  <p className="text-base">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Document Preview */}
              <div className="rounded-lg border border-gray-200">
                {isPDF ? (
                  <div className="h-[600px]">
                    <iframe
                      src={file.signedUrl}
                      className="h-full w-full rounded-lg"
                      title={file.originalFilename}
                    />
                  </div>
                ) : isImage ? (
                  <div className="flex items-center justify-center bg-gray-50 p-4">
                    <img
                      src={file.signedUrl}
                      alt={file.originalFilename}
                      className="max-h-[600px] rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <FileText className="h-16 w-16 text-gray-400" />
                    <p className="text-gray-600">
                      Preview not available for this file type
                    </p>
                    <Button onClick={downloadFile}>
                      <Download className="mr-2 h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={downloadFile}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

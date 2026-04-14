"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Zap } from "lucide-react";

interface ProvenanceTabProps {
  data: IntelligenceResponse;
  documentData?: {
    id: string;
    originalFilename: string;
    fileSize: number;
    uploadedAt: string;
    status: string;
  };
}

export function ProvenanceTab({ data, documentData }: ProvenanceTabProps) {
  const { metadata, textLength } = data;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 py-4">
      {/* Processing Timeline */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          Processing Timeline
        </h3>
        <div className="space-y-3">
          {documentData?.uploadedAt && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">Document Uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(documentData.uploadedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">Start</Badge>
            </div>
          )}
          {metadata.entitiesExtractedAt && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Entity Extraction</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(metadata.entitiesExtractedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Step 1</Badge>
            </div>
          )}
          {metadata.complianceCheckedAt && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Compliance Check</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(metadata.complianceCheckedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Step 2</Badge>
            </div>
          )}
          {metadata.risksAnalyzedAt && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div>
                  <p className="text-sm font-medium">Risk Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(metadata.risksAnalyzedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Step 3</Badge>
            </div>
          )}
        </div>
      </div>

      {/* File Metadata */}
      {documentData && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            File Metadata
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Document ID</span>
              <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                {documentData.id}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Original Filename
              </span>
              <span className="text-sm font-medium">
                {documentData.originalFilename}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">File Size</span>
              <span className="text-sm font-medium">
                {formatBytes(documentData.fileSize)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge>{documentData.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Extracted Text Length
              </span>
              <span className="text-sm font-medium">
                {textLength.toLocaleString()} characters
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Model Versions */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5" />
          AI Models Used
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">OCR Engine</p>
              <p className="text-xs text-muted-foreground">
                Document text extraction
              </p>
            </div>
            <Badge variant="outline">Azure Document Intelligence</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Entity Extraction</p>
              <p className="text-xs text-muted-foreground">
                Structured data extraction
              </p>
            </div>
            <Badge variant="outline">GPT-4o (Structured Output)</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Compliance & Risk Analysis</p>
              <p className="text-xs text-muted-foreground">RECA validation</p>
            </div>
            <Badge variant="outline">GPT-4o (Structured Output)</Badge>
          </div>
        </div>
      </div>

      {/* Processing Time */}
      {metadata.processingTimeMs && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Processing Performance</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Processing Time
            </span>
            <span className="text-2xl font-bold">
              {(metadata.processingTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      )}

      {/* API cost estimates hidden from customer view — available in admin dashboard */}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KnowledgeUploadProps {
  claimantId?: string; // If provided, uploads as private doc for this claimant
  isPublic?: boolean; // Defaults to true if no claimantId, false if claimantId provided
  onSuccess?: () => void;
}

export function KnowledgeUpload({
  claimantId,
  isPublic,
  onSuccess,
}: KnowledgeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Determine effective visibility
  const effectiveIsPublic = isPublic !== undefined ? isPublic : !claimantId;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPublic", String(effectiveIsPublic));
    if (claimantId) {
      formData.append("claimantId", claimantId);
    }

    try {
      const response = await fetch("/api/admin/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setFile(null);
      // Reset file input manually if needed, or just rely on React state
      const fileInput = document.getElementById(
        "knowledge-file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {effectiveIsPublic
            ? "Upload Global Knowledge"
            : "Upload Private Context"}
        </CardTitle>
        <CardDescription>
          {effectiveIsPublic
            ? "Upload laws, amendments, or guidelines accessible to ALL chatbots."
            : "Upload documents (medical history, employment records) accessible ONLY when discussing this claimant."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="knowledge-file-input">PDF Document</Label>
          <Input
            id="knowledge-file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Document successfully ingested into knowledge base!</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Ingest
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

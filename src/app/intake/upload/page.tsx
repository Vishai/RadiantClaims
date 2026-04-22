"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle } from "lucide-react";

interface UploadedDocument {
  id?: string;
  type: string;
  originalName: string;
  fileKey: string;
  size: number;
  mimeType: string;
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimantId = searchParams.get("claimantId");

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("ID");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimantId) {
      router.push("/intake");
    }
  }, [claimantId, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !claimantId) return;

    setUploading(true);
    setError(null);

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

      const { fileKey } = await uploadResponse.json();

      // Step 2: Upload file to presigned URL (mock for now)
      // TODO: When R2 is configured, uncomment this to do real upload
      // await fetch(putUrl, {
      //   method: 'PUT',
      //   body: file,
      //   headers: { 'Content-Type': file.type },
      // });

      // Step 3: Save document metadata
      const documentResponse = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantId,
          type: selectedType,
          fileKey,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!documentResponse.ok) {
        throw new Error("Failed to save document");
      }

      const document = await documentResponse.json();
      setDocuments((prev) => [...prev, document]);

      // Reset file input
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = () => {
    router.push(`/?submitted=true`);
  };

  if (!claimantId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-3xl px-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload required documents for your claim. You can upload multiple
              files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="document-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ID">ID</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="ProofOfResidency">
                      Proof of Residency
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {uploading && (
                    <Upload className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            {documents.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold">Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className="flex items-center justify-between rounded-lg border bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{doc.originalName}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type} • {(doc.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => router.push("/intake")}>
                Back
              </Button>
              <Button onClick={handleFinish}>
                {documents.length > 0 ? "Finish Submission" : "Skip for Now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {documents.length === 0 && (
          <div className="mt-6 rounded-lg bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">
              Recommended Documents
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
              <li>Government-issued photo ID</li>
              <li>Medical records or documentation</li>
              <li>Proof of residency (utility bill, lease, etc.)</li>
              <li>Any other supporting documents</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { DocumentListItem } from "./DocumentListItem";
import type { FileCategory } from "./DocumentCategorySelector";
import { Loader2, FileX, Search, Grid, List, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ValidationProgress } from "@/components/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DocumentQualificationSummary,
  SupportingDocumentInsight,
} from "./types";
import { RecategorizeModal } from "./RecategorizeModal";

interface AIIntelligence {
  ocrConfidence?: number;
  textLength?: number;
  aiCategory?: string;
  aiCategoryConfidence?: number;
  aiReasoning?: string;
  tags?: Array<{ tag: string; confidence: number }>;
  qualityScore?: number;
  recommendations?: string[];
  pageCount?: number;
}

interface UploadedFile {
  id: string;
  originalFilename: string;
  category?: FileCategory;
  categoryLocked?: boolean;
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  thumbnailKey?: string | null;
  isRequired?: boolean;
  requiresOriginal?: boolean;
  rejectionReason?: string | null;
  aiIntelligence?: AIIntelligence | null;
  validation?: {
    status:
      | "PENDING"
      | "PROCESSING"
      | "VERIFIED"
      | "NEEDS_REVIEW"
      | "STAFF_APPROVED"
      | "REJECTED"
      | "ERROR";
    category?: string;
    confidence?: number;
  } | null;
  qualification?: DocumentQualificationSummary | null;
  otherDocumentAnalysis?: SupportingDocumentInsight | null;
}

interface DocumentDashboardProps {
  sessionId: string;
  onRefresh?: () => void;
}

export function DocumentDashboard({
  sessionId,
  onRefresh,
}: DocumentDashboardProps) {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categorizingDoc, setCategorizingDoc] = useState<UploadedFile | null>(
    null
  );
  const [recategorizing, setRecategorizing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showValidationProgress, setShowValidationProgress] = useState(false);

  const loadDocuments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await fetch(`/api/documents?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.files || []);
        }
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Auto-refresh while any documents are still processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === "UPLOADING" || d.status === "PROCESSING"
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      void loadDocuments(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  const handleView = async (fileId: string) => {
    // Open document in new tab
    window.open(`/api/documents/${fileId}/view`, "_blank");
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${fileId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download document:", error);
    }
  };

  const handleDelete = async (fileId: string): Promise<boolean> => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return false;
    }

    try {
      const response = await fetch(`/api/documents/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== fileId));
        onRefresh?.();
        return true;
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }

    return false;
  };

  const handleRecategorize = (file: UploadedFile) => {
    setCategorizingDoc(file);
  };

  const handleValidateAll = async () => {
    setValidating(true);
    setShowValidationProgress(true);

    try {
      const response = await fetch("/api/validation/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeSessionId: sessionId,
          runFullPipeline: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start validation");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh documents to show updated validation status
        await loadDocuments();
      }
    } catch (error) {
      console.error("Failed to validate documents:", error);
      alert("Failed to start validation. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleValidationComplete = () => {
    setShowValidationProgress(false);
    loadDocuments();
  };

  const handleCategoryConfirm = async ({
    category,
    lockCategory,
  }: {
    category: FileCategory;
    lockCategory: boolean;
  }) => {
    if (!categorizingDoc) return;

    setRecategorizing(true);
    try {
      const response = await fetch(
        `/api/documents/${categorizingDoc.id}/categorize`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category, lockCategory }),
        }
      );

      if (response.ok) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === categorizingDoc.id
              ? {
                  ...doc,
                  category,
                  categoryLocked: lockCategory,
                  qualification: doc.qualification
                    ? {
                        ...doc.qualification,
                        status: "UNKNOWN",
                        issues: [],
                        suggestion:
                          "Qualification will refresh after the next analysis run.",
                      }
                    : null,
                }
              : doc
          )
        );
        onRefresh?.();
        setCategorizingDoc(null);
      } else {
        let message = "Failed to update category";
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch (error) {
          console.error("Failed to parse categorize response:", error);
        }
        throw new Error(message);
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    } finally {
      setRecategorizing(false);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.originalFilename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validate All Button & Progress */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handleValidateAll}
            disabled={validating}
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {validating ? "Validating..." : "Validate All Documents"}
          </Button>
        </div>
      )}

      {/* Validation Progress */}
      {showValidationProgress && (
        <ValidationProgress
          sessionId={sessionId}
          autoRefresh={true}
          refreshInterval={2000}
          onComplete={handleValidationComplete}
          showDetails={true}
        />
      )}

      {/* Filters & View Toggle */}
      {documents.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-500" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="IDENTITY">Identity</SelectItem>
              <SelectItem value="BIRTH_CERTIFICATE">
                Birth Certificate
              </SelectItem>
              <SelectItem value="DEATH_CERTIFICATE">
                Death Certificate
              </SelectItem>
              <SelectItem value="MARRIAGE_CERTIFICATE">
                Marriage Certificate
              </SelectItem>
              <SelectItem value="MEDICAL_RECORDS">Medical Records</SelectItem>
              <SelectItem value="PATHOLOGY_REPORT">Pathology Report</SelectItem>
              <SelectItem value="DISCHARGE_SUMMARY">
                Discharge Summary
              </SelectItem>
              <SelectItem value="TUMOR_REGISTRY">Tumor Registry</SelectItem>
              <SelectItem value="TREATMENT_RECORDS">
                Treatment Records
              </SelectItem>
              <SelectItem value="PROOF_OF_RESIDENCE">
                Proof of Residence
              </SelectItem>
              <SelectItem value="UTILITY_BILL">Utility Bill</SelectItem>
              <SelectItem value="MORTGAGE_STATEMENT">
                Mortgage Statement
              </SelectItem>
              <SelectItem value="TAX_RETURN">Tax Return</SelectItem>
              <SelectItem value="SCHOOL_RECORDS">School Records</SelectItem>
              <SelectItem value="EMPLOYMENT_RECORDS">
                Employment Records
              </SelectItem>
              <SelectItem value="LDS_CHURCH_RECORDS">
                LDS Church Records
              </SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="UPLOADING">Uploading</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VALIDATED">Validated</SelectItem>
              <SelectItem value="AWAITING_REVIEW">Awaiting Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-sage-300 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${viewMode === "grid" ? "bg-sage-100" : ""}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none ${viewMode === "list" ? "bg-sage-100" : ""}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Documents Grid or List */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-300 bg-cream-50 py-16">
          <FileX className="mb-4 h-16 w-16 text-sage-300" />
          <h3 className="mb-2 text-lg font-semibold text-sage-900">
            {documents.length === 0
              ? "No documents uploaded yet"
              : "No documents match your filters"}
          </h3>
          <p className="text-sm text-sage-600">
            {documents.length === 0
              ? "Upload documents above to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              originalFilename={doc.originalFilename}
              category={doc.category}
              categoryLocked={doc.categoryLocked}
              status={doc.status}
              sizeBytes={doc.sizeBytes}
              uploadedAt={doc.uploadedAt}
              mimeType={doc.mimeType}
              thumbnailKey={doc.thumbnailKey}
              isRequired={doc.isRequired}
              requiresOriginal={doc.requiresOriginal}
              rejectionReason={doc.rejectionReason}
              aiIntelligence={doc.aiIntelligence || undefined}
              validation={doc.validation || undefined}
              qualification={doc.qualification || undefined}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id, doc.originalFilename)}
              onDelete={() => handleDelete(doc.id)}
              onRecategorize={() => handleRecategorize(doc)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentListItem
              key={doc.id}
              id={doc.id}
              originalFilename={doc.originalFilename}
              category={doc.category}
              categoryLocked={doc.categoryLocked}
              status={doc.status}
              sizeBytes={doc.sizeBytes}
              uploadedAt={doc.uploadedAt}
              mimeType={doc.mimeType}
              aiIntelligence={doc.aiIntelligence || undefined}
              validation={doc.validation || undefined}
              qualification={doc.qualification || undefined}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id, doc.originalFilename)}
              onDelete={() => handleDelete(doc.id)}
              onRecategorize={() => handleRecategorize(doc)}
            />
          ))}
        </div>
      )}

      {/* Document Count */}
      {filteredDocuments.length > 0 && (
        <p className="text-center text-sm text-sage-600">
          Showing {filteredDocuments.length} of {documents.length} document
          {documents.length !== 1 ? "s" : ""}
        </p>
      )}

      <RecategorizeModal
        open={!!categorizingDoc}
        onClose={() => {
          if (recategorizing) return;
          setCategorizingDoc(null);
        }}
        fileName={categorizingDoc?.originalFilename ?? ""}
        currentCategory={categorizingDoc?.category}
        qualification={categorizingDoc?.qualification ?? null}
        otherAnalysis={categorizingDoc?.otherDocumentAnalysis ?? null}
        aiIntelligence={categorizingDoc?.aiIntelligence ?? null}
        isCategoryLocked={categorizingDoc?.categoryLocked ?? false}
        onConfirm={handleCategoryConfirm}
        onKeepSupporting={
          categorizingDoc?.qualification?.status === "SUPPORTING"
            ? () => setCategorizingDoc(null)
            : undefined
        }
        onDelete={
          categorizingDoc
            ? async () => {
                const deleted = await handleDelete(categorizingDoc.id);
                if (deleted) {
                  setCategorizingDoc(null);
                }
              }
            : undefined
        }
        isSubmitting={recategorizing}
      />
    </div>
  );
}

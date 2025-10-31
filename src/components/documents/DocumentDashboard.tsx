"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { DocumentListItem } from "./DocumentListItem";
import {
  DocumentCategorySelector,
  type FileCategory,
} from "./DocumentCategorySelector";
import { Loader2, FileX, Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  thumbnailKey?: string | null;
  isRequired?: boolean;
  requiresOriginal?: boolean;
  rejectionReason?: string | null;
  aiIntelligence?: AIIntelligence | null;
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
  const [categorizingDoc, setCategorizingDoc] = useState<{
    id: string;
    filename: string;
    currentCategory?: FileCategory;
  } | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.files || []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

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

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== fileId));
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleRecategorize = (
    fileId: string,
    filename: string,
    currentCategory?: FileCategory
  ) => {
    setCategorizingDoc({ id: fileId, filename, currentCategory });
  };

  const handleCategoryConfirm = async (category: FileCategory) => {
    if (!categorizingDoc) return;

    try {
      const response = await fetch(
        `/api/documents/${categorizingDoc.id}/categorize`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category }),
        }
      );

      if (response.ok) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === categorizingDoc.id ? { ...doc, category } : doc
          )
        );
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }

    setCategorizingDoc(null);
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
              <SelectItem value="MEDICAL_RECORDS">Medical Records</SelectItem>
              <SelectItem value="PATHOLOGY_REPORT">Pathology Report</SelectItem>
              <SelectItem value="PROOF_OF_RESIDENCE">
                Proof of Residence
              </SelectItem>
              <SelectItem value="UTILITY_BILL">Utility Bill</SelectItem>
              <SelectItem value="TAX_RETURN">Tax Return</SelectItem>
              <SelectItem value="SCHOOL_RECORDS">School Records</SelectItem>
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="NEEDS_ATTENTION">Needs Attention</SelectItem>
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
              status={doc.status}
              sizeBytes={doc.sizeBytes}
              uploadedAt={doc.uploadedAt}
              mimeType={doc.mimeType}
              thumbnailKey={doc.thumbnailKey}
              isRequired={doc.isRequired}
              requiresOriginal={doc.requiresOriginal}
              rejectionReason={doc.rejectionReason}
              aiIntelligence={doc.aiIntelligence || undefined}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id, doc.originalFilename)}
              onDelete={() => handleDelete(doc.id)}
              onRecategorize={() =>
                handleRecategorize(doc.id, doc.originalFilename, doc.category)
              }
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
              status={doc.status}
              sizeBytes={doc.sizeBytes}
              uploadedAt={doc.uploadedAt}
              mimeType={doc.mimeType}
              aiIntelligence={doc.aiIntelligence || undefined}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id, doc.originalFilename)}
              onDelete={() => handleDelete(doc.id)}
              onRecategorize={() =>
                handleRecategorize(doc.id, doc.originalFilename, doc.category)
              }
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

      {/* Category Selector Dialog */}
      {categorizingDoc && (
        <DocumentCategorySelector
          open={!!categorizingDoc}
          onOpenChange={(open) => !open && setCategorizingDoc(null)}
          currentCategory={categorizingDoc.currentCategory}
          onConfirm={handleCategoryConfirm}
          fileName={categorizingDoc.filename}
        />
      )}
    </div>
  );
}

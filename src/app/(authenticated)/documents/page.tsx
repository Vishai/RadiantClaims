"use client";

import { useState, useEffect } from "react";
import {
  DocumentTrackingCard,
  DocumentTrackingData,
} from "@/components/documents/DocumentTrackingCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FileText, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/documents/tracking");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    documentType: string,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await fetch("/api/documents/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          status,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh documents
      await fetchDocuments();
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    }
  };

  const handleUploadClick = (documentType: string) => {
    // Navigate to upload page or open upload modal
    router.push(`/documents/upload?type=${encodeURIComponent(documentType)}`);
  };

  const filteredDocuments =
    filterStatus === "all"
      ? documents
      : documents.filter((doc) => doc.status === filterStatus);

  // Group documents by status for summary
  const statusCounts = documents.reduce(
    (acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="p-6 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={fetchDocuments}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Tracking</h1>
          <p className="mt-1 text-muted-foreground">
            Track the status of documents needed for your RECA claim
          </p>
        </div>
        <Button
          onClick={() => router.push("/chat")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Find New Document
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-sm text-muted-foreground">Total Documents</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {statusCounts.AWAITING || 0}
          </div>
          <div className="text-sm text-muted-foreground">Awaiting</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {statusCounts.RECEIVED || 0}
          </div>
          <div className="text-sm text-muted-foreground">Received</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {statusCounts.UPLOADED || 0 + statusCounts.VERIFIED || 0}
          </div>
          <div className="text-sm text-muted-foreground">Complete</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="REQUESTED">Requested</SelectItem>
            <SelectItem value="AWAITING">Awaiting</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="UPLOADED">Uploaded</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Showing {filteredDocuments.length} of {documents.length} documents
        </span>
      </div>

      {/* Document Cards */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Documents Found</h3>
          <p className="mb-4 text-muted-foreground">
            {filterStatus === "all"
              ? "Start tracking documents by using our contact finder to locate the resources you need."
              : `No documents with status "${filterStatus.replace(/_/g, " ").toLowerCase()}"`}
          </p>
          {filterStatus === "all" && (
            <Button onClick={() => router.push("/chat")}>Find Documents</Button>
          )}
          {filterStatus !== "all" && (
            <Button variant="outline" onClick={() => setFilterStatus("all")}>
              Clear Filter
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDocuments.map((document, index) => (
            <DocumentTrackingCard
              key={document.id || `doc-${index}`}
              document={document}
              onStatusUpdate={handleStatusUpdate}
              onUploadClick={handleUploadClick}
            />
          ))}
        </div>
      )}

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-semibold">
          How Document Tracking Works
        </h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            • Use the Contact Finder to locate offices where you can get
            documents
          </li>
          <li>
            • Update the status as you request, receive, and upload documents
          </li>
          <li>• We'll remind you about documents you're waiting on</li>
          <li>• Track multiple resources for the same document if needed</li>
        </ul>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ClaimantWorkflowStatus,
  ClaimType,
  FileCategory,
  FileStatus,
} from "@prisma/client";
import { WorkflowStatusBadge } from "@/components/attorney/workflow-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Document {
  id: string;
  originalFilename: string;
  fileKey: string;
  category: FileCategory;
  status: FileStatus;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: Date;
  isRequired: boolean;
  requiresOriginal: boolean;
  validatedAt?: Date | null;
  validatedBy?: string | null;
}

interface Claimant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  workflowStatus: ClaimantWorkflowStatus;
  claimType?: ClaimType | null;
  isPremiumService: boolean;
}

interface ApiResponse {
  claimant: Claimant;
  documents: Document[];
}

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  PANCREATIC_CANCER: "Pancreatic Cancer",
  THYROID_CANCER: "Thyroid Cancer",
  KIDNEY_CANCER: "Kidney Cancer",
  LUNG_CANCER: "Lung Cancer",
  BRAIN_CANCER: "Brain Cancer",
  OTHER_CANCER: "Other Cancer",
  NON_CANCER: "Non-Cancer",
  DOWNWINDER: "Downwinder",
  URANIUM_WORKER: "Uranium Worker",
  MANHATTAN_PROJECT_WASTE: "Manhattan Project Waste",
  ONSITE_PARTICIPANT: "Onsite Participant",
};

const CATEGORY_LABELS: Record<FileCategory, string> = {
  IDENTITY: "Identity Document",
  PROOF_OF_RESIDENCE: "Proof of Residence",
  PATHOLOGY_REPORT: "Pathology Report",
  MEDICAL_RECORDS: "Medical Records",
  DISCHARGE_SUMMARY: "Discharge Summary",
  TUMOR_REGISTRY: "Tumor Registry",
  TREATMENT_RECORDS: "Treatment Records",
  UTILITY_BILL: "Utility Bill",
  MORTGAGE_STATEMENT: "Mortgage Statement",
  TAX_RETURN: "Tax Return",
  SCHOOL_RECORDS: "School Records",
  EMPLOYMENT_RECORDS: "Employment Records",
  OTHER: "Other",
};

const STATUS_CONFIG: Record<
  FileStatus,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  UPLOADING: { label: "Uploading", icon: Clock, color: "text-gray-600" },
  PROCESSING: { label: "Processing", icon: Clock, color: "text-gray-600" },
  READY: { label: "Ready", icon: CheckCircle, color: "text-blue-600" },
  FAILED: { label: "Failed", icon: AlertCircle, color: "text-red-600" },
  REJECTED: { label: "Rejected", icon: AlertCircle, color: "text-red-600" },
  VALIDATED: { label: "Validated", icon: CheckCircle, color: "text-green-600" },
  AWAITING_REVIEW: {
    label: "Awaiting Review",
    icon: Clock,
    color: "text-yellow-600",
  },
  APPROVED: { label: "Approved", icon: CheckCircle, color: "text-emerald-600" },
};

export default function ClaimantDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const claimantId = params.id as string;

  const [claimant, setClaimant] = useState<Claimant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Redirect if not authenticated or not attorney
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login?callbackUrl=/attorney/dashboard");
      return;
    }

    if (
      session.user.role !== "ATTORNEY" &&
      session.user.role !== "FIRM_ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Fetch claimant and documents
  useEffect(() => {
    if (status === "loading" || !session) return;

    let isActive = true;

    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/attorney/claimants/${claimantId}/documents`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data: ApiResponse = await response.json();

        if (!isActive) return;

        setClaimant(data.claimant);
        setDocuments(data.documents);
      } catch (err) {
        if (!isActive) return;

        console.error("Failed to fetch documents:", err);
        setError("Failed to load documents. Please try again.");
      } finally {
        if (!isActive) return;

        setLoading(false);
      }
    };

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [claimantId, session, status]);

  async function handleDownload(documentId: string) {
    try {
      setDownloadingId(documentId);

      const response = await fetch(
        `/api/attorney/documents/${documentId}/download`
      );

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const data = await response.json();

      // Open download in new tab
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Failed to download document:", err);
      alert("Failed to download document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Show loading state during authentication check
  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 animate-spin text-sage-600" />
          <p className="mt-4 text-sage-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  if (session.user.role !== "ATTORNEY" && session.user.role !== "FIRM_ADMIN") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="border-b border-cream-200 bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/attorney/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-8 w-px bg-cream-300" />
            {claimant && (
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100">
                    <User className="h-5 w-5 text-sage-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-sage-900">
                      {claimant.firstName} {claimant.lastName}
                    </h1>
                    <p className="text-sm text-sage-600">{claimant.email}</p>
                  </div>
                  {claimant.isPremiumService && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                      <DollarSign className="h-4 w-4" />
                      Premium Service
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status and Claim Type */}
          {claimant && (
            <div className="mt-4 flex items-center gap-4">
              <WorkflowStatusBadge status={claimant.workflowStatus} />
              {claimant.claimType && (
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-700">
                  {CLAIM_TYPE_LABELS[claimant.claimType]}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-sage-900">
              Document Packet
            </h2>
            <p className="mt-1 text-sm text-sage-600">
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"} uploaded
            </p>
          </div>
          <Button
            variant="outline"
            className="border-sage-300"
            onClick={() => {
              // TODO: Implement download all functionality
              alert("Download all functionality coming soon!");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-sage-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border border-cream-200 bg-white p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-sage-400" />
            <h3 className="mt-4 text-lg font-semibold text-sage-900">
              No documents found
            </h3>
            <p className="mt-2 text-sage-600">
              This claimant has not uploaded any documents yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-cream-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const statusConfig = STATUS_CONFIG[doc.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-sage-500" />
                          <div>
                            <div className="font-medium text-sage-900">
                              {doc.originalFilename}
                            </div>
                            {doc.requiresOriginal && (
                              <div className="text-xs text-orange-600">
                                Original required for submission
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sage-700">
                          {CATEGORY_LABELS[doc.category]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={`h-4 w-4 ${statusConfig.color}`}
                          />
                          <span
                            className={`text-sm font-medium ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sage-600">
                          {formatFileSize(doc.sizeBytes)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sage-600">
                          {formatDistanceToNow(new Date(doc.uploadedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id)}
                            disabled={downloadingId === doc.id}
                          >
                            {downloadingId === doc.id ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Document Stats */}
        {!loading && documents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
              <div className="text-sm text-sage-600">Total Documents</div>
              <div className="mt-1 text-2xl font-bold text-sage-900">
                {documents.length}
              </div>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="text-sm text-green-600">Validated</div>
              <div className="mt-1 text-2xl font-bold text-green-900">
                {documents.filter((d) => d.status === "VALIDATED").length}
              </div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="text-sm text-orange-600">Requires Original</div>
              <div className="mt-1 text-2xl font-bold text-orange-900">
                {documents.filter((d) => d.requiresOriginal).length}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

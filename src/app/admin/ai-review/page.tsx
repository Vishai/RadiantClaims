"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import { DocumentViewer } from "@/components/admin/DocumentViewer";

interface DocumentValidation {
  id: string;
  status: string;
  overallConfidence: number | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  staffNotes: string | null;
  uploadedFile: {
    id: string;
    originalFilename: string;
    category: string | null;
    customerStatus: string;
    intakeSession: {
      id: string;
      claimant: {
        firstName: string;
        lastName: string;
        email: string;
        user: {
          email: string;
          name: string | null;
        } | null;
      } | null;
      serviceSubscription: {
        user: {
          email: string;
          name: string | null;
        } | null;
      } | null;
    };
  };
  criticalIssues: any[];
  warnings: any[];
  suggestions: any[];
}

export default function AIReviewPage() {
  const [validations, setValidations] = useState<DocumentValidation[]>([]);
  const [filteredValidations, setFilteredValidations] = useState<
    DocumentValidation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("NEEDS_REVIEW");
  const [selectedValidation, setSelectedValidation] =
    useState<DocumentValidation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  useEffect(() => {
    fetchValidations();
  }, []);

  useEffect(() => {
    filterValidations();
  }, [validations, statusFilter]);

  const fetchValidations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/ai-review");

      if (!response.ok) {
        throw new Error("Failed to fetch validations");
      }

      const data = await response.json();
      setValidations(data.validations);
    } catch (error) {
      console.error("Error fetching validations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterValidations = () => {
    let filtered = [...validations];

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredValidations(filtered);
  };

  const viewValidation = (validation: DocumentValidation) => {
    setSelectedValidation(validation);
    setReviewNotes(validation.staffNotes || "");
    setIsViewDialogOpen(true);
  };

  const handleReview = async (decision: "STAFF_APPROVED" | "REJECTED") => {
    if (!selectedValidation) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/ai-review/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationId: selectedValidation.id,
          decision,
          notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      alert(
        `Document ${decision === "STAFF_APPROVED" ? "approved" : "rejected"}`
      );
      setIsViewDialogOpen(false);
      fetchValidations();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "NEEDS_REVIEW":
        return "bg-orange-100 text-orange-800";
      case "STAFF_APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (confidence === null) return "text-gray-500";
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Review Queue</h1>
        <p className="mt-2 text-gray-600">
          Review documents flagged by AI validation
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-orange-100 p-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {validations.filter((v) => v.status === "NEEDS_REVIEW").length}
              </p>
              <p className="text-sm text-gray-600">Needs Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {validations.filter((v) => v.status === "PROCESSING").length}
              </p>
              <p className="text-sm text-gray-600">Processing</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {
                  validations.filter((v) => v.status === "STAFF_APPROVED")
                    .length
                }
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {validations.filter((v) => v.status === "REJECTED").length}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="w-full md:w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="STAFF_APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Validations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Validations</CardTitle>
          <CardDescription>
            {filteredValidations.length} documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : filteredValidations.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No documents found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Document</th>
                    <th className="pb-3 font-medium">Claimant</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Confidence</th>
                    <th className="pb-3 font-medium">Issues</th>
                    <th className="pb-3 font-medium">Reviewed By</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValidations.map((validation) => (
                    <tr key={validation.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {validation.uploadedFile.originalFilename}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm">
                          {validation.uploadedFile.intakeSession.claimant
                            ? `${validation.uploadedFile.intakeSession.claimant.firstName} ${validation.uploadedFile.intakeSession.claimant.lastName}`
                            : validation.uploadedFile.intakeSession.claimant
                                ?.user?.name ||
                              validation.uploadedFile.intakeSession
                                .serviceSubscription?.user?.name ||
                              "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {validation.uploadedFile.intakeSession.claimant
                            ?.email ||
                            validation.uploadedFile.intakeSession.claimant?.user
                              ?.email ||
                            validation.uploadedFile.intakeSession
                              .serviceSubscription?.user?.email}
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        {validation.uploadedFile.category?.replace(/_/g, " ") ||
                          "—"}
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(validation.status)}>
                          {validation.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <span
                          className={`font-medium ${getConfidenceColor(
                            validation.overallConfidence
                          )}`}
                        >
                          {validation.overallConfidence !== null
                            ? `${(validation.overallConfidence * 100).toFixed(0)}%`
                            : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {validation.criticalIssues.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {validation.criticalIssues.length} critical
                            </Badge>
                          )}
                          {validation.warnings.length > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {validation.warnings.length} warnings
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {validation.reviewedBy || "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewingFileId(validation.uploadedFile.id);
                              setIsDocumentViewerOpen(true);
                            }}
                            title="View document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewValidation(validation)}
                            title="View validation details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Validation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedValidation && (
            <>
              <DialogHeader>
                <DialogTitle>Document Validation Review</DialogTitle>
                <DialogDescription>
                  {selectedValidation.uploadedFile.originalFilename}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status & Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge
                      className={getStatusColor(selectedValidation.status)}
                    >
                      {selectedValidation.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Confidence Score
                    </p>
                    <span
                      className={`text-lg font-semibold ${getConfidenceColor(
                        selectedValidation.overallConfidence
                      )}`}
                    >
                      {selectedValidation.overallConfidence !== null
                        ? `${(selectedValidation.overallConfidence * 100).toFixed(0)}%`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Critical Issues */}
                {selectedValidation.criticalIssues.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-700">
                      <XCircle className="h-5 w-5" />
                      Critical Issues (
                      {selectedValidation.criticalIssues.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedValidation.criticalIssues.map(
                        (issue: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-red-200 bg-red-50 p-3"
                          >
                            <p className="text-sm text-red-900">
                              {typeof issue === "string"
                                ? issue
                                : JSON.stringify(issue)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {selectedValidation.warnings.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      Warnings ({selectedValidation.warnings.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedValidation.warnings.map(
                        (warning: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                          >
                            <p className="text-sm text-yellow-900">
                              {typeof warning === "string"
                                ? warning
                                : JSON.stringify(warning)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {selectedValidation.suggestions.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-700">
                      <CheckCircle2 className="h-5 w-5" />
                      Suggestions ({selectedValidation.suggestions.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedValidation.suggestions.map(
                        (suggestion: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                          >
                            <p className="text-sm text-blue-900">
                              {typeof suggestion === "string"
                                ? suggestion
                                : JSON.stringify(suggestion)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                <div className="border-t pt-4">
                  <label
                    htmlFor="reviewNotes"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Staff Review Notes
                  </label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    rows={4}
                    disabled={
                      selectedValidation.status === "STAFF_APPROVED" ||
                      selectedValidation.status === "REJECTED"
                    }
                  />
                </div>

                {/* Action Buttons */}
                {selectedValidation.status !== "STAFF_APPROVED" &&
                  selectedValidation.status !== "REJECTED" && (
                    <div className="border-t pt-4">
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleReview("REJECTED")}
                          disabled={isSubmitting}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Document
                        </Button>
                        <Button
                          onClick={() => handleReview("STAFF_APPROVED")}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve Document
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {viewingFileId && (
        <DocumentViewer
          fileId={viewingFileId}
          isOpen={isDocumentViewerOpen}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            setViewingFileId(null);
          }}
        />
      )}
    </div>
  );
}

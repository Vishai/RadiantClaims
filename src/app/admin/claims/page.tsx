"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  FileText,
  Download,
  Files,
  X,
  Filter,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/admin/MultiSelect";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";

interface IntakeSession {
  id: string;
  status: string;
  claimType: string | null;
  currentStep: string;
  isPremiumService: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  recaWorkflowStage: number | null;
  recaCompletionPercent: number | null;
  claimant: {
    firstName: string;
    lastName: string;
    email: string;
    state: string;
    user: {
      email: string;
      name: string | null;
    } | null;
  } | null;
  serviceSubscription: {
    tier: string;
    status: string;
    user: {
      email: string;
      name: string | null;
    } | null;
  } | null;
  _count: {
    uploadedFiles: number;
    intakeResponses: number;
  };
  claimReadiness: {
    readinessScore: number;
    isReadyForSubmission: boolean;
    staffReviewStatus: string;
  } | null;
}

export default function ClaimsAdminPage() {
  const [sessions, setSessions] = useState<IntakeSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<IntakeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Filters
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [claimTypeFilters, setClaimTypeFilters] = useState<string[]>([]);
  const [serviceTierFilters, setServiceTierFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSession, setSelectedSession] = useState<IntakeSession | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [sessionDocuments, setSessionDocuments] = useState<any[]>([]);

  // Filter options
  const statusOptions: MultiSelectOption[] = [
    { label: "Draft", value: "DRAFT" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Ready for Review", value: "READY_FOR_REVIEW" },
    { label: "Under Review", value: "UNDER_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Submitted", value: "SUBMITTED" },
  ];

  const claimTypeOptions: MultiSelectOption[] = [
    { label: "Downwinder", value: "DOWNWINDER" },
    { label: "Onsite Participant", value: "ONSITE_PARTICIPANT" },
    { label: "Uranium Worker", value: "URANIUM_WORKER" },
  ];

  const serviceTierOptions: MultiSelectOption[] = [
    { label: "DIY Prep", value: "DIY_PREP" },
    { label: "Legal Rep", value: "LEGAL_REP" },
  ];

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/claims");

      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterSessions = useCallback(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.claimant?.firstName.toLowerCase().includes(term) ||
          session.claimant?.lastName.toLowerCase().includes(term) ||
          session.claimant?.email.toLowerCase().includes(term) ||
          session.claimant?.user?.email.toLowerCase().includes(term) ||
          session.serviceSubscription?.user?.email.toLowerCase().includes(term)
      );
    }

    // Apply status filters (multi-select)
    if (statusFilters.length > 0) {
      filtered = filtered.filter((session) =>
        statusFilters.includes(session.status)
      );
    }

    // Apply claim type filters
    if (claimTypeFilters.length > 0) {
      filtered = filtered.filter(
        (session) =>
          session.claimType && claimTypeFilters.includes(session.claimType)
      );
    }

    // Apply service tier filters
    if (serviceTierFilters.length > 0) {
      filtered = filtered.filter(
        (session) =>
          session.serviceSubscription &&
          serviceTierFilters.includes(session.serviceSubscription.tier)
      );
    }

    // Apply date range filter
    const from = dateRange?.from;
    if (from) {
      const to = dateRange?.to;
      filtered = filtered.filter((session) => {
        const sessionDate = parseISO(session.createdAt);
        if (to) {
          return isWithinInterval(sessionDate, {
            start: from,
            end: to,
          });
        }
        return sessionDate >= from;
      });
    }

    setFilteredSessions(filtered);
  }, [
    sessions,
    searchTerm,
    statusFilters,
    claimTypeFilters,
    serviceTierFilters,
    dateRange,
  ]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    filterSessions();
  }, [filterSessions]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilters([]);
    setClaimTypeFilters([]);
    setServiceTierFilters([]);
    setDateRange(undefined);
  };

  const activeFilterCount =
    (statusFilters.length > 0 ? 1 : 0) +
    (claimTypeFilters.length > 0 ? 1 : 0) +
    (serviceTierFilters.length > 0 ? 1 : 0) +
    (dateRange ? 1 : 0);

  const viewSession = (session: IntakeSession) => {
    setSelectedSession(session);
    setIsViewDialogOpen(true);
  };

  const viewSessionDocuments = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/documents`
      );
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setSessionDocuments(data.files || []);
      setDocumentsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Failed to load documents");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "READY_FOR_REVIEW":
        return "bg-orange-100 text-orange-800";
      case "UNDER_REVIEW":
        return "bg-purple-100 text-purple-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "SUBMITTED":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getClaimTypeLabel = (claimType: string | null) => {
    if (!claimType) return "—";
    return claimType.replace(/_/g, " ");
  };

  const getReadinessScore = (session: IntakeSession) => {
    if (!session.claimReadiness) return null;
    const score = session.claimReadiness.readinessScore;
    const color =
      score >= 80
        ? "text-green-600"
        : score >= 50
          ? "text-yellow-600"
          : "text-red-600";
    return <span className={`font-medium ${color}`}>{score.toFixed(0)}%</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Claims & Intake Management
        </h1>
        <p className="mt-2 text-gray-600">
          View and manage all intake sessions and claims
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.filter((s) => s.status === "IN_PROGRESS").length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {sessions.filter((s) => s.status === "READY_FOR_REVIEW").length}
            </div>
            <p className="text-sm text-gray-600">Ready for Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter((s) => s.status === "APPROVED").length}
            </div>
            <p className="text-sm text-gray-600">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-teal-600">
              {sessions.filter((s) => s.status === "SUBMITTED").length}
            </div>
            <p className="text-sm text-gray-600">Submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and Toggle Advanced */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                {(activeFilterCount > 0 || searchTerm) && (
                  <Button variant="ghost" onClick={clearAllFilters} size="sm">
                    <X className="mr-1 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <MultiSelect
                    options={statusOptions}
                    selected={statusFilters}
                    onChange={setStatusFilters}
                    placeholder="All statuses"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Claim Type
                  </label>
                  <MultiSelect
                    options={claimTypeOptions}
                    selected={claimTypeFilters}
                    onChange={setClaimTypeFilters}
                    placeholder="All types"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Service Tier
                  </label>
                  <MultiSelect
                    options={serviceTierOptions}
                    selected={serviceTierFilters}
                    onChange={setServiceTierFilters}
                    placeholder="All tiers"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Date Range
                  </label>
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                    placeholder="All dates"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Intake Sessions</CardTitle>
          <CardDescription>
            {filteredSessions.length} session
            {filteredSessions.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 && " (filtered)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No sessions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Claimant</th>
                    <th className="pb-3 font-medium">Claim Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium">Readiness</th>
                    <th className="pb-3 font-medium">Files</th>
                    <th className="pb-3 font-medium">Service</th>
                    <th className="pb-3 font-medium">Last Activity</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">
                            {session.claimant
                              ? `${session.claimant.firstName} ${session.claimant.lastName}`
                              : session.serviceSubscription?.user?.name || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.claimant?.email ||
                              session.claimant?.user?.email ||
                              session.serviceSubscription?.user?.email ||
                              "—"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        {getClaimTypeLabel(session.claimType)}
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">
                        {session.recaCompletionPercent !== null
                          ? `${session.recaCompletionPercent}%`
                          : "—"}
                      </td>
                      <td className="py-3 text-sm">
                        {getReadinessScore(session) || "—"}
                      </td>
                      <td className="py-3 text-center">
                        <Badge className="bg-gray-100 text-gray-800">
                          {session._count.uploadedFiles}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {session.serviceSubscription ? (
                          <Badge
                            className={
                              session.serviceSubscription.tier === "DIY_PREP"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {session.serviceSubscription.tier === "DIY_PREP"
                              ? "DIY"
                              : "Legal"}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(session.lastActivityAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewSession(session)}
                            title="Quick view"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/admin/claims/${session.id}` as any}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="View & Edit"
                              className="border-terracotta-200 text-terracotta-600 hover:bg-terracotta-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          {session._count.uploadedFiles > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewSessionDocuments(session.id)}
                              title="View documents"
                            >
                              <Files className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* View Session Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>Intake Session Details</DialogTitle>
                <DialogDescription>
                  Session ID: {selectedSession.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Claimant Info */}
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Claimant Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-base">
                        {selectedSession.claimant
                          ? `${selectedSession.claimant.firstName} ${selectedSession.claimant.lastName}`
                          : selectedSession.serviceSubscription?.user?.name ||
                            "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base">
                        {selectedSession.claimant?.email ||
                          selectedSession.claimant?.user?.email ||
                          selectedSession.serviceSubscription?.user?.email ||
                          "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">State</p>
                      <p className="text-base">
                        {selectedSession.claimant?.state || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Claim Type
                      </p>
                      <p className="text-base">
                        {getClaimTypeLabel(selectedSession.claimType)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Session Status */}
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Session Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Status
                      </p>
                      <Badge className={getStatusColor(selectedSession.status)}>
                        {selectedSession.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Current Step
                      </p>
                      <p className="text-base">
                        {selectedSession.currentStep.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Completion
                      </p>
                      <p className="text-base">
                        {selectedSession.recaCompletionPercent !== null
                          ? `${selectedSession.recaCompletionPercent}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Service Tier
                      </p>
                      {selectedSession.serviceSubscription ? (
                        <Badge
                          className={
                            selectedSession.serviceSubscription.tier ===
                            "DIY_PREP"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {selectedSession.serviceSubscription.tier ===
                          "DIY_PREP"
                            ? "DIY Prep"
                            : "Legal Rep"}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Readiness */}
                {selectedSession.claimReadiness && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold text-gray-900">
                      AI Validation
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Readiness Score
                        </p>
                        <p className="text-lg">
                          {getReadinessScore(selectedSession)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Ready for Submission
                        </p>
                        <p className="text-base">
                          {selectedSession.claimReadiness.isReadyForSubmission
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Staff Review Status
                        </p>
                        <Badge>
                          {selectedSession.claimReadiness.staffReviewStatus.replace(
                            /_/g,
                            " "
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files & Documents */}
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Files & Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Uploaded Files
                      </p>
                      <p className="text-base">
                        {selectedSession._count.uploadedFiles}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Intake Responses
                      </p>
                      <p className="text-base">
                        {selectedSession._count.intakeResponses}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Created
                      </p>
                      <p className="text-sm">
                        {new Date(selectedSession.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Last Updated
                      </p>
                      <p className="text-sm">
                        {new Date(selectedSession.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Last Activity
                      </p>
                      <p className="text-sm">
                        {new Date(
                          selectedSession.lastActivityAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession._count.uploadedFiles > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewSessionDocuments(selectedSession.id)}
                      >
                        <Files className="mr-2 h-4 w-4" />
                        View Documents ({selectedSession._count.uploadedFiles})
                      </Button>
                    )}
                    <Link
                      href={`/admin/ai-review?session=${selectedSession.id}`}
                      target="_blank"
                    >
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        View AI Review
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await fetch(
                            `/api/admin/claims/${selectedSession.id}/start-review`,
                            { method: "POST" }
                          );
                        } catch (e) {
                          console.error("Failed to start review", e);
                        }
                      }}
                    >
                      Start Review
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(
                          `/api/admin/sessions/${selectedSession.id}/download`,
                          "_blank"
                        );
                      }}
                      disabled={selectedSession._count.uploadedFiles === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Packet
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents List Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Documents</DialogTitle>
            <DialogDescription>
              All uploaded documents for this intake session
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {sessionDocuments.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No documents found
              </div>
            ) : (
              <div className="space-y-2">
                {sessionDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.originalFilename}</p>
                        <p className="text-sm text-gray-500">
                          {doc.category?.replace(/_/g, " ") || "Uncategorized"}{" "}
                          • Uploaded{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {doc.validation && (
                        <Badge
                          className={
                            doc.validation.status === "VERIFIED"
                              ? "bg-green-100 text-green-800"
                              : doc.validation.status === "NEEDS_REVIEW"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {doc.validation.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewingFileId(doc.id);
                          setIsDocumentViewerOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

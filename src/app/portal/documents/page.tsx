"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Upload,
  ListChecks,
  Filter,
  Plus,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentDashboard } from "@/components/documents/DocumentDashboard";
import {
  DocumentTrackingCard,
  DocumentTrackingData,
} from "@/components/documents/DocumentTrackingCard";
import { Progress } from "@/components/ui/progress";
import { RequestSiblingDocsDialog } from "@/components/documents/RequestSiblingDocsDialog";

interface RequiredDocument {
  category: string;
  label: string;
  description: string;
  uploaded: boolean;
  required: boolean;
  helpText?: string;
}

export default function DocumentsPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Request Dialog State
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestDialogData, setRequestDialogData] = useState<{
    siblingName?: string;
    category?: string;
  }>({});

  // Tracking state
  const [trackingDocuments, setTrackingDocuments] = useState<
    DocumentTrackingData[]
  >([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Get default tab from URL query parameter
  const [defaultTab, setDefaultTab] = useState<string>("upload");

  useEffect(() => {
    // Check URL for tab parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "tracking" || tab === "upload") {
      setDefaultTab(tab);
    }
  }, []);

  const loadDocumentRequirements = useCallback(
    async (sessionId: string, claimType?: string, formData?: any) => {
      try {
        // Fetch uploaded files
        const response = await fetch(`/api/documents?sessionId=${sessionId}`);
        if (!response.ok) return;

        const data = await response.json();
        const uploadedFiles = data.files || [];
        setUploadedCount(uploadedFiles.length);

        // Define required documents based on claim type
        const requirements: RequiredDocument[] = [];

        // Helper to check if a category is uploaded
        const isUploaded = (category: string) =>
          uploadedFiles.some((f: any) => f.category === category);

        // Helper to check count of uploaded category
        const countUploaded = (category: string) =>
          uploadedFiles.filter((f: any) => f.category === category).length;

        if (claimType === "DOWNWINDER") {
          // 1. Identity & Vital Records
          // Check for Deceased Claimant (Death Certificate)
          const isDeceased =
            formData?.part_5?.claimantDeceased === "YES" ||
            formData?.part_6?.claimantDeceased === "YES" ||
            formData?.part_1?.filingForSelf === false; // Heuristic if not explicit

          if (isDeceased) {
            requirements.push({
              category: "DEATH_CERTIFICATE",
              label: "Death Certificate",
              description: "Official death certificate for the claimant",
              uploaded: isUploaded("DEATH_CERTIFICATE"),
              required: true,
              helpText: "Required for all deceased claimants",
            });
          }

          // Birth Certificate (Always required for claimant)
          requirements.push({
            category: "BIRTH_CERTIFICATE",
            label: "Birth Certificate",
            description: "Official birth certificate for the claimant",
            uploaded: isUploaded("BIRTH_CERTIFICATE"),
            required: true,
            helpText: "Must show parents' names",
          });

          // Name Chain Logic (Marriage Certificates / Name Changes)
          let nameChainRequired = false;
          let nameChainReason = "";

          // Check Filer's Name Changes
          if (
            formData?.part_1?.formerNames &&
            formData.part_1.formerNames.length > 0
          ) {
            nameChainRequired = true;
            nameChainReason = "Filer has former names";
          }

          // Check Claimant's Name Changes (if different person)
          if (
            formData?.part_2?.formerNames &&
            formData.part_2.formerNames.length > 0
          ) {
            nameChainRequired = true;
            nameChainReason = "Claimant has former names";
          }

          // Check Relationship (Spouse/Child often implies name changes)
          const relationship = formData?.part_3?.relationship;
          if (
            relationship === "Spouse" ||
            relationship === "Child" ||
            relationship === "Grandchild"
          ) {
            // If last names differ, we likely need a link
            const filerLast = formData?.part_1?.lastName?.toLowerCase();
            const claimantLast =
              formData?.part_2?.lastName?.toLowerCase() || filerLast; // Fallback if self
            if (filerLast && claimantLast && filerLast !== claimantLast) {
              nameChainRequired = true;
              nameChainReason = "Filer and Claimant last names differ";
            }
          }

          if (nameChainRequired) {
            requirements.push({
              category: "MARRIAGE_CERTIFICATE",
              label: "Marriage Certificate(s) / Name Change Docs",
              description:
                "Documents linking current names to birth names (e.g., Marriage Certs, Divorce Decrees)",
              uploaded:
                isUploaded("MARRIAGE_CERTIFICATE") ||
                countUploaded("IDENTITY") >= 2, // Fallback to generic identity if specific not found
              required: true,
              helpText: `Required because: ${nameChainReason}. Provide a document for EACH name change.`,
            });
          }

          // Sibling Requirements (Part 6)
          if (
            formData?.part_6?.siblings &&
            Array.isArray(formData.part_6.siblings)
          ) {
            formData.part_6.siblings.forEach((sibling: any, index: number) => {
              const siblingName = sibling.name || `Sibling #${index + 1}`;

              // Sibling Birth Certificate
              requirements.push({
                category: "BIRTH_CERTIFICATE",
                label: `${siblingName} - Birth Certificate`,
                description: `Birth certificate for ${siblingName} to prove relationship`,
                uploaded: uploadedFiles.some(
                  (f: any) =>
                    f.category === "BIRTH_CERTIFICATE" &&
                    f.originalFilename
                      ?.toLowerCase()
                      .includes(siblingName.split(" ")[0].toLowerCase())
                ),
                required: true,
                helpText:
                  "Must show parents' names to establish sibling relationship",
              });

              // Sibling Name Change / Marriage Certificate
              if (
                sibling.hadNameChange === "YES" ||
                sibling.nameChangeHistory?.length > 0
              ) {
                requirements.push({
                  category: "MARRIAGE_CERTIFICATE",
                  label: `${siblingName} - Marriage/Name Change`,
                  description: `Marriage certificate or legal name change for ${siblingName}`,
                  uploaded: uploadedFiles.some(
                    (f: any) =>
                      f.category === "MARRIAGE_CERTIFICATE" &&
                      f.originalFilename
                        ?.toLowerCase()
                        .includes(siblingName.split(" ")[0].toLowerCase())
                  ),
                  required: true,
                  helpText:
                    "Required to link current name to birth certificate",
                });
              }
            });
          }

          // 2. Proof of Presence
          requirements.push({
            category: "PROOF_OF_RESIDENCE",
            label: "Proof of Physical Presence (2+ documents)",
            description:
              "Tax records, property records, school enrollment, utility bills, employment records, etc.",
            uploaded:
              uploadedFiles.filter((f: any) =>
                [
                  "PROOF_OF_RESIDENCE",
                  "UTILITY_BILL",
                  "TAX_RETURN",
                  "SCHOOL_RECORDS",
                  "MORTGAGE_STATEMENT",
                  "EMPLOYMENT_RECORDS",
                ].includes(f.category || "")
              ).length >= 2,
            required: true,
            helpText:
              "Need at least 2 documents showing presence in affected area during exposure period",
          });

          // 3. Medical Records
          requirements.push({
            category: "MEDICAL_RECORDS",
            label: "Medical Records Showing Cancer Diagnosis",
            description:
              "Pathology reports, biopsy results, hospital records, or doctor's notes confirming compensable disease",
            uploaded:
              isUploaded("MEDICAL_RECORDS") || isUploaded("PATHOLOGY_REPORT"),
            required: true,
            helpText:
              "See RECA form pages 18-24 for specific documents accepted for each disease type",
          });
        } else {
          // Generic requirements for other claim types
          requirements.push(
            {
              category: "IDENTITY",
              label: "Identification Documents",
              description:
                "Birth certificate, death certificate, marriage certificates as applicable",
              uploaded: isUploaded("IDENTITY"),
              required: true,
              helpText: "Required to establish identity and relationships",
            },
            {
              category: "MEDICAL_RECORDS",
              label: "Medical Records",
              description: "Medical documentation relevant to your claim type",
              uploaded: isUploaded("MEDICAL_RECORDS"),
              required: true,
              helpText:
                "Requirements vary by claim type - refer to your RECA form instructions",
            }
          );
        }

        setRequiredDocs(requirements);
      } catch (error) {
        console.error("Failed to load requirements:", error);
      }
    },
    []
  );

  const fetchTrackingDocuments = useCallback(async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch("/api/documents/tracking");
      if (!response.ok) {
        throw new Error("Failed to fetch tracking documents");
      }
      const data = await response.json();
      setTrackingDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching tracking documents:", err);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  const loadUserSession = useCallback(async () => {
    setLoading(true);
    try {
      // Get user's intake session
      const response = await fetch("/api/portal/claims");
      if (response.ok) {
        const data = await response.json();
        if (data.claims && data.claims.length > 0) {
          const firstClaim = data.claims[0];
          if (firstClaim.intakeSession) {
            setSessionId(firstClaim.intakeSession.id);
            await loadDocumentRequirements(
              firstClaim.intakeSession.id,
              firstClaim.claimType,
              firstClaim.intakeSession.recaFormData // Pass form data
            );
          }
        }
      }
      // Also load tracking documents
      await fetchTrackingDocuments();
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  }, [loadDocumentRequirements, fetchTrackingDocuments]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal/documents");
    } else if (status === "authenticated") {
      void loadUserSession();
    }
  }, [status, router, loadUserSession]);

  const handleUploadComplete = () => {
    // Refresh the dashboard
    setRefreshKey((prev) => prev + 1);
    // Reload requirements to update checklist
    if (sessionId) {
      loadDocumentRequirements(sessionId, "DOWNWINDER");
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (sessionId) {
      loadDocumentRequirements(sessionId, "DOWNWINDER");
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

      // Refresh tracking documents
      await fetchTrackingDocuments();
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    }
  };

  const handleUploadClick = (_documentType: string) => {
    // Switch to upload tab
    const uploadTab = document.querySelector(
      '[data-state="inactive"][value="upload"]'
    ) as HTMLButtonElement;
    uploadTab?.click();
  };

  const filteredTrackingDocuments =
    filterStatus === "all"
      ? trackingDocuments
      : trackingDocuments.filter((doc) => doc.status === filterStatus);

  // Group tracking documents by status for summary
  const statusCounts = trackingDocuments.reduce(
    (acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const completionPercentage =
    requiredDocs.length > 0
      ? Math.round(
          (requiredDocs.filter((d) => d.uploaded).length /
            requiredDocs.length) *
            100
        )
      : 0;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-cream-50">
        <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between p-6">
            <Link href="/portal" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
                <Heart className="h-5 w-5 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-sage-800">
                RadiantClaims
              </span>
            </Link>
          </div>
        </nav>
        <main className="container mx-auto max-w-4xl px-6 py-12">
          <Card className="rounded-3xl border-2 border-cream-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-16 w-16 text-sage-300" />
              <h3 className="mb-2 text-xl font-semibold text-sage-900">
                No Active Claim
              </h3>
              <p className="mb-6 text-center text-sage-600">
                You need to start a claim before uploading documents
              </p>
              <Button
                onClick={() => router.push("/portal")}
                className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-sage-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/signout")}
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-7xl px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/portal")}
          className="mb-6 gap-2 text-sage-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            Document Management
          </h1>
          <p className="text-lg text-sage-700">
            Track, upload, and organize your claim documents
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload & Manage
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Track Progress
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content - 2 columns */}
              <div className="space-y-8 lg:col-span-2">
                {/* Upload Zone */}
                <Card className="rounded-3xl border-2 border-cream-200">
                  <CardHeader>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>
                      Upload PDFs or images of your documents. Maximum file
                      size: 10MB.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentUploadZone
                      sessionId={sessionId}
                      onUploadComplete={handleUploadComplete}
                      onUploadError={(error) => alert(error)}
                    />
                  </CardContent>
                </Card>

                {/* Uploaded Documents */}
                <Card className="rounded-3xl border-2 border-cream-200">
                  <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                    <CardDescription>
                      View, download, or manage your uploaded documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentDashboard
                      key={refreshKey}
                      sessionId={sessionId}
                      onRefresh={handleRefresh}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                {/* Progress Card */}
                <Card className="rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-sage-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-sage-600" />
                      Document Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-sage-700">
                          Completeness
                        </span>
                        <span className="text-sage-900">
                          {completionPercentage}%
                        </span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sage-700">
                          Documents Uploaded
                        </span>
                        <span className="font-medium text-sage-900">
                          {uploadedCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-700">
                          Required Documents
                        </span>
                        <span className="font-medium text-sage-900">
                          {requiredDocs.filter((d) => d.required).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Required Documents Checklist */}
                <Card className="rounded-3xl border-2 border-cream-200">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Required Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {requiredDocs.map((doc, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border-2 p-3 transition-colors ${
                            doc.uploaded
                              ? "border-green-300 bg-green-50"
                              : "border-sage-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {doc.uploaded ? (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                            ) : (
                              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-400" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-sage-900">
                                    {doc.label}
                                    {doc.required && (
                                      <span className="ml-1 text-xs text-terracotta-600">
                                        *
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-xs text-sage-600">
                                    {doc.description}
                                  </p>
                                </div>
                                {!doc.uploaded &&
                                  doc.label.includes("Sibling") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setRequestDialogData({
                                          siblingName:
                                            doc.label.split(" - ")[0],
                                          category: doc.category,
                                        });
                                        setRequestDialogOpen(true);
                                      }}
                                    >
                                      <Mail className="mr-1 h-3 w-3" />
                                      Request
                                    </Button>
                                  )}
                              </div>
                              {doc.helpText && (
                                <p className="mt-1.5 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
                                  💡 {doc.helpText}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                      <p className="mb-1 font-semibold">
                        About Document Requirements:
                      </p>
                      <p className="text-[11px]">
                        * = Required for your claim. Upload here for safekeeping
                        and organization. Final submission will be via mail
                        according to RECA requirements.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Need Help Card */}
                <Card className="rounded-3xl border-2 border-terracotta-200 bg-terracotta-50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Need Help Finding Documents?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sage-700">
                      Use our Contact Finder or Resource Directory to find
                      government offices and medical facilities where you can
                      request documents.
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => router.push("/resources")}
                        variant="outline"
                        className="w-full rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                      >
                        Contact Finder
                      </Button>
                      <Button
                        onClick={() => router.push("/resources")}
                        variant="outline"
                        className="w-full rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                      >
                        Browse Resources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card className="rounded-3xl border-2 border-cream-200 p-4">
                  <div className="text-2xl font-bold text-sage-900">
                    {trackingDocuments.length}
                  </div>
                  <div className="text-sm text-sage-600">Total Documents</div>
                </Card>
                <Card className="rounded-3xl border-2 border-cream-200 p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {statusCounts.AWAITING || 0}
                  </div>
                  <div className="text-sm text-sage-600">Awaiting</div>
                </Card>
                <Card className="rounded-3xl border-2 border-cream-200 p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {statusCounts.RECEIVED || 0}
                  </div>
                  <div className="text-sm text-sage-600">Received</div>
                </Card>
                <Card className="rounded-3xl border-2 border-cream-200 p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {(statusCounts.UPLOADED || 0) +
                      (statusCounts.VERIFIED || 0)}
                  </div>
                  <div className="text-sm text-sage-600">Complete</div>
                </Card>
              </div>

              {/* Filter and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-sage-600" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[200px] rounded-full">
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
                  <span className="text-sm text-sage-600">
                    Showing {filteredTrackingDocuments.length} of{" "}
                    {trackingDocuments.length} documents
                  </span>
                </div>
                <Button
                  onClick={() => router.push("/resources")}
                  className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                >
                  <Plus className="h-4 w-4" />
                  Find New Document
                </Button>
              </div>

              {/* Document Cards */}
              {trackingLoading ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
                    <p className="text-sage-700">Loading tracking data...</p>
                  </div>
                </div>
              ) : filteredTrackingDocuments.length === 0 ? (
                <Card className="rounded-3xl border-2 border-cream-200 p-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-sage-300" />
                  <h3 className="mb-2 text-lg font-semibold text-sage-900">
                    No Documents Found
                  </h3>
                  <p className="mb-4 text-sage-600">
                    {filterStatus === "all"
                      ? "Start tracking documents by using our contact finder to locate the resources you need."
                      : `No documents with status "${filterStatus
                          .replace(/_/g, " ")
                          .toLowerCase()}"`}
                  </p>
                  {filterStatus === "all" ? (
                    <Button
                      onClick={() => router.push("/resources")}
                      className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                    >
                      Find Documents
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setFilterStatus("all")}
                      className="rounded-full"
                    >
                      Clear Filter
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTrackingDocuments.map((document, index) => (
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
              <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-blue-900">
                  How Document Tracking Works
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>
                    • Use the Contact Finder to locate offices where you can get
                    documents
                  </li>
                  <li>
                    • Update the status as you request, receive, and upload
                    documents
                  </li>
                  <li>• We'll remind you about documents you're waiting on</li>
                  <li>
                    • Track multiple resources for the same document if needed
                  </li>
                  <li>
                    • Switch to the "Upload & Manage" tab when you're ready to
                    upload files
                  </li>
                </ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <RequestSiblingDocsDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        sessionId={sessionId}
        defaultName={requestDialogData?.siblingName}
        category={requestDialogData?.category}
      />
    </div>
  );
}

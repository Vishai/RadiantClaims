"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Heart,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
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
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentDashboard } from "@/components/documents/DocumentDashboard";
import { Progress } from "@/components/ui/progress";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal/documents");
    } else if (status === "authenticated") {
      loadUserSession();
    }
  }, [status, router]);

  const loadUserSession = async () => {
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
              firstClaim.claimType
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentRequirements = async (
    sessionId: string,
    claimType?: string
  ) => {
    try {
      // Fetch uploaded files
      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (!response.ok) return;

      const data = await response.json();
      const uploadedFiles = data.files || [];
      setUploadedCount(uploadedFiles.length);

      // Define required documents based on claim type
      const requirements: RequiredDocument[] = [];

      if (claimType === "DOWNWINDER") {
        requirements.push(
          {
            category: "IDENTITY",
            label: "Birth Certificate",
            description:
              "Your birth certificate (or death certificate if filing for deceased person)",
            uploaded: uploadedFiles.some((f: any) => f.category === "IDENTITY"),
            required: true,
            helpText: "Required to establish identity and eligibility",
          },
          {
            category: "IDENTITY",
            label: "Marriage/Name Change Certificates",
            description:
              "If your name has changed, provide marriage certificates or legal name change documents",
            uploaded:
              uploadedFiles.filter((f: any) => f.category === "IDENTITY")
                .length >= 2,
            required: false,
            helpText:
              "Only required if name has changed from birth certificate",
          },
          {
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
          },
          {
            category: "MEDICAL_RECORDS",
            label: "Medical Records Showing Cancer Diagnosis",
            description:
              "Pathology reports, biopsy results, hospital records, or doctor's notes confirming compensable disease",
            uploaded: uploadedFiles.some(
              (f: any) =>
                f.category === "MEDICAL_RECORDS" ||
                f.category === "PATHOLOGY_REPORT"
            ),
            required: true,
            helpText:
              "See RECA form pages 18-24 for specific documents accepted for each disease type",
          }
        );
      } else {
        // Generic requirements for other claim types
        requirements.push(
          {
            category: "IDENTITY",
            label: "Identification Documents",
            description:
              "Birth certificate, death certificate, marriage certificates as applicable",
            uploaded: uploadedFiles.some((f: any) => f.category === "IDENTITY"),
            required: true,
            helpText: "Required to establish identity and relationships",
          },
          {
            category: "MEDICAL_RECORDS",
            label: "Medical Records",
            description: "Medical documentation relevant to your claim type",
            uploaded: uploadedFiles.some(
              (f: any) => f.category === "MEDICAL_RECORDS"
            ),
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
  };

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
              onClick={() => router.push("/api/auth/signout")}
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-12">
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
            Upload and organize your claim documents
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="space-y-8 lg:col-span-2">
            {/* Upload Zone */}
            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload PDFs or images of your documents. Maximum file size:
                  10MB.
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
                    <span className="text-sage-700">Documents Uploaded</span>
                    <span className="font-medium text-sage-900">
                      {uploadedCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sage-700">Required Documents</span>
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
                <CardTitle className="text-base">Required Documents</CardTitle>
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
                    * = Required for your claim. Upload here for safekeeping and
                    organization. Final submission will be via mail according to
                    RECA requirements.
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
                  Use our Resource Directory to find government offices and
                  medical facilities where you can request documents.
                </p>
                <Button
                  onClick={() => router.push("/resources")}
                  variant="outline"
                  className="w-full rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                >
                  Browse Resources
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

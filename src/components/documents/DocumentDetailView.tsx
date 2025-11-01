"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./intelligence/OverviewTab";
import { EntitiesTab } from "./intelligence/EntitiesTab";
import { QualityTab } from "./intelligence/QualityTab";
import { ComplianceTab } from "./intelligence/ComplianceTab";
import { RisksTab } from "./intelligence/RisksTab";
import { ProvenanceTab } from "./intelligence/ProvenanceTab";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface DocumentDetailViewProps {
  document: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DocumentDetailView({ document }: DocumentDetailViewProps) {
  const router = useRouter();
  const [showPDF, setShowPDF] = useState(true);

  // Fetch intelligence data
  const { data: intelligence, error, isLoading } = useSWR(
    `/api/documents/${document.id}/intelligence`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleDownload = async () => {
    window.open(`/api/documents/${document.id}/download`, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/portal/documents");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return "Uncategorized";
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" }
    > = {
      READY: { label: "Ready", variant: "default" },
      PROCESSING: { label: "Processing", variant: "secondary" },
      PENDING: { label: "Pending Review", variant: "secondary" },
      APPROVED: { label: "Approved", variant: "default" },
      REJECTED: { label: "Rejected", variant: "destructive" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "secondary",
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderQualificationAlert = (qualification: any) => {
    if (!qualification) return null;

    const alertConfigs = {
      QUALIFIES: {
        variant: "default" as const,
        icon: CheckCircle2,
        bgColor: "bg-green-50 border-green-200",
        iconColor: "text-green-600",
        titleColor: "text-green-900",
      },
      DOES_NOT_QUALIFY: {
        variant: "destructive" as const,
        icon: XCircle,
        bgColor: "bg-red-50 border-red-200",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
      },
      NEEDS_VERIFICATION: {
        variant: "default" as const,
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 border-yellow-200",
        iconColor: "text-yellow-600",
        titleColor: "text-yellow-900",
      },
      UNKNOWN: {
        variant: "default" as const,
        icon: HelpCircle,
        bgColor: "bg-gray-50 border-gray-200",
        iconColor: "text-gray-600",
        titleColor: "text-gray-900",
      },
    };

    const config = alertConfigs[qualification.status as keyof typeof alertConfigs];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Alert className={`${config.bgColor} border-2`}>
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
        <AlertTitle className={config.titleColor}>
          {qualification.status === "QUALIFIES" && "Document Qualifies"}
          {qualification.status === "DOES_NOT_QUALIFY" && "Document Does Not Qualify"}
          {qualification.status === "NEEDS_VERIFICATION" && "Verification Needed"}
          {qualification.status === "UNKNOWN" && "Qualification Unknown"}
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">{qualification.reason}</p>

          {/* Category Mismatch Warning */}
          {qualification.categoryMismatch && (
            <div className="mt-3 rounded-md bg-white/50 p-3 border border-current/20">
              <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Category Mismatch Detected
              </p>
              <p className="text-xs mb-2">{qualification.categoryMismatch.explanation}</p>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Your Selection:</span>
                  <br />
                  {qualification.categoryMismatch.userSelected.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                </div>
                <div>
                  <span className="font-medium">AI Detected:</span>
                  <br />
                  {qualification.categoryMismatch.aiDetected.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  {' '}
                  ({Math.round(qualification.categoryMismatch.aiConfidence * 100)}%)
                </div>
              </div>
            </div>
          )}

          {qualification.matchedRequirement && (
            <p className="text-xs mt-2">
              <strong>Satisfies:</strong> {qualification.matchedRequirement.name}
            </p>
          )}
          {qualification.issues && qualification.issues.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs space-y-1">
              {qualification.issues.map((issue: string, idx: number) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-sage-50">
      {/* Header */}
      <div className="border-b border-sage-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/portal/documents")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-sage-900">
                  {document.originalFilename}
                </h1>
                <p className="mt-1 text-sm text-sage-600">
                  {formatFileSize(document.sizeBytes)} •{" "}
                  {formatDate(document.uploadedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-sage-300 bg-sage-50">
              {getCategoryLabel(document.category)}
            </Badge>
            {getStatusBadge(document.status)}
            {document.status === "READY" && intelligence && (
              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
                AI Analyzed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* PDF Viewer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-sage-900">Document</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPDF(!showPDF)}
              >
                {showPDF ? "Hide" : "Show"} PDF
              </Button>
            </div>

            {showPDF && (
              <div className="overflow-hidden rounded-lg border border-sage-200 bg-white shadow-sm">
                {document.mimeType === "application/pdf" ? (
                  <iframe
                    src={`/api/documents/${document.id}/view`}
                    className="h-[800px] w-full"
                    title={document.originalFilename}
                  />
                ) : (
                  <div className="flex h-[800px] flex-col items-center justify-center gap-4 text-sage-600">
                    <FileText className="h-16 w-16" />
                    <p>Preview not available for this file type</p>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Intelligence Panel */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-sage-900">
              AI Intelligence
            </h2>

            {/* Document Qualification Alert */}
            {intelligence?.compliance?.documentQualification && (
              <div className="mb-4">
                {renderQualificationAlert(intelligence.compliance.documentQualification)}
              </div>
            )}

            {isLoading && (
              <div className="space-y-3 rounded-lg border border-sage-200 bg-white p-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error loading intelligence data</AlertTitle>
                <AlertDescription>
                  Could not load AI analysis for this document. Please try again
                  later.
                </AlertDescription>
              </Alert>
            )}

            {intelligence && (
              <div className="rounded-lg border border-sage-200 bg-white shadow-sm">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 rounded-t-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="entities">Entities</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                    <TabsTrigger value="provenance">Info</TabsTrigger>
                  </TabsList>

                  <div className="max-h-[700px] overflow-y-auto p-6">
                    <TabsContent value="overview">
                      <OverviewTab data={intelligence} />
                    </TabsContent>

                    <TabsContent value="entities">
                      <EntitiesTab data={intelligence} />
                    </TabsContent>

                    <TabsContent value="quality">
                      <QualityTab data={intelligence} />
                    </TabsContent>

                    <TabsContent value="compliance">
                      <ComplianceTab data={intelligence} />
                    </TabsContent>

                    <TabsContent value="risks">
                      <RisksTab data={intelligence} />
                    </TabsContent>

                    <TabsContent value="provenance">
                      <ProvenanceTab data={intelligence} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}

            {!isLoading && !error && !intelligence && (
              <Alert>
                <AlertDescription>
                  No AI intelligence data available for this document yet.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

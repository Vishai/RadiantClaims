"use client";

import { useState, useEffect } from "react";
import type { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import useSWR from "swr";
import { SummaryTab } from "./intelligence/SummaryTab";
import { EntitiesTab } from "./intelligence/EntitiesTab";
import { ComplianceRisksTab } from "./intelligence/ComplianceRisksTab";
import { ProvenanceTab } from "./intelligence/ProvenanceTab";
import { AIAssessmentTab } from "./intelligence/AIAssessmentTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, Brain } from "lucide-react";
import { useSession } from "next-auth/react";

interface AIIntelligenceModalProps {
  documentId: string;
  documentMimeType?: string;
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 202) {
    const body = await res.json().catch(() => ({}));
    return { __processing: true, message: body.message };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || "Failed to fetch");
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
};

export function AIIntelligenceModal({
  documentId,
  documentMimeType,
  isOpen,
  onClose,
}: AIIntelligenceModalProps) {
  const { data: session } = useSession();
  const [pollInterval, setPollInterval] = useState(0);

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<any>(
    isOpen ? `/api/documents/${documentId}/intelligence` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: pollInterval,
    }
  );

  const isProcessing = rawData?.__processing === true;
  const data: IntelligenceResponse | undefined =
    rawData && !rawData.__processing ? rawData : undefined;

  // Toggle polling based on processing state
  useEffect(() => {
    setPollInterval(isProcessing ? 3000 : 0);
  }, [isProcessing]);

  // Also fetch document metadata for provenance tab
  const { data: docData } = useSWR<{ file: any }>(
    isOpen ? `/api/documents/${documentId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Adaptive tab logic
  const hasEntities =
    data?.entities &&
    (data.entities.persons?.length > 0 ||
      data.entities.dates?.length > 0 ||
      data.entities.addresses?.length > 0 ||
      data.entities.medical?.length > 0 ||
      data.entities.employment?.length > 0);

  const hasComplianceOrRisks =
    Boolean(data?.compliance) || Boolean(data?.risks);

  const tabCount =
    1 + // Summary
    1 + // AI Assessment
    (hasEntities ? 1 : 0) +
    (hasComplianceOrRisks ? 1 : 0) +
    1; // Details

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Intelligence Analysis
          </DialogTitle>
          <DialogDescription>
            Comprehensive AI-powered analysis of this document
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {!isLoading && isProcessing && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-sage-200 border-t-sage-600" />
              <div>
                <h3 className="text-lg font-semibold">Analyzing Document</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rawData?.message ||
                    "AI is extracting text and analyzing the document..."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Auto-refreshing...
              </div>
            </div>
          )}

          {error && !isProcessing && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.message ||
                  "Failed to load intelligence data. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <Tabs defaultValue="summary" className="flex h-full flex-col">
              <TabsList
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))`,
                }}
              >
                <TabsTrigger value="summary" className="text-xs sm:text-sm">
                  <Sparkles className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Summary</span>
                  <span className="sm:hidden">Sum</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-assessment"
                  className="text-xs sm:text-sm"
                >
                  <Brain className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">AI Assessment</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                {hasEntities && (
                  <TabsTrigger value="entities" className="text-xs sm:text-sm">
                    Extracted Data
                  </TabsTrigger>
                )}
                {hasComplianceOrRisks && (
                  <TabsTrigger
                    value="compliance-risks"
                    className="text-xs sm:text-sm"
                  >
                    Compliance & Risks
                  </TabsTrigger>
                )}
                <TabsTrigger value="details" className="text-xs sm:text-sm">
                  Details
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-1">
                <TabsContent value="summary" className="mt-0">
                  <SummaryTab data={data} mimeType={documentMimeType} />
                </TabsContent>

                <TabsContent value="ai-assessment" className="mt-0">
                  <AIAssessmentTab data={data} documentId={documentId} />
                </TabsContent>

                {hasEntities && (
                  <TabsContent value="entities" className="mt-0">
                    <EntitiesTab data={data} />
                  </TabsContent>
                )}

                {hasComplianceOrRisks && (
                  <TabsContent value="compliance-risks" className="mt-0">
                    <ComplianceRisksTab
                      data={data}
                      documentId={documentId}
                      userRole={session?.user?.role}
                      onRefresh={mutate}
                    />
                  </TabsContent>
                )}

                <TabsContent value="details" className="mt-0">
                  <ProvenanceTab
                    data={data}
                    documentData={
                      docData?.file
                        ? {
                            id: docData.file.id,
                            originalFilename: docData.file.originalFilename,
                            fileSize: docData.file.fileSize,
                            uploadedAt: docData.file.createdAt,
                            status: docData.file.status,
                          }
                        : undefined
                    }
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

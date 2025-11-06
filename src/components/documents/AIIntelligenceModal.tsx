"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  User,
  Image as ImageIcon,
  Shield,
  AlertTriangle,
  FileText,
} from "lucide-react";
import useSWR from "swr";
import { OverviewTab } from "./intelligence/OverviewTab";
import { EntitiesTab } from "./intelligence/EntitiesTab";
import { QualityTab } from "./intelligence/QualityTab";
import { ComplianceTab } from "./intelligence/ComplianceTab";
import { RisksTab } from "./intelligence/RisksTab";
import { ProvenanceTab } from "./intelligence/ProvenanceTab";
import { AIAssessmentTab } from "./intelligence/AIAssessmentTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, Brain } from "lucide-react";
import { useSession } from "next-auth/react";

interface AIIntelligenceModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AIIntelligenceModal({
  documentId,
  isOpen,
  onClose,
}: AIIntelligenceModalProps) {
  const { data: session } = useSession();

  const { data, error, isLoading, mutate } = useSWR<IntelligenceResponse>(
    isOpen ? `/api/documents/${documentId}/intelligence` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Also fetch document metadata for provenance tab
  const { data: docData } = useSWR<{ file: any }>(
    isOpen ? `/api/documents/${documentId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

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

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.error ||
                  "Failed to load intelligence data. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <Tabs defaultValue="overview" className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-7 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  <Sparkles className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-assessment"
                  className="text-xs sm:text-sm"
                >
                  <Brain className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">AI Assessment</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="entities" className="text-xs sm:text-sm">
                  <User className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Entities</span>
                  <span className="sm:hidden">Data</span>
                </TabsTrigger>
                <TabsTrigger value="quality" className="text-xs sm:text-sm">
                  <ImageIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Quality</span>
                  <span className="sm:hidden">Qual</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs sm:text-sm">
                  <Shield className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Compliance</span>
                  <span className="sm:hidden">Comp</span>
                </TabsTrigger>
                <TabsTrigger value="risks" className="text-xs sm:text-sm">
                  <AlertTriangle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Risks
                </TabsTrigger>
                <TabsTrigger value="provenance" className="text-xs sm:text-sm">
                  <FileText className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Provenance</span>
                  <span className="sm:hidden">Prov</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-1">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab data={data} />
                </TabsContent>

                <TabsContent value="ai-assessment" className="mt-0">
                  <AIAssessmentTab data={data} documentId={documentId} />
                </TabsContent>

                <TabsContent value="entities" className="mt-0">
                  <EntitiesTab data={data} />
                </TabsContent>

                <TabsContent value="quality" className="mt-0">
                  <QualityTab data={data} />
                </TabsContent>

                <TabsContent value="compliance" className="mt-0">
                  <ComplianceTab data={data} />
                </TabsContent>

                <TabsContent value="risks" className="mt-0">
                  <RisksTab
                    data={data}
                    documentId={documentId}
                    userRole={session?.user?.role}
                    onRefresh={mutate}
                  />
                </TabsContent>

                <TabsContent value="provenance" className="mt-0">
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

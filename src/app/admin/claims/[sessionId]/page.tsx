"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import AdminSessionOverview from "@/components/admin/AdminSessionOverview";
import AdminFormDataEditor from "@/components/admin/AdminFormDataEditor";
import AdminSessionAuditLog from "@/components/admin/AdminSessionAuditLog";

export default function AdminSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession, status } = useSession();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/sessions/${sessionId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load session");
      }

      setSessionData(data.session);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (status === "loading") return;
    if (!authSession?.user || (authSession.user as any).role !== "ADMIN") {
      router.push("/portal");
      return;
    }
    fetchSession();
  }, [status, authSession, router, fetchSession]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/claims")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Claims
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">Error loading session</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!sessionData) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/claims")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-sage-900">
              Application Detail
            </h1>
            <p className="font-mono text-sm text-sage-500">{sessionId}</p>
          </div>
        </div>
        {sessionData.claimant && (
          <div className="text-right">
            <p className="font-medium text-sage-900">
              {sessionData.claimant.firstName} {sessionData.claimant.lastName}
            </p>
            <p className="text-sm text-sage-500">
              {sessionData.claimant.email}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="form-data">Form Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="audit-log">
            Audit Log
            {sessionData.staffActions?.length > 0 && (
              <span className="ml-1.5 rounded-full bg-sage-200 px-1.5 py-0.5 text-xs text-sage-700">
                {sessionData.staffActions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <AdminSessionOverview session={sessionData} />
        </TabsContent>

        <TabsContent value="form-data" className="mt-4">
          <AdminFormDataEditor
            sessionId={sessionId}
            formData={sessionData.recaFormData || {}}
            supportingForms={sessionData.recaSupportingForms || {}}
            onDataUpdated={fetchSession}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-3">
            {sessionData.uploadedFiles?.length > 0 ? (
              sessionData.uploadedFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-sage-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-sage-900">
                      {file.originalFilename}
                    </p>
                    <p className="text-xs text-sage-500">
                      {file.category?.replace(/_/g, " ")} &middot;{" "}
                      {file.sizeBytes
                        ? `${(file.sizeBytes / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      file.status === "READY" || file.status === "VALIDATED"
                        ? "bg-green-100 text-green-700"
                        : file.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sage-500">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit-log" className="mt-4">
          <AdminSessionAuditLog staffActions={sessionData.staffActions || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

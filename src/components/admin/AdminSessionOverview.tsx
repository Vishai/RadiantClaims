"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Mail, Phone, FileText, Package } from "lucide-react";
import { formatISODateForDisplay } from "@/lib/date-utils";

interface AdminSessionOverviewProps {
  session: any;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    READY_FOR_REVIEW: "bg-amber-100 text-amber-800",
    UNDER_REVIEW: "bg-purple-100 text-purple-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    SUBMITTED: "bg-emerald-100 text-emerald-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export default function AdminSessionOverview({
  session,
}: AdminSessionOverviewProps) {
  const claimant = session.claimant;
  const packet = session.packetSubmission;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Session Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-terracotta-500" />
            Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sage-600">Session ID</span>
            <span className="font-mono text-xs">{session.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sage-600">Status</span>
            <Badge className={getStatusColor(session.status)}>
              {session.status?.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Completion</span>
            <span>{session.recaCompletionPercent || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Workflow Stage</span>
            <span>{session.recaWorkflowStage || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Current Section</span>
            <span>{session.recaWorkflowSection || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Created</span>
            <span>{formatDate(session.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Last Activity</span>
            <span>{formatDate(session.lastActivityAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">PDF Generated</span>
            <span>{session.recaFormPdfGenerated ? "Yes" : "No"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Claimant Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-terracotta-500" />
            Claimant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {claimant ? (
            <>
              <div className="flex justify-between">
                <span className="text-sage-600">Name</span>
                <span>
                  {claimant.firstName} {claimant.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-sage-600">
                  <Mail className="h-3 w-3" /> Email
                </span>
                <span className="max-w-[200px] truncate">{claimant.email}</span>
              </div>
              {claimant.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sage-600">
                    <Phone className="h-3 w-3" /> Phone
                  </span>
                  <span>{claimant.phone}</span>
                </div>
              )}
              {claimant.dob && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sage-600">
                    <Calendar className="h-3 w-3" /> DOB
                  </span>
                  <span>{formatISODateForDisplay(claimant.dob)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sage-600">Claim Type</span>
                <span>{claimant.claimType?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-600">Relationship</span>
                <span>
                  {claimant.relationshipToClaimant?.replace(/_/g, " ") || "N/A"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sage-500">No claimant linked to this session.</p>
          )}
        </CardContent>
      </Card>

      {/* Packet Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-terracotta-500" />
            Packet Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {packet ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sage-600">Status</span>
                <Badge
                  className={
                    packet.status === "READY"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {packet.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-600">Version</span>
                <span>v{packet.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-600">Files</span>
                <span>{packet.fileCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-600">Generated</span>
                <span>{formatDate(packet.readyAt || packet.generatedAt)}</span>
              </div>
            </>
          ) : (
            <p className="text-sage-500">No packet generated yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Documents Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-terracotta-500" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sage-600">Total Uploaded</span>
            <span>{session.uploadedFiles?.length || 0}</span>
          </div>
          {session.uploadedFiles?.length > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-sage-600">Ready</span>
                <span>
                  {
                    session.uploadedFiles.filter(
                      (f: any) =>
                        f.status === "READY" || f.status === "VALIDATED"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-600">Processing</span>
                <span>
                  {
                    session.uploadedFiles.filter(
                      (f: any) =>
                        f.status === "PROCESSING" || f.status === "UPLOADING"
                    ).length
                  }
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

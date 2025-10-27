"use client";

import Link from "next/link";
import { ClaimantWorkflowStatus, ClaimType } from "@prisma/client";
import { WorkflowStatusBadge, getWorkflowProgress } from "./workflow-status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  FileText,
  Calendar,
  Eye,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClaimantCardProps {
  claimant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
    county: string;
    createdAt: string;
    updatedAt: string;
    workflowStatus: ClaimantWorkflowStatus;
    assignedAt?: string;
    documentCount: number;
    hasCompletedIntake: boolean;
    claimType?: ClaimType | null;
    isPremiumService: boolean;
  };
}

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  PANCREATIC_CANCER: "Pancreatic Cancer",
  THYROID_CANCER: "Thyroid Cancer",
  KIDNEY_CANCER: "Kidney Cancer",
  LUNG_CANCER: "Lung Cancer",
  BRAIN_CANCER: "Brain Cancer",
  OTHER_CANCER: "Other Cancer",
  NON_CANCER: "Non-Cancer",
};

export function ClaimantCard({ claimant }: ClaimantCardProps) {
  const progress = getWorkflowProgress(claimant.workflowStatus);
  const needsAttention =
    claimant.workflowStatus === "READY_FOR_ATTORNEY" ||
    claimant.workflowStatus === "REVISION_REQUESTED";

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        needsAttention ? "border-l-4 border-l-purple-500" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
              <User className="h-6 w-6 text-sage-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-sage-900">
                {claimant.firstName} {claimant.lastName}
              </h3>
              <p className="text-sm text-sage-600">{claimant.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <WorkflowStatusBadge status={claimant.workflowStatus} size="sm" />
            {claimant.isPremiumService && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <DollarSign className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-sage-600">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sage-100">
            <div
              className={`h-full rounded-full transition-all ${
                needsAttention
                  ? "bg-purple-500"
                  : progress === 100
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-sage-700">
            <MapPin className="h-4 w-4 text-sage-500" />
            <span>
              {claimant.county}, {claimant.state}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sage-700">
            <FileText className="h-4 w-4 text-sage-500" />
            <span>{claimant.documentCount} documents</span>
          </div>
          {claimant.claimType && (
            <div className="col-span-2 flex items-center gap-2 text-sage-700">
              <AlertCircle className="h-4 w-4 text-sage-500" />
              <span>{CLAIM_TYPE_LABELS[claimant.claimType]}</span>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-2 text-xs text-sage-600">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Updated {formatDistanceToNow(new Date(claimant.updatedAt))} ago
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Link href={`/attorney/claimants/${claimant.id}` as any} className="flex-1">
            <Button
              variant={needsAttention ? "default" : "outline"}
              className={`w-full ${
                needsAttention
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "border-sage-300"
              }`}
            >
              <Eye className="mr-2 h-4 w-4" />
              {needsAttention ? "Review Now" : "View Details"}
            </Button>
          </Link>
          {!claimant.hasCompletedIntake && (
            <Button variant="ghost" size="sm" disabled title="Intake incomplete">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { ClaimantWorkflowStatus, ClaimType } from "@prisma/client";
import {
  WorkflowStatusBadge,
  getWorkflowProgress,
} from "./workflow-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  DollarSign,
  Download,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface ClaimantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  DOWNWINDER: "Downwinder",
  URANIUM_WORKER: "Uranium Worker",
  MANHATTAN_PROJECT_WASTE: "Manhattan Project Waste",
  ONSITE_PARTICIPANT: "Onsite Participant",
};

export function ClaimantDetailModal({
  open,
  onOpenChange,
  claimant,
}: ClaimantDetailModalProps) {
  const router = useRouter();
  const progress = getWorkflowProgress(claimant.workflowStatus);
  const needsAttention =
    claimant.workflowStatus === "READY_FOR_ATTORNEY" ||
    claimant.workflowStatus === "REVISION_REQUESTED";

  function handleViewPacket() {
    router.push(`/attorney/claimants/${claimant.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
              <User className="h-6 w-6 text-sage-600" />
            </div>
            <div>
              <div className="text-xl font-semibold text-sage-900">
                {claimant.firstName} {claimant.lastName}
              </div>
              <div className="text-sm font-normal text-sage-600">
                Claimant ID: {claimant.id.slice(0, 8)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <WorkflowStatusBadge status={claimant.workflowStatus} />
              {claimant.isPremiumService && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                  <DollarSign className="h-4 w-4" />
                  Premium Service
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-sage-600">
                <span>Completion Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-sage-100">
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
          </div>

          {/* Contact Information */}
          <div className="space-y-3 rounded-lg border border-sage-200 bg-sage-50 p-4">
            <h3 className="font-semibold text-sage-900">Contact Information</h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sage-500" />
                <a
                  href={`mailto:${claimant.email}`}
                  className="text-sage-700 hover:text-sage-900"
                >
                  {claimant.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sage-500" />
                <a
                  href={`tel:${claimant.phone}`}
                  className="text-sage-700 hover:text-sage-900"
                >
                  {claimant.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sage-500" />
                <span className="text-sage-700">
                  {claimant.county}, {claimant.state}
                </span>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div className="space-y-3 rounded-lg border border-sage-200 bg-white p-4">
            <h3 className="font-semibold text-sage-900">Claim Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {claimant.claimType && (
                <div>
                  <div className="text-xs uppercase text-sage-500">
                    Claim Type
                  </div>
                  <div className="font-medium text-sage-900">
                    {CLAIM_TYPE_LABELS[claimant.claimType]}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase text-sage-500">Documents</div>
                <div className="flex items-center gap-1 font-medium text-sage-900">
                  <FileText className="h-4 w-4" />
                  {claimant.documentCount} uploaded
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-sage-500">Assigned</div>
                <div className="font-medium text-sage-900">
                  {claimant.assignedAt
                    ? formatDistanceToNow(new Date(claimant.assignedAt), {
                        addSuffix: true,
                      })
                    : "Recently"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-sage-500">
                  Last Updated
                </div>
                <div className="font-medium text-sage-900">
                  {formatDistanceToNow(new Date(claimant.updatedAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            {needsAttention && (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleViewPacket}
              >
                <Eye className="mr-2 h-4 w-4" />
                Review Documents Now
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="border-sage-300">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Button
                variant="outline"
                className="border-sage-300"
                onClick={handleViewPacket}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Packet
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Request Revision
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

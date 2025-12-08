"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Building,
  Search,
  ThumbsUp,
  Ban,
  DollarSign,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DOJStatusTrackerProps {
  claimantId: string;
  showDetailedTimeline?: boolean;
}

interface ClaimLifecycle {
  id: string;
  claimantId: string;
  currentMilestone: string;
  currentMilestoneDate: string;
  dojClaimNumber: string | null;
  submittedToRadiantAt: string | null;
  submittedToDOJAt: string | null;
  receivedByDOJAt: string | null;
  completenessReviewAt: string | null;
  eligibilityReviewAt: string | null;
  approvedAt: string | null;
  deniedAt: string | null;
  paymentIssuedAt: string | null;
  paymentReceivedAt: string | null;
  daysInCurrentMilestone: number;
  totalProcessingDays: number;
  expectedCompletionDate: string | null;
}

const MILESTONE_INFO = {
  NOT_SUBMITTED: {
    label: "Not Submitted",
    icon: Circle,
    color: "gray",
    description: "Claim packet not yet submitted to DOJ",
  },
  SUBMITTED_TO_DOJ: {
    label: "Mailed to DOJ",
    icon: Package,
    color: "blue",
    description: "Claim packet has been mailed to the Department of Justice",
  },
  RECEIVED_BY_DOJ: {
    label: "Received by DOJ",
    icon: Building,
    color: "blue",
    description: "DOJ has logged receipt of your claim packet",
  },
  COMPLETENESS_REVIEW: {
    label: "Completeness Review",
    icon: FileText,
    color: "purple",
    description: "DOJ is reviewing if all required documents are included",
  },
  ELIGIBILITY_REVIEW: {
    label: "Eligibility Review",
    icon: Search,
    color: "purple",
    description: "DOJ is reviewing eligibility criteria and evidence",
  },
  APPROVED: {
    label: "Approved",
    icon: ThumbsUp,
    color: "green",
    description: "Your claim has been approved for payment",
  },
  DENIED: {
    label: "Denied",
    icon: Ban,
    color: "red",
    description: "Claim was denied (may be eligible for resubmission)",
  },
  PAYMENT_PROCESSING: {
    label: "Payment Processing",
    icon: DollarSign,
    color: "green",
    description: "Treasury is processing your payment",
  },
  PAYMENT_ISSUED: {
    label: "Payment Issued",
    icon: CheckCircle,
    color: "green",
    description: "Payment has been issued by the Treasury",
  },
  PAYMENT_RECEIVED: {
    label: "Payment Received",
    icon: CheckCircle,
    color: "green",
    description: "Claimant confirmed receipt of payment",
  },
};

export function DOJStatusTracker({
  claimantId,
  showDetailedTimeline = true,
}: DOJStatusTrackerProps) {
  const [lifecycle, setLifecycle] = useState<ClaimLifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLifecycle();
  }, [claimantId]);

  const loadLifecycle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/claims/${claimantId}/doj-claim-number`
      );

      if (!response.ok) {
        throw new Error("Failed to load claim status");
      }

      const data = await response.json();
      // For now, we'll construct a basic lifecycle from the data
      // In the future, you might want a dedicated endpoint for full lifecycle
      setLifecycle({
        id: "temp",
        claimantId: data.claimantId,
        currentMilestone: data.currentMilestone || "NOT_SUBMITTED",
        currentMilestoneDate: new Date().toISOString(),
        dojClaimNumber: data.dojClaimNumber,
        submittedToRadiantAt: null,
        submittedToDOJAt: data.submittedToDOJAt,
        receivedByDOJAt: data.receivedByDOJAt,
        completenessReviewAt: null,
        eligibilityReviewAt: null,
        approvedAt: null,
        deniedAt: null,
        paymentIssuedAt: null,
        paymentReceivedAt: null,
        daysInCurrentMilestone: 0,
        totalProcessingDays: 0,
        expectedCompletionDate: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-2 border-cream-200 bg-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!lifecycle) {
    return null;
  }

  const currentMilestoneInfo =
    MILESTONE_INFO[lifecycle.currentMilestone as keyof typeof MILESTONE_INFO] ||
    MILESTONE_INFO.NOT_SUBMITTED;
  const Icon = currentMilestoneInfo.icon;

  return (
    <Card className="rounded-3xl border-2 border-cream-200 bg-white">
      <CardHeader>
        <CardTitle className="text-sage-900">Claim Status</CardTitle>
        <CardDescription className="text-sage-600">
          Track your claim's progress through the DOJ system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-full p-3 ${
                currentMilestoneInfo.color === "green"
                  ? "bg-green-100"
                  : currentMilestoneInfo.color === "blue"
                    ? "bg-blue-100"
                    : currentMilestoneInfo.color === "purple"
                      ? "bg-purple-100"
                      : currentMilestoneInfo.color === "red"
                        ? "bg-red-100"
                        : "bg-gray-100"
              }`}
            >
              <Icon
                className={`h-6 w-6 ${
                  currentMilestoneInfo.color === "green"
                    ? "text-green-600"
                    : currentMilestoneInfo.color === "blue"
                      ? "text-blue-600"
                      : currentMilestoneInfo.color === "purple"
                        ? "text-purple-600"
                        : currentMilestoneInfo.color === "red"
                          ? "text-red-600"
                          : "text-gray-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-sage-900">
                  {currentMilestoneInfo.label}
                </h3>
                <Badge
                  variant="outline"
                  className={`${
                    currentMilestoneInfo.color === "green"
                      ? "border-green-300 bg-green-50 text-green-700"
                      : currentMilestoneInfo.color === "blue"
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : currentMilestoneInfo.color === "purple"
                          ? "border-purple-300 bg-purple-50 text-purple-700"
                          : currentMilestoneInfo.color === "red"
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                >
                  Current Status
                </Badge>
              </div>
              <p className="mt-2 text-sm text-sage-700">
                {currentMilestoneInfo.description}
              </p>
              {lifecycle.dojClaimNumber && (
                <div className="mt-3 rounded border border-sage-200 bg-white p-2">
                  <p className="text-xs text-sage-600">DOJ Claim Number</p>
                  <p className="font-mono font-semibold text-sage-900">
                    {lifecycle.dojClaimNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {showDetailedTimeline && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sage-900">Claim Timeline</h4>

            <div className="relative space-y-6 border-l-2 border-cream-300 pl-6">
              {/* Submitted to DOJ */}
              {lifecycle.submittedToDOJAt && (
                <div className="relative">
                  <div className="absolute -left-[29px] rounded-full bg-green-100 p-1.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-900">
                      Mailed to DOJ
                    </p>
                    <p className="text-xs text-sage-600">
                      {new Date(lifecycle.submittedToDOJAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Received by DOJ */}
              {lifecycle.receivedByDOJAt && (
                <div className="relative">
                  <div className="absolute -left-[29px] rounded-full bg-green-100 p-1.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-900">
                      Received by DOJ
                    </p>
                    <p className="text-xs text-sage-600">
                      {new Date(lifecycle.receivedByDOJAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Future milestones (placeholders) */}
              {lifecycle.currentMilestone !== "NOT_SUBMITTED" && (
                <>
                  <div className="relative">
                    <div className="absolute -left-[29px] rounded-full bg-gray-200 p-1.5">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Completeness Review
                      </p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] rounded-full bg-gray-200 p-1.5">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Eligibility Review
                      </p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] rounded-full bg-gray-200 p-1.5">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Approval & Payment
                      </p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Help Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Need to check your status with the DOJ?
          </p>
          <p className="mt-1 text-sm text-blue-800">
            You can contact the DOJ RECA program at{" "}
            <a
              href="tel:1-800-729-7327"
              className="font-semibold underline hover:text-blue-900"
            >
              1-800-729-7327
            </a>{" "}
            with your claim number.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

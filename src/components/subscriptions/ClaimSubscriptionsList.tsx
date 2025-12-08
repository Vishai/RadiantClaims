"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import { ClaimSubscriptionDialog } from "./ClaimSubscriptionDialog";
import { ClaimCancellationDialog } from "./ClaimCancellationDialog";

interface ClaimSubscription {
  id: string;
  claimantId: string;
  claimOrder: number;
  setupFeePaid: boolean;
  setupFeeAmount: number;
  setupFeeRefunded: boolean;
  monthlyFeeAmount: number;
  status: "ACTIVE" | "PENDING" | "CANCELLED" | "PAST_DUE";
  startedAt: string;
  canceledAt?: string | null;
  claimant: {
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
}

interface ClaimWithoutSubscription {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  userId: string;
}

interface ClaimSubscriptionsListProps {
  serviceSubscriptionId: string;
  tier: "DIY_PREP" | "LEGAL_REP";
}

/**
 * Shows all claims with their subscription status
 * Allows subscribing to new claims and cancelling existing ones
 */
export function ClaimSubscriptionsList({
  serviceSubscriptionId,
}: ClaimSubscriptionsListProps) {
  const [claimSubscriptions, setClaimSubscriptions] = useState<
    ClaimSubscription[]
  >([]);
  const [unsubscribedClaims, setUnsubscribedClaims] = useState<
    ClaimWithoutSubscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedClaimant, setSelectedClaimant] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedClaimSubscription, setSelectedClaimSubscription] = useState<{
    id: string;
    claimantName: string;
  } | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/${serviceSubscriptionId}/claims`
      );

      if (!response.ok) {
        throw new Error("Failed to load claim subscriptions");
      }

      const data = await response.json();
      setClaimSubscriptions(data.claimSubscriptions || []);
      setUnsubscribedClaims(data.unsubscribedClaims || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscriptions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [serviceSubscriptionId]);

  const handleSubscribeClick = (claimantId: string, name: string) => {
    setSelectedClaimant({ id: claimantId, name });
    setSubscribeDialogOpen(true);
  };

  const handleCancelClick = (
    claimSubscriptionId: string,
    claimantName: string
  ) => {
    setSelectedClaimSubscription({ id: claimSubscriptionId, claimantName });
    setCancelDialogOpen(true);
  };

  const handleSubscribeSuccess = () => {
    loadSubscriptions();
  };

  const handleCancelSuccess = () => {
    loadSubscriptions();
  };

  const getStatusBadge = (status: string, setupFeePaid: boolean) => {
    if (status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      );
    }

    if (status === "PAST_DUE") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <AlertCircle className="h-3 w-3" />
          Past Due
        </span>
      );
    }

    if (!setupFeePaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" />
          Pending Payment
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  };

  const calculateTotalMonthly = () => {
    return claimSubscriptions
      .filter((cs) => cs.status === "ACTIVE" && cs.setupFeePaid)
      .reduce((sum, cs) => sum + cs.monthlyFeeAmount, 0);
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
        <p className="mt-2 text-sm text-sage-600">
          Loading claim subscriptions...
        </p>
      </div>
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

  const totalMonthly = calculateTotalMonthly();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {claimSubscriptions.length > 0 && (
        <Card className="border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-cream-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-terracotta-900">
              <DollarSign className="h-5 w-5" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-terracotta-900">
              ${totalMonthly.toFixed(2)}
              <span className="text-lg font-normal text-terracotta-600">
                /mo
              </span>
            </div>
            <p className="mt-2 text-sm text-terracotta-700">
              {claimSubscriptions.filter((cs) => cs.status === "ACTIVE").length}{" "}
              active claim
              {claimSubscriptions.filter((cs) => cs.status === "ACTIVE")
                .length !== 1
                ? "s"
                : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Subscriptions */}
      {claimSubscriptions.length > 0 && (
        <Card className="rounded-3xl border-2 border-cream-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sage-900">
              Active Claim Subscriptions
            </CardTitle>
            <CardDescription className="text-sage-600">
              Manage your per-claim subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {claimSubscriptions.map((cs) => (
              <div
                key={cs.id}
                className="flex items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-700">
                      {cs.claimOrder}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sage-900">
                        {cs.claimant.firstName} {cs.claimant.lastName}
                      </h3>
                      <p className="text-xs text-sage-600">
                        Claim Order {cs.claimOrder} •{" "}
                        {new Date(cs.claimant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-sage-600">Setup:</span>{" "}
                      <span className="font-semibold text-sage-900">
                        ${cs.setupFeeAmount.toFixed(2)}
                      </span>
                      {cs.setupFeePaid ? (
                        <span className="ml-1 text-xs text-green-600">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="ml-1 text-xs text-amber-600">
                          Pending
                        </span>
                      )}
                      {cs.setupFeeRefunded && (
                        <span className="ml-1 text-xs text-blue-600">
                          Refunded
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-sage-600">Monthly:</span>{" "}
                      <span className="font-semibold text-sage-900">
                        ${cs.monthlyFeeAmount.toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(cs.status, cs.setupFeePaid)}
                  {cs.status === "ACTIVE" && cs.setupFeePaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCancelClick(
                          cs.id,
                          `${cs.claimant.firstName} ${cs.claimant.lastName}`
                        )
                      }
                      className="rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unsubscribed Claims */}
      {unsubscribedClaims.length > 0 && (
        <Card className="rounded-3xl border-2 border-amber-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Claims Without Subscription
            </CardTitle>
            <CardDescription className="text-sage-600">
              These claims need to be subscribed to activate services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unsubscribedClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <div>
                  <h3 className="font-semibold text-sage-900">
                    {claim.firstName} {claim.lastName}
                  </h3>
                  <p className="text-xs text-sage-600">
                    Created {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    handleSubscribeClick(
                      claim.id,
                      `${claim.firstName} ${claim.lastName}`
                    )
                  }
                  className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {claimSubscriptions.length === 0 && unsubscribedClaims.length === 0 && (
        <Card className="rounded-3xl border-2 border-cream-200 bg-white">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-sage-300" />
            <h3 className="mt-4 text-xl font-semibold text-sage-900">
              No claims found
            </h3>
            <p className="mt-2 text-sage-600">
              Start by filing a new claim to activate your subscription
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedClaimant && (
        <ClaimSubscriptionDialog
          open={subscribeDialogOpen}
          onOpenChange={setSubscribeDialogOpen}
          claimantId={selectedClaimant.id}
          claimantName={selectedClaimant.name}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {selectedClaimSubscription && (
        <ClaimCancellationDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          claimSubscriptionId={selectedClaimSubscription.id}
          claimantName={selectedClaimSubscription.claimantName}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

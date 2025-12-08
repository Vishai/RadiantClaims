"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CancellationPreview {
  currentClaim: {
    claimId: string;
    claimName: string;
    claimOrder: number;
    monthlyFee: number;
  };
  impact: {
    currentMonthlyTotal: number;
    newMonthlyTotal: number;
    monthlySavings: number;
    affectedClaims: Array<{
      claimId: string;
      claimName: string;
      currentOrder: number;
      newOrder: number;
      currentMonthlyFee: number;
      newMonthlyFee: number;
      feeChange: number;
    }>;
  };
  remainingClaimsCount: number;
  canCancel: boolean;
  warnings: string[];
}

interface ClaimCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimSubscriptionId: string;
  claimantName: string;
  onSuccess?: () => void;
}

/**
 * Dialog for cancelling a claim subscription with impact preview
 */
export function ClaimCancellationDialog({
  open,
  onOpenChange,
  claimSubscriptionId,
  claimantName,
  onSuccess,
}: ClaimCancellationDialogProps) {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load cancellation preview
  useEffect(() => {
    async function loadPreview() {
      if (!open) return;

      try {
        setLoading(true);
        setError(null);

        // Get claimantId from claimSubscription
        const claimSubRes = await fetch(
          `/api/subscriptions/claim/${claimSubscriptionId}`
        );
        if (!claimSubRes.ok)
          throw new Error("Failed to load claim subscription");

        const claimSub = await claimSubRes.json();
        const claimantId = claimSub.claimantId;

        // Get cancellation preview
        const response = await fetch(
          `/api/claims/${claimantId}/cancel-subscription`
        );

        if (!response.ok) {
          throw new Error("Failed to load cancellation preview");
        }

        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load cancellation preview"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreview();
  }, [open, claimSubscriptionId]);

  const handleCancel = async () => {
    if (!preview) return;

    try {
      setCancelling(true);
      setError(null);

      const response = await fetch(
        `/api/claims/${preview.currentClaim.claimId}/cancel-subscription`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setCancelling(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg border-2 border-cream-200 bg-white sm:rounded-3xl">
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="mt-4 text-2xl font-bold text-sage-900">
              Claim Cancelled
            </h2>
            <p className="mt-2 text-sage-600">
              Your subscription has been updated successfully
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-2 border-cream-200 bg-white sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-sage-900">
            Cancel Claim Subscription
          </DialogTitle>
          <DialogDescription className="text-sage-600">
            Review the impact before cancelling {claimantName}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sage-600" />
            <p className="mt-2 text-sm text-sage-600">Calculating impact...</p>
          </div>
        )}

        {error && !preview && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {preview && (
          <div className="space-y-6">
            {/* Current Claim Info */}
            <Card className="border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg text-red-900">
                  Claim to Cancel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Name:</span>
                  <span className="font-semibold text-red-900">
                    {preview.currentClaim.claimName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Current Order:</span>
                  <span className="font-semibold text-red-900">
                    Claim {preview.currentClaim.claimOrder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Monthly Fee:</span>
                  <span className="font-semibold text-red-900">
                    ${preview.currentClaim.monthlyFee.toFixed(2)}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Impact Summary */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">
                  Financial Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    Current Monthly Total:
                  </span>
                  <span className="text-xl font-bold text-blue-900">
                    ${preview.impact.currentMonthlyTotal.toFixed(2)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    New Monthly Total:
                  </span>
                  <span className="text-xl font-bold text-blue-900">
                    ${preview.impact.newMonthlyTotal.toFixed(2)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-blue-300 pt-2">
                  <span className="text-sm font-semibold text-green-700">
                    Monthly Savings:
                  </span>
                  <span className="flex items-center gap-1 text-xl font-bold text-green-700">
                    <TrendingDown className="h-5 w-5" />$
                    {preview.impact.monthlySavings.toFixed(2)}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Affected Claims */}
            {preview.impact.affectedClaims.length > 0 && (
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    Claims Affected by Reordering
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    These claims will be reordered and their monthly fees will
                    change
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {preview.impact.affectedClaims.map((claim) => (
                    <div
                      key={claim.claimId}
                      className="rounded-lg border border-amber-300 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sage-900">
                            {claim.claimName}
                          </p>
                          <p className="text-xs text-sage-600">
                            Order {claim.currentOrder} → {claim.newOrder}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sage-900">
                            ${claim.currentMonthlyFee.toFixed(2)} →{" "}
                            <span
                              className={
                                claim.feeChange > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              ${claim.newMonthlyFee.toFixed(2)}
                            </span>
                          </p>
                          <p
                            className={`flex items-center justify-end gap-1 text-xs ${
                              claim.feeChange > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {claim.feeChange > 0 ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                +$
                                {claim.feeChange.toFixed(2)}/mo
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                -${Math.abs(claim.feeChange).toFixed(2)}/mo
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="ml-4 list-disc space-y-1">
                    {preview.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                disabled={cancelling}
              >
                Keep Claim
              </Button>
              <Button
                onClick={handleCancel}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
                disabled={cancelling || !preview.canCancel}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { ClaimSubscriptionFlow } from "@/components/subscriptions/ClaimSubscriptionFlow";

type FlowStep = "eligibility" | "payment" | "complete";

interface NewClaimFlowProps {
  existingClaimCount: number;
  onCancel?: () => void;
}

/**
 * New Claim Flow Component
 *
 * Guides users through creating a subsequent claim:
 * 1. Eligibility check (with bypass option)
 * 2. Payment for claim subscription
 * 3. Redirect to RECA form
 */
export function NewClaimFlow({
  existingClaimCount,
  onCancel,
}: NewClaimFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("eligibility");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eligibility state
  const [showBypassWarning, setShowBypassWarning] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<any>(null);

  // Claim state
  const [claimantId, setClaimantId] = useState<string | null>(null);
  const [claimOrder, setClaimOrder] = useState(existingClaimCount + 1);

  /**
   * Handle eligibility check submission
   */
  const handleEligibilitySubmit = async (bypassCheck = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/claims/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eligibilityData,
          bypassCheck,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Eligibility check failed");
      }

      // If eligible or bypassed, create placeholder claimant
      if (data.eligible || data.bypassed) {
        await createPlaceholderClaim(data.eligibilityData || eligibilityData);
      } else if (data.canBypass) {
        setShowBypassWarning(true);
        setLoading(false);
      } else {
        setError(
          data.reason || "You may not be eligible for RECA compensation"
        );
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check eligibility"
      );
      setLoading(false);
    }
  };

  /**
   * Create placeholder claimant before payment
   */
  const createPlaceholderClaim = async (elData: any) => {
    try {
      const response = await fetch("/api/claims/create-placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: "DOWNWINDER",
          eligibilityData: elData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create claim");
      }

      setClaimantId(data.claimantId);
      setClaimOrder(data.claimOrder);
      setStep("payment");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim");
      setLoading(false);
    }
  };

  /**
   * Handle successful payment - redirect to RECA form
   */
  const handlePaymentSuccess = () => {
    setStep("complete");

    // Create workflow session with paid claimantId
    setTimeout(async () => {
      try {
        const response = await fetch("/api/reca/workflow/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimantId,
            eligibilityData,
            claimType: "DOWNWINDER",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create workflow");
        }

        // Redirect to RECA form
        router.push(`/reca?session=${data.sessionId}` as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start form");
      }
    }, 2000);
  };

  // ========== STEP 1: ELIGIBILITY CHECK ==========
  if (step === "eligibility") {
    return (
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-sage-900">
            File Claim {claimOrder}
          </CardTitle>
          <CardDescription className="text-sage-600">
            Before we proceed with payment, let's verify this claim is likely
            eligible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eligibility Questionnaire */}
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Why check eligibility?</strong> We want to ensure your
                claim meets RECA requirements before you pay for the claim
                subscription. This protects you from paying for ineligible
                claims.
              </AlertDescription>
            </Alert>

            {/* Simple eligibility form */}
            <div className="space-y-4 rounded-lg border-2 border-sage-200 bg-sage-50 p-4">
              <h3 className="font-semibold text-sage-900">
                Quick Eligibility Check
              </h3>

              <div>
                <label className="block text-sm font-medium text-sage-700">
                  Your relationship to the exposed individual:
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-sage-300 shadow-sm"
                  onChange={(e) =>
                    setEligibilityData({
                      ...eligibilityData,
                      relationship: e.target.value,
                    })
                  }
                >
                  <option value="">Select...</option>
                  <option value="SELF">Myself</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="PARENT">Parent</option>
                  <option value="GRANDCHILD">Grandchild</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700">
                  Did they live in one of the designated exposure areas during
                  the testing period?
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-sage-300 shadow-sm"
                  onChange={(e) =>
                    setEligibilityData({
                      ...eligibilityData,
                      exposure: e.target.value === "yes",
                    })
                  }
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700">
                  Was a compensable disease diagnosed?
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-sage-300 shadow-sm"
                  onChange={(e) =>
                    setEligibilityData({
                      ...eligibilityData,
                      disease: e.target.value === "yes",
                    })
                  }
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {showBypassWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Not Recommended:</strong> Based on your responses,
                  this claim may not meet RECA eligibility requirements. We
                  strongly advise consulting with a RECA specialist before
                  proceeding. You may still bypass this check if you believe the
                  assessment is incorrect.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                disabled={loading}
              >
                Cancel
              </Button>
            )}

            <Button
              onClick={() => handleEligibilitySubmit(false)}
              className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              disabled={
                loading ||
                !eligibilityData?.relationship ||
                !eligibilityData?.exposure ||
                !eligibilityData?.disease
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Eligibility"
              )}
            </Button>
          </div>

          {/* Bypass Option */}
          {(showBypassWarning || existingClaimCount > 0) && (
            <div className="border-t border-sage-200 pt-4">
              <Button
                onClick={() => handleEligibilitySubmit(true)}
                variant="ghost"
                className="w-full text-sm text-sage-600 hover:text-sage-900"
                disabled={loading}
              >
                Skip eligibility check (not recommended)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ========== STEP 2: PAYMENT ==========
  if (step === "payment" && claimantId) {
    return (
      <ClaimSubscriptionFlow
        claimantId={claimantId}
        onSuccess={handlePaymentSuccess}
        onCancel={onCancel}
      />
    );
  }

  // ========== STEP 3: COMPLETE ==========
  if (step === "complete") {
    return (
      <Card className="rounded-3xl border-2 border-green-200 bg-white shadow-sm">
        <CardContent className="py-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold text-sage-900">
            Claim {claimOrder} Ready!
          </h2>
          <p className="mt-2 text-sage-600">
            Your payment was successful. Redirecting to the RECA form...
          </p>
          <div className="mt-4">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-sage-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

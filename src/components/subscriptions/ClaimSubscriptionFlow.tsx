"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, AlertCircle, Info } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY ||
    ""
);

interface ClaimPricing {
  claimOrder: number;
  setupFee: number;
  monthlyFee: number;
  setupFeeRefundable: boolean;
  tier: "DIY_PREP" | "LEGAL_REP";
}

interface ClaimSubscriptionFlowProps {
  claimantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Main component - handles pricing preview and setup
 */
export function ClaimSubscriptionFlow({
  claimantId,
  onSuccess,
  onCancel,
}: ClaimSubscriptionFlowProps) {
  const [pricing, setPricing] = useState<ClaimPricing | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pricing preview
  useEffect(() => {
    async function fetchPricing() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/claims/subscribe?claimantId=${claimantId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pricing");
        }

        const data = await response.json();
        setPricing({
          claimOrder: data.claimOrder,
          setupFee: data.pricing.setupFee,
          monthlyFee: data.pricing.monthlyFee,
          setupFeeRefundable: data.pricing.setupFeeRefundable,
          tier: data.tier,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pricing");
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [claimantId]);

  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/claims/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const data = await response.json();
      setClientSecret(data.payment.clientSecret);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create subscription"
      );
      setLoading(false);
    }
  };

  if (loading && !pricing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    );
  }

  if (error && !pricing) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!pricing) {
    return null;
  }

  // Show pricing preview and confirm button
  if (!clientSecret) {
    return (
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-sage-900">
            Claim {pricing.claimOrder} - Subscription Details
          </CardTitle>
          <CardDescription className="text-sage-600">
            Review pricing and confirm to proceed with payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Breakdown */}
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-sage-200 bg-sage-50 p-4">
              <h3 className="mb-3 font-semibold text-sage-900">
                Pricing Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sage-700">Claim Order:</span>
                  <span className="font-semibold text-sage-900">
                    Claim {pricing.claimOrder}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sage-700">Setup Fee:</span>
                  <span className="font-semibold text-sage-900">
                    ${pricing.setupFee.toFixed(2)}
                    {pricing.setupFeeRefundable && (
                      <span className="ml-1 text-xs text-terracotta-600">
                        (refundable)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-sage-300 pt-2">
                  <span className="text-sage-700">Monthly Fee:</span>
                  <span className="font-semibold text-sage-900">
                    ${pricing.monthlyFee.toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How billing works:</strong>
                <ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
                  <li>
                    Setup fee of ${pricing.setupFee.toFixed(2)} includes your
                    first month of service
                  </li>
                  <li>
                    Monthly billing of ${pricing.monthlyFee.toFixed(2)} starts
                    on day 31
                  </li>
                  {pricing.setupFeeRefundable && (
                    <li className="text-terracotta-700">
                      Setup fee is refundable when DOJ receives your claim
                    </li>
                  )}
                  {pricing.claimOrder > 1 && pricing.tier === "DIY_PREP" && (
                    <li className="text-green-700">
                      You're saving $10/mo with our multi-claim discount!
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

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
              onClick={handleCreateSubscription}
              className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment
                  <span className="ml-2">${pricing.setupFee.toFixed(2)}</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show payment form
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#d97757",
            colorBackground: "#fdfcfb",
            colorText: "#2d3e2f",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "12px",
          },
        },
      }}
    >
      <PaymentForm
        pricing={pricing}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

/**
 * Payment form component - handles Stripe payment
 */
function PaymentForm({
  pricing,
  onSuccess,
  onCancel,
}: {
  pricing: ClaimPricing;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/portal?subscription_success=true`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setIsProcessing(false);
      } else {
        // Payment succeeded
        setPaymentSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <Card className="rounded-3xl border-2 border-green-200 bg-white shadow-sm">
        <CardContent className="py-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold text-sage-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sage-600">
            Your claim subscription is now active.
          </p>
          <p className="mt-4 text-sm text-sage-600">
            Redirecting to your portal...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-sage-900">
          Complete Payment
        </CardTitle>
        <CardDescription className="text-sage-600">
          Setup fee: ${pricing.setupFee.toFixed(2)} (includes first month)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ${pricing.setupFee.toFixed(2)}</>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-sage-500">
            Your payment is secured by Stripe. Monthly billing of $
            {pricing.monthlyFee.toFixed(2)} begins on day 31.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

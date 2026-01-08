"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LegalRepresentationAgreement } from "@/components/LegalRepresentationAgreement";
import {
  Heart,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowLeft,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
  hasSubscription: boolean;
  needsToSelectTier: boolean;
  tier: "DIY_PREP" | "LEGAL_REP" | null;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED" | null;
  setupFeePaid?: boolean;
  setupFeePaidAt?: string;
  nextBillingDate?: string;
  lastBillingDate?: string;
  stripeCustomerId?: string;
  referredToFirm?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  referredAt?: string;
}

interface PaymentHistory {
  id: string;
  paymentType: "SETUP_FEE" | "MONTHLY_FEE" | "FIRM_SERVICE_FEE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  createdAt: string;
}

interface RefundEligibility {
  eligible: boolean;
  amount?: number;
  daysRemaining?: number;
  reason?: string;
}

export default function SubscriptionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [refundEligibility, setRefundEligibility] =
    useState<RefundEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal/subscription");
    } else if (status === "authenticated") {
      loadSubscriptionData();
    }
  }, [status, router]);

  const loadSubscriptionData = async () => {
    try {
      // Load subscription status
      const subResponse = await fetch("/api/subscriptions/status");
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);

        // If DIY tier, check refund eligibility and load payment history
        if (subData.tier === "DIY_PREP" && subData.setupFeePaid) {
          const refundResponse = await fetch("/api/subscriptions/refund");
          if (refundResponse.ok) {
            const refundData = await refundResponse.json();
            setRefundEligibility(refundData);
          }

          // Load payment history (we'll create this endpoint next)
          const historyResponse = await fetch(
            "/api/subscriptions/payment-history"
          );
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setPaymentHistory(historyData.payments || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessingAction(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      });

      if (response.ok) {
        await loadSubscriptionData();
        setCancelDialogOpen(false);
        alert("Your subscription has been canceled successfully.");
      } else {
        const error = await response.json();
        alert(`Failed to cancel subscription: ${error.error}`);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("An error occurred while canceling your subscription.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRequestRefund = async () => {
    setProcessingAction(true);
    try {
      const response = await fetch("/api/subscriptions/refund", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadSubscriptionData();
        setRefundDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Refund request failed: ${error.reason || error.error}`);
      }
    } catch (error) {
      console.error("Error requesting refund:", error);
      alert("An error occurred while processing your refund.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpgradeToLegal = async () => {
    setProcessingAction(true);
    try {
      const response = await fetch("/api/subscriptions/upgrade-to-legal", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadSubscriptionData();
        setUpgradeDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Upgrade failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      alert("An error occurred while upgrading your subscription.");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      ACTIVE: {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      },
      PAST_DUE: {
        label: "Past Due",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertCircle,
      },
      CANCELED: {
        label: "Canceled",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: XCircle,
      },
      PAUSED: {
        label: "Paused",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
      },
    };

    const config = (configs[status] || configs.ACTIVE) as {
      label: string;
      className: string;
      icon: any;
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your subscription...</p>
        </div>
      </div>
    );
  }

  // No subscription - redirect to service tier selection
  if (!subscription?.hasSubscription) {
    router.push("/service-tiers");
    return null;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/portal" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 text-sage-600" />
            <span className="text-sage-700">Back to Portal</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            Subscription Management
          </h1>
          <p className="text-lg text-sage-700">
            Manage your plan, billing, and payment methods
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-sage-900">
                      {subscription.tier === "DIY_PREP"
                        ? "DIY Document Preparation"
                        : "Legal Representation"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sage-600">
                      {subscription.tier === "DIY_PREP"
                        ? "Self-guided RECA claim preparation"
                        : "Full legal representation through Heritage Law"}
                    </CardDescription>
                  </div>
                  {subscription.status && getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* DIY Plan Details */}
                {subscription.tier === "DIY_PREP" && (
                  <>
                    <div className="rounded-2xl bg-cream-50 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sage-700">
                            Setup Fee
                          </span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-sage-900">
                              $149.99
                            </p>
                            {subscription.setupFeePaid && (
                              <p className="text-xs text-sage-600">
                                Paid on{" "}
                                {subscription.setupFeePaidAt
                                  ? new Date(
                                      subscription.setupFeePaidAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-cream-200 pt-4">
                          <span className="font-medium text-sage-700">
                            Monthly Subscription
                          </span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-sage-900">
                              $24.99
                            </p>
                            <p className="text-xs text-sage-600">per month</p>
                          </div>
                        </div>
                        {subscription.nextBillingDate && (
                          <div className="flex items-center gap-2 border-t border-cream-200 pt-4">
                            <Calendar className="h-4 w-4 text-sage-500" />
                            <span className="text-sm text-sage-700">
                              Next billing date:{" "}
                              {new Date(
                                subscription.nextBillingDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* What's Included */}
                    <div>
                      <h3 className="mb-3 font-semibold text-sage-900">
                        What's Included
                      </h3>
                      <ul className="space-y-2">
                        {[
                          "Step-by-step RECA form completion",
                          "Document organization & checklist",
                          "State-specific resource finder",
                          "PDF generation for mailing",
                          "Progress tracking & saving",
                        ].map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                            <span className="text-sage-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Legal Plan Details */}
                {subscription.tier === "LEGAL_REP" && (
                  <>
                    <div className="rounded-2xl bg-emerald-50 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-emerald-900">
                            No Upfront Cost
                          </span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-900">
                              $0.00
                            </p>
                            <p className="text-xs text-emerald-700">
                              Payment on approval only
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {subscription.referredToFirm && (
                      <div className="rounded-2xl bg-cream-50 p-6">
                        <h3 className="mb-3 font-semibold text-sage-900">
                          Your Legal Team
                        </h3>
                        <p className="mb-2 text-lg font-medium text-sage-900">
                          {subscription.referredToFirm.name}
                        </p>
                        {subscription.referredToFirm.email && (
                          <p className="text-sm text-sage-600">
                            {subscription.referredToFirm.email}
                          </p>
                        )}
                        {subscription.referredToFirm.phone && (
                          <p className="text-sm text-sage-600">
                            {subscription.referredToFirm.phone}
                          </p>
                        )}
                        {subscription.referredAt && (
                          <p className="mt-2 text-xs text-sage-500">
                            Referred on{" "}
                            {new Date(
                              subscription.referredAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* What's Included */}
                    <div>
                      <h3 className="mb-3 font-semibold text-sage-900">
                        What's Included
                      </h3>
                      <ul className="space-y-2">
                        {[
                          "Full legal representation",
                          "Attorney review of all documents",
                          "Direct attorney communication",
                          "Professional claim submission",
                          "Appeal support if needed",
                        ].map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                            <span className="text-sage-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            {paymentHistory.length > 0 && (
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Payment History
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    View your past transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-cream-200 bg-cream-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                            <DollarSign className="h-5 w-5 text-sage-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sage-900">
                              {payment.paymentType === "SETUP_FEE"
                                ? "Setup Fee"
                                : payment.paymentType === "MONTHLY_FEE"
                                  ? "Monthly Subscription"
                                  : "Firm Service Fee"}
                            </p>
                            <p className="text-sm text-sage-600">
                              {payment.paidAt
                                ? new Date(payment.paidAt).toLocaleDateString()
                                : new Date(
                                    payment.createdAt
                                  ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sage-900">
                            ${payment.amount.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs ${
                              payment.status === "COMPLETED"
                                ? "text-emerald-600"
                                : payment.status === "REFUNDED"
                                  ? "text-blue-600"
                                  : payment.status === "FAILED"
                                    ? "text-red-600"
                                    : "text-amber-600"
                            }`}
                          >
                            {payment.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Upgrade to Legal */}
            {subscription.tier === "DIY_PREP" &&
              subscription.status === "ACTIVE" && (
                <Card className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-900">
                      <TrendingUp className="h-5 w-5" />
                      Upgrade Available
                    </CardTitle>
                    <CardDescription className="text-emerald-700">
                      Switch to full legal representation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setUpgradeDialogOpen(true)}
                      className="w-full gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Shield className="h-4 w-4" />
                      Upgrade to Legal
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* Payment Method */}
            {subscription.tier === "DIY_PREP" && subscription.setupFeePaid && (
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Payment Method
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Manage your billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                    onClick={() => {
                      // TODO: Integrate Stripe Customer Portal
                      alert(
                        "Payment method management coming soon! This will open Stripe's Customer Portal."
                      );
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Refund Eligibility */}
            {refundEligibility?.eligible && (
              <Card className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-blue-900">
                    Refund Available
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {refundEligibility.daysRemaining} days remaining in refund
                    window
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setRefundDialogOpen(true)}
                    variant="outline"
                    className="w-full gap-2 rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <DollarSign className="h-4 w-4" />
                    Request Refund (${refundEligibility.amount?.toFixed(2)})
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cancel Subscription */}
            {subscription.status === "ACTIVE" && (
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Cancel Subscription
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    End your subscription at any time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setCancelDialogOpen(true)}
                    variant="outline"
                    className="w-full rounded-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose
              access to all features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="rounded-full"
              disabled={processingAction}
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              className="rounded-full bg-red-500 hover:bg-red-600"
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Request Refund?</DialogTitle>
            <DialogDescription>
              This will refund your setup fee of $
              {refundEligibility?.amount?.toFixed(2)} and cancel your
              subscription. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              className="rounded-full"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRefund}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Legal Agreement Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl">
          <LegalRepresentationAgreement
            onAccept={handleUpgradeToLegal}
            onDecline={() => setUpgradeDialogOpen(false)}
            isLoading={processingAction}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

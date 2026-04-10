"use client";

import { useState, useEffect, Suspense } from "react";
import { trackTierSelected } from "@/lib/analytics/meta-pixel";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Heart,
  FileText,
  Users,
  Building,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Scale,
} from "lucide-react";
import { SERVICE_TIERS } from "@/lib/constants/service-tiers";
import { HERITAGE_LAW_OFFICES } from "@/lib/constants/heritage-law";
import { DIYTermsAgreement } from "@/components/DIYTermsAgreement";
import { LegalRepresentationAgreement } from "@/components/LegalRepresentationAgreement";
import {
  BETA_CONFIG,
  getBetaPricing,
  isBetaActive,
} from "@/lib/constants/beta-config";
import { BetaBadge, BetaPrice, BetaBanner } from "@/components/BetaBanner";

function ServiceTiersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent"); // "self", "deceased-relative", etc.
  const { status } = useSession();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showDIYAgreement, setShowDIYAgreement] = useState(false);
  const [showLegalAgreement, setShowLegalAgreement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showEligibilityPrompt, setShowEligibilityPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "installment">(
    "full"
  );

  // Beta pricing — reads from beta-config.ts; returns original prices when beta is off
  const diyFullBeta = getBetaPricing(499);

  // SECURITY: Clean up old sessionStorage keys on mount to prevent cross-user contamination
  useEffect(() => {
    // Remove deprecated/unsafe sessionStorage keys
    sessionStorage.removeItem("pendingServiceTier");
    sessionStorage.removeItem("selectedServiceTier");
    // Note: We keep radiant_user_data for form prefilling within the same session
    // It gets cleared on logout in signout/page.tsx
  }, []);

  const handleSelectTier = async (tierId: "DIY_PREP" | "LEGAL_REP") => {
    try {
      console.log("handleSelectTier called with:", tierId);

      // Check eligibility — try sessionStorage first, fall back to localStorage
      const eligibilityVerified =
        sessionStorage.getItem("eligibility_verified") ||
        localStorage.getItem("eligibility_verified");

      if (!eligibilityVerified) {
        setShowEligibilityPrompt(true);
        return;
      }

      // Restore sessionStorage from localStorage if it was lost (tab close/refresh)
      if (!sessionStorage.getItem("eligibility_verified")) {
        sessionStorage.setItem("eligibility_verified", "true");
      }

      console.log("User status:", status);
      // Check if user is authenticated
      if (status === "unauthenticated") {
        console.log("User unauthenticated, showing auth prompt");
        setSelectedTier(tierId);
        setShowAuthPrompt(true);
        return;
      }

      console.log("Proceeding with tier selection");
      setErrorMessage(null);
      setInfoMessage(null);
      setSelectedTier(tierId);
      trackTierSelected(tierId);

      // Show appropriate agreement dialog
      if (tierId === "DIY_PREP") {
        setShowDIYAgreement(true);
      } else {
        setShowLegalAgreement(true);
      }
    } catch (error) {
      console.error("Error in handleSelectTier:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  // Check for pending tier selection after login
  // SECURITY FIX: Use URL parameter instead of sessionStorage to prevent cross-user contamination
  useEffect(() => {
    if (status === "authenticated") {
      const pendingTier = searchParams.get("selectedTier");
      if (
        pendingTier &&
        (pendingTier === "DIY_PREP" || pendingTier === "LEGAL_REP")
      ) {
        // Clear the URL parameter by replacing history
        const url = new URL(window.location.href);
        url.searchParams.delete("selectedTier");
        window.history.replaceState({}, "", url);

        handleSelectTier(pendingTier);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, searchParams]);

  const handleDIYAccept = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      // SECURITY: Removed sessionStorage.setItem("selectedServiceTier") to prevent cross-user contamination
      // Subscription status is now tracked server-side only
      sessionStorage.setItem("diy_terms_accepted", "true");

      // Create subscription record via API
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "DIY_PREP",
          paymentPlan: isBetaActive() ? "full" : paymentPlan,
          policyType: "TERMS_OF_SERVICE",
          policyVersion: "1.0",
          ipAddress: window.location.hostname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific error codes
        if (data.code === "USER_NOT_FOUND") {
          alert("Your session has expired. Please log out and log back in.");
          router.push("/login");
          return;
        }

        if (data.code === "DIY_PRICE_NOT_CONFIGURED") {
          setErrorMessage(
            "DIY checkout is temporarily offline while we finish configuring billing. Please reach out to support and we'll get you set up."
          );
          setIsLoading(false);
          return;
        }

        if (data.error) {
          // Include details if available for better debugging
          const fullError = data.details
            ? `${data.error}: ${data.details}`
            : data.error;
          setErrorMessage(fullError);
          setIsLoading(false);
          return;
        }

        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.message) {
        setInfoMessage(data.message);
      }

      // Redirect to Stripe checkout for payment
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback to portal if no checkout needed
        router.push("/portal");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to continue. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleLegalAccept = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      // SECURITY: Removed sessionStorage.setItem("selectedServiceTier") to prevent cross-user contamination
      // Subscription status is now tracked server-side only
      sessionStorage.setItem("legal_terms_accepted", "true");

      // Create subscription record via API
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "LEGAL_REP",
          policyType: "TERMS_OF_SERVICE",
          policyVersion: "1.0",
          ipAddress: window.location.hostname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific error codes
        if (data.code === "USER_NOT_FOUND") {
          alert("Your session has expired. Please log out and log back in.");
          router.push("/login");
          return;
        }

        if (data.code === "LEGAL_REP_PRICE_NOT_CONFIGURED") {
          setErrorMessage(
            "Legal representation checkout is temporarily offline while we finish billing setup. Please contact support and we'll get you set up."
          );
          setIsLoading(false);
          return;
        }

        if (data.error) {
          // Include details if available for better debugging
          const fullError = data.details
            ? `${data.error}: ${data.details}`
            : data.error;
          setErrorMessage(fullError);
          setIsLoading(false);
          return;
        }

        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.message) {
        setInfoMessage(data.message);
      }

      // Redirect to Stripe checkout for payment
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback to portal if no checkout needed
        router.push("/portal");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to continue. Please try again."
      );
      setIsLoading(false);
    }
  };

  // Customize content based on intent
  const isDeceased =
    intent === "deceased-relative" || intent === "someone-else-relative";

  const documentRequirements = isDeceased
    ? [
        {
          title: "Medical History",
          desc: "Proof of the primary cancer diagnosis.",
          icon: FileText,
        },
        {
          title: "Presence Proof",
          desc: "Records placing them in the area (1951-1962).",
          icon: Map,
        },
        {
          title: "Survivor Evidence",
          desc: "Marriage/Birth certs to prove your relationship.",
          icon: Users,
        },
      ]
    : [
        {
          title: "Medical History",
          desc: "Proof of your cancer diagnosis.",
          icon: FileText,
        },
        {
          title: "Presence Proof",
          desc: "Records placing you in the area (1951-1962).",
          icon: Map,
        },
        {
          title: "Identity",
          desc: "Standard government ID.",
          icon: ShieldCheck,
        },
      ];

  return (
    <div className="min-h-screen bg-cream-50">
      <BetaBanner />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <Link href="/eligibility-check">
            <Button
              variant="outline"
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Check Eligibility
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            Choose Your RECA Claim Path
          </h1>
          <p className="mb-4 text-xl text-sage-700">
            Two ways to prepare and file your claim documents
          </p>
          <div className="mx-auto h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Golden Triad Education Section */}
        <div className="mx-auto mb-12 max-w-5xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-sage-200">
            <div className="bg-sage-50 px-8 py-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-sage-900">
                The "Golden Triad" of Evidence
              </h2>
              <p className="text-sage-700">
                {isDeceased
                  ? "Since you are filing for a loved one, the DOJ requires three specific types of proof. Both paths below help you gather these."
                  : "To get approved, you must provide three specific types of proof. Both paths below help you gather these."}
              </p>
            </div>
            <div className="grid gap-px bg-sage-100 sm:grid-cols-3">
              {documentRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="group bg-white p-6 transition-colors hover:bg-sage-50/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-600 group-hover:bg-terracotta-100 group-hover:text-terracotta-600">
                    <req.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-sage-900">
                    {req.title}
                  </h3>
                  <p className="text-sm text-sage-600">{req.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-cream-50 px-8 py-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-terracotta-700">
                <CheckCircle className="h-4 w-4" />
                Our systems are designed specifically to help you secure these
                difficult documents.
              </div>
            </div>
          </div>
        </div>

        {infoMessage && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm text-sage-800">
            {infoMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-700">
            {errorMessage}
          </div>
        )}

        {/* Comparison Cards */}
        <div className="mx-auto mb-12 grid max-w-6xl gap-8 md:grid-cols-2">
          {/* DIY Path Card */}
          <Card className="rounded-3xl border-2 border-sage-300 bg-white shadow-lg transition-all hover:border-sage-500 hover:shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
                    <FileSearch className="h-8 w-8 text-sage-600" />
                  </div>
                  <BetaBadge />
                </div>
                <div className="text-right">
                  <BetaPrice
                    originalPrice={499}
                    discountedPrice={diyFullBeta.finalPrice}
                    className="text-3xl font-bold text-sage-900"
                  />
                  <div className="text-sm font-bold text-terracotta-600">
                    {isBetaActive()
                      ? "One-time Payment"
                      : "One-time or 2 Payments"}
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="mb-2 text-2xl text-sage-900">
                  PATH 1: {SERVICE_TIERS.DIY_PREP.name}
                </CardTitle>
                <CardDescription className="text-base text-sage-700">
                  {SERVICE_TIERS.DIY_PREP.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div>
                <p className="mb-3 font-semibold text-sage-900">
                  What's Included:
                </p>
                <div className="space-y-2">
                  {SERVICE_TIERS.DIY_PREP.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span className="text-sm text-sage-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Responsibilities */}
              <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
                <p className="mb-2 text-sm font-semibold text-sage-900">
                  You will:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-xs text-sage-700">
                  {SERVICE_TIERS.DIY_PREP.userResponsibilities.map(
                    (responsibility, idx) => (
                      <li key={idx}>{responsibility}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Refund Policy */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold text-blue-900">
                  7-Day Money-Back Guarantee
                </p>
                <p className="text-xs text-blue-700">
                  Full refund within 7 days if you haven't downloaded your
                  completed form
                </p>
              </div>

              {/* Beta Explainer */}
              {isBetaActive() && (
                <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
                  <p className="mb-1 text-xs font-semibold text-terracotta-800">
                    Why 50% off?
                  </p>
                  <p className="text-xs leading-relaxed text-terracotta-700">
                    {BETA_CONFIG.description}
                  </p>
                </div>
              )}

              {/* Payment Plan Selector */}
              <div className="rounded-lg border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-4">
                {isBetaActive() ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-sage-900">
                        One-Time Payment
                      </p>
                      <BetaPrice
                        originalPrice={499}
                        discountedPrice={diyFullBeta.finalPrice}
                        className="text-lg font-bold text-sage-900"
                      />
                    </div>
                    <p className="mt-2 text-xs text-sage-600">
                      Financing available at checkout via Klarna, Affirm, or
                      Afterpay
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm font-semibold text-sage-900">
                      Choose Your Payment Plan
                    </p>
                    <div className="space-y-3">
                      {/* Full Payment Option */}
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                          paymentPlan === "full"
                            ? "border-sage-600 bg-sage-100"
                            : "border-sage-200 bg-white hover:border-sage-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentPlan"
                          value="full"
                          checked={paymentPlan === "full"}
                          onChange={(e) =>
                            setPaymentPlan(
                              e.target.value as "full" | "installment"
                            )
                          }
                          className="mt-1 h-4 w-4 text-sage-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sage-900">
                              Pay in Full
                            </span>
                            <span className="text-lg font-bold text-sage-900">
                              $499
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-sage-600">
                            One-time payment • No recurring charges
                          </p>
                        </div>
                      </label>

                      {/* Installment Plan Option */}
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                          paymentPlan === "installment"
                            ? "border-sage-600 bg-sage-100"
                            : "border-sage-200 bg-white hover:border-sage-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentPlan"
                          value="installment"
                          checked={paymentPlan === "installment"}
                          onChange={(e) =>
                            setPaymentPlan(
                              e.target.value as "full" | "installment"
                            )
                          }
                          className="mt-1 h-4 w-4 text-sage-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sage-900">
                              2-Payment Plan
                            </span>
                            <span className="text-lg font-bold text-sage-900">
                              $249.99 × 2
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-sage-600">
                            $249.99 today, then $249.99 in 30 days • Auto-stops
                            after 2 payments
                          </p>
                          <p className="mt-1 text-xs text-blue-600">
                            Card payments only (Affirm/Klarna not available for
                            installments)
                          </p>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => {
                  console.log("DIY Button Clicked");
                  handleSelectTier("DIY_PREP");
                }}
                className="w-full rounded-full bg-sage-600 py-6 text-lg font-semibold hover:bg-sage-700"
              >
                {isLoading && selectedTier === "DIY_PREP" ? (
                  "Loading..."
                ) : (
                  <>
                    Select DIY Path
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Disclaimer */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-900">
                  <strong>Important:</strong>{" "}
                  {SERVICE_TIERS.DIY_PREP.disclaimers[0]}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Legal Representation Card */}
          <Card className="rounded-3xl border-2 border-terracotta-300 bg-white shadow-lg transition-all hover:border-terracotta-500 hover:shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
                  <Scale className="h-8 w-8 text-terracotta-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-terracotta-900">
                    $0
                  </div>
                  <div className="text-sm font-bold text-terracotta-600">
                    Upfront Cost
                  </div>
                  <div className="mt-1 text-xs text-terracotta-600">
                    2% of award (paid on payout)
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="mb-2 text-2xl text-sage-900">
                  PATH 2: {SERVICE_TIERS.LEGAL_REP.name}
                </CardTitle>
                <CardDescription className="text-base text-sage-700">
                  {SERVICE_TIERS.LEGAL_REP.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div>
                <p className="mb-3 font-semibold text-sage-900">
                  What's Included:
                </p>
                <div className="space-y-2">
                  {SERVICE_TIERS.LEGAL_REP.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span className="text-sm text-sage-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heritage Law Info */}
              <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
                <p className="mb-2 text-sm font-semibold text-sage-900">
                  You'll work with:
                </p>
                <div className="flex items-start gap-3">
                  <Building className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-sage-900">
                      {HERITAGE_LAW_OFFICES.name}
                    </p>
                    <p className="text-sage-700">
                      {HERITAGE_LAW_OFFICES.address.street}
                    </p>
                    <p className="text-sage-700">
                      {HERITAGE_LAW_OFFICES.address.city},{" "}
                      {HERITAGE_LAW_OFFICES.address.state}{" "}
                      {HERITAGE_LAW_OFFICES.address.zip}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sage-700">
                      <Phone className="h-3 w-3" />
                      {HERITAGE_LAW_OFFICES.contact.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attorney Fee Info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold text-blue-900">
                  Attorney Fee: {HERITAGE_LAW_OFFICES.attorneyFee.percentage}%
                  of award
                </p>
                <p className="text-xs text-blue-700">
                  {HERITAGE_LAW_OFFICES.attorneyFee.note}
                </p>
              </div>

              {/* Pricing Info */}
              <div className="rounded-lg border-2 border-terracotta-200 bg-terracotta-50 p-4">
                <div className="space-y-2 text-sm text-terracotta-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Upfront:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <p className="mt-2 text-xs italic text-terracotta-600">
                    Zero risk. You only pay the 2% attorney fee if you receive
                    an award.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => {
                  console.log("Legal Button Clicked");
                  handleSelectTier("LEGAL_REP");
                }}
                className="w-full rounded-full bg-terracotta-500 py-6 text-lg font-semibold hover:bg-terracotta-600"
              >
                {isLoading && selectedTier === "LEGAL_REP" ? (
                  "Loading..."
                ) : (
                  <>
                    Select Legal Path
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Disclaimer */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-900">
                  <strong>Important:</strong>{" "}
                  {SERVICE_TIERS.LEGAL_REP.disclaimers[0]}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="mx-auto mb-12 max-w-4xl">
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-sage-900">
                Feature Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-200">
                      <th className="px-4 py-3 text-left font-semibold text-sage-900">
                        Feature
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-sage-900">
                        DIY Prep
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-sage-900">
                        Legal Rep
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        Eligibility assessment
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        Document preparation
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        RECA form completion
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        Attorney review
                      </td>
                      <td className="px-4 py-3 text-center text-sage-400">—</td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        Attorney submits to DOJ
                      </td>
                      <td className="px-4 py-3 text-center text-sage-400">—</td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr className="border-b border-cream-100">
                      <td className="px-4 py-3 text-sage-700">
                        Legal representation
                      </td>
                      <td className="px-4 py-3 text-center text-sage-400">—</td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-sage-700">
                        Upfront Cost
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-sage-900">
                        <BetaPrice
                          originalPrice={499}
                          discountedPrice={diyFullBeta.finalPrice}
                          className="font-semibold text-sage-900"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-sage-900">
                        $0
                      </td>
                    </tr>
                    <tr className="border-t-2 border-cream-200 bg-cream-50">
                      <td className="px-4 py-3 font-bold text-sage-900">
                        Total Cost
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        <BetaPrice
                          originalPrice={499}
                          discountedPrice={diyFullBeta.finalPrice}
                          className="font-bold text-emerald-700"
                        />
                        <div className="text-xs font-normal text-sage-600">
                          (One-time flat fee)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-sage-900">
                        $2,000
                        <div className="text-xs font-normal text-sage-600">
                          (2% of award, paid on payout)
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-sage-900">
                Common Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-sage-900">
                  Can I switch from DIY to Legal Representation later?
                </h3>
                <p className="text-sm text-sage-700">
                  Yes! If you start with the DIY path and decide you want
                  attorney help, we can connect you with Heritage Law Offices.
                  Your $149.99 setup fee is non-refundable (you've received
                  value), but your monthly subscription will be canceled
                  immediately.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-sage-900">
                  What if I'm not satisfied with the DIY path?
                </h3>
                <p className="text-sm text-sage-700">
                  We offer a 7-day money-back guarantee. If you request a refund
                  within 7 days and haven't downloaded your completed form,
                  you'll receive a full refund of the $149.99 setup fee.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-sage-900">
                  How much does Heritage Law charge?
                </h3>
                <p className="text-sm text-sage-700">
                  Our free eligibility check indicated you likely qualify. These
                  services help you <strong>prepare and submit</strong> your
                  claim documents to the DOJ. For the Legal Representation path,
                  please note that the standard 2% attorney fee ($2,000) is
                  deducted from your award <em>in addition</em> to the monthly
                  technology fee. This is why the DIY path is significantly less
                  expensive overall.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-sage-900">
                  Do I need an account to get started?
                </h3>
                <p className="text-sm text-sage-700">
                  You can continue as a guest, but we recommend creating an
                  account to unlock powerful tracking tools like Payout Pulse,
                  which helps you track your claim status and estimated payout
                  timeline.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-cream-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
                <Heart className="h-4 w-4 text-white" fill="white" />
              </div>
              <span className="font-semibold text-sage-800">RadiantClaims</span>
            </div>
            <p className="text-sm text-sage-600">
              &copy; 2024 RadiantClaims. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href="/how-it-works"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                How It Works
              </Link>
              <Link
                href="/eligibility"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                Eligibility
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* DIY Terms Agreement Dialog */}
      <Dialog open={showDIYAgreement} onOpenChange={setShowDIYAgreement}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl">
          <DialogTitle className="sr-only">
            DIY Document Preparation - Terms of Service
          </DialogTitle>
          <DialogDescription className="sr-only">
            Please review and accept the terms of service to proceed with DIY
            document preparation
          </DialogDescription>
          <DIYTermsAgreement
            onAccept={handleDIYAccept}
            onDecline={() => {
              setShowDIYAgreement(false);
              setSelectedTier(null);
              setIsLoading(false);
              setErrorMessage(null);
            }}
            isLoading={isLoading}
            paymentPlan={paymentPlan}
            errorMessage={errorMessage}
          />
        </DialogContent>
      </Dialog>

      {/* Legal Representation Agreement Dialog */}
      <Dialog open={showLegalAgreement} onOpenChange={setShowLegalAgreement}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl">
          <DialogTitle className="sr-only">
            Legal Representation Agreement
          </DialogTitle>
          <DialogDescription className="sr-only">
            Please review and accept the legal representation agreement to
            proceed
          </DialogDescription>
          <LegalRepresentationAgreement
            onAccept={handleLegalAccept}
            onDecline={() => {
              setShowLegalAgreement(false);
              setSelectedTier(null);
              setIsLoading(false);
              setErrorMessage(null);
            }}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </DialogContent>
      </Dialog>

      {/* Authentication Required Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="max-w-md rounded-3xl">
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
                <Users className="h-8 w-8 text-terracotta-600" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-sage-900">
                Sign In Required
              </h2>
              <p className="text-sage-700">
                To continue with the{" "}
                {selectedTier === "DIY_PREP"
                  ? "DIY Preparation"
                  : "Legal Representation"}{" "}
                path, please sign in or create an account.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Pass selected tier via URL parameter (more secure than sessionStorage)
                  const callbackUrl = selectedTier
                    ? `/service-tiers?selectedTier=${selectedTier}`
                    : "/service-tiers";
                  router.push(
                    `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  );
                }}
                className="w-full rounded-full bg-terracotta-500 py-6 text-lg font-semibold hover:bg-terracotta-600"
              >
                Create Account
              </Button>
              <p className="text-center text-sm text-sage-600">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    // Pass selected tier via URL parameter (more secure than sessionStorage)
                    const callbackUrl = selectedTier
                      ? `/service-tiers?selectedTier=${selectedTier}`
                      : "/service-tiers";
                    router.push(
                      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                    );
                  }}
                  className="font-semibold text-terracotta-600 transition-colors hover:text-terracotta-700"
                >
                  Sign In
                </button>
              </p>
              <Button
                onClick={() => {
                  setShowAuthPrompt(false);
                  setSelectedTier(null);
                }}
                variant="outline"
                className="w-full rounded-full border-sage-300 py-6 text-lg font-semibold text-sage-700 hover:bg-sage-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Eligibility Required Dialog */}
      <Dialog
        open={showEligibilityPrompt}
        onOpenChange={setShowEligibilityPrompt}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
                <ShieldCheck className="h-8 w-8 text-terracotta-600" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-sage-900">
                Eligibility Check Required
              </h2>
              <p className="text-sage-700">
                Before selecting a service path, we need to verify that you or
                your loved one meets the basic RECA requirements.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/eligibility-check" className="w-full">
                <Button className="w-full rounded-full bg-terracotta-500 py-6 text-lg font-semibold hover:bg-terracotta-600">
                  Check Eligibility
                </Button>
              </Link>
              <Button
                onClick={() => setShowEligibilityPrompt(false)}
                variant="outline"
                className="w-full rounded-full border-sage-300 py-6 text-lg font-semibold text-sage-700 hover:bg-sage-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Map icon for dynamic display
const Map = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" x2="9" y1="3" y2="18" />
    <line x1="15" x2="15" y1="6" y2="21" />
  </svg>
);

export default function ServiceTiersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
            <p className="text-sage-600">Loading options...</p>
          </div>
        </div>
      }
    >
      <ServiceTiersContent />
    </Suspense>
  );
}

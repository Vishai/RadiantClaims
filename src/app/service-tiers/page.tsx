"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CheckCircle,
  Heart,
  FileText,
  Users,
  Building,
  Phone,
  ArrowRight,
} from "lucide-react";
import { SERVICE_TIERS } from "@/lib/constants/service-tiers";
import { HERITAGE_LAW_OFFICES } from "@/lib/constants/heritage-law";
import { DIYTermsAgreement } from "@/components/DIYTermsAgreement";
import { LegalRepresentationAgreement } from "@/components/LegalRepresentationAgreement";

export default function ServiceTiersPage() {
  const router = useRouter();
  const { status } = useSession();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showDIYAgreement, setShowDIYAgreement] = useState(false);
  const [showLegalAgreement, setShowLegalAgreement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSelectTier = async (tierId: "DIY_PREP" | "LEGAL_REP") => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      setSelectedTier(tierId);
      setShowAuthPrompt(true);
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setSelectedTier(tierId);

    // Show appropriate agreement dialog
    if (tierId === "DIY_PREP") {
      setShowDIYAgreement(true);
    } else {
      setShowLegalAgreement(true);
    }
  };

  // Check for pending tier selection after login
  useEffect(() => {
    if (status === "authenticated") {
      const pendingTier = sessionStorage.getItem("pendingServiceTier");
      if (
        pendingTier &&
        (pendingTier === "DIY_PREP" || pendingTier === "LEGAL_REP")
      ) {
        sessionStorage.removeItem("pendingServiceTier");
        handleSelectTier(pendingTier);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleDIYAccept = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      sessionStorage.setItem("selectedServiceTier", "DIY_PREP");
      sessionStorage.setItem("diy_terms_accepted", "true");

      // Create subscription record via API
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "DIY_PREP",
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
          setErrorMessage(data.error);
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
      sessionStorage.setItem("selectedServiceTier", "LEGAL_REP");
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

        if (data.code === "DIY_PRICE_NOT_CONFIGURED") {
          setErrorMessage(
            "Legal path is available, but we're still finishing DIY billing setup. Please contact support if you need DIY access."
          );
          setIsLoading(false);
          return;
        }

        if (data.error) {
          setErrorMessage(data.error);
          setIsLoading(false);
          return;
        }

        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.message) {
        setInfoMessage(data.message);
      }

      // Redirect to portal dashboard (they can start from there)
      router.push("/portal");
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

  return (
    <div className="min-h-screen bg-cream-50">
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
        <div className="mx-auto mb-8 max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            Choose Your RECA Claim Path
          </h1>
          <p className="mb-4 text-xl text-sage-700">
            Two ways to prepare and file your claim documents
          </p>
          <div className="mx-auto h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Important Notice */}
        <div className="mx-auto mb-8 max-w-4xl">
          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                ℹ️
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-sage-900">
                  What You're Paying For
                </h3>
                <p className="text-sm text-sage-700">
                  Our free eligibility check indicated you likely qualify. These
                  services help you <strong>prepare and submit</strong> your
                  claim documents to the DOJ. We do not charge for determining
                  eligibility - that assessment was already provided at no cost.
                </p>
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
                  <FileText className="h-8 w-8 text-sage-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-sage-900">
                    ${SERVICE_TIERS.DIY_PREP.pricing.setupFee}
                  </div>
                  <div className="text-sm text-sage-600">
                    + ${SERVICE_TIERS.DIY_PREP.pricing.monthlyFee}/month
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

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectTier("DIY_PREP")}
                disabled={isLoading && selectedTier === "DIY_PREP"}
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
                  <Users className="h-8 w-8 text-terracotta-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-terracotta-900">
                    $0
                  </div>
                  <div className="text-sm text-terracotta-600">
                    upfront cost
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

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectTier("LEGAL_REP")}
                disabled={isLoading && selectedTier === "LEGAL_REP"}
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
                        $149.99
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-terracotta-600">
                        $0
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
                  Heritage Law Offices charges the standard RECA attorney fee of
                  2% of your award ($2,000 on a $100,000 claim). This fee is
                  paid directly by the Department of Justice from your award -
                  you receive $98,000 and the attorney receives $2,000. This is
                  mandated by federal law.
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
        <DialogContent className="max-w-4xl rounded-3xl">
          <DIYTermsAgreement
            onAccept={handleDIYAccept}
            onDecline={() => {
              setShowDIYAgreement(false);
              setSelectedTier(null);
              setIsLoading(false);
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Legal Representation Agreement Dialog */}
      <Dialog open={showLegalAgreement} onOpenChange={setShowLegalAgreement}>
        <DialogContent className="max-w-4xl rounded-3xl">
          <LegalRepresentationAgreement
            onAccept={handleLegalAccept}
            onDecline={() => {
              setShowLegalAgreement(false);
              setSelectedTier(null);
              setIsLoading(false);
            }}
            isLoading={isLoading}
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
                  // Save selected tier to session storage to restore after login
                  if (selectedTier) {
                    sessionStorage.setItem("pendingServiceTier", selectedTier);
                  }
                  router.push("/register?callbackUrl=/service-tiers");
                }}
                className="w-full rounded-full bg-terracotta-500 py-6 text-lg font-semibold hover:bg-terracotta-600"
              >
                Create Account
              </Button>
              <p className="text-center text-sm text-sage-600">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    if (selectedTier) {
                      sessionStorage.setItem(
                        "pendingServiceTier",
                        selectedTier
                      );
                    }
                    router.push("/login?callbackUrl=/service-tiers");
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
    </div>
  );
}

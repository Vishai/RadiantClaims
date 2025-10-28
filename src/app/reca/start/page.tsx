"use client";

import { useEffect, useState } from "react";
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
import { Heart, ArrowRight, CheckCircle, AlertCircle, Lock, UserPlus, Mail } from "lucide-react";

export default function RECAStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  useEffect(() => {
    const id = searchParams.get("sessionId");
    if (id) {
      setSessionId(id);
    }
  }, [searchParams]);

  // Auto-show auth options if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      setShowAuthOptions(true);
    }
  }, [status]);

  const handleStart = async (asGuest: boolean = false) => {
    setIsLoading(true);

    try {
      if (!sessionId) {
        // Create a new RECA workflow session
        const response = await fetch("/api/reca/workflow/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimType: "DOWNWINDER",
            isGuest: asGuest,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        const data = await response.json();
        const newSessionId = data.sessionId;

        // Navigate to first section with new session
        router.push(`/reca/form/${newSessionId}?section=part_1`);
      } else {
        // Navigate to first section with existing session
        router.push(`/reca/form/${sessionId}?section=part_1`);
      }
    } catch (error) {
      console.error("Error starting RECA claim:", error);
      alert("Failed to start claim. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    handleStart(true);
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
          <Link href="/portal">
            <Button
              variant="outline"
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Back to Portal
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            RECA Downwinder Claim Form
          </h1>
          <p className="text-xl text-sage-700">
            Guided step-by-step assistance to complete your $100,000
            compensation claim
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Overview Card */}
        <Card className="mb-8 rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">What to Expect</CardTitle>
            <CardDescription className="text-sage-600">
              This guided form will help you complete your RECA claim accurately
              and efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                1
              </div>
              <div>
                <h3 className="font-semibold text-sage-900 mb-1">
                  Provide Your Information
                </h3>
                <p className="text-sm text-sage-700">
                  We'll collect information about you and the person who became
                  ill, along with your relationship to them.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                2
              </div>
              <div>
                <h3 className="font-semibold text-sage-900 mb-1">
                  Document Exposure & Disease
                </h3>
                <p className="text-sm text-sage-700">
                  Confirm physical presence in affected areas during eligible
                  time periods and identify the compensable disease.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                3
              </div>
              <div>
                <h3 className="font-semibold text-sage-900 mb-1">
                  Review & Generate PDF
                </h3>
                <p className="text-sm text-sage-700">
                  We'll generate a pre-filled PDF of the official RECA form that
                  you can download, print, sign, and mail to the Department of
                  Justice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Gate */}
        {showAuthOptions && status === "unauthenticated" ? (
          <Card className="mb-8 rounded-3xl border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-peach-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sage-900">Choose How to Continue</CardTitle>
              <CardDescription className="text-sage-700">
                To save your progress and track your claim, please create an account or sign in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/reca/signup" className="block">
                  <div className="h-full rounded-2xl border-2 border-terracotta-300 bg-white p-6 transition-all hover:border-terracotta-500 hover:shadow-md cursor-pointer">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-100">
                      <UserPlus className="h-6 w-6 text-terracotta-600" />
                    </div>
                    <h3 className="mb-2 font-semibold text-sage-900">Create Account</h3>
                    <p className="text-sm text-sage-700 mb-3">
                      Unlock powerful tracking tools and save your progress
                    </p>
                    <div className="space-y-1.5 text-xs text-sage-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span className="font-medium text-emerald-900">Payout Pulse</span>
                        <span className="text-sage-600">- Track payout timeline</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Real-time DOJ milestone updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Queue position & cohort stats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Auto-save across all devices</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/login?callbackUrl=/reca/start" className="block">
                  <div className="h-full rounded-2xl border-2 border-sage-300 bg-white p-6 transition-all hover:border-sage-500 hover:shadow-md cursor-pointer">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
                      <Lock className="h-6 w-6 text-sage-600" />
                    </div>
                    <h3 className="mb-2 font-semibold text-sage-900">Sign In</h3>
                    <p className="text-sm text-sage-700">
                      Already have an account? Log in to continue your existing claim
                    </p>
                  </div>
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gradient-to-br from-terracotta-50 to-peach-50 px-2 text-sage-600">
                    Or
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-cream-300 bg-white p-6">
                <div className="mb-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="mb-1 font-semibold text-sage-900">Continue as Guest</h3>
                    <p className="text-sm text-sage-700">
                      Start without an account. You'll receive a magic link via email to resume later.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleContinueAsGuest}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                >
                  {isLoading ? "Loading..." : "Continue as Guest"}
                </Button>
                <p className="mt-3 text-xs text-sage-600">
                  Note: Guest sessions expire after 7 days. We recommend creating an account for the best experience.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Auto-Save Feature */}
            <Card className="mb-8 rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-sage-700">
                    <p className="font-semibold mb-1">Your Progress is Saved</p>
                    <p>
                      Don't worry about completing everything in one sitting. Your
                      progress is automatically saved every 2 minutes. You can return
                      anytime to continue where you left off.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Time Estimate */}
        <Card className="mb-8 rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-sage-700">
                <p className="font-semibold mb-1">Time Estimate</p>
                <p>
                  Plan for approximately 45-60 minutes to complete the form. Have
                  the following ready:
                </p>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Birth certificates and Social Security numbers</li>
                  <li>Information about exposure locations and dates</li>
                  <li>Medical records or diagnosis information</li>
                  <li>Marriage certificates (if applicable)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button - Only show for authenticated users */}
        {status === "authenticated" && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => handleStart(false)}
              disabled={isLoading}
              className="gap-2 rounded-full bg-terracotta-500 px-12 py-6 text-lg hover:bg-terracotta-600"
            >
              {isLoading ? "Loading..." : "Start RECA Form"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-sage-600">
              Estimated time: 45-60 minutes • Auto-saves your progress
            </p>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-12 rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-cream-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-sage-700">
            <p>
              <strong>RECA Program Hotline:</strong> 1-800-729-7327
            </p>
            <p>
              <strong>Email Support:</strong> Contact us through your customer
              portal
            </p>
            <p>
              <Link
                href="/eligibility"
                className="text-terracotta-600 hover:underline"
              >
                Review eligibility requirements →
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

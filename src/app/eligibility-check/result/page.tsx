"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Users,
} from "lucide-react";

function ResultContent() {
  const searchParams = useSearchParams();
  const eligibility = searchParams.get("eligibility");
  const intent = searchParams.get("intent");
  const name = searchParams.get("name");

  useEffect(() => {
    if (eligibility === "likely" || eligibility === "unlikely") {
      sessionStorage.setItem("eligibility_verified", "true");
    }

    // Trigger confetti animation for likely eligibility
    if (eligibility === "likely") {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [eligibility]);

  type ResultConfig = {
    icon: typeof CheckCircle2;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    title: string;
    description: string;
    nextSteps: string[];
    ctaText: string;
    ctaLink: Route;
    showServiceLink?: boolean;
  };

  const getResultConfig = (): ResultConfig => {
    switch (eligibility) {
      case "likely":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-600",
          bgColor: "from-green-50 to-sage-50",
          borderColor: "border-green-200",
          title: "Great News! You Likely Qualify",
          description:
            "Based on your answers, you appear to meet the basic RECA eligibility requirements. The next step is choosing how you want to prepare and file your claim documents.",
          nextSteps: [
            "Choose between DIY document prep or full legal representation",
            "Start gathering your residence proof documents",
            "Obtain medical records showing your cancer diagnosis",
          ],
          ctaText:
            intent === "someone-else" || intent === "someone-else-relative"
              ? "We'll Contact Them Soon"
              : "Choose Your Path",
          ctaLink: "/service-tiers",
        };
      case "unlikely":
        return {
          icon: AlertCircle,
          iconColor: "text-yellow-600",
          bgColor: "from-yellow-50 to-cream-100",
          borderColor: "border-yellow-200",
          title: "Latency Period May Be an Issue",
          description:
            "The cancer diagnosis appears to have occurred too soon after the exposure period. However, some cases have exceptions or special circumstances. We recommend professional legal review.",
          nextSteps: [
            "Heritage Law Offices can verify exact dates with your documents",
            "Some cases qualify under special circumstances",
            "Our Legal Representation path includes professional review at no upfront cost",
          ],
          ctaText: "Get Attorney Review",
          ctaLink: "/service-tiers",
        };
      case "ineligible":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "from-red-50 to-cream-100",
          borderColor: "border-red-200",
          title: "You May Not Qualify",
          description:
            "Based on your answers, you do not appear to meet the basic RECA eligibility requirements. This could be due to location, cancer type, or timing requirements.",
          nextSteps: [
            "Review the full eligibility requirements in case we missed something",
            "Check if other family members might qualify",
            "Consider referring someone else who may be eligible (earn $50)",
          ],
          ctaText: "Review Full Requirements",
          ctaLink: "/eligibility",
          showServiceLink: false, // Don't show service tier link for ineligible
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: "text-blue-600",
          bgColor: "from-blue-50 to-sage-50",
          borderColor: "border-blue-200",
          title: "We Need to Review Your Case",
          description:
            "Your situation requires professional review to determine eligibility.",
          nextSteps: [
            "Double-check the presence requirement (1 full year OR the entire month of July 1962)",
            "Gather proof of residence and medical records",
            "If you’re still unsure, contact us for guidance before purchasing services",
          ],
          ctaText: "Review Full Requirements",
          ctaLink: "/eligibility",
          showServiceLink: false,
        };
    }
  };

  const config = getResultConfig();
  const Icon = config.icon;
  const isReferral =
    intent === "someone-else" || intent === "someone-else-relative";

  return (
    <div className="min-h-screen bg-cream-50">
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
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Result Card */}
          <Card
            className={`mb-8 rounded-3xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgColor} shadow-lg`}
          >
            <CardHeader className="text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                <Icon className={`h-12 w-12 ${config.iconColor}`} />
              </div>
              <CardTitle className="text-3xl font-bold text-sage-900">
                {config.title}
              </CardTitle>
              <CardDescription className="text-lg text-sage-700">
                {config.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isReferral && eligibility === "likely" && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <Users className="h-6 w-6 text-terracotta-600" />
                    <h3 className="text-xl font-semibold text-sage-900">
                      Referral Submitted Successfully
                    </h3>
                  </div>
                  <p className="mb-4 text-sage-700">
                    Thank you for referring <strong>{name}</strong> to
                    RadiantClaims! Our team will reach out to them within 1-2
                    business days to begin their claim process.
                  </p>
                  <div className="rounded-xl bg-gradient-to-br from-peach-50 to-cream-100 p-4">
                    <p className="text-sm font-semibold text-sage-900">
                      💰 You'll receive $50 if their claim is approved by the
                      DOJ
                    </p>
                    <p className="mt-1 text-sm text-sage-600">
                      Payment will be made within 30 days of their award
                      notification
                    </p>
                  </div>
                </div>
              )}

              {/* Fork in the Road for Eligible Users */}
              {!isReferral && eligibility === "likely" ? (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-sage-900">
                      Choose Your Path to $100,000
                    </h3>
                    <p className="text-sage-700">
                      Select the option that best fits your needs.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Option A: DIY */}
                    <div className="group relative flex flex-col rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                        Save ~$1,500
                      </div>
                      <h4 className="mb-2 text-xl font-bold text-gray-900">
                        Fast-Track Filing Kit
                      </h4>
                      <div className="mb-1 text-4xl font-extrabold text-gray-900">
                        $499
                      </div>
                      <p className="mb-6 text-sm font-bold text-[#D65F4D]">
                        One-time Flat Fee
                      </p>

                      <ul className="mb-8 flex-grow space-y-3 text-left text-sm text-gray-600">
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>{" "}
                          <strong>Keep 100% of your $100k award</strong>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span> Auto-filled
                          RECA form ready to sign
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span> Document
                          checklist & filing guide
                        </li>
                      </ul>
                      <Link href="/service-tiers?tier=DIY_PREP">
                        <Button className="w-full rounded-xl border-2 border-gray-900 bg-transparent py-3 font-bold text-gray-900 transition hover:bg-gray-50">
                          Buy Packet - $499
                        </Button>
                      </Link>
                    </div>

                    {/* Option B: Legal */}
                    <div className="relative flex flex-col rounded-3xl border border-gray-200 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                        $0 Upfront Cost
                      </div>
                      <h4 className="mb-2 text-xl font-bold text-gray-900">
                        Attorney Review
                      </h4>
                      <div className="mb-1 text-4xl font-extrabold text-gray-900">
                        $0
                        <span className="text-lg font-normal text-gray-500">
                          {" "}
                          Upfront
                        </span>
                      </div>
                      <p className="mb-6 text-sm text-gray-400">
                        2% fee paid on payout
                      </p>

                      <ul className="mb-8 flex-grow space-y-3 text-left text-sm text-gray-600">
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span> Full legal
                          representation
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span> Attorney
                          handles DOJ submission
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>{" "}
                          <strong>Pay only 2% when you win</strong>
                        </li>
                      </ul>
                      <Link href="/service-tiers?tier=LEGAL_REP">
                        <Button className="w-full rounded-xl bg-[#D65F4D] py-3 font-bold text-white transition hover:bg-[#c04e3d]">
                          Sign with Attorney
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-xl font-semibold text-sage-900">
                      {isReferral && eligibility === "likely"
                        ? "What Happens Next:"
                        : "Next Steps:"}
                    </h3>
                    <ul className="space-y-3">
                      {config.nextSteps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <span className="text-sage-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isReferral && (
                    <div className="text-center">
                      <Link href={config.ctaLink}>
                        <Button
                          size="lg"
                          className="rounded-full bg-terracotta-500 px-8 py-6 text-lg hover:bg-terracotta-600"
                        >
                          {config.ctaText}{" "}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-sage-600" />
                <CardTitle className="text-sage-900">
                  Full Eligibility Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-sage-700">
                  Review the complete RECA eligibility requirements including
                  covered states, cancers, and timeline information.
                </p>
                <Link href="/eligibility">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-2 border-sage-300"
                  >
                    View Full Requirements
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-terracotta-600" />
                <CardTitle className="text-sage-900">Refer Someone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-sage-700">
                  Know someone else who might qualify? Refer them and earn $50
                  if their claim is approved.
                </p>
                <Link href="/eligibility-check">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-2 border-terracotta-300 text-terracotta-600"
                  >
                    Submit Another Check
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sage-600 transition-colors hover:text-sage-900"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
            <p className="text-sage-600">Loading your results...</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

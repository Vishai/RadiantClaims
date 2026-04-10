"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
  Shield,
  ExternalLink,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompoundInterestCalculator } from "@/components/financial/CompoundInterestCalculator";
import { ClaimJourney } from "@/components/reca/ClaimJourney";

export default function WhatComesNextPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [claimantName, setClaimantName] = useState<string>("");
  const [claimantId, setClaimantId] = useState<string>("");
  const calculatorRef = useRef<HTMLDivElement>(null);
  const advisorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch session data for the claimant name
  useEffect(() => {
    if (!session?.user || !sessionId) return;

    async function fetchSessionData() {
      try {
        const response = await fetch(`/api/reca/workflow/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const formData = data.recaFormData || {};
          const firstName = formData.claimantFirstName || "";
          setClaimantName(firstName);
          if (data.claimantId) setClaimantId(data.claimantId);
        }
      } catch {
        // Non-critical — page still works without name
      }
    }
    fetchSessionData();
  }, [session, sessionId]);

  const trackEvent = async (
    event: "calculator_visited" | "advisor_cta_clicked",
    source?: string
  ) => {
    if (!claimantId) return;
    try {
      await fetch("/api/financial-ed/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantId, event, source }),
      });
    } catch {
      // Non-critical
    }
  };

  const advisorUrl =
    "https://p4wealth.com?utm_source=radiantclaims&utm_medium=referral&utm_campaign=reca_financial_ed";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-terracotta-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Claim Journey Stepper */}
        <ClaimJourney currentStage="confirmation" />

        {/* Back link */}
        <Link
          href="/portal"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>

        {/* ── Section 1: Celebration Hero ── */}
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-3">
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">
            Your Claim Is on Its Way to the DOJ
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600">
            {claimantName ? `${claimantName}, you` : "You"} just completed a
            16-part federal application. That takes real determination — most
            people never finish. Now let&apos;s make sure your compensation
            works as hard as you did.
          </p>
        </section>

        {/* ── Section 2: Lump-Sum Stat ── */}
        <section className="mb-12">
          <Card className="rounded-2xl border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-terracotta-100 p-2">
                <Clock className="h-5 w-5 text-terracotta-600" />
              </div>
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">
                  Did You Know?
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Research shows that the majority of lump-sum recipients spend
                  their payment within 18 months — often before they&apos;ve had
                  time to think about what it could become. But you&apos;ve
                  already proven you&apos;re someone who plans ahead. You
                  didn&apos;t take shortcuts on your claim.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Section 3: Calculator ── */}
        <section
          id="calculator"
          ref={calculatorRef}
          className="mb-12 scroll-mt-24"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">
              What Could Your Compensation Become?
            </h2>
          </div>
          <p className="mb-6 text-sm text-slate-600">
            Drag the sliders to see how your money could grow over time. No
            sign-ups, no commitments — just math.
          </p>
          <CompoundInterestCalculator
            onCalculatorViewed={() => trackEvent("calculator_visited")}
          />
        </section>

        {/* ── Section 4: 3 Practical Tips ── */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sage-600" />
            <h2 className="text-xl font-bold text-slate-900">
              3 Things Worth Knowing
            </h2>
          </div>

          <div className="space-y-4">
            <Card className="rounded-xl border-sage-200 p-5">
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-sage-400">1</span>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">
                    The 90-Day Rule
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Financial advisors often recommend waiting at least 90 days
                    before making any major financial decisions after receiving
                    a lump sum. Give yourself time to think clearly about what
                    matters most to you and your family.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-sage-200 p-5">
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-sage-400">2</span>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">
                    RECA Payments Are Generally Not Taxable
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    RECA compensation is typically excluded from federal income
                    tax. The full amount is yours to work with. However, any
                    investment gains on that money may be taxable — it&apos;s
                    worth understanding the difference.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-sage-200 p-5">
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-sage-400">3</span>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">
                    Even Conservative Growth Adds Up
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    You don&apos;t need to be a risk-taker. Even a conservative
                    approach can turn $100,000 into significantly more over 10
                    or 20 years. Compound growth works in your favor if you give
                    it time.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Section 5: P4 Wealth Advisor ── */}
        <section id="advisor" ref={advisorRef} className="mb-12 scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Talk to Someone Who Specializes in This
            </h2>
          </div>

          <Card className="rounded-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              Some people prefer to figure things out on their own — and
              that&apos;s completely fine. Others like having a sounding board.
              If you&apos;re in the second group, we wanted you to know about a
              resource available to you.
            </p>

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">
                P4 Wealth
              </h3>
              <p className="mb-3 text-sm text-slate-600">
                P4 Wealth is a financial planning firm that works with RECA
                recipients. They understand your unique situation — from the tax
                implications of your compensation to building a plan that
                reflects what matters to your family.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Mail className="h-4 w-4 text-slate-400" />
                <a
                  href="mailto:darin.arnell@p4wealth.com"
                  className="font-medium text-terracotta-600 hover:underline"
                >
                  darin.arnell@p4wealth.com
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="gap-2 rounded-full"
                onClick={() => {
                  trackEvent("advisor_cta_clicked", "page_website");
                  window.open(advisorUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Visit P4 Wealth
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => {
                  trackEvent("advisor_cta_clicked", "page_email");
                  window.open(
                    "mailto:darin.arnell@p4wealth.com?subject=RECA%20Compensation%20Planning%20-%20RadiantClaims%20Referral",
                    "_self"
                  );
                }}
              >
                <Mail className="h-4 w-4" />
                Email Darin
              </Button>
            </div>
          </Card>

          {/* Disclosure */}
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs leading-relaxed text-amber-900">
              <strong>Disclosure:</strong> RadiantClaims has partnered with P4
              Wealth and may receive a referral fee. This does not affect the
              advice you receive or your cost. We only recommend firms
              we&apos;ve vetted and would use ourselves.
            </p>
          </div>
        </section>

        {/* ── Footer Disclosure ── */}
        <footer className="border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-400">
            The information on this page is for educational purposes only and
            does not constitute financial, investment, or tax advice. Consult a
            qualified professional before making financial decisions.
          </p>
        </footer>
      </div>
    </div>
  );
}

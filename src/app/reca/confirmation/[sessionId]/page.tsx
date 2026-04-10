"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClaimJourney } from "@/components/reca/ClaimJourney";

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const sessionId = params.sessionId as string;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Claim Journey — on the final step */}
        <ClaimJourney currentStage="confirmation" />

        {/* Celebration Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-sage-900">
            Your Claim Has Been Filed!
          </h1>
          <p className="text-lg text-sage-600">
            Congratulations — your RECA claim has been submitted to the
            Department of Justice. Here&apos;s what to expect next.
          </p>
        </div>

        {/* Timeline */}
        <Card className="mb-8 rounded-3xl border-2 border-sage-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Clock className="h-5 w-5 text-terracotta-500" />
              What Happens Now
            </CardTitle>
            <CardDescription>
              Typical timeline for RECA Downwinder claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                    ✓
                  </div>
                  <div className="mt-2 h-full w-0.5 bg-sage-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-emerald-800">
                    Claim Submitted
                  </p>
                  <p className="text-sm text-sage-600">
                    Your claim has been received by the DOJ RECA Program.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-terracotta-500 bg-white text-sm font-bold text-terracotta-600">
                    2
                  </div>
                  <div className="mt-2 h-full w-0.5 bg-sage-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-sage-900">
                    Acknowledgment Letter (2-4 weeks)
                  </p>
                  <p className="text-sm text-sage-600">
                    The DOJ will send a letter confirming they received your
                    claim and assigning a claim number.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sage-300 bg-white text-sm font-bold text-sage-400">
                    3
                  </div>
                  <div className="mt-2 h-full w-0.5 bg-sage-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-sage-900">
                    Review &amp; Possible Document Request (varies)
                  </p>
                  <p className="text-sm text-sage-600">
                    A claims examiner will review your submission. If you
                    e-filed, the DOJ may contact you to mail original or
                    certified copies of specific documents for verification.
                    Keep your originals safe.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sage-300 bg-white text-sm font-bold text-sage-400">
                    4
                  </div>
                  <div className="mt-2 h-full w-0.5 bg-sage-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-sage-900">
                    Decision (6-12 months typical)
                  </p>
                  <p className="text-sm text-sage-600">
                    The DOJ will issue a determination. Downwinder claims with
                    proper documentation have a 100% historical approval rate.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sage-300 bg-white text-sm font-bold text-sage-400">
                    5
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sage-900">
                    Payment ($100,000 tax-free)
                  </p>
                  <p className="text-sm text-sage-600">
                    Upon approval, the U.S. Treasury issues payment. This is
                    tax-free under federal law.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keep your documents safe */}
        <Card className="mb-8 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Shield className="h-8 w-8 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-2 font-semibold text-blue-900">
                  Keep Your Original Documents Safe
                </h3>
                <p className="text-sm text-blue-800">
                  If you filed electronically, the DOJ accepted your scanned
                  copies for initial processing. However, they may request
                  original or certified copies later to verify authenticity.
                  Store your originals in a safe place until your claim is
                  resolved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-8 rounded-3xl border-sage-200">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-sage-500" />
                <div>
                  <p className="text-sm font-medium text-sage-900">
                    RECA Program Hotline
                  </p>
                  <p className="text-sm text-sage-600">1-800-729-7327</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-sage-500" />
                <div>
                  <p className="text-sm font-medium text-sage-900">
                    Check Claim Status
                  </p>
                  <p className="text-sm text-sage-600">
                    Call the hotline with your claim number once you receive
                    your acknowledgment letter.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() =>
              router.push(`/reca/what-comes-next/${sessionId}` as any)
            }
            className="flex-1 gap-2 rounded-full bg-terracotta-500 py-6 text-base hover:bg-terracotta-600"
          >
            Plan for Your $100,000
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/portal")}
            className="flex-1 rounded-full border-sage-300 py-6 text-base text-sage-700 hover:bg-sage-50"
          >
            Return to Portal
          </Button>
        </div>
      </div>
    </div>
  );
}

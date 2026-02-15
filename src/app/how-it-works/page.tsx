import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How RadiantClaims Works",
  description:
    "Understand the RECA process and how RadiantClaims helps you prepare a complete Downwinder claim packet—forms, checklists, and document guidance.",
  alternates: { canonical: "/how-it-works" },
};
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  FileText,
  Scale,
  DollarSign,
  TrendingUp,
  Heart,
} from "lucide-react";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does RadiantClaims help with a RECA Downwinder claim?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RadiantClaims guides you through eligibility, the RECA form sections, and the document checklist so you can build a complete packet with the right proofs (residence, diagnosis, identity/relationship).",
      },
    },
    {
      "@type": "Question",
      name: "What are the main steps in the RECA process?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In general: confirm eligibility, complete the application form, request and gather supporting documents, and submit a complete packet. RadiantClaims helps you track progress and what documents are still needed.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to find hospitals and vital records offices myself?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can, but it’s time-consuming. RadiantClaims can help you identify where to request vital records and medical records, and what to ask for so your requests don’t get rejected.",
      },
    },
  ],
} as const;

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
            <Link href="/intake">
              <Button className="rounded-full bg-terracotta-500 px-8 py-6 hover:bg-terracotta-600">
                Start Claim Packet
              </Button>
            </Link>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-12">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-sage-900">
                How RadiantClaims Works
              </h1>
              <p className="text-xl text-sage-700">
                From document preparation to award—we guide you through every
                step
              </p>
              <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
            </div>

            {/* Process Flow */}
            <div className="relative space-y-8">
              {/* Step 1 */}
              <Card className="relative overflow-hidden rounded-3xl border-2 border-sage-200 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-2 bg-sage-600"></div>
                <CardHeader className="pl-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-600 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-sage-900">
                        Step 1: Eligibility Check
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        We verify you meet the RECA requirements
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <p className="mb-4 text-sage-700">
                    Start by completing our simple intake form. We'll check if
                    you (or your family member) meet the three key criteria:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        Lived in covered state during 1951-1962 testing period
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        Diagnosed with a covered primary cancer
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        Met latency requirement (2-5 years)
                      </span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm font-semibold text-sage-900">
                    This step is 100% free and creates no obligation.
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-terracotta-500" />
              </div>

              {/* Step 2 */}
              <Card className="relative overflow-hidden rounded-3xl border-2 border-peach-200 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-2 bg-peach-500"></div>
                <CardHeader className="pl-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-peach-500 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-sage-900">
                        Step 2: Document Upload & Preparation
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        We organize everything the DOJ needs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <p className="mb-4 text-sage-700">
                    Using our guided checklist, you'll upload:
                  </p>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        <strong>Proof of residence:</strong> School records,
                        church membership, tax documents, utility bills (need 2+
                        sources)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        <strong>Medical proof:</strong> Pathology reports,
                        discharge summaries, oncologist letters
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        <strong>Identity documents:</strong> Birth certificates,
                        marriage records, death certificates (if applicable)
                      </span>
                    </li>
                  </ul>
                  <p className="text-sage-700">
                    We review your documents for completeness and organize them
                    into a <strong>DOJ-ready packet</strong>—saving your
                    attorney hours of administrative work.
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-terracotta-500" />
              </div>

              {/* Step 3 */}
              <Card className="relative overflow-hidden rounded-3xl border-2 border-terracotta-200 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-2 bg-terracotta-500"></div>
                <CardHeader className="pl-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-500 text-white">
                      <Scale className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-sage-900">
                        Step 3: Attorney Review & Filing
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        Licensed RECA specialists represent you
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <p className="mb-4 text-sage-700">
                    Your complete packet is sent to our partner law firm, who:
                  </p>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-terracotta-600" />
                      <span className="text-sage-800">
                        Review your claim for compliance
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-terracotta-600" />
                      <span className="text-sage-800">
                        File your claim with the Department of Justice
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-terracotta-600" />
                      <span className="text-sage-800">
                        Respond to any DOJ requests for additional information
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-terracotta-600" />
                      <span className="text-sage-800">
                        Represent you throughout the approval process
                      </span>
                    </li>
                  </ul>
                  <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6">
                    <p className="text-sm font-semibold text-sage-900">
                      Attorney Fee (You Pay Directly to Law Firm):
                    </p>
                    <p className="mt-2 text-sm text-sage-800">
                      • <strong>2% of your award</strong> for initial successful
                      claims ($2,000 on a $100,000 award)
                    </p>
                    <p className="text-sm text-sage-800">
                      • Up to <strong>10% of your award</strong> for resubmitted
                      previously denied claims
                    </p>
                    <p className="mt-2 text-xs text-sage-700">
                      Fee cap set by federal statute (28 CFR 79.74)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-terracotta-500" />
              </div>

              {/* Step 4 */}
              <Card className="relative overflow-hidden rounded-3xl border-2 border-sage-200 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-2 bg-sage-600"></div>
                <CardHeader className="pl-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-600 text-white">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-sage-900">
                        Step 4: DOJ Review & Award
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        Receive your $100,000 tax-free payment
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <p className="mb-4 text-sage-700">
                    The Department of Justice reviews your claim and supporting
                    documentation. If approved:
                  </p>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        You receive a <strong>$100,000 tax-free payment</strong>{" "}
                        from the U.S. Treasury
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        Payment is typically issued within 60-90 days of
                        approval
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-sage-600" />
                      <span className="text-sage-800">
                        No federal income tax owed on RECA compensation
                      </span>
                    </li>
                  </ul>
                  <p className="text-sage-700">
                    If additional documentation is needed, your attorney will
                    work with you to provide it.
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-terracotta-500" />
              </div>

              {/* Step 5 */}
              <Card className="relative overflow-hidden rounded-3xl border-2 border-peach-200 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-2 bg-peach-500"></div>
                <CardHeader className="pl-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-peach-500 text-white">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-sage-900">
                        Step 5: Optional Financial Planning
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        Protect and grow your award (100% optional)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <p className="mb-4 text-sage-700">
                    After receiving your award, you may choose to work with our
                    trusted Registered Investment Adviser partners to:
                  </p>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        Preserve RECA funds while maintaining SSI/Medicaid
                        eligibility
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        Create long-term income strategies
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-1 h-5 w-5 text-peach-600" />
                      <span className="text-sage-800">
                        Build family legacy through ethical investment
                      </span>
                    </li>
                  </ul>
                  <div className="rounded-2xl bg-gradient-to-br from-cream-100 to-peach-50 p-6">
                    <p className="text-sm font-semibold text-sage-900">
                      Important:
                    </p>
                    <p className="mt-2 text-sm text-sage-700">
                      Financial planning is completely separate from your claim
                      filing and is <strong>100% optional</strong>. You are free
                      to manage your award however you choose.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Disclosures */}
            <Card className="mt-12 rounded-3xl border-2 border-cream-300 bg-gradient-to-br from-cream-50 to-peach-50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sage-900">
                  Important Legal Disclosures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-sage-700">
                  <strong>RadiantClaims is not a law firm.</strong> We provide
                  document preparation and administrative services only. We do
                  not provide legal advice or legal representation.
                </p>
                <p className="text-sage-700">
                  <strong>
                    Legal representation is provided by our partner law firm.
                  </strong>{" "}
                  Attorney fees are paid directly to the law firm and are capped
                  by federal statute at 2% for initial claims and up to 10% for
                  resubmitted claims.
                </p>
                <p className="text-sage-700">
                  <strong>Our service is free to claimants.</strong>{" "}
                  RadiantClaims is compensated by the law firm for
                  administrative services—not by you.
                </p>
                <p className="text-sage-700">
                  <strong>Referral to financial advisors is optional.</strong>{" "}
                  Financial planning services are separate from claim filing and
                  are provided by independent Registered Investment Advisers who
                  operate under a fiduciary standard.
                </p>
                <p className="text-sage-700">
                  <strong>Eligibility does not guarantee approval.</strong> All
                  claims are subject to review and approval by the Department of
                  Justice. We cannot guarantee claim outcomes.
                </p>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="mt-12 rounded-3xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 p-8 text-center text-white shadow-lg">
              <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mb-6 text-lg text-terracotta-50">
                Start with our eligibility check, then choose between affordable
                DIY service or no-upfront-cost legal representation.
              </p>
              <Link href="/intake">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-8 py-6 text-lg font-semibold text-terracotta-600 hover:bg-cream-50"
                >
                  Start Your Claim Packet →
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-20 border-t border-cream-200 bg-white py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
                  <Heart className="h-4 w-4 text-white" fill="white" />
                </div>
                <span className="font-semibold text-sage-800">
                  RadiantClaims
                </span>
              </div>
              <p className="text-sm text-sage-600">
                &copy; 2024 RadiantClaims. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <Link
                  href={"/terms" as any}
                  className="text-sage-600 transition-colors hover:text-terracotta-600"
                >
                  Terms
                </Link>
                <Link
                  href={"/privacy" as any}
                  className="text-sage-600 transition-colors hover:text-terracotta-600"
                >
                  Privacy
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
      </div>
    </>
  );
}

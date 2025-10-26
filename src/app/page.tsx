import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart, FileText, Users, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Nav */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-sage-300 text-sage-700">
              Admin Login
            </Button>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section - Warm & Welcoming */}
        <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-peach-50 to-cream-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-block rounded-full bg-terracotta-100 px-6 py-2 text-sm font-medium text-terracotta-700">
                Filing Deadline: December 31, 2027
              </div>
              <h1 className="mb-6 text-5xl font-bold leading-tight text-sage-900 md:text-6xl">
                Your Family Deserves This Benefit
              </h1>
              <p className="mb-4 text-xl leading-relaxed text-sage-700">
                We help families affected by nuclear testing access their{" "}
                <span className="font-semibold text-terracotta-600">
                  $100,000 RECA compensation
                </span>
                —with compassion, expertise, and{" "}
                <span className="font-semibold">zero cost to you</span>.
              </p>
              <p className="mb-10 text-lg text-sage-600">
                We prepare your documents. Partner attorneys handle the filing.
                You keep 98% of your award.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/intake">
                  <Button
                    size="lg"
                    className="rounded-full bg-terracotta-500 px-8 py-6 text-lg font-medium shadow-lg hover:bg-terracotta-600"
                  >
                    Start Your Free Claim Packet
                  </Button>
                </Link>
                <Link href="/eligibility">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-2 border-sage-300 px-8 py-6 text-lg font-medium text-sage-700 hover:bg-sage-50"
                  >
                    Check Eligibility
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-sage-600">
                <strong>Important:</strong> RadiantClaims provides document
                preparation only. Legal representation is provided by our partner
                law firm. We are not your attorney.
              </p>
            </div>
          </div>
          {/* Decorative Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                fill="rgb(250, 247, 243)"
              />
            </svg>
          </div>
        </section>

        {/* What is RECA - Warm Education Section */}
        <section className="bg-cream-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-4xl font-bold text-sage-900">
                  What is RECA?
                </h2>
                <div className="mx-auto h-1 w-24 rounded-full bg-terracotta-400"></div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
                <p className="mb-6 text-lg leading-relaxed text-sage-700">
                  The <strong>Radiation Exposure Compensation Act (RECA)</strong>{" "}
                  is a federal program that provides{" "}
                  <span className="font-semibold text-terracotta-600">
                    $100,000 tax-free payments
                  </span>{" "}
                  to individuals exposed to radiation from U.S. nuclear testing
                  between 1951-1962.
                </p>
                <p className="mb-8 text-lg leading-relaxed text-sage-700">
                  Recently expanded in July 2025, the program now covers{" "}
                  <strong>all of Utah, Idaho, and New Mexico</strong>, plus
                  specified counties in Arizona and Nevada. Tens of thousands of
                  families may now qualify who didn't before.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl bg-gradient-to-br from-terracotta-50 to-peach-50 p-6 text-center">
                    <div className="mb-3 text-3xl font-bold text-terracotta-600">
                      $100,000
                    </div>
                    <div className="text-sm text-sage-700">
                      Tax-free compensation per eligible claimant
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6 text-center">
                    <div className="mb-3 text-3xl font-bold text-sage-700">
                      Dec 31, 2027
                    </div>
                    <div className="text-sm text-sage-700">
                      Filing deadline for all claims
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-peach-50 to-cream-100 p-6 text-center">
                    <div className="mb-3 text-3xl font-bold text-terracotta-600">
                      2%
                    </div>
                    <div className="text-sm text-sage-700">
                      Attorney fee cap (federal statute)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Help - Compassionate Services */}
        <section className="bg-gradient-to-br from-sage-50 to-cream-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-4xl font-bold text-sage-900">
                  How We Help Your Family
                </h2>
                <div className="mx-auto h-1 w-24 rounded-full bg-terracotta-400"></div>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
                      <FileText className="h-8 w-8 text-terracotta-600" />
                    </div>
                    <CardTitle className="text-sage-900">
                      Document Preparation
                    </CardTitle>
                    <CardDescription className="text-sage-600">
                      We guide you through every step
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm leading-relaxed text-sage-700">
                      Gather proof of residence, medical records, and identity
                      documents with our caring guidance. We organize everything
                      into a complete, DOJ-ready packet.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
                      <Users className="h-8 w-8 text-sage-600" />
                    </div>
                    <CardTitle className="text-sage-900">
                      Attorney Partnership
                    </CardTitle>
                    <CardDescription className="text-sage-600">
                      Licensed RECA specialists handle filing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm leading-relaxed text-sage-700">
                      Work with experienced attorneys who file your claim under
                      the 2% federal fee cap. We prep your packet so they can
                      focus on getting you approved.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-peach-100">
                      <TrendingUp className="h-8 w-8 text-peach-600" />
                    </div>
                    <CardTitle className="text-sage-900">
                      Post-Award Support
                    </CardTitle>
                    <CardDescription className="text-sage-600">
                      Optional financial planning services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm leading-relaxed text-sage-700">
                      Connect with trusted financial advisors to protect your
                      award and build long-term security—while maintaining benefit
                      eligibility.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Eligibility Quick Check - Warm & Accessible */}
        <section className="bg-cream-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-8 shadow-sm md:p-12">
                <h2 className="mb-6 text-3xl font-bold text-sage-900">
                  Am I Eligible?
                </h2>
                <p className="mb-6 text-lg text-sage-700">
                  You may qualify if you (or a deceased family member):
                </p>
                <div className="mb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
                      ✓
                    </div>
                    <div className="text-sage-800">
                      <strong>Lived</strong> in Utah, Idaho, New Mexico, Arizona,
                      or Nevada for at least 1 year between January 1951 -
                      November 1962
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
                      ✓
                    </div>
                    <div className="text-sage-800">
                      <strong>Diagnosed</strong> with a covered cancer (leukemia,
                      thyroid, breast, lung, colon, brain, and others)
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
                      ✓
                    </div>
                    <div className="text-sage-800">
                      <strong>Cancer appeared</strong> at least 5 years after
                      exposure (2 years for leukemia)
                    </div>
                  </div>
                </div>
                <Link href="/eligibility">
                  <Button className="w-full rounded-full bg-sage-600 py-6 text-lg font-medium hover:bg-sage-700 sm:w-auto">
                    See Full Eligibility Criteria →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Program - Community Focused */}
        <section className="bg-gradient-to-br from-peach-50 via-cream-50 to-terracotta-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
              <div className="mb-6 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
                  <Heart className="h-8 w-8 text-terracotta-600" />
                </div>
              </div>
              <h2 className="mb-4 text-center text-3xl font-bold text-sage-900">
                Know Someone Who May Qualify?
              </h2>
              <p className="mb-8 text-center text-lg leading-relaxed text-sage-700">
                Help us connect eligible families and receive $50 when their claim
                packet is approved by the Department of Justice. Every referral
                helps a family access the benefits they deserve.
              </p>
              <div className="flex justify-center">
                <Link href="/referral-program">
                  <Button
                    variant="outline"
                    className="rounded-full border-2 border-terracotta-400 px-8 py-6 text-lg font-medium text-terracotta-700 hover:bg-terracotta-50"
                  >
                    Learn About Referral Rewards →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-cream-200 bg-white py-12">
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
                href="/terms"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                Privacy Policy
              </Link>
              <Link
                href="/how-it-works"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

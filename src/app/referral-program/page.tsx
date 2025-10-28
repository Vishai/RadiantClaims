import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Users, FileCheck, Gift, Heart } from "lucide-react";

export default function ReferralProgramPage() {
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
          <Link href="/intake">
            <Button className="rounded-full bg-terracotta-500 px-8 py-6 hover:bg-terracotta-600">
              Start Claim Packet
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-terracotta-100 to-peach-100">
              <Gift className="h-8 w-8 text-terracotta-600" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-sage-900">
              Referral Rewards Program
            </h1>
            <p className="text-xl text-sage-700">
              Help us connect eligible families and earn $50 per approved claim
            </p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
          </div>

          {/* How It Works */}
          <Card className="mb-8 rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-sage-900">How Referral Rewards Work</CardTitle>
              <CardDescription className="text-sage-600">
                It's simple—and every referral helps a family access their benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-sage-900">
                      Submit a Referral
                    </h3>
                    <p className="text-sage-700">
                      Know someone who lived in Utah, Idaho, New Mexico, Arizona,
                      or Nevada during the 1951-1962 nuclear testing period? Share
                      their basic contact information with us.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-sage-900">
                      We Guide Them Through
                    </h3>
                    <p className="text-sage-700">
                      Our team reaches out and helps them complete their claim
                      packet—completely free. We handle all the document prep and
                      attorney coordination.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-sage-900">
                      Earn $50 When Approved
                    </h3>
                    <p className="text-sage-700">
                      If the Department of Justice approves their claim and issues
                      the $100,000 award, you receive <strong>$50</strong> as a
                      thank-you for connecting us with an eligible family.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mb-12">
            <h2 className="mb-6 text-center text-2xl font-bold text-sage-900">
              Why Refer Families to RadiantClaims?
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <Users className="mb-2 h-8 w-8 text-sage-600" />
                  <CardTitle className="text-sage-900">Help Your Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-sage-700">
                    Many eligible families don't know about RECA or feel
                    overwhelmed by the process. Your referral connects them with
                    expert help—100% free.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <DollarSign className="mb-2 h-8 w-8 text-terracotta-600" />
                  <CardTitle className="text-sage-900">Earn Fair Compensation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-sage-700">
                    Receive $50 for every approved claim you refer. This is paid
                    by RadiantClaims, not deducted from the family's award.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <FileCheck className="mb-2 h-8 w-8 text-peach-600" />
                  <CardTitle className="text-sage-900">No Work Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-sage-700">
                    Simply provide contact info. We handle everything else—from
                    eligibility screening to document prep to attorney filing.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <Gift className="mb-2 h-8 w-8 text-terracotta-500" />
                  <CardTitle className="text-sage-900">Life-Changing Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-sage-700">
                    A $100,000 award can mean financial security, medical care,
                    education for grandchildren, or peace of mind for aging parents.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Terms & Conditions */}
          <Card className="mb-8 rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sage-900">Referral Program Terms</CardTitle>
              <CardDescription className="text-sage-600">
                Please review these requirements carefully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-sage-700">
              <div>
                <h4 className="mb-2 font-semibold text-sage-900">Eligibility:</h4>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Referrer must be 18+ years old and a U.S. citizen or resident</li>
                  <li>Cannot refer yourself or members of your immediate household</li>
                  <li>Referred individual must complete full intake process</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-sage-900">Payment:</h4>
                <ul className="ml-6 list-disc space-y-1">
                  <li>
                    Bonus paid <strong>only after</strong> the Department of Justice
                    approves the claim and issues the $100,000 award
                  </li>
                  <li>Payment made within 30 days of award notification</li>
                  <li>
                    Amount: <strong>$50</strong> per approved claim (paid by
                    RadiantClaims, not from claimant's award)
                  </li>
                  <li>
                    W-9 form required; 1099 issued if total payments exceed $600 in
                    a calendar year
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-sage-900">Prohibitions:</h4>
                <ul className="ml-6 list-disc space-y-1">
                  <li>
                    Referrer may not engage in unauthorized practice of law or
                    provide legal advice
                  </li>
                  <li>
                    Referrer may not misrepresent RadiantClaims' services or
                    guarantee claim approval
                  </li>
                  <li>
                    Referrer may not share confidential information about referred
                    individuals
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-sage-900">Data & Privacy:</h4>
                <ul className="ml-6 list-disc space-y-1">
                  <li>
                    Referred individual's data will only be used for RECA claim
                    processing
                  </li>
                  <li>
                    Referrer information kept confidential unless consent is
                    provided
                  </li>
                  <li>All parties must consent to data sharing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Legal Disclaimer */}
          <Card className="mb-8 rounded-3xl border-2 border-cream-300 bg-gradient-to-br from-cream-50 to-peach-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sage-900">Important Legal Disclosures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-sage-700">
              <p>
                <strong>No attorney-client relationship is formed by referring someone.</strong>{" "}
                You are not providing legal services or legal representation.
              </p>
              <p>
                <strong>Referral bonus is paid by RadiantClaims only.</strong> This
                is a marketing incentive, not a share of attorney fees or legal
                services compensation.
              </p>
              <p>
                <strong>No guarantee of approval.</strong> Payment is contingent
                upon DOJ approval of the claim. Eligibility does not guarantee award.
              </p>
              <p>
                <strong>Tax implications.</strong> Referral bonuses are taxable
                income. Consult a tax professional for guidance.
              </p>
              <p>
                <strong>Program modifications.</strong> RadiantClaims reserves the
                right to modify or discontinue the referral program at any time with
                notice.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="rounded-3xl bg-gradient-to-br from-sage-600 to-sage-700 p-8 text-center text-white shadow-lg">
            <h2 className="mb-4 text-3xl font-bold">Ready to Refer a Family?</h2>
            <p className="mb-6 text-lg text-sage-50">
              Help us connect eligible individuals with the benefits they deserve.
            </p>
            <Link href="/intake">
              <Button
                size="lg"
                className="rounded-full bg-white px-8 py-6 text-lg font-semibold text-sage-700 hover:bg-cream-50"
              >
                Submit a Referral →
              </Button>
            </Link>
            <p className="mt-4 text-sm text-sage-100">
              Questions? Email us at referrals@radiantclaims.com
            </p>
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
              <span className="font-semibold text-sage-800">RadiantClaims</span>
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

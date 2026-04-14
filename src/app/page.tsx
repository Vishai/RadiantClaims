import type { Metadata } from "next";
import Link from "next/link";
import { DOJStickyBanner } from "@/components/landing/DOJStickyBanner";
import { BacklogRaceSection } from "@/components/landing/BacklogRaceSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { AuthNavLink } from "@/components/landing/AuthNavLink";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { getBetaPricing } from "@/lib/constants/beta-config";
import { BetaBanner, BetaBadge, BetaPrice } from "@/components/BetaBanner";

export const metadata: Metadata = {
  title: "RECA Claim Preparation for Downwinders",
  description:
    "Check RECA eligibility and prepare your Downwinder claim packet step-by-step. We help you gather the right documents and submit a complete application.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const diyBeta = getBetaPricing(499);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RadiantClaims",
    url: "https://www.radiantclaims.com",
    description:
      "Check RECA eligibility and prepare your Downwinder claim packet step-by-step. We help you gather the right documents and submit a complete application.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.radiantclaims.com/eligibility-check",
    },
  };

  return (
    <div className="min-h-screen bg-[#FFFBF9]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <BetaBanner />
      {/* Sticky Alert Banner */}
      <DOJStickyBanner />

      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D65F4D] text-lg font-bold text-white">
            ♥
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            RadiantClaims
          </span>
        </div>
        <AuthNavLink />
      </nav>

      {/* Hero Section */}
      <header className="mx-auto mb-12 mt-8 max-w-4xl px-4 text-center md:mt-16">
        <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">
          RECA Compensation
        </div>
        <span className="mb-4 inline-block rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
          Eligibility Expanded (July 2025)
        </span>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
          $100,000 Tax-Free.
          <br />
          <span className="text-[#D65F4D]">Apology Accepted.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
          The U.S. government owes compensation to families affected by nuclear
          testing ("Downwinders"). We help you fast-track the paperwork so you
          don't get stuck in the federal backlog.
        </p>

        <div className="flex flex-col justify-center gap-4 md:flex-row">
          <Link href="/eligibility-check">
            <button className="transform rounded-full bg-[#D65F4D] px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#c04e3d]">
              Check My Eligibility
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="rounded-full border border-gray-200 bg-white px-8 py-4 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
              How it Works
            </button>
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          No credit card required • 2-minute check
        </p>
      </header>

      {/* Backlog Race Section */}
      <BacklogRaceSection />

      {/* Social Proof & Credibility */}
      <SocialProof />

      {/* What is RECA - Clean Explanation */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            What is RECA?
          </h2>
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-12">
            <p className="mb-6 text-lg leading-relaxed text-gray-700">
              The <strong>Radiation Exposure Compensation Act (RECA)</strong> is
              a federal program that provides{" "}
              <span className="font-bold text-[#D65F4D]">
                $100,000 tax-free payments
              </span>{" "}
              to individuals exposed to radiation from U.S. nuclear testing
              between 1951-1962.
            </p>
            <p className="mb-8 text-lg leading-relaxed text-gray-700">
              Recently expanded in July 2025, the program now covers{" "}
              <strong>all of Utah, Idaho, and New Mexico</strong>, plus
              specified counties in Arizona and Nevada. Tens of thousands of
              families may now qualify who didn't before.
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-orange-50 p-6 text-center">
                <div className="mb-2 text-4xl font-extrabold text-[#D65F4D]">
                  $100,000
                </div>
                <div className="text-sm text-gray-600">
                  Tax-free compensation per eligible claimant
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <div className="mb-2 text-4xl font-extrabold text-gray-900">
                  Dec 31, 2027
                </div>
                <div className="text-sm text-gray-600">
                  Filing deadline for all claims
                </div>
              </div>
              <div className="rounded-xl bg-orange-50 p-6 text-center">
                <div className="mb-2 text-4xl font-extrabold text-[#D65F4D]">
                  2%
                </div>
                <div className="text-sm text-gray-600">
                  Attorney fee cap (federal statute)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="mx-auto mb-24 grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Do you qualify?
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Residency</h4>
                <p className="text-sm text-gray-600">
                  Lived in UT, ID, NM, AZ, or NV for at least 1 year between
                  1951-1962.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Diagnosis</h4>
                <p className="text-sm text-gray-600">
                  Diagnosed with a covered cancer (leukemia, thyroid, lung,
                  colon, etc) after exposure.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Family Status</h4>
                <p className="text-sm text-gray-600">
                  You can file for yourself{" "}
                  <strong>or a deceased family member</strong> (spouse, parent,
                  grandparent).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            Not sure if you qualify?
          </h3>
          <p className="mb-6 text-gray-600">
            The rules are complex, but checking takes 2 minutes. We
            cross-reference your details against DOJ maps and medical lists
            instantly.
          </p>
          <Link href="/eligibility-check">
            <button className="w-full rounded-lg bg-gray-900 py-3 font-bold text-white transition hover:bg-gray-800">
              Take the 2-Minute Quiz
            </button>
            {/* min-h-44 inherited from py-3 + font-bold line-height — already meets 44px tap target */}
          </Link>
        </div>
      </section>

      {/* Why RadiantClaims — the "why not file direct?" answer */}
      <section className="border-t border-gray-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">
              Why RadiantClaims
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              You could file directly with the DOJ.
              <br />
              <span className="text-[#D65F4D]">
                Here&apos;s what that looks like without us.
              </span>
            </h2>
            <p className="text-lg text-gray-600">
              Filing on justice.gov is free — and hard. We built the shortcut so
              you don&apos;t lose paperwork, time, or your place in the backlog.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Personalized checklist */}
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#D65F4D]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M12 11h4" />
                  <path d="M12 16h4" />
                  <path d="M8 11h.01" />
                  <path d="M8 16h.01" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Personalized document checklist
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                We tailor the required-document list to your state,
                relationship, and diagnosis as you answer questions. No 100-page
                DOJ guide to sort through.
              </p>
              <div className="rounded-lg border border-gray-200 bg-white/60 p-3 text-xs">
                <p className="font-semibold text-gray-500">Filing direct:</p>
                <p className="text-gray-600">
                  Read the full DOJ guidance and figure out which items apply to
                  you.
                </p>
              </div>
            </div>

            {/* Card 2: Chrome extension (the hero card) */}
            <div className="rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white p-6 shadow-md ring-1 ring-purple-100">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.707l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
                  </svg>
                </div>
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Our edge
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Chrome extension fills the DOJ forms for you
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Our Filing Assistant for Chrome types your saved answers
                directly into justice.gov and tells you exactly which tab each
                document belongs in. Zero retyping. Zero guessing.
              </p>
              <div className="rounded-lg border border-gray-200 bg-white/60 p-3 text-xs">
                <p className="font-semibold text-gray-500">Filing direct:</p>
                <p className="text-gray-600">
                  Manually retype every answer into justice.gov and guess which
                  tab each document belongs in.
                </p>
              </div>
            </div>

            {/* Card 3: Plain English + save & resume */}
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Plain-English questions, save &amp; resume
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Our wizard translates DOJ legalese into questions anyone can
                answer. Save progress at any time, come back later, and invite
                family to help.
              </p>
              <div className="rounded-lg border border-gray-200 bg-white/60 p-3 text-xs">
                <p className="font-semibold text-gray-500">Filing direct:</p>
                <p className="text-gray-600">
                  Wade through dense legal language alone. No save feature. No
                  family collaboration.
                </p>
              </div>
            </div>
          </div>

          {/* Closing line + link to service tiers */}
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-sm text-gray-500">
              We prep. DOJ files. The Chrome extension is the bridge between
              them.
            </p>
            <a
              href="#how-it-works"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#D65F4D] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#c04e3d]"
            >
              See pricing →
            </a>
          </div>
        </div>
      </section>

      {/* Two Ways to Claim - Updated Pricing */}
      <section
        className="border-t border-gray-100 bg-white py-20"
        id="how-it-works"
      >
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Two Ways to Claim Your $100k
          </h2>
          <p className="mb-4 text-base text-gray-600">
            Pick the path that fits your situation. You can always switch later.
          </p>
          <TrackedLink
            href="/service-tiers"
            ctaName="see-full-comparison"
            location="homepage-two-ways"
            className="mb-12 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D65F4D] underline-offset-4 hover:underline"
          >
            See the full side-by-side comparison →
          </TrackedLink>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* DIY Prep */}
            <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-[#D65F4D]"></div>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <BetaBadge />
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                  Accuracy Guaranteed
                </span>
              </div>
              <h3 className="mb-2 mt-6 text-xl font-bold text-gray-900">
                Fast-Track Self-Filing
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                Best for clear medical/work history.
              </p>
              <div className="mb-1 text-4xl font-extrabold text-gray-900">
                <BetaPrice
                  originalPrice={499}
                  discountedPrice={diyBeta.finalPrice}
                  className="text-4xl font-extrabold text-gray-900"
                />
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
                  <span className="text-green-500">✓</span>
                  <span>
                    <strong>Chrome extension auto-fills the DOJ forms</strong>{" "}
                    and routes each document to the right portal tab
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Personalized
                  document checklist — tailored to your state, relationship, and
                  disease
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Plain-English
                  questions, save &amp; resume any time
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Pre-filled medical
                  records request letters
                </li>
                <li className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <span className="text-xl text-blue-600">↺</span>
                  <div>
                    <strong className="text-blue-900">
                      Lifetime Upgrade Credit
                    </strong>
                    <span className="text-gray-700">
                      {" "}
                      — <strong className="text-blue-700">
                        100% applied
                      </strong>{" "}
                      if you switch to legal
                    </span>
                  </div>
                </li>
              </ul>
              <Link href="/eligibility-check">
                <button className="mb-3 w-full rounded-xl border-2 border-gray-900 py-3 font-bold text-gray-900 transition hover:bg-gray-50 hover:text-black">
                  Start Free Assessment
                </button>
              </Link>
              <div className="text-center text-xs leading-relaxed text-gray-500">
                <span className="mr-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white">
                  i
                </span>
                <strong>Risk-Free Filing:</strong> We verify your eligibility
                before you pay. If denied or you need help later, upgrade to
                full legal representation and apply your payment as a credit.
              </div>
            </div>

            {/* Legal Representation */}
            <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-blue-600"></div>
              <div className="absolute right-4 top-4">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                  $0 Upfront
                </span>
              </div>
              <h3 className="mb-2 mt-6 text-xl font-bold text-gray-900">
                Full Legal Representation
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                We partner with Heritage Law. Pay nothing unless you win.
              </p>
              <div className="mb-1 text-4xl font-extrabold text-gray-900">
                $0
                <span className="text-lg font-normal text-gray-500">
                  {" "}
                  Upfront
                </span>
              </div>
              <p className="mb-6 text-sm font-bold text-blue-700">
                2% paid only when you win
              </p>

              <ul className="mb-8 flex-grow space-y-3 text-left text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>{" "}
                  <strong>Attorney handles all DOJ communication</strong> on
                  your behalf
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Professional
                  attorney review of your claim before submission
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Attorney files your
                  claim with the DOJ
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Denials, appeals &
                  resubmissions handled for you
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Complex case
                  experience — missing records, multi-state exposure, unusual
                  histories
                </li>
                <li className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <span className="text-xl text-blue-600">⚖</span>
                  <div>
                    <strong className="text-blue-900">
                      No-risk fee structure
                    </strong>
                    <span className="text-gray-700">
                      {" "}
                      — Pay{" "}
                      <strong className="text-blue-700">nothing upfront</strong>
                      . Just 2% (≈$2,000) from your $100k when the DOJ pays out.
                    </span>
                  </div>
                </li>
              </ul>
              <Link href="/service-tiers">
                <button className="mb-3 w-full rounded-xl bg-[#D65F4D] py-3 font-bold text-white transition hover:bg-[#c04e3d]">
                  Start Legal Check
                </button>
              </Link>
              <div className="text-center text-xs leading-relaxed text-gray-500">
                <span className="mr-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                  ⚖
                </span>
                <strong>Pay only when you win:</strong> You upload your
                documents and provide information when needed. The attorney
                handles the DOJ — filings, communications, and any appeals — and
                you owe nothing unless the claim is paid out.
              </div>
            </div>
          </div>

          {/* Which path is right for you? */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
              Not sure which path is right?
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              Both get you to the same $100k award. The difference is how
              hands-on you want to be.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#D65F4D]">
                  Choose Self-Filing if…
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-[#D65F4D]">→</span>
                    <span>You&apos;re filing for yourself</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D65F4D]">→</span>
                    <span>Your records are already in hand</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D65F4D]">→</span>
                    <span>You want to keep 100% of the award</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D65F4D]">→</span>
                    <span>You&apos;d rather move fast than hand it off</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-700">
                  Choose Legal Representation if…
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>You want zero upfront cost</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>You&apos;d rather an attorney deal with the DOJ</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>You&apos;re filing for a deceased family member</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>Records are missing, scattered, or complicated</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help - Streamlined Services */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            How We Help Your Family
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Document Preparation */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-8 w-8 text-[#D65F4D]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-center text-xl font-bold text-gray-900">
                Document Preparation
              </h3>
              <p className="text-center leading-relaxed text-gray-600">
                We guide you through gathering proof of residence, medical
                records, and identity documents. Everything is organized and
                ready for DOJ submission.
              </p>
            </div>

            {/* Status Tracking */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-8 w-8 text-[#D65F4D]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-center text-xl font-bold text-gray-900">
                Real-Time Tracking
              </h3>
              <p className="text-center leading-relaxed text-gray-600">
                Monitor your claim's progress through our dashboard. See exactly
                where you are in the DOJ queue and receive updates
                automatically.
              </p>
            </div>

            {/* Legal Partnership */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-8 w-8 text-[#D65F4D]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-center text-xl font-bold text-gray-900">
                Legal Support Available
              </h3>
              <p className="text-center leading-relaxed text-gray-600">
                Choose to work with Heritage Law Offices for full legal
                representation. They handle everything while you focus on your
                family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-400">
          <p className="mb-4">
            &copy; 2024 RadiantClaims. All rights reserved.
          </p>
          <p className="mx-auto max-w-2xl">
            Disclaimer: RadiantClaims provides document preparation services
            only. We are not a law firm. Legal services provided by Heritage Law
            Offices.
          </p>
        </div>
      </footer>
    </div>
  );
}

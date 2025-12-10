import Link from "next/link";
import { DOJStickyBanner } from "@/components/landing/DOJStickyBanner";
import { BacklogRaceSection } from "@/components/landing/BacklogRaceSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFBF9]">
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
        <Link href="/login">
          <button className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Login
          </button>
        </Link>
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
          </Link>
        </div>
      </section>

      {/* Two Ways to Claim - Updated Pricing */}
      <section
        className="border-t border-gray-100 bg-white py-20"
        id="how-it-works"
      >
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-12 text-3xl font-bold text-gray-900 md:text-4xl">
            Two Ways to Claim Your $100k
          </h2>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* DIY Prep */}
            <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-[#D65F4D]"></div>
              <span className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                Accuracy Guaranteed
              </span>
              <h3 className="mb-2 mt-6 text-xl font-bold text-gray-900">
                Fast-Track Self-Filing
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                Best for clear medical/work history.
              </p>
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
                  <span className="text-green-500">✓</span> Complete RECA form
                  auto-filled & ready to sign
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Document checklist &
                  organization system
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Step-by-step filing
                  instructions for DOJ
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
                full legal representation and apply your $499 as a credit.
              </div>
            </div>

            {/* Legal Representation */}
            <div className="relative flex flex-col rounded-3xl border border-gray-200 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <span className="absolute right-4 top-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                $0 Upfront Cost
              </span>
              <h3 className="mb-2 mt-6 text-xl font-bold text-gray-900">
                Full Legal Representation
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                We partner with Heritage Law.
              </p>
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
                  <span className="text-green-500">✓</span>{" "}
                  <strong>Attorney reviews & submits to DOJ</strong>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Full legal
                  representation throughout claim process
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Resubmission help if
                  initially denied
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span> Direct communication
                  with DOJ on your behalf
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>{" "}
                  <strong>Pay only 2% when you win</strong> ($2,000 from award)
                </li>
              </ul>
              <Link href="/service-tiers">
                <button className="w-full rounded-xl bg-[#D65F4D] py-3 font-bold text-white transition hover:bg-[#c04e3d]">
                  Start Legal Check
                </button>
              </Link>
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

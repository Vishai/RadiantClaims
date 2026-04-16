import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of RadiantClaims document preparation services.",
  alternates: { canonical: "/terms" },
};

export default function TermsOfServicePage() {
  const effectiveDate = "April 14, 2026";

  return (
    <div className="min-h-screen bg-cream-50">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-terracotta-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-sage-900">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-sage-600">
          Effective date: {effectiveDate}
        </p>

        <div className="prose prose-sage max-w-none space-y-6 text-sage-800">
          <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              Important — please read carefully.
            </p>
            <p className="mt-2 text-sm text-amber-900">
              <strong>RadiantClaims is not a law firm.</strong> We provide
              document preparation services only. We do not provide legal
              advice, and nothing on this Service constitutes legal advice. Your
              use of the Service does not create an attorney-client
              relationship. If you need legal advice or representation, please
              consult a licensed attorney — our Legal Representation path can
              connect you with Heritage Law Offices.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              1. Acceptance of these terms
            </h2>
            <p className="mt-3">
              These Terms of Service (&quot;<strong>Terms</strong>&quot;) govern
              your access to and use of the RadiantClaims website at{" "}
              <a
                href="https://www.radiantclaims.com"
                className="text-terracotta-600 underline"
              >
                radiantclaims.com
              </a>{" "}
              and our related services (together, the &quot;
              <strong>Service</strong>&quot;). By creating an account or using
              the Service, you agree to these Terms and our{" "}
              <Link href="/privacy" className="text-terracotta-600 underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
            <p className="mt-3">
              You must be at least 18 years old to use the Service.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              2. What the Service does
            </h2>
            <p className="mt-3">
              RadiantClaims provides software-based document preparation
              services for the federal Radiation Exposure Compensation Act
              (&quot;RECA&quot;) program. Specifically, we help you:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Complete a plain-English intake wizard that collects the
                information required for a RECA claim;
              </li>
              <li>
                Organize and upload supporting documents (birth, death, marriage
                certificates, medical records, proof of presence, etc.);
              </li>
              <li>
                Generate a prepared claim packet based on the information you
                provide;
              </li>
              <li>
                Optionally, install and use our Chrome extension to auto-fill
                your answers into the official DOJ filing portal at justice.gov
                when you are ready to submit;
              </li>
              <li>
                Connect you, at your election, with Heritage Law Offices for
                full legal representation under a separate engagement.
              </li>
            </ul>
            <p className="mt-3">
              <strong>What the Service does not do:</strong>
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Provide legal advice, legal representation, or any form of
                attorney-client services;
              </li>
              <li>
                Guarantee that your RECA claim will be approved, paid, or
                processed within any particular timeframe;
              </li>
              <li>
                File your claim with the U.S. Department of Justice on your
                behalf — the DOJ filing is an action you take yourself, either
                directly or with the assistance of an attorney you engage
                separately;
              </li>
              <li>
                Serve as a substitute for the professional judgment of a
                licensed attorney.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              3. Your account
            </h2>
            <p className="mt-3">
              You are responsible for the accuracy of the information you
              provide, including the information you enter into the claim
              preparation wizard and the documents you upload. You are
              responsible for maintaining the confidentiality of your login
              credentials and for all activity that occurs under your account.
              Notify us immediately of any unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              4. Payments, refunds, and beta pricing
            </h2>
            <p className="mt-3">
              Our current pricing and any promotional or beta discounts are
              displayed on our{" "}
              <Link
                href="/service-tiers"
                className="text-terracotta-600 underline"
              >
                service tiers page
              </Link>
              . Unless otherwise stated, fees are one-time and non-recurring.
              Payments are processed by Stripe, Inc.
            </p>
            <p className="mt-3">
              <strong>7-day money-back guarantee.</strong> If you are not
              satisfied with the Service, you may request a full refund within
              seven (7) days of your purchase, provided that you have not
              already downloaded your completed claim packet. After that period,
              or after download, fees are non-refundable. To request a refund,
              contact us via the{" "}
              <Link href="/contact" className="text-terracotta-600 underline">
                Contact page
              </Link>
              .
            </p>
            <p className="mt-3">
              <strong>Legal Representation path.</strong> If you elect the Legal
              Representation path and engage Heritage Law Offices, Heritage Law
              Offices will charge a fee equal to 2% of any RECA award you
              receive, payable only if you receive an award. RadiantClaims does
              not charge a separate fee for users on the Legal Representation
              path.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              5. Your content and our license to process it
            </h2>
            <p className="mt-3">
              You retain all rights to the information and documents you submit
              to the Service (&quot;Your Content&quot;). You grant RadiantClaims
              a limited, non-exclusive, worldwide, royalty-free license to use,
              store, process, and display Your Content solely for the purpose of
              providing the Service to you, including generating your claim
              packet, providing technical support, and sharing Your Content with
              the DOJ, Heritage Law Offices, or family collaborators when you
              direct us to.
            </p>
            <p className="mt-3">
              You represent and warrant that Your Content is accurate, that you
              have the right to provide it, and that it does not violate any law
              or infringe any third party&apos;s rights.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              6. Acceptable use
            </h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Use the Service for any unlawful purpose or to submit fraudulent
                information;
              </li>
              <li>
                Impersonate another person, misrepresent your relationship to a
                claimant, or submit a claim on behalf of someone without their
                authorization;
              </li>
              <li>
                Upload content that infringes intellectual property rights or
                violates privacy rights of others;
              </li>
              <li>
                Attempt to probe, scan, or test the vulnerability of the
                Service, or to breach security or authentication measures;
              </li>
              <li>
                Interfere with the operation of the Service or the use of the
                Service by others;
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract the source
                code of the Service except as permitted by law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              7. Third-party services
            </h2>
            <p className="mt-3">
              The Service relies on third-party providers including Stripe
              (payments), Vercel (hosting), Cloudflare R2 (storage), OpenAI
              (document preparation assistance), Meta (advertising tracking),
              Google (analytics), and others. Your use of those services is also
              subject to their respective terms and privacy policies. Heritage
              Law Offices is an independent law firm and is separately governed
              by its own engagement agreements.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              8. Disclaimers
            </h2>
            <p className="mt-3">
              The Service is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. To the fullest extent permitted by law,
              RadiantClaims disclaims all warranties, express or implied,
              including warranties of merchantability, fitness for a particular
              purpose, non-infringement, and any warranty that the Service will
              be uninterrupted, error-free, or accurate.
            </p>
            <p className="mt-3">
              RadiantClaims makes no representation or warranty that your RECA
              claim will be approved or paid, that any particular amount will be
              awarded, or that any particular timeline will be met. The DOJ is
              solely responsible for reviewing and adjudicating RECA claims.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              9. Limitation of liability
            </h2>
            <p className="mt-3">
              To the fullest extent permitted by law, RadiantClaims, its
              officers, employees, and affiliates will not be liable for any
              indirect, incidental, special, consequential, exemplary, or
              punitive damages, including loss of profits, data, or goodwill,
              arising from or related to your use of the Service. Our total
              liability to you for any claim arising out of or related to these
              Terms or the Service will not exceed the amount you paid
              RadiantClaims in the twelve (12) months immediately preceding the
              event giving rise to the claim, or one hundred dollars ($100),
              whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              10. Indemnification
            </h2>
            <p className="mt-3">
              You agree to defend, indemnify, and hold harmless RadiantClaims
              and its officers, employees, and affiliates from any claims,
              damages, losses, liabilities, costs, and expenses (including
              reasonable attorneys&apos; fees) arising from (a) your use of the
              Service, (b) Your Content, (c) your violation of these Terms, or
              (d) your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              11. Termination
            </h2>
            <p className="mt-3">
              You may stop using the Service and close your account at any time.
              We may suspend or terminate your access to the Service at any
              time, with or without notice, if we believe you have violated
              these Terms or applicable law, or to protect the Service, our
              users, or the public. Upon termination, sections that by their
              nature should survive (including payment obligations, disclaimers,
              limitation of liability, and indemnification) will survive.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              12. Governing law and dispute resolution
            </h2>
            <p className="mt-3">
              These Terms are governed by the laws of the United States and the
              State of Utah, without regard to conflict-of-laws principles. Any
              dispute arising out of or relating to these Terms or the Service
              will be resolved exclusively in the state or federal courts
              located in Utah, and you consent to the personal jurisdiction of
              those courts. You and RadiantClaims waive any right to a jury
              trial.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              13. Changes to these terms
            </h2>
            <p className="mt-3">
              We may update these Terms from time to time. When we make material
              changes, we will post the updated Terms on this page and update
              the &quot;Effective date&quot; above. Your continued use of the
              Service after the effective date constitutes your acceptance of
              the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              14. Contact
            </h2>
            <p className="mt-3">
              If you have questions about these Terms, please contact us via our{" "}
              <Link href="/contact" className="text-terracotta-600 underline">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

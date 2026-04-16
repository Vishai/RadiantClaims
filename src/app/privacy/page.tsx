import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RadiantClaims collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-sage-600">
          Effective date: {effectiveDate}
        </p>

        <div className="prose prose-sage max-w-none space-y-6 text-sage-800">
          <section>
            <p className="text-base leading-relaxed">
              RadiantClaims (&quot;<strong>RadiantClaims</strong>,&quot;
              &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) helps
              downwinder families prepare Radiation Exposure Compensation Act
              (&quot;<strong>RECA</strong>&quot;) claims for submission to the
              U.S. Department of Justice. This Privacy Policy explains how we
              collect, use, share, and protect your personal information when
              you use our website at{" "}
              <a
                href="https://www.radiantclaims.com"
                className="text-terracotta-600 underline"
              >
                radiantclaims.com
              </a>{" "}
              and our RECA claim preparation service (together, the
              &quot;Service&quot;).
            </p>
            <p className="mt-4 text-base leading-relaxed">
              By using the Service, you agree to the practices described in this
              Privacy Policy. If you do not agree, please do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              1. Information we collect
            </h2>
            <p className="mt-3">
              We collect information you provide directly to us, information
              collected automatically when you use the Service, and information
              from third parties.
            </p>

            <h3 className="mt-5 text-lg font-semibold text-sage-900">
              1.1 Information you provide
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>Account information:</strong> your name, email address,
                password, and any other details you enter when creating an
                account.
              </li>
              <li>
                <strong>RECA claim information:</strong> information you enter
                into our guided claim-preparation form, which may include your
                (or a deceased family member&apos;s) full name, date of birth,
                Social Security number, residency history, employment history,
                medical diagnosis, disease and treatment details, and other
                information required by the RECA program.
              </li>
              <li>
                <strong>Uploaded documents:</strong> files you upload to the
                Service, such as birth certificates, death certificates,
                marriage certificates, medical records, pathology reports, and
                proof-of-presence documents.
              </li>
              <li>
                <strong>Family collaborator information:</strong> names and
                contact information of family members you invite to view or
                contribute to your claim.
              </li>
              <li>
                <strong>Communications:</strong> messages, support requests, and
                feedback you send us.
              </li>
              <li>
                <strong>Payment information:</strong> we use Stripe, Inc. to
                process payments. Stripe collects and stores your payment card
                details directly; we do not receive or store full card numbers.
              </li>
            </ul>

            <h3 className="mt-5 text-lg font-semibold text-sage-900">
              1.2 Information collected automatically
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>Device and usage data:</strong> IP address, browser
                type, operating system, device identifiers, pages visited,
                features used, and timestamps.
              </li>
              <li>
                <strong>Cookies and similar technologies:</strong> we and our
                service providers (including Meta Pixel and Google Analytics)
                use cookies, pixel tags, and similar technologies to recognize
                your device, remember your preferences, and understand how the
                Service is used. See{" "}
                <a href="#cookies" className="text-terracotta-600 underline">
                  Cookies
                </a>{" "}
                below.
              </li>
              <li>
                <strong>Log data:</strong> server logs that record requests to
                the Service, including URLs, referrer information, and error
                details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              2. How we use your information
            </h2>
            <p className="mt-3">We use the information we collect to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Prepare your RECA claim packet and generate the forms and
                checklists required by the U.S. Department of Justice;
              </li>
              <li>
                Provide, maintain, and improve the Service, including
                troubleshooting and customer support;
              </li>
              <li>Process payments and manage your account (via Stripe);</li>
              <li>
                Communicate with you about the Service, including transactional
                emails (account confirmations, password resets, claim status
                updates) and, with your consent, marketing messages;
              </li>
              <li>
                If you elect the Legal Representation path, share your claim
                materials with Heritage Law Offices, with your consent, so they
                can represent you;
              </li>
              <li>
                Monitor and analyze trends, usage, and performance of the
                Service;
              </li>
              <li>
                Detect, investigate, and prevent fraud, abuse, and security
                incidents;
              </li>
              <li>
                Comply with legal obligations, enforce our Terms of Service, and
                protect the rights, safety, and property of RadiantClaims, our
                users, and the public.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              3. How we share your information
            </h2>
            <p className="mt-3">
              We do not sell your personal information. We share information
              only as described below:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>With the U.S. Department of Justice</strong> — only with
                your direction, as part of preparing and submitting your RECA
                claim. You control when and whether your claim is submitted.
              </li>
              <li>
                <strong>With Heritage Law Offices</strong> — only if you
                affirmatively select the Legal Representation path and consent
                to that sharing.
              </li>
              <li>
                <strong>With service providers:</strong> we use third-party
                vendors to operate the Service, including hosting (Vercel),
                database and file storage (Cloudflare R2), email delivery,
                payment processing (Stripe), analytics (Google Analytics, Meta
                Pixel), and AI processing for document preparation (OpenAI).
                These providers are bound by contractual obligations to handle
                your information appropriately.
              </li>
              <li>
                <strong>With family collaborators you invite:</strong> when you
                invite a family member, that person can view, upload, and add
                notes to the specific claim you share with them.
              </li>
              <li>
                <strong>For legal reasons:</strong> we may disclose information
                if required to do so by law, subpoena, or other legal process,
                or if we believe in good faith that disclosure is necessary to
                protect our rights, your safety, or the safety of others.
              </li>
              <li>
                <strong>In a business transaction:</strong> if we are involved
                in a merger, acquisition, financing, or sale of assets, your
                information may be transferred as part of that transaction,
                subject to this Privacy Policy.
              </li>
            </ul>
          </section>

          <section id="cookies">
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              4. Cookies and tracking technologies
            </h2>
            <p className="mt-3">
              We use cookies and similar technologies to operate the Service and
              understand how it is used. This includes:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>Strictly necessary cookies</strong> required for
                authentication, session management, and security.
              </li>
              <li>
                <strong>Analytics cookies</strong> from Google Analytics that
                help us understand Service usage in aggregate.
              </li>
              <li>
                <strong>Advertising and conversion cookies</strong> from Meta
                Pixel that allow us to measure ad performance and reach relevant
                audiences.
              </li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings and opt out
              of certain third-party tracking at{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta-600 underline"
              >
                aboutads.info/choices
              </a>
              . Disabling cookies may affect how the Service functions.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              5. Data retention
            </h2>
            <p className="mt-3">
              We retain your personal information for as long as your account is
              active or as needed to provide the Service. After your account is
              closed or your RECA claim process is complete, we retain
              information as needed to comply with legal obligations (including
              IRS record-keeping rules), resolve disputes, and enforce our
              agreements. You may request deletion of your account and data at
              any time by contacting us at the address below.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              6. Your rights
            </h2>
            <p className="mt-3">
              Depending on where you live, you may have rights regarding your
              personal information, including the right to:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>Access the information we hold about you;</li>
              <li>Correct inaccurate or incomplete information;</li>
              <li>Delete your information (subject to legal exceptions);</li>
              <li>Restrict or object to certain processing;</li>
              <li>
                Opt out of marketing communications at any time via the
                unsubscribe link in any marketing email;
              </li>
              <li>Receive a copy of your information in a portable format.</li>
            </ul>
            <p className="mt-3">
              California residents have additional rights under the California
              Consumer Privacy Act (CCPA), including the right to know, request
              deletion, and opt out of the sale of personal information. We do
              not sell personal information. To exercise any of these rights,
              contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              7. Security
            </h2>
            <p className="mt-3">
              We use reasonable administrative, technical, and physical
              safeguards to protect your information, including encryption in
              transit (HTTPS), access controls, and secure document storage. No
              system is perfectly secure, however, and we cannot guarantee
              absolute security. You are responsible for maintaining the
              confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              8. Children&apos;s privacy
            </h2>
            <p className="mt-3">
              The Service is not directed to, and we do not knowingly collect
              information from, children under 13. If you believe we have
              inadvertently collected information from a child, please contact
              us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              9. Changes to this Privacy Policy
            </h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. When we make
              material changes, we will notify you by posting the updated policy
              on this page and updating the &quot;Effective date&quot; above. We
              encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="mt-8 text-2xl font-bold text-sage-900">
              10. Contact us
            </h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy or our data
              practices, please contact us via our{" "}
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

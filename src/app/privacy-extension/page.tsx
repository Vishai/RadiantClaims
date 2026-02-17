import { Metadata } from "next/metadata";

export const metadata: Metadata = {
  title: "Privacy Policy — Chrome Extension | RadiantClaims",
  description:
    "Privacy policy for the RadiantClaims DOJ Portal Helper Chrome extension.",
};

export default function PrivacyExtensionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="mb-2 text-3xl font-bold">
        Privacy Policy — RadiantClaims DOJ Portal Helper
      </h1>
      <p className="mb-8 text-muted-foreground">
        Last Updated: February 16, 2026
      </p>

      <section className="space-y-6 leading-relaxed">
        <div>
          <h2 className="mb-2 text-xl font-semibold">Overview</h2>
          <p>
            The RadiantClaims DOJ Portal Helper browser extension (&ldquo;the
            Extension&rdquo;) helps users transfer their prepared RECA claim
            data from RadiantClaims.com to the Department of Justice filing
            portal. This policy explains what data the Extension accesses, how
            it is used, and how it is stored.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Data We Access</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Your RadiantClaims.com claim data</strong> — retrieved via
              authenticated API calls to RadiantClaims.com using your existing
              login session. This includes claim form fields and document
              metadata you have prepared on RadiantClaims.com.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">How We Use Your Data</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Display guidance on the DOJ portal</strong> — your
              prepared claim data is shown alongside DOJ form fields so you can
              accurately transfer information.
            </li>
            <li>
              <strong>Document upload assistance</strong> — the Extension
              references your document list to guide you on which files to
              upload and where.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">What We Do NOT Do</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>We never transmit your data to third parties.</li>
            <li>
              We never send your data to any server other than RadiantClaims.com
              (to retrieve your prepared claim) and the DOJ portal (which you
              submit to directly).
            </li>
            <li>We never collect analytics, telemetry, or usage data.</li>
            <li>
              We never access data from websites other than RadiantClaims.com
              and reca.justice.gov.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Data Storage</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Claim data is cached locally using{" "}
              <code>chrome.storage.local</code> within your browser.
            </li>
            <li>No data is stored on external servers by the Extension.</li>
            <li>
              You can clear all cached data at any time through the
              Extension&rsquo;s popup menu or by removing the Extension.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Permissions</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Host permissions</strong> for radiantclaims.com and
              reca.justice.gov — to retrieve your claim data and provide
              guidance on the DOJ portal.
            </li>
            <li>
              <strong>Storage</strong> — to cache your claim data locally for a
              smoother experience.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Data Security</h2>
          <p>
            All communication with RadiantClaims.com uses HTTPS encryption. Your
            authentication credentials are managed by your browser&rsquo;s
            existing session and are never accessed or stored by the Extension.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Changes to This Policy</h2>
          <p>
            We may update this policy as the Extension evolves. Changes will be
            noted with an updated &ldquo;Last Updated&rdquo; date.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Contact</h2>
          <p>
            Questions about this privacy policy? Contact us at{" "}
            <a
              href="mailto:brandon@radiantclaims.com"
              className="text-primary underline"
            >
              brandon@radiantclaims.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

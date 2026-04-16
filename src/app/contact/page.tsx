import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Clock, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with RadiantClaims — questions about RECA claim preparation, your account, or our service.",
  alternates: { canonical: "/contact" },
};

// TODO: Replace this with your real support email before going live.
const SUPPORT_EMAIL = "support@radiantclaims.com";

export default function ContactPage() {
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

        <h1 className="mb-3 text-4xl font-bold text-sage-900">Contact Us</h1>
        <p className="mb-10 text-lg text-sage-700">
          Questions about RECA eligibility, your account, or the Service?
          We&apos;re happy to help. Most questions are answered within one
          business day.
        </p>

        {/* Primary: email */}
        <div className="mb-6 rounded-3xl border-2 border-cream-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-terracotta-100">
              <Mail className="h-6 w-6 text-terracotta-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-sage-900">Email</h2>
              <p className="mt-1 text-sm text-sage-600">
                The fastest way to reach us for support and account questions.
              </p>
            </div>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
        </div>

        {/* Response time */}
        <div className="mb-6 rounded-3xl border-2 border-cream-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sage-100">
              <Clock className="h-6 w-6 text-sage-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-sage-900">Response time</h2>
              <p className="mt-2 text-sm leading-relaxed text-sage-600">
                We aim to respond to all inquiries within{" "}
                <strong className="text-sage-900">one business day</strong>,
                Monday–Friday. Messages received on weekends or holidays will be
                answered the next business day.
              </p>
            </div>
          </div>
        </div>

        {/* What to include */}
        <div className="mb-6 rounded-3xl border-2 border-cream-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sage-100">
              <MessageCircle className="h-6 w-6 text-sage-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-sage-900">
                What to include in your message
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sage-600">
                To help us answer your question as quickly as possible, please
                include:
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-sage-700">
                <li className="flex gap-2">
                  <span className="text-terracotta-500">•</span>
                  <span>The email address associated with your account</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-terracotta-500">•</span>
                  <span>
                    A brief description of your question or the issue you are
                    experiencing
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-terracotta-500">•</span>
                  <span>
                    For technical issues: the page you were on and any error
                    message you saw
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-sage-500">
                <strong>Please do not include</strong> sensitive information
                like your Social Security number, full bank account numbers, or
                full medical records in emails. If we need sensitive
                information, we will direct you to our secure portal.
              </p>
            </div>
          </div>
        </div>

        {/* Important reminder */}
        <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-6">
          <p className="text-sm leading-relaxed text-amber-900">
            <strong>A quick reminder:</strong> RadiantClaims provides document
            preparation services, not legal advice. We cannot answer legal
            questions about your eligibility for RECA, disputes with the DOJ, or
            the interpretation of RECA statutes. For legal questions, please
            consult a licensed attorney — our Legal Representation path can
            connect you with Heritage Law Offices.
          </p>
        </div>
      </main>
    </div>
  );
}

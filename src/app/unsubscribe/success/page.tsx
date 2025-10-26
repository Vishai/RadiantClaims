"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribeSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
            <svg
              className="h-8 w-8 text-sage-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="mb-4 text-center text-2xl font-bold text-sage-800">
          You've Been Unsubscribed
        </h1>
        {email && (
          <p className="mb-6 text-center text-sage-600">
            We've successfully unsubscribed <strong>{email}</strong> from our
            email notifications.
          </p>
        )}

        {/* Info Box */}
        <div className="mb-6 rounded-lg bg-peach-50 p-4">
          <p className="text-sm text-peach-900">
            <strong>Note:</strong> You'll still receive critical emails related
            to your RECA claim, such as status updates and important deadlines.
          </p>
        </div>

        {/* Change Mind */}
        <div className="mb-6 text-center">
          <p className="text-sm text-sage-600">
            Changed your mind? You can update your email preferences at any time
            from your account settings.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/portal"
            className="block w-full rounded-lg bg-terracotta-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-terracotta-600"
          >
            Go to Customer Portal
          </Link>
          <Link
            href="/"
            className="block w-full rounded-lg border border-sage-300 bg-white px-6 py-3 text-center font-semibold text-sage-700 transition hover:bg-sage-50"
          >
            Return to Home
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 border-t border-sage-200 pt-6 text-center">
          <p className="text-sm text-sage-500">
            Need help?{" "}
            <a
              href="mailto:support@radiantclaims.com"
              className="text-terracotta-500 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Shield, ExternalLink, Scale, Clock } from "lucide-react";

/**
 * Social proof and credibility section for the landing page.
 *
 * Builds trust through:
 * - DOJ program verification link
 * - Heritage Law partnership credentials
 * - Key program facts (100% approval, filing deadline, fee cap)
 */
export function SocialProof() {
  return (
    <section className="mx-auto mb-16 max-w-4xl px-4">
      {/* Trust bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
          Trusted by families across the West
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* DOJ verification */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900">
              Official Federal Program
            </p>
            <p className="mb-2 text-xs text-gray-600">
              RECA is administered by the U.S. Department of Justice, Civil
              Division
            </p>
            <a
              href="https://www.justice.gov/civil/reca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Verify on justice.gov
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Heritage Law */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Scale className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900">
              Legal Partner: Heritage Law
            </p>
            <p className="mb-2 text-xs text-gray-600">
              Licensed attorneys in Utah, Arizona, and Nevada providing legal
              representation at the federal 2% fee cap
            </p>
            <p className="text-xs text-gray-500">
              Attorney fees capped by federal statute
            </p>
          </div>

          {/* Approval rate */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900">
              Filing Deadline: Dec 31, 2027
            </p>
            <p className="mb-2 text-xs text-gray-600">
              Downwinder claims have a 100% historical approval rate when
              properly documented
            </p>
            <p className="text-xs font-medium text-amber-700">
              File early — the queue is growing daily
            </p>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <p className="mt-6 text-center text-[10px] text-gray-400">
          RadiantClaims provides document preparation services. We are not a law
          firm. Legal services provided by Heritage Law Offices.
        </p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface UrgencyMetrics {
  queueSize: number;
  estimatedWaitDays: number;
  applicationsPerDay: number;
  approvalsPerDay: number;
  ratio: number;
}

export function BacklogRaceSection() {
  const [metrics, setMetrics] = useState<UrgencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/doj/metrics/public");
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to load metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return null;
  }

  // Calculate daily queue growth
  const dailyQueueGrowth = Math.round(
    metrics.applicationsPerDay - metrics.approvalsPerDay
  );

  // Calculate percentage for visual bar (relative to submissions)
  const approvalsPercentage = Math.round(
    (metrics.approvalsPerDay / metrics.applicationsPerDay) * 100
  );

  return (
    <section className="mx-auto mb-20 max-w-4xl px-4">
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
              You are in a race against the backlog.
            </h2>
            <p className="text-gray-600">
              Every day you wait, approximately{" "}
              <strong>{dailyQueueGrowth} more families</strong> get in line
              ahead of you.
            </p>
          </div>

          <div className="space-y-8">
            {/* New Applications Bar */}
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-semibold text-gray-700 md:text-base">
                  New Applications / Day
                </span>
                <span className="text-xl font-bold text-red-600 md:text-2xl">
                  {metrics.applicationsPerDay.toFixed(1)}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100 md:h-5">
                <div className="h-full w-full rounded-full bg-red-500 shadow-inner"></div>
              </div>
            </div>

            {/* Claims Processed Bar */}
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-semibold text-gray-700 md:text-base">
                  Claims Processed / Day
                </span>
                <span className="text-xl font-bold text-blue-600 md:text-2xl">
                  {metrics.approvalsPerDay.toFixed(1)}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100 md:h-5">
                <div
                  className="h-full rounded-full bg-blue-500 shadow-inner"
                  style={{ width: `${approvalsPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-8 flex items-start gap-4 rounded-xl border-l-4 border-orange-500 bg-orange-50 p-5">
            <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Why Starting Now Matters
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                The government receives claims{" "}
                <strong>{metrics.ratio.toFixed(1)}x faster</strong> than they
                approve them. The queue is{" "}
                <strong>{metrics.queueSize.toLocaleString()} people</strong>{" "}
                long. Secure your spot before the wait time doubles.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-8 py-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-terracotta-400 to-terracotta-600"></div>
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-sage-400 to-sage-600"></div>
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-peach-400 to-peach-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-600">
              Hundreds of claims approved recently
            </span>
          </div>
          <Link
            href="/eligibility-check"
            className="font-bold text-terracotta-500 hover:text-terracotta-600 hover:underline"
          >
            Start your claim →
          </Link>
        </div>
      </div>
    </section>
  );
}

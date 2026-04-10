"use client";

import { useEffect, useState } from "react";

interface UrgencyMetrics {
  queueSize: number;
  estimatedWaitDays: number;
  applicationsPerDay: number;
  approvalsPerDay: number;
  ratio: number;
  asOfDate?: string;
  isFallback?: boolean;

  previousWeekAsOfDate?: string | null;
  previousWeekQueueSize?: number | null;
  weeklyQueueChange?: number | null;
  weeklyQueueGrowthPercent?: number | null;
}

export function DOJStickyBanner() {
  const [metrics, setMetrics] = useState<UrgencyMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/doj/metrics/public");
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to load sticky banner metrics:", err);
      }
    };

    fetchMetrics();
  }, []);

  // Don't show banner if metrics aren't loaded
  if (!metrics) {
    return null;
  }

  // Exact week-over-week queue growth comes from the API (derived from DB).
  const weeklyGrowth = metrics.weeklyQueueGrowthPercent ?? 0;

  // Use API's pre-calculated wait time (based on 30-day average for stability)
  const waitMonths = Math.round(metrics.estimatedWaitDays / 30);

  // Check data freshness — suppress growth claim if data is older than 10 days
  const dataAge = metrics.asOfDate
    ? Math.floor(
        (Date.now() - new Date(metrics.asOfDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const isStale = dataAge !== null && dataAge > 10;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-gray-900 px-4 py-3 text-sm text-white shadow-md transition-all">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
      </span>
      <p className="text-center">
        <span className="font-bold text-red-300">DOJ ALERT:</span>{" "}
        {isStale ? (
          <>
            <span className="font-bold text-white">
              {metrics.queueSize.toLocaleString()}
            </span>{" "}
            claims in queue.
          </>
        ) : (
          <>
            Claims queue grew{" "}
            <span className="font-bold text-white">
              +{weeklyGrowth.toFixed(1)}%
            </span>{" "}
            this week.
          </>
        )}{" "}
        Est. Wait:{" "}
        <span className="font-mono text-yellow-300">~{waitMonths} months</span>.
      </p>
    </div>
  );
}

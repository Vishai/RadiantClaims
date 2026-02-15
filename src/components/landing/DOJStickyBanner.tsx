"use client";

import { useEffect, useState } from "react";

interface UrgencyMetrics {
  queueSize: number;
  estimatedWaitDays: number;
  applicationsPerDay: number;
  approvalsPerDay: number;
  ratio: number;
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

  // Calculate queue growth percentage (week over week approximation).
  // We only have current queue size + rates from the public API.
  // Approximate last week's queue as: currentQueue - 7*(submissions - approvals).
  const netPerDay = metrics.applicationsPerDay - metrics.approvalsPerDay;
  const approxLastWeekQueue = metrics.queueSize - netPerDay * 7;
  const weeklyGrowth =
    approxLastWeekQueue > 0
      ? ((metrics.queueSize - approxLastWeekQueue) / approxLastWeekQueue) * 100
      : 0;

  // Use API's pre-calculated wait time (based on 30-day average for stability)
  const waitMonths = Math.round(metrics.estimatedWaitDays / 30);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-gray-900 px-4 py-3 text-xs text-white shadow-md transition-all md:text-sm">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
      </span>
      <p className="text-center">
        <span className="font-bold text-red-300">DOJ ALERT:</span> Claims queue
        grew{" "}
        <span className="font-bold text-white">
          +{weeklyGrowth.toFixed(1)}%
        </span>{" "}
        this week. Est. Wait:{" "}
        <span className="font-mono text-yellow-300">~{waitMonths} months</span>.
      </p>
    </div>
  );
}

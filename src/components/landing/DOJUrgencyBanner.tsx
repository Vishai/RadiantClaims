"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

interface UrgencyMetrics {
  queueSize: number;
  estimatedWaitDays: number;
  applicationsPerDay: number;
  approvalsPerDay: number;
  ratio: number;
}

export function DOJUrgencyBanner() {
  const [metrics, setMetrics] = useState<UrgencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

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

  if (loading || !metrics) {
    return null; // Don't show anything if metrics aren't available
  }

  return (
    <Card className="border-2 border-terracotta-300 bg-gradient-to-br from-terracotta-50 via-peach-50 to-cream-50 shadow-lg">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-terracotta-500 p-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-sage-900">
              Time-Sensitive: DOJ Processing Update
            </h3>
            <p className="mt-1 text-sage-700">
              Real-time data from the Department of Justice
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {/* Queue Size */}
          <div className="rounded-xl border border-sage-200 bg-white/80 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sage-600">
              <Users className="h-4 w-4" />
              Current Queue
            </div>
            <div className="text-3xl font-bold text-terracotta-600">
              {metrics.queueSize.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-sage-600">
              claims waiting for approval
            </div>
          </div>

          {/* Wait Time */}
          <div className="rounded-xl border border-sage-200 bg-white/80 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sage-600">
              <Clock className="h-4 w-4" />
              DOJ Processing Time
            </div>
            <div className="text-3xl font-bold text-terracotta-600">
              ~{Math.round(metrics.estimatedWaitDays / 30)}
              <span className="text-lg"> months</span>
            </div>
            <div className="mt-1 text-xs text-sage-600">
              if you could submit today
            </div>
          </div>

          {/* Demand Ratio */}
          <div className="rounded-xl border border-sage-200 bg-white/80 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sage-600">
              <TrendingUp className="h-4 w-4" />
              Demand Pressure
            </div>
            <div className="text-3xl font-bold text-terracotta-600">
              {metrics.ratio.toFixed(1)}:1
            </div>
            <div className="mt-1 text-xs text-sage-600">
              applications per approval
            </div>
          </div>
        </div>

        {/* Urgency Message */}
        <div className="mb-6 rounded-lg border-l-4 border-terracotta-500 bg-white/60 p-4">
          <p className="mb-2 font-semibold text-sage-900">
            ⚠️ Why Starting Now Matters:
          </p>
          <ul className="space-y-2 text-sm text-sage-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-terracotta-500">•</span>
              <span>
                <strong>{metrics.queueSize.toLocaleString()} claims</strong> are
                currently ahead in the queue
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-terracotta-500">•</span>
              <span>
                DOJ is currently processing{" "}
                <strong>
                  ~{metrics.approvalsPerDay.toFixed(1)} claims per day
                </strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-terracotta-500">•</span>
              <span>
                At the current rate, <strong>if you could apply today</strong>{" "}
                (a big undertaking), you would receive payment in approximately{" "}
                <strong>
                  {Math.round(metrics.estimatedWaitDays / 30)} months (
                  {metrics.estimatedWaitDays} days)
                </strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-terracotta-500">•</span>
              <span>
                But document preparation takes <strong>2-4 months</strong>{" "}
                before you can even submit — so real timeline is{" "}
                <strong>
                  {Math.round(metrics.estimatedWaitDays / 30) + 3}+ months total
                </strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-terracotta-500">•</span>
              <span>
                <strong>Filing deadline: December 31, 2027</strong> — The sooner
                you start, the more buffer you have
              </span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-sage-700">
            <strong className="text-sage-900">The bottom line:</strong> With{" "}
            {metrics.queueSize.toLocaleString()} claims ahead and processing at{" "}
            {metrics.approvalsPerDay.toFixed(1)}/day, every day you delay adds
            to your wait time.
          </div>
          <Link href="/eligibility-check">
            <Button
              size="lg"
              className="w-full rounded-full bg-terracotta-500 px-8 py-6 text-lg font-semibold shadow-lg hover:bg-terracotta-600 sm:w-auto"
            >
              Start Your Claim Now →
            </Button>
          </Link>
        </div>

        {/* Fine Print */}
        <p className="mt-4 text-xs text-sage-600">
          *Data sourced from Department of Justice daily reports. Wait times are
          estimates based on current processing velocity and may vary.
        </p>
      </div>
    </Card>
  );
}

"use client";

import { PayoutPulseData } from "@/lib/claim-timeline/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Calendar,
  Zap,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface PayoutPulseProps {
  data: PayoutPulseData;
}

export function PayoutPulse({ data }: PayoutPulseProps) {
  const daysUntilApproval = differenceInDays(
    new Date(data.estimatedApprovalDate),
    new Date()
  );
  const daysUntilPayment = differenceInDays(
    new Date(data.estimatedPaymentDate),
    new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-sage-900 mb-2">Payout Pulse</h2>
        <p className="text-sage-600">
          Real-time insights based on {data.cohortSubmitted.toLocaleString()} similar claims
        </p>
      </div>

      {/* Key Projections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Estimated Approval Date */}
        <Card className="rounded-3xl border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 via-peach-50 to-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sage-900">Estimated Approval</CardTitle>
                <CardDescription className="text-sage-600">
                  Based on {data.approvalRate}% approval rate
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-terracotta-900 mb-2">
              {format(new Date(data.estimatedApprovalDate), "MMM d, yyyy")}
            </div>
            <div className="text-lg text-sage-700 mb-4">
              In approximately {daysUntilApproval} days
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                data.confidenceLevel === "high"
                  ? "bg-emerald-100 text-emerald-800"
                  : data.confidenceLevel === "medium"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <Zap className="h-4 w-4" />
              {data.confidenceLevel} confidence
            </div>
          </CardContent>
        </Card>

        {/* Estimated Payment Date */}
        <Card className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sage-900">Estimated Payout</CardTitle>
                <CardDescription className="text-sage-600">
                  $100,000 compensation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900 mb-2">
              {format(new Date(data.estimatedPaymentDate), "MMM d, yyyy")}
            </div>
            <div className="text-lg text-sage-700 mb-4">
              In approximately {daysUntilPayment} days
            </div>
            <div className="text-sm text-sage-600">
              Average processing time: {data.avgTimeToPayment} days after approval
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Comparison */}
      <Card className="rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">How You're Doing</CardTitle>
          <CardDescription className="text-sage-600">
            Your progress compared to similar claims
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Your Progress */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-sage-900">Your Claim</span>
              <span className="text-2xl font-bold text-terracotta-600">
                {data.yourProgress}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 transition-all duration-500"
                style={{ width: `${data.yourProgress}%` }}
              />
            </div>
          </div>

          {/* Typical Progress */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-sage-700">Typical at This Stage</span>
              <span className="text-2xl font-bold text-sage-600">
                {data.typicalProgress}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-sage-400 transition-all duration-500"
                style={{ width: `${data.typicalProgress}%` }}
              />
            </div>
          </div>

          {/* Performance Indicator */}
          {data.fasterThanPercent !== undefined && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-emerald-900 mb-1">
                    {data.fasterThanPercent}%
                  </div>
                  <div className="text-sm text-emerald-700">
                    Your claim is progressing faster than {data.fasterThanPercent}% of similar claims
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohort Statistics */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-sage-600" />
            <div>
              <CardTitle className="text-sage-900">Your Cohort Stats</CardTitle>
              <CardDescription className="text-sage-600">
                Claims submitted in the same time period
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-sage-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sage-600">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Total Submitted</span>
              </div>
              <div className="text-3xl font-bold text-sage-900">
                {data.cohortSubmitted.toLocaleString()}
              </div>
              <div className="text-xs text-sage-600 mt-1">claims in cohort</div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Completed</span>
              </div>
              <div className="text-3xl font-bold text-emerald-900">
                {data.cohortCompleted.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                {((data.cohortCompleted / data.cohortSubmitted) * 100).toFixed(1)}% complete
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">In Progress</span>
              </div>
              <div className="text-3xl font-bold text-amber-900">
                {data.cohortInProgress.toLocaleString()}
              </div>
              <div className="text-xs text-amber-700 mt-1">
                {((data.cohortInProgress / data.cohortSubmitted) * 100).toFixed(1)}% pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Averages */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Historical Averages</CardTitle>
          <CardDescription className="text-sage-600">
            Based on completed RECA Downwinder claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl bg-cream-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-200">
                <Clock className="h-6 w-6 text-sage-700" />
              </div>
              <div>
                <div className="text-2xl font-bold text-sage-900">
                  {data.avgTimeToApproval} days
                </div>
                <div className="text-sm text-sage-600">Avg. time to approval</div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200">
                <CheckCircle className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  {data.approvalRate}%
                </div>
                <div className="text-sm text-emerald-700">Approval rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
        <p className="text-xs text-sage-700">
          <strong className="text-sage-900">Note:</strong> These estimates are based on
          historical data and current processing trends. Actual timelines may vary based on
          individual case factors, DOJ workload, and document completeness. We'll keep you
          updated as your claim progresses.
        </p>
      </div>
    </div>
  );
}

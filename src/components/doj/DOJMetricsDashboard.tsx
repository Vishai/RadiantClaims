"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DOJMetrics {
  currentQueue: {
    asOfDate: string;
    pending: number;
    approved: number;
    totalClaims: number;
  };
  exactWeeklyQueue: {
    previousWeekAsOfDate: string | null;
    previousWeekQueueSize: number | null;
    weeklyQueueChange: number | null;
    weeklyQueueGrowthPercent: number | null;
  };
  dataQuality: {
    windowStart: string;
    windowEnd: string;
    publishDays: number;
    imputedDays: number;
    negativeDeltaDays: number;
    totalDecreasedDays: number;
  };
  velocity: {
    last7Days: number;
    last30Days: number;
    allTime: number;
    trend: "FASTER" | "SLOWER" | "STABLE";
    trendChange: number;
  };
  queue: {
    current: number;
    avg7Days: number;
    avg30Days: number;
    trend: "FASTER" | "SLOWER" | "STABLE";
    trendChange: number;
  };
  processingTime: {
    estimated7Days?: number;
    estimated30Days?: number;
    estimatedAllTime?: number;
  };
  approvalRate: {
    current: number;
    allTime: number;
  };
  insights: string[];
}

function TrendIcon({
  trend,
  className,
}: {
  trend: "FASTER" | "SLOWER" | "STABLE";
  className?: string;
}) {
  if (trend === "FASTER") {
    return <TrendingUp className={className} />;
  } else if (trend === "SLOWER") {
    return <TrendingDown className={className} />;
  }
  return <Minus className={className} />;
}

function TrendBadge({
  trend,
  change,
}: {
  trend: "FASTER" | "SLOWER" | "STABLE";
  change: number;
}) {
  const isPositive = trend === "FASTER";
  const isNeutral = trend === "STABLE";

  return (
    <Badge
      variant={isNeutral ? "secondary" : isPositive ? "default" : "destructive"}
      className={
        isNeutral
          ? "border-sage-200 bg-sage-100 text-sage-700"
          : isPositive
            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
            : "border-terracotta-200 bg-terracotta-100 text-terracotta-700"
      }
    >
      <TrendIcon trend={trend} className="mr-1 h-3 w-3" />
      {Math.abs(change).toFixed(1)}%
    </Badge>
  );
}

export function DOJMetricsDashboard() {
  const [metrics, setMetrics] = useState<DOJMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doj/metrics");

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 503) {
          throw new Error(
            errorData.message ||
              "DOJ metrics are not available yet. Please check back later."
          );
        } else if (response.status === 401) {
          throw new Error("You must be logged in to view DOJ metrics");
        } else {
          throw new Error("Failed to fetch DOJ metrics");
        }
      }

      const result = await response.json();
      setMetrics(result.data);
    } catch (err) {
      console.error("Error fetching DOJ metrics:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load DOJ processing metrics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-sage-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-800">
            <Activity className="h-5 w-5 text-terracotta-500" />
            DOJ Processing Metrics
          </CardTitle>
          <CardDescription className="text-sage-600">
            Loading real-time government processing data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <div className="text-sage-500">Loading metrics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-sage-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-800">
            <Activity className="h-5 w-5 text-terracotta-500" />
            DOJ Processing Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-terracotta-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            {error || "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sage-200 bg-gradient-to-br from-cream-100 to-sage-50/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sage-800">
              <Activity className="h-5 w-5 text-terracotta-500" />
              DOJ Processing Metrics
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-sage-600">
              Real-time government claim processing insights • Updated{" "}
              {new Date(metrics.currentQueue.asOfDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              )}
            </CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600"
          >
            {isExpanded ? (
              <>
                Hide Details
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View Detailed Trends
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Key Metrics Grid */}
      <CardContent className="space-y-6 pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Current Queue */}
          <Card className="border-sage-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sage-600">
                <FileText className="h-4 w-4 text-terracotta-500" />
                Current Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sage-800">
                {metrics.currentQueue.pending.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {metrics.exactWeeklyQueue.weeklyQueueGrowthPercent !== null
                    ? `${metrics.exactWeeklyQueue.weeklyQueueGrowthPercent.toFixed(1)}%`
                    : "N/A"}
                </Badge>
                <span className="text-xs text-sage-500">
                  WoW ({metrics.exactWeeklyQueue.weeklyQueueChange ?? "—"})
                </span>
              </div>
              {metrics.exactWeeklyQueue.previousWeekAsOfDate && (
                <div className="mt-1 text-[11px] text-sage-500">
                  vs{" "}
                  {new Date(
                    metrics.exactWeeklyQueue.previousWeekAsOfDate
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Velocity */}
          <Card className="border-sage-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sage-600">
                <Activity className="h-4 w-4 text-terracotta-500" />
                Processing Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sage-800">
                {metrics.velocity.last7Days.toFixed(1)}
                <span className="text-base font-normal text-sage-500">
                  /day
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <TrendBadge
                  trend={metrics.velocity.trend}
                  change={metrics.velocity.trendChange}
                />
                <span className="text-xs text-sage-500">last 7 days</span>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Wait Time */}
          <Card className="border-sage-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sage-600">
                <Clock className="h-4 w-4 text-terracotta-500" />
                Est. Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sage-800">
                {metrics.processingTime.estimated30Days
                  ? Math.round(metrics.processingTime.estimated30Days)
                  : "N/A"}
                <span className="text-base font-normal text-sage-500">
                  {" "}
                  days
                </span>
              </div>
              <div className="mt-2 text-xs text-sage-500">
                Based on 30-day avg
              </div>
            </CardContent>
          </Card>

          {/* Approval Rate */}
          <Card className="border-sage-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sage-600">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                {metrics.approvalRate.current}%
              </div>
              <div className="mt-2 text-xs text-sage-500">
                {metrics.currentQueue.approved.toLocaleString()} approved claims
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expandable Detailed Sections */}
        {isExpanded && (
          <div className="space-y-6 pt-2 animate-in slide-in-from-top-2">
            {/* Divider */}
            <div className="border-t border-sage-200" />

            {/* Data Quality */}
            <div className="rounded-lg border border-sage-200/50 bg-white/60 p-6">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-sage-800">
                  <AlertCircle className="h-5 w-5 text-sage-500" />
                  Data Quality (Last 7 Calendar Days)
                </h3>
                <p className="mt-1 text-xs text-sage-600">
                  DOJ doesn’t publish every day (weekends/holidays). We compute
                  deltas vs the previous publish day.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-sage-100 bg-cream-50/50 p-3">
                  <div className="text-xs text-sage-500">Publish days</div>
                  <div className="text-lg font-semibold text-sage-800">
                    {metrics.dataQuality.publishDays}
                  </div>
                </div>
                <div className="rounded-lg border border-sage-100 bg-cream-50/50 p-3">
                  <div className="text-xs text-sage-500">Imputed days</div>
                  <div className="text-lg font-semibold text-sage-800">
                    {metrics.dataQuality.imputedDays}
                  </div>
                </div>
                <div className="rounded-lg border border-sage-100 bg-cream-50/50 p-3">
                  <div className="text-xs text-sage-500">
                    Negative delta days
                  </div>
                  <div className="text-lg font-semibold text-sage-800">
                    {metrics.dataQuality.negativeDeltaDays}
                  </div>
                </div>
                <div className="rounded-lg border border-sage-100 bg-cream-50/50 p-3">
                  <div className="text-xs text-sage-500">
                    Total decreased days
                  </div>
                  <div className="text-lg font-semibold text-sage-800">
                    {metrics.dataQuality.totalDecreasedDays}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-sage-500">
                Window:{" "}
                {new Date(metrics.dataQuality.windowStart).toLocaleDateString(
                  "en-US"
                )}{" "}
                –{" "}
                {new Date(metrics.dataQuality.windowEnd).toLocaleDateString(
                  "en-US"
                )}
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="rounded-lg border border-sage-200/50 bg-white/60 p-6">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-sage-800">
                  <BarChart3 className="h-5 w-5 text-sage-500" />
                  Processing Velocity Breakdown
                </h3>
                <p className="mt-1 text-xs text-sage-600">
                  Average approvals per day across different time windows
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-sage-200">
                    <TableHead className="text-sage-700">Time Period</TableHead>
                    <TableHead className="text-right text-sage-700">
                      Approvals/Day
                    </TableHead>
                    <TableHead className="text-right text-sage-700">
                      Est. Wait Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-sage-100">
                    <TableCell className="font-medium text-sage-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-terracotta-500" />
                        Last 7 Days
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sage-800">
                      {metrics.velocity.last7Days.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-sage-600">
                      {metrics.processingTime.estimated7Days
                        ? `${Math.round(metrics.processingTime.estimated7Days)} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-sage-100">
                    <TableCell className="font-medium text-sage-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-terracotta-500" />
                        Last 30 Days
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sage-800">
                      {metrics.velocity.last30Days.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-sage-600">
                      {metrics.processingTime.estimated30Days
                        ? `${Math.round(metrics.processingTime.estimated30Days)} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-sage-100">
                    <TableCell className="font-medium text-sage-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-terracotta-500" />
                        All Time Average
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sage-800">
                      {metrics.velocity.allTime.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-sage-600">
                      {metrics.processingTime.estimatedAllTime
                        ? `${Math.round(metrics.processingTime.estimatedAllTime)} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Insights */}
            {metrics.insights.length > 0 && (
              <div className="rounded-lg border border-sage-200/50 bg-white/60 p-6">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-sage-800">
                    <AlertCircle className="h-5 w-5 text-sage-500" />
                    Key Insights
                  </h3>
                  <p className="mt-1 text-xs text-sage-600">
                    Important trends and observations from DOJ processing data
                  </p>
                </div>
                <ul className="space-y-3">
                  {metrics.insights.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-sage-100 bg-cream-50/50 p-3 text-sm text-sage-700"
                    >
                      <span className="mt-0.5">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

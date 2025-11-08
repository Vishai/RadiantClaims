"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    customers: number;
    newThisWeek: number;
  };
  claims: {
    total: number;
    inProgress: number;
    readyForReview: number;
    approved: number;
    submittedThisWeek: number;
  };
  aiReview: {
    pending: number;
    needsReview: number;
    processing: number;
  };
  subscriptions: {
    active: number;
    diyPlan: number;
    legalPlan: number;
    revenue: number;
  };
  waitlist: {
    total: number;
    pending: number;
  };
  promoCodes: {
    active: number;
    totalRedemptions: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-600">
          {error || "Failed to load dashboard"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of RadiantClaims system metrics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.total}
                </p>
                <p className="text-xs text-gray-500">
                  +{stats.users.newThisWeek} this week
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/claims">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-green-100 p-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Claims
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.claims.total}
                </p>
                <p className="text-xs text-gray-500">
                  +{stats.claims.submittedThisWeek} this week
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-purple-100 p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.subscriptions.active}
              </p>
              <p className="text-xs text-gray-500">
                ${stats.subscriptions.revenue.toFixed(2)} MRR
              </p>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/ai-review">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Needs Review
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.aiReview.needsReview}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.aiReview.pending} pending
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Detailed Stats */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Overview</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Customers</p>
                    <p className="text-sm text-gray-500">Standard users</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.users.customers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admins</p>
                    <p className="text-sm text-gray-500">
                      System administrators
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {stats.users.admins}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Status */}
        <Card>
          <CardHeader>
            <CardTitle>Claims Pipeline</CardTitle>
            <CardDescription>Current claim statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {stats.claims.inProgress}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Ready for Review</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {stats.claims.readyForReview}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {stats.claims.approved}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>Active plans breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">DIY Prep</p>
                    <p className="text-sm text-gray-500">$149.99 + $24.99/mo</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {stats.subscriptions.diyPlan}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Legal Rep</p>
                    <p className="text-sm text-gray-500">Attorney path</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.subscriptions.legalPlan}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/waitlist"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Waitlist</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {stats.waitlist.pending}
                </Badge>
              </Link>
              <Link
                href="/admin/promo-codes"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Promo Codes</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {stats.promoCodes.active} active
                </Badge>
              </Link>
              <Link
                href="/admin/ai-review"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">AI Review Queue</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {stats.aiReview.needsReview} items
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <Activity className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

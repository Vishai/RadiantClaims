"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  CreditCard,
  Mail,
  Key,
  ArrowUpCircle,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
          <p className="mt-4 text-sage-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100">
      {/* Header */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <Link href="/portal">
            <Button
              variant="outline"
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sage-900">Account Settings</h1>
          <p className="mt-2 text-sage-600">
            Manage your account preferences and billing
          </p>
        </div>

        <div className="space-y-6">
          {/* Change Password */}
          <Card className="rounded-3xl border-2 border-cream-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-sage-900">
                    <Key className="h-5 w-5" />
                    Password
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
                <Button
                  onClick={() => router.push("/portal/change-password")}
                  className="rounded-full bg-sage-600 hover:bg-sage-700"
                >
                  Change Password
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Email Address */}
          <Card className="rounded-3xl border-2 border-cream-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-sage-900">
                    <Mail className="h-5 w-5" />
                    Email Address
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Current email: <strong>{session.user?.email}</strong>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-sage-300"
                  disabled
                >
                  Change Email (Coming Soon)
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Payment Method */}
          <Card className="rounded-3xl border-2 border-cream-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-sage-900">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Update your credit card information for future purchases
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-sage-300"
                  disabled
                >
                  Update Card (Coming Soon)
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Upgrade to Legal Representation */}
          <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
                    <ArrowUpCircle className="h-5 w-5" />
                    Upgrade to Legal Representation
                  </CardTitle>
                  <CardDescription className="mt-2 text-blue-700">
                    Get full legal support with Heritage Law Offices. No upfront
                    cost, only 2% fee when you win.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => router.push("/service-tiers?tier=LEGAL_REP")}
                  className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                >
                  Learn More
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-blue-300 bg-white p-4">
                <h4 className="mb-2 font-semibold text-blue-900">
                  What's included:
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span> Full legal
                    representation
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span> Attorney submits
                    to DOJ
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span> Resubmission if
                    denied
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span> Pay only 2% when
                    you win
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="rounded-3xl border-2 border-terracotta-200 bg-terracotta-50 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-terracotta-900">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </CardTitle>
                  <CardDescription className="mt-2 text-terracotta-700">
                    End your current session
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    // SECURITY: Clear all sessionStorage to prevent data leakage between users
                    sessionStorage.clear();
                    signOut({ callbackUrl: "/" });
                  }}
                  variant="outline"
                  className="rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                >
                  Sign Out
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}

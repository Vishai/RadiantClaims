"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Heart } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleBasedRedirect = async () => {
    // Check for callback URL first
    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl) {
      return callbackUrl;
    }

    // Fetch session to get user role
    const response = await fetch("/api/auth/session");
    const session = await response.json();

    if (!session?.user?.role) {
      return "/portal"; // Default to customer portal
    }

    // Role-based routing
    switch (session.user.role) {
      case "ADMIN":
        return "/dashboard";
      case "ATTORNEY":
      case "FIRM_ADMIN":
        return "/attorney/dashboard";
      case "CUSTOMER":
      default:
        return "/portal";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      // Get role-based redirect URL
      const redirectUrl = await getRoleBasedRedirect();
      router.push(redirectUrl as any);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-3xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <p className="mt-2 text-sm text-sage-600">Welcome back</p>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-sage-900">Sign In</CardTitle>
            <CardDescription className="text-sage-600">
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sage-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sage-800">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-terracotta-50 p-3 text-sm text-terracotta-800 border border-terracotta-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 border-t border-cream-200 pt-6 text-center">
              <Link
                href="/"
                className="text-sm text-sage-600 transition-colors hover:text-terracotta-600"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
          <p className="mt-4 text-sage-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

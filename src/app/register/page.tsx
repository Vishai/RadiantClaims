"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
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
import { getPrefillData, saveUserData } from "@/lib/user-data-manager";

const LOGIN_ROUTE = "/login" as Route;
const DEFAULT_REDIRECT_ROUTE = "/portal" as Route;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrlParam = searchParams.get("callbackUrl");

  // Prefill data from previous forms
  useEffect(() => {
    const prefillData = getPrefillData();

    if (prefillData.firstName && prefillData.lastName) {
      const fullName =
        `${prefillData.firstName} ${prefillData.lastName}`.trim();
      if (fullName && !name) setName(fullName);
    }

    if (prefillData.email && !email) {
      setEmail(prefillData.email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Save user data for future forms
      const nameParts = name.trim().split(" ");
      saveUserData(
        {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          email,
        },
        "registration"
      );

      // Create account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          accessCode: accessCode ? accessCode.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setTimeout(() => {
          router.push(LOGIN_ROUTE);
        }, 2000);
        return;
      }

      // Redirect to callback URL or default location
      const safeCallbackUrl =
        callbackUrlParam && callbackUrlParam.startsWith("/")
          ? (callbackUrlParam as Route)
          : DEFAULT_REDIRECT_ROUTE;
      router.push(safeCallbackUrl);
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginHref =
    callbackUrlParam && callbackUrlParam.startsWith("/")
      ? {
          pathname: LOGIN_ROUTE,
          query: { callbackUrl: callbackUrlParam },
        }
      : LOGIN_ROUTE;

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
          <p className="mt-2 text-sm text-sage-600">Create your account</p>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-sage-900">Create Account</CardTitle>
            <CardDescription className="text-sage-600">
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sage-800">
                  Full Name (Optional)
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sage-800">
                  Email
                </Label>
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
                <Label htmlFor="password" className="text-sage-800">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sage-800">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-sage-800">
                  Promo Code (optional)
                </Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="e.g. BETA-2025"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-terracotta-200 bg-terracotta-50 p-3 text-sm text-terracotta-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 space-y-4 border-t border-cream-200 pt-6 text-center">
              <p className="text-sm text-sage-600">
                Already have an account?{" "}
                <Link
                  href={loginHref}
                  className="font-semibold text-terracotta-600 transition-colors hover:text-terracotta-700"
                >
                  Sign In
                </Link>
              </p>
              <Link
                href="/"
                className="block text-sm text-sage-600 transition-colors hover:text-terracotta-600"
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
            <p className="mt-4 text-sage-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

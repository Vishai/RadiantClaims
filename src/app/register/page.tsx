"use client";

import { useState, Suspense } from "react";
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
  const [accessCodeStatus, setAccessCodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [accessCodeMessage, setAccessCodeMessage] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const callbackUrlParam = searchParams.get("callbackUrl");

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
        // Show more detailed message if registration is disabled
        if (response.status === 503) {
          setError(
            data.message || data.error || "Registration is temporarily disabled"
          );
          setShowWaitlist(true); // Show waitlist form option
          if (!accessCode) {
            setAccessCodeMessage(
              "Have an invite? Enter your access code to unlock registration."
            );
          }
        } else {
          setError(data.error || "Failed to create account");
        }
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
      setAccessCode("");
      setAccessCodeStatus("idle");
      setAccessCodeMessage(null);
      router.push(safeCallbackUrl);
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: "register_page",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to join waitlist");
        return;
      }

      setWaitlistSuccess(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Waitlist error:", err);
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

  const handleValidateAccessCode = async () => {
    if (!accessCode) {
      setAccessCodeMessage("Enter an invite code to validate access.");
      setAccessCodeStatus("invalid");
      return;
    }

    setAccessCodeStatus("checking");
    setAccessCodeMessage(null);

    try {
      const response = await fetch("/api/access/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAccessCodeStatus("invalid");
        setAccessCodeMessage(data.error || "Unable to validate code.");
        return;
      }

      setAccessCodeStatus("valid");
      setAccessCodeMessage(
        data.seatsTotal
          ? `${data.seatsRemaining}/${data.seatsTotal} seats remaining`
          : "Seats available"
      );
    } catch (err) {
      console.error("Access code validation error:", err);
      setAccessCodeStatus("invalid");
      setAccessCodeMessage("Unable to validate code. Please try again.");
    }
  };

  const handleAccessCodeChange = (value: string) => {
    setAccessCode(value);
    setAccessCodeStatus("idle");
    setAccessCodeMessage(null);
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
          <p className="mt-2 text-sm text-sage-600">Create your account</p>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-sage-900">
              {waitlistSuccess
                ? "You're on the List!"
                : showWaitlist
                  ? "Join Our Waitlist"
                  : "Create Account"}
            </CardTitle>
            <CardDescription className="text-sage-600">
              {waitlistSuccess
                ? "We'll notify you when registration opens"
                : showWaitlist
                  ? "Be the first to know when we're ready"
                  : "Enter your details to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {waitlistSuccess ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Heart
                      className="h-6 w-6 text-emerald-600"
                      fill="currentColor"
                    />
                  </div>
                  <p className="mb-2 text-lg font-semibold text-emerald-900">
                    Thank you for your interest!
                  </p>
                  <p className="text-sm text-emerald-700">
                    We've saved your information and will email you at{" "}
                    <strong>{email}</strong> as soon as registration opens.
                  </p>
                </div>
                <Link
                  href="/"
                  className="block w-full rounded-full bg-terracotta-500 py-2 text-center text-white transition-colors hover:bg-terracotta-600"
                >
                  Back to Home
                </Link>
              </div>
            ) : showWaitlist ? (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-semibold">
                    Registration is temporarily closed
                  </p>
                  <p className="mt-1">
                    Join our waitlist and we'll notify you the moment we're
                    accepting new users.
                  </p>
                  <p className="mt-1 text-amber-700">
                    Have an invite? Enter your access code on the registration
                    form to unlock early access.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waitlist-name" className="text-sage-800">
                    Full Name (Optional)
                  </Label>
                  <Input
                    id="waitlist-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waitlist-email" className="text-sage-800">
                    Email
                  </Label>
                  <Input
                    id="waitlist-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                    required
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
                  {isLoading ? "Joining..." : "Join Waitlist"}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowWaitlist(false)}
                  className="w-full text-sm text-sage-600 hover:text-terracotta-600"
                >
                  ← Back to registration form
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="accessCode" className="text-sage-800">
                      Access Code (optional)
                    </Label>
                    <p className="text-xs text-sage-600">
                      Have an invite from RadiantClaims? Enter it to for early
                      access to the platform.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="accessCode"
                      type="text"
                      placeholder="BETA-2025-01"
                      value={accessCode}
                      onChange={(e) => handleAccessCodeChange(e.target.value)}
                      className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateAccessCode}
                      disabled={!accessCode || accessCodeStatus === "checking"}
                    >
                      {accessCodeStatus === "checking"
                        ? "Validating..."
                        : "Validate Code"}
                    </Button>
                  </div>
                  {accessCodeMessage && (
                    <p
                      className={`text-sm ${
                        accessCodeStatus === "valid"
                          ? "text-emerald-600"
                          : "text-amber-700"
                      }`}
                    >
                      {accessCodeMessage}
                    </p>
                  )}
                </div>

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
            )}

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

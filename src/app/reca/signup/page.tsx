"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Heart, CheckCircle, AlertCircle } from "lucide-react";

export default function RECASignupPage() {
  const router = useRouter();
  // const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  const validatePasswordStrength = (pwd: string) => {
    if (pwd.length === 0) {
      setPasswordStrength(null);
      return;
    }

    let score = 0;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;

    if (score <= 2) setPasswordStrength("weak");
    else if (score <= 4) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    validatePasswordStrength(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Create account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          claimType: "DOWNWINDER",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      // const result = await response.json();

      // Auto-login
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but auto-login failed. Please login manually.");
        setTimeout(() => {
          router.push("/login?callbackUrl=/reca/start");
        }, 3000);
        return;
      }

      // Redirect to RECA start page
      router.push("/reca/start");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
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
          <p className="mt-2 text-sm text-sage-600">Create your account</p>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-sage-900">Sign Up for RECA Claim</CardTitle>
            <CardDescription className="text-sage-600">
              Create an account to save your progress and track your claim
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
                  onChange={handlePasswordChange}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                />
                {passwordStrength && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === "weak"
                            ? "w-1/3 bg-red-500"
                            : passwordStrength === "medium"
                            ? "w-2/3 bg-amber-500"
                            : "w-full bg-emerald-500"
                        }`}
                      />
                    </div>
                    <span
                      className={
                        passwordStrength === "weak"
                          ? "text-red-600"
                          : passwordStrength === "medium"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }
                    >
                      {passwordStrength === "weak" ? "Weak" : passwordStrength === "medium" ? "Medium" : "Strong"}
                    </span>
                  </div>
                )}
                <p className="text-xs text-sage-600">
                  Must be at least 12 characters with uppercase, lowercase, numbers, and special characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sage-800">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-terracotta-50 p-3 text-sm text-terracotta-800 border border-terracotta-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-emerald-50 p-4 border-2 border-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-sage-700">
                    <p className="font-semibold mb-2 text-sage-900">Benefits of creating an account:</p>
                    <ul className="space-y-1.5 ml-4 list-disc">
                      <li>Auto-save your progress every 2 minutes</li>
                      <li>Resume from any device</li>
                      <li><strong className="text-emerald-900">Payout Pulse:</strong> See your estimated payout date and queue position</li>
                      <li><strong className="text-emerald-900">Claim Timeline:</strong> Track DOJ milestones in real-time</li>
                      <li>Monitor medical records and cancer registry lookups</li>
                      <li>Get notified of claim progress updates</li>
                      <li>Secure document storage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account & Start Claim"}
              </Button>
            </form>

            <div className="mt-6 border-t border-cream-200 pt-6 text-center">
              <p className="text-sm text-sage-600">
                Already have an account?{" "}
                <Link
                  href="/login?callbackUrl=/reca/start"
                  className="text-terracotta-600 hover:underline font-medium"
                >
                  Sign In
                </Link>
              </p>
              <Link
                href="/reca/start"
                className="mt-2 block text-sm text-sage-600 transition-colors hover:text-terracotta-600"
              >
                ← Back to RECA Start
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, Save } from "lucide-react";

interface AccountCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  sessionId: string;
}

export function AccountCreationModal({
  open,
  onClose,
  onSkip,
  sessionId,
}: AccountCreationModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);

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
        // Show more detailed message if registration is disabled
        if (response.status === 503) {
          throw new Error(
            errorData.message ||
              errorData.error ||
              "Registration is temporarily disabled"
          );
        }
        throw new Error(errorData.error || "Failed to create account");
      }

      // Auto-login
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Account created but auto-login failed. Please refresh and login."
        );
        setIsLoading(false);
        return;
      }

      // Link session to user account
      await fetch(`/api/reca/workflow/${sessionId}/link-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Close modal and notify parent
      onClose();
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-100">
              <Save className="h-5 w-5 text-terracotta-600" />
            </div>
            <DialogTitle className="text-sage-900">
              Save Your Progress
            </DialogTitle>
          </div>
          <DialogDescription className="text-sage-600">
            Create an account to save your progress across devices and track
            your claim status
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              value={password}
              onChange={handlePasswordChange}
              className="rounded-xl border-cream-300 focus:border-terracotta-400 focus:ring-terracotta-400"
              required
            />
            {passwordStrength && (
              <div className="flex items-center gap-2 text-xs">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-cream-200">
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
                  {passwordStrength === "weak"
                    ? "Weak"
                    : passwordStrength === "medium"
                      ? "Medium"
                      : "Strong"}
                </span>
              </div>
            )}
            <p className="text-xs text-sage-600">
              At least 12 characters with uppercase, lowercase, numbers, and
              special characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sage-800">
              Confirm Password
            </Label>
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
            <div className="flex items-start gap-2 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-3 text-sm text-terracotta-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-sage-50 to-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="text-xs text-sage-700">
                <p className="mb-2 font-semibold text-sage-900">
                  What you'll unlock:
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    <strong className="text-emerald-900">Payout Pulse:</strong>{" "}
                    Estimated payout date
                  </li>
                  <li>
                    <strong className="text-emerald-900">
                      Timeline Tracking:
                    </strong>{" "}
                    See where your claim is
                  </li>
                  <li>Queue position & progress updates</li>
                  <li>Auto-save across all devices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

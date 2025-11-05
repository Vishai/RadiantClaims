"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { Heart, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isRequired = searchParams.get("required") === "true";

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal/change-password");
    }
  }, [status, router]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/portal/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      // Store new password before resetting form
      const newPasswordValue = data.newPassword;

      setSuccess(true);
      form.reset();

      // Sign out and immediately sign back in with new password to get fresh JWT
      // This ensures the passwordResetRequired flag is cleared from the token
      setTimeout(async () => {
        await signOut({ redirect: false });

        // Auto-login with new password
        const signInResult = await signIn("credentials", {
          email: session?.user?.email,
          password: newPasswordValue,
          redirect: false,
        });

        if (signInResult?.ok) {
          // Redirect based on role
          const roleBasedPath =
            session?.user?.role === "ATTORNEY"
              ? "/attorney/dashboard"
              : "/portal";
          router.push(roleBasedPath);
          router.refresh();
        } else {
          // If auto-login fails, redirect to login page
          router.push("/login");
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-sage-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/portal")}
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">
            Change Password
          </h1>
          <p className="text-lg text-sage-700">
            Update your account password for security
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {isRequired && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                !
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  Password Change Required
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  For security reasons, you must change your password before
                  accessing your account.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">Password Settings</CardTitle>
            <CardDescription className="text-sage-600">
              Enter your current password and choose a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                form={form}
                name="currentPassword"
                label="Current Password"
                type="password"
                required
              />

              <div className="space-y-4 rounded-2xl bg-cream-50 p-4">
                <h3 className="text-sm font-semibold text-sage-900">
                  New Password Requirements
                </h3>
                <ul className="space-y-1 text-xs text-sage-600">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase letter (A-Z)</li>
                  <li>• Contains lowercase letter (a-z)</li>
                  <li>• Contains number (0-9)</li>
                </ul>
              </div>

              <FormField
                form={form}
                name="newPassword"
                label="New Password"
                type="password"
                required
              />

              <FormField
                form={form}
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                required
              />

              {error && (
                <div className="rounded-2xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-900">
                        Password Changed Successfully!
                      </h3>
                      <p className="mt-1 text-sm text-emerald-700">
                        Signing you in with your new password...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                {!isRequired && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/portal")}
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="rounded-full bg-terracotta-500 px-8 hover:bg-terracotta-600"
                >
                  {isSubmitting ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6 text-center">
          <p className="text-sm text-sage-700">
            <strong>Security Tip:</strong> Use a strong, unique password that
            you don't use on other websites. Consider using a password manager
            to keep track of your passwords securely.
          </p>
        </div>
      </main>
    </div>
  );
}

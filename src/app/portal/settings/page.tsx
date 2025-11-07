"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PasswordChangeForm } from "@/components/user/PasswordChangeForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PortalSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      ADMIN: {
        label: "Administrator",
        className: "bg-purple-100 text-purple-800",
      },
      ATTORNEY: { label: "Attorney", className: "bg-blue-100 text-blue-800" },
      CUSTOMER: { label: "Customer", className: "bg-green-100 text-green-800" },
    };

    const config = roleConfig[role] || {
      label: role,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{session.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{session.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Account Type
              </label>
              <p className="mt-1">
                {getRoleBadge(session.user.role || "CUSTOMER")}
              </p>
            </div>
          </CardContent>
        </Card>

        <PasswordChangeForm />
      </div>
    </div>
  );
}

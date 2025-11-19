"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Heart, LogOut, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function SignOutPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    // Redirect to login after sign out
    await signOut({ callbackUrl: "/login" });
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
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100">
              <LogOut className="h-8 w-8 text-terracotta-600" />
            </div>
            <CardTitle className="text-2xl text-sage-900">Sign Out</CardTitle>
            <CardDescription className="text-sage-600">
              Are you sure you want to sign out of your account?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSignOut}
              className="w-full rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Yes, Sign Out"}
            </Button>

            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full rounded-full border-cream-300 text-sage-700 hover:bg-cream-50"
              disabled={isSigningOut}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-sage-500">
            Thanks for using RadiantClaims. See you again soon!
          </p>
        </div>
      </div>
    </div>
  );
}

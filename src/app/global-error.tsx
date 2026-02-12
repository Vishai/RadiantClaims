"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-cream-50">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-sage-900">
              Application Error
            </h1>
            <p className="mb-6 text-sage-700">
              A critical rendering error occurred. Please retry or return to the
              portal.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => reset()}
                className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                Retry
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/portal">Return to Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="w-full max-w-xl rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-sage-900">
          Something went wrong
        </h1>
        <p className="mb-6 text-sage-700">
          We hit an unexpected issue while rendering this page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
          >
            Try Again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/portal">Return to Portal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

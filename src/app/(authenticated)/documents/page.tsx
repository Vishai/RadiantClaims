"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Redirect from old /documents page to new unified /portal/documents page
 * This page has been deprecated in favor of the tabbed interface at /portal/documents
 */
export default function DocumentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified documents page
    router.replace("/portal/documents?tab=tracking");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-terracotta-500" />
        <p className="text-sage-700">Redirecting to Document Management...</p>
      </div>
    </div>
  );
}

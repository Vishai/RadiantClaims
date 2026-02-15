"use client";

import { FloatingContactAgent } from "@/components/contact-agent/FloatingContactAgent";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/**
 * Wrapper component that adds the floating contact agent to all pages
 * Only shows on specific pages where it's relevant
 */
export function AppWithContactAgent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [claimContext, setClaimContext] = useState<any>(null);

  // Don't show on login/signup pages
  const hideOnPages = ["/login", "/signup", "/auth"];
  const shouldHide = hideOnPages.some((page) => pathname?.startsWith(page));

  const pageContext = useMemo(() => {
    const urlSection = searchParams?.get("section") || undefined;
    const match = pathname?.match(
      /^\/reca\/(form|documents|review|supporting)\/([^/?#]+)/
    );
    const recaArea = match?.[1];
    const intakeSessionId = match?.[2];

    return {
      pathname,
      recaArea,
      intakeSessionId,
      section: urlSection,
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      if (!session?.user?.id) {
        setClaimContext(null);
        return;
      }

      if (!pageContext.intakeSessionId) {
        setClaimContext(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/chat/context?sessionId=${encodeURIComponent(
            pageContext.intakeSessionId
          )}`
        );
        if (!res.ok) {
          setClaimContext(null);
          return;
        }
        const json = await res.json();
        if (!cancelled) setClaimContext(json);
      } catch {
        if (!cancelled) setClaimContext(null);
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, pageContext.intakeSessionId]);

  const sessionContext = session?.user
    ? {
        state: claimContext?.claimant?.state,
        county: claimContext?.claimant?.county,
        claimType: claimContext?.claimType,
        intakeSessionId: claimContext?.sessionId || pageContext.intakeSessionId,
        recaWorkflowStage: claimContext?.recaWorkflowStage,
        recaWorkflowSection:
          claimContext?.recaWorkflowSection || pageContext.section,
        recaCompletionPercent: claimContext?.recaCompletionPercent,
        missingDocuments: claimContext?.missingDocuments,
        documentStatusCounts: claimContext?.documentStatusCounts,
        uploadedFiles: claimContext?.uploadedFiles,
      }
    : undefined;

  return (
    <>
      {children}
      {!shouldHide && <FloatingContactAgent sessionContext={sessionContext} />}
    </>
  );
}

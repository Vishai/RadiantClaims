"use client";

import { FloatingContactAgent } from "@/components/contact-agent/FloatingContactAgent";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

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

  // Don't show on login/signup pages
  const hideOnPages = ["/login", "/signup", "/auth"];
  const shouldHide = hideOnPages.some((page) => pathname?.startsWith(page));

  // Extract context from session if available
  const sessionContext = session?.user
    ? {
        // You can populate this from user's current claim if available
        state: undefined,
        county: undefined,
        claimType: undefined,
      }
    : undefined;

  return (
    <>
      {children}
      {!shouldHide && <FloatingContactAgent sessionContext={sessionContext} />}
    </>
  );
}

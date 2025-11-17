"use client";

import { SessionProvider } from "next-auth/react";
import { FloatingContactAgent } from "@/components/contact-agent/FloatingContactAgent";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show contact agent on login/signup pages
  const hideOnPages = ["/login", "/signup", "/auth", "/api"];
  const shouldHideAgent = hideOnPages.some((page) => pathname?.startsWith(page));

  return (
    <SessionProvider>
      {children}
      {!shouldHideAgent && <FloatingContactAgent />}
    </SessionProvider>
  );
}

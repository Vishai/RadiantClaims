"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FloatingContactAgent } from "./FloatingContactAgent";

export function ClientAgentWrapper() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show contact agent on these pages
  const hideOnPages = ["/login", "/signup", "/auth", "/api", "/reset-password"];

  if (hideOnPages.some((page) => pathname?.startsWith(page))) {
    return null;
  }

  return <FloatingContactAgent />;
}

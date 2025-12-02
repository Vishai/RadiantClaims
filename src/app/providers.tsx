"use client";

import { SessionProvider } from "next-auth/react";
import { ClientAgentWrapper } from "@/components/contact-agent/ClientAgentWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ClientAgentWrapper />
    </SessionProvider>
  );
}

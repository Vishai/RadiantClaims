"use client";

import { ReactNode, useEffect, useState } from "react";
import ClientSidebar from "@/components/tutorials/ClientSidebar/ClientSidebar";
import WalkthroughOverlay from "@/components/tutorials/Walkthrough/WalkthroughOverlay";
import { TutorialProvider } from "@/lib/tutorials/context";
import { TutorialTooltipProvider } from "@/components/tutorials/Tooltip/TooltipProvider";
import { HelpButton } from "@/components/tutorials/shared/HelpButton";

interface PortalLayoutShellProps {
  userId: string;
  children: ReactNode;
}

export default function PortalLayoutShell({
  userId,
  children,
}: PortalLayoutShellProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-muted-foreground">
        Loading portal…
      </div>
    );
  }

  return (
    <TutorialProvider userId={userId}>
      <TutorialTooltipProvider>
        <div className="flex h-screen bg-gray-50">
          <ClientSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((value) => !value)}
          />
          <main
            className={`flex-1 overflow-y-auto transition-all duration-300 ${
              sidebarCollapsed ? "ml-16" : "ml-72"
            }`}
          >
            {children}
          </main>
          <WalkthroughOverlay />
          <HelpButton onClick={() => setSidebarCollapsed(false)} />
        </div>
      </TutorialTooltipProvider>
    </TutorialProvider>
  );
}

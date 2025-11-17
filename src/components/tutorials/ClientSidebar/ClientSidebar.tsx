"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clock,
  FileText,
  HelpCircle,
  Menu,
  SidebarClose,
} from "lucide-react";
import { TutorialStatus } from "@prisma/client";
import type {
  ClientJourneyStage,
  TutorialProgressRecord,
} from "@/lib/tutorials";
import { useTutorialStore } from "@/lib/tutorials/context";
import { cn } from "@/lib/utils";
import { SidebarSection } from "./SidebarSection";
import { TutorialCenter } from "./TutorialCenter";
import { ClaimSnapshot } from "./ClaimSnapshot";
import { ContextualHelp } from "./ContextualHelp";
import { TutorialHistory } from "./TutorialHistory";
import { TutorialSettings } from "./TutorialSettings";
import { SupportContact } from "./SupportContact";
import { StageIndicator } from "../shared/StageIndicator";

interface ClientSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function ClientSidebar({
  collapsed,
  onToggle,
}: ClientSidebarProps) {
  const pathname = usePathname();
  const setActiveTutorial = useTutorialStore(
    (state) => state.setActiveTutorial
  );
  const bootstrap = useTutorialStore((state) => state.bootstrap);
  const tutorials = useTutorialStore((state) => state.tutorials);
  const [history, setHistory] = useState<TutorialProgressRecord[]>([]);
  const [stage, setStage] = useState<ClientJourneyStage | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/tutorials/progress");
      if (!res.ok) throw new Error("Failed to load tutorial history");
      const data = await res.json();
      setHistory(data.progress ?? []);
      setStage(data.stage ?? null);
    } catch (error) {
      console.error("[ClientSidebar] Failed to fetch progress", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleLaunch = useCallback(
    async (tutorialKey: string) => {
      try {
        const res = await fetch(`/api/tutorials/${tutorialKey}/start`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to start tutorial");
        await bootstrap();
        await fetchProgress();
        setActiveTutorial(tutorialKey);
      } catch (error) {
        console.error("[ClientSidebar] Failed to launch tutorial", error);
      }
    },
    [bootstrap, fetchProgress, setActiveTutorial]
  );

  const availableTutorialsCount = tutorials.filter(
    (tutorial) => tutorial.status !== TutorialStatus.COMPLETED
  ).length;

  return (
    <aside
      id="client-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border/60 bg-white/95 shadow-lg backdrop-blur",
        "transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <header className="flex items-center justify-between px-4 py-3">
        {collapsed ? (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground"
            onClick={onToggle}
            aria-label="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tutorial Center
              </p>
              <p className="text-xs text-muted-foreground">
                Guidance tailored to your claim
              </p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground"
              onClick={onToggle}
              aria-label="Collapse sidebar"
            >
              <SidebarClose className="h-4 w-4" />
            </button>
          </>
        )}
      </header>

      {!collapsed && (
        <div className="px-4 pb-4">
          <StageIndicator stage={stage} />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto">
        <SidebarSection
          title="Tutorial Center"
          icon={BookOpen}
          badge={availableTutorialsCount}
          collapsed={collapsed}
        >
          <TutorialCenter collapsed={collapsed} onLaunch={handleLaunch} />
        </SidebarSection>
        <SidebarSection title="My Claim" icon={FileText} collapsed={collapsed}>
          <ClaimSnapshot stage={stage} collapsed={collapsed} />
        </SidebarSection>
        <SidebarSection
          title="Help for This Page"
          icon={HelpCircle}
          collapsed={collapsed}
        >
          <ContextualHelp
            page={pathname}
            stage={stage}
            collapsed={collapsed}
            onLaunch={handleLaunch}
          />
        </SidebarSection>
        <SidebarSection
          title="Tutorial History"
          icon={Clock}
          collapsed={collapsed}
        >
          <TutorialHistory
            history={history}
            loading={historyLoading}
            collapsed={collapsed}
          />
        </SidebarSection>
      </nav>

      <footer className="space-y-4 border-t border-border/60 px-4 py-4">
        <SupportContact />
        {!collapsed && <TutorialSettings />}
      </footer>
    </aside>
  );
}

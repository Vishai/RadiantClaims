"use client";

import { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { TooltipManager } from "@/lib/tutorials";
import { useTutorialStore } from "@/lib/tutorials/context";

const TooltipManagerContext = createContext<TooltipManager | null>(null);

export function TutorialTooltipProvider({ children }: { children: ReactNode }) {
  const preferences = useTutorialStore((state) => state.preferences);
  const managerRef = useRef<TooltipManager>();

  if (!managerRef.current) {
    managerRef.current = new TooltipManager({ preferences });
  }

  useEffect(() => {
    if (preferences) {
      managerRef.current?.updatePreferences(preferences);
    }
  }, [preferences]);

  return (
    <TooltipManagerContext.Provider value={managerRef.current}>
      {children}
    </TooltipManagerContext.Provider>
  );
}

export function useTooltipManager() {
  const manager = useContext(TooltipManagerContext);
  if (!manager)
    throw new Error(
      "useTooltipManager must be used within TutorialTooltipProvider"
    );
  return manager;
}

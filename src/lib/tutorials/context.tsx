"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TutorialPreferenceSettings, TutorialSummary } from "./types";
import { tutorialDefinitions } from "./definitions";

interface TutorialContextValue {
  userId: string;
  tutorials: TutorialSummary[];
  activeTutorialKey: string | null;
  preferences?: TutorialPreferenceSettings;
  loading: boolean;
  errors: string[];
  setActiveTutorial(key: string | null): void;
  setPreferences(preferences: TutorialPreferenceSettings): void;
  setTutorials(tutorials: TutorialSummary[]): void;
  bootstrap(): Promise<void>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [tutorials, setTutorials] = useState<TutorialSummary[]>(
    tutorialDefinitions.map((definition) => ({ ...definition }))
  );
  const [activeTutorialKey, setActiveTutorialKey] = useState<string | null>(
    null
  );
  const [preferences, setPreferences] = useState<
    TutorialPreferenceSettings | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const bootstrapInFlight = useRef(false);

  const bootstrap = useCallback(async () => {
    if (bootstrapInFlight.current) return;
    bootstrapInFlight.current = true;
    setLoading(true);
    try {
      const [prefsRes, tutorialsRes] = await Promise.all([
        fetch("/api/tutorials/preferences").then((res) =>
          res.ok ? res.json() : null
        ),
        fetch("/api/tutorials/list").then((res) =>
          res.ok ? res.json() : null
        ),
      ]);

      if (prefsRes) {
        setPreferences(prefsRes);
      }

      if (tutorialsRes?.data) {
        setTutorials(tutorialsRes.data);
      }
    } catch (error) {
      console.error("[TutorialProvider] bootstrap failed", error);
      setErrors((prev) => [...prev, "Unable to load tutorial settings"]);
    } finally {
      setLoading(false);
      bootstrapInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      userId,
      tutorials,
      activeTutorialKey,
      preferences,
      loading,
      errors,
      setActiveTutorial: setActiveTutorialKey,
      setPreferences,
      setTutorials,
      bootstrap,
    }),
    [
      userId,
      tutorials,
      activeTutorialKey,
      preferences,
      loading,
      errors,
      bootstrap,
    ]
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorialStore<T>(
  selector: (state: TutorialContextValue) => T
): T {
  const context = useContext(TutorialContext);
  if (!context)
    throw new Error("useTutorialStore must be used within TutorialProvider");
  return selector(context);
}

export function useTutorialPreferences() {
  return useTutorialStore((state) => state.preferences);
}

export function useActiveTutorial() {
  return useTutorialStore((state) => {
    if (!state.activeTutorialKey) return null;
    return (
      state.tutorials.find(
        (tutorial) => tutorial.key === state.activeTutorialKey
      ) ?? null
    );
  });
}

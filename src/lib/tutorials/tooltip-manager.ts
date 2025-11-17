import type {
  TutorialPreferenceSettings,
  TooltipConfig,
  TooltipRuntimeState,
} from "./types";

interface TooltipManagerOptions {
  initialState?: Record<string, TooltipRuntimeState>;
  preferences?: TutorialPreferenceSettings;
}

export class TooltipManager {
  private readonly state = new Map<string, TooltipRuntimeState>();
  private preferences?: TutorialPreferenceSettings;

  constructor(options: TooltipManagerOptions = {}) {
    this.preferences = options.preferences;
    if (options.initialState) {
      Object.entries(options.initialState).forEach(([id, runtime]) =>
        this.state.set(id, runtime)
      );
    }
  }

  updatePreferences(preferences: TutorialPreferenceSettings) {
    this.preferences = preferences;
  }

  shouldShowTooltip(config: TooltipConfig): boolean {
    if (this.preferences && !this.preferences.tooltipsEnabled) return false;
    const runtime = this.state.get(config.id);
    if (!runtime) return true;
    if (runtime.dismissed) return false;
    if (runtime.snoozedUntil && new Date(runtime.snoozedUntil) > new Date())
      return false;
    if (config.showOnce && runtime.lastShownAt) return false;
    return true;
  }

  markShown(id: string) {
    const existing = this.state.get(id) ?? {};
    this.state.set(id, {
      ...existing,
      lastShownAt: new Date().toISOString(),
      snoozedUntil: undefined,
    });
  }

  dismiss(id: string) {
    const existing = this.state.get(id) ?? {};
    this.state.set(id, { ...existing, dismissed: true });
  }

  snooze(id: string, days: number) {
    const existing = this.state.get(id) ?? {};
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + days);
    this.state.set(id, {
      ...existing,
      snoozedUntil: snoozedUntil.toISOString(),
    });
  }

  serialize(): Record<string, TooltipRuntimeState> {
    return Object.fromEntries(this.state.entries());
  }
}

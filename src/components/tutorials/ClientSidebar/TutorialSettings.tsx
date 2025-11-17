"use client";

import { useState } from "react";
import { HelpIntensity } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTutorialStore } from "@/lib/tutorials/context";

export function TutorialSettings() {
  const preferences = useTutorialStore((state) => state.preferences);
  const setPreferences = useTutorialStore((state) => state.setPreferences);
  const [saving, setSaving] = useState(false);

  if (!preferences) {
    return (
      <p className="text-sm text-muted-foreground">Loading preferences…</p>
    );
  }

  const handleUpdate = async (patch: Partial<typeof preferences>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/tutorials/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      const updated = await res.json();
      setPreferences(updated);
    } catch (error) {
      console.error("[TutorialSettings] Failed to update preferences", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SettingRow
        label="Tooltips"
        description="Lightweight hints on important UI elements."
        control={
          <Switch
            checked={preferences.tooltipsEnabled}
            disabled={saving}
            onCheckedChange={(value) =>
              handleUpdate({ tooltipsEnabled: value })
            }
          />
        }
      />
      <SettingRow
        label="Walkthroughs"
        description="Full guided tours with highlighted steps."
        control={
          <Switch
            checked={preferences.walkthroughsEnabled}
            disabled={saving}
            onCheckedChange={(value) =>
              handleUpdate({ walkthroughsEnabled: value })
            }
          />
        }
      />
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">
          Help intensity
        </Label>
        <Select
          value={preferences.helpIntensity}
          onValueChange={(value: HelpIntensity) =>
            handleUpdate({ helpIntensity: value })
          }
          disabled={saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={HelpIntensity.MINIMAL}>
              Minimal nudges
            </SelectItem>
            <SelectItem value={HelpIntensity.BASIC}>Basic guidance</SelectItem>
            <SelectItem value={HelpIntensity.DETAILED}>
              Detailed tips
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  );
}

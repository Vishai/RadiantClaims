"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LawFirmNotificationEvent } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MailPlus } from "lucide-react";

type NotificationSetting = {
  event: LawFirmNotificationEvent;
  notifyPrimaryContact: boolean;
  recipientEmails: string[];
};

const EVENT_DEFINITIONS: Record<
  LawFirmNotificationEvent,
  { title: string; description: string }
> = {
  NEW_CLIENT_ASSIGNED: {
    title: "New client assigned",
    description:
      "Alert when a claimant chooses legal representation or is routed to your firm.",
  },
  PACKET_UPDATED: {
    title: "Packet progress updates",
    description:
      "Notify your team when a claimant uploads documents, makes revisions, or advances workflow stages.",
  },
  PACKET_READY: {
    title: "Packet ready to mail",
    description:
      "Send a heads-up when a packet is ready for attorney approval / mailing.",
  },
};

const EVENT_ORDER: LawFirmNotificationEvent[] = [
  LawFirmNotificationEvent.NEW_CLIENT_ASSIGNED,
  LawFirmNotificationEvent.PACKET_UPDATED,
  LawFirmNotificationEvent.PACKET_READY,
];

const DEFAULT_SETTINGS: NotificationSetting[] = EVENT_ORDER.map((event) => ({
  event,
  notifyPrimaryContact: true,
  recipientEmails: [],
}));

export default function AttorneyNotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] =
    useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [draftEmails, setDraftEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login?callbackUrl=/attorney/settings");
      return;
    }

    if (
      session.user.role !== "ATTORNEY" &&
      session.user.role !== "FIRM_ADMIN"
    ) {
      router.push("/portal");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/attorney/notifications");
        if (!res.ok) {
          throw new Error("Failed to load settings");
        }
        const data = await res.json();
        setSettings(
          EVENT_ORDER.map(
            (event) =>
              data.settings.find(
                (setting: NotificationSetting) => setting.event === event
              ) ?? DEFAULT_SETTINGS.find((s) => s.event === event)!
          )
        );
      } catch (error) {
        console.error(error);
        setMessage({
          type: "error",
          text: "Unable to load notification settings.",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, [session, status]);

  const settingsMap = useMemo(() => {
    const map: Record<LawFirmNotificationEvent, NotificationSetting> = {
      NEW_CLIENT_ASSIGNED: DEFAULT_SETTINGS[0],
      PACKET_UPDATED: DEFAULT_SETTINGS[1],
      PACKET_READY: DEFAULT_SETTINGS[2],
    };
    for (const setting of settings) {
      map[setting.event] = setting;
    }
    return map;
  }, [settings]);

  const handleTogglePrimary = (
    event: LawFirmNotificationEvent,
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.event === event
          ? { ...setting, notifyPrimaryContact: value }
          : setting
      )
    );
  };

  const handleEmailInputChange = (
    event: LawFirmNotificationEvent,
    value: string
  ) => {
    setDraftEmails((prev) => ({ ...prev, [event]: value }));
  };

  const handleAddEmail = (event: LawFirmNotificationEvent) => {
    const value = (draftEmails[event] || "").trim();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    setSettings((prev) =>
      prev.map((setting) =>
        setting.event === event
          ? {
              ...setting,
              recipientEmails: Array.from(
                new Set([...setting.recipientEmails, value.toLowerCase()])
              ).slice(0, 10),
            }
          : setting
      )
    );
    setDraftEmails((prev) => ({ ...prev, [event]: "" }));
    setMessage(null);
  };

  const handleRemoveEmail = (
    event: LawFirmNotificationEvent,
    email: string
  ) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.event === event
          ? {
              ...setting,
              recipientEmails: setting.recipientEmails.filter(
                (existing) => existing !== email
              ),
            }
          : setting
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/attorney/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        throw new Error("Failed to update notification settings.");
      }
      const data = await res.json();
      setSettings(data.settings);
      setMessage({
        type: "success",
        text: "Notification preferences updated.",
      });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Unable to save notification settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading notification preferences…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Notification Preferences
        </h1>
        <p className="text-slate-600">
          Decide who at your firm receives emails at key milestones. Primary
          contact notifications can be toggled on/off, and you may add up to 10
          additional recipients per event.
        </p>
      </div>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="border"
        >
          <AlertTitle>
            {message.type === "error" ? "Heads up" : "Success"}
          </AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {EVENT_ORDER.map((event) => {
          const setting = settingsMap[event];
          const info = EVENT_DEFINITIONS[event];

          return (
            <Card key={event} className="border-slate-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg text-slate-900">
                  {info.title}
                </CardTitle>
                <p className="text-sm text-slate-500">{info.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Primary contact notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Send to the firm’s main contact email on file.
                    </p>
                  </div>
                  <Switch
                    checked={setting.notifyPrimaryContact}
                    onCheckedChange={(value) =>
                      handleTogglePrimary(event, value)
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        placeholder="teammate@firm.com"
                        value={draftEmails[event] || ""}
                        onChange={(e) =>
                          handleEmailInputChange(event, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleAddEmail(event)}
                      >
                        <MailPlus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Up to 10 emails per event.
                    </p>
                  </div>

                  {setting.recipientEmails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {setting.recipientEmails.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="flex items-center gap-1 bg-slate-100 text-slate-700"
                        >
                          {email}
                          <button
                            type="button"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => handleRemoveEmail(event, email)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No additional recipients yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}

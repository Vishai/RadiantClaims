import { NextRequest, NextResponse } from "next/server";
import { LawFirmNotificationEvent } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

const EVENT_ORDER = [
  LawFirmNotificationEvent.NEW_CLIENT_ASSIGNED,
  LawFirmNotificationEvent.PACKET_UPDATED,
  LawFirmNotificationEvent.PACKET_READY,
] as const;

type IncomingNotificationSetting = {
  event?: string;
  notifyPrimaryContact?: boolean;
  recipientEmails?: string[] | null;
};

function requireAttorneySession(
  session: Awaited<ReturnType<typeof getServerAuthSession>>
) {
  if (!session?.user) {
    throw new Error("unauthorized");
  }

  if (session.user.role !== "ATTORNEY" && session.user.role !== "FIRM_ADMIN") {
    throw new Error("forbidden");
  }

  if (!session.user.firmId) {
    throw new Error("no-firm");
  }

  return session.user;
}

function sanitizeEmailList(emails: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
  }
  return cleaned.slice(0, 10);
}

async function fetchSettings(firmId: string) {
  const settings = await db.lawFirmNotificationSetting.findMany({
    where: { firmId },
  });

  const byEvent = new Map(settings.map((s) => [s.event, s]));

  return EVENT_ORDER.map((event) => {
    const existing = byEvent.get(event);
    return {
      event,
      notifyPrimaryContact: existing?.notifyPrimaryContact ?? true,
      recipientEmails: existing?.recipientEmails ?? [],
    };
  });
}

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const user = requireAttorneySession(session);

    const settings = await fetchSettings(user.firmId!);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden" || error.message === "no-firm") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("[LawFirmNotifications] GET failed", error);
    return NextResponse.json(
      { error: "Failed to load notification settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    const user = requireAttorneySession(session);
    const firmId = user.firmId!;

    const body = await req.json();
    const incoming: IncomingNotificationSetting[] = Array.isArray(
      body?.settings
    )
      ? (body.settings as IncomingNotificationSetting[])
      : [];

    const payload = incoming
      .filter((item) =>
        EVENT_ORDER.includes(item?.event as LawFirmNotificationEvent)
      )
      .map((item) => ({
        event: item.event as LawFirmNotificationEvent,
        notifyPrimaryContact:
          typeof item.notifyPrimaryContact === "boolean"
            ? item.notifyPrimaryContact
            : true,
        recipientEmails: sanitizeEmailList(item.recipientEmails ?? []),
      }));

    if (payload.length === 0) {
      return NextResponse.json(
        { error: "No valid notification settings provided" },
        { status: 400 }
      );
    }

    await db.$transaction(
      payload.map((item) =>
        db.lawFirmNotificationSetting.upsert({
          where: {
            firmId_event: {
              firmId,
              event: item.event,
            },
          },
          create: {
            firmId,
            event: item.event,
            notifyPrimaryContact: item.notifyPrimaryContact,
            recipientEmails: item.recipientEmails,
          },
          update: {
            notifyPrimaryContact: item.notifyPrimaryContact,
            recipientEmails: item.recipientEmails,
          },
        })
      )
    );

    const settings = await fetchSettings(firmId);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden" || error.message === "no-firm") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("[LawFirmNotifications] PUT failed", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}

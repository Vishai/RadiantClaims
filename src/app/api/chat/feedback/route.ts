import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat/feedback
 *
 * Minimal analytics endpoint.
 * Attaches thumbs up/down feedback to a specific assistant message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messageId = String(body?.messageId || "");
    const chatSessionId = body?.chatSessionId ? String(body.chatSessionId) : "";
    const rating = body?.rating === "down" ? "down" : "up";
    const source = body?.source ? String(body.source) : "unknown";

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, sessionId: true, metadata: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (chatSessionId && existing.sessionId !== chatSessionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metadata = (existing.metadata || {}) as any;
    const nextMetadata = {
      ...metadata,
      feedback: {
        ...(metadata.feedback || {}),
        rating,
        source,
        at: new Date().toISOString(),
      },
    };

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { metadata: nextMetadata },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[chat/feedback] error", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { apiRateLimiter, createRateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/support/chat-escalation
 *
 * Creates a lightweight support request by emailing support@radiantclaims.com
 * with the chat transcript and claim context.
 *
 * Body:
 * - chatSessionId?: string
 * - message: string (what the user wants help with)
 * - intakeSessionId?: string
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateResult = await apiRateLimiter.limit(`chat-escalation:${ip}`);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const chatSessionId = body?.chatSessionId as string | undefined;
    const intakeSessionId = body?.intakeSessionId as string | undefined;
    const userMessage = (body?.message as string | undefined)?.trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    let transcript = "";
    if (chatSessionId) {
      const chat = await prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 30 },
          claimant: true,
          user: true,
        },
      });

      if (chat) {
        transcript = chat.messages
          .map((m) => `[${m.role}] ${m.content}`)
          .join("\n\n");
      }
    }

    let claimSummary = "";
    if (intakeSessionId) {
      const intake = await prisma.intakeSession.findUnique({
        where: { id: intakeSessionId },
        include: { claimant: true },
      });
      if (intake?.claimant) {
        claimSummary = `Claimant: ${intake.claimant.firstName} ${intake.claimant.lastName}\nState/County: ${intake.claimant.state || ""} ${intake.claimant.county || ""}\nClaim Type: ${intake.claimType || ""}\nSection: ${intake.recaWorkflowSection || ""}\nCompletion: ${intake.recaCompletionPercent ?? ""}%`;
      }
    }

    const html = `
      <h2>RadiantClaims Support Request</h2>
      <p><strong>User:</strong> ${session.user.email || session.user.id}</p>
      <p><strong>What they need help with:</strong></p>
      <pre style="white-space:pre-wrap">${escapeHtml(userMessage)}</pre>
      ${claimSummary ? `<h3>Claim Context</h3><pre style="white-space:pre-wrap">${escapeHtml(claimSummary)}</pre>` : ""}
      ${transcript ? `<h3>Recent Chat Transcript</h3><pre style="white-space:pre-wrap">${escapeHtml(transcript)}</pre>` : ""}
    `;

    const result = await sendEmail({
      to: "support@radiantclaims.com",
      from: "RadiantClaims Support <support@radiantclaims.com>",
      subject: "[Support Request] Chat escalation",
      html,
    });

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error("[support/chat-escalation] error", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

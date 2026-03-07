import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getInviteByToken } from "@/lib/collaboration";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  token: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request", details: body.error.errors },
        { status: 400 }
      );
    }

    const { token } = body.data;

    const invite = await getInviteByToken(token);

    if (!invite || invite.revokedAt) {
      return NextResponse.json(
        { error: "Invite not found or revoked" },
        { status: 404 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    if (!invite.acceptedAt) {
      await db.intakeSessionInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      intakeSessionId: invite.intakeSessionId,
      inviteName: invite.name,
      token,
    });
  } catch (error) {
    return createCollaborationErrorResponse(error, "accept");
  }
}

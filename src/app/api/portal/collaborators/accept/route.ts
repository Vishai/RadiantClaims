import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  token: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request", details: body.error.errors },
        { status: 400 }
      );
    }

    const { token } = body.data;

    const invite = await db.intakeSessionInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.revokedAt) {
      return NextResponse.json(
        { error: "Invite not found or revoked" },
        { status: 404 }
      );
    }

    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: "Invite already accepted" },
        { status: 409 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Optional: enforce email match (recommended)
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      await tx.intakeSessionInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      const collab = await tx.intakeSessionCollaborator.upsert({
        where: {
          intakeSessionId_userId: {
            intakeSessionId: invite.intakeSessionId,
            userId: session.user.id,
          },
        },
        create: {
          intakeSessionId: invite.intakeSessionId,
          userId: session.user.id,
          role: invite.role,
          invitedByUserId: invite.invitedByUserId,
          acceptedAt: new Date(),
        },
        update: {
          role: invite.role,
          acceptedAt: new Date(),
        },
      });

      return collab;
    });

    return NextResponse.json({
      success: true,
      intakeSessionId: result.intakeSessionId,
      inviteName: invite.name,
    });
  } catch (error) {
    return createCollaborationErrorResponse(error, "accept");
  }
}

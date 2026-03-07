import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCanAccessIntakeSession } from "@/lib/collaboration";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  intakeSessionId: z.string(),
  collaboratorUserId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request", details: body.error.errors },
        { status: 400 }
      );
    }

    const { intakeSessionId, collaboratorUserId } = body.data;

    const access = await assertCanAccessIntakeSession({
      intakeSessionId,
      userId: session.user.id,
      requireOwner: true,
    });

    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.intakeSessionCollaborator.deleteMany({
      where: { intakeSessionId, userId: collaboratorUserId },
    });

    await db.intakeSessionInvite.updateMany({
      where: {
        intakeSessionId,
        email: {
          equals: (
            await db.user.findUnique({
              where: { id: collaboratorUserId },
              select: { email: true },
            })
          )?.email?.toLowerCase(),
        },
        revokedAt: null,
        acceptedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createCollaborationErrorResponse(error, "revoke");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCanAccessIntakeSession } from "@/lib/collaboration";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  intakeSessionId: z.string(),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const intakeSessionId = url.searchParams.get("intakeSessionId");

    const parsed = schema.safeParse({ intakeSessionId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const access = await assertCanAccessIntakeSession({
      intakeSessionId: parsed.data.intakeSessionId,
      userId: session.user.id,
      requireOwner: true,
    });

    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [collaborators, invites] = await Promise.all([
      db.intakeSessionCollaborator.findMany({
        where: { intakeSessionId: parsed.data.intakeSessionId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          acceptedAt: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      db.intakeSessionInvite.findMany({
        where: {
          intakeSessionId: parsed.data.intakeSessionId,
          revokedAt: null,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, collaborators, invites });
  } catch (error) {
    return createCollaborationErrorResponse(error, "list");
  }
}

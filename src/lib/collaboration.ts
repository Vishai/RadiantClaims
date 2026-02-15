import crypto from "crypto";
import { db } from "@/lib/db";

export async function assertCanAccessIntakeSession(params: {
  intakeSessionId: string;
  userId: string;
  requireOwner?: boolean;
}) {
  const { intakeSessionId, userId, requireOwner = false } = params;

  const intakeSession = await db.intakeSession.findUnique({
    where: { id: intakeSessionId },
    select: {
      id: true,
      claimant: { select: { userId: true } },
    },
  });

  if (!intakeSession) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const ownerUserId = intakeSession.claimant?.userId;
  const isOwner = !!ownerUserId && ownerUserId === userId;

  if (requireOwner) {
    return isOwner
      ? { ok: true as const, isOwner: true, intakeSessionId }
      : { ok: false as const, reason: "not_owner" as const };
  }

  if (isOwner) {
    return { ok: true as const, isOwner: true, intakeSessionId };
  }

  const collab = await db.intakeSessionCollaborator.findUnique({
    where: {
      intakeSessionId_userId: {
        intakeSessionId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!collab) {
    return { ok: false as const, reason: "no_access" as const };
  }

  return {
    ok: true as const,
    isOwner: false,
    role: collab.role,
    intakeSessionId,
  };
}

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

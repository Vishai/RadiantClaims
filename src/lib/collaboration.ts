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

export async function getInviteByToken(token: string) {
  return db.intakeSessionInvite.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      intakeSessionId: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      revokedAt: true,
      acceptedAt: true,
    },
  });
}

export async function assertInviteTokenAccess(params: {
  intakeSessionId: string;
  token: string;
}) {
  const { intakeSessionId, token } = params;
  const invite = await getInviteByToken(token);

  if (!invite || invite.revokedAt) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (invite.intakeSessionId !== intakeSessionId) {
    return { ok: false as const, reason: "wrong_session" as const };
  }

  if (invite.expiresAt < new Date()) {
    return { ok: false as const, reason: "expired" as const };
  }

  return {
    ok: true as const,
    intakeSessionId,
    invite,
  };
}

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

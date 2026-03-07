import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assertCanAccessIntakeSession,
  generateInviteToken,
} from "@/lib/collaboration";
import * as React from "react";
import { sendEmail } from "@/lib/resend";
import ClientCollaboratorInviteEmail from "@/emails/client/collaborator-invite";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  intakeSessionId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["VIEWER", "CONTRIBUTOR"]).optional(),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const { intakeSessionId, email, name, role } = body.data;

    const access = await assertCanAccessIntakeSession({
      intakeSessionId,
      userId: session.user.id,
      requireOwner: true,
    });

    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await db.intakeSessionInvite.create({
      data: {
        token,
        intakeSessionId,
        invitedByUserId: session.user.id,
        email: email.toLowerCase(),
        name: name ?? null,
        role: role ?? "CONTRIBUTOR",
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
    const acceptUrl = `${baseUrl}/portal/invites/accept?token=${invite.token}`;

    const inviterName =
      session.user.name || session.user.email || "A family member";

    const delivery = await sendEmail({
      to: invite.email,
      subject: "You’ve been invited to help with a RECA claim",
      from: "RadiantClaims Support <support@radiantclaims.com>",
      react: React.createElement(ClientCollaboratorInviteEmail, {
        inviterName,
        acceptUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      emailSent: delivery.success,
      emailError: delivery.success ? null : delivery.message,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        acceptUrl,
      },
    });
  } catch (error) {
    return createCollaborationErrorResponse(error, "invite");
  }
}

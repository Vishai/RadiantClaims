import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assertCanAccessIntakeSession,
  assertInviteTokenAccess,
} from "@/lib/collaboration";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const schema = z.object({
  intakeSessionId: z.string(),
  inviteToken: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const intakeSessionId = url.searchParams.get("intakeSessionId");
    const inviteToken = url.searchParams.get("inviteToken") || undefined;
    const parsed = schema.safeParse({ intakeSessionId, inviteToken });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    let access:
      | Awaited<ReturnType<typeof assertCanAccessIntakeSession>>
      | Awaited<ReturnType<typeof assertInviteTokenAccess>>;

    if (parsed.data.inviteToken) {
      access = await assertInviteTokenAccess({
        intakeSessionId: parsed.data.intakeSessionId,
        token: parsed.data.inviteToken,
      });
    } else {
      const session = await getServerAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      access = await assertCanAccessIntakeSession({
        intakeSessionId: parsed.data.intakeSessionId,
        userId: session.user.id,
      });
    }

    if (!access.ok) {
      return NextResponse.json(
        {
          error:
            "reason" in access && access.reason === "expired"
              ? "Invite expired"
              : "Forbidden",
        },
        {
          status: "reason" in access && access.reason === "expired" ? 410 : 403,
        }
      );
    }

    const intakeSession = await db.intakeSession.findUnique({
      where: { id: parsed.data.intakeSessionId },
      select: {
        id: true,
        claimType: true,
        recaFormData: true,
        recaSupportingForms: true,
        claimant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        uploadedFiles: {
          where: {
            status: {
              notIn: ["FAILED", "REJECTED"],
            },
          },
          select: {
            id: true,
            category: true,
            originalFilename: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: "desc",
          },
          take: 12,
        },
      },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const formData =
      typeof intakeSession.recaFormData === "string"
        ? JSON.parse(intakeSession.recaFormData)
        : intakeSession.recaFormData || {};
    const supportingForms =
      typeof intakeSession.recaSupportingForms === "string"
        ? JSON.parse(intakeSession.recaSupportingForms)
        : intakeSession.recaSupportingForms || {};

    const siblings = Array.isArray(formData?.part_6?.siblings)
      ? formData.part_6.siblings.map(
          (sibling: Record<string, unknown>, index: number) => ({
            index,
            name: sibling.name ?? "",
            dateOfBirth: sibling.dateOfBirth ?? "",
            cityOfBirth: sibling.cityOfBirth ?? "",
            stateOfBirth: sibling.stateOfBirth ?? "",
            isDeceased: sibling.isDeceased ?? "NO",
            currentAddress: sibling.currentAddress ?? "",
            phoneNumber: sibling.phoneNumber ?? "",
            hadNameChange: sibling.hadNameChange ?? "NO",
            originalLastName: sibling.originalLastName ?? "",
            nameChangeHistory: Array.isArray(sibling.nameChangeHistory)
              ? sibling.nameChangeHistory
              : [],
          })
        )
      : [];

    return NextResponse.json({
      success: true,
      access,
      session: {
        id: intakeSession.id,
        claimType: intakeSession.claimType,
        claimantName:
          intakeSession.claimant?.firstName && intakeSession.claimant?.lastName
            ? `${intakeSession.claimant.firstName} ${intakeSession.claimant.lastName}`
            : "RECA Claim",
        relationship: formData?.part_3?.relationship ?? null,
        siblings,
        beneficiaries:
          supportingForms?.survivingBeneficiariesSignatures?.beneficiaries ??
          [],
        inviteName: "invite" in access ? (access.invite.name ?? null) : null,
        uploadedFiles: intakeSession.uploadedFiles,
      },
    });
  } catch (error) {
    return createCollaborationErrorResponse(error, "session");
  }
}

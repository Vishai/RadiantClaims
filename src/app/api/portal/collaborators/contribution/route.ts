import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assertCanAccessIntakeSession,
  assertInviteTokenAccess,
} from "@/lib/collaboration";
import { createCollaborationErrorResponse } from "@/lib/prisma-error-response";

const nameChangeSchema = z.object({
  previousName: z.string().optional().default(""),
  dateOfChange: z.string().optional().default(""),
  reasonForChange: z
    .enum(["MARRIAGE", "DIVORCE", "LEGAL_NAME_CHANGE", "OTHER"])
    .optional()
    .default("MARRIAGE"),
  otherReason: z.string().optional().default(""),
});

const schema = z.object({
  intakeSessionId: z.string(),
  inviteToken: z.string().optional(),
  siblingIndex: z.number().int().min(0),
  sibling: z.object({
    dateOfBirth: z.string().optional().default(""),
    cityOfBirth: z.string().optional().default(""),
    stateOfBirth: z.string().optional().default(""),
    currentAddress: z.string().optional().default(""),
    phoneNumber: z.string().optional().default(""),
    hadNameChange: z.enum(["YES", "NO"]).optional().default("NO"),
    originalLastName: z.string().optional().default(""),
    nameChangeHistory: z.array(nameChangeSchema).optional().default([]),
  }),
  beneficiary: z
    .object({
      beneficiarySsn: z.string().optional().default(""),
      signatureDate: z.string().optional().default(""),
      signature: z.string().optional().default(""),
      attorneyName: z.string().optional().default(""),
      attorneyPhone: z.string().optional().default(""),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { intakeSessionId, inviteToken, siblingIndex, sibling, beneficiary } =
      parsed.data;

    let access:
      | Awaited<ReturnType<typeof assertCanAccessIntakeSession>>
      | Awaited<ReturnType<typeof assertInviteTokenAccess>>;

    if (inviteToken) {
      access = await assertInviteTokenAccess({
        intakeSessionId,
        token: inviteToken,
      });
    } else {
      const session = await getServerAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      access = await assertCanAccessIntakeSession({
        intakeSessionId,
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
      where: { id: intakeSessionId },
      select: {
        id: true,
        recaFormData: true,
        recaSupportingForms: true,
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
      ? [...formData.part_6.siblings]
      : [];

    if (!siblings[siblingIndex]) {
      return NextResponse.json(
        { error: "Sibling entry not found" },
        { status: 404 }
      );
    }

    const existingSibling = siblings[siblingIndex] as Record<string, unknown>;
    siblings[siblingIndex] = {
      ...existingSibling,
      dateOfBirth: sibling.dateOfBirth,
      cityOfBirth: sibling.cityOfBirth,
      stateOfBirth: sibling.stateOfBirth,
      currentAddress: sibling.currentAddress,
      phoneNumber: sibling.phoneNumber,
      hadNameChange: sibling.hadNameChange,
      originalLastName:
        sibling.hadNameChange === "YES" ? sibling.originalLastName : "",
      nameChangeHistory:
        sibling.hadNameChange === "YES"
          ? sibling.nameChangeHistory.filter(
              (change) =>
                change.previousName ||
                change.dateOfChange ||
                change.otherReason ||
                change.reasonForChange
            )
          : [],
    };

    const updatedFormData = {
      ...formData,
      part_6: {
        ...(formData?.part_6 || {}),
        siblings,
      },
    };

    const beneficiaryName =
      (siblings[siblingIndex]?.name as string | undefined)?.trim() || "";
    const existingBeneficiaries = Array.isArray(
      supportingForms?.survivingBeneficiariesSignatures?.beneficiaries
    )
      ? [...supportingForms.survivingBeneficiariesSignatures.beneficiaries]
      : [];
    const beneficiaryIndex = existingBeneficiaries.findIndex(
      (entry: { beneficiaryName?: string }) =>
        entry.beneficiaryName?.trim().toLowerCase() ===
        beneficiaryName.toLowerCase()
    );

    const hasBeneficiaryPayload =
      !!beneficiary &&
      !!(
        beneficiary.beneficiarySsn ||
        beneficiary.signatureDate ||
        beneficiary.signature ||
        beneficiary.attorneyName ||
        beneficiary.attorneyPhone
      );

    if (hasBeneficiaryPayload && beneficiaryName) {
      const nextEntry = {
        beneficiaryName,
        beneficiarySsn: beneficiary?.beneficiarySsn || "",
        signatureDate: beneficiary?.signatureDate || "",
        signature: beneficiary?.signature || "",
        attorneyName: beneficiary?.attorneyName || "",
        attorneyPhone: beneficiary?.attorneyPhone || "",
      };

      if (beneficiaryIndex >= 0) {
        existingBeneficiaries[beneficiaryIndex] = nextEntry;
      } else {
        existingBeneficiaries.push(nextEntry);
      }
    }

    const updatedSupportingForms = {
      ...supportingForms,
      survivingBeneficiariesSignatures: {
        ...(supportingForms?.survivingBeneficiariesSignatures || {}),
        beneficiaries: existingBeneficiaries,
      },
    };

    await db.intakeSession.update({
      where: { id: intakeSessionId },
      data: {
        recaFormData: updatedFormData,
        recaSupportingForms: updatedSupportingForms,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sibling: siblings[siblingIndex],
    });
  } catch (error) {
    return createCollaborationErrorResponse(error, "contribution");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";
import { computeFormDataDiff, deepMergeFormData } from "@/lib/reca/form-diff";
import { calculateCompletionPercentage } from "@/lib/reca/workflow";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/sessions/[sessionId]/edit
 * Admin endpoint to edit form data with full audit trail
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();

    const { formData, reason, regeneratePacket } = body;

    if (!formData || typeof formData !== "object") {
      return NextResponse.json(
        { error: "formData is required and must be an object" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "A reason with at least 10 characters is required" },
        { status: 400 }
      );
    }

    // Load current session
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentFormData =
      (intakeSession.recaFormData as Record<string, any>) || {};
    const currentSupportingForms =
      (intakeSession.recaSupportingForms as any) || {};
    const currentEligibilityData = intakeSession.recaEligibilityData as any;

    // Compute diff before merging
    const changedFields = computeFormDataDiff(currentFormData, formData);

    if (changedFields.length === 0) {
      return NextResponse.json(
        { error: "No changes detected" },
        { status: 400 }
      );
    }

    // Deep merge at part level
    const mergedFormData = deepMergeFormData(currentFormData, formData);

    // Recalculate completion
    const completionPercentage = calculateCompletionPercentage(
      mergedFormData,
      currentSupportingForms,
      currentEligibilityData
    );

    // Update the session
    const updated = await prisma.intakeSession.update({
      where: { id: sessionId },
      data: {
        recaFormData: mergedFormData,
        recaCompletionPercent: completionPercentage,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create StaffAction record
    await prisma.staffAction.create({
      data: {
        userId: session.user.id,
        intakeSessionId: sessionId,
        actionType: "EDITED_FORM_DATA",
        actionData: {
          changedFields: changedFields as any,
          reason: reason.trim(),
        },
        notes: reason.trim(),
      },
    });

    // Create AuditLog
    await createAuditLog({
      userId: session.user.id,
      action: "ADMIN_EDITED_FORM",
      resourceType: "IntakeSession",
      resourceId: sessionId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        changedFields,
        reason: reason.trim(),
        fieldsChanged: changedFields.length,
      },
    });

    // Optionally trigger packet regeneration
    let packetRegenerationStatus: "started" | "skipped" = "skipped";
    if (regeneratePacket) {
      try {
        const { generatePacketArchive } = await import(
          "@/lib/reca/packet-generator"
        );
        // Fire and forget - don't block the response
        generatePacketArchive({
          sessionId,
          initiatedByUserId: session.user.id,
          forceRegenerate: true,
        }).catch((err: Error) => {
          console.error("Packet regeneration failed:", err);
        });
        packetRegenerationStatus = "started";
      } catch (err) {
        console.error("Failed to import packet generator:", err);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: updated.id,
      completionPercentage,
      lastSaved: updated.updatedAt.toISOString(),
      changedFields,
      packetRegenerationStatus,
    });
  } catch (error) {
    console.error("Error saving admin form edit:", error);
    return NextResponse.json(
      { error: "Failed to save changes" },
      { status: 500 }
    );
  }
}

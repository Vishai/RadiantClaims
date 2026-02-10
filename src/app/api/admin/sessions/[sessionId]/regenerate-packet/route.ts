import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/sessions/[sessionId]/regenerate-packet
 * Triggers PDF packet regeneration for an intake session
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

    // Verify session exists
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Import and call packet generator
    const { generatePacketArchive } = await import(
      "@/lib/reca/packet-generator"
    );

    const result = await generatePacketArchive({
      sessionId,
      initiatedByUserId: session.user.id,
      forceRegenerate: true,
    });

    // Create StaffAction record
    await prisma.staffAction.create({
      data: {
        userId: session.user.id,
        intakeSessionId: sessionId,
        actionType: "REGENERATED_PACKET",
        notes: "Admin triggered packet regeneration",
      },
    });

    // Create AuditLog
    await createAuditLog({
      userId: session.user.id,
      action: "ADMIN_REGENERATED_PACKET",
      resourceType: "IntakeSession",
      resourceId: sessionId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        version: result?.version,
        archiveKey: result?.archiveKey,
      },
    });

    return NextResponse.json({
      success: true,
      version: result?.version,
    });
  } catch (error) {
    console.error("Error regenerating packet:", error);
    return NextResponse.json(
      { error: "Failed to regenerate packet" },
      { status: 500 }
    );
  }
}

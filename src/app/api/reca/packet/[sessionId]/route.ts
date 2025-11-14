import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePacketArchive } from "@/lib/reca/packet-generator";
import { getObject } from "@/lib/r2";
import type { PacketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getIntakeSession(sessionId: string) {
  return db.intakeSession.findUnique({
    where: { id: sessionId },
    include: {
      claimant: true,
      serviceSubscription: true,
      packetSubmission: {
        include: {
          generations: {
            orderBy: { version: "desc" },
            take: 5,
          },
        },
      },
    },
  });
}

function assertOwnership(intakeSession: any, session: any) {
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;
  if (intakeSession?.claimant?.userId === session.user.id) return true;
  if (
    intakeSession?.claimant?.email &&
    intakeSession.claimant.email === session.user.email
  ) {
    return true;
  }
  return false;
}

function ensureActiveSubscription(intakeSession: any) {
  const subscription = intakeSession?.serviceSubscription;
  if (!subscription) return false;
  if (subscription.tier === "LEGAL_REP") {
    return subscription.status !== "CANCELED";
  }
  return (
    subscription.tier === "DIY_PREP" &&
    subscription.setupFeePaid === true &&
    subscription.status === "ACTIVE"
  );
}

function mapPacketStatus(status?: PacketStatus | null) {
  switch (status) {
    case "READY":
    case "READY_TO_MAIL":
      return "READY";
    case "DELIVERED":
    case "MAILED_BY_CLIENT":
      return "READY";
    case "FAILED":
      return "FAILED";
    case "OUTDATED":
      return "OUTDATED";
    case "PENDING":
      return "PENDING";
    default:
      return "GENERATING";
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intakeSession = await getIntakeSession(params.sessionId);
    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!assertOwnership(intakeSession, authSession)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!ensureActiveSubscription(intakeSession)) {
      return NextResponse.json(
        { error: "Active subscription required to generate packet" },
        { status: 403 }
      );
    }

    const result = await generatePacketArchive({
      sessionId: params.sessionId,
      initiatedByUserId: authSession.user.id,
      forceRegenerate: true,
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      warnings: result.warnings,
      archiveKey: result.archiveKey,
      archiveSizeBytes: result.archiveSizeBytes,
      version: result.version,
      readyAt: result.readyAt,
    });
  } catch (error) {
    console.error("Packet generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate packet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intakeSession = await getIntakeSession(params.sessionId);
    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!assertOwnership(intakeSession, authSession)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!ensureActiveSubscription(intakeSession)) {
      return NextResponse.json(
        { error: "Active subscription required to download packet" },
        { status: 403 }
      );
    }

    if (!intakeSession.packetSubmission?.archiveKey) {
      await generatePacketArchive({
        sessionId: params.sessionId,
        initiatedByUserId: authSession.user.id,
        forceRegenerate: true,
      });
    }

    const packetSubmission = await db.packetSubmission.findUnique({
      where: { intakeSessionId: params.sessionId },
    });

    if (!packetSubmission?.archiveKey) {
      return NextResponse.json(
        { error: "Packet archive not available yet" },
        { status: 409 }
      );
    }

    const buffer = await getObject(packetSubmission.archiveKey);
    if (!buffer) {
      return NextResponse.json(
        { error: "Failed to download packet archive" },
        { status: 500 }
      );
    }

    await db.packetSubmission.update({
      where: { id: packetSubmission.id },
      data: {
        lastDownloadedAt: new Date(),
        downloadCount: { increment: 1 },
      },
    });

    await db.intakeSession.update({
      where: { id: params.sessionId },
      data: {
        recaFormPdfDownloaded: true,
        recaFormPdfDownloadedAt: new Date(),
        recaFormPdfDownloadCount: { increment: 1 },
      },
    });

    const subscription = intakeSession.serviceSubscription;
    const refundWarning =
      subscription?.tier === "DIY_PREP" &&
      subscription.setupFeePaid === true &&
      subscription.setupFeePaidAt &&
      Date.now() - new Date(subscription.setupFeePaidAt).getTime() <
        7 * 24 * 60 * 60 * 1000;

    const archiveBytes = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(archiveBytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${packetSubmission.archiveFileName || "radiantclaims-packet.zip"}"`,
        "Content-Length": buffer.length.toString(),
        "X-Packet-Status": mapPacketStatus(packetSubmission.status),
        ...(refundWarning ? { "X-Refund-Warning": "true" } : {}),
      },
    });
  } catch (error) {
    console.error("Packet download failed:", error);
    return NextResponse.json(
      {
        error: "Failed to download packet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

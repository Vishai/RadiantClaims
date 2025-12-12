import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/mark-pdf-downloaded
 *
 * Marks that the user has downloaded their RECA form PDF.
 * For installment plan users, this locks in their payment commitment.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sessionId from request body
    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Find user's subscription to check if they're on installment plan
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isInstallmentPlan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Find the intake session and mark PDF as downloaded
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        recaFormPdfDownloaded: true,
        recaFormPdfDownloadCount: true,
      },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: "Intake session not found" },
        { status: 404 }
      );
    }

    // Update intake session to mark PDF as downloaded
    await prisma.intakeSession.update({
      where: { id: sessionId },
      data: {
        recaFormPdfDownloaded: true,
        recaFormPdfDownloadedAt: intakeSession.recaFormPdfDownloaded
          ? undefined
          : new Date(), // Only set first download date
        recaFormPdfDownloadCount: {
          increment: 1,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PDF_DOWNLOADED",
        resourceType: "IntakeSession",
        resourceId: sessionId,
        ipAddress: request.headers.get("x-forwarded-for") || "client-side",
        metadata: JSON.stringify({
          isInstallmentPlan: subscription.isInstallmentPlan,
          downloadCount: intakeSession.recaFormPdfDownloadCount + 1,
          firstDownload: !intakeSession.recaFormPdfDownloaded,
          note:
            subscription.isInstallmentPlan &&
            !intakeSession.recaFormPdfDownloaded
              ? "Installment plan commitment locked in (first PDF download)"
              : "PDF downloaded",
        }),
      },
    });

    console.log(
      `[PDF Download] User ${session.user.id} downloaded RECA PDF for session ${sessionId}`,
      subscription.isInstallmentPlan && !intakeSession.recaFormPdfDownloaded
        ? "(Installment plan - payment commitment locked)"
        : `(download #${intakeSession.recaFormPdfDownloadCount + 1})`
    );

    return NextResponse.json({
      success: true,
      commitmentLocked:
        subscription.isInstallmentPlan && !intakeSession.recaFormPdfDownloaded,
      downloadCount: intakeSession.recaFormPdfDownloadCount + 1,
    });
  } catch (error) {
    console.error("Error marking PDF as downloaded:", error);
    return NextResponse.json(
      {
        error: "Failed to mark PDF as downloaded",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

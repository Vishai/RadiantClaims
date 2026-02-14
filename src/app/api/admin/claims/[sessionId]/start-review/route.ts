import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/claims/[sessionId]/start-review
 * Marks that staff review has started on a claim.
 *
 * This is used as the objective trigger that "legal work has started" for LEGAL_REP claims.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = (session?.user as any)?.role as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "ADMIN" && role !== "STAFF_REVIEWER" && role !== "ATTORNEY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: {
        claimant: true,
        claimReadiness: true,
        serviceSubscription: true,
      },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Record staff action as the auditable "work started" trigger
    await prisma.staffAction.create({
      data: {
        userId,
        intakeSessionId: params.sessionId,
        actionType: "STARTED_REVIEW",
        actionData: {
          triggeredByRole: role,
          tier: intakeSession.serviceSubscription?.tier ?? null,
        },
      },
    });

    // Update readiness status if present (non-destructive)
    if (intakeSession.claimReadiness) {
      await prisma.claimReadiness.update({
        where: { intakeSessionId: params.sessionId },
        data: {
          staffReviewStatus: "IN_REVIEW",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error starting review:", error);
    return NextResponse.json(
      {
        error: "Failed to start review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

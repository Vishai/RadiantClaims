import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/financial-ed/track
 *
 * Track engagement events on the What Comes Next page.
 * Updates the FinancialEdDrip record with timestamps.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { claimantId, event } = body;

    if (!claimantId || !event) {
      return NextResponse.json(
        { error: "claimantId and event are required" },
        { status: 400 }
      );
    }

    const validEvents = ["calculator_visited", "advisor_cta_clicked"] as const;
    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Verify the claimant belongs to this user
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      select: { userId: true },
    });

    if (!claimant || claimant.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, Date> = {};
    if (event === "calculator_visited") {
      updateData.calculatorVisitedAt = new Date();
    } else if (event === "advisor_cta_clicked") {
      updateData.advisorCTAClickedAt = new Date();
    }

    // Upsert — create if no drip record yet (user visited page directly)
    await db.financialEdDrip.upsert({
      where: { claimantId },
      create: {
        claimantId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking financial-ed event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

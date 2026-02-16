import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/referral-stats/[dripId]
 *
 * Update referral lifecycle for a specific drip record.
 * Used when Darin reports a consultation or conversion.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { dripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dripId } = params;
    const body = await req.json();
    const { referralStatus, estimatedAUM, referralFeeEarned, referralNotes } =
      body;

    const validStatuses = [
      "NOT_REFERRED",
      "CTA_CLICKED",
      "CONSULTATION_BOOKED",
      "CONSULTATION_COMPLETED",
      "CLIENT_CONVERTED",
      "DECLINED",
    ];

    if (referralStatus && !validStatuses.includes(referralStatus)) {
      return NextResponse.json(
        { error: "Invalid referral status" },
        { status: 400 }
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (referralStatus) {
      updateData.referralStatus = referralStatus;

      // Auto-set timestamps based on status progression
      if (referralStatus === "CONSULTATION_BOOKED") {
        updateData.consultationBookedAt = new Date();
      } else if (referralStatus === "CONSULTATION_COMPLETED") {
        updateData.consultationCompletedAt = new Date();
      } else if (referralStatus === "CLIENT_CONVERTED") {
        updateData.clientConvertedAt = new Date();
      }
    }

    if (estimatedAUM !== undefined) updateData.estimatedAUM = estimatedAUM;
    if (referralFeeEarned !== undefined)
      updateData.referralFeeEarned = referralFeeEarned;
    if (referralNotes !== undefined) updateData.referralNotes = referralNotes;

    const updated = await prisma.financialEdDrip.update({
      where: { id: dripId },
      data: updateData,
      include: {
        claimant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      referral: {
        id: updated.id,
        claimantName: `${updated.claimant.firstName} ${updated.claimant.lastName}`,
        referralStatus: updated.referralStatus,
        estimatedAUM: updated.estimatedAUM,
        referralFeeEarned: updated.referralFeeEarned,
        referralNotes: updated.referralNotes,
      },
    });
  } catch (error) {
    console.error("Error updating referral status:", error);
    return NextResponse.json(
      { error: "Failed to update referral status" },
      { status: 500 }
    );
  }
}

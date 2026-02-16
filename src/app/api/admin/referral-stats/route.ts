import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referral-stats
 *
 * Returns aggregated referral funnel metrics for the P4 Wealth partnership.
 * Admin-only endpoint.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalDrips,
      email4Sent,
      ctaClicked,
      consultationsBooked,
      consultationsCompleted,
      clientsConverted,
      declined,
      calculatorVisits,
    ] = await Promise.all([
      prisma.financialEdDrip.count(),
      prisma.financialEdDrip.count({
        where: { email4SentAt: { not: null } },
      }),
      prisma.financialEdDrip.count({
        where: { advisorCTAClickedAt: { not: null } },
      }),
      prisma.financialEdDrip.count({
        where: { referralStatus: "CONSULTATION_BOOKED" },
      }),
      prisma.financialEdDrip.count({
        where: { referralStatus: "CONSULTATION_COMPLETED" },
      }),
      prisma.financialEdDrip.count({
        where: { referralStatus: "CLIENT_CONVERTED" },
      }),
      prisma.financialEdDrip.count({
        where: { referralStatus: "DECLINED" },
      }),
      prisma.financialEdDrip.count({
        where: { calculatorVisitedAt: { not: null } },
      }),
    ]);

    // Revenue metrics
    const revenueData = await prisma.financialEdDrip.aggregate({
      where: { referralFeeEarned: { not: null } },
      _sum: { referralFeeEarned: true, estimatedAUM: true },
      _avg: { referralFeeEarned: true, estimatedAUM: true },
      _count: true,
    });

    // Click source breakdown
    const clickSources = await prisma.financialEdDrip.groupBy({
      by: ["referralClickSource"],
      where: { referralClickSource: { not: null } },
      _count: true,
    });

    // Recent referral activity (last 10 with details)
    const recentReferrals = await prisma.financialEdDrip.findMany({
      where: {
        advisorCTAClickedAt: { not: null },
      },
      select: {
        id: true,
        referralStatus: true,
        referralClickSource: true,
        advisorCTAClickedAt: true,
        consultationBookedAt: true,
        clientConvertedAt: true,
        estimatedAUM: true,
        referralFeeEarned: true,
        referralNotes: true,
        claimant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            state: true,
          },
        },
      },
      orderBy: { advisorCTAClickedAt: "desc" },
      take: 25,
    });

    return NextResponse.json({
      funnel: {
        totalInDrip: totalDrips,
        advisorEmailSent: email4Sent,
        ctaClicked,
        consultationsBooked,
        consultationsCompleted,
        clientsConverted,
        declined,
        calculatorVisits,
      },
      conversionRates: {
        emailToCTA:
          email4Sent > 0
            ? ((ctaClicked / email4Sent) * 100).toFixed(1) + "%"
            : "N/A",
        ctaToConsultation:
          ctaClicked > 0
            ? ((consultationsBooked / ctaClicked) * 100).toFixed(1) + "%"
            : "N/A",
        consultationToClient:
          consultationsCompleted > 0
            ? ((clientsConverted / consultationsCompleted) * 100).toFixed(1) +
              "%"
            : "N/A",
        overallConversion:
          email4Sent > 0
            ? ((clientsConverted / email4Sent) * 100).toFixed(1) + "%"
            : "N/A",
      },
      revenue: {
        totalFeeEarned: revenueData._sum.referralFeeEarned || 0,
        totalAUM: revenueData._sum.estimatedAUM || 0,
        avgFeePerClient: revenueData._avg.referralFeeEarned || 0,
        avgAUMPerClient: revenueData._avg.estimatedAUM || 0,
        clientsWithFees: revenueData._count,
      },
      clickSources: clickSources.map((s) => ({
        source: s.referralClickSource,
        count: s._count,
      })),
      recentReferrals,
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}

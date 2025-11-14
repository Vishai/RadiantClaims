import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date and week ago
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch user stats
    const [totalUsers, admins, customers, newUsersThisWeek] = await Promise.all(
      [
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: weekAgo,
            },
          },
        }),
      ]
    );

    // Fetch claims/intake stats
    const [
      totalIntakes,
      inProgressIntakes,
      readyForReviewIntakes,
      approvedIntakes,
      submittedThisWeek,
    ] = await Promise.all([
      prisma.intakeSession.count(),
      prisma.intakeSession.count({
        where: {
          status: {
            in: ["IN_PROGRESS", "DRAFT"],
          },
        },
      }),
      prisma.intakeSession.count({
        where: {
          status: "READY_FOR_REVIEW",
        },
      }),
      prisma.intakeSession.count({
        where: {
          status: "APPROVED",
        },
      }),
      prisma.intakeSession.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      }),
    ]);

    // Fetch AI review stats
    const [pendingValidations, needsReviewValidations, processingValidations] =
      await Promise.all([
        prisma.documentValidation.count({
          where: {
            status: "PENDING",
          },
        }),
        prisma.documentValidation.count({
          where: {
            status: "NEEDS_REVIEW",
          },
        }),
        prisma.documentValidation.count({
          where: {
            status: "PROCESSING",
          },
        }),
      ]);

    // Fetch subscription stats
    const activeSubscriptions = await prisma.serviceSubscription.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        tier: true,
        monthlyFeeAmount: true,
      },
    });

    const diyCount = activeSubscriptions.filter(
      (s) => s.tier === "DIY_PREP"
    ).length;
    const legalCount = activeSubscriptions.filter(
      (s) => s.tier === "LEGAL_REP"
    ).length;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce(
      (sum, sub) => sum + (sub.monthlyFeeAmount || 0),
      0
    );

    // Fetch waitlist stats
    const [totalWaitlist, pendingWaitlist] = await Promise.all([
      prisma.registrationWaitlist.count(),
      prisma.registrationWaitlist.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    // Fetch promo code stats
    const [activePromoCodes, allPromoCodes] = await Promise.all([
      prisma.promoCode.count({
        where: {
          isActive: true,
        },
      }),
      prisma.promoCode.findMany({
        select: {
          currentUses: true,
        },
      }),
    ]);

    const totalRedemptions = allPromoCodes.reduce(
      (sum, code) => sum + code.currentUses,
      0
    );

    // Fetch recent activity (audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      type: log.action,
      message: `${log.user?.name || log.user?.email || "System"} - ${log.action.replace(/_/g, " ").toLowerCase()}`,
      timestamp: log.createdAt.toISOString(),
    }));

    const stats = {
      users: {
        total: totalUsers,
        admins,
        customers,
        newThisWeek: newUsersThisWeek,
      },
      claims: {
        total: totalIntakes,
        inProgress: inProgressIntakes,
        readyForReview: readyForReviewIntakes,
        approved: approvedIntakes,
        submittedThisWeek,
      },
      aiReview: {
        pending: pendingValidations,
        needsReview: needsReviewValidations,
        processing: processingValidations,
      },
      subscriptions: {
        active: activeSubscriptions.length,
        diyPlan: diyCount,
        legalPlan: legalCount,
        revenue: mrr,
      },
      waitlist: {
        total: totalWaitlist,
        pending: pendingWaitlist,
      },
      promoCodes: {
        active: activePromoCodes,
        totalRedemptions,
      },
      recentActivity: formattedActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

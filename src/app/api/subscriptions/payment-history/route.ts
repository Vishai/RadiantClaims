/**
 * GET /api/subscriptions/payment-history
 *
 * Returns payment history for the current user's subscription.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 20, // Limit to last 20 payments
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({
        payments: [],
      });
    }

    return NextResponse.json({
      payments: subscription.payments,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
